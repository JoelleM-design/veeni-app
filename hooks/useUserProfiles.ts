import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  first_name?: string;
  avatar?: string;
}

export function useUserProfiles(userIds: string[]) {
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userIds.length === 0) {
      setUserProfiles({});
      return;
    }

    const fetchUserProfiles = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Récupération des profils utilisateur pour:', userIds);

        // Récupérer les profils utilisateur depuis auth.users via une fonction RPC
        // ou utiliser une table public.users si elle existe
        const { data: profilesData, error: profilesError } = await supabase
          .from('User')
          .select('id, first_name, avatar')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Erreur récupération profils:', profilesError);
          // Fallback: créer des profils basiques avec juste l'ID
          const fallbackProfiles: Record<string, UserProfile> = {};
          userIds.forEach(id => {
            fallbackProfiles[id] = {
              id,
              first_name: 'Utilisateur',
              avatar: undefined
            };
          });
          setUserProfiles(fallbackProfiles);
          return;
        }

        // Transformer en objet pour un accès rapide
        const profilesMap: Record<string, UserProfile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = {
            id: profile.id,
            first_name: profile.first_name,
            avatar: profile.avatar
          };
        });

        // Ajouter les profils manquants avec des valeurs par défaut
        userIds.forEach(id => {
          if (!profilesMap[id]) {
            profilesMap[id] = {
              id,
              first_name: 'Utilisateur',
              avatar: undefined
            };
          }
        });

        console.log('✅ Profils utilisateur récupérés:', Object.keys(profilesMap).length);
        setUserProfiles(profilesMap);

      } catch (err) {
        console.error('❌ Erreur lors de la récupération des profils:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        
        // Fallback en cas d'erreur
        const fallbackProfiles: Record<string, UserProfile> = {};
        userIds.forEach(id => {
          fallbackProfiles[id] = {
            id,
            first_name: 'Utilisateur',
            avatar: undefined
          };
        });
        setUserProfiles(fallbackProfiles);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfiles();
  }, [userIds.join(',')]); // Dépendance basée sur la liste des IDs

  return {
    userProfiles,
    loading,
    error,
    getUserProfile: (userId: string) => userProfiles[userId] || {
      id: userId,
      first_name: 'Utilisateur',
      avatar: undefined
    }
  };
}


