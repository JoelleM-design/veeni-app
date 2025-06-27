import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VeeniColors } from '../constants/Colors';
import type { Wine } from '../types/wine';

interface WineCardProps {
  wine: Wine;
  showStockButtons?: boolean;
  onAddBottle?: () => void;
  onRemoveBottle?: () => void;
  onToggleFavorite?: () => void;
  onPress?: () => void;
  footer?: React.ReactNode;
}

// Couleur du type de vin
const getWineTypeColor = (type: string) => {
  switch (type) {
    case 'red': return VeeniColors.wine.red;
    case 'white': return VeeniColors.wine.white;
    case 'rose': return VeeniColors.wine.rose;
    case 'sparkling': return VeeniColors.wine.sparkling;
    default: return VeeniColors.wine.red;
  }
};

// Icône du type de vin
const getWineTypeIcon = (type: string) => {
  switch (type) {
    case 'red': return 'wine';
    case 'white': return 'wine-outline';
    case 'rose': return 'wine';
    case 'sparkling': return 'sparkles';
    default: return 'wine';
  }
};

// Texte du type de vin
const getWineTypeText = (type: string) => {
  switch (type) {
    case 'red': return 'Rouge';
    case 'white': return 'Blanc';
    case 'rose': return 'Rosé';
    case 'sparkling': return 'Effervescent';
    default: return 'Rouge';
  }
};

export const WineCard: React.FC<WineCardProps> = ({
  wine,
  showStockButtons = true,
  onAddBottle,
  onRemoveBottle,
  onToggleFavorite,
  onPress,
  footer,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/wine/[id]',
        params: { id: wine.id }
      });
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={handlePress}>
      {/* Image principale */}
      <View style={styles.imageContainer}>
        {wine.imageUri ? (
          <Image source={{ uri: wine.imageUri }} style={styles.imageFill} />
        ) : (
          <View style={styles.placeholderFill}>
            <Ionicons name="wine" size={40} color="#666" />
          </View>
        )}
        
        {/* Badge millésime */}
        {wine.vintage && (
          <View style={styles.vintageBadge}>
            <Text style={styles.vintageBadgeText}>{wine.vintage}</Text>
          </View>
        )}
        
        {/* Bouton like */}
        <TouchableOpacity 
          style={styles.heartBtn} 
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
        >
          <Ionicons 
            name={wine.favorite ? 'heart' : 'heart-outline'} 
            size={22} 
            color={wine.favorite ? VeeniColors.wine.red : '#B0B0B0'} 
          />
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <View style={styles.cardContent}>
        {/* En-tête avec nom et type */}
        <View style={styles.header}>
          <Text style={styles.wineName} numberOfLines={2} ellipsizeMode='tail'>
            {wine.name}
          </Text>
          
          <View style={styles.typeBadge}>
            <Ionicons 
              name={getWineTypeIcon(wine.color)} 
              size={14} 
              color="#FFF" 
            />
            <Text style={styles.typeText}>
              {getWineTypeText(wine.color)}
            </Text>
          </View>
        </View>

        {/* Domaine */}
        {wine.domaine && wine.domaine !== 'Domaine inconnu' && (
          <Text style={styles.domaine} numberOfLines={1} ellipsizeMode='tail'>
            {wine.domaine}
          </Text>
        )}

        {/* Informations détaillées */}
        <View style={styles.details}>
          {/* Région et appellation */}
          {(wine.region || wine.appellation) && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color="#B0B0B0" />
              <Text style={styles.detailText} numberOfLines={1} ellipsizeMode='tail'>
                {wine.appellation && wine.appellation !== wine.region 
                  ? `${wine.appellation}, ${wine.region}` 
                  : wine.region || wine.appellation}
              </Text>
            </View>
          )}

          {/* Cépages */}
          {wine.grapes && wine.grapes.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="leaf-outline" size={14} color="#B0B0B0" />
              <Text style={styles.detailText} numberOfLines={1} ellipsizeMode='tail'>
                {wine.grapes.join(', ')}
              </Text>
            </View>
          )}

          {/* Note utilisateur */}
          {wine.note > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="star" size={14} color={VeeniColors.accent.secondary} />
              <Text style={styles.detailText}>
                {wine.note}/5
              </Text>
            </View>
          )}

          {/* Caractéristiques techniques */}
          {(wine.power > 0 || wine.tannin > 0 || wine.sweet > 0 || wine.acidity > 0) && (
            <View style={styles.characteristics}>
              {wine.power > 0 && (
                <View style={styles.characteristicItem}>
                  <Text style={styles.characteristicLabel}>P</Text>
                  <View style={styles.characteristicBar}>
                    <View 
                      style={[
                        styles.characteristicFill, 
                        { width: `${(wine.power / 5) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              {wine.tannin > 0 && (
                <View style={styles.characteristicItem}>
                  <Text style={styles.characteristicLabel}>T</Text>
                  <View style={styles.characteristicBar}>
                    <View 
                      style={[
                        styles.characteristicFill, 
                        { width: `${(wine.tannin / 5) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              {wine.sweet > 0 && (
                <View style={styles.characteristicItem}>
                  <Text style={styles.characteristicLabel}>S</Text>
                  <View style={styles.characteristicBar}>
                    <View 
                      style={[
                        styles.characteristicFill, 
                        { width: `${(wine.sweet / 5) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              {wine.acidity > 0 && (
                <View style={styles.characteristicItem}>
                  <Text style={styles.characteristicLabel}>A</Text>
                  <View style={styles.characteristicBar}>
                    <View 
                      style={[
                        styles.characteristicFill, 
                        { width: `${(wine.acidity / 5) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer custom */}
        {footer && <View style={styles.footer}>{footer}</View>}

        {/* Actions stock */}
        {showStockButtons && (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={(e) => {
                e.stopPropagation();
                onRemoveBottle?.();
              }}
            >
              <Ionicons name="remove" size={16} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.stockContainer}>
              <Text style={styles.stockLabel}>Stock</Text>
              <Text style={styles.stockValue}>{wine.stock}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={(e) => {
                e.stopPropagation();
                onAddBottle?.();
              }}
            >
              <Ionicons name="add" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 22,
    marginBottom: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    height: 300,
    alignItems: 'stretch',
    minHeight: 300,
    maxHeight: 300,
  },
  imageContainer: {
    width: 140,
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
    marginRight: 18,
    alignSelf: 'stretch',
    flexShrink: 0,
    flexGrow: 0,
  },
  imageFill: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
  },
  placeholderFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.0)',
    borderRadius: 12,
    padding: 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  wineName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFF',
    flexShrink: 1,
    maxWidth: 170,
  },
  domaine: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 2,
    flexShrink: 1,
    maxWidth: 170,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    zIndex: 3,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  details: {
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
    maxWidth: 110,
  },
  characteristics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  characteristicLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  characteristicBar: {
    width: 20,
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  characteristicFill: {
    height: '100%',
  },
  footer: {
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: '#444',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockContainer: {
    alignItems: 'center',
  },
  stockLabel: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '500',
  },
  stockValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vintageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  vintageBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
}); 