import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { VeeniColors } from '../constants/Colors';
import { useWineMemory } from '../hooks/useWineMemory';

const { width } = Dimensions.get('window');

// Types sécurisés pour éviter les objets complexes
export interface WineCardProps {
  wine: {
    id: string;
    name: string;
    vintage: number | null;
    color: 'red' | 'white' | 'rose' | 'sparkling';
    domaine: string;
    region: string;
    country: string;
    priceRange?: string;
    grapes: string[];
    imageUri: string | null;
    stock: number;
    origin: 'cellar' | 'wishlist' | 'tasted';
    note: number | null;
    personalComment: string | null;
    favorite?: boolean;
    // Ajout social (affichages)
    sourceUser?: { id: string; first_name?: string; avatar?: string };
    commonFriends?: Array<{ id: string; firstName: string; avatar?: string }>;
    // Données spécifiques aux vins dégustés
    lastTastedAt?: string;
    tastingCount?: number;
  };
  showStockButtons?: boolean;
  showStock?: boolean;
  showActions?: boolean;
  onPress?: () => void;
  onAddBottle?: () => void;
  onRemoveBottle?: () => void;
  onEdit?: () => void;
  onToggleFavorite?: () => void;
  footer?: React.ReactNode;
  isSharedCave?: boolean;
  sharedWith?: string;
  readOnly?: boolean;
  compact?: boolean; // Nouvelle prop pour l'affichage compact
  // Nouvelles props pour les informations sociales
  friendsWithWine?: Array<{
    id: string;
    firstName: string;
    avatar?: string;
  }>;
}

