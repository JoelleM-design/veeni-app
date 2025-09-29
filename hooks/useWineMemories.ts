import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CreateWineMemoryData, UpdateWineMemoryData, WineMemory } from '../types/memory';

export function useWineMemories(wineId: string | null) {
  const [memories, setMemories] = useState<WineMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = async () => {
    if (!wineId) {
      setMemories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;

      // Récupérer les souvenirs avec les données jointes
      const { data, error: fetchError } = await supabase
        .from('wine_memories')
        .select(`
          *,
          likes:wine_memory_likes(count)
        `)
        .eq('wine_id', wineId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Récupérer les informations utilisateur pour chaque souvenir
      const processedMemories = await Promise.all((data || []).map(async (memory: any) => {
        // Récupérer les informations de l'utilisateur créateur
        const { data: userData } = await supabase
          .from('User')
          .select('id, first_name, avatar')
          .eq('id', memory.user_id)
          .single();

        // Récupérer les likes détaillés pour vérifier si l'utilisateur actuel a liké
        const { data: likesData } = await supabase
          .from('wine_memory_likes')
          .select('user_id')
          .eq('memory_id', memory.id);

        return {
          ...memory,
          user: userData || { id: memory.user_id, first_name: 'Utilisateur', avatar: null },
          likes_count: memory.likes?.[0]?.count || 0,
          has_liked: likesData?.some((like: any) => like.user_id === currentUserId) || false,
          friends_tagged: memory.friends_tagged || []
        };
      }));

      setMemories(processedMemories);
    } catch (err) {
      console.error('Erreur lors de la récupération des souvenirs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createMemory = async (memoryData: CreateWineMemoryData) => {
    try {
      // Récupérer l'utilisateur actuel pour s'assurer qu'il est authentifié
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('User not authenticated');
      }

      // S'assurer que user_id correspond à l'utilisateur authentifié
      const memoryDataWithAuth = {
        ...memoryData,
        user_id: userData.user.id
      };

      const { data, error } = await supabase
        .from('wine_memories')
        .insert([memoryDataWithAuth])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchMemories();
      return data;
    } catch (err) {
      console.error('Erreur lors de la création du souvenir:', err);
      throw err;
    }
  };

  const updateMemory = async (memoryId: string, memoryData: UpdateWineMemoryData) => {
    try {
      const { data, error } = await supabase
        .from('wine_memories')
        .update(memoryData)
        .eq('id', memoryId)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Aucun souvenir trouvé avec cet ID');
      }

      // Rafraîchir la liste
      await fetchMemories();
      return data[0];
    } catch (err) {
      console.error('Erreur lors de la mise à jour du souvenir:', err);
      throw err;
    }
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('wine_memories')
        .delete()
        .eq('id', memoryId);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchMemories();
    } catch (err) {
      console.error('Erreur lors de la suppression du souvenir:', err);
      throw err;
    }
  };

  const toggleLike = async (memoryId: string) => {
    try {
      // Vérifier si l'utilisateur a déjà liké
      const { data: existingLike } = await supabase
        .from('wine_memory_likes')
        .select('id')
        .eq('memory_id', memoryId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (existingLike) {
        // Supprimer le like
        const { error } = await supabase
          .from('wine_memory_likes')
          .delete()
          .eq('memory_id', memoryId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
      } else {
        // Ajouter le like
        const { error } = await supabase
          .from('wine_memory_likes')
          .insert([{
            memory_id: memoryId,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (error) throw error;
      }

      // Rafraîchir la liste
      await fetchMemories();
    } catch (err) {
      console.error('Erreur lors du toggle du like:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [wineId]);

  return {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    toggleLike,
    refreshMemories: fetchMemories
  };
}
