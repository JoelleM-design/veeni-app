import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { VeeniColors } from '../constants/Colors';

interface PersonalNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote?: string;
  title?: string;
}

export default function PersonalNoteModal({
  visible,
  onClose,
  onSave,
  initialNote = '',
  title = 'Note personnelle'
}: PersonalNoteModalProps) {
  const [note, setNote] = useState(initialNote);

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  const handleClose = () => {
    if (note !== initialNote) {
      Alert.alert(
        'Note non sauvegardée',
        'Voulez-vous vraiment fermer sans sauvegarder ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Fermer', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.textInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ajoutez votre note personnelle..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    padding: 10,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: VeeniColors.accent.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    padding: 0,
  },
}); 