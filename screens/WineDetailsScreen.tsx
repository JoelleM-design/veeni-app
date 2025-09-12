import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VeeniColors } from '../constants/Colors';
import { useSharedCave } from '../hooks/useSharedCave';
import { useUser } from '../hooks/useUser';
import { useWineHistory } from '../hooks/useWineHistory';
import { useWines } from '../hooks/useWines';
import { Image as ExpoImage } from 'expo-image';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface WineDetailsScreenV2Props {
  wineId: string;
  isReadOnly?: boolean;
  isSharedCave?: boolean;
  sharedWith?: string;
  isFromOcr?: boolean;
}

export default function WineDetailsScreenV2({ 
  wineId, 
  isReadOnly = false, 
  isSharedCave = false, 
  sharedWith,
  isFromOcr = false
}: WineDetailsScreenV2Props) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { wines, updateWine, addWineToWishlist, addWineToCellar, removeWineFromCellar, removeWineFromWishlist } = useWines();
  const { tastedWines } = useWineHistory();
  const { user } = useUser();
  // Temporairement désactivé pour éviter l'erreur
  const friendsWithWine: any[] = [];
  const { sharedCave } = useSharedCave();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
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
      
      // Validation basique des données
      if (parsedData && typeof parsedData === 'object') {
        // Vérifier que les champs requis existent
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
  console.log('[WineDetailsScreenV2] Diagnostic:', { 
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

  // Amis qui possèdent ce vin (temporairement désactivé)

  // Historique du vin
  const wineHistory = wine?.history || [];

  // Détection du contexte d'usage
  const friendId = (params.friendId as string) || undefined;
  const context = useMemo(() => {
    if (friendId) return 'cave_ami' as const;
    if (wine && (wine.stock || 0) > 0 && wine.origin === 'cellar') return 'cave' as const;
    if (wine && wine.origin === 'wishlist') return 'wishlist' as const;
    if (wine && (wine.stock || 0) === 0) return 'deguste' as const;
    return 'cave' as const;
  }, [friendId, wine?.id, wine?.origin, wine?.stock]);

  // Données de l'ami (lecture seule)
  const [friendData, setFriendData] = useState<{ amount: number; favorite: boolean; history: any[] } | null>(null);
  const [friendProfile, setFriendProfile] = useState<{ first_name?: string; avatar?: string } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (context !== 'cave_ami' || !friendId || !wineId) { setFriendData(null); return; }
      try {
        // Profil ami (affichage social)
        const { data: fp } = await supabase
          .from('User')
          .select('first_name, avatar')
          .eq('id', friendId)
          .maybeSingle();
        if (mounted) setFriendProfile(fp || null);

        const { data: uw } = await supabase
          .from('user_wine')
          .select('amount, favorite, origin')
          .eq('user_id', friendId)
          .eq('wine_id', wineId)
          .maybeSingle();
        const { data: hist } = await supabase
          .from('wine_history')
          .select('id, event_type, event_date, rating, notes, created_at')
          .eq('user_id', friendId)
          .eq('wine_id', wineId)
          .order('event_date', { ascending: false });
        if (!mounted) return;
        setFriendData({ amount: uw?.amount || 0, favorite: !!uw?.favorite, history: Array.isArray(hist) ? hist : [] });
      } catch (e) {
        if (!mounted) return;
        setFriendData({ amount: 0, favorite: false, history: [] });
      }
    })();
    return () => { mounted = false; };
  }, [context, friendId, wineId]);

  // Social: déterminer si ce vin est dans ma wishlist et provient de cet ami
  // Vérification robuste côté DB pour éviter les états locaux obsolètes
  const [myWishlistFromThisFriend, setMyWishlistFromThisFriend] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!friendId || !user?.id || !wineId) { if (mounted) setMyWishlistFromThisFriend(false); return; }
        const { data, error } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .eq('origin', 'wishlist')
          .eq('source_user_id', friendId)
          .limit(1);
        if (!mounted) return;
        setMyWishlistFromThisFriend(!!(data && data.length > 0 && data[0]?.wine_id));
      } catch (_) {
        if (mounted) setMyWishlistFromThisFriend(false);
      }
    })();
    return () => { mounted = false; };
  }, [friendId, user?.id, wineId]);

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
      // Si on vient de l'OCR, retourner à la liste
      router.back();
    } else {
      // Sinon, sortir du mode édition
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
    console.log("[Like] WineDetailsScreenV2 - wineId:", safeWine?.id, "newFavoriteValue:", !safeWine?.favorite);
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
              if (context === 'wishlist') {
                await removeWineFromWishlist(wineId);
              } else {
                await removeWineFromCellar(wineId);
              }
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
          <View style={styles.wineTypeBadge}>
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
          </View>
        </View>

        {/* Informations principales */}
        <View style={styles.mainInfo}>
          <Text style={styles.wineName}>{safeWine.name || 'Nom inconnu'}</Text>
          <Text style={styles.wineProducer}>{safeWine.domaine || 'Domaine inconnu'}</Text>
          {safeWine.vintage !== null && safeWine.vintage !== undefined && safeWine.vintage !== 0 && (
            <Text style={styles.wineVintage}>{String(safeWine.vintage)}</Text>
          )}
          <Text style={styles.wineRegion}>{safeWine.region || 'Région inconnue'}</Text>
          {Array.isArray(safeWine?.grapes) && safeWine.grapes.length > 0 && (
            <Text style={styles.wineGrapes}>
              {safeWine.grapes.join(', ')}
            </Text>
          )}
        </View>

        {/* Stock */}
        {(context === 'cave' || context === 'cave_ami') && (
          <View style={styles.stockSection}>
            <Text style={styles.sectionTitle}>Stock</Text>
            {context === 'cave' ? (
              <View style={styles.stockControls}>
                <TouchableOpacity onPress={handleRemoveBottle} style={styles.stockButton}>
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.stockCount}>{safeWine.stock || 0}</Text>
                <TouchableOpacity onPress={handleAddBottle} style={styles.stockButton}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stockControls}>
                <Text style={styles.stockCount}>{friendData?.amount ?? 0}</Text>
              </View>
            )}
          </View>
        )}

        {/* Note et évaluation */}
        {context !== 'cave_ami' && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Ma note</Text>
            {renderStars(rating, handleSetRating)}
          </View>
        )}

        {/* Profil de dégustation */}
        {context !== 'cave_ami' && (
          <View style={styles.tastingSection}>
            <Text style={styles.sectionTitle}>Profil de dégustation</Text>
            {renderTastingCriteria('Puissance', 'power', tastingProfile.power)}
            {renderTastingCriteria('Tanin', 'tannin', tastingProfile.tannin)}
            {renderTastingCriteria('Acidité', 'acidity', tastingProfile.acidity)}
            {renderTastingCriteria('Sucré', 'sweetness', tastingProfile.sweetness)}
          </View>
        )}

        {/* Descriptif */}
        {context !== 'cave_ami' && (
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
        )}

        {/* Note personnelle */}
        {context !== 'cave_ami' && (
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
        )}

        {/* Historique */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {context === 'cave_ami' && myWishlistFromThisFriend && (
            <View style={[styles.historyItem, { borderBottomWidth: 0, alignItems: 'center' }]}>
              <Text style={styles.historyAction}>ajouté à la liste d'envie de</Text>
              {user?.avatar ? (
                <ExpoImage source={{ uri: user.avatar }} style={{ width: 24, height: 24, borderRadius: 12, marginHorizontal: 8 }} contentFit="cover" />
              ) : (
                <View style={{ width: 24, height: 24, borderRadius: 12, marginHorizontal: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#222', fontSize: 12, fontWeight: '700', lineHeight: 16 }}>
                    {String(user?.first_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.historyAction, { marginLeft: 0 }]}>{user?.first_name || 'moi'}</Text>
            </View>
          )}
          {(() => {
            const base = context === 'cave_ami' ? (friendData?.history || []) : wineHistory;
            const filtered = base.filter((e: any) => {
              if (context === 'wishlist') return ['added_to_wishlist', 'origin_change'].includes(String(e.event_type));
              if (context === 'deguste') return ['tasted', 'rating_change', 'noted', 'stock_change'].includes(String(e.event_type));
              return true;
            });
            return filtered.length > 0 ? (
              filtered
                .filter((entry: any, index: number, self: any[]) => index === self.findIndex(e => e.id === entry.id))
                .sort((a: any, b: any) => new Date(b.event_date || b.created_at).getTime() - new Date(a.event_date || a.created_at).getTime())
                .map((entry: any, index: number) => {
                  const getEventDescription = (event: any) => {
                    if (!event || typeof event !== 'object') return 'Action effectuée';
                    switch (event.event_type) {
                      case 'added_to_cellar':
                        return `Ajouté à la cave (${event.new_amount || 1} bouteille${(event.new_amount || 1) > 1 ? 's' : ''})`;
                      case 'added_to_wishlist':
                        return 'Ajouté à la liste d\'envie';
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
            );
          })()}
        </View>

        {/* Chez tes amis */}
        {/* Temporairement désactivé pour éviter l'erreur */}
        {/* {friendsWithWine.length > 0 && (
          <View style={styles.friendsSection}>
            <Text style={styles.sectionTitle}>Chez tes amis</Text>
            {friendsWithWine.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <Image
                  source={
                    friend.avatar
                      ? { uri: friend.avatar }
                      : require('../assets/images/default-avatar.svg')
                  }
                  style={styles.friendAvatar}
                />
                <Text style={styles.friendName}>{friend.firstName}</Text>
              </View>
            ))}
          </View>
        )} */}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal d'actions - options selon contexte */}
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
            
            {context === 'wishlist' ? (
              <TouchableOpacity style={styles.modalAction} onPress={handleMoveToCellar}>
                <Ionicons name="wine" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionText}>Déplacer vers ma cave</Text>
              </TouchableOpacity>
            ) : context === 'cave' ? (
              <TouchableOpacity style={styles.modalAction} onPress={handleMoveToWishlist}>
                <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionText}>Déplacer vers ma wishlist</Text>
              </TouchableOpacity>
            ) : context === 'deguste' ? (
              <>
                <TouchableOpacity style={styles.modalAction} onPress={handleMoveToCellar}>
                  <Ionicons name="wine" size={20} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Ajouter à ma cave</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAction} onPress={handleMoveToWishlist}>
                  <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Ajouter à ma wishlist</Text>
                </TouchableOpacity>
              </>
            ) : context === 'cave_ami' ? (
              <TouchableOpacity style={styles.modalAction} onPress={() => addWineToWishlist({ ...(wine as any), friendId })}>
                <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionText}>Ajouter à ma wishlist</Text>
              </TouchableOpacity>
            )}
            
            {(context === 'cave' || context === 'wishlist') && (
              <TouchableOpacity style={styles.modalAction} onPress={handleDeleteWine}>
                <Ionicons name="trash-outline" size={20} color="#FF4444" />
                <Text style={[styles.modalActionText, { color: '#FF4444' }]}>Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
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
    height: 250,
    backgroundColor: '#2a2a2a',
  },
  wineImage: {
    width: '100%',
    height: '100%',
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
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  wineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  wineProducer: {
    fontSize: 18,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  wineVintage: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  wineRegion: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  wineGrapes: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  stockSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
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
  friendsSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
}); 