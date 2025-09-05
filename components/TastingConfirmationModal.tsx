import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface TastingConfirmationModalProps {
  visible: boolean;
  wineName: string;
  onCancel: () => void;
  onConfirm: (note?: string) => void;
}

export default function TastingConfirmationModal({
  visible,
  wineName,
  onCancel,
  onConfirm
}: TastingConfirmationModalProps) {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(note.trim() || undefined);
    setNote(''); // Reset note for next use
  };

  const handleCancel = () => {
    setNote(''); // Reset note
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
                <Ionicons name="wine" size={24} color="#FFFFFF" />
                <Text style={styles.title}>Avez-vous dégusté ce vin ?</Text>
              </View>
              
              <Text style={styles.wineName}>{wineName}</Text>
              
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Note personnelle (optionnel)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Vos impressions sur ce vin..."
                  placeholderTextColor="#666666"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>Confirmer la dégustation</Text>
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
    padding: 20,
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
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  wineName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  noteContainer: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444444',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#393C40', borderWidth: 0,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 