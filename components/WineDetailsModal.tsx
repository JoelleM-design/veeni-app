import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import WineDetailsModalContent from './WineDetailsModalContent';

interface WineDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  wineId: string;
  viewerUserId?: string;
  contextOwnerUserId?: string;
  context?: 'user' | 'friend';
  wineData?: string;
  returnToOcr?: string;
}

export default function WineDetailsModal({
  visible,
  onClose,
  wineId,
  viewerUserId,
  contextOwnerUserId,
  context,
  wineData,
  returnToOcr,
}: WineDetailsModalProps) {
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

        {/* Contenu de la fiche vin */}
        <View style={styles.content}>
          <WineDetailsModalContent
            wineId={wineId}
            viewerUserId={viewerUserId}
            contextOwnerUserId={contextOwnerUserId}
            context={context}
            wineData={wineData}
            returnToOcr={returnToOcr}
            onBack={onClose}
          />
        </View>
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
