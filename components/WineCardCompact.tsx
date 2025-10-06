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
export interface WineCardCompactProps {
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
  };
  onPress?: () => void;
  readOnly?: boolean;
  alsoOwnedByCurrentUser?: { id: string; first_name?: string; avatar?: string } | null;
}

export const WineCardCompact: React.FC<WineCardCompactProps> = ({
  wine,
  onPress,
  readOnly = false,
  alsoOwnedByCurrentUser = null,
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
    >
      {/* Layout principal en row */}
      <View style={styles.rowContainer}>
        {/* Image du vin à gauche */}
        <View style={styles.imageCol}>
          <View style={styles.imageWrapper}>
            {safeWine.imageUri ? (
              <ExpoImage
                source={{ uri: `${safeWine.imageUri}?t=${Date.now()}` }}
                style={styles.wineImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: getWineTypeColor(safeWine.color) }]}> 
                <Ionicons name={getWineTypeIcon(safeWine.color)} size={24} color="#FFF" />
              </View>
            )}
            {/* Bouton favori en haut à droite de l'image */}
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => {}}
              disabled={true}
            >
              <Ionicons
                name={safeWine.favorite ? 'heart' : 'heart-outline'}
                size={16}
                color={safeWine.favorite ? VeeniColors.wine.red : '#FFF'}
              />
            </TouchableOpacity>
          </View>
        </View>
        {/* Bloc infos à droite */}
        <View style={styles.infoCol}>
          {/* Section supérieure : nom */}
          <View style={styles.headerRow}>
            <Text style={styles.wineName} numberOfLines={2}>{truncateText(safeWine.name || 'Nom inconnu', 30)}</Text>
          </View>
          
          {/* Section centrale : informations du vin - EXACTEMENT 5 LIGNES MAX */}
          <View style={styles.wineInfoSection}>
            {/* 1. Domaine/Producteur (seulement si différent de "Domaine inconnu") */}
            {safeWine.domaine && safeWine.domaine !== 'Domaine inconnu' && (
              <Text style={styles.domaine} numberOfLines={1}>{truncateText(safeWine.domaine, 25)}</Text>
            )}
            
            {/* 2. Millésime */}
            {safeWine.vintage && (
              <Text style={styles.vintageText}>{String(safeWine.vintage)}</Text>
            )}
            
            {/* 3. Type de vin avec icône */}
            <View style={styles.wineTypeRow}>
              <Ionicons 
                name={getWineTypeIcon(safeWine.color)} 
                size={14} 
                color={getWineTypeColor(safeWine.color)}
                style={styles.wineTypeIcon}
              />
              <Text style={styles.wineTypeText}>
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

            {/* Social: Aussi chez [Moi] si je possède aussi ce vin (cave ou wishlist) */}
            {alsoOwnedByCurrentUser && (
              <View style={styles.socialRow}>
                <Text style={styles.socialText}>Aussi chez</Text>
                {alsoOwnedByCurrentUser.avatar ? (
                  <ExpoImage source={{ uri: alsoOwnedByCurrentUser.avatar }} style={styles.socialAvatar} />
                ) : (
                  <View style={styles.socialAvatarPlaceholder}>
                    <Text style={styles.socialAvatarInitial}>
                      {(alsoOwnedByCurrentUser.first_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.socialText, styles.socialNameText]}>{alsoOwnedByCurrentUser.first_name || 'vous'}</Text>
              </View>
            )}
          </View>
          
          {/* Section inférieure : stock */}
          <View style={styles.bottomSection}>
            <View style={styles.stockDisplay}>
              <Text style={styles.stockText}>Stock : {safeWine.stock || 0}</Text>
            </View>
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
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    height: 300, // Même hauteur que l'original
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageCol: {
    width: 200, // Même largeur que l'original
    height: 300, // Même hauteur que l'original
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
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  wineInfoSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  domaine: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  vintageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 10,
  },
  wineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  wineTypeIcon: {
    marginTop: -2,
  },
  wineTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 4,
    marginBottom: 6,
  },
  vintageTypeRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  regionText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    minWidth: 0,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
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
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
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
  bottomSection: {
    justifyContent: 'flex-end',
  },
  stockDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
