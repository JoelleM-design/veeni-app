import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';
import { useUserProfiles } from './useUserProfiles';

interface WineWithMemory {
  wine: Wine;
  memory: {
    id: string;
    user_id: string;
    text?: string;
    photo_urls: string[];
    friends_tagged: string[];
    location_text?: string;
    created_at: string;
    updated_at: string;
    user?: {
      id: string;
      first_name?: string;
      avatar?: string;
    };
  };
  isCreator: boolean; // true si l'utilisateur a créé ce souvenir
  isMentioned: boolean; // true si l'utilisateur est mentionné dans ce souvenir
}

export function useWinesWithMemories(userId: string | null, viewerId?: string) {
  const [winesWithMemories, setWinesWithMemories] = useState<WineWithMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);
  
  // Récupérer les profils utilisateur
  const { userProfiles, getUserProfile } = useUserProfiles(userIds);

  useEffect(() => {
    if (!userId) {
      setWinesWithMemories([]);
      setLoading(false);
      return;
    }

    const fetchWinesWithMemories = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Récupération des vins avec souvenirs pour user_id:', userId);

        // Récupérer tous les souvenirs visibles (les miens + ceux de mes amis)
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('wine_memories')
          .select(`
            id,
            wine_id,
            user_id,
            text,
            photo_urls,
            friends_tagged,
            location_text,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });

        if (memoriesError) {
          throw memoriesError;
        }

        // Filtrer les souvenirs pertinents pour cet utilisateur
        const relevantMemories = memoriesData?.filter(memory => {
          // Souvenirs créés par l'utilisateur
          if (memory.user_id === userId) return true;
          
          // Souvenirs où l'utilisateur est mentionné
          if (memory.friends_tagged && Array.isArray(memory.friends_tagged)) {
            return memory.friends_tagged.includes(userId);
          }
          
          return false;
        }) || [];

        console.log('🔍 Souvenirs pertinents trouvés:', relevantMemories.length);

        // Extraire tous les user_id uniques pour récupérer les profils
        const uniqueUserIds = [...new Set(relevantMemories.map(memory => memory.user_id))];
        setUserIds(uniqueUserIds);

        // Récupérer les détails des vins pour chaque souvenir
        const winesWithMemoriesData: WineWithMemory[] = [];

        for (const memory of relevantMemories) {
          // Récupérer les détails du vin
          const { data: wineData, error: wineError } = await supabase
            .from('wine')
            .select(`
              id,
              name,
              year,
              wine_type,
              price_range,
              region,
              description,
              strength,
              tannins,
              sugar,
              acidity,
              optimal_conso_date,
              image_uri,
              producer_id,
              country_id,
              designation_id,
              grapes,
              producer:producer_id(
                id,
                name
              ),
              country:country_id(
                id,
                name,
                flag_emoji
              ),
              designation:designation_id(
                id,
                name
              )
            `)
            .eq('id', memory.wine_id)
            .single();

          if (wineError) {
            console.error('❌ Erreur récupération vin:', wineError);
            continue;
          }

          // Transformer les données du vin
          const wine: Wine = {
            id: wineData.id,
            name: wineData.name,
            domaine: wineData.producer?.name || '',
            vintage: wineData.year || '',
            wineType: wineData.wine_type,
            country: wineData.country?.name || '',
            countryName: wineData.country?.name || '',
            flag_emoji: wineData.country?.flag_emoji || '',
            appellation: wineData.designation?.name || '',
            grapes: wineData.grapes || [],
            imageUri: wineData.image_uri,
            description: wineData.description,
            stock: 0, // Pas de stock dans ce contexte
            favorite: false, // Pas de favori dans ce contexte
            personalComment: '',
            rating: 0,
            tastingProfile: [],
            origin: 'cellar', // Par défaut
            user_wine_id: '', // Pas d'user_wine_id dans ce contexte
          };

          // Récupérer le profil utilisateur pour ce souvenir
          const userProfile = getUserProfile(memory.user_id);

          winesWithMemoriesData.push({
            wine,
            memory: {
              id: memory.id,
              user_id: memory.user_id,
              text: memory.text,
              photo_urls: memory.photo_urls || [],
              friends_tagged: memory.friends_tagged || [],
              location_text: memory.location_text,
              created_at: memory.created_at,
              updated_at: memory.updated_at,
              user: userProfile,
            },
            isCreator: memory.user_id === userId,
            isMentioned: memory.friends_tagged?.includes(userId) || false,
          });
        }

        console.log('✅ Vins avec souvenirs récupérés:', winesWithMemoriesData.length);
        setWinesWithMemories(winesWithMemoriesData);

      } catch (err) {
        console.error('❌ Erreur lors de la récupération des vins avec souvenirs:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchWinesWithMemories();
  }, [userId, viewerId]);

  // Mettre à jour les vins avec souvenirs quand les profils utilisateur sont chargés
  useEffect(() => {
    if (winesWithMemories.length > 0 && Object.keys(userProfiles).length > 0) {
      const updatedWinesWithMemories = winesWithMemories.map(wineWithMemory => ({
        ...wineWithMemory,
        memory: {
          ...wineWithMemory.memory,
          user: getUserProfile(wineWithMemory.memory.user_id)
        }
      }));
      setWinesWithMemories(updatedWinesWithMemories);
    }
  }, [userProfiles, winesWithMemories.length]);

  return {
    winesWithMemories,
    loading,
    error,
    refetch: () => {
      if (userId) {
        setWinesWithMemories([]);
        // Le useEffect se déclenchera automatiquement
      }
    }
  };
}
