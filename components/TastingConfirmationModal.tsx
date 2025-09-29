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
                <Text style={styles.title}>Avez-vous dégusté ce vin ?</Text>
              </View>
              
              <Text style={styles.wineName}>{wineName}</Text>
              
              <View style={styles.noteContainer}>
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
                  <Text style={styles.cancelButtonText} numberOfLines={1}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
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
  noteContainer: {
    marginBottom: 24,
    marginRight: -24,
    paddingRight: 24,
  },
  noteLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444444',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '100%',
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
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    numberOfLines: 1,
    flexShrink: 0,
  },
}); 