import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface TastingConfirmationModalProps {
  visible: boolean;
  wineName: string;
  onCancel: () => void;
  onConfirm: (rating: number) => void;
}

export default function TastingConfirmationModal({
  visible,
  wineName,
  onCancel,
  onConfirm
}: TastingConfirmationModalProps) {
  const [rating, setRating] = useState(0);

  const handleConfirm = () => {
    if (rating > 0) {
      onConfirm(rating);
      setRating(0);
    }
  };

  const handleCancel = () => {
    setRating(0);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>As-tu aimé le vin ?</Text>
              </View>

              <Text style={styles.wineName}>{wineName}</Text>

              <View style={styles.ratingSection}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={styles.starButton}
                      onPress={() => setRating(star)}
                      accessibilityRole="button"
                      accessibilityLabel={`Noter ${star} étoile${star > 1 ? 's' : ''}`}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={28}
                        color={star <= rating ? '#FFFFFF' : '#666666'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingText}>{rating > 0 ? `${rating}/5` : ' '}</Text>
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText} numberOfLines={1}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, rating === 0 && styles.confirmButtonDisabled]}
                  onPress={handleConfirm}
                  disabled={rating === 0}
                >
                  <Text style={styles.confirmButtonText} numberOfLines={1}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: 'auto',
    minWidth: 320,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#333333',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    alignSelf: 'center',
  },
  wineName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
    alignSelf: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'nowrap',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    numberOfLines: 1,
    flexShrink: 0,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    numberOfLines: 1,
    flexShrink: 0,
  },
}); 