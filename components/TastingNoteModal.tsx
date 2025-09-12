import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Spacing, Typography, VeeniColors } from '../constants/Colors';

interface TastingNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rating: number, notes?: string) => void;
  wineName: string;
}

export const TastingNoteModal: React.FC<TastingNoteModalProps> = ({
  visible,
  onClose,
  onSave,
  wineName
}) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (rating > 0) {
      onSave(rating, notes.trim() || undefined);
      setRating(0);
      setNotes('');
      onClose();
    }
  };

  const handleCancel = () => {
    setRating(0);
    setNotes('');
    onClose();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            style={styles.starButton}
            onPress={() => setRating(star)}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFFFFF' : '#666'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Note ta dégustation</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <Text style={styles.wineName}>{wineName}</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Ta note</Text>
            {renderStars()}
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating}/5` : 'Sélectionne une note'}
            </Text>
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes personnelles (optionnel)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Tes impressions, arômes, etc..."
              placeholderTextColor="#666"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, rating === 0 && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={rating === 0}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: VeeniColors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  wineName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: VeeniColors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: VeeniColors.text.primary,
    marginBottom: Spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.md,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: Typography.size.sm,
    color: VeeniColors.text.tertiary,
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    backgroundColor: '#444',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: VeeniColors.text.primary,
    fontSize: Typography.size.base,
    minHeight: 80,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: VeeniColors.text.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  saveButton: {
    flex: 1,
    backgroundColor: VeeniColors.button.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: VeeniColors.background.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
}); 