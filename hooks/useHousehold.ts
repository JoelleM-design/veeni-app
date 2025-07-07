import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Household {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  user_id: string;
  household_id: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    email: string;
    avatar?: string;
  };
}

export function useHousehold() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Charger la household de l'utilisateur connecté
  useEffect(() => {
    async function loadHousehold() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          setHousehold(null);
          setHouseholdId(null);
          setMembers([]);
          return;
        }

        // Récupérer l'association user_household
        const { data: userHousehold, error: userHouseholdError } = await supabase
          .from('user_household')
          .select(`
            household_id,
            households (
              id,
              name,
              join_code,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (userHouseholdError) {
          console.error('Erreur lors de la récupération de la household:', userHouseholdError);
          // L'utilisateur n'a peut-être pas encore de household (migration en cours)
          setHousehold(null);
          setHouseholdId(null);
          setMembers([]);
          return;
        }

        if (userHousehold && userHousehold.households) {
          setHousehold(userHousehold.households);
          setHouseholdId(userHousehold.household_id);
          
          // Récupérer les membres de la household
          await loadHouseholdMembers(userHousehold.household_id);
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la household:', err);
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      } finally {
        setLoading(false);
      }
    }

    loadHousehold();
  }, []);

  // Charger les membres d'une household
  const loadHouseholdMembers = async (householdId: string) => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('user_household')
        .select(`
          user_id,
          household_id,
          created_at,
          "User"!user_household_user_id_fkey (
            id,
            first_name,
            email
          )
        `)
        .eq('household_id', householdId);

      if (membersError) throw membersError;

      // Transformer les données pour correspondre à l'interface
      const transformedMembers = (membersData || []).map(member => ({
        user_id: member.user_id,
        household_id: member.household_id,
        created_at: member.created_at,
        user: member.User
      }));

      setMembers(transformedMembers);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des membres'));
    }
  };

  // Rejoindre une household avec un code
  const joinHousehold = async (joinCode: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Utilisateur non connecté');

      // Vérifier que l'utilisateur n'est pas déjà dans une household
      if (householdId) {
        throw new Error('Vous êtes déjà membre d\'une cave partagée');
      }

      // Trouver la household avec le code
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (householdError || !householdData) {
        throw new Error('Code d\'invitation invalide');
      }

      // Rejoindre la household
      const { error: joinError } = await supabase
        .from('user_household')
        .insert({
          user_id: user.id,
          household_id: householdData.id
        });

      if (joinError) throw joinError;

      // Recharger les données
      setHousehold(householdData);
      setHouseholdId(householdData.id);
      await loadHouseholdMembers(householdData.id);

      return householdData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la jointure'));
      throw err;
    }
  };

  // Créer une nouvelle household
  const createHousehold = async (name: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Utilisateur non connecté');

      // Vérifier que l'utilisateur n'est pas déjà dans une household
      if (householdId) {
        throw new Error('Vous êtes déjà membre d\'une cave partagée');
      }

      // Générer un code d'invitation unique
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Créer la household
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          join_code: joinCode
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Associer l'utilisateur à la household
      const { error: joinError } = await supabase
        .from('user_household')
        .insert({
          user_id: user.id,
          household_id: householdData.id
        });

      if (joinError) throw joinError;

      // Recharger les données
      setHousehold(householdData);
      setHouseholdId(householdData.id);
      await loadHouseholdMembers(householdData.id);

      return householdData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la création'));
      throw err;
    }
  };

  // Quitter la household actuelle
  const leaveHousehold = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Utilisateur non connecté');

      if (!householdId) {
        throw new Error('Vous n\'êtes membre d\'aucune cave partagée');
      }

      // Supprimer l'association user_household
      const { error: leaveError } = await supabase
        .from('user_household')
        .delete()
        .eq('user_id', user.id)
        .eq('household_id', householdId);

      if (leaveError) throw leaveError;

      // Réinitialiser l'état
      setHousehold(null);
      setHouseholdId(null);
      setMembers([]);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la sortie'));
      throw err;
    }
  };

  // Mettre à jour le nom de la household
  const updateHouseholdName = async (newName: string) => {
    try {
      if (!householdId) throw new Error('Aucune cave partagée trouvée');

      const { data: updatedHousehold, error: updateError } = await supabase
        .from('households')
        .update({ name: newName })
        .eq('id', householdId)
        .select()
        .single();

      if (updateError) throw updateError;

      setHousehold(updatedHousehold);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
      throw err;
    }
  };

  // Régénérer le code d'invitation
  const regenerateJoinCode = async () => {
    try {
      if (!householdId) throw new Error('Aucune cave partagée trouvée');

      const newJoinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: updatedHousehold, error: updateError } = await supabase
        .from('households')
        .update({ join_code: newJoinCode })
        .eq('id', householdId)
        .select()
        .single();

      if (updateError) throw updateError;

      setHousehold(updatedHousehold);
      return updatedHousehold;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la régénération du code'));
      throw err;
    }
  };

  return {
    household,
    householdId,
    members,
    loading,
    error,
    joinHousehold,
    createHousehold,
    leaveHousehold,
    updateHouseholdName,
    regenerateJoinCode,
    loadHouseholdMembers,
  };
} 