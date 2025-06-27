import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { useFriends } from '../../hooks/useFriends';
import { useUser } from '../../hooks/useUser';
import { User } from '../../types/user';

export default function FriendsScreen() {
  const router = useRouter();
  const { user, loading: userLoading, error: userError, addFriend, removeFriend } = useUser();
  const { friends, loading: friendsLoading, error: friendsError, refetch: refetchFriends } = useFriends(user?.friends || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  const filteredFriends = useMemo(() => {
    if (!friends) return [];
    return friends.filter((friend: User) => 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  const stats = useMemo(() => {
    if (!friends) return { total: 0, online: 0 };
    return {
      total: friends.length,
      online: friends.filter((f: User) => f.online).length,
    };
  }, [friends]);

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide');
      return;
    }

    try {
      setAddingFriend(true);
      await addFriend(friendEmail.trim());
      await refetchFriends(); // Recharger la liste des amis
      setShowAddModal(false);
      setFriendEmail('');
      Alert.alert('Succès', 'Ami ajouté avec succès !');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter cet ami. Vérifiez l\'email et réessayez.');
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert(
      'Supprimer un ami',
      'Êtes-vous sûr de vouloir supprimer cet ami ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              await refetchFriends(); // Recharger la liste des amis
              Alert.alert('Succès', 'Ami supprimé avec succès');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Erreur', 'Impossible de supprimer cet ami');
            }
          },
        },
      ]
    );
  };

  const handleViewFriendProfile = (friendId: string) => {
    router.push(`/friend/${friendId}`);
  };

  if (userLoading || friendsLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (userError || friendsError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Erreur: {userError?.message || friendsError?.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#F6A07A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes amis</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#F6A07A" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Amis</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.online}</Text>
          <Text style={styles.statLabel}>En ligne</Text>
        </View>
      </View>

      <SearchFilterBar
        value={searchQuery}
        onChange={setSearchQuery}
        onFilterPress={() => {}}
        placeholder="Rechercher un ami..."
      />

      <ScrollView style={styles.friendList}>
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>
              {friends.length === 0 ? 'Vous n\'avez pas encore d\'amis' : 'Aucun ami trouvé'}
            </Text>
            <TouchableOpacity 
              style={styles.addFirstFriendButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addFirstFriendText}>Ajouter un ami</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredFriends.map((friend: User) => (
            <TouchableOpacity
              key={friend.id}
              style={styles.friendItem}
              onPress={() => handleViewFriendProfile(friend.id)}
            >
              <View style={styles.friendAvatar}>
                {friend.avatar ? (
                  <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.friendAvatarPlaceholder}>
                    <Text style={styles.friendAvatarInitial}>
                      {friend.first_name ? friend.first_name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
                {friend.online && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.first_name || friend.name}</Text>
                <Text style={styles.friendEmail}>{friend.email}</Text>
                <Text style={styles.friendStatus}>
                  {friend.online ? 'En ligne' : 'Hors ligne'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFriend(friend.id)}
              >
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un ami</Text>
            <Text style={styles.modalSubtitle}>
              Saisissez l'adresse email de votre ami pour l'ajouter
            </Text>
            <TextInput
              style={styles.emailInput}
              value={friendEmail}
              onChangeText={setFriendEmail}
              placeholder="email@exemple.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
                disabled={addingFriend}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm,
                  addingFriend && styles.modalButtonDisabled
                ]}
                onPress={handleAddFriend}
                disabled={addingFriend}
              >
                <Text style={styles.modalButtonText}>
                  {addingFriend ? 'Ajout...' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    color: '#F6A07A',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(246, 160, 122, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(246, 160, 122, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F6A07A',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  friendList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstFriendButton: {
    backgroundColor: '#F6A07A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFirstFriendText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  friendAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#222',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 2,
  },
  friendStatus: {
    color: '#666',
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 20,
    textAlign: 'center',
  },
  emailInput: {
    backgroundColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 24,
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
  modalButtonDisabled: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
}); 