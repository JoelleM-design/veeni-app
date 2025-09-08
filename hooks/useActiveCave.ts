import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

export interface ActiveCave {
  caveMode: 'user' | 'household';
  caveId: string;
  isShared: boolean;
  householdName?: string;
}

export function useActiveCave() {
  const { user } = useUser();
  const [activeCave, setActiveCave] = useState<ActiveCave>({
    caveMode: 'user',
    caveId: '',
    isShared: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function determineActiveCave() {
      if (!user?.id) {
        setActiveCave({
          caveMode: 'user',
          caveId: '',
          isShared: false
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Vérifier si l'utilisateur est dans un household
        const { data: userHousehold, error: householdError } = await supabase
          .from('user_household')
          .select(`
            household_id,
            households (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (householdError && householdError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, ce qui est normal si pas de household
          throw householdError;
        }

        if (userHousehold && userHousehold.households) {
          // L'utilisateur est dans un household
          setActiveCave({
            caveMode: 'household',
            caveId: userHousehold.household_id,
            isShared: true,
            householdName: userHousehold.households.name
          });
        } else {
          // L'utilisateur est en mode individuel
          setActiveCave({
            caveMode: 'user',
            caveId: user.id,
            isShared: false
          });
        }
      } catch (err) {
        console.error('Erreur lors de la détermination de la cave active:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        // En cas d'erreur, revenir au mode utilisateur
        setActiveCave({
          caveMode: 'user',
          caveId: user.id,
          isShared: false
        });
      } finally {
        setLoading(false);
      }
    }

    determineActiveCave();
  }, [user?.id]);

  // Fonction pour forcer le rafraîchissement (utile après join/leave household)
  const refreshActiveCave = async () => {
    if (user?.id) {
      await determineActiveCave();
    }
  };

  return {
    ...activeCave,
    loading,
    error,
    refreshActiveCave
  };
}
