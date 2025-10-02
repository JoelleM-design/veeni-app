import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TastingNoteModal } from '../components/TastingNoteModal';
import WineDetailsTabs from '../components/WineDetailsTabs';
import { VeeniColors } from '../constants/Colors';
import { useFriendWines } from '../hooks/useFriendWines';
import { useSharedCave } from '../hooks/useSharedCave';
import { useUser } from '../hooks/useUser';
import { useWineHasMemories } from '../hooks/useWineHasMemories';
import { useWineHistory } from '../hooks/useWineHistory';
import { useWineHistoryForWine } from '../hooks/useWineHistoryForWine';
import { useWines } from '../hooks/useWines';
import { buildSocialData, SocialData } from '../lib/buildSocialData';
import { supabase } from '../lib/supabase';
import WineMemoriesScreenV2 from './WineMemoriesScreenV2';

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
  // Debug log removed to avoid noisy renders
  
  return finalHeight;
};

interface WineDetailsScreenV2Props {
  wineId: string;
  viewerUserId: string;        // celui qui consulte
  contextOwnerUserId: string;  // propriétaire du vin (moi ou un ami)
  context: 'cellar' | 'wishlist' | 'tasted' | 'friend';
  wineData?: string;
  returnToOcr?: string;
}

export default function WineDetailsScreenV2({ 
  wineId, 
  viewerUserId,
  contextOwnerUserId,
  context,
  wineData: wineDataParam,
  returnToOcr
}: WineDetailsScreenV2Props) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  
  // Mode lecture pour les profils visités
  const isReadOnlyMode = contextOwnerUserId !== viewerUserId;
  const friendId = isReadOnlyMode ? contextOwnerUserId : undefined;
  const isVisitedReadOnly = isReadOnlyMode && !!friendId;

  const { wines, updateWine, addWineToWishlist, addWineToCellar, removeWineFromWishlist, removeWineFromCellar, fetchWines, notifyUpdate } = useWines();
  const { tastedWines, fetchTastedWines, fetchHistory, addTasting } = useWineHistory();
  
  // Récupérer les vins de l'ami si on est en mode lecture seule
  const { wines: friendWines, tastedWines: friendTastedWines, loading: friendWinesLoading } = useFriendWines(isVisitedReadOnly ? friendId : null);
  const { sharedCave } = useSharedCave();
  const { history: wineHistory, loading: historyLoading } = useWineHistoryForWine(wineId, user?.id || '');
  const { hasMemories, memoriesCount } = useWineHasMemories(wineId);

  // État pour la navigation par onglets
  const [activeTab, setActiveTab] = useState<'info' | 'memories'>('info');
  
  // Lire le paramètre tab de la navigation
  const initialTab = params.tab as 'info' | 'memories' | undefined;
  
  // Gérer l'onglet initial et les contraintes de mode lecture seule
  useEffect(() => {
    if (initialTab && (initialTab === 'info' || initialTab === 'memories')) {
      // Si on a un paramètre tab valide, l'utiliser
      if (initialTab === 'memories' && (!isVisitedReadOnly || hasMemories)) {
        setActiveTab('memories');
      } else if (initialTab === 'info') {
        setActiveTab('info');
      }
    } else if (isVisitedReadOnly && !hasMemories) {
      // En mode lecture seule sans souvenirs, forcer l'onglet 'info'
      setActiveTab('info');
    }
  }, [initialTab, isVisitedReadOnly, hasMemories]);

  // Mode OCR: vin temporaire, édition locale uniquement
  const isOcrWine = wineId.startsWith('ocr-');
  const [editedWine, setEditedWine] = useState<any>(null);

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

  // Créer une liste combinée de tous les vins (cave + wishlist + dégustés), mémoïsée
  const allWines = useMemo(() => {
    // Si on est en mode lecture seule, utiliser les vins de l'ami
    if (isVisitedReadOnly) {
      const friendWinesList = [
        ...friendWines,
        ...friendTastedWines.map((entry) => ({
          ...entry.wine,
          lastTastedAt: entry.lastTastedAt,
          tastingCount: entry.tastingCount,
          origin: 'tasted',
        })),
      ];
      
      // Si on accède via l'onglet souvenirs, ajouter aussi les vins du viewer (pour les souvenirs partagés)
      if (activeTab === 'memories') {
        return [
          ...friendWinesList,
          ...wines,
          ...tastedWines.map((entry) => ({
            ...entry.wine,
            lastTastedAt: entry.lastTastedAt,
            tastingCount: entry.tastingCount,
            origin: 'tasted',
          })),
        ];
      }
      
      return friendWinesList;
    }
    
    // Sinon, utiliser les vins de l'utilisateur connecté
    return [
      ...wines,
      ...tastedWines.map((entry) => ({
        ...entry.wine,
        lastTastedAt: entry.lastTastedAt,
        tastingCount: entry.tastingCount,
        origin: 'tasted',
      })),
    ];
  }, [wines, tastedWines, friendWines, friendTastedWines, isVisitedReadOnly, activeTab]);

  // Vérifier s'il y a des données de vin passées en paramètres (pour les vins OCR)
  let wineDataFromParams = null;
  if (wineDataParam) {
    try {
      const parsedData = JSON.parse(wineDataParam);
      if (parsedData && typeof parsedData === 'object' && (parsedData.id || parsedData.name)) {
        wineDataFromParams = parsedData;
      }
    } catch (error) {
      console.error('Erreur parsing wineData:', error);
    }
  }

  // Trouver le vin dans la liste combinée ou utiliser les données passées (mémoïsé)
  const wine = useMemo(() => {
    return wineDataFromParams || allWines.find(w => w?.id === wineId);
  }, [wineDataFromParams, allWines, wineId]);
  // Initialiser l'état local pour les vins OCR (édition locale uniquement)
  useEffect(() => {
    if (isOcrWine) {
      setEditedWine((prev: any) => prev || wine || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOcrWine, wineId]);
  // État local pour les mises à jour immédiates (optimistic updates)
  const [localWineUpdates, setLocalWineUpdates] = useState<Partial<Wine>>({});

  // Source de vérité UI: editedWine en OCR, sinon vin DB + mises à jour locales (mémoïsé)
  const safeWine = useMemo(() => {
    if (isOcrWine && editedWine) return editedWine;
    if (!wine) return null;
    const result = { ...wine, ...localWineUpdates };
    console.log('🔄 safeWine recalculé:', { wine: wine?.priceRange, localWineUpdates, result: result.priceRange });
    return result;
  }, [isOcrWine, editedWine, wine, localWineUpdates]);

  // Nettoyer les mises à jour locales quand le vin se met à jour depuis la base
  useEffect(() => {
    if (wine && Object.keys(localWineUpdates).length > 0) {
      // Vérifier si les valeurs locales sont maintenant synchronisées avec la base
      const isSynced = Object.entries(localWineUpdates).every(([key, value]) => {
        return wine[key as keyof typeof wine] === value;
      });
      
      if (isSynced) {
        console.log('🔄 Synchronisation détectée, nettoyage des mises à jour locales');
        setLocalWineUpdates({});
      } else {
        console.log('🔄 Valeurs non synchronisées, conservation des mises à jour locales:', {
          localWineUpdates,
          wineValues: Object.fromEntries(
            Object.keys(localWineUpdates).map(key => [key, wine[key as keyof typeof wine]])
          )
        });
      }
    }
  }, [wine, localWineUpdates]);

  // Si le vin n'existe plus, rediriger vers la liste
  useEffect(() => {
    // En mode lecture seule, ne pas rediriger tant que les vins de l'ami ne sont pas chargés
    if (isVisitedReadOnly) {
      return;
    }
    
    if (allWines.length > 0 && !wine && !wineDataFromParams) {
      console.log('Vin non trouvé, redirection vers la liste');
      router.back();
    }
  }, [allWines, wine, wineDataFromParams, router, isVisitedReadOnly]);

  // Charger les données du vin pour le viewer (toujours ses propres données)
  const loadViewerData = useCallback(async () => {
    if (!viewerUserId || !wineId) {
      return;
    }
    // Vin OCR: pas de chargement DB
    if (isOcrWine) {
      return;
    }

    try {
      const { data: userWine, error } = await supabase
        .from('user_wine')
        .select('rating, tasting_profile, favorite')
        .eq('user_id', viewerUserId)
        .eq('wine_id', wineId)
        .maybeSingle();

      if (error) { return; }

      if (userWine) {
        setRating(userWine.rating || 0);
        setTastingProfile(userWine.tasting_profile || {
          power: 0,
          tannin: 0,
          acidity: 0,
          sweetness: 0
        });
      } else {
        // Réinitialiser les valeurs par défaut
        setRating(0);
        setTastingProfile({
          power: 0,
          tannin: 0,
          acidity: 0,
          sweetness: 0
        });
      }

      // Charger toutes les notes de dégustation depuis wine_history
      const { data: tastingHistory, error: historyError } = await supabase
        .from('wine_history')
        .select('id, notes, event_date')
        .eq('wine_id', wineId)
        .eq('user_id', viewerUserId)
        .eq('event_type', 'stock_change')
        .not('notes', 'is', null)
        .order('event_date', { ascending: false });

      if (!historyError) {
        const notes = (tastingHistory || [])
          .map(event => ({
            id: event.id,
            note: event.notes,
            date: event.event_date
          }))
          .filter(item => item.note && item.note.trim() !== '');
        setAllTastingNotes(notes);
      }
    } catch (error) {
      // silencieux
    }
  }, [viewerUserId, wineId, isOcrWine]);

  useEffect(() => {
    loadViewerData();
  }, [loadViewerData]);

  // Recharger les données après une dégustation
  useEffect(() => {
    if (tastedWines.length > 0) {
      // Vérifier si ce vin a été dégusté récemment
      const recentTasting = tastedWines.find(tw => tw.wine.id === wineId);
      if (recentTasting) {
        loadViewerData();
      }
    }
  }, [tastedWines, wineId, loadViewerData]);

  // Charger les données sociales
  useEffect(() => {
    if (!wineId || !viewerUserId || !contextOwnerUserId) return;

    const loadSocialData = async () => {
      try {
        const socialData = await buildSocialData(wineId, viewerUserId, contextOwnerUserId);
        setSocialData(socialData);
      } catch (error) {
        console.error('Erreur lors du chargement des données sociales:', error);
      }
    };

    loadSocialData();
  }, [wineId, viewerUserId, contextOwnerUserId]);

  // États pour les modales et l'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showAppellationPicker, setShowAppellationPicker] = useState(false);
  const [showGrapesPicker, setShowGrapesPicker] = useState(false);
  const [appellationText, setAppellationText] = useState('');
  const [grapesText, setGrapesText] = useState('');
  const [appellationItems, setAppellationItems] = useState<string[]>([]);
  const [appellationInput, setAppellationInput] = useState('');
  const [grapeItems, setGrapeItems] = useState<string[]>([]);
  const [grapeInput, setGrapeInput] = useState('');
  const [rating, setRating] = useState(0);
  const [tastingProfile, setTastingProfile] = useState({
    power: 0,
    tannin: 0,
    acidity: 0,
    sweetness: 0
  });
  
  // Toutes les notes de dégustation depuis wine_history
  const [allTastingNotes, setAllTastingNotes] = useState<{id: string, note: string, date: string}[]>([]);
  const [newManualNote, setNewManualNote] = useState('');
  const [tastingModalVisible, setTastingModalVisible] = useState(false);
  const [selectedWineForTasting, setSelectedWineForTasting] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [socialData, setSocialData] = useState<SocialData>({
    alsoInCave: [],
    alsoInWishlist: [],
    alsoTasted: [],
    inspiredByMe: []
  });
  const tastingUpdateTimer = useRef<any>(null);

  // Mode édition pour les vins
  const [isEditing, setIsEditing] = useState(false);

  // États pour les sélecteurs
  const [showVintagePicker, setShowVintagePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);
  const [showGrapePicker, setShowGrapePicker] = useState(false);

  // États pour les données de référence
  const [vintageYears, setVintageYears] = useState<number[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<any[]>([]);
  const [appellations, setAppellations] = useState<any[]>([]);
  const [filteredAppellations, setFilteredAppellations] = useState<any[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<any[]>([]);
  const [filteredGrapes, setFilteredGrapes] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isCountriesLoaded, setIsCountriesLoaded] = useState(false);

  // États pour la recherche dans les modales
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [regionSearchText, setRegionSearchText] = useState('');
  const [appellationSearchText, setAppellationSearchText] = useState('');
  const [grapeSearchText, setGrapeSearchText] = useState('');

  // États pour l'édition des champs
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // États pour l'ajout de nouveaux éléments
  const [newRegionName, setNewRegionName] = useState('');
  const [newAppellationName, setNewAppellationName] = useState('');
  const [newGrapeName, setNewGrapeName] = useState('');

  // Rafraîchir la fiche quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      fetchWines();
      fetchTastedWines();
      fetchHistory();
      return () => {};
    }, [fetchWines, fetchTastedWines, fetchHistory])
  );

  // Charger les données de référence
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Gestion du clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadReferenceData = async () => {
    try {
      // Charger les années (1800 à année actuelle)
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: currentYear - 1800 + 1 }, (_, i) => 1800 + i).reverse();
      setVintageYears(years);

      // Charger les pays
      const { data: countriesData } = await supabase
        .from('wine_countries')
        .select('id, name, flag_emoji')
        .order('name');
      if (countriesData) {
        console.log('🌍 Pays chargés:', countriesData.length, 'pays');
        setCountries(countriesData);
        setFilteredCountries(countriesData);
        setIsCountriesLoaded(true);
      }

      // Charger les appellations
      const { data: designationsData } = await supabase
        .from('designation')
        .select('id, name')
        .order('name');
      if (designationsData) setDesignations(designationsData);

      // Charger les cépages
      const { data: grapesData } = await supabase
        .from('grape_variety')
        .select('id, name')
        .order('name');
      if (grapesData) setGrapeVarieties(grapesData);
    } catch (error) {
      console.error('Erreur chargement données référence:', error);
    }
  };

  // Fonctions de chargement des données liées
  const loadRegionsByCountry = async (countryName: string) => {
    try {
      const country = countries.find(c => c.name === countryName);
      if (!country) return;

      const { data: regionsData } = await supabase
        .from('wine_regions')
        .select('id, name')
        .eq('country_id', country.id)
        .order('name');
      
      if (regionsData) {
        setRegions(regionsData);
        setFilteredRegions(regionsData);
      }
    } catch (error) {
      console.error('Erreur chargement régions:', error);
    }
  };

  const loadAppellationsByRegion = async (regionName: string) => {
    try {
      const region = regions.find(r => r.name === regionName);
      if (!region) return;

      const { data: appellationsData } = await supabase
        .from('wine_appellations')
        .select('id, name')
        .eq('region_id', region.id)
        .order('name');
      
      if (appellationsData) {
        setAppellations(appellationsData);
        setFilteredAppellations(appellationsData);
      }
    } catch (error) {
      console.error('Erreur chargement appellations:', error);
    }
  };

  const loadGrapesByAppellation = async (appellationName: string) => {
    try {
      const appellation = appellations.find(a => a.name === appellationName);
      if (!appellation) return;

      const { data: grapesData } = await supabase
        .from('grape_variety')
        .select('id, name')
        .eq('appellation_id', appellation.id)
        .order('name');
      
      if (grapesData) {
        setGrapeVarieties(grapesData);
        setFilteredGrapes(grapesData);
      }
    } catch (error) {
      console.error('Erreur chargement cépages:', error);
    }
  };

  // Fonctions de filtrage
  const getFilteredCountries = () => {
    if (!countrySearchText) return filteredCountries;
    return filteredCountries.filter(country =>
      country.name.toLowerCase().includes(countrySearchText.toLowerCase())
    );
  };

  const getFilteredRegions = () => {
    if (!regionSearchText) return filteredRegions;
    return filteredRegions.filter(region =>
      region.name.toLowerCase().includes(regionSearchText.toLowerCase())
    );
  };

  const getFilteredAppellations = () => {
    if (!appellationSearchText) return filteredAppellations;
    return filteredAppellations.filter(appellation =>
      appellation.name.toLowerCase().includes(appellationSearchText.toLowerCase())
    );
  };

  const getFilteredGrapes = () => {
    if (!grapeSearchText) return filteredGrapes;
    return filteredGrapes.filter(grape =>
      grape.name.toLowerCase().includes(grapeSearchText.toLowerCase())
    );
  };

  // Fonctions pour ouvrir les sélecteurs
  const openCountryPicker = () => {
    if (!isCountriesLoaded) {
      loadReferenceData();
    }
    setShowCountryPicker(true);
  };

  const openRegionPicker = () => {
    // Autoriser l'ouverture même sans pays. Charger si possible.
    if (safeWine?.country) {
      loadRegionsByCountry(safeWine.country);
    }
    setShowRegionPicker(true);
  };

  const openAppellationPicker = () => {
    // Autoriser l'ouverture même sans région. Charger si possible.
    // Initialiser les items à partir de la valeur existante (séparée par virgules)
    const current = (editingFields as any)?.appellation ?? (safeWine?.appellation || '');
    const items = String(current)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setAppellationItems(items);
    setAppellationInput('');
    setShowAppellationPicker(true);
  };

  const openGrapesPicker = () => {
    // Autoriser l'ouverture même sans appellation. Charger si possible.
    const currentGrapes = Array.isArray((editingFields as any)?.grapes)
      ? (editingFields as any).grapes
      : (Array.isArray(safeWine?.grapes) ? safeWine?.grapes : []);
    setGrapeItems(currentGrapes || []);
    setGrapeInput('');
    setShowGrapesPicker(true);
  };

  // Fonctions de gestion des champs éditables
  const handleFieldChange = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
    if (isOcrWine) {
      setEditedWine((prev: any) => ({ ...(prev || {}), [field]: value }));
    }
  };

  const handleFieldFocus = (field: string, currentValue: any, placeholder: string) => {
    setFocusedField(field);
    if (currentValue === placeholder || currentValue === '') {
      setEditingFields(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = async (field: string) => {
    setFocusedField(null);
    const newValue = editingFields[field];
    if (newValue !== undefined && newValue !== safeWine?.[field as keyof typeof safeWine]) {
      if (isOcrWine) {
        setEditedWine((prev: any) => ({ ...(prev || {}), [field]: newValue }));
        setEditingFields(prev => {
          const newFields = { ...prev };
          delete newFields[field];
          return newFields;
        });
      } else {
        // Mise à jour optimiste immédiate
        console.log('🔄 Mise à jour optimiste champ:', field, newValue);
        setLocalWineUpdates(prev => {
          const newUpdates = { ...prev, [field]: newValue };
          console.log('🔄 localWineUpdates mis à jour:', newUpdates);
          return newUpdates;
        });
        try {
          await updateWine(wineId, { [field]: newValue });
          console.log('✅ updateWine réussi pour champ:', field);
          setEditingFields(prev => {
            const newFields = { ...prev };
            delete newFields[field];
            return newFields;
          });
          // Ne pas nettoyer immédiatement, laisser la synchronisation se faire naturellement
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de ${field}:`, error);
          // Revenir à la valeur précédente en cas d'erreur
          setLocalWineUpdates(prev => {
            const { [field]: _, ...rest } = prev;
            return rest;
          });
        }
      }
    }
  };

  // Fonctions de gestion des actions
  const handleToggleFavorite = async () => {
    if (!safeWine) return;
    
    // Mise à jour immédiate de l'état local pour une synchronisation instantanée
    const newFavoriteState = !safeWine.favorite;
    
    if (isOcrWine) {
      setEditedWine((prev: any) => ({ ...(prev || {}), favorite: newFavoriteState }));
      return;
    }
    
    // Pour les vins non-OCR, utiliser localWineUpdates
    setLocalWineUpdates((prev) => ({ ...prev, favorite: newFavoriteState }));
    
    try {
      await updateWine(wineId, { favorite: newFavoriteState });
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      // En cas d'erreur, on revert l'état local
      setLocalWineUpdates((prev) => ({ ...prev, favorite: safeWine.favorite }));
    }
  };


  const handleSetRating = async (newRating: number) => {
    setRating(newRating);
    if (!isOcrWine) {
      try {
        await updateWine(wineId, { note: newRating });
        await loadViewerData();
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la note:', error);
      }
    }
  };

  const handleSetTastingCriteria = async (criteria: string, value: number) => {
    const newProfile = { ...tastingProfile, [criteria]: value };
    setTastingProfile(newProfile);
    
    // Debounce pour éviter trop de requêtes
    if (tastingUpdateTimer.current) {
      clearTimeout(tastingUpdateTimer.current);
    }
    
    tastingUpdateTimer.current = setTimeout(async () => {
      if (!isOcrWine) {
        try {
          await updateWine(wineId, { tastingProfile: newProfile });
          await loadViewerData();
        } catch (error) {
          console.error('Erreur lors de la mise à jour du profil de dégustation:', error);
        }
      }
    }, 500);
  };

  // Fonction pour ouvrir la modal de dégustation
  const handleMarkAsTasted = () => {
    if (safeWine) {
      setSelectedWineForTasting(safeWine);
      setTastingModalVisible(true);
    }
  };

  // Fonction pour annuler la dégustation
  const handleCancelTasting = () => {
    setTastingModalVisible(false);
    setSelectedWineForTasting(null);
  };

  // Fonction pour confirmer la dégustation
  const handleConfirmTasting = async (rating: number) => {
    if (!selectedWineForTasting) return;

    try {
      console.log('🔄 handleConfirmTasting: Vin sélectionné:', selectedWineForTasting);
      
      // Pas de vérification de stock côté client, addTasting gère tout
      
      // addTasting gère la mise à jour du stock et la création de l'entrée historique
      const result = await addTasting(selectedWineForTasting.id, rating);
      
      if (result && result.success) {
        console.log('✅ handleConfirmTasting: Dégustation enregistrée');
      } else {
        console.error('❌ handleConfirmTasting: Erreur lors de l\'enregistrement de la dégustation');
      }
      
      // Fermer la modale et rafraîchir les données
      setTastingModalVisible(false);
      setSelectedWineForTasting(null);
      await fetchWines();
      await fetchTastedWines();
      await fetchHistory();
      await loadViewerData(); // Recharger les données du viewer
    } catch (error) {
      console.error('Erreur lors de la dégustation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la dégustation');
    }
  };

  // Ajouter une note manuelle (sauvegarde automatique)
  const handleSaveManualNote = async () => {
    if (!newManualNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('wine_history')
        .insert({
          wine_id: wineId,
          user_id: viewerUserId,
          event_type: 'stock_change',
          notes: newManualNote.trim(),
          event_date: new Date().toISOString(),
          previous_amount: 1,
          new_amount: 1
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Note manuelle ajoutée:', data);
      setNewManualNote('');
      await loadViewerData(); // Recharger les données
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la note manuelle:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la note');
    }
  };


  // Sauvegarder l'édition d'une note
  const handleSaveEditNote = async (noteId: string, noteText: string) => {
    if (!noteText.trim()) return;

    try {
      const { error } = await supabase
        .from('wine_history')
        .update({ notes: noteText.trim() })
        .eq('id', noteId);

      if (error) throw error;

      console.log('✅ Note modifiée');
    } catch (error) {
      console.error('❌ Erreur lors de la modification de la note:', error);
      Alert.alert('Erreur', 'Impossible de modifier la note');
    }
  };

  // Supprimer une note
  const handleDeleteNote = async (noteId: string) => {
    Alert.alert(
      'Supprimer la note',
      'Êtes-vous sûr de vouloir supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('wine_history')
                .delete()
                .eq('id', noteId);

              if (error) throw error;

              console.log('✅ Note supprimée');
              await loadViewerData(); // Recharger les données
            } catch (error) {
              console.error('❌ Erreur lors de la suppression de la note:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la note');
            }
          }
        }
      ]
    );
  };

  // Fonctions du menu contextuel
  const handleDeleteWine = async () => {
    Alert.alert(
      'Supprimer le vin',
      'Êtes-vous sûr de vouloir supprimer ce vin de votre cave ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_wine')
                .delete()
                .eq('wine_id', wineId)
                .eq('user_id', viewerUserId);
              
              if (error) throw error;
              
              // Notifier les abonnés pour mettre à jour les stats immédiatement
              notifyUpdate();
              
              // Retourner à la liste
              router.back();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le vin');
            }
          }
        }
      ]
    );
  };

  // Supprimer un vin dégusté (supprime toutes les entrées wine_history)
  const handleDeleteTastedWine = async () => {
    Alert.alert(
      'Supprimer le vin dégusté',
      'Êtes-vous sûr de vouloir supprimer toutes les dégustations de ce vin ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer toutes les entrées wine_history pour ce vin
              const { error } = await supabase
                .from('wine_history')
                .delete()
                .eq('wine_id', wineId)
                .eq('user_id', viewerUserId);
              
              if (error) throw error;
              
              console.log('✅ Vin dégusté supprimé');
              
              // Attendre un court délai pour laisser la DB se mettre à jour
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Recharger les données pour mettre à jour les stats
              await fetchTastedWines();
              await fetchWines();
              
              // Forcer le rechargement des données de l'écran actuel
              await loadViewerData();
              
              // Notifier les abonnés pour mettre à jour les stats immédiatement
              notifyUpdate();
              
              // Retourner à la liste
              router.back();
            } catch (error) {
              console.error('Erreur lors de la suppression du vin dégusté:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le vin dégusté');
            }
          }
        }
      ]
    );
  };

  const handleMoveToWishlist = async () => {
    try {
      if (!safeWine) return;
      const payload: any = isOcrWine
        ? { ...(editedWine || safeWine), origin: 'wishlist', stock: 0 }
        : {
            id: safeWine.id,
            name: safeWine.name,
            domaine: (safeWine as any).domaine || (safeWine as any).producer?.name || undefined,
            vintage: (safeWine as any).vintage,
            region: (safeWine as any).region,
            country: typeof (safeWine as any).country === 'string' ? (safeWine as any).country : (safeWine as any).country?.name,
            color: (safeWine as any).color,
            priceRange: (safeWine as any).priceRange,
            grapes: Array.isArray((safeWine as any).grapes) ? (safeWine as any).grapes : [],
            imageUri: (safeWine as any).imageUri || (safeWine as any).image_uri,
            origin: 'wishlist',
            stock: 0,
          };
      await addWineToWishlist(payload);
      Alert.alert('Succès', 'Vin ajouté à votre liste d\'envie');
      router.back();
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la liste d\'envie:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter à la liste d\'envie');
    }
  };

  const handleMoveToCellar = async () => {
    try {
      if (!safeWine) return;
      const payload: any = isOcrWine
        ? { ...(editedWine || safeWine), origin: 'cellar', stock: (safeWine as any).stock ?? 1 }
        : {
            id: safeWine.id,
            name: safeWine.name,
            domaine: (safeWine as any).domaine || (safeWine as any).producer?.name || undefined,
            vintage: (safeWine as any).vintage,
            region: (safeWine as any).region,
            country: typeof (safeWine as any).country === 'string' ? (safeWine as any).country : (safeWine as any).country?.name,
            color: (safeWine as any).color,
            priceRange: (safeWine as any).priceRange,
            grapes: Array.isArray((safeWine as any).grapes) ? (safeWine as any).grapes : [],
            imageUri: (safeWine as any).imageUri || (safeWine as any).image_uri,
            origin: 'cellar',
            stock: (safeWine as any).stock ?? 1,
          };
      await addWineToCellar(payload);
      try {
        const { refreshStats } = await import('../hooks/useStats');
        // Note: useStats est un hook; ici, on ne peut pas l'appeler directement.
        // Le rafraîchissement des stats est déjà déclenché depuis ocr-results.
      } catch {}
      Alert.alert('Succès', 'Vin ajouté à votre cave');
      router.back();
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la cave:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter à la cave');
    }
  };


  const handleShareWine = async () => {
    if (!safeWine) return;
    try {
      const yearText = safeWine.vintage ? `(${safeWine.vintage})` : '(année inconnue)';
      const message = `🍷 Découvre ce vin sur Veeni : ${safeWine.name} ${yearText}\nhttps://veeni.app`;
      
      console.log('🍷 Tentative de partage vin:', message);
      const result = await Share.share({
        message,
      });
      console.log('🍷 Résultat partage:', result);
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      Alert.alert('Erreur', 'Impossible de partager le vin');
    }
  };

  // Déterminer les options du menu selon le contexte
  const getMenuOptions = () => {
    const isMyWine = contextOwnerUserId === viewerUserId;
    const isVisitedWine = !isMyWine;
    
    switch (context) {
      case 'cellar':
        return [
          { title: 'Partager', action: handleShareWine },
          { title: 'Déplacer vers liste d\'envie', action: handleMoveToWishlist },
          { title: 'Supprimer', action: handleDeleteWine, destructive: true },
        ];
      
      case 'wishlist':
        return [
          { title: 'Partager', action: handleShareWine },
          { title: 'Ajouter à ma cave', action: handleMoveToCellar },
          { title: 'Supprimer', action: handleDeleteWine, destructive: true },
        ];
      
      case 'tasted':
        return [
          { title: 'Partager', action: handleShareWine },
          { title: 'Supprimer', action: handleDeleteTastedWine, destructive: true },
        ];
      
      case 'friend':
        // Fiche visitée (ami) - mode lecture seule
        return [
          { title: 'Partager', action: handleShareWine },
          { title: 'Ajouter à ma cave', action: handleMoveToCellar },
          { title: 'Ajouter à ma liste d\'envie', action: handleMoveToWishlist },
          { title: 'Marquer comme dégusté', action: handleMarkAsTasted },
        ];
      
      default:
        // Fallback pour les autres contextes
        return [
          { title: 'Partager', action: handleShareWine },
        ];
    }
  };

  // Composant pour une note avec bouton de suppression
  const NoteItem = ({ noteItem }: { noteItem: { id: string; note: string; date: string } }) => {
    return (
      <View style={styles.noteContainer}>
        <TextInput
          style={styles.tastingNoteInput}
          value={noteItem.note}
          onChangeText={(text) => {
            const updatedNotes = allTastingNotes.map(note => 
              note.id === noteItem.id ? { ...note, note: text } : note
            );
            setAllTastingNotes(updatedNotes);
          }}
          onBlur={() => handleSaveEditNote(noteItem.id, noteItem.note)}
          placeholder="Modifiez votre note..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
        />
        <Text style={styles.noteDate}>
          {new Date(noteItem.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
        
        {/* Bouton de suppression en haut à droite */}
        <TouchableOpacity
          style={styles.deleteNoteButton}
          onPress={() => handleDeleteNote(noteItem.id)}
        >
          <Ionicons name="close" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };



  const handleSaveDescription = async () => {
    if (isOcrWine) {
      setEditedWine((prev: any) => ({ ...(prev || {}), description }));
      return;
    }
    try {
      await updateWine(wineId, { description });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la description:', error);
    }
  };

  const handleAddBottle = async () => {
    if (!safeWine) return;
    if (isOcrWine) {
      setEditedWine((prev: any) => ({ ...(prev || {}), stock: (safeWine.stock || 0) + 1 }));
      return;
    }
    try {
      await updateWine(wineId, { stock: (safeWine.stock || 0) + 1 });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de bouteille:', error);
    }
  };

  const handleRemoveBottle = async () => {
    if (!safeWine || (safeWine.stock || 0) <= 0) return;
    if (isOcrWine) {
      setEditedWine((prev: any) => ({ ...(prev || {}), stock: Math.max(0, (safeWine.stock || 0) - 1) }));
      return;
    }
    try {
      await updateWine(wineId, { stock: Math.max(0, (safeWine.stock || 0) - 1) });
    } catch (error) {
      console.error('Erreur lors de la suppression de bouteille:', error);
    }
  };

  // Fonction pour obtenir la couleur du type de vin
  const getWineTypeColor = (color: string) => {
    switch (color) {
      case 'red': return VeeniColors.wine.red;
      case 'white': return VeeniColors.wine.white;
      case 'rose': return VeeniColors.wine.rose;
      case 'sparkling': return VeeniColors.wine.sparkling;
      default: return '#FFFFFF';
    }
  };

  // Fonction pour rendre les étoiles
  const renderStars = (currentRating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= currentRating ? '#FFD700' : '#CCC'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Rendu de la section historique
  const renderHistorySection = () => {
    if (historyLoading) {
      return (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      );
    }

    if (wineHistory.length === 0) {
      return (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <Text style={styles.noHistoryText}>Aucun historique disponible</Text>
        </View>
      );
    }

    return (
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historique</Text>
        {wineHistory.map((event, index) => (
          <View 
            key={event.id} 
            style={[
              styles.historyItem,
              index === wineHistory.length - 1 && styles.historyItemLast
            ]}
          >
            <Text style={styles.historyDate}>{event.date}</Text>
            <Text style={styles.historyAction}>{event.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Rendu de la section sociale
  const renderSocialSection = () => {
    const hasSocialData = socialData.origin || 
      socialData.alsoInCave.length > 0 || 
      socialData.alsoInWishlist.length > 0 || 
      socialData.alsoTasted.length > 0 || 
      socialData.inspiredByMe.length > 0;

    if (!hasSocialData) return null;

    // Créer un tableau de tous les éléments sociaux
    const socialItems = [];

    if (socialData.origin) {
      socialItems.push({
        key: 'origin',
        text: `Ajouté depuis la ${socialData.origin.type === 'cave' ? 'cave' : 'liste'} de ${socialData.origin.friend.first_name}`
      });
    }

    if (socialData.alsoInCave.length > 0) {
      socialItems.push({
        key: 'cellar',
        text: `Aussi dans la cave de ${socialData.alsoInCave.map(f => f.first_name).join(', ')}`
      });
    }

    if (socialData.alsoInWishlist.length > 0) {
      socialItems.push({
        key: 'wishlist',
        text: `Aussi dans la liste d'envie de ${socialData.alsoInWishlist.map(f => f.first_name).join(', ')}`
      });
    }

    if (socialData.alsoTasted.length > 0) {
      socialItems.push({
        key: 'tasted',
        text: `Aussi dégusté par ${socialData.alsoTasted.map(f => f.first_name).join(', ')}`
      });
    }

    if (socialData.inspiredByMe.length > 0) {
      socialItems.push({
        key: 'inspired',
        text: `Vous avez inspiré ${socialData.inspiredByMe.map(f => f.first_name).join(', ')}`
      });
    }

    return (
      <View style={styles.socialSection}>
        <Text style={styles.sectionTitle}>Social</Text>
        {socialItems.map((item, index) => (
          <View 
            key={item.key} 
            style={[
              styles.socialItem,
              index === socialItems.length - 1 && styles.socialItemLast
            ]}
          >
            <Text style={styles.socialText}>{item.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!safeWine) {
    // En mode lecture seule, afficher un chargement spécifique
    if (isVisitedReadOnly && friendWinesLoading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des vins de l'ami...</Text>
          </View>
        </SafeAreaView>
      );
    }
    
    // Si on est en mode lecture seule et que les vins sont chargés mais le vin n'est pas trouvé
    // Ne pas afficher cette erreur si on accède via l'onglet souvenirs (tab=memories)
    if (isVisitedReadOnly && !friendWinesLoading && friendWines.length > 0 && activeTab !== 'memories') {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Vin non trouvé dans la cave de l'ami</Text>
          </View>
        </SafeAreaView>
      );
    }
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // En mode OCR, renvoyer l'objet édité à ocr-results
          if (isOcrWine && editedWine && returnToOcr === 'true') {
            try {
              router.replace({
                pathname: '/ocr-results',
                params: {
                  updatedWineId: editedWine.id,
                  wines: JSON.stringify([editedWine])
                }
              });
              return;
            } catch (_) {}
          }
          router.back();
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {safeWine.name || 'Vin'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          
          <TouchableOpacity onPress={() => setShowActionsModal(true)} style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Onglets de navigation */}
        <WineDetailsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          memoriesCount={memoriesCount}
          isReadOnlyMode={isVisitedReadOnly}
          hasMemories={hasMemories}
        />

      {/* Contenu conditionnel selon l'onglet actif */}
      {activeTab === 'memories' ? (
        <WineMemoriesScreenV2
          wineId={wineId}
          wineName={safeWine.name || 'Vin'}
          isReadOnlyMode={isVisitedReadOnly}
          isEmbedded={true}
        />
      ) : (
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Image du vin */}
            <View style={styles.imageContainer}>
              <ExpoImage
                source={
                  safeWine.imageUri
                    ? { uri: `${safeWine.imageUri}?t=${Date.now()}` }
                    : require('../assets/images/default-wine.png')
                }
                style={styles.wineImage}
                contentFit="cover"
              />
              {/* Bouton favori en haut à droite de l'image */}
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.likeButton}>
                <Ionicons 
                  name={safeWine.favorite ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={safeWine.favorite ? VeeniColors.wine.red : '#FFFFFF'} 
                />
              </TouchableOpacity>
            </View>

          {/* Informations principales */}
          <View style={styles.mainInfo}>
            <TextInput
              style={styles.wineName}
              value={editingFields.name !== undefined ? editingFields.name : (safeWine.name || '')}
              onChangeText={(text) => handleFieldChange('name', text)}
              onFocus={() => handleFieldFocus('name', safeWine.name || '', 'Nom inconnu')}
              onBlur={() => handleFieldBlur('name')}
              placeholder="Nom du vin"
              placeholderTextColor="#666"
              editable={!isVisitedReadOnly}
              multiline
              autoCorrect={false}
              autoCapitalize="words"
            />
            <View style={styles.domainRow}>
              <TextInput
                style={styles.wineProducer}
                value={editingFields.domaine !== undefined ? editingFields.domaine : (safeWine.domaine || '')}
                onChangeText={(text) => handleFieldChange('domaine', text)}
                onFocus={() => handleFieldFocus('domaine', safeWine.domaine || '', 'Domaine inconnu')}
                onBlur={() => handleFieldBlur('domaine')}
                placeholder="Domaine"
                placeholderTextColor="#666"
                editable={!isVisitedReadOnly}
                multiline
                autoCorrect={false}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Informations détaillées avec structure titre/valeur */}
          <View style={styles.detailsSection}>
            {/* Millésime */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Millésime</Text>
              <TouchableOpacity 
                style={styles.detailValue}
                onPress={() => setShowVintagePicker(true)}
              >
                <Text style={styles.detailValueText}>
                  {safeWine.vintage || 'Sélectionner'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>

            {/* Type de vin */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <TouchableOpacity 
                style={styles.detailValue}
                onPress={() => setShowColorPicker(true)}
              >
                <View style={styles.wineTypeContainer}>
                  <Ionicons 
                    name="wine" 
                    size={16} 
                    color={getWineTypeColor(safeWine.color)}
                    style={styles.wineTypeIcon}
                  />
                  <Text style={styles.detailValueText}>
                    {safeWine.color === 'red' ? 'Rouge' : 
                     safeWine.color === 'white' ? 'Blanc' : 
                     safeWine.color === 'rose' ? 'Rosé' : 
                     safeWine.color === 'sparkling' ? 'Effervescent' : 'Vin'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#CCCCCC" style={styles.chevronIcon} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Pays */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pays</Text>
              <TouchableOpacity 
                style={styles.detailValue}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.detailValueText}>
                  {safeWine.country ? 
                    `${countries.find(c => c.name === safeWine.country)?.flag_emoji || '🏳️'} ${safeWine.country}` : 
                    'Sélectionner'
                  }
                </Text>
                <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>

            {/* Valeur */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valeur</Text>
              <TouchableOpacity 
                style={styles.detailValue}
                onPress={() => setShowPricePicker(true)}
              >
                <Text style={styles.detailValueText}>
                  {safeWine.priceRange || 'Sélectionner'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>

            {/* Région */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Région</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={openRegionPicker}
            >
                <Text style={styles.detailValueText}>
                  {safeWine.region || 'Sélectionner'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>

            {/* Appellation */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Appellation</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={openAppellationPicker}
            >
                {safeWine.appellation && safeWine.appellation.trim().length > 0 ? (
                  <View style={styles.tagsRow}>
                    {safeWine.appellation
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                  </View>
                ) : (
                  <Text style={styles.detailValueText}>Sélectionner</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>

            {/* Cépages */}
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Cépage</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={openGrapesPicker}
            >
                {Array.isArray(safeWine?.grapes) && safeWine.grapes.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {safeWine.grapes.map((g, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{g}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.detailValueText}>Sélectionner</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock */}
          {context === 'cellar' && !isVisitedReadOnly && (
            <View style={styles.stockSection}>
              <Text style={styles.sectionTitle}>Stock</Text>
              <View style={styles.stockControls}>
                <TouchableOpacity onPress={handleMarkAsTasted} style={styles.stockButton}>
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.stockCount}>{safeWine.stock || 0}</Text>
                <TouchableOpacity onPress={handleAddBottle} style={styles.stockButton}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Affichage du stock en mode lecture seule */}
          {context === 'cellar' && isVisitedReadOnly && (
            <View style={styles.stockSection}>
              <Text style={styles.sectionTitle}>Stock</Text>
              <Text style={styles.stockCountReadOnly}>{safeWine.stock || 0} bouteille(s)</Text>
            </View>
          )}

          {/* Note et évaluation */}
          {!isVisitedReadOnly && (
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Ma note</Text>
              {renderStars(rating, handleSetRating)}
            </View>
          )}
          
          {/* Affichage de la note en mode lecture seule */}
          {isVisitedReadOnly && friendUW?.rating && (
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Note de l'ami</Text>
              {renderStars(friendUW.rating, () => {})}
            </View>
          )}

          {/* Profil de dégustation */}
          {!isVisitedReadOnly && (
            <View style={styles.tastingSection}>
              <Text style={styles.sectionTitle}>Profil de dégustation</Text>
            <View style={styles.tastingCriteria}>
              <Text style={styles.criteriaLabel}>Puissance</Text>
              <View style={styles.criteriaStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleSetTastingCriteria('power', star)}
                  >
                    <Ionicons
                      name={star <= tastingProfile.power ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= tastingProfile.power ? '#FFD700' : '#CCC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.tastingCriteria}>
              <Text style={styles.criteriaLabel}>Tanin</Text>
              <View style={styles.criteriaStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleSetTastingCriteria('tannin', star)}
                  >
                    <Ionicons
                      name={star <= tastingProfile.tannin ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= tastingProfile.tannin ? '#FFD700' : '#CCC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.tastingCriteria}>
              <Text style={styles.criteriaLabel}>Acidité</Text>
              <View style={styles.criteriaStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleSetTastingCriteria('acidity', star)}
                  >
                    <Ionicons
                      name={star <= tastingProfile.acidity ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= tastingProfile.acidity ? '#FFD700' : '#CCC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.tastingCriteria, styles.tastingCriteriaLast]}>
              <Text style={styles.criteriaLabel}>Sucré</Text>
              <View style={styles.criteriaStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleSetTastingCriteria('sweetness', star)}
                  >
                    <Ionicons
                      name={star <= tastingProfile.sweetness ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= tastingProfile.sweetness ? '#FFD700' : '#CCC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          )}

          {/* Descriptif */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descriptif</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Ajoutez une description du vin..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              onBlur={handleSaveDescription}
              editable={!isVisitedReadOnly}
            />
          </View>

          {/* Mon avis */}
          {!isVisitedReadOnly && (
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Mon avis</Text>
              
              {/* Notes existantes */}
              {allTastingNotes.map((noteItem, index) => (
                <NoteItem key={noteItem.id} noteItem={noteItem} />
              ))}

              {/* Champ pour ajouter une nouvelle note */}
              <TextInput
                style={styles.addNoteInput}
                value={newManualNote}
                onChangeText={setNewManualNote}
                onBlur={handleSaveManualNote}
                placeholder="Ajoutez une note personnelle..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
            </View>
          )}

            {/* Section Social */}
            {renderSocialSection()}

            {/* Historique */}
            {renderHistorySection()}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Modal sélection millésime */}
      <Modal
        visible={showVintagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVintagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVintagePicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[
              styles.pickerModal,
              { height: getModalHeight(Math.max(vintageYears.length, 1), false, false, keyboardHeight) }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner le millésime</Text>
                <TouchableOpacity onPress={() => setShowVintagePicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContentContainer}>
                <FlatList
                  data={vintageYears}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={index === vintageYears.length - 1 ? styles.pickerItemLast : styles.pickerItem}
                      onPress={async () => {
                        if (isOcrWine) {
                          setEditedWine((prev: any) => ({ ...(prev || {}), vintage: item }));
                          setShowVintagePicker(false);
                        } else {
                          // Mise à jour optimiste immédiate
                          console.log('🔄 Mise à jour optimiste millésime:', item);
                          setLocalWineUpdates(prev => {
                            const newUpdates = { ...prev, vintage: item };
                            console.log('🔄 localWineUpdates mis à jour:', newUpdates);
                            return newUpdates;
                          });
                          setShowVintagePicker(false);
                          try {
                            await updateWine(wineId, { vintage: item });
                            console.log('✅ updateWine réussi pour millésime');
                            // Ne pas nettoyer immédiatement, laisser la synchronisation se faire naturellement
                          } catch (error) {
                            console.error('Erreur sauvegarde millésime:', error);
                            Alert.alert('Erreur', 'Impossible de sauvegarder le millésime');
                            // Revenir à la valeur précédente en cas d'erreur
                            setLocalWineUpdates(prev => {
                              const { vintage: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }
                      }}
                    >
                      <Text style={styles.pickerItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.pickerList}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal sélection pays */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[
                styles.pickerModal,
                { height: getModalHeight(Math.max(countries.length, 1), countries.length > 5, false, keyboardHeight) }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner le pays</Text>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* Champ de recherche */}
              {countries.length > 5 && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un pays..."
                    placeholderTextColor="#666"
                    value={countrySearchText}
                    onChangeText={setCountrySearchText}
                    autoCorrect={false}
                    autoCapitalize="words"
                    onFocus={() => setKeyboardVisible(true)}
                    onBlur={() => setKeyboardVisible(false)}
                  />
                </View>
              )}
              
              <View style={styles.pickerContentContainer}>
                {countries.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Chargement des pays...</Text>
                  </View>
                ) : getFilteredCountries().length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucun pays trouvé</Text>
                  </View>
                ) : (
                  <FlatList
                    data={getFilteredCountries()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        style={index === getFilteredCountries().length - 1 ? styles.pickerItemLast : styles.pickerItem}
                        onPress={async () => {
                          if (isOcrWine) {
                            setEditedWine((prev: any) => ({ ...(prev || {}), country: item.name }));
                            setShowCountryPicker(false);
                            await loadRegionsByCountry(item.name);
                          } else {
                            // Mise à jour optimiste immédiate
                            console.log('🔄 Mise à jour optimiste pays:', item.name);
                            setLocalWineUpdates(prev => {
                              const newUpdates = { ...prev, country: item.name };
                              console.log('🔄 localWineUpdates mis à jour:', newUpdates);
                              return newUpdates;
                            });
                            setShowCountryPicker(false);
                            await loadRegionsByCountry(item.name);
                            try {
                              await updateWine(wineId, { country: item.name });
                              console.log('✅ updateWine réussi pour pays');
                              // Ne pas nettoyer immédiatement, laisser la synchronisation se faire naturellement
                            } catch (error) {
                              console.error('Erreur sauvegarde pays:', error);
                              Alert.alert('Erreur', 'Impossible de sauvegarder le pays');
                              // Revenir à la valeur précédente en cas d'erreur
                              setLocalWineUpdates(prev => {
                                const { country: _, ...rest } = prev;
                                return rest;
                              });
                            }
                          }
                        }}
                      >
                        <Text style={styles.pickerItemText}>
                          {item.flag_emoji} {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={styles.pickerList}
                  />
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal sélection type de vin */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[
              styles.pickerModal,
              { height: getModalHeight(4, false, false, keyboardHeight) }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner le type de vin</Text>
                <TouchableOpacity onPress={() => setShowColorPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContentContainer}>
                {[
                  { value: 'red', label: 'Rouge', color: VeeniColors.wine.red },
                  { value: 'white', label: 'Blanc', color: VeeniColors.wine.white },
                  { value: 'rose', label: 'Rosé', color: VeeniColors.wine.rose },
                  { value: 'sparkling', label: 'Effervescent', color: VeeniColors.wine.sparkling }
                ].map((item, index) => (
                  <TouchableOpacity
                    key={item.value}
                    style={index === 3 ? styles.pickerItemLast : styles.pickerItem}
                    onPress={async () => {
                      if (isOcrWine) {
                        setEditedWine((prev: any) => ({ ...(prev || {}), color: item.value }));
                        setShowColorPicker(false);
                      } else {
                        // Mise à jour optimiste immédiate
                        console.log('🔄 Mise à jour optimiste type:', item.value);
                        setLocalWineUpdates(prev => {
                          const newUpdates = { ...prev, color: item.value };
                          console.log('🔄 localWineUpdates mis à jour:', newUpdates);
                          return newUpdates;
                        });
                        setShowColorPicker(false);
                        try {
                          await updateWine(wineId, { color: item.value });
                          console.log('✅ updateWine réussi pour type');
                          // Ne pas nettoyer immédiatement, laisser la synchronisation se faire naturellement
                        } catch (error) {
                          console.error('Erreur sauvegarde type:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder le type de vin');
                          // Revenir à la valeur précédente en cas d'erreur
                          setLocalWineUpdates(prev => {
                            const { color: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }
                    }}
                  >
                    <View style={styles.pickerItemWithIcon}>
                      <Ionicons 
                        name="wine" 
                        size={16} 
                        color={item.color}
                        style={styles.pickerItemIcon}
                      />
                      <Text style={styles.pickerItemText}>
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal sélection valeur */}
      <Modal
        visible={showPricePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPricePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPricePicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[
              styles.pickerModal,
              { height: getModalHeight(4, false, false, keyboardHeight) }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner la valeur</Text>
                <TouchableOpacity onPress={() => setShowPricePicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContentContainer}>
                {['€', '€€', '€€€', '€€€€'].map((price, index) => (
                  <TouchableOpacity
                    key={price}
                    style={index === 3 ? styles.pickerItemLast : styles.pickerItem}
                    onPress={async () => {
                      if (isOcrWine) {
                        setEditedWine((prev: any) => ({ ...(prev || {}), priceRange: price }));
                        setShowPricePicker(false);
                      } else {
                        // Mise à jour optimiste immédiate
                        console.log('🔄 Mise à jour optimiste valeur:', price);
                        setLocalWineUpdates(prev => {
                          const newUpdates = { ...prev, priceRange: price };
                          console.log('🔄 localWineUpdates mis à jour:', newUpdates);
                          return newUpdates;
                        });
                        setShowPricePicker(false);
                        try {
                          await updateWine(wineId, { priceRange: price });
                          console.log('✅ updateWine réussi pour valeur');
                          // Ne pas nettoyer immédiatement, laisser la synchronisation se faire naturellement
                        } catch (error) {
                          console.error('Erreur sauvegarde valeur:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder la valeur');
                          // Revenir à la valeur précédente en cas d'erreur
                          setLocalWineUpdates(prev => {
                            const { priceRange: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }
                    }}
                  >
                    <Text style={styles.pickerItemText}>{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal sélection région */}
      <Modal
        visible={showRegionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegionPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegionPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[
                styles.pickerModal,
                { height: getModalHeight(Math.max(regions.length, 1), regions.length > 5, true, keyboardHeight) }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner la région</Text>
                <TouchableOpacity onPress={() => setShowRegionPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* Champ de recherche */}
              {regions.length > 5 && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher une région..."
                    placeholderTextColor="#666"
                    value={regionSearchText}
                    onChangeText={setRegionSearchText}
                    autoCorrect={false}
                    autoCapitalize="words"
                    onFocus={() => setKeyboardVisible(true)}
                    onBlur={() => setKeyboardVisible(false)}
                  />
                </View>
              )}
              
              <View style={styles.pickerContentContainer}>
                {regions.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Chargement des régions...</Text>
                  </View>
                ) : getFilteredRegions().length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucune région trouvée</Text>
                  </View>
                ) : (
                  <FlatList
                    data={getFilteredRegions()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        style={index === getFilteredRegions().length - 1 ? styles.pickerItemLast : styles.pickerItem}
                        onPress={async () => {
                          if (isOcrWine) {
                            setEditedWine((prev: any) => ({ ...(prev || {}), region: item.name }));
                            setShowRegionPicker(false);
                            await loadAppellationsByRegion(item.name);
                          } else {
                            // Mise à jour optimiste immédiate
                            console.log('🔄 Mise à jour optimiste région:', item.name);
                            setLocalWineUpdates(prev => {
                              const newUpdates = { ...prev, region: item.name };
                              console.log('🔄 localWineUpdates mis à jour:', newUpdates);
                              return newUpdates;
                            });
                            setShowRegionPicker(false);
                            await loadAppellationsByRegion(item.name);
                            try {
                              await updateWine(wineId, { region: item.name });
                              console.log('✅ updateWine réussi pour région');
                              // Ne pas nettoyer immédiatement, laisser la synchronisation se faire naturellement
                            } catch (error) {
                              console.error('Erreur sauvegarde région:', error);
                              Alert.alert('Erreur', 'Impossible de sauvegarder la région');
                              // Revenir à la valeur précédente en cas d'erreur
                              setLocalWineUpdates(prev => {
                                const { region: _, ...rest } = prev;
                                return rest;
                              });
                            }
                          }
                        }}
                      >
                        <Text style={styles.pickerItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    style={styles.pickerList}
                  />
                )}
                
                {/* Champ de saisie libre pour ajouter une nouvelle région */}
                <View style={styles.addNewItemContainer}>
                  <Text style={styles.addNewItemLabel}>Ajouter une nouvelle région :</Text>
                  <TextInput
                    style={styles.addNewItemInput}
                    placeholder="Nom de la région"
                    placeholderTextColor="#666"
                    value={newRegionName}
                    onChangeText={setNewRegionName}
                    autoCorrect={false}
                    autoCapitalize="words"
                    onFocus={() => setKeyboardVisible(true)}
                    onBlur={() => setKeyboardVisible(false)}
                  />
                  <TouchableOpacity
                    style={styles.addNewItemButton}
                    onPress={async () => {
                      if (newRegionName.trim()) {
                        try {
                          // Vérifier si la région existe déjà (insensible à la casse)
                          const existingRegion = regions.find(r => 
                            r.name.toLowerCase() === newRegionName.trim().toLowerCase()
                          );
                          
                          if (existingRegion) {
                            Alert.alert('Région existante', 'Cette région existe déjà dans la liste');
                            return;
                          }
                          
                          // Trouver l'ID du pays
                          const countryId = countries.find(c => c.name === safeWine?.country)?.id;
                          if (!countryId && isOcrWine) {
                            // En OCR, si pas de pays en base, enregistrer la région localement
                            setEditedWine((prev: any) => ({ ...(prev || {}), region: newRegionName.trim() }));
                            setShowRegionPicker(false);
                            setNewRegionName('');
                            return;
                          }
                          if (!countryId) {
                            Alert.alert('Erreur', 'Pays non trouvé. Veuillez d\'abord sélectionner un pays.');
                            return;
                          }
                          
                          // Ajouter la nouvelle région à la base de données
                          const { data, error } = await supabase
                            .from('wine_regions')
                            .insert({
                              name: newRegionName.trim(),
                              country_id: countryId
                            })
                            .select()
                            .single();
                          
                          if (error) throw error;
                          
                          // Mettre à jour la liste locale
                          setRegions(prev => [...prev, data]);
                          
                          // Sélectionner la nouvelle région
                          if (isOcrWine) {
                            setEditedWine((prev: any) => ({ ...(prev || {}), region: data.name }));
                          } else {
                            await updateWine(wineId, { region: data.name });
                          }
                          setShowRegionPicker(false);
                          setNewRegionName('');
                          
                          Alert.alert('Succès', 'Nouvelle région ajoutée et sélectionnée');
                        } catch (error) {
                          console.error('Erreur ajout région:', error);
                          Alert.alert('Erreur', 'Impossible d\'ajouter la région');
                        }
                      }
                    }}
                  >
                    <Text style={styles.addNewItemButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

{/* Modal Appellation: saisie + ajout par + puis Valider */}
<Modal visible={showAppellationPicker} transparent animationType="slide" onRequestClose={() => setShowAppellationPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAppellationPicker(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerModal, { paddingBottom: 16 }]}>
              <View style={[styles.modalHeader, styles.modalHeaderNoDivider]}>
                <Text style={styles.pickerTitle}>Appellation(s)</Text>
                <TouchableOpacity onPress={() => setShowAppellationPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
        <View style={styles.pickerBody}>
          <View style={styles.inlineAddRow}>
            <TextInput
              style={[styles.addNewItemInput, styles.inlineAddInput]}
              placeholder="Ajouter une appellation"
              placeholderTextColor="#666"
              value={appellationInput}
              onChangeText={setAppellationInput}
              autoCorrect={false}
              autoCapitalize="sentences"
            />
            <TouchableOpacity
              style={[styles.addNewItemButton, styles.inlineAddButton]}
              onPress={() => {
                const v = (appellationInput || '').trim();
                if (!v) return;
                if (!appellationItems.includes(v)) setAppellationItems(prev => [...prev, v]);
                setAppellationInput('');
              }}
            >
              <Ionicons name="add" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          {appellationItems.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {appellationItems.map((it, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#000' }}>{it}</Text>
                  <TouchableOpacity onPress={() => setAppellationItems(prev => prev.filter(x => x !== it))} style={{ marginLeft: 6 }}>
                    <Ionicons name="close-circle" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              const value = appellationItems.join(', ');
              try {
                if (isOcrWine) {
                  setEditedWine((prev: any) => ({ ...(prev || {}), appellation: value }));
                } else {
                  await updateWine(wineId, { appellation: value });
                }
                // Update optimiste local pour affichage immédiat
                setLocalWineUpdates(prev => ({ ...prev, appellation: value }));
                setShowAppellationPicker(false);
              } catch (e) {
                Alert.alert('Erreur', 'Impossible de sauvegarder');
              }
            }}
          >
            <Text style={styles.addNewItemButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

{/* Modal Cépages: saisie + ajout par + puis Valider */}
<Modal visible={showGrapesPicker} transparent animationType="slide" onRequestClose={() => setShowGrapesPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGrapesPicker(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerModal, { paddingBottom: 16 }]}>
              <View style={[styles.modalHeader, styles.modalHeaderNoDivider]}>
                <Text style={styles.pickerTitle}>Cépage(s)</Text>
                <TouchableOpacity onPress={() => setShowGrapesPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
        <View style={styles.pickerBody}>
          <View style={styles.inlineAddRow}>
            <TextInput
              style={[styles.addNewItemInput, styles.inlineAddInput]}
              placeholder="Ajouter un cépage"
              placeholderTextColor="#666"
              value={grapeInput}
              onChangeText={setGrapeInput}
              autoCorrect={false}
              autoCapitalize="sentences"
            />
            <TouchableOpacity
              style={[styles.addNewItemButton, styles.inlineAddButton]}
              onPress={() => {
                const v = (grapeInput || '').trim();
                if (!v) return;
                if (!grapeItems.includes(v)) setGrapeItems(prev => [...prev, v]);
                setGrapeInput('');
              }}
            >
              <Ionicons name="add" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          {grapeItems.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {grapeItems.map((it, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#000' }}>{it}</Text>
                  <TouchableOpacity onPress={() => setGrapeItems(prev => prev.filter(x => x !== it))} style={{ marginLeft: 6 }}>
                    <Ionicons name="close-circle" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              const list = [...grapeItems];
              try {
                if (isOcrWine) {
                  setEditedWine((prev: any) => ({ ...(prev || {}), grapes: list }));
                } else {
                  await updateWine(wineId, { grapes: list });
                }
                // Update optimiste local pour affichage immédiat
                setLocalWineUpdates(prev => ({ ...prev, grapes: list }));
                setShowGrapesPicker(false);
              } catch (e) {
                Alert.alert('Erreur', 'Impossible de sauvegarder');
              }
            }}
          >
            <Text style={styles.addNewItemButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de dégustation */}
      <TastingNoteModal
        visible={tastingModalVisible}
        onClose={handleCancelTasting}
        onSave={handleConfirmTasting}
        wineName={selectedWineForTasting?.name || ''}
      />

      {/* Modal d'actions */}
      <Modal
        visible={showActionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.actionsModal}>
              {getMenuOptions().map((option, index) => {
                // Déterminer l'icône selon l'action
                let iconName = 'ellipsis-horizontal';
                let iconColor = '#FFFFFF';
                
                if (option.title === 'Partager') {
                  iconName = 'share';
                } else if (option.title === 'Déplacer vers liste d\'envie') {
                  iconName = 'heart-outline';
                } else if (option.title === 'Ajouter à ma cave') {
                  iconName = 'add-circle-outline';
                } else if (option.title === 'Ajouter à ma liste d\'envie') {
                  iconName = 'heart-outline';
                } else if (option.title === 'Marquer comme dégusté') {
                  iconName = 'checkmark-circle-outline';
                } else if (option.title === 'Supprimer') {
                  iconName = 'trash-outline';
                  iconColor = '#FF4444';
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      index === 0 && styles.actionButtonFirst,
                      index === getMenuOptions().length - 1 && styles.actionButtonLast
                    ]}
                    onPress={() => {
                      setShowActionsModal(false);
                      option.action();
                    }}
                  >
                    <Ionicons name={iconName} size={20} color={iconColor} />
                    <Text style={[
                      styles.actionButtonText,
                      option.destructive && styles.actionButtonTextDestructive
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  debugText: {
    fontSize: 12,
    color: '#FF0000',
    marginBottom: 8,
    backgroundColor: '#333',
    padding: 4,
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  moreButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    position: 'relative',
    width: 200, // Largeur fixe
    height: 300, // Hauteur fixe
    alignSelf: 'center', // Centrer l'image
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 20, // Coins plus arrondis
    marginBottom: 20,
  },
  wineImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Crop pour s'adapter au ratio 3:2
  },
  wineTypeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  wineTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  wineTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  mainInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  wineName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  wineProducer: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CCCCCC',
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    marginRight: 8,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  wineTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wineTypeIcon: {
    marginRight: 8,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  stockSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#393C40',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  stockCountReadOnly: {
    fontSize: 18,
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 8,
  },
  ratingSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginTop: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  tastingSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginTop: 32,
  },
  tastingCriteria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  criteriaLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    flex: 1,
  },
  criteriaStars: {
    flexDirection: 'row',
    gap: 8,
  },
  descriptionSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginTop: 32,
  },
  commentSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginTop: 32,
  },
  noteContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  tastingNoteInput: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#2a2a2a',
    minHeight: 50,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 6,
    paddingRight: 40, // Espace pour le bouton de suppression
  },
  noteDate: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  deleteNoteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteInput: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#2a2a2a',
    minHeight: 50,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginTop: 16,
  },
  // Styles pour la modal d'actions
  actionsModal: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingTop: 8,
    paddingBottom: 12, // Plus d'espace en bas pour compenser l'absence de bordure
    paddingHorizontal: 0,
    minWidth: 220,
    maxWidth: 280,
    maxHeight: 300, // Limiter la hauteur maximale
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
    minHeight: 56,
  },
  actionButtonFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  actionButtonLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'left',
    marginLeft: 12,
    flex: 1,
  },
  actionButtonTextDestructive: {
    color: '#FF4444',
  },
  socialSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    paddingTop: 0,
    marginTop: 32,
  },
  socialItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  socialItemLast: {
    borderBottomWidth: 0,
  },
  socialText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  historyItemLast: {
    borderBottomWidth: 0,
  },
  historyDate: {
    fontSize: 14,
    color: '#CCCCCC',
    width: 100,
    textAlign: 'left',
  },
  historyAction: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'left',
    marginLeft: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#2a2a2a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  historySection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginTop: 32,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  modalActionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  pickerModal: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerBody: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalHeaderNoDivider: {
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  pickerContentContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#2a2a2a',
    minHeight: 100,
  },
  pickerList: {
    flex: 1,
    minHeight: 100,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  pickerItemLast: {
    padding: 16,
    borderBottomWidth: 0,
  },
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemIcon: {
    marginRight: 12,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  grapeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grapeColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  addNewItemContainer: {
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 'auto',
    minHeight: 120,
  },
  addNewItemLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  addNewItemInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineAddInput: {
    flex: 1,
    marginBottom: 0,
  },
  inlineAddButton: {
    paddingHorizontal: 12,
  },
  addNewItemButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 160,
    alignItems: 'center',
  },
  addNewItemButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerItemSelected: {
    backgroundColor: '#333333',
  },
  pickerItemTextSelected: {
    color: VeeniColors.accent,
    fontWeight: '600',
  },
  pickerItemWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tastingCriteria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  tastingCriteriaLast: {
    borderBottomWidth: 0,
  },
  criteriaLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  criteriaStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  tastingNoteLabel: {
    fontSize: 12,
    color: '#F6A07A',
    marginTop: 4,
    fontStyle: 'italic',
  },
});