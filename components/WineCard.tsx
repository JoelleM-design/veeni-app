import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { VeeniColors } from '../constants/Colors';

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
    origin: 'cellar' | 'wishlist';
    note: number | null;
    personalComment: string | null;
    favorite?: boolean;
    // Ajout social (affichages)
    sourceUser?: { id: string; first_name?: string; avatar?: string };
    commonFriends?: Array<{ id: string; firstName: string; avatar?: string }>;
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
      {/* Layout principal en row */}
      <View style={[styles.rowContainer, compact && styles.compactRowContainer]}>
        {/* Image du vin à gauche */}
        <View style={[styles.imageCol, compact && styles.compactImageCol]}>
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
          </View>
        </View>
        {/* Bloc infos à droite */}
        <View style={styles.infoCol}>
          {/* Section supérieure : nom */}
          <View style={styles.headerRow}>
            <Text style={styles.wineName} numberOfLines={2}>{truncateText(safeWine.name || 'Nom inconnu', 40)}</Text>
          </View>
          
          {/* Section centrale : informations du vin - ordre spécifique */}
          <View style={styles.wineInfoSection}>
            {/* 1. Domaine/Producteur */}
            {safeWine.domaine && safeWine.domaine !== 'Domaine inconnu' && (
              <Text style={styles.domaine} numberOfLines={1}>{truncateText(safeWine.domaine, 35)}</Text>
            )}
            
            {/* 2. Millésime */}
            {safeWine.vintage && (
              <Text style={styles.vintageText}>{String(safeWine.vintage)}</Text>
            )}
            
            {/* 3. Type de vin avec icône */}
            <View style={styles.wineTypeRow}>
              <Ionicons 
                name={getWineTypeIcon(safeWine.color)} 
                size={16} 
                color={getWineTypeColor(safeWine.color)}
                style={styles.wineTypeIcon}
              />
              <Text style={styles.wineTypeText}>
                {safeWine.color === 'red' ? 'Rouge' : 
                 safeWine.color === 'white' ? 'Blanc' : 
                 safeWine.color === 'rose' ? 'Rosé' : 'Effervescent'}
              </Text>
            </View>
            
            {/* 4. Région et Pays sur la même ligne */}
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
            
            {/* 6. Cépages */}
            {safeWine.grapes.length > 0 && (
              <Text style={styles.grapesText} numberOfLines={1}>
                {safeWine.grapes.slice(0, 3).join(', ')}
                {safeWine.grapes.length > 3 && '...'}
              </Text>
            )}
            
            {/* Prix */}
            {safeWine.priceRange && (
              <Text style={styles.priceRange}>
                {safeWine.priceRange}
              </Text>
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
            
            {/* Note personnelle */}
            {safeWine.note && safeWine.note > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.rating}>{String(safeWine.note)}/5</Text>
              </View>
            )}
          </View>
          
          {/* Section inférieure : actions et footer */}
          <View style={styles.bottomSection}>
            {/* Affichage du stock en mode lecture */}
            {showStock && readOnly && (
              <View style={styles.stockDisplay}>
                <Text style={styles.stockText}>Stock : {safeWine.stock || 0}</Text>
              </View>
            )}
            
            {/* Boutons stock (seulement sur Ma cave) */}
            {showStockButtons && !readOnly && (
              <View style={styles.stockRow}>
                <TouchableOpacity
                  style={styles.stockButton}
                  onPress={onRemoveBottle}
                  disabled={safeWine.stock <= 0}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={safeWine.stock > 0 ? '#FFFFFF' : '#999'}
                  />
                </TouchableOpacity>
                <Text style={styles.stockText}>{String(safeWine.stock)}</Text>
                <TouchableOpacity
                  style={styles.stockButton}
                  onPress={onAddBottle}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
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
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    height: 300, // Même hauteur que l'image
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageCol: {
    width: 200, // Largeur fixe comme la fiche détaillée
    height: 300, // Hauteur fixe comme la fiche détaillée
    backgroundColor: '#222',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  wineImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
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
  vintageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 10,
  },
  infoCol: {
    flex: 1,
    padding: 6,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  wineName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginBottom: 4,
  },
  domaine: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  regionCountryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 6,
  },
  grapesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 6,
    marginBottom: 6,
  },
  priceRange: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 6,
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
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
    marginHorizontal: 6,
  },
  wineInfoSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  bottomSection: {
    justifyContent: 'flex-start',
  },
  // Nouveaux styles pour les informations ajoutées
  wineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  wineTypeIcon: {
    marginTop: -2, // Ajustement pour aligner l'icône avec le texte
  },
  wineTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 4,
    marginBottom: 6,
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
    marginHorizontal: 8, // multiple de 8
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
}); 