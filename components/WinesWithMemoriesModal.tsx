import {
    Modal,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import WinesWithMemoriesScreen from '../screens/WinesWithMemoriesScreen';

interface WinesWithMemoriesModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  viewerId?: string;
}

export default function WinesWithMemoriesModal({
  visible,
  onClose,
  userId,
  viewerId,
}: WinesWithMemoriesModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header avec barre de fermeture */}
        <TouchableOpacity 
          style={styles.header}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        {/* Contenu de la liste des vins avec SafeAreaView intégré */}
        <SafeAreaView style={styles.content}>
          <WinesWithMemoriesScreen
            userId={userId}
            viewerId={viewerId}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
});