export const WineCard: React.FC<WineCardProps> = ({
  wine,
  showStockButtons = true,
  showStock = false,
  showActions = true,
  onPress,
  onAddBottle,
  onRemoveBottle,
  onEdit,
  onToggleFavorite,
  footer,
  isSharedCave = false,
  sharedWith,
  readOnly = false,
  compact = false,
  friendsWithWine = [],
}) => {
  // Protection contre les clics rapides
  const [isProcessingStockChange, setIsProcessingStockChange] = React.useState(false);
  // Fonction de nettoyage pour s'assurer que tous les champs sont des primitifs
  const safeWine = {
    id: String(wine.id || ''),
    name: String(wine.name || 'Nom inconnu'),
    vintage: wine.vintage || null,
    color: wine.color || 'red',
    domaine: String(wine.domaine || 'Domaine inconnu'),
    region: String(wine.region || ''),
    country: String(wine.country || ''),
    grapes: Array.isArray(wine.grapes) ? wine.grapes.map(String) : [],
    imageUri: wine.imageUri || null,
    stock: Number(wine.stock || 0),
    origin: wine.origin || 'cellar',
    note: wine.note || null,
    personalComment: wine.personalComment || null,
    favorite: wine.favorite || false,
    sourceUser: wine.sourceUser,
    commonFriends: wine.commonFriends || [],
  };

  // Ne pas interroger les souvenirs pour les vins OCR temporaires
  const shouldFetchMemory = typeof safeWine.id === 'string' && !safeWine.id.startsWith('ocr-');
  const { hasMemory, memory, count } = useWineMemory(shouldFetchMemory ? safeWine.id : null);

  const getWineTypeColor = (color: string) => {
    switch (color) {
      case 'red': return VeeniColors.wine.red;
      case 'white': return VeeniColors.wine.white;
      case 'rose': return VeeniColors.wine.rose;
      case 'sparkling': return VeeniColors.wine.sparkling;
      default: return VeeniColors.wine.red;
    }
  };

  const getWineTypeIcon = (color: string) => {
    switch (color) {
      case 'red': return 'wine';
      case 'white': return 'wine';
      case 'rose': return 'wine';
      case 'sparkling': return 'wine';
      default: return 'wine';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Fonction pour obtenir le drapeau du pays
  const getCountryFlag = (country: string) => {
    const flagMap: Record<string, string> = {
      'France': '🇫🇷',
      'Italie': '🇮🇹',
      'Espagne': '🇪🇸',
      'Portugal': '🇵🇹',
      'Allemagne': '🇩🇪',
      'États-Unis': '🇺🇸',
      'Chili': '🇨🇱',
      'Argentine': '🇦🇷',
      'Australie': '🇦🇺',
      'Nouvelle-Zélande': '🇳🇿',
      'Afrique du Sud': '🇿🇦',
      'Canada': '🇨🇦',
      'Suisse': '🇨🇭',
      'Autriche': '🇦🇹',
      'Hongrie': '🇭🇺',
      'Grèce': '🇬🇷',
      'Croatie': '🇭🇷',
      'Slovénie': '🇸🇮',
      'Géorgie': '🇬🇪',
      'Liban': '🇱🇧',
      'Israël': '🇮🇱',
      'Maroc': '🇲🇦',
      'Tunisie': '🇹🇳',
      'Algérie': '🇩🇿',
    };
    return flagMap[country] || '🏳️';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={readOnly}
    >
      {/* Layout principal: image horizontale en haut + texte en bas */}
      <View style={[styles.rowContainer, compact && styles.compactRowContainer]}>
        {/* Image du vin en haut */}
        <View style={styles.imageCol}>
          <View style={styles.imageWrapper}>
            {safeWine.imageUri ? (
              <>
                <ExpoImage
                  source={{ uri: `${safeWine.imageUri}?t=${Date.now()}` }}
                  style={styles.wineImage}
                  contentFit="cover"
                  onLoad={() => {}}
                  onError={() => {}}
                />
                {/* Dégradé vers la zone texte (plus doux et progressif) */}
                <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  colors={[
                    'rgba(0,0,0,0)',
                    'rgba(0,0,0,0.15)',
                    'rgba(0,0,0,0.35)',
                    'rgba(42,42,42,0.85)',
                    '#2A2A2A'
                  ]}
                  locations={[0.35, 0.6, 0.8, 0.92, 1]}
                  style={styles.imageToTextGradient}
                  pointerEvents="none"
                />
              </>
            ) : (
              <>
                {console.log('🚫 WineCard: Pas d\'image pour', safeWine.name)}
                <View style={[styles.placeholderImage, { backgroundColor: getWineTypeColor(safeWine.color) }]}> 
                  <Ionicons name={getWineTypeIcon(safeWine.color)} size={32} color="#FFF" />
                </View>
              </>
            )}
            {/* Bouton favori en haut à droite de l'image */}
            {showActions && onToggleFavorite && (
              <TouchableOpacity
                style={styles.likeButton}
                onPress={onToggleFavorite}
                disabled={readOnly}
              >
                <Ionicons
                  name={safeWine.favorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={safeWine.favorite ? VeeniColors.wine.red : '#FFF'}
                />
              </TouchableOpacity>
            )}
            {/* Indicateur souvenirs aligné à gauche et sur la même baseline */}
            {hasMemory && (
              <View style={styles.memoryLeftRow}>
                <Text style={styles.memoryLeftText}>Souvenir</Text>
                {memory?.tagged_friends && memory.tagged_friends.length > 0 && (
                  memory.tagged_friends.slice(0, 3).map((f, idx) => (
                    f?.avatar ? (
                      <ExpoImage key={f.id || idx} source={{ uri: f.avatar }} style={styles.socialAvatar} />
                    ) : (
                      <View key={f.id || idx} style={styles.socialAvatarPlaceholder}>
                        <Text style={styles.socialAvatarInitial}>{(f?.first_name || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                    )
                  ))
                )}
              </View>
            )}
            
          </View>
        </View>
        {/* Bloc infos en bas */}
        <View style={styles.infoCol}>
          {/* Section supérieure : nom */}
          <View style={styles.headerRow}>
            <Text style={styles.wineName} numberOfLines={2}>{truncateText(safeWine.name || 'Nom inconnu', 40)}</Text>
          </View>
          
          {/* Section centrale : informations du vin - EXACTEMENT 5 LIGNES MAX */}
          <View style={styles.wineInfoSection}>
            {/* 1. Domaine/Producteur (seulement si différent de "Domaine inconnu") */}
            {safeWine.domaine && safeWine.domaine !== 'Domaine inconnu' && (
              <Text style={styles.domaine} numberOfLines={1}>{truncateText(safeWine.domaine, 35)}</Text>
            )}
            
            {/* 2. Millésime */}
            {safeWine.vintage && (
              <Text style={styles.vintageText}>{String(safeWine.vintage)}</Text>
            )}
            
            {/* 3. Type de vin en label (style filtre) */}
            <View style={styles.typeChip}>
              <Ionicons 
                name={getWineTypeIcon(safeWine.color)} 
                size={12} 
                color={getWineTypeColor(safeWine.color)}
                style={styles.typeChipIcon}
              />
              <Text style={styles.typeChipText}>
                {safeWine.color === 'red' ? 'Rouge' : 
                 safeWine.color === 'white' ? 'Blanc' : 
                 safeWine.color === 'rose' ? 'Rosé' : 'Pétillant'}
              </Text>
            </View>
            
            {/* 4. Région et Pays */}
            {(safeWine.region || safeWine.country) && (
              <Text style={styles.regionCountryText} numberOfLines={1}>
                {safeWine.region && safeWine.country ? 
                  `${safeWine.region}, ${getCountryFlag(safeWine.country)} ${safeWine.country}` :
                  safeWine.region ? 
                    safeWine.region :
                    `${getCountryFlag(safeWine.country)} ${safeWine.country}`
                }
              </Text>
            )}
            


            {/* Information spécifique aux vins dégustés */}
            {safeWine.origin === 'tasted' && (
              <View style={styles.tastedInfo}>
                <Text style={styles.tastedStatus}>Dégusté le {safeWine.lastTastedAt ? new Date(safeWine.lastTastedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</Text>
                {safeWine.tastingCount && safeWine.tastingCount > 1 && (
                  <Text style={styles.tastingCountText}>
                    ({safeWine.tastingCount} dégustation{safeWine.tastingCount > 1 ? 's' : ''})
                  </Text>
                )}
              </View>
            )}

            {/* Information sociale - Ajout depuis la cave d'un ami (wishlist) */}
            {safeWine.origin === 'wishlist' && safeWine.sourceUser && (
              <View style={styles.socialRow}>
                <Text style={styles.socialText}>Aussi chez</Text>
                {safeWine.sourceUser.avatar ? (
                  <ExpoImage source={{ uri: safeWine.sourceUser.avatar }} style={styles.socialAvatar} />
                ) : (
                  <View style={styles.socialAvatarPlaceholder}>
                    <Text style={styles.socialAvatarInitial}>
                      {(safeWine.sourceUser.first_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.socialText, styles.socialNameText]}>{safeWine.sourceUser.first_name || 'un ami'}</Text>
              </View>
            )}

            {/* Information sociale - Amis qui ont aussi ce vin */}
            {(safeWine.commonFriends?.length || friendsWithWine.length) > 0 && (
              <View style={styles.socialRow}>
                <Text style={styles.socialText}>Aussi chez</Text>
                {(() => {
                  const list = (safeWine.commonFriends && safeWine.commonFriends.length > 0)
                    ? safeWine.commonFriends
                    : friendsWithWine;
                  const first = list[0];
                  return first?.avatar ? (
                    <ExpoImage source={{ uri: first.avatar }} style={styles.socialAvatar} />
                  ) : (
                    <View style={styles.socialAvatarPlaceholder}>
                      <Text style={styles.socialAvatarInitial}>{(first?.firstName || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                  );
                })()}
                <Text style={[styles.socialText, styles.socialNameText]}>
                  {(() => {
                    const list = (safeWine.commonFriends && safeWine.commonFriends.length > 0)
                      ? safeWine.commonFriends
                      : friendsWithWine;
                    const names = list.slice(0, 2).map(f => f.firstName).join(', ');
                    const extra = list.length > 2 ? ` +${list.length - 2}` : '';
                    return `${names}${extra}`;
                  })()}
                </Text>
              </View>
            )}
            
          </View>
          
          {/* Section inférieure : actions et footer */}
          <View style={styles.bottomSection}>
            {/* Boutons stock (dans la zone texte) */}
            {showStockButtons && !readOnly && safeWine.origin !== 'tasted' && (
              <View style={styles.stockRow}>
                <TouchableOpacity
                  style={styles.stockButton}
                  onPress={async () => {
                    if (isProcessingStockChange) return;
                    setIsProcessingStockChange(true);
                    try {
                      await onRemoveBottle?.();
                    } finally {
                      // Réactiver après 1 seconde
                      setTimeout(() => setIsProcessingStockChange(false), 1000);
                    }
                  }}
                  disabled={safeWine.stock <= 0 || isProcessingStockChange}
                >
                  <Ionicons 
                    name="remove" 
                    size={20} 
                    color={safeWine.stock > 0 && !isProcessingStockChange ? '#FFFFFF' : '#999'} 
                  />
                </TouchableOpacity>
                <Text style={styles.stockText}>{String(safeWine.stock)}</Text>
                <TouchableOpacity 
                  style={styles.stockButton} 
                  onPress={async () => {
                    if (isProcessingStockChange) return;
                    setIsProcessingStockChange(true);
                    try {
                      await onAddBottle?.();
                    } finally {
                      // Réactiver après 1 seconde
                      setTimeout(() => setIsProcessingStockChange(false), 1000);
                    }
                  }}
                  disabled={isProcessingStockChange}
                >
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={!isProcessingStockChange ? '#FFFFFF' : '#999'} 
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Affichage du stock en mode lecture */}
            {showStock && readOnly && (
              <View style={styles.stockDisplay}>
                <Text style={styles.stockText}>Stock : {safeWine.stock || 0}</Text>
              </View>
            )}
            
            {/* Boutons stock (seulement sur Ma cave, pas pour les dégustés) */}
            {/* Boutons stock retirés d'ici (désormais sur la photo) */}
            {/* Footer personnalisé */}
            {footer && (
              <View style={styles.footer}>{footer}</View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  wineImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(246, 160, 122, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  wineName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  vintage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  wineTypeBadge: {
    borderRadius: 12,
    padding: 4,
  },
  domaine: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 2,
  },
  vintageTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  vintageTypeRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  regionText: {
    color: '#999',
    fontSize: 12,
    flex: 1,
    minWidth: 0,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  region: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  grapes: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  sharedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sharedInfoText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  rowContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    height: 440, // Hauteur globale selon Figma
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  imageCol: {
    width: '100%',
    height: '50%',
    backgroundColor: 'transparent',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 0,
    padding: 0,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    flex: 1,
  },
  wineImage: {
    width: '100%',
    height: '100%',
    flex: 1,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 0,
    alignSelf: 'stretch',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  imageToTextGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -4, // léger chevauchement pour un fondu sans cassure
    height: 120,
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
  stockOverlayRow: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 48,
    zIndex: 2,
  },
  stockOverlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  memoryOverlayRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  memoryTopLeft: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  memoryLeftRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    zIndex: 2,
  },
  memoryLeftText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
  },
  memoryCenteredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  memoryOverlayAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  memoryOverlayAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#888',
  },
  memoryOverlayAvatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  memoryMore: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryOverlayMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  memoryOverlayCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 2,
  },
  memoryOverlayCountText: {
    color: '#fff',
    fontSize: 12,
  },
  vintageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },
  infoCol: {
    width: '100%',
    padding: 14,
    justifyContent: 'flex-start',
    height: '50%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  wineName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginBottom: 8,
  },
  domaine: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wineTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 4,
    marginBottom: 8,
  },
  regionCountryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 22,
  },
  grapesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 22,
  },
  priceRange: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  memoryPrefix: {
    color: '#FFF',
    fontSize: 12,
  },
  memoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memoryTagText: {
    color: '#FFF',
    fontSize: 12,
  },
  memoryAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  memoryAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryAvatarInitial: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  stockDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  wineInfoSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  bottomSection: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    
  },
  avatarsRowInBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 12,
    bottom: 8,
    zIndex: 3,
    backgroundColor: 'transparent',
  },
  souvenirLabel: {
    marginRight: 6,
  },
  // Nouveaux styles pour les informations ajoutées
  wineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  wineTypeIcon: {
    marginTop: -2, // Ajustement pour aligner l'icône avec le texte
  },
  wineTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 4,
    marginBottom: 10,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  countryFlag: {
    fontSize: 14,
    marginLeft: 4,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  socialNameText: {
    marginLeft: 0,
  },
  socialAvatar: {
    width: 24, // multiple de 8
    height: 24, // multiple de 8
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4, // plus serré
  },
  // Avatars en bas (alignés avec les boutons, même taille)
  bottomAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 3,
  },
  bottomAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  socialAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  socialAvatarInitial: {
    color: '#222',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  // Styles pour les vins dégustés
  tastedInfo: {
    marginBottom: 8,
  },
  tastedStatus: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tastingCountText: {
    color: '#CCC',
    fontSize: 12,
    fontStyle: 'italic',
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
  // Styles compacts pour l'affichage dans les listes
  compactRowContainer: {
    height: 120, // Hauteur réduite
  },
  compactImageCol: {
    width: 80, // Largeur réduite
    height: 120, // Hauteur réduite
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#393C40', borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  typeChipIcon: {
    marginRight: 4,
    marginTop: -1,
  },
  typeChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 