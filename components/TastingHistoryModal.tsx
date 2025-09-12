import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TastedWine } from '../hooks/useWineHistory';

interface TastingHistoryModalProps {
  visible: boolean;
  tastedWine: TastedWine | null;
  onClose: () => void;
  onReAddToCellar: () => void;
}

export default function TastingHistoryModal({
  visible,
  tastedWine,
  onClose,
  onReAddToCellar
}: TastingHistoryModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating?: number) => {
    const stars = [];
    const maxStars = 5;
    
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= (rating || 0) ? "star" : "star-outline"}
          size={32}
          color={i <= (rating || 0) ? "#FFD700" : "#666666"}
        />
      );
    }
    
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  if (!tastedWine) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Historique des dégustations</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Wine Info */}
          <View style={styles.wineInfo}>
            <Text style={styles.wineName}>{tastedWine.wine.name}</Text>
            <View style={styles.wineDetails}>
              {tastedWine.wine.year && (
                <Text style={styles.wineDetail}>{tastedWine.wine.year}</Text>
              )}
              {tastedWine.wine.producer?.name && (
                <Text style={styles.wineDetail}>{tastedWine.wine.producer.name}</Text>
              )}
            </View>
          </View>

          {/* Tastings List */}
          <ScrollView style={styles.tastingsList} showsVerticalScrollIndicator={false}>
            {tastedWine.tastings.map((tasting, index) => (
              <View key={tasting.id} style={styles.tastingItem}>
                <View style={styles.tastingHeader}>
                  <Text style={styles.tastingDate}>
                    {formatDate(tasting.date)}
                  </Text>
                  {tasting.rating && (
                    <View style={styles.ratingContainer}>
                      {renderStars(tasting.rating)}
                    </View>
                  )}
                </View>
                
                {tasting.note && (
                  <Text style={styles.tastingNote}>
                    "{tasting.note}"
                  </Text>
                )}
                
                {index < tastedWine.tastings.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.reAddButton} onPress={onReAddToCellar}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.reAddButtonText}>Ajouter à ma cave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  wineInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  wineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  wineDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  wineDetail: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  tastingsList: {
    flex: 1,
    padding: 20,
  },
  tastingItem: {
    marginBottom: 16,
  },
  tastingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tastingDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  tastingNote: {
    fontSize: 14,
    color: '#CCCCCC',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
    marginTop: 16,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  reAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#393C40', borderWidth: 0,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  reAddButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 