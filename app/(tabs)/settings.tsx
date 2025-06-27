import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // États pour l'édition du profil
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  
  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const router = useRouter();
  const { user, updateUser } = useUser();

  // Initialiser les valeurs du formulaire
  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleEditProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Le prénom ne peut pas être vide');
      return;
    }

    try {
      setEditingProfile(true);
      await updateUser({ first_name: firstName.trim() });
      setShowEditProfileModal(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setEditingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setChangingPassword(true);
      
      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erreur', 'Mot de passe actuel incorrect');
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Succès', 'Mot de passe mis à jour avec succès');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Erreur', 'Impossible de changer le mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!currentPassword) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe pour confirmer');
      return;
    }

    try {
      setDeletingAccount(true);
      
      // Vérifier le mot de passe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erreur', 'Mot de passe incorrect');
        return;
      }

      // Appeler la fonction RPC pour supprimer le compte
      const { error: deleteError } = await supabase.rpc('delete_user_and_data');

      if (deleteError) throw deleteError;

      Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès');
      router.replace('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le compte');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton back */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Text style={styles.headerTitle}>Réglages</Text>
        </View>
        {/* Espace réservé pour équilibrer le header */}
        <View style={{ width: 36 }} />
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Activer les notifications push</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#888', true: '#F6A07A' }}
            thumbColor={pushEnabled ? '#FFF' : '#FFF'}
          />
        </View>
        <Text style={styles.subLabel}>Reçois une alerte quand un ami ajoute ou aime un vin.</Text>
        <View style={styles.separator} />
        
        {/* Mon compte */}
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <TouchableOpacity style={styles.rowBetween} onPress={() => setShowEditProfileModal(true)}>
          <View style={styles.rowLeft}>
            <Ionicons name="person" size={20} color="#F6A07A" style={styles.rowIcon} />
            <Text style={styles.label}>Modifier mon profil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.rowBetween} onPress={() => setShowPasswordModal(true)}>
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed" size={20} color="#F6A07A" style={styles.rowIcon} />
            <Text style={styles.label}>Changer mon mot de passe</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        
        <View style={styles.separator} />
        
        {/* Mentions légales */}
        <Text style={styles.sectionTitle}>Mentions légales</Text>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Conditions générales d'utilisation</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Politique de confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Contacter le support</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        
        {/* Déconnexion et suppression */}
        <View style={styles.separator} />
        <TouchableOpacity style={styles.logoutRow} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#F6A07A" style={styles.rowIcon} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteRow} onPress={() => setShowDeleteModal(true)}>
          <Ionicons name="trash" size={20} color="#FF6B6B" style={styles.rowIcon} />
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal d'édition du profil */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditProfileModal(false)}
                disabled={editingProfile}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleEditProfile}
                disabled={editingProfile}
              >
                <Text style={styles.modalButtonText}>
                  {editingProfile ? 'Mise à jour...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer mon mot de passe</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mot de passe actuel"
              placeholderTextColor="#666"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#666"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor="#666"
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPasswordModal(false)}
                disabled={changingPassword}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.modalButtonText}>
                  {changingPassword ? 'Mise à jour...' : 'Changer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de suppression de compte */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer mon compte</Text>
            <Text style={styles.modalWarning}>
              ⚠️ Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mot de passe pour confirmer"
              placeholderTextColor="#666"
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
              >
                <Text style={styles.modalButtonText}>
                  {deletingAccount ? 'Suppression...' : 'Supprimer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  sectionTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 32,
    marginBottom: 16,
    marginLeft: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 12,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 2,
  },
  subLabel: {
    color: '#B0B0B0',
    fontSize: 15,
    marginBottom: 12,
    marginLeft: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#393C40',
    marginVertical: 22,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  logoutText: {
    color: '#F6A07A',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  deleteText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  headerBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.0)',
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#444',
  },
  modalButtonConfirm: {
    backgroundColor: '#F6A07A',
  },
  modalButtonDelete: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
}); 