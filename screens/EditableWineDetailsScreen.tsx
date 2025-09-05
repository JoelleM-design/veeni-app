import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VeeniColors } from '../constants/Colors';
import { useSharedCave } from '../hooks/useSharedCave';
import { useUser } from '../hooks/useUser';
import { useWineHistory } from '../hooks/useWineHistory';
import { useWines } from '../hooks/useWines';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

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
  const { wines, updateWine, addWineToWishlist, addWineToCellar, fetchWines } = useWines();
  const { tastedWines } = useWineHistory();
  const { user } = useUser();
  const friendsWithWine: any[] = [];
  const { sharedCave } = useSharedCave();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [personalComment, setPersonalComment] = useState('');
  const [rating, setRating] = useState(0);
  const [tastingProfile, setTastingProfile] = useState({
    power: 0,
    tannin: 0,
    acidity: 0,
    sweetness: 0
  });
  const [description, setDescription] = useState('');
  
  // Mode édition pour les vins OCR
  const [isEditing, setIsEditing] = useState(isFromOcr);
  const [editedWine, setEditedWine] = useState<any>(null);
  
  // États pour les sélecteurs
  const [showVintagePicker, setShowVintagePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);
  const [showGrapePicker, setShowGrapePicker] = useState(false);
  
  
  // Données de référence
  const [vintageYears, setVintageYears] = useState<number[]>([]);
  const [countries, setCountries] = useState<{id: string, name: string, flag_emoji: string}[]>([]);
  const [designations, setDesignations] = useState<{id: string, name: string}[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<{id: string, name: string}[]>([]);
  const [selectedGrapes, setSelectedGrapes] = useState<string[]>([]);
  
  // États pour la recherche
  const [countrySearchText, setCountrySearchText] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<{id: string, name: string, flag_emoji: string}[]>([]);
  
  // Options fixes
  const priceRanges = ['€', '€€', '€€€', '€€€€'];
  const regions = [
    'Bordeaux', 'Bourgogne', 'Champagne', 'Alsace', 'Loire', 'Rhône',
    'Languedoc-Roussillon', 'Provence', 'Sud-Ouest', 'Corsica', 'Jura', 'Savoie',
    'Anjou', 'Touraine', 'Sancerre', 'Côtes du Rhône', 'Côtes de Provence'
  ];

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

  // Trouver le vin dans la liste combinée ou utiliser les données passées
  const wine = wineDataFromParams || allWines.find(w => w?.id === wineId);
  console.log('[EditableWineDetailsScreen] Diagnostic:', { 
    wineId, 
    wineFound: !!wine, 
    allWinesCount: allWines.length,
    winesCount: wines.length,
    tastedWinesCount: tastedWines.length,
    wineDataFromParams: !!wineDataFromParams
  });
  const safeWine = wine || null;

  // Si le vin n'existe plus, rediriger vers la liste
  useEffect(() => {
    if (allWines.length > 0 && !wine) {
      console.log('Vin non trouvé, redirection vers la liste');
      router.back();
    }
  }, [allWines, wine, router]);

  // Historique du vin
  const wineHistory = wine?.history || [];

  useEffect(() => {
    if (safeWine) {
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

  const loadReferenceData = async () => {
    try {
      // Charger les années (1800 à année actuelle)
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: currentYear - 1800 + 1 }, (_, i) => 1800 + i).reverse();
      setVintageYears(years);

      // Charger les pays
      const { data: countriesData } = await supabase
        .from('country')
        .select('id, name, flag_emoji')
        .order('name');
      if (countriesData) {
        setCountries(countriesData);
        setFilteredCountries(countriesData);
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
      // Mettre à jour le vin avec les nouvelles données
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
      updateWine(wineId, { favorite: !safeWine.favorite });
    }
  };

  // Fonction pour ajouter une bouteille
  const handleAddBottle = () => {
    if (safeWine) {
      updateWine(wineId, { stock: (safeWine.stock || 0) + 1 });
    }
  };

  // Fonction pour retirer une bouteille
  const handleRemoveBottle = () => {
    if (safeWine && safeWine.stock > 0) {
      updateWine(wineId, { stock: safeWine.stock - 1 });
    }
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
        await updateWine(wineId, { origin: 'wishlist' });
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
        await updateWine(wineId, { origin: 'cellar', stock: 1 });
        setShowActionsModal(false);
      } catch (error) {
        console.error('Erreur déplacement vers cave:', error);
        Alert.alert('Attention', error instanceof Error ? error.message : 'Impossible de déplacer le vin');
      }
    }
  };

  // Fonction pour sauvegarder le commentaire
  const handleSaveComment = () => {
    if (safeWine) {
      updateWine(wineId, { personalComment });
    }
  };

  // Fonction pour sauvegarder la description
  const handleSaveDescription = () => {
    if (safeWine) {
      updateWine(wineId, { description });
    }
  };

  // Fonction pour définir la note
  const handleSetRating = (newRating: number) => {
    setRating(newRating);
    if (safeWine) {
      updateWine(wineId, { note: newRating });
    }
  };

  // Fonction pour définir un critère de dégustation
  const handleSetTastingCriteria = (criteria: string, value: number) => {
    const newTastingProfile = { ...tastingProfile, [criteria]: value };
    setTastingProfile(newTastingProfile);
    if (safeWine) {
      updateWine(wineId, { tastingProfile: newTastingProfile });
    }
  };

  // Fonction pour changer la couleur du vin
  const handleColorChange = (newColor: string) => {
    if (safeWine) {
      updateWine(wineId, { color: newColor });
    }
    setShowColorPicker(false);
  };

  // États locaux pour les champs en cours d'édition
  const [editingFields, setEditingFields] = useState<{[key: string]: string}>({});

  // Fonction pour mettre à jour un champ éditables avec debounce
  const handleFieldUpdate = useCallback(async (field: string, value: string | number) => {
    if (safeWine) {
      try {
        await updateWine(wineId, { [field]: value });
      } catch (error) {
        console.error('Erreur mise à jour champ:', error);
      }
    }
  }, [safeWine, wineId, updateWine]);

  // Fonction pour gérer le changement de texte (sans sauvegarde immédiate)
  const handleFieldChange = (field: string, value: string) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour sauvegarder un champ quand on quitte le focus
  const handleFieldBlur = (field: string) => {
    const value = editingFields[field];
    if (value !== undefined && safeWine) {
      handleFieldUpdate(field, value);
      setEditingFields(prev => {
        const newFields = { ...prev };
        delete newFields[field];
        return newFields;
      });
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
                size={16}
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
              // TODO: Implémenter la suppression
              Alert.alert('Info', 'Fonction de suppression à implémenter');
              router.back();
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
              size={24}
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {safeWine.name || 'Vin'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
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
          <Image
            source={
              safeWine.imageUri
                ? { uri: `${safeWine.imageUri}?t=${Date.now()}` }
                : require('../assets/images/default-wine.png')
            }
            style={styles.wineImage}
            resizeMode="cover"
          />
        </View>

        {/* Informations principales - Éditables */}
        <View style={styles.mainInfo}>
          {/* Nom du vin - Éditable */}
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
          
          {/* Domaine - Éditable */}
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
              style={styles.wineTypeBadgeInline}
              onPress={() => setShowColorPicker(true)}
            >
              <View 
                style={[
                  styles.wineTypeIndicator, 
                  { backgroundColor: getWineTypeColor(safeWine.color) }
                ]} 
              />
              <Text style={styles.wineTypeText}>
                {safeWine.color === 'red' ? 'Rouge' : 
                 safeWine.color === 'white' ? 'Blanc' : 
                 safeWine.color === 'rose' ? 'Rosé' : 
                 safeWine.color === 'sparkling' ? 'Effervescent' : 'Vin'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#333" style={styles.colorPickerIcon} />
            </TouchableOpacity>
          </View>

          {/* Pays */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pays</Text>
            <TouchableOpacity 
              style={styles.detailValue}
              onPress={openCountryPicker}
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
            <TextInput
              style={styles.detailValue}
              value={editingFields.region !== undefined ? editingFields.region : (safeWine.region || '')}
              onChangeText={(text) => handleFieldChange('region', text)}
              onFocus={() => handleFieldFocus('region', safeWine.region || '', 'Languedoc-Roussillon')}
              onBlur={() => handleFieldBlur('region')}
              placeholder="Languedoc-Roussillon"
              placeholderTextColor="#666"
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          {/* Appellation */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Appellation</Text>
            <TextInput
              style={styles.detailValue}
              value={editingFields.appellation !== undefined ? editingFields.appellation : (safeWine.appellation || '')}
              onChangeText={(text) => handleFieldChange('appellation', text)}
              onFocus={() => handleFieldFocus('appellation', safeWine.appellation || '', 'IGP Gard')}
              onBlur={() => handleFieldBlur('appellation')}
              placeholder="IGP Gard"
              placeholderTextColor="#666"
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          {/* Cépages */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cépage</Text>
            <TextInput
              style={styles.detailValue}
              value={editingFields.grapes !== undefined ? editingFields.grapes : (Array.isArray(safeWine?.grapes) ? safeWine.grapes.join(', ') : '')}
              onChangeText={(text) => handleFieldChange('grapes', text)}
              onFocus={() => handleFieldFocus('grapes', Array.isArray(safeWine?.grapes) ? safeWine.grapes.join(', ') : '', 'Syrah, Grenache')}
              onBlur={() => {
                const value = editingFields.grapes;
                if (value !== undefined) {
                                  const grapes = value.split(',').map(g => g.trim()).filter(g => g.length > 0);
                handleFieldUpdate('grapes', grapes.join(', '));
                  setEditingFields(prev => {
                    const newFields = { ...prev };
                    delete newFields.grapes;
                    return newFields;
                  });
                }
              }}
              placeholder="Syrah, Grenache"
              placeholderTextColor="#666"
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Stock */}
        {safeWine.origin === 'cellar' && (
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
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Ma note</Text>
          {renderStars(rating, handleSetRating)}
        </View>

        {/* Profil de dégustation */}
        <View style={styles.tastingSection}>
          <Text style={styles.sectionTitle}>Profil de dégustation</Text>
          {renderTastingCriteria('Puissance', 'power', tastingProfile.power)}
          {renderTastingCriteria('Tanin', 'tannin', tastingProfile.tannin)}
          {renderTastingCriteria('Acidité', 'acidity', tastingProfile.acidity)}
          {renderTastingCriteria('Sucré', 'sweetness', tastingProfile.sweetness)}
        </View>

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
          />
        </View>

        {/* Note personnelle */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Note personnelle</Text>
          <TextInput
            style={styles.textArea}
            value={personalComment}
            onChangeText={setPersonalComment}
            placeholder="Ajoutez vos notes personnelles..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            onBlur={handleSaveComment}
          />
        </View>

        {/* Historique */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {wineHistory.length > 0 ? (
            // Éliminer les doublons basés sur l'ID et trier par date
            wineHistory
              .filter((entry: any, index: number, self: any[]) => 
                index === self.findIndex((e: any) => e.id === entry.id)
              )
              .sort((a: any, b: any) => 
                new Date(b.event_date || b.created_at).getTime() - 
                new Date(a.event_date || a.created_at).getTime()
              )
              .map((entry: any, index: number) => {
                const getEventDescription = (event: any) => {
                  if (!event || typeof event !== 'object') return 'Action effectuée';
                  
                  switch (event.event_type) {
                    case 'added_to_cellar':
                      return `Ajouté à la cave (${event.new_amount || 1} bouteille${(event.new_amount || 1) > 1 ? 's' : ''})`;
                    case 'added_to_wishlist':
                      return 'Ajouté à la wishlist';
                    case 'stock_change':
                      return `Stock modifié : ${event.previous_amount || 0} → ${event.new_amount || 0} bouteille${(event.new_amount || 0) > 1 ? 's' : ''}`;
                    case 'rating_change':
                      return `Note modifiée : ${event.rating || 0}/5`;
                    case 'origin_change':
                      return String(event.notes || 'Origine modifiée');
                    case 'tasted':
                      return `Dégusté (${event.rating || 0}/5)`;
                    default:
                      return String(event.event_type || 'Action effectuée');
                  }
                };

                return (
                  <View key={`${entry.id}-${index}`} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{formatDate(entry.event_date || entry.created_at || '')}</Text>
                    <Text style={styles.historyAction}>{String(getEventDescription(entry) || 'Action effectuée')}</Text>
                  </View>
                );
              })
          ) : (
            <Text style={styles.noHistoryText}>Aucun historique disponible</Text>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de sélection de couleur */}
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
          <View style={styles.colorPickerModal}>
            <View style={styles.colorPickerHeader}>
              <Text style={styles.colorPickerTitle}>Type de vin</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.colorOptions}>
              <TouchableOpacity 
                style={styles.colorOption} 
                onPress={() => handleColorChange('red')}
              >
                <View style={[styles.colorIndicator, { backgroundColor: VeeniColors.wine.red }]} />
                <Text style={styles.colorOptionText}>Rouge</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.colorOption} 
                onPress={() => handleColorChange('white')}
              >
                <View style={[styles.colorIndicator, { backgroundColor: VeeniColors.wine.white }]} />
                <Text style={styles.colorOptionText}>Blanc</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.colorOption} 
                onPress={() => handleColorChange('rose')}
              >
                <View style={[styles.colorIndicator, { backgroundColor: VeeniColors.wine.rose }]} />
                <Text style={styles.colorOptionText}>Rosé</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.colorOption} 
                onPress={() => handleColorChange('sparkling')}
              >
                <View style={[styles.colorIndicator, { backgroundColor: VeeniColors.wine.sparkling }]} />
                <Text style={styles.colorOptionText}>Effervescent</Text>
              </TouchableOpacity>
            </View>
          </View>
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
            style={styles.pickerModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.pickerTitle}>Sélectionner le millésime</Text>
            <FlatList
              data={vintageYears}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={async () => {
                    try {
                      await updateWine(wineId, { vintage: item });
                      await fetchWines();
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
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.pickerModal}
          >
            <Text style={styles.pickerTitle}>Sélectionner le pays</Text>
            
            {/* Champ de recherche */}
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
                autoFocus={true}
                blurOnSubmit={false}
                onFocus={() => console.log('🔍 Focus sur recherche pays')}
                onBlur={() => console.log('🔍 Blur sur recherche pays')}
              />
            </View>
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    // Fermer le modal immédiatement
                    setShowCountryPicker(false);
                    setCountrySearchText('');
                    setFilteredCountries(countries);
                    
                    // Sauvegarder en arrière-plan
                    (async () => {
                      try {
                        console.log('🌍 Sauvegarde pays:', item.name, 'pour vin:', wineId);
                        await updateWine(wineId, { country: item.name });
                        console.log('✅ Pays sauvegardé, rechargement...');
                        await fetchWines();
                        console.log('✅ Données rechargées');
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
          </KeyboardAvoidingView>
        </View>
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
            style={styles.pickerModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.pickerTitle}>Sélectionner la gamme de prix</Text>
            <FlatList
              data={priceRanges}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={async () => {
                    try {
                      await updateWine(wineId, { priceRange: item });
                      await fetchWines();
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
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
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
  wineTypeBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-end',
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
    backgroundColor: '#2a2a2a',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tastingSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  descriptionSection: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  commentSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#2a2a2a',
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
  noHistoryText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 20, // Encore plus bas
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
    maxHeight: 500, // Hauteur fixe au lieu de pourcentage
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  pickerList: {
    maxHeight: 350, // Réduit pour laisser de la place au champ de recherche
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
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
    paddingVertical: 8,
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
  },
  // Styles pour le sélecteur de couleur
  colorPickerModal: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  colorOptions: {
    padding: 20,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  colorOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
