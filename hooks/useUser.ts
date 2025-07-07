import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Charger l'utilisateur
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!authUser) {
          setUser(null);
          setLastUserId(null);
          return;
        }

        // Éviter de recharger si c'est le même utilisateur
        if (lastUserId === authUser.id && user) {
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) throw userError;

        const newUser = {
          id: userData.id,
          first_name: userData.first_name,
          email: userData.email,
          avatar: userData.avatar,
          avatar_initial: userData.avatar_initial,
          onboarding_complete: userData.onboarding_complete,
          has_notifications_active: userData.has_notifications_active,
          created_at: userData.created_at,
        };

        setUser(newUser);
        setLastUserId(authUser.id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLastUserId(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Éviter de recharger si c'est le même utilisateur
        if (lastUserId === session.user.id && user) {
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          setError(userError);
          return;
        }

        const newUser = {
          id: userData.id,
          first_name: userData.first_name,
          email: userData.email,
          avatar: userData.avatar,
          avatar_initial: userData.avatar_initial,
          onboarding_complete: userData.onboarding_complete,
          has_notifications_active: userData.has_notifications_active,
          created_at: userData.created_at,
        };

        setUser(newUser);
        setLastUserId(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mettre à jour l'utilisateur
  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      const { error: userError } = await supabase
        .from('User')
        .update(updates)
        .eq('id', user.id);

      if (userError) throw userError;

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    }
  };

  // Mettre à jour l'avatar
  const updateAvatar = async (avatarUri: string) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      console.log('Mise à jour de l\'avatar pour l\'utilisateur:', user.id);
      console.log('Nouvel avatar URI:', avatarUri);

      const { error: userError } = await supabase
        .from('User')
        .update({ avatar: avatarUri })
        .eq('id', user.id);

      if (userError) {
        console.error('Erreur Supabase lors de la mise à jour de l\'avatar:', userError);
        throw userError;
      }

      console.log('Avatar mis à jour avec succès dans Supabase');
      setUser(prev => prev ? { ...prev, avatar: avatarUri } : null);
    } catch (err) {
      console.error('Erreur dans updateAvatar:', err);
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      throw err; // Re-lancer l'erreur pour la gestion dans le composant
    }
  };

  return {
    user,
    loading,
    error,
    updateUser,
    updateAvatar,
  };
}
