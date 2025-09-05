import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TastedWine } from '../hooks/useWineHistory';

interface WineCardDegustedProps {
  tastedWine: TastedWine;
  onPress: () => void;
  onReAddToCellar: () => void;
}

export default function WineCardDegusted({ 
  tastedWine, 
  onPress, 
  onReAddToCellar 
}: WineCardDegustedProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getWineTypeColor = (wineType?: string) => {
    switch (wineType?.toLowerCase()) {
      case 'red':
      case 'rouge':
        return '#FF4F8B';
      case 'white':
      case 'blanc':
        return '#FFF8DC';
      case 'rosé':
      case 'rose':
        return '#FFB6C1';
      case 'sparkling':
      case 'effervescent':
        return '#FFD700';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        {/* Image du vin */}
        <View style={styles.imageContainer}>
          {tastedWine.wine.image_uri ? (
            <Image 
              source={{ uri: tastedWine.wine.image_uri }} 
              style={styles.wineImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: getWineTypeColor(tastedWine.wine.wine_type) }]}>
              <Ionicons name="wine" size={24} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Informations du vin */}
        <View style={styles.wineInfo}>
          <Text style={styles.wineName} numberOfLines={2}>
            {tastedWine.wine.name}
          </Text>
          
          <View style={styles.wineDetails}>
            {tastedWine.wine.year && (
              <Text style={styles.wineDetail}>{tastedWine.wine.year}</Text>
            )}
            {tastedWine.wine.producer?.name && (
              <Text style={styles.wineDetail} numberOfLines={1}>
                {tastedWine.wine.producer.name}
              </Text>
            )}
          </View>

          {/* Statistiques de dégustation */}
          <View style={styles.tastingStats}>
            <Text style={styles.tastingCount}>
              Dégusté {tastedWine.tastings.length} fois
            </Text>
            <Text style={styles.lastTastingDate}>
              Dernière dégustation le {formatDate(tastedWine.lastTastedAt)}
            </Text>
          </View>
        </View>

        {/* Bouton d'action */}
        <TouchableOpacity 
          style={styles.reAddButton} 
          onPress={onReAddToCellar}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 16,
  },
  wineImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineInfo: {
    flex: 1,
  },
  wineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  wineDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  wineDetail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 12,
  },
  tastingStats: {
    marginTop: 4,
  },
  tastingCount: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  lastTastingDate: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  reAddButton: {
    padding: 8,
  },
}); 