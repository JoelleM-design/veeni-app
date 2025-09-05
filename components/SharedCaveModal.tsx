import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useSharedCave } from '../hooks/useSharedCave';

interface SharedCaveModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'join' | 'share' | 'manage';
}

export const SharedCaveModal: React.FC<SharedCaveModalProps> = ({
  visible,
  onClose,
  mode
}) => {
  const {
    sharedCave,
    loading,
    error,
    userRole,
    caveState,
    createSharedCave,
    joinSharedCave,
    removePartner,
    leaveSharedCave,
    deleteSharedCave,
    getUserEmail,
    refresh
  } = useSharedCave();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [partnerUserEmail, setPartnerUserEmail] = useState<string>('');
  const [inviteCode, setInviteCode] = useState('');

  // Récupérer les emails des utilisateurs
  useEffect(() => {
    const fetchEmails = async () => {
      if (sharedCave) {
        try {
          const owner = await getUserEmail(sharedCave.owner_id);
          setOwnerEmail(owner);
          
          if (sharedCave.partner_id) {
            const partner = await getUserEmail(sharedCave.partner_id);
            setPartnerUserEmail(partner);
          } else {
            setPartnerUserEmail('');
          }
        } catch (err) {
          console.error('Erreur lors de la récupération des emails:', err);
        }
      }
    };

    fetchEmails();
  }, [sharedCave, getUserEmail]);

  const handleCreateCave = async () => {
    try {
      setIsSubmitting(true);
      await createSharedCave();
      Alert.alert('Succès', 'Votre cave partagée a été créée !');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCave = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un code d\'invitation');
      return;
    }

    try {
      setIsSubmitting(true);
      await joinSharedCave(inviteCode.trim());
      setInviteCode('');
      Alert.alert('Succès', 'Vous avez rejoint la cave partagée !');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur lors de la jonction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePartner = async () => {
    Alert.alert(
      'Confirmer',
      'Êtes-vous sûr de vouloir retirer votre partenaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await removePartner();
              Alert.alert('Succès', 'Partenaire retiré');
            } catch (err) {
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur lors du retrait');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleLeaveCave = async () => {
    Alert.alert(
      'Confirmer',
      'Êtes-vous sûr de vouloir quitter cette cave partagée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await leaveSharedCave();
              onClose();
              Alert.alert('Succès', 'Vous avez quitté la cave partagée');
            } catch (err) {
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur lors de la sortie');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteCave = async () => {
    Alert.alert(
      'Confirmer',
      'Êtes-vous sûr de vouloir supprimer cette cave partagée ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await deleteSharedCave();
              onClose();
              Alert.alert('Succès', 'Cave partagée supprimée');
            } catch (err) {
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur lors de la suppression');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity style={styles.button} onPress={refresh}>
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Mode rejoindre
    if (mode === 'join') {
      if (caveState === 'shared') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Déjà dans une cave partagée</Text>
            <Text style={styles.description}>Tu fais déjà partie d'une cave partagée, tu ne peux pas en rejoindre une autre.</Text>
          </View>
        );
      }
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Rejoindre une cave</Text>
          <Text style={styles.description}>Entre le code d'invitation fourni par ton partenaire.</Text>
          <TextInput
            style={styles.input}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="ABC123"
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleJoinCave}
            disabled={isSubmitting || !inviteCode.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Rejoindre</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    // Mode partager
    if (mode === 'share') {
      if (caveState === 'shared') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Déjà dans une cave partagée</Text>
            <Text style={styles.description}>Tu fais déjà partie d'une cave partagée, tu ne peux pas inviter une autre personne.</Text>
          </View>
        );
      }
      if (caveState === 'owner_only' && userRole === 'owner') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Partager ma cave</Text>
            <Text style={styles.description}>Voici ton code d'invitation à partager :</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{sharedCave?.invite_code}</Text>
            </View>
            <Text style={styles.codeDescription}>Partage ce code avec ton partenaire pour qu'il puisse rejoindre ta cave.</Text>
          </View>
        );
      }
      // Si aucune cave, proposer de créer
      if (caveState === 'none') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Créer une cave partagée</Text>
            <Text style={styles.description}>Tu n'as pas encore de cave partagée. Crée-en une pour obtenir un code d'invitation.</Text>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCreateCave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Créer ma cave partagée</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      }
    }
    // Mode gérer
    if (mode === 'manage') {
      if (caveState !== 'shared') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Aucune cave partagée</Text>
            <Text style={styles.description}>Tu dois d'abord partager ou rejoindre une cave pour la gérer.</Text>
          </View>
        );
      }
      // Propriétaire
      if (userRole === 'owner') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Gérer ma cave</Text>
            <Text style={styles.description}>Tu partages ta cave avec :</Text>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerLabel}>Partenaire :</Text>
              <Text style={styles.partnerName}>{partnerUserEmail}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRemovePartner}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>Retirer le partenaire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleDeleteCave}
              disabled={isSubmitting}
            >
              <Text style={styles.dangerButtonText}>Supprimer la cave partagée</Text>
            </TouchableOpacity>
          </View>
        );
      }
      // Partenaire
      if (userRole === 'partner') {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Gérer ma cave</Text>
            <Text style={styles.description}>Tu es partenaire dans la cave de :</Text>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerLabel}>Propriétaire :</Text>
              <Text style={styles.partnerName}>{ownerEmail}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleLeaveCave}
              disabled={isSubmitting}
            >
              <Text style={styles.dangerButtonText}>Quitter la cave partagée</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {renderContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#23262A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#FFF',
  },
  description: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  separator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorText: {
    fontSize: 16,
    color: '#CCC',
    backgroundColor: '#23262A',
    paddingHorizontal: 16,
  },
  joinContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
    backgroundColor: '#333',
    color: '#FFF',
  },
  codeContainer: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  codeDescription: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#393C40', borderWidth: 0,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  dangerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  partnerInfo: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  partnerLabel: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
}); 