import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WineDetailsTabs from '../components/WineDetailsTabs';
import { useSharedCave } from '../hooks/useSharedCave';
import { useUser } from '../hooks/useUser';
import { useWineHasMemories } from '../hooks/useWineHasMemories';
import { useWineHistory } from '../hooks/useWineHistory';
import { useWineHistoryForWine } from '../hooks/useWineHistoryForWine';
import { useWines } from '../hooks/useWines';
import { supabase } from '../lib/supabase';
import WineMemoriesScreen from './WineMemoriesScreen';

const { width, height } = Dimensions.get('window');

// Fonction utilitaire pour calculer la hauteur optimale des modales
const getModalHeight = (itemCount: number, hasSearch: boolean, hasAddSection: boolean, keyboardHeight: number = 0) => {
  const screenHeight = height;
  const baseHeight = 80; // Titre + header
  const searchHeight = hasSearch ? 60 : 0;
  const addSectionHeight = hasAddSection ? 140 : 0; // Augmenté pour éviter la coupure
  const itemHeight = 50; // Hauteur approximative d'un item
  const padding = 60; // Marges et padding augmentés
  
  const contentHeight = baseHeight + searchHeight + addSectionHeight + (itemCount * itemHeight) + padding;
  
  // Ajuster la hauteur maximale si le clavier est ouvert
  const availableHeight = screenHeight - keyboardHeight - 100; // 100px de marge
  const maxHeight = Math.min(screenHeight * 0.8, availableHeight);
  const minHeight = 300; // Augmenté pour s'assurer que le bouton n'est pas coupé
  
  const finalHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
  
  return finalHeight;
};

interface WineDetailsScreenWithMemoriesProps {
  wineId: string;
  viewerUserId: string;        // celui qui consulte
  contextOwnerUserId: string;  // propriétaire du vin (moi ou un ami)
  context: 'cellar' | 'wishlist' | 'tasted';
  wineData?: string;
  returnToOcr?: string;
}

export default function WineDetailsScreenWithMemories({ 
  wineId, 
  viewerUserId,
  contextOwnerUserId,
  context,
  wineData: wineDataParam,
  returnToOcr
}: WineDetailsScreenWithMemoriesProps) {
  const router = useRouter();
  const { wines, updateWine, addWineToWishlist, addWineToCellar, removeWineFromWishlist, removeWineFromCellar, fetchWines, notifyUpdate } = useWines();
  const { tastedWines, fetchTastedWines, fetchHistory, addTasting } = useWineHistory();
  const { user } = useUser();
  const { sharedCave } = useSharedCave();
  const { history: wineHistory, loading: historyLoading } = useWineHistoryForWine(wineId, user?.id || '');
  const { hasMemories, memoriesCount } = useWineHasMemories(wineId);

  // État pour la navigation par onglets
  const [activeTab, setActiveTab] = useState<'info' | 'memories'>('info');

  // Mode OCR: vin temporaire, édition locale uniquement
  const isOcrWine = wineId.startsWith('ocr-');
  const [editedWine, setEditedWine] = useState<any>(null);

  // Mode lecture pour les profils visités
  const isReadOnlyMode = contextOwnerUserId !== viewerUserId;
  const friendId = isReadOnlyMode ? contextOwnerUserId : undefined;
  const isVisitedReadOnly = isReadOnlyMode && !!friendId;

  // Origine sociale (fallback si non présent dans safeWine)
  const [sourceUserLocal, setSourceUserLocal] = useState<{ id: string; first_name?: string; avatar?: string } | undefined>(undefined);
  const [sourceFriendOrigin, setSourceFriendOrigin] = useState<'cellar' | 'wishlist' | null>(null);

  // Données du user_wine de l'ami (lecture seule)
  const [friendUW, setFriendUW] = useState<{ favorite?: boolean; rating?: number; tasting_profile?: any; personal_comment?: string | null; amount?: number; origin?: 'cellar' | 'wishlist' } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isVisitedReadOnly || !friendId || !wineId) { if (mounted) setFriendUW(null); return; }
        const { data } = await supabase
          .from('user_wine')
          .select('favorite, rating, tasting_profile, personal_comment, amount, origin')
          .eq('user_id', friendId)
          .eq('wine_id', wineId)
          .maybeSingle();
        if (!mounted) return;
        setFriendUW(data || null);
      } catch (_) {
        if (mounted) setFriendUW(null);
      }
    })();
    return () => { mounted = false; };
  }, [isVisitedReadOnly, friendId, wineId]);

  // ... (le reste du code de la fiche vin détaillée existante)
  // Pour simplifier, je vais importer le composant existant et l'adapter

  // Si on est sur l'onglet souvenirs, afficher l'écran des souvenirs
  if (activeTab === 'memories') {
    return (
      <SafeAreaView style={styles.container}>
        <WineDetailsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          memoriesCount={memoriesCount}
        />
        <WineMemoriesScreen
          wineId={wineId}
          wineName="Vin" // TODO: Récupérer le nom du vin
        />
      </SafeAreaView>
    );
  }

  // Sinon, afficher la fiche vin normale avec les onglets
  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec onglets */}
      <WineDetailsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        memoriesCount={memoriesCount}
      />
      
      {/* Contenu de la fiche vin */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Contenu de la fiche vin détaillée existante
        </Text>
        <Text style={styles.placeholderText}>
          Ici sera intégré le contenu de WineDetailsScreenV2.tsx
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
});




