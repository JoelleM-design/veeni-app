import { useCallback, useEffect, useRef, useState } from 'react';
import { getMemoriesStore, setMemoriesStore, subscribeMemories } from '../lib/memoriesStore';
import { supabase } from '../lib/supabase';
import { CreateWineMemoryData, UpdateWineMemoryData, WineMemory } from '../types/memory';

export function useWineMemoriesOptimized(wineId: string) {
  const [memories, setMemories] = useState<WineMemory[]>(getMemoriesStore().filter(m => m.wine_id === wineId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updateCallbacks, setUpdateCallbacks] = useState<(() => void)[]>([]);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Fonction pour s'abonner aux mises à jour
  const subscribeToUpdates = useCallback((callback: () => void) => {
    setUpdateCallbacks(prev => [...prev, callback]);
    return () => {
      setUpdateCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Fonction pour notifier tous les abonnés
  const notifyUpdate = useCallback(() => {
    updateCallbacks.forEach(callback => callback());
  }, [updateCallbacks]);

  // Sync local state with global store
  useEffect(() => {
    const unsub = subscribeMemories((next) => {
      const wineMemories = next.filter(m => m.wine_id === wineId);
      setMemories(wineMemories);
    });
    return () => { unsub(); };
  }, [wineId]);

  // Charger les souvenirs depuis le cache local d'abord
  useEffect(() => {
    const cachedMemories = getMemoriesStore().filter(m => m.wine_id === wineId);
    if (cachedMemories.length > 0) {
      setMemories(cachedMemories);
      setLoading(false);
      return; // Sortir immédiatement si on a des données en cache
    }
    
    // Si pas de cache, charger depuis le serveur
    fetchMemories();
  }, [wineId]);

  const fetchMemories = async () => {
    const now = Date.now();
    if (isFetchingRef.current) return;
    if (now - lastFetchRef.current < 1000) return; // throttle 1s
    isFetchingRef.current = true;
    lastFetchRef.current = now;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMemories([]);
        setLoading(false);
        return;
      }

      console.log('🔄 Récupération des souvenirs pour le vin:', wineId);

      // Requête simple sans join pour éviter l'erreur PGRST200
      const { data, error } = await supabase
        .from('wine_memories')
        .select('*')
        .eq('wine_id', wineId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Traitement simplifié des données - pas de user data pour l'instant
      const memoriesWithUsers = (data || []).map(memory => ({
        ...memory,
        user: { id: memory.user_id, first_name: 'Utilisateur', avatar: null }
      }));

      // Mettre à jour le cache global
      const allMemories = getMemoriesStore();
      const otherMemories = allMemories.filter(m => m.wine_id !== wineId);
      const newMemories = [...otherMemories, ...memoriesWithUsers];
      setMemoriesStore(newMemories);

      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des souvenirs:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Charger les souvenirs au montage seulement si pas de cache
  useEffect(() => {
    const cachedMemories = getMemoriesStore().filter(m => m.wine_id === wineId);
    if (cachedMemories.length === 0) {
      fetchMemories();
    }
  }, [wineId]);

  const createMemory = async (memoryData: CreateWineMemoryData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('wine_memories')
        .insert({
          ...memoryData,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      // Récupérer les informations utilisateur
      let memoryWithUser = data;
      try {
        const { data: userData } = await supabase
          .from('User')
          .select('id, first_name, avatar')
          .eq('id', data.user_id)
          .single();
        
        memoryWithUser = {
          ...data,
          user: userData || { id: data.user_id, first_name: 'Utilisateur', avatar: null }
        };
      } catch {
        memoryWithUser = {
          ...data,
          user: { id: data.user_id, first_name: 'Utilisateur', avatar: null }
        };
      }

      // Mise à jour optimiste du cache
      const allMemories = getMemoriesStore();
      const newMemories = [memoryWithUser, ...allMemories];
      setMemoriesStore(newMemories);

      notifyUpdate();
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
        .select('*');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Aucun souvenir trouvé avec cet ID');
      }

      // Récupérer les informations utilisateur
      let memoryWithUser = data[0];
      try {
        const { data: userData } = await supabase
          .from('User')
          .select('id, first_name, avatar')
          .eq('id', data[0].user_id)
          .single();
        
        memoryWithUser = {
          ...data[0],
          user: userData || { id: data[0].user_id, first_name: 'Utilisateur', avatar: null }
        };
      } catch {
        memoryWithUser = {
          ...data[0],
          user: { id: data[0].user_id, first_name: 'Utilisateur', avatar: null }
        };
      }

      // Mise à jour optimiste du cache
      const allMemories = getMemoriesStore();
      const updatedMemories = allMemories.map(m => 
        m.id === memoryId ? memoryWithUser : m
      );
      setMemoriesStore(updatedMemories);

      notifyUpdate();
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

      // Mise à jour optimiste du cache
      const allMemories = getMemoriesStore();
      const filteredMemories = allMemories.filter(m => m.id !== memoryId);
      setMemoriesStore(filteredMemories);

      notifyUpdate();
    } catch (err) {
      console.error('Erreur lors de la suppression du souvenir:', err);
      throw err;
    }
  };

  return {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    fetchMemories,
    notifyUpdate,
    subscribeToUpdates
  };
}
