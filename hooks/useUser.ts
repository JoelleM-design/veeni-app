import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Charger l'utilisateur
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!authUser) {
          setUser(null);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) throw userError;

        setUser({
          id: userData.id,
          name: userData.name,
          first_name: userData.first_name,
          email: userData.email,
          avatar: userData.avatar,
          friends: userData.friends || [],
          online: userData.online || false,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        });
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
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          setError(userError);
          return;
        }

        setUser({
          id: userData.id,
          name: userData.name,
          first_name: userData.first_name,
          email: userData.email,
          avatar: userData.avatar,
          friends: userData.friends || [],
          online: userData.online || false,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        });
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

      const { error: userError } = await supabase
        .from('User')
        .update({ avatar: avatarUri })
        .eq('id', user.id);

      if (userError) throw userError;

      setUser(prev => prev ? { ...prev, avatar: avatarUri } : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    }
  };

  // Ajouter un ami par email
  const addFriend = async (friendEmail: string) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      // Vérifier que l'email n'est pas celui de l'utilisateur actuel
      if (friendEmail.toLowerCase() === user.email.toLowerCase()) {
        throw new Error('Vous ne pouvez pas vous ajouter vous-même comme ami');
      }

      // Rechercher l'utilisateur par email
      const { data: friendData, error: friendError } = await supabase
        .from('User')
        .select('id, email')
        .eq('email', friendEmail.toLowerCase())
        .single();

      if (friendError || !friendData) {
        throw new Error('Aucun utilisateur trouvé avec cet email');
      }

      // Vérifier que l'ami n'est pas déjà dans la liste
      if (user.friends.includes(friendData.id)) {
        throw new Error('Cet utilisateur est déjà votre ami');
      }

      // Ajouter l'ami à la liste
      const newFriendsList = [...user.friends, friendData.id];
      const { error: updateError } = await supabase
        .from('User')
        .update({ friends: newFriendsList })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser(prev => prev ? { ...prev, friends: newFriendsList } : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      throw err; // Re-lancer l'erreur pour la gestion dans le composant
    }
  };

  // Supprimer un ami
  const removeFriend = async (friendId: string) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      const newFriendsList = user.friends.filter(id => id !== friendId);
      const { error: updateError } = await supabase
        .from('User')
        .update({ friends: newFriendsList })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser(prev => prev ? { ...prev, friends: newFriendsList } : null);
    } catch (err) {
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
    addFriend,
    removeFriend,
  };
}
