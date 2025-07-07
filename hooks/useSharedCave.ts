import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

export interface SharedCave {
  id: string;
  owner_id: string;
  partner_id: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface SharedCaveWithUsers extends SharedCave {
  // Pour l'instant, nous ne récupérons que les IDs
  // Les emails seront récupérés séparément si nécessaire
}

export const useSharedCave = () => {
  const { user } = useUser();
  const [sharedCave, setSharedCave] = useState<any | null>(null); // any pour ajouter les prénoms
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la cave partagée de l'utilisateur
  const fetchSharedCave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Rechercher si l'utilisateur est propriétaire d'une cave
      const { data: ownerCave, error: ownerError } = await supabase
        .from('shared_caves')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (ownerError && ownerError.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération de la cave propriétaire:', ownerError);
        setError(ownerError.message);
        return;
      }

      if (ownerCave) {
        // Si la cave a un partenaire, récupérer son prénom
        let partner_first_name = '';
        if (ownerCave.partner_id) {
          const { data: partner, error: partnerError } = await supabase
            .from('User')
            .select('first_name')
            .eq('id', ownerCave.partner_id)
            .single();
          if (!partnerError && partner) {
            partner_first_name = partner.first_name;
          }
        }
        setSharedCave({ ...ownerCave, partner_first_name });
        return;
      }

      // Rechercher si l'utilisateur est partenaire d'une cave
      const { data: partnerCave, error: partnerError } = await supabase
        .from('shared_caves')
        .select('*')
        .eq('partner_id', user.id)
        .single();

      if (partnerError && partnerError.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération de la cave partenaire:', partnerError);
        setError(partnerError.message);
        return;
      }

      if (partnerCave) {
        // Récupérer le prénom du propriétaire
        let owner_first_name = '';
        if (partnerCave.owner_id) {
          const { data: owner, error: ownerError2 } = await supabase
            .from('User')
            .select('first_name')
            .eq('id', partnerCave.owner_id)
            .single();
          if (!ownerError2 && owner) {
            owner_first_name = owner.first_name;
          }
        }
        setSharedCave({ ...partnerCave, owner_first_name });
        return;
      }

      // Aucune cave trouvée
      setSharedCave(null);
    } catch (err) {
      console.error('Erreur lors de la récupération de la cave partagée:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer l'email d'un utilisateur
  const getUserEmail = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération de l\'email:', error);
        return 'Email inconnu';
      }

      return data?.email || 'Email inconnu';
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'email:', err);
      return 'Email inconnu';
    }
  };

  // Créer une nouvelle cave partagée
  const createSharedCave = async () => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Générer un code d'invitation unique
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('shared_caves')
        .insert({
          owner_id: user.id,
          invite_code: inviteCode
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la cave partagée:', error);
        throw new Error(error.message);
      }

      setSharedCave(data);
      return data;
    } catch (err) {
      console.error('Erreur lors de la création de la cave partagée:', err);
      throw err;
    }
  };

  // Rejoindre une cave partagée
  const joinSharedCave = async (code: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Vérifier si le code existe et si la cave n'est pas pleine
      const { data: existingCave, error: fetchError } = await supabase
        .from('shared_caves')
        .select('*')
        .eq('invite_code', code)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Code d\'invitation invalide');
        }
        throw new Error(fetchError.message);
      }

      if (!existingCave) {
        throw new Error('Code d\'invitation invalide');
      }

      if (existingCave.partner_id) {
        throw new Error('Cette cave partagée est déjà complète');
      }

      if (existingCave.owner_id === user.id) {
        throw new Error('Vous ne pouvez pas rejoindre votre propre cave');
      }

      // Mettre à jour la cave avec le partenaire
      const { data, error } = await supabase
        .from('shared_caves')
        .update({ partner_id: user.id })
        .eq('id', existingCave.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la jonction de la cave partagée:', error);
        throw new Error(error.message);
      }

      setSharedCave(data);
      return data;
    } catch (err) {
      console.error('Erreur lors de la jonction de la cave partagée:', err);
      throw err;
    }
  };

  // Retirer le partenaire (propriétaire seulement)
  const removePartner = async () => {
    if (!user || !sharedCave || user.id !== sharedCave.owner_id) {
      throw new Error('Action non autorisée');
    }

    try {
      const { data, error } = await supabase
        .from('shared_caves')
        .update({ partner_id: null })
        .eq('id', sharedCave.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors du retrait du partenaire:', error);
        throw new Error(error.message);
      }

      setSharedCave(data);
      return data;
    } catch (err) {
      console.error('Erreur lors du retrait du partenaire:', err);
      throw err;
    }
  };

  // Quitter la cave partagée (partenaire seulement)
  const leaveSharedCave = async () => {
    if (!user || !sharedCave || user.id !== sharedCave.partner_id) {
      throw new Error('Action non autorisée');
    }

    try {
      const { data, error } = await supabase
        .from('shared_caves')
        .update({ partner_id: null })
        .eq('id', sharedCave.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la sortie de la cave partagée:', error);
        throw new Error(error.message);
      }

      setSharedCave(null);
      return data;
    } catch (err) {
      console.error('Erreur lors de la sortie de la cave partagée:', err);
      throw err;
    }
  };

  // Supprimer la cave partagée (propriétaire seulement)
  const deleteSharedCave = async () => {
    if (!user || !sharedCave || user.id !== sharedCave.owner_id) {
      throw new Error('Action non autorisée');
    }

    try {
      const { error } = await supabase
        .from('shared_caves')
        .delete()
        .eq('id', sharedCave.id);

      if (error) {
        console.error('Erreur lors de la suppression de la cave partagée:', error);
        throw new Error(error.message);
      }

      setSharedCave(null);
    } catch (err) {
      console.error('Erreur lors de la suppression de la cave partagée:', err);
      throw err;
    }
  };

  // Déterminer le rôle de l'utilisateur
  const userRole = sharedCave ? (user?.id === sharedCave.owner_id ? 'owner' : 'partner') : null;

  // Déterminer l'état de la cave
  const caveState = sharedCave 
    ? (sharedCave.partner_id ? 'shared' : 'owner_only')
    : 'none';

  // Rafraîchir les données
  const refresh = () => {
    fetchSharedCave();
  };

  useEffect(() => {
    fetchSharedCave();
  }, [user]);

  return {
    sharedCave,
    loading,
    error,
    userRole,
    caveState,
    createSharedCave,
    joinSharedCave,
    removePartner,
    leaveSharedCave,
    deleteSharedCave,
    getUserEmail,
    refresh
  };
}; 