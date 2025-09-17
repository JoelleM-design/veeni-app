import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TastingNoteModal } from '../components/TastingNoteModal';
import { VeeniColors } from '../constants/Colors';
import { useFriendsWithWine } from '../hooks/useFriendsWithWine';
import { useSharedCave } from '../hooks/useSharedCave';
import { useUser } from '../hooks/useUser';
import { useWineHistory } from '../hooks/useWineHistory';
import { useWines } from '../hooks/useWines';
import { supabase } from '../lib/supabase';

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
  console.log(`📏 Modal height calculation: items=${itemCount}, search=${hasSearch}, add=${hasAddSection}, keyboard=${keyboardHeight}, height=${finalHeight}`);
  
  return finalHeight;
};

interface EditableWineDetailsScreenProps {
  wineId: string;
  isReadOnly?: boolean;
  isSharedCave?: boolean;
  sharedWith?: string;
  isFromOcr?: boolean;
  tab?: 'cellar' | 'wishlist' | 'tasted';
}

export default function EditableWineDetailsScreen({ 
  wineId, 
  isReadOnly = false, 
  isSharedCave = false, 
  sharedWith,
  isFromOcr = false,
  tab = 'cellar'
}: EditableWineDetailsScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { wines, updateWine, addWineToWishlist, addWineToCellar, removeWineFromWishlist, removeWineFromCellar, fetchWines, notifyUpdate } = useWines();
  
  // Mode lecture pour les profils visités (priorité aux paramètres de la fonction)
  const isReadOnlyMode = params.readOnly === 'true' || isReadOnly;
  const friendId = params.friendId as string;
  const isVisitedReadOnly = isReadOnlyMode && !!friendId;
  const { tastedWines, fetchTastedWines, fetchHistory, addTasting } = useWineHistory();
  const { user } = useUser();
  const { sharedCave } = useSharedCave();

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

  // (déplacé plus bas après l'initialisation de safeWine)

  useEffect(() => {
    const loadSourceUserIfMissing = async () => {
      try {
        if (!user || !wineId) return;
        // Si déjà présent sur le vin, inutile
        if ((wine as any)?.sourceUser) return;
        // Chercher le source_user_id sur user_wine
        const { data: uw } = await supabase
          .from('user_wine')
          .select('source_user_id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .single();
        const sid = uw?.source_user_id as string | undefined;
        if (!sid) return;
        const { data: src } = await supabase
          .from('User')
          .select('id, first_name, avatar')
          .eq('id', sid)
          .single();
        if (src) setSourceUserLocal({ id: String(src.id), first_name: src.first_name || undefined, avatar: src.avatar || undefined });
        // Récupérer l'origine (cave ou liste) chez l'ami source
        const friendUw = await supabase
          .from('user_wine')
          .select('origin')
          .eq('user_id', sid)
          .eq('wine_id', wineId)
          .maybeSingle();
        setSourceFriendOrigin(friendUw.data?.origin === 'wishlist' ? 'wishlist' : friendUw.data?.origin === 'cellar' ? 'cellar' : null);
      } catch (_) {
        // silencieux
      }
    };
    loadSourceUserIfMissing();
  }, [user, wineId, wine]);

  // Fonction pour mettre à jour un vin (gère le cas OCR)
  const updateWineSafe = async (wineId: string, updates: any) => {
    if (isFromOcr && ocrWineData) {
      // Pour les vins OCR, on met à jour les données locales
      console.log('🍷 Mise à jour locale OCR:', updates);
      setOcrWineData(prev => ({ ...prev, ...updates }));
      return;
    } else {
      // Pour les vins normaux, on utilise la fonction updateWine
      return await updateWine(wineId, updates);
    }
  };

  // Fonction pour ajouter le vin à la liste d'envie (mode lecture)
  const handleAddToWishlist = async () => {
    if (!safeWine || !user) return;
    try {
      // Passer friendId pour renseigner source_user_id
      const enriched = friendId ? { ...safeWine, friendId } : safeWine;
      await addWineToWishlist(enriched as any);
      Alert.alert('Succès', 'Vin ajouté à votre liste d\'envie !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la liste d\'envie:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le vin à votre liste d\'envie');
    }
  };
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showAppellationPicker, setShowAppellationPicker] = useState(false);
  const [showGrapesPicker, setShowGrapesPicker] = useState(false);
  const [personalComment, setPersonalComment] = useState('');
  const [rating, setRating] = useState(0);
  const [tastingProfile, setTastingProfile] = useState({
    power: 0,
    tannin: 0,
    acidity: 0,
    sweetness: 0
  });
  const [description, setDescription] = useState('');
  const tastingUpdateTimer = useRef<any>(null);
  
  // Mode édition pour les vins OCR
  const [isEditing, setIsEditing] = useState(isFromOcr);
  const [editedWine, setEditedWine] = useState<any>(null);
  
  // Données du vin OCR passées via les paramètres
  const [ocrWineData, setOcrWineData] = useState<any>(null);
  
  // États pour les sélecteurs
  const [showVintagePicker, setShowVintagePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);
  const [showGrapePicker, setShowGrapePicker] = useState(false);
  
  // États pour la modale de dégustation
  const [tastingModalVisible, setTastingModalVisible] = useState(false);
  const [selectedWineForTasting, setSelectedWineForTasting] = useState<any>(null);
  
  // Données de référence
  const [vintageYears, setVintageYears] = useState<number[]>([]);
  const [countries, setCountries] = useState<{id: string, name: string, flag_emoji: string}[]>([]);
  const [designations, setDesignations] = useState<{id: string, name: string}[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<{id: string, name: string}[]>([]);
  
  // Données de hiérarchie viticole
  const [regions, setRegions] = useState<{id: string, name: string}[]>([]);
  const [appellations, setAppellations] = useState<{id: string, name: string}[]>([]);
  const [grapes, setGrapes] = useState<{id: string, name: string, color: string}[]>([]);
  
  // États pour la recherche
  const [countrySearchText, setCountrySearchText] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<{id: string, name: string, flag_emoji: string}[]>([]);
  const [isCountriesLoaded, setIsCountriesLoaded] = useState(false);
  
  // États pour l'ajout de nouvelles valeurs
  const [newRegionName, setNewRegionName] = useState('');
  const [newAppellationName, setNewAppellationName] = useState('');
  const [newGrapeName, setNewGrapeName] = useState('');
  
  // États pour la recherche dans les modales
  const [regionSearchText, setRegionSearchText] = useState('');
  const [appellationSearchText, setAppellationSearchText] = useState('');
  const [grapesSearchText, setGrapesSearchText] = useState('');
  
  // États pour le clavier
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Options fixes
  const priceRanges = ['€', '€€', '€€€', '€€€€'];

  // Créer une liste combinée de tous les vins (cave + dégustés)
  const allWines = [
    ...wines,
    ...tastedWines.map((entry) => ({
      ...entry.wine,
      lastTastedAt: entry.lastTastedAt,
      tastingCount: entry.tastingCount,
      origin: 'tasted',
    })),
  ];

  // Vérifier s'il y a des données de vin passées en paramètres
  let wineDataFromParams = null;
  if (params.wineData) {
    try {
      const parsedData = JSON.parse(params.wineData as string);
      
      if (parsedData && typeof parsedData === 'object') {
        if (parsedData.id || parsedData.name) {
          wineDataFromParams = parsedData;
        } else {
          console.warn('Données wineData invalides: champs requis manquants');
        }
      } else {
        console.warn('Données wineData invalides: format incorrect');
      }
    } catch (error) {
      console.error('Erreur parsing wineData:', error);
    }
  }

  // Fallback: vin distant (profil ami)
  const [remoteWine, setRemoteWine] = useState<any | null>(null);

  useEffect(() => {
    const loadRemoteWineIfNeeded = async () => {
      if (remoteWine || !wineId) return;
      // Ne charger à distance que si on est en lecture et qu'on n'a pas trouvé dans la liste locale
      const alreadyInLocal = allWines.find(w => w?.id === wineId);
      if (alreadyInLocal) return;
      try {
        // Récupérer le vin
        const { data: wineData, error: wineError } = await supabase
          .from('wine')
          .select(`
            id, name, year, wine_type, region, image_uri,
            producer ( name ),
            country ( name )
          `)
          .eq('id', wineId)
          .single();
        if (wineError) throw wineError;

        // Récupérer le contexte user_wine pour le friend (stock/favorite/origin)
        let amount = 0; let favorite = false; let origin: 'cellar' | 'wishlist' = 'cellar';
        if (friendId) {
          const { data: uw } = await supabase
            .from('user_wine')
            .select('amount, favorite, origin')
            .eq('user_id', friendId)
            .eq('wine_id', wineId)
            .single();
          if (uw) { amount = uw.amount || 0; favorite = !!uw.favorite; origin = (uw.origin || 'cellar'); }
        }

        const mapped = {
          id: String(wineData.id),
          name: String(wineData.name || ''),
          vintage: wineData.year ? parseInt(wineData.year) : 0,
          domaine: wineData.producer?.name || 'Domaine inconnu',
          color: (wineData.wine_type || 'red'),
          region: wineData.region || '',
          country: wineData.country?.name || '',
          priceRange: '',
          appellation: '',
          grapes: [],
          power: 0, tannin: 0, acidity: 0, sweetness: 0,
          description: '',
          imageUri: wineData.image_uri || undefined,
          note: 0,
          origin,
          stock: origin === 'wishlist' ? 0 : amount,
          personalComment: '',
          tastingProfile: { power: 0, tannin: 0, acidity: 0, sweetness: 0 },
          history: [],
          favorite,
          createdAt: undefined,
          updatedAt: undefined,
        };
        setRemoteWine(mapped);
      } catch (e) {
        console.error('❌ Erreur chargement vin distant:', e);
      }
    };
    if (isReadOnlyMode) loadRemoteWineIfNeeded();
  }, [isReadOnlyMode, wineId, friendId, allWines, remoteWine]);

  // Trouver le vin dans la liste combinée ou utiliser les données passées
  // Pour les vins OCR, prioriser les données mises à jour (ocrWineData) sur les données originales
  const wine = (isFromOcr && ocrWineData) ? ocrWineData : (wineDataFromParams || allWines.find(w => w?.id === wineId) || remoteWine);
  console.log('[EditableWineDetailsScreen] Diagnostic:', { 
    wineId, 
    wineFound: !!wine, 
    allWinesCount: allWines.length,
    winesCount: wines.length,
    tastedWinesCount: tastedWines.length,
    wineDataFromParams: !!wineDataFromParams,
    ocrWineData: !!ocrWineData
  });
  const safeWine = wine || null;

  // Valeurs à afficher (ami en lecture seule vs moi)
  const displayRating = isVisitedReadOnly ? (friendUW?.rating ?? 0) : rating;
  const displayTastingProfile = isVisitedReadOnly ? (friendUW?.tasting_profile ?? { power: 0, tannin: 0, acidity: 0, sweetness: 0 }) : tastingProfile;
  const displayFavorite = isVisitedReadOnly ? !!friendUW?.favorite : !!(safeWine && (safeWine as any).favorite);

  // Si le vin n'existe plus, rediriger vers la liste
  useEffect(() => {
    if (!isReadOnlyMode && allWines.length > 0 && !wine) {
      console.log('Vin non trouvé, redirection vers la liste');
      router.back();
    }
  }, [allWines, wine, router, isReadOnlyMode]);

  // Historique du vin
  const wineHistory = wine?.history || [];
  // Amis possédant aussi ce vin (pour fallback d'affichage)
  const { friendsWithWine } = useFriendsWithWine(String(wineId));
  const firstFriendForDisplay = Array.isArray(friendsWithWine) && friendsWithWine.length > 0
    ? { id: String(friendsWithWine[0].id), first_name: friendsWithWine[0].firstName, avatar: friendsWithWine[0].avatar }
    : undefined;
  // Origine sociale pour affichage (même source que la carte) avec fallback ami commun
  // En visite: si l'utilisateur a ce vin en wishlist (même sans source), afficher "Ajouté à la liste d'envie de Moi"
  const fallbackVisitedSocial = isVisitedReadOnly && showVisitedWishlistDest ? { id: String(user?.id || ''), first_name: user?.first_name, avatar: user?.avatar } : undefined;
  const sourceUserForDisplay = (safeWine as any)?.sourceUser || sourceUserLocal || firstFriendForDisplay;
  // Entrée sociale synthétique (si wishlist + source connue)
  const computedSocialHistory = (safeWine?.origin === 'wishlist' && sourceUserForDisplay)
    ? [{
        id: `social-${safeWine?.id}`,
        event_type: 'added_to_wishlist',
        event_date: safeWine?.createdAt || new Date().toISOString(),
        notes: `Ajouté depuis la cave/liste d'envie de ${sourceUserForDisplay.first_name || 'un ami'}`,
        _social: true
      }]
    : [] as any[];
  // Liste d'historique affichée = entrée sociale (si présente) + historique DB trié
  const displayHistory = [
    ...computedSocialHistory,
    ...((wineHistory || [])
      .filter((entry: any, index: number, self: any[]) => index === self.findIndex((e: any) => e.id === entry.id))
      .sort((a: any, b: any) => new Date(b.event_date || b.created_at).getTime() - new Date(a.event_date || a.created_at).getTime()))
  ];
  
  // Récupérer la dernière note de dégustation depuis l'historique
  const lastTastingNote = wineHistory
    .filter((entry: any) => entry.event_type === 'tasted' && entry.notes)
    .sort((a: any, b: any) => new Date(b.event_date || b.created_at).getTime() - new Date(a.event_date || a.created_at).getTime())
    [0]?.notes || '';

  useEffect(() => {
    if (safeWine) {
      console.log('🔄 Chargement des données du vin:', {
        wineId: safeWine.id,
        personalComment: safeWine.personalComment,
        note: safeWine.note
      });
      setPersonalComment(safeWine.personalComment || '');
      setRating(safeWine.note || 0);
      setTastingProfile(safeWine.tastingProfile || {
        power: 0,
        tannin: 0,
        acidity: 0,
        sweetness: 0
      });
      setDescription(safeWine.description || '');
      
      // Initialiser les données d'édition
      if (isFromOcr) {
        setEditedWine({
          name: safeWine.name,
          domaine: safeWine.domaine,
          vintage: safeWine.vintage,
          region: safeWine.region,
          grapes: Array.isArray(safeWine.grapes) ? safeWine.grapes : [],
          color: safeWine.color,
          personalComment: safeWine.personalComment || '',
          note: safeWine.note || 0,
          tastingProfile: safeWine.tastingProfile || {
            power: 0,
            tannin: 0,
            acidity: 0,
            sweetness: 0
          },
          description: safeWine.description || ''
        });
      }
    }
  }, [safeWine?.id, isFromOcr]);

  // Charger les données de référence
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Rafraîchir la fiche quand on revient sur l'écran (pour voir les champs nouvellement remplis)
  useFocusEffect(
    useCallback(() => {
      // Recharger depuis Supabase
      fetchWines();
      // Re-synchroniser l'historique des dégustations
      fetchTastedWines();
      fetchHistory();
      return () => {};
    }, [fetchWines, fetchTastedWines, fetchHistory])
  );

  // Charger les données du vin OCR depuis les paramètres
  useEffect(() => {
    if (isFromOcr && params.wineData) {
      try {
        const wineData = JSON.parse(params.wineData as string);
        setOcrWineData(wineData);
        console.log('🍷 Données vin OCR chargées:', wineData);
        console.log('🍷 Détails OCR - country:', wineData.country, 'region:', wineData.region, 'appellation:', wineData.appellation);
      } catch (error) {
        console.error('Erreur parsing données vin OCR:', error);
      }
    }
  }, [isFromOcr, params.wineData]);

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

  // Charger les régions quand le pays change
  useEffect(() => {
    if (safeWine?.country) {
      loadRegionsByCountry(safeWine.country);
    }
  }, [safeWine?.country]);

  // Charger les appellations quand la région change
  useEffect(() => {
    if (safeWine?.region) {
      loadAppellationsByRegion(safeWine.region);
    }
  }, [safeWine?.region]);

  // Charger les cépages quand l'appellation change
  useEffect(() => {
    if (safeWine?.appellation) {
      loadGrapesByAppellation(safeWine.appellation);
    }
  }, [safeWine?.appellation]);

  // Recharger les pays quand la modale s'ouvre
  useEffect(() => {
    if (showCountryPicker && countries.length === 0) {
      console.log('🔄 Rechargement des pays car modale ouverte et liste vide');
      loadReferenceData();
    }
  }, [showCountryPicker, countries.length]);

  // Charger les pays pour les clés étrangères (utilise la variable countries existante)
  useEffect(() => {
    const loadCountriesForForeignKeys = async () => {
      try {
        const { data, error } = await supabase
          .from('wine_countries')
          .select('id, name')
          .order('name');
        if (error) throw error;
        // Mettre à jour la variable countries existante avec les données nécessaires
        setCountries(prev => {
          const existingCountries = prev || [];
          const newCountries = data || [];
          // Fusionner les données existantes avec les nouvelles
          return newCountries.map(country => ({
            ...country,
            flag_emoji: existingCountries.find(c => c.id === country.id)?.flag_emoji || '🏳️'
          }));
        });
      } catch (error) {
        console.error('Erreur chargement pays:', error);
      }
    };
    loadCountriesForForeignKeys();
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
      
      // Charger les régions si un pays est sélectionné
      if (safeWine?.country) {
        await loadRegionsByCountry(safeWine.country);
      }
    } catch (error) {
      console.error('Erreur chargement données référence:', error);
    }
  };

  // Fonctions pour charger la hiérarchie viticole
  const loadRegionsByCountry = async (countryName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_regions_by_country', {
        country_name: countryName
      });
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Erreur chargement régions:', error);
    }
  };

  const loadAppellationsByRegion = async (regionName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_appellations_by_region', {
        region_name: regionName
      });
      if (error) throw error;
      setAppellations(data || []);
    } catch (error) {
      console.error('Erreur chargement appellations:', error);
    }
  };

  const loadGrapesByAppellation = async (appellationName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_grapes_by_appellation', {
        appellation_name: appellationName
      });
      if (error) throw error;
      setGrapes(data || []);
    } catch (error) {
      console.error('Erreur chargement cépages:', error);
    }
  };

  // Fonctions de filtrage pour la recherche
  const getFilteredRegions = () => {
    if (!regionSearchText.trim()) return regions;
    return regions.filter(region => 
      region.name.toLowerCase().includes(regionSearchText.toLowerCase())
    );
  };

  const getFilteredAppellations = () => {
    if (!appellationSearchText.trim()) return appellations;
    return appellations.filter(appellation => 
      appellation.name.toLowerCase().includes(appellationSearchText.toLowerCase())
    );
  };

  const getFilteredGrapes = () => {
    if (!grapesSearchText.trim()) return grapes;
    return grapes.filter(grape => 
      grape.name.toLowerCase().includes(grapesSearchText.toLowerCase())
    );
  };

  // Filtrer les pays selon la recherche
  const filterCountries = (searchText: string) => {
    console.log('🔍 filterCountries appelé avec:', searchText);
    setCountrySearchText(searchText);
    if (searchText.trim() === '') {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  // Effacer la recherche quand on ouvre le picker
  const openCountryPicker = () => {
    setCountrySearchText('');
    setFilteredCountries(countries);
    setShowCountryPicker(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveChanges = async () => {
    if (!editedWine || !safeWine) return;
    
    try {
      // Si on vient de l'OCR avec des données temporaires, on ne sauvegarde pas en DB
      // On met juste à jour les données locales et on retourne à l'écran OCR
      if (isFromOcr && ocrWineData) {
        console.log('🍷 Mise à jour des données OCR:', editedWine);
        // Mettre à jour les données OCR locales
        setOcrWineData(editedWine);
        setIsEditing(false);
        
        // Retourner à l'écran OCR avec les données mises à jour
        router.replace({
          pathname: '/ocr-results',
          params: { 
            wines: JSON.stringify([editedWine]), // Passer le vin modifié
            updatedWineId: editedWine.id
          }
        });
        return;
      }
      
      // Mettre à jour le vin avec les nouvelles données (cas normal)
      await updateWine(wineId, {
        name: editedWine.name,
        domaine: editedWine.domaine,
        vintage: editedWine.vintage,
        region: editedWine.region,
        grapes: editedWine.grapes,
        color: editedWine.color,
        personalComment: editedWine.personalComment,
        note: editedWine.note,
        tastingProfile: editedWine.tastingProfile,
        description: editedWine.description
      });
      
      // Sortir du mode édition
      setIsEditing(false);
      
      // Si on vient de l'OCR, retourner à la liste des résultats
      if (isFromOcr) {
        router.back();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

  // Fonction pour annuler les modifications
  const handleCancelEdit = () => {
    if (isFromOcr) {
      router.back();
    } else {
      setIsEditing(false);
      setEditedWine({
        name: safeWine?.name,
        domaine: safeWine?.domaine,
        vintage: safeWine?.vintage,
        region: safeWine?.region,
        grapes: Array.isArray(safeWine?.grapes) ? safeWine.grapes : [],
        color: safeWine?.color,
        personalComment: safeWine?.personalComment || '',
        note: safeWine?.note || 0,
        tastingProfile: safeWine?.tastingProfile || {
          fruit: 0,
          acidity: 0,
          tannins: 0,
          body: 0,
          finish: 0
        },
        description: safeWine?.description || ''
      });
    }
  };

  // Fonction pour gérer le toggle des favoris
  const handleToggleFavorite = () => {
    console.log("[Like] EditableWineDetailsScreen - wineId:", safeWine?.id, "newFavoriteValue:", !safeWine?.favorite);
    if (safeWine) {
      updateWineSafe(wineId, { favorite: !safeWine.favorite }).then(() => {
        notifyUpdate?.();
      });
    }
  };

  // Fonction pour ajouter une bouteille
  const handleAddBottle = async () => {
    if (safeWine) {
      console.log('➕ Ajout de stock dans fiche détaillée:', {
        wineId,
        currentStock: safeWine.stock,
        newStock: (safeWine.stock || 0) + 1
      });
      await updateWineSafe(wineId, { stock: (safeWine.stock || 0) + 1 });
      // Rafraîchir les données pour mettre à jour l'UI
      await fetchWines();
      await fetchTastedWines();
      await fetchHistory();
    }
  };

  // Fonction pour retirer une bouteille
  const handleRemoveBottle = () => {
    if (safeWine && safeWine.stock > 0) {
      // Ouvrir la modale de dégustation au lieu de réduire directement le stock
      setSelectedWineForTasting(safeWine);
      setTastingModalVisible(true);
    }
  };

  // Fonction pour confirmer la dégustation
  const handleConfirmTasting = async (rating: number, notes?: string) => {
    if (!selectedWineForTasting) return;

    try {
      console.log('🔄 handleConfirmTasting: Vin sélectionné:', selectedWineForTasting);
      
      // Utiliser addTasting pour créer l'entrée dans wine_history avec la note
      const result = await addTasting(selectedWineForTasting.id, notes);
      
      if (result && result.success) {
        // Supprimer une bouteille après la dégustation
        const currentStock = selectedWineForTasting.stock || selectedWineForTasting.amount || 0;
        console.log('🔄 handleConfirmTasting: Stock actuel:', currentStock, 'Nouveau stock:', currentStock - 1);
        
        if (currentStock > 0) {
          await updateWine(selectedWineForTasting.id, { stock: currentStock - 1 });
          console.log('✅ handleConfirmTasting: Stock mis à jour');
        }
        
        // Fermer la modale et rafraîchir les données
        setTastingModalVisible(false);
        setSelectedWineForTasting(null);
        await fetchWines();
        await fetchTastedWines();
        await fetchHistory();
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer la dégustation');
      }
    } catch (error) {
      console.error('Erreur lors de la dégustation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la dégustation');
    }
  };

  // Fonction pour annuler la dégustation
  const handleCancelTasting = () => {
    setTastingModalVisible(false);
    setSelectedWineForTasting(null);
  };

  // Fonction pour déplacer vers la wishlist
  const handleMoveToWishlist = async () => {
    if (safeWine) {
      try {
        // Vérifier les doublons avant de déplacer
        const wishlistWines = wines.filter(w => w.origin === 'wishlist' && w.id !== safeWine.id);
        const { checkWineDuplicate, getDuplicateErrorMessage } = await import('../lib/wineDuplicateDetection');
        const duplicateCheck = checkWineDuplicate(safeWine, wishlistWines);
        
        if (duplicateCheck.isDuplicate) {
          const errorMessage = getDuplicateErrorMessage(duplicateCheck, 'wishlist');
          Alert.alert('Attention', errorMessage);
          return;
        }

        // Déplacer le vin vers la wishlist
        await updateWineSafe(wineId, { origin: 'wishlist' });
        setShowActionsModal(false);
      } catch (error) {
        console.error('Erreur déplacement vers wishlist:', error);
        Alert.alert('Attention', error instanceof Error ? error.message : 'Impossible de déplacer le vin');
      }
    }
  };

  // Fonction pour déplacer vers la cave
  const handleMoveToCellar = async () => {
    if (safeWine) {
      try {
        // Vérifier les doublons avant de déplacer
        const cellarWines = wines.filter(w => w.origin === 'cellar' && w.id !== safeWine.id);
        const { checkWineDuplicate, getDuplicateErrorMessage } = await import('../lib/wineDuplicateDetection');
        const duplicateCheck = checkWineDuplicate(safeWine, cellarWines);
        
        if (duplicateCheck.isDuplicate) {
          // Pour la cave, on peut ajouter une bouteille supplémentaire
          const existingWine = duplicateCheck.existingWine;
          if (existingWine) {
            await updateWine(existingWine.id, { stock: (existingWine.stock || 0) + 1 });
            setShowActionsModal(false);
            return;
          }
        }

        // Déplacer le vin vers la cave
        await updateWineSafe(wineId, { origin: 'cellar', stock: 1 });
        setShowActionsModal(false);
      } catch (error) {
        console.error('Erreur déplacement vers cave:', error);
        Alert.alert('Attention', error instanceof Error ? error.message : 'Impossible de déplacer le vin');
      }
    }
  };

  // Fonction pour sauvegarder le commentaire
  const handleSaveComment = async () => {
    if (safeWine && personalComment.trim() && user?.id) {
      console.log('📝 Sauvegarde de note personnelle:', {
        wineId,
        comment: personalComment
      });
      
      // Sauvegarder le commentaire
      console.log('💾 Sauvegarde du commentaire dans user_wine:', personalComment);
      await updateWineSafe(wineId, { personalComment });
      console.log('✅ Commentaire sauvegardé avec succès');
      
      // Créer une entrée dans l'historique directement dans Supabase
      const { error } = await supabase
        .from('wine_history')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          event_type: 'noted',
          event_date: new Date().toISOString(),
          notes: personalComment,
          rating: rating || null
        });
      
      if (error) {
        console.error('❌ Erreur lors de l\'ajout de la note dans l\'historique:', error);
      } else {
        console.log('✅ Note ajoutée dans l\'historique');
      }
      
      // Rafraîchir les données
      await fetchWines();
      await fetchTastedWines();
      await fetchHistory();
    }
  };

  // Fonction pour sauvegarder la description
  const handleSaveDescription = () => {
    if (safeWine) {
      updateWineSafe(wineId, { description });
    }
  };

  // Fonction pour définir la note
  const handleSetRating = async (newRating: number) => {
    setRating(newRating);
    if (safeWine && user?.id) {
      console.log('⭐ Sauvegarde de note:', {
        wineId,
        rating: newRating
      });
      
      // Sauvegarder la note
      await updateWineSafe(wineId, { note: newRating });
      
      // Créer une entrée dans l'historique directement dans Supabase
      const { error } = await supabase
        .from('wine_history')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          event_type: 'noted',
          event_date: new Date().toISOString(),
          rating: newRating,
          notes: personalComment || null
        });
      
      if (error) {
        console.error('❌ Erreur lors de l\'ajout de la note dans l\'historique:', error);
      } else {
        console.log('✅ Note ajoutée dans l\'historique');
      }
      
      // Rafraîchir les données
      await fetchWines();
      await fetchTastedWines();
      await fetchHistory();
    }
  };

  // Fonction pour définir un critère de dégustation
  const handleSetTastingCriteria = (criteria: string, value: number) => {
    const newTastingProfile = { ...tastingProfile, [criteria]: value };
    setTastingProfile(newTastingProfile);
    if (tastingUpdateTimer.current) clearTimeout(tastingUpdateTimer.current);
    tastingUpdateTimer.current = setTimeout(() => {
      if (safeWine) {
        updateWineSafe(wineId, { tastingProfile: newTastingProfile });
      }
    }, 200);
  };


  // États locaux pour les champs en cours d'édition
  const [editingFields, setEditingFields] = useState<{[key: string]: string}>({});

  // Fonction pour mettre à jour un champ éditables avec debounce
  const handleFieldUpdate = useCallback(async (field: string, value: string | number) => {
    if (safeWine) {
      try {
        console.log('🔄 handleFieldUpdate:', { field, value, wineId });
        await updateWineSafe(wineId, { [field]: value });
        console.log('✅ handleFieldUpdate: Sauvegarde réussie');
        // Pas besoin de fetchWines() ici car updateWineSafe() le fait déjà
      } catch (error) {
        console.error('❌ Erreur mise à jour champ:', error);
      }
    }
  }, [safeWine, wineId, updateWineSafe]);

  // Fonction pour gérer le changement de texte (sans sauvegarde immédiate)
  const handleFieldChange = (field: string, value: string) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour sauvegarder un champ quand on quitte le focus
  const handleFieldBlur = (field: string) => {
    const value = editingFields[field];
    console.log('🔄 handleFieldBlur:', { field, value, hasValue: value !== undefined, safeWine: !!safeWine });
    if (value !== undefined && safeWine) {
      console.log('✅ handleFieldBlur: Appel de handleFieldUpdate');
      handleFieldUpdate(field, value);
      setEditingFields(prev => {
        const newFields = { ...prev };
        delete newFields[field];
        return newFields;
      });
    } else {
      console.log('❌ handleFieldBlur: Pas de sauvegarde - value:', value, 'safeWine:', !!safeWine);
    }
  };

  // Fonction pour gérer le focus des champs texte
  const handleFieldFocus = (field: string, currentValue: string, placeholder: string) => {
    // Si le champ contient le placeholder, le vider
    if (currentValue === placeholder) {
      setEditingFields(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fonction pour rendre un critère de dégustation
  const renderTastingCriteria = (label: string, criteria: string, value: number) => {
    return (
      <View style={styles.tastingCriteria}>
        <Text style={styles.criteriaLabel}>{label}</Text>
        <View style={styles.criteriaStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleSetTastingCriteria(criteria, star)}
            >
              <Ionicons
                name={star <= value ? 'star' : 'star-outline'}
                size={24}
                color={star <= value ? '#FFD700' : '#CCC'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Fonction pour supprimer le vin
  const handleDeleteWine = () => {
    Alert.alert(
      'Supprimer le vin',
      'Êtes-vous sûr de vouloir supprimer ce vin ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (safeWine?.origin === 'wishlist') {
                await removeWineFromWishlist(String(safeWine.id));
              } else {
                await removeWineFromCellar(String(safeWine.id));
              }
              await fetchWines();
              notifyUpdate();
              router.replace('/(tabs)/mes-vins');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le vin');
            }
          },
        },
      ]
    );
    setShowActionsModal(false);
  };

  // Fonction pour partager le vin
  const handleShareWine = () => {
    // TODO: Implémenter le partage
    Alert.alert('Partage', 'Fonctionnalité de partage à venir');
    setShowActionsModal(false);
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

  // Fonction pour obtenir la couleur des cépages
  const getGrapeColor = (color: string) => {
    switch (color) {
      case 'red': return '#8B0000';
      case 'white': return '#F5F5DC';
      case 'rose': return '#FFB6C1';
      case 'sparkling': return '#FFF8DC';
      default: return '#666666';
    }
  };

  // Fonction pour rendre les étoiles
  const renderStars = (currentRating: number, onPress?: (rating: number) => void) => {
    const interactive = typeof onPress === 'function';
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          interactive ? (
            <TouchableOpacity key={star} onPress={() => onPress?.(star)}>
              <Ionicons
                name={star <= currentRating ? 'star' : 'star-outline'}
                size={32}
                color={star <= currentRating ? '#FFD700' : '#CCC'}
              />
            </TouchableOpacity>
          ) : (
            <View key={star}>
              <Ionicons
                name={star <= currentRating ? 'star' : 'star-outline'}
                size={32}
                color={star <= currentRating ? '#FFD700' : '#CCC'}
              />
            </View>
          )
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

  // Affichage social (destination) en mode visite: état + vérification DB
  const [showVisitedWishlistDest, setShowVisitedWishlistDest] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isVisitedReadOnly || !user?.id || !friendId || !wineId) {
          if (mounted) setShowVisitedWishlistDest(false);
          return;
        }
        // 1) Vérifier wishlist avec source explicite (préféré)
        const { data, error } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .eq('origin', 'wishlist')
          .eq('source_user_id', friendId)
          .limit(1);
        if (!mounted) return;
        if (data && data.length > 0 && data[0]?.wine_id) {
          setShowVisitedWishlistDest(true);
        } else {
          // 2) Fallback: si la colonne source_user_id n'a pas été prise en compte à l'insertion
          const { data: anyWishlist } = await supabase
            .from('user_wine')
            .select('wine_id')
            .eq('user_id', user.id)
            .eq('wine_id', wineId)
            .eq('origin', 'wishlist')
            .limit(1);
          if (!mounted) return;
          setShowVisitedWishlistDest(!!(anyWishlist && anyWishlist.length > 0 && anyWishlist[0]?.wine_id));
        }
      } catch (_) {
        if (mounted) setShowVisitedWishlistDest(false);
      }
    })();
    return () => { mounted = false; };
  }, [isVisitedReadOnly, user?.id, friendId, wineId]);

  // Détection indépendante: est-ce que MOI (utilisateur courant) ai ce vin en wishlist ?
  const [hasMyWishlistEntry, setHasMyWishlistEntry] = useState(false);
  const [hasMyCellarEntry, setHasMyCellarEntry] = useState(false);
  const [hasMyTasted, setHasMyTasted] = useState(false);
  const hasMyAny = hasMyWishlistEntry || hasMyCellarEntry;
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.id || !wineId) { if (mounted) setHasMyWishlistEntry(false); return; }
        const { data } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .eq('origin', 'wishlist')
          .limit(1);
        if (!mounted) return;
        setHasMyWishlistEntry(!!(data && data.length > 0));
      } catch (_) {
        if (mounted) setHasMyWishlistEntry(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, wineId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.id || !wineId) { if (mounted) setHasMyTasted(false); return; }
        const { data } = await supabase
          .from('wine_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .eq('event_type', 'tasted')
          .limit(1);
        if (!mounted) return;
        setHasMyTasted(!!(data && data.length > 0));
      } catch (_) {
        if (mounted) setHasMyTasted(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, wineId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.id || !wineId) { if (mounted) setHasMyCellarEntry(false); return; }
        const { data } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .eq('origin', 'cellar')
          .limit(1);
        if (!mounted) return;
        setHasMyCellarEntry(!!(data && data.length > 0));
      } catch (_) {
        if (mounted) setHasMyCellarEntry(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, wineId]);

  // Social (inspiration sortante): qui a ajouté ce vin à sa wishlist depuis MA cave
  const [inspiredUsers, setInspiredUsers] = useState<Array<{ id: string; first_name?: string; avatar?: string }>>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isVisitedReadOnly || !user?.id || !wineId) { if (mounted) setInspiredUsers([]); return; }
        const { data, error } = await supabase
          .from('user_wine')
          .select('user_id, origin, source_user_id, User:user_id(id, first_name, avatar)')
          .eq('wine_id', wineId)
          .eq('origin', 'wishlist')
          .eq('source_user_id', user.id);
        if (!mounted) return;
        if (error) { setInspiredUsers([]); return; }
        const mapped = (data || [])
          .map((r: any) => r.User)
          .filter(Boolean)
          .map((u: any) => ({ id: String(u.id), first_name: u.first_name, avatar: u.avatar }));
        setInspiredUsers(mapped);
      } catch (_) {
        if (mounted) setInspiredUsers([]);
      }
    })();
    return () => { mounted = false; };
  }, [isVisitedReadOnly, user?.id, wineId]);

  // Amis ayant ce vin en cave / wishlist
  const [friendsCellar, setFriendsCellar] = useState<Array<{ id: string; first_name?: string; avatar?: string }>>([]);
  const [friendsWishlist, setFriendsWishlist] = useState<Array<{ id: string; first_name?: string; avatar?: string }>>([]);
  const [friendsTasted, setFriendsTasted] = useState<Array<{ id: string; first_name?: string; avatar?: string }>>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.id || !wineId) { if (mounted) { setFriendsCellar([]); setFriendsWishlist([]); } return; }

        // Récupérer amis (bidirectionnel)
        const [fFrom, fTo] = await Promise.all([
          supabase.from('friend').select('friend_id').eq('user_id', user.id).eq('status', 'accepted'),
          supabase.from('friend').select('user_id').eq('friend_id', user.id).eq('status', 'accepted')
        ]);
        if (fFrom.error || fTo.error) { if (mounted) { setFriendsCellar([]); setFriendsWishlist([]); } return; }
        const friendIds = Array.from(new Set([...(fFrom.data || []).map((r: any) => r.friend_id), ...(fTo.data || []).map((r: any) => r.user_id)]));
        if (friendIds.length === 0) { if (mounted) { setFriendsCellar([]); setFriendsWishlist([]); } return; }

        // Récupérer entrées user_wine des amis pour ce vin par origin
        const [{ data: uwCellar }, { data: uwWishlist }, { data: tastedRows }] = await Promise.all([
          supabase.from('user_wine').select('user_id').in('user_id', friendIds).eq('wine_id', wineId).eq('origin', 'cellar'),
          supabase.from('user_wine').select('user_id').in('user_id', friendIds).eq('wine_id', wineId).eq('origin', 'wishlist'),
          supabase.from('wine_history').select('user_id').in('user_id', friendIds).eq('wine_id', wineId).eq('event_type', 'tasted')
        ]);

        const cellarIds = Array.from(new Set((uwCellar || []).map((r: any) => r.user_id)));
        const wishlistIds = Array.from(new Set((uwWishlist || []).map((r: any) => r.user_id)));
        const tastedIds = Array.from(new Set((tastedRows || []).map((r: any) => r.user_id)));

        const [cellarUsers, wishlistUsers, tastedUsers] = await Promise.all([
          cellarIds.length ? supabase.from('User').select('id, first_name, avatar').in('id', cellarIds) : Promise.resolve({ data: [] as any[] }),
          wishlistIds.length ? supabase.from('User').select('id, first_name, avatar').in('id', wishlistIds) : Promise.resolve({ data: [] as any[] }),
          tastedIds.length ? supabase.from('User').select('id, first_name, avatar').in('id', tastedIds) : Promise.resolve({ data: [] as any[] })
        ]);

        if (!mounted) return;
        setFriendsCellar((cellarUsers.data || []).map((u: any) => ({ id: String(u.id), first_name: u.first_name, avatar: u.avatar })));
        setFriendsWishlist((wishlistUsers.data || []).map((u: any) => ({ id: String(u.id), first_name: u.first_name, avatar: u.avatar })));
        setFriendsTasted((tastedUsers.data || []).map((u: any) => ({ id: String(u.id), first_name: u.first_name, avatar: u.avatar })));
      } catch (_) {
        if (mounted) { setFriendsCellar([]); setFriendsWishlist([]); setFriendsTasted([]); }
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, wineId]);

  if (!safeWine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter} />
        
        <View style={styles.headerRight}>
          {!isReadOnlyMode && (
            <>
              {/* Bouton favori */}
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                  name={safeWine.favorite ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={safeWine.favorite ? VeeniColors.wine.red : '#FFFFFF'} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowActionsModal(true)} style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
          
          {/* Bouton + en lecture retiré: remplacé par le gros bouton fixe bas */}
        </View>
      </View>

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
        {/* Image du vin - Même ratio que WineCard */}
        <View style={styles.imageContainer}>
          <ExpoImage
            source={
              safeWine.imageUri
                ? { uri: `${safeWine.imageUri}?t=${Date.now()}` }
                : require('../assets/images/default-wine.png')
            }
            style={styles.wineImage}
            contentFit="cover"
            onLoad={() => {}}
            onError={() => {}}
          />
        </View>

        {/* Informations principales */}
        <View style={styles.mainInfo}>
          {isVisitedReadOnly ? (
            <>
              {!!safeWine.name && (
                <Text style={styles.wineName}>{safeWine.name}</Text>
              )}
              {!!safeWine.domaine && safeWine.domaine !== 'Domaine inconnu' && (
                <Text style={styles.wineProducer}>{safeWine.domaine}</Text>
              )}
            </>
          ) : (
            <>
              <TextInput
                style={styles.wineName}
                value={editingFields.name !== undefined ? editingFields.name : (safeWine.name || '')}
                onChangeText={(text) => handleFieldChange('name', text)}
                onFocus={() => handleFieldFocus('name', safeWine.name || '', 'Nom inconnu')}
                onBlur={() => handleFieldBlur('name')}
                placeholder="Nom du vin"
                placeholderTextColor="#666"
                multiline
                autoCorrect={false}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.wineProducer}
                value={editingFields.domaine !== undefined ? editingFields.domaine : (safeWine.domaine || '')}
                onChangeText={(text) => handleFieldChange('domaine', text)}
                onFocus={() => handleFieldFocus('domaine', safeWine.domaine || '', 'Domaine inconnu')}
                onBlur={() => handleFieldBlur('domaine')}
                placeholder="Domaine"
                placeholderTextColor="#666"
                multiline
                autoCorrect={false}
                autoCapitalize="words"
              />
            </>
          )}
        </View>

        {/* Informations détaillées avec structure titre/valeur */}
        <View style={styles.detailsSection}>
          {/* Millésime */}
          {(!isVisitedReadOnly || !!safeWine.vintage) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Millésime</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) setShowVintagePicker(true); }}
            >
              <Text style={styles.detailValueText}>
                {safeWine.vintage || 'Sélectionner'}
              </Text>
              {!isVisitedReadOnly && <Ionicons name="chevron-down" size={16} color="#CCCCCC" />}
            </TouchableOpacity>
          </View>
          )}

          {/* Type de vin */}
          {(!isVisitedReadOnly || !!safeWine.color) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) setShowColorPicker(true); }}
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
                {!isVisitedReadOnly && (
                  <Ionicons name="chevron-down" size={16} color="#CCCCCC" style={styles.chevronIcon} />
                )}
              </View>
            </TouchableOpacity>
          </View>
          )}

          {/* Pays */}
          {(!isVisitedReadOnly || !!safeWine.country) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pays</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) openCountryPicker(); }}
            >
              <Text style={styles.detailValueText}>
                {safeWine.country ? 
                  `${countries.find(c => c.name === safeWine.country)?.flag_emoji || '🏳️'} ${safeWine.country}` : 
                  'Sélectionner'
                }
              </Text>
              {!isVisitedReadOnly && <Ionicons name="chevron-down" size={16} color="#CCCCCC" />}
            </TouchableOpacity>
          </View>
          )}

          {/* Valeur */}
          {(!isVisitedReadOnly || !!safeWine.priceRange) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valeur</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) setShowPricePicker(true); }}
            >
              <Text style={styles.detailValueText}>
                {safeWine.priceRange || 'Sélectionner'}
              </Text>
              {!isVisitedReadOnly && <Ionicons name="chevron-down" size={16} color="#CCCCCC" />}
            </TouchableOpacity>
          </View>
          )}

          {/* Région */}
          {(!isVisitedReadOnly || !!safeWine.region) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Région</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) setShowRegionPicker(true); }}
            >
              <Text style={styles.detailValueText}>
                {safeWine.region || 'Sélectionner'}
              </Text>
              {!isVisitedReadOnly && <Ionicons name="chevron-down" size={16} color="#CCCCCC" />}
            </TouchableOpacity>
          </View>
          )}

          {/* Appellation */}
          {(!isVisitedReadOnly || !!safeWine.appellation) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Appellation</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) setShowAppellationPicker(true); }}
            >
              <Text style={styles.detailValueText}>
                {safeWine.appellation || 'Sélectionner'}
              </Text>
              {!isVisitedReadOnly && <Ionicons name="chevron-down" size={16} color="#CCCCCC" />}
            </TouchableOpacity>
          </View>
          )}

          {/* Cépages */}
          {(!isVisitedReadOnly || (Array.isArray(safeWine?.grapes) && safeWine.grapes.length > 0)) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cépage</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={() => { if (!isVisitedReadOnly) setShowGrapesPicker(true); }}
            >
              <Text style={styles.detailValueText}>
                {Array.isArray(safeWine?.grapes) && safeWine.grapes.length > 0 
                  ? safeWine.grapes.join(', ') 
                  : 'Sélectionner'
                }
              </Text>
              <Ionicons name="chevron-down" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* Stock */}
        {safeWine.origin === 'cellar' && !isVisitedReadOnly && (
          <View style={styles.stockSection}>
            <Text style={styles.sectionTitle}>Stock</Text>
            <View style={styles.stockControls}>
              <TouchableOpacity onPress={handleRemoveBottle} style={styles.stockButton}>
                <Ionicons name="remove" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.stockCount}>{safeWine.stock || 0}</Text>
              <TouchableOpacity onPress={handleAddBottle} style={styles.stockButton}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Note et évaluation */}
        {(!isVisitedReadOnly || displayRating > 0) && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Ma note</Text>
            {renderStars(displayRating, isVisitedReadOnly ? undefined : handleSetRating)}
          </View>
        )}

        {/* Profil de dégustation */}
        {(!isVisitedReadOnly || (displayTastingProfile.power + displayTastingProfile.tannin + displayTastingProfile.acidity + displayTastingProfile.sweetness > 0)) && (
          <View style={styles.tastingSection}>
            <Text style={styles.sectionTitle}>Profil de dégustation</Text>
            {renderTastingCriteria('Puissance', 'power', displayTastingProfile.power)}
            {renderTastingCriteria('Tanin', 'tannin', displayTastingProfile.tannin)}
            {renderTastingCriteria('Acidité', 'acidity', displayTastingProfile.acidity)}
            {renderTastingCriteria('Sucré', 'sweetness', displayTastingProfile.sweetness)}
          </View>
        )}

        {/* Descriptif */}
        {(!isVisitedReadOnly || (description?.trim().length > 0)) && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descriptif</Text>
            {isVisitedReadOnly ? (
              <Text style={[styles.textArea, { borderWidth: 0, backgroundColor: 'transparent', padding: 0 }]}>
                {description || ''}
              </Text>
            ) : (
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Ajoutez une description du vin..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                onBlur={handleSaveDescription}
              />
            )}
          </View>
        )}

        {/* Note personnelle */}
        {(
          !isVisitedReadOnly ||
          ((lastTastingNote?.trim()?.length || 0) > 0 || (personalComment?.trim()?.length || 0) > 0) ||
          (isVisitedReadOnly && (friendUW?.personal_comment || '').trim().length > 0)
        ) && (
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Note personnelle</Text>
            {isVisitedReadOnly ? (
              <Text style={[styles.textArea, { borderWidth: 0, backgroundColor: 'transparent', padding: 0 }]}>
                {friendUW?.personal_comment || lastTastingNote || personalComment || ''}
              </Text>
            ) : (
              <TextInput
                style={styles.textArea}
                value={lastTastingNote || personalComment}
                onChangeText={setPersonalComment}
                placeholder="Ajoutez vos notes personnelles..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                onBlur={handleSaveComment}
              />
            )}
          </View>
        )}

        {/* Historique */}
        {(!isVisitedReadOnly || displayHistory.length > 0) && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {displayHistory.length > 0 ? (
            displayHistory
              .map((entry: any, index: number) => {
                const getEventDescription = (event: any) => {
                  if (!event || typeof event !== 'object') return 'Action effectuée';
                  
                  switch (event.event_type) {
                    case 'added_to_cellar':
                      return `Ajouté à la cave (${event.new_amount || 1} bouteille${(event.new_amount || 1) > 1 ? 's' : ''})`;
                    case 'added_to_wishlist':
                      return 'Ajouté à la liste d\'envie';
                    case 'added':
                      return 'Ajouté';
                    case 'stock_change':
                      return `Stock modifié : ${event.previous_amount || 0} → ${event.new_amount || 0} bouteille${(event.new_amount || 0) > 1 ? 's' : ''}`;
                    case 'rating_change':
                      return `Note modifiée : ${event.rating || 0}/5`;
                    case 'origin_change':
                      return String(event.notes || 'Origine modifiée');
                    case 'tasted':
                      return `Dégusté (${event.rating || 0}/5)`;
                    case 'noted':
                      const noteText = event.notes ? `Note personnelle: "${event.notes}"` : '';
                      const ratingText = event.rating ? `Note: ${event.rating}/5` : '';
                      return [noteText, ratingText].filter(Boolean).join(' - ') || 'Note ajoutée';
                    default:
                      // Traduction basique des clés éventuelles
                      const map: Record<string, string> = {
                        added: 'Ajouté',
                        favorited: 'Ajouté aux favoris',
                        removed: 'Supprimé'
                      };
                      return map[String(event.event_type)] || 'Action effectuée';
                  }
                };

                const description = String(getEventDescription(entry) || 'Action effectuée');

                return (
                  <View key={`${entry.id}-${index}`} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{formatDate(entry.event_date || entry.created_at || '')}</Text>
                    <Text style={styles.historyAction}>{description}</Text>
                  </View>
                );
              })
          ) : (
            !isVisitedReadOnly && <Text style={styles.noHistoryText}>Aucun historique disponible</Text>
          )}
        </View>
        )}
        {/* Social */}
        {/* En visite (lecture seule): afficher la destination si confirmée; sinon, rien */}
        {/* Chez soi: afficher l'origine si connue */}
        {isVisitedReadOnly ? (
          showVisitedWishlistDest ? (
            <View style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Social</Text>
              <View style={styles.historySocialRow}>
                <Text style={styles.socialPrefixText} numberOfLines={1}>Ajouté à la liste d'envie de</Text>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.historyAvatar} />
                ) : (
                  <View style={styles.historyAvatarPlaceholder}>
                    <Text style={styles.historyAvatarInitial}>
                      {(user?.first_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{user?.first_name || 'vous'}</Text>
              </View>
            </View>
          ) : null
        ) : (
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Social</Text>

            {/* 4) Ajouté depuis la cave d'un ami (ma wishlist avec source) OU  (visite -> déjà géré plus haut) */}
            {(sourceUserForDisplay && !isVisitedReadOnly) && (
              <View style={styles.historySocialRow}>
                <Text style={styles.socialPrefixText} numberOfLines={1}>Ajouté depuis la {sourceFriendOrigin === 'wishlist' ? 'liste' : 'cave'} de</Text>
                {sourceUserForDisplay.avatar ? (
                  <Image source={{ uri: sourceUserForDisplay.avatar }} style={styles.historyAvatar} />
                ) : (
                  <View style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(sourceUserForDisplay.first_name || '?').charAt(0).toUpperCase()}</Text></View>
                )}
                <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{sourceUserForDisplay.first_name || 'un ami'}</Text>
              </View>
            )}

            {/* 2) Amis qui ont ce vin en cave */}
            {friendsCellar.length > 0 && (
              <View style={styles.historySocialRow}>
                {friendsCellar.length === 1 ? (
                  <>
                    <Text style={styles.socialPrefixText}>Aussi dans la cave de</Text>
                    {friendsCellar[0].avatar ? (
                      <Image source={{ uri: friendsCellar[0].avatar }} style={styles.historyAvatar} />
                    ) : (
                      <View style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(friendsCellar[0].first_name || '?').charAt(0).toUpperCase()}</Text></View>
                    )}
                    <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{friendsCellar[0].first_name || 'un ami'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.socialPrefixText}> {friendsCellar.length} ami(s) ont ce vin dans leur cave</Text>
                    <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                      {friendsCellar.slice(0, 3).map(f => (
                        f.avatar ? <Image key={f.id} source={{ uri: f.avatar }} style={styles.historyAvatar} /> : (
                          <View key={f.id} style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(f.first_name || '?').charAt(0).toUpperCase()}</Text></View>
                        )
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* 3) Amis qui ont ce vin en wishlist */}
            {friendsWishlist.length > 0 && (
              <View style={styles.historySocialRow}>
                {friendsWishlist.length === 1 ? (
                  <>
                    <Text style={styles.socialPrefixText}>Aussi dans la liste de</Text>
                    {friendsWishlist[0].avatar ? (
                      <Image source={{ uri: friendsWishlist[0].avatar }} style={styles.historyAvatar} />
                    ) : (
                      <View style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(friendsWishlist[0].first_name || '?').charAt(0).toUpperCase()}</Text></View>
                    )}
                    <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{friendsWishlist[0].first_name || 'un ami'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.socialPrefixText}>Aussi dans la liste de {friendsWishlist.length} ami(s)</Text>
                    <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                      {friendsWishlist.slice(0, 3).map(f => (
                        f.avatar ? <Image key={f.id} source={{ uri: f.avatar }} style={styles.historyAvatar} /> : (
                          <View key={f.id} style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(f.first_name || '?').charAt(0).toUpperCase()}</Text></View>
                        )
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Aussi dégusté par amis */}
            {friendsTasted.length > 0 && (
              <View style={styles.historySocialRow}>
                {friendsTasted.length === 1 ? (
                  <>
                    <Text style={styles.socialPrefixText}>Aussi dégusté par</Text>
                    {friendsTasted[0].avatar ? (
                      <Image source={{ uri: friendsTasted[0].avatar }} style={styles.historyAvatar} />
                    ) : (
                      <View style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(friendsTasted[0].first_name || '?').charAt(0).toUpperCase()}</Text></View>
                    )}
                    <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{friendsTasted[0].first_name || 'un ami'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.socialPrefixText}>Aussi dégusté par {friendsTasted.length} ami(s)</Text>
                    <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                      {friendsTasted.slice(0, 3).map(f => (
                        f.avatar ? <Image key={f.id} source={{ uri: f.avatar }} style={styles.historyAvatar} /> : (
                          <View key={f.id} style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(f.first_name || '?').charAt(0).toUpperCase()}</Text></View>
                        )
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* 5) Vin en commun — supprimé pour éviter le doublon avec "Aussi dans ..." */}

            {/* Cas visite: par rapport à moi */}
            {isVisitedReadOnly && (
              <>
                {hasMyCellarEntry && (
                  <View style={styles.historySocialRow}>
                    <Text style={styles.socialPrefixText}>Aussi dans la cave de</Text>
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.historyAvatar} />
                    ) : (
                      <View style={styles.historyAvatarPlaceholder}>
                        <Text style={styles.historyAvatarInitial}>{(user?.first_name || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{user?.first_name || 'vous'}</Text>
                  </View>
                )}
                {hasMyWishlistEntry && (
                  <View style={styles.historySocialRow}>
                    <Text style={styles.socialPrefixText}>Aussi dans la liste d'envie de</Text>
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.historyAvatar} />
                    ) : (
                      <View style={styles.historyAvatarPlaceholder}>
                        <Text style={styles.historyAvatarInitial}>{(user?.first_name || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={[styles.socialPrefixText, styles.historyNameText]} numberOfLines={1}>{user?.first_name || 'vous'}</Text>
                  </View>
                )}
                {hasMyTasted && (
                  <View style={styles.historySocialRow}>
                    <Text style={styles.socialPrefixText}>Aussi dégusté par vous</Text>
                  </View>
                )}
              </>
            )}

            {/* 6) Inspiré par moi */}
            {!isVisitedReadOnly && inspiredUsers.length > 0 && (
              <View style={styles.historySocialRow}>
                <Text style={styles.socialPrefixText}>Ce vin a inspiré vos amis :</Text>
                <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                  {inspiredUsers.slice(0, 3).map(f => (
                    f.avatar ? <Image key={f.id} source={{ uri: f.avatar }} style={styles.historyAvatar} /> : (
                      <View key={f.id} style={styles.historyAvatarPlaceholder}><Text style={styles.historyAvatarInitial}>{(f.first_name || '?').charAt(0).toUpperCase()}</Text></View>
                    )
                  ))}
                </View>
              </View>
            )}

            {/* 1) Aucun ami lié */}
            {(friendsCellar.length + friendsWishlist.length === 0 && !sourceUserForDisplay && inspiredUsers.length === 0 && !isVisitedReadOnly) && (
              <View style={styles.historySocialRow}>
                <Text style={styles.socialPrefixText}>Aucun de vos amis n'a ce vin</Text>
              </View>
            )}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bouton fixe: Ajouter à ma liste (lecture/visite) */}
      {isVisitedReadOnly && (
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity style={styles.fixedAddButton} onPress={handleAddToWishlist}>
            <Text style={styles.fixedAddButtonText}>+ ajouter à ma liste</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[
                styles.pickerModal,
                { height: getModalHeight(4, false, false, keyboardHeight) }
              ]}
            >
            <View style={styles.modalHeader}>
              <Text style={styles.pickerTitle}>Sélectionner le type de vin</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContentContainer}>
              <FlatList
                data={[
                  { key: 'red', label: 'Rouge', color: VeeniColors.wine.red },
                  { key: 'white', label: 'Blanc', color: VeeniColors.wine.white },
                  { key: 'rose', label: 'Rosé', color: VeeniColors.wine.rose },
                  { key: 'sparkling', label: 'Effervescent', color: VeeniColors.wine.sparkling },
                ]}
                keyExtractor={(item) => item.key}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={index === 3 ? styles.pickerItemLast : styles.pickerItem}
                    onPress={() => {
                      // Fermer le modal immédiatement
                      setShowColorPicker(false);
                      
                      // Sauvegarder en arrière-plan
                      (async () => {
                        try {
                          console.log('🍷 Sauvegarde type:', item.key, 'pour vin:', wineId);
                          await updateWineSafe(wineId, { color: item.key });
                          // Notifier la liste immédiatement
                          notifyUpdate?.();
                          console.log('✅ Type sauvegardé');
                        } catch (error) {
                          console.error('❌ Erreur sauvegarde type:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder le type');
                        }
                      })();
                    }}
                  >
                    <View style={styles.pickerItemContent}>
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
                )}
                style={styles.pickerList}
              />
            </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.modalAction} onPress={handleShareWine}>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.modalActionText}>Partager</Text>
            </TouchableOpacity>
            
            {safeWine.origin === 'wishlist' ? (
              <TouchableOpacity style={styles.modalAction} onPress={handleMoveToCellar}>
                <Ionicons name="wine" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionText}>Déplacer vers ma cave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.modalAction} onPress={handleMoveToWishlist}>
                <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionText}>Déplacer vers ma wishlist</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.modalAction} onPress={handleDeleteWine}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
              <Text style={[styles.modalActionText, { color: '#FF4444' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
                        try {
                          await updateWineSafe(wineId, { vintage: item });
                          setShowVintagePicker(false);
                        } catch (error) {
                          console.error('Erreur sauvegarde millésime:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder le millésime');
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
                      style={index === regions.length - 1 ? styles.pickerItemLast : styles.pickerItem}
                      onPress={async () => {
                        try {
                          await updateWineSafe(wineId, { region: item.name });
                          setShowRegionPicker(false);
                          // Charger les appellations pour cette région
                          await loadAppellationsByRegion(item.name);
                        } catch (error) {
                          console.error('Erreur sauvegarde région:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder la région');
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
                          await updateWineSafe(wineId, { region: data.name });
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

      {/* Modal sélection appellation */}
      <Modal
        visible={showAppellationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAppellationPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAppellationPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[
                styles.pickerModal,
                { height: getModalHeight(Math.max(appellations.length, 1), appellations.length > 5, true, keyboardHeight) }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner l'appellation</Text>
                <TouchableOpacity onPress={() => setShowAppellationPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* Champ de recherche */}
              {appellations.length > 5 && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher une appellation..."
                    placeholderTextColor="#666"
                    value={appellationSearchText}
                    onChangeText={setAppellationSearchText}
                    autoCorrect={false}
                    autoCapitalize="words"
                    onFocus={() => setKeyboardVisible(true)}
                    onBlur={() => setKeyboardVisible(false)}
                  />
                </View>
              )}
              
              <View style={styles.pickerContentContainer}>
                {appellations.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Aucune appellation trouvée</Text>
                  </View>
                ) : getFilteredAppellations().length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucune appellation trouvée</Text>
                  </View>
                ) : (
                  <FlatList
                    data={getFilteredAppellations()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={index === appellations.length - 1 ? styles.pickerItemLast : styles.pickerItem}
                      onPress={async () => {
                        try {
                          await updateWineSafe(wineId, { appellation: item.name });
                          setShowAppellationPicker(false);
                          // Charger les cépages pour cette appellation
                          await loadGrapesByAppellation(item.name);
                        } catch (error) {
                          console.error('Erreur sauvegarde appellation:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder l\'appellation');
                        }
                      }}
                    >
                      <Text style={styles.pickerItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                    style={styles.pickerList}
                  />
                )}
                
                {/* Champ de saisie libre pour ajouter une nouvelle appellation */}
                <View style={styles.addNewItemContainer}>
                <Text style={styles.addNewItemLabel}>Ajouter une nouvelle appellation :</Text>
                <TextInput
                  style={styles.addNewItemInput}
                  placeholder="Nom de l'appellation"
                  placeholderTextColor="#666"
                  value={newAppellationName}
                  onChangeText={setNewAppellationName}
                  autoCorrect={false}
                  autoCapitalize="words"
                  onFocus={() => setKeyboardVisible(true)}
                  onBlur={() => setKeyboardVisible(false)}
                />
                <TouchableOpacity
                  style={styles.addNewItemButton}
                  onPress={async () => {
                    if (newAppellationName.trim()) {
                      try {
                        // Vérifier si l'appellation existe déjà (insensible à la casse)
                        const existingAppellation = appellations.find(a => 
                          a.name.toLowerCase() === newAppellationName.trim().toLowerCase()
                        );
                        
                        if (existingAppellation) {
                          Alert.alert('Appellation existante', 'Cette appellation existe déjà dans la liste');
                          return;
                        }
                        
                        // Trouver l'ID de la région actuelle
                        const currentRegion = regions.find(r => r.name === safeWine?.region);
                        if (!currentRegion) {
                          Alert.alert('Erreur', 'Veuillez d\'abord sélectionner une région');
                          return;
                        }
                        
                        // Ajouter la nouvelle appellation à la base de données
                        const { data, error } = await supabase
                          .from('wine_appellations')
                          .insert({
                            name: newAppellationName.trim(),
                            region_id: currentRegion.id
                          })
                          .select()
                          .single();
                        
                        if (error) throw error;
                        
                        // Mettre à jour la liste locale
                        setAppellations(prev => [...prev, data]);
                        
                        // Sélectionner la nouvelle appellation
                        await updateWineSafe(wineId, { appellation: data.name });
                        setShowAppellationPicker(false);
                        setNewAppellationName('');
                        
                        Alert.alert('Succès', 'Nouvelle appellation ajoutée et sélectionnée');
                      } catch (error) {
                        console.error('Erreur ajout appellation:', error);
                        Alert.alert('Erreur', 'Impossible d\'ajouter l\'appellation');
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

      {/* Modal sélection cépages */}
      <Modal
        visible={showGrapesPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGrapesPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGrapesPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[
                styles.pickerModal,
                { height: getModalHeight(Math.max(grapes.length, 1), grapes.length > 5, true, keyboardHeight) }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner les cépages</Text>
                <TouchableOpacity onPress={() => setShowGrapesPicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* Champ de recherche */}
              {grapes.length > 5 && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un cépage..."
                    placeholderTextColor="#666"
                    value={grapesSearchText}
                    onChangeText={setGrapesSearchText}
                    autoCorrect={false}
                    autoCapitalize="words"
                    onFocus={() => setKeyboardVisible(true)}
                    onBlur={() => setKeyboardVisible(false)}
                  />
                </View>
              )}
              
              <View style={styles.pickerContentContainer}>
                {grapes.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Aucun cépage trouvé</Text>
                  </View>
                ) : getFilteredGrapes().length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucun cépage trouvé</Text>
                  </View>
                ) : (
                  <FlatList
                    data={getFilteredGrapes()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={index === grapes.length - 1 ? styles.pickerItemLast : styles.pickerItem}
                      onPress={async () => {
                        try {
                          // Pour les cépages, on ajoute à la liste existante
                          const currentGrapes = Array.isArray(safeWine?.grapes) ? safeWine.grapes : [];
                          const newGrapes = currentGrapes.includes(item.name) 
                            ? currentGrapes.filter(g => g !== item.name)
                            : [...currentGrapes, item.name];
                          
                          await updateWineSafe(wineId, { grapes: newGrapes });
                          setShowGrapesPicker(false);
                        } catch (error) {
                          console.error('Erreur sauvegarde cépages:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder les cépages');
                        }
                      }}
                    >
                      <View style={styles.grapeItem}>
                        <Text style={styles.pickerItemText}>{item.name}</Text>
                        <View style={[styles.grapeColorIndicator, { backgroundColor: getGrapeColor(item.color) }]} />
                      </View>
                    </TouchableOpacity>
                  )}
                    style={styles.pickerList}
                  />
                )}
                
                {/* Champ de saisie libre pour ajouter un nouveau cépage */}
                <View style={styles.addNewItemContainer}>
                <Text style={styles.addNewItemLabel}>Ajouter un nouveau cépage :</Text>
                <TextInput
                  style={styles.addNewItemInput}
                  placeholder="Nom du cépage"
                  placeholderTextColor="#666"
                  value={newGrapeName}
                  onChangeText={setNewGrapeName}
                  autoCorrect={false}
                  autoCapitalize="words"
                  onFocus={() => setKeyboardVisible(true)}
                  onBlur={() => setKeyboardVisible(false)}
                />
                <TouchableOpacity
                  style={styles.addNewItemButton}
                  onPress={async () => {
                    if (newGrapeName.trim()) {
                      try {
                        // Vérifier si le cépage existe déjà (insensible à la casse)
                        const existingGrape = grapes.find(g => 
                          g.name.toLowerCase() === newGrapeName.trim().toLowerCase()
                        );
                        
                        if (existingGrape) {
                          Alert.alert('Cépage existant', 'Ce cépage existe déjà dans la liste');
                          return;
                        }
                        
                        // Ajouter le nouveau cépage à la base de données
                        const { data, error } = await supabase
                          .from('wine_grape_varieties')
                          .insert({
                            name: newGrapeName.trim(),
                            color: 'red' // Par défaut, on peut améliorer cela plus tard
                          })
                          .select()
                          .single();
                        
                        if (error) throw error;
                        
                        // Mettre à jour la liste locale
                        setGrapes(prev => [...prev, data]);
                        
                        // Ajouter le nouveau cépage à la sélection
                        const currentGrapes = Array.isArray(safeWine?.grapes) ? safeWine.grapes : [];
                        const newGrapes = [...currentGrapes, data.name];
                        
                        await updateWineSafe(wineId, { grapes: newGrapes });
                        setShowGrapesPicker(false);
                        setNewGrapeName('');
                        
                        Alert.alert('Succès', 'Nouveau cépage ajouté et sélectionné');
                      } catch (error) {
                        console.error('Erreur ajout cépage:', error);
                        Alert.alert('Erreur', 'Impossible d\'ajouter le cépage');
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

      {/* Modal sélection pays */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCountryPicker(false);
          setCountrySearchText('');
          setFilteredCountries(countries);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCountryPicker(false);
            setCountrySearchText('');
            setFilteredCountries(countries);
          }}
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
                  onChangeText={filterCountries}
                  autoCorrect={false}
                  autoCapitalize="none"
                  autoFocus={false}
                  blurOnSubmit={false}
                  onFocus={() => console.log('🔍 Focus sur recherche pays')}
                  onBlur={() => console.log('🔍 Blur sur recherche pays')}
                />
              </View>
            )}
            
            <View style={styles.pickerContentContainer}>
              {!isCountriesLoaded ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement des pays...</Text>
                </View>
              ) : filteredCountries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun pays trouvé</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={index === filteredCountries.length - 1 ? styles.pickerItemLast : styles.pickerItem}
                      onPress={() => {
                        // Fermer le modal immédiatement
                        setShowCountryPicker(false);
                        setCountrySearchText('');
                        setFilteredCountries(countries);
                        
                        // Sauvegarder en arrière-plan
                        (async () => {
                          try {
                            console.log('🌍 Sauvegarde pays:', item.name, 'pour vin:', wineId);
                            await updateWineSafe(wineId, { country: item.name });
                            console.log('✅ Pays sauvegardé');
                          } catch (error) {
                            console.error('❌ Erreur sauvegarde pays:', error);
                            Alert.alert('Erreur', 'Impossible de sauvegarder le pays');
                          }
                        })();
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

      {/* Modal sélection prix */}
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
              { height: getModalHeight(Math.max(priceRanges.length, 1), false, false, keyboardHeight) }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.pickerTitle}>Sélectionner la gamme de prix</Text>
                <TouchableOpacity onPress={() => setShowPricePicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContentContainer}>
                <FlatList
                  data={priceRanges}
                  keyExtractor={(item) => item}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={index === priceRanges.length - 1 ? styles.pickerItemLast : styles.pickerItem}
                      onPress={async () => {
                        try {
                          await updateWineSafe(wineId, { priceRange: item });
                          setShowPricePicker(false);
                        } catch (error) {
                          console.error('Erreur sauvegarde prix:', error);
                          Alert.alert('Erreur', 'Impossible de sauvegarder la gamme de prix');
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

      {/* Modal de dégustation */}
      <TastingNoteModal
        visible={tastingModalVisible}
        onClose={handleCancelTasting}
        onSave={handleConfirmTasting}
        wineName={selectedWineForTasting?.name || ''}
      />
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
  favoriteButton: {
    padding: 8,
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
  },
  addToWishlistButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  fixedBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 64,
    backgroundColor: 'rgba(26,26,26,0.96)',
  },
  fixedAddButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  fixedAddButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
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
  wineTypeBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-end',
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
  colorPickerIcon: {
    marginLeft: 4,
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
    borderBottomColor: '#444',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCCCCC',
    flex: 2,
    textAlign: 'right',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCCCCC',
    marginRight: 8,
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
  socialSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    paddingTop: 0,
    marginTop: 32,
  },
  historySocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  historyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  historyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  historyAvatarInitial: {
    color: '#222',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  historyDate: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  historyAction: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 16,
  },
  socialPrefixText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  historyNameText: {
    marginLeft: 0,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  tastingNoteLabel: {
    fontSize: 12,
    color: '#F6A07A',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    paddingTop: 100, // Position sous la topbar
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
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
  addNewItemButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addNewItemButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
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
  tastingCriteria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
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
});
