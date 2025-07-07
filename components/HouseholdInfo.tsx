import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useHousehold } from '../hooks/useHousehold';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HouseholdInfoProps {
  variant?: 'default' | 'settings' | 'modal';
}

export function HouseholdInfo({ variant = 'default' }: HouseholdInfoProps) {
  const {
    household,
    householdId,
    members,
    loading,
    error,
    joinHousehold,
    createHousehold,
    leaveHousehold,
    updateHouseholdName,
    regenerateJoinCode,
  } = useHousehold();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [householdName, setHouseholdName] = useState('');

  const copyJoinCode = async () => {
    if (household?.join_code) {
      await Clipboard.setStringAsync(household.join_code);
      Alert.alert('Code copié', 'Le code d\'invitation a été copié dans le presse-papiers');
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code d\'invitation');
      return;
    }

    try {
      await joinHousehold(joinCode.trim());
      setShowJoinModal(false);
      setJoinCode('');
      Alert.alert('Succès', 'Vous avez rejoint la cave partagée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la jointure');
    }
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour votre cave partagée');
      return;
    }

    try {
      await createHousehold(householdName.trim());
      setShowCreateModal(false);
      setHouseholdName('');
      Alert.alert('Succès', 'Votre cave partagée a été créée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la création');
    }
  };

  const handleUpdateHouseholdName = async () => {
    if (!householdName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour votre cave partagée');
      return;
    }

    try {
      await updateHouseholdName(householdName.trim());
      setShowEditModal(false);
      setHouseholdName('');
      Alert.alert('Succès', 'Le nom de votre cave partagée a été mis à jour !');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Quitter la cave partagée',
      'Êtes-vous sûr de vouloir quitter cette cave partagée ? Vous perdrez l\'accès à tous les vins partagés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveHousehold();
              Alert.alert('Succès', 'Vous avez quitté la cave partagée');
            } catch (error) {
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la sortie');
            }
          },
        },
      ]
    );
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      'Régénérer le code',
      'Êtes-vous sûr de vouloir générer un nouveau code d\'invitation ? L\'ancien code ne fonctionnera plus.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Régénérer',
          onPress: async () => {
            try {
              await regenerateJoinCode();
              Alert.alert('Succès', 'Un nouveau code d\'invitation a été généré');
            } catch (error) {
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la régénération');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Retirer le membre',
      `Êtes-vous sûr de vouloir retirer ${memberName} de la cave commune ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implémenter la suppression du membre
              Alert.alert('Succès', `${memberName} a été retiré de la cave commune`);
            } catch (error) {
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={variant === 'settings' ? styles.settingsContainer : styles.container}>
        <Text style={variant === 'settings' ? styles.settingsText : styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={variant === 'settings' ? styles.settingsContainer : styles.container}>
        <Text style={variant === 'settings' ? styles.settingsText : styles.errorText}>Erreur: {error.message}</Text>
      </View>
    );
  }

  // Version settings - plus simple
  if (variant === 'settings' || variant === 'modal') {
    if (!householdId) {
      return (
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => setShowJoinModal(true)}>
            <Text style={styles.settingsLabel}>Rejoindre une cave</Text>
            <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.settingsLabel}>Créer une cave</Text>
            <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={variant === 'modal' ? styles.modalContainer : styles.settingsContainer}>
        {/* Texte d'introduction */}
        <Text style={styles.modalIntroText}>
          Partage ta cave et gérez la à plusieurs
        </Text>
        
        {/* Code d'invitation */}
        <TouchableOpacity style={styles.modalActionRow} onPress={copyJoinCode}>
          <Text style={styles.modalActionLabel}>Envoyer le code</Text>
        </TouchableOpacity>
        
        {/* Membres cliquables */}
        <TouchableOpacity style={styles.modalActionRow} onPress={() => setShowMembersModal(true)}>
          <Text style={styles.modalActionLabel}>Membres</Text>
          <Text style={styles.modalActionValue}>{members.length} personne(s)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Version par défaut (profil) - garde le style original
  // Aucune household
  if (!householdId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="people-outline" size={24} color={Colors.accent} />
          <ThemedText style={styles.title}>Cave partagée</ThemedText>
        </View>
        
        <ThemedText style={styles.description}>
          Rejoignez ou créez une cave partagée pour partager vos vins avec vos proches.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="enter-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Rejoindre une cave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Créer une cave</Text>
          </TouchableOpacity>
        </View>

        {/* Modals pour la version par défaut uniquement */}
        {variant === 'default' && (
          <>
            {/* Modal pour rejoindre une household */}
            <Modal
              visible={showJoinModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowJoinModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>Rejoindre une cave partagée</ThemedText>
                  <ThemedText style={styles.modalDescription}>
                    Entrez le code d'invitation fourni par le créateur de la cave.
                  </ThemedText>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Code d'invitation (ex: ABC123)"
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowJoinModal(false);
                        setJoinCode('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={handleJoinHousehold}
                    >
                      <Text style={styles.confirmButtonText}>Rejoindre</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Modal pour créer une household */}
            <Modal
              visible={showCreateModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowCreateModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>Créer une cave partagée</ThemedText>
                  <ThemedText style={styles.modalDescription}>
                    Donnez un nom à votre cave partagée pour que vos proches puissent l'identifier.
                  </ThemedText>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Nom de la cave (ex: Cave familiale)"
                    value={householdName}
                    onChangeText={setHouseholdName}
                    autoCorrect={false}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowCreateModal(false);
                        setHouseholdName('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={handleCreateHousehold}
                    >
                      <Text style={styles.confirmButtonText}>Créer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
      </ThemedView>
    );
  }

  // Household existante
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={24} color={Colors.accent} />
        <ThemedText style={styles.title}>Cave partagée</ThemedText>
      </View>

      <View style={styles.householdInfo}>
        <View style={styles.householdHeader}>
          <ThemedText style={styles.householdName}>{household?.name}</ThemedText>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setHouseholdName(household?.name || '');
              setShowEditModal(true);
            }}
          >
            <Ionicons name="pencil" size={16} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.codeSection}>
          <ThemedText style={styles.codeLabel}>Code d'invitation :</ThemedText>
          <View style={styles.codeContainer}>
            <ThemedText style={styles.codeText}>{household?.join_code}</ThemedText>
            <TouchableOpacity style={styles.copyButton} onPress={copyJoinCode}>
              <Ionicons name="copy-outline" size={16} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.regenerateButton} onPress={handleRegenerateCode}>
              <Ionicons name="refresh-outline" size={16} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.membersSection}>
          <ThemedText style={styles.membersTitle}>
            Membres ({members.length})
          </ThemedText>
          <ScrollView style={styles.membersList}>
            {members.map((member) => (
              <View key={member.user_id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <ThemedText style={styles.memberName}>
                    {member.user?.first_name || member.user?.email || 'Membre inconnu'}
                  </ThemedText>
                  <ThemedText style={styles.memberEmail}>
                    {member.user?.email}
                  </ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={handleLeaveHousehold}
        >
          <Ionicons name="exit-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Quitter la cave</Text>
        </TouchableOpacity>
      </View>

      {/* Modal pour éditer le nom - version par défaut uniquement */}
      {variant === 'default' && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Modifier le nom de la cave</ThemedText>
              
              <TextInput
                style={styles.input}
                placeholder="Nouveau nom de la cave"
                value={householdName}
                onChangeText={setHouseholdName}
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEditModal(false);
                    setHouseholdName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleUpdateHouseholdName}
                >
                  <Text style={styles.confirmButtonText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal des membres - version modal uniquement */}
      {variant === 'modal' && (
        <Modal
          visible={showMembersModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMembersModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Membres de la cave</Text>
                <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.membersModalList}>
                {members.map((member) => (
                  <View key={member.user_id} style={styles.memberModalItem}>
                    <View style={styles.memberModalInfo}>
                      <View style={styles.memberModalAvatar}>
                        <Text style={styles.memberModalAvatarText}>
                          {member.user?.first_name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <Text style={styles.memberModalName}>
                        {member.user?.first_name || member.user?.email || 'Membre inconnu'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.memberModalRemoveButton}
                      onPress={() => handleRemoveMember(member.user_id, member.user?.first_name || 'ce membre')}
                    >
                      <Ionicons name="close" size={20} color="#F6A07A" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  joinButton: {
    backgroundColor: Colors.accent,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  leaveButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  householdInfo: {
    gap: 16,
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  householdName: {
    fontSize: 20,
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  codeSection: {
    gap: 8,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  regenerateButton: {
    padding: 4,
  },
  membersSection: {
    gap: 8,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  membersList: {
    maxHeight: 120,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 4,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#393C40',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: Colors.accent,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#F44336',
  },
  settingsContainer: {
    padding: 0,
    marginVertical: 0,
  },
  modalContainer: {
    padding: 20,
    marginVertical: 0,
  },
  settingsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFF',
    opacity: 0.7,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  settingsLabel: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 2,
  },
  settingsValue: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 2,
  },
  dangerText: {
    color: '#F6A07A',
  },
  modalIntroText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#393C40',
  },
  modalActionLabel: {
    color: '#FFF',
    fontSize: 16,
  },
  modalActionValue: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.7,
  },
  membersModalList: {
    maxHeight: 300,
  },
  memberModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#393C40',
  },
  memberModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6A07A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberModalAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberModalName: {
    color: '#FFF',
    fontSize: 16,
  },
  memberModalRemoveButton: {
    padding: 8,
  },
}); 