import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VeeniColors } from '../constants/Colors';
import { useFriends } from '../hooks/useFriends';
import { useMemoryPhotoUpload } from '../hooks/useMemoryPhotoUpload';
import { useUser } from '../hooks/useUser';
import { useWineMemories } from '../hooks/useWineMemories';
import { CreateWineMemoryData, WineMemory } from '../types/memory';

const { width } = Dimensions.get('window');

interface WineMemoriesScreenProps {
  wineId: string;
  wineName?: string;
}

export default function WineMemoriesScreen({ wineId, wineName }: WineMemoriesScreenProps) {
  const router = useRouter();
  const { user } = useUser();
  const { friends } = useFriends();
  const { memories, loading, createMemory, updateMemory, deleteMemory, toggleLike } = useWineMemories(wineId);
  const { pickImage, takePhoto, uploadPhoto, uploading } = useMemoryPhotoUpload();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<WineMemory | null>(null);
  
  // État local pour la création/édition (comme la fiche vin)
  const [memoryText, setMemoryText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMemory, setEditingMemory] = useState<WineMemory | null>(null);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setMemoryText('');
    setLocationText('');
    setSelectedFriends([]);
    setPhotoUrls([]);
    setIsEditing(false);
    setEditingMemory(null);
  };

  // Ouvrir le modal de création
  const handleCreateMemory = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Ouvrir le modal d'édition
  const handleEditMemory = (memory: WineMemory) => {
    setEditingMemory(memory);
    setMemoryText(memory.text || '');
    setLocationText(memory.location_text || '');
    setSelectedFriends(memory.friends_tagged || []);
    setPhotoUrls(memory.photo_urls || []);
    setIsEditing(true);
  };

  // Sauvegarder un nouveau souvenir
  const handleSaveMemory = async () => {
    try {
      const memoryData: CreateWineMemoryData = {
        wine_id: wineId,
        text: memoryText.trim() || undefined,
        location_text: locationText.trim() || undefined,
        friends_tagged: selectedFriends.length > 0 ? selectedFriends : undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined
      };

      await createMemory(memoryData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le souvenir');
    }
  };

  // Mettre à jour un souvenir existant
  const handleUpdateMemory = async (memoryId?: string) => {
    const targetMemoryId = memoryId || editingMemory?.id;
    if (!targetMemoryId) return;

    try {
      await updateMemory(targetMemoryId, {
        text: memoryText.trim() || undefined,
        location_text: locationText.trim() || undefined,
        friends_tagged: selectedFriends.length > 0 ? selectedFriends : undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined
      });

      if (editingMemory) {
        setIsEditing(false);
        setEditingMemory(null);
        resetForm();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le souvenir');
    }
  };

  // Mise à jour locale immédiate (comme la fiche vin)
  const updateLocalMemory = (memoryId: string, updates: Partial<WineMemory>) => {
    // Cette fonction sera appelée pour les mises à jour locales immédiates
    // L'état sera synchronisé avec Supabase via le hook
  };

  // Mise à jour locale immédiate des souvenirs
  const updateLocalMemories = (memoryId: string, updates: Partial<WineMemory>) => {
    // Cette fonction sera appelée pour les mises à jour locales immédiates
    // L'état sera synchronisé avec Supabase via le hook
  };

  // Initialiser l'état local quand on édite un souvenir
  useEffect(() => {
    if (editingMemory) {
      setMemoryText(editingMemory.text || '');
      setLocationText(editingMemory.location_text || '');
      setSelectedFriends(editingMemory.friends_tagged || []);
      setPhotoUrls(editingMemory.photo_urls || []);
    }
  }, [editingMemory]);

  // Supprimer un souvenir
  const handleDeleteMemory = (memory: WineMemory) => {
    Alert.alert(
      'Supprimer le souvenir',
      'Êtes-vous sûr de vouloir supprimer ce souvenir ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemory(memory.id);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le souvenir');
            }
          },
        },
      ]
    );
  };

  // Toggle like
  const handleToggleLike = async (memory: WineMemory) => {
    try {
      await toggleLike(memory.id);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de liker le souvenir');
    }
  };

  // Toggle ami sélectionné
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Gestion des photos
  const handleAddPhoto = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        setPhotoUrls(prev => [...prev, imageUri]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la photo');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Sauvegarder les modifications locales (comme la fiche vin)
  const handleSaveLocal = () => {
    if (isEditing && editingMemory) {
      handleUpdateMemory();
    } else {
      handleSaveMemory();
    }
  };

  // Rendre un souvenir (style fiche vin détaillée)
  const renderMemory = (memory: WineMemory) => {
    const isMyMemory = memory.user_id === user?.id;
    const taggedFriends = friends.filter(friend => 
      memory.friends_tagged?.includes(friend.id)
    );

    return (
      <View key={memory.id} style={styles.memoryCard}>
        {/* Image du souvenir */}
        <View style={styles.imageContainer}>
          {memory.photo_urls && memory.photo_urls.length > 0 ? (
            <ExpoImage
              source={{ uri: memory.photo_urls[0] }}
              style={styles.memoryImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="camera-outline" size={48} color="#666666" />
            </View>
          )}
          
          {/* Bouton paramètres */}
          {isMyMemory && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedMemory(memory);
                setShowActionsModal(true);
              }}
              style={styles.memorySettingsButton}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Informations principales */}
        <View style={styles.mainInfo}>
          <View style={styles.memoryUser}>
            <ExpoImage
              source={
                memory.user?.avatar
                  ? { uri: memory.user.avatar }
                  : require('../assets/images/default-wine.png')
              }
              style={styles.memoryAvatar}
              contentFit="cover"
            />
            <View style={styles.memoryUserInfo}>
              <Text style={styles.memoryUserName}>
                {memory.user?.first_name || 'Utilisateur'}
              </Text>
              <Text style={styles.memoryDate}>
                {new Date(memory.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          {/* Texte du souvenir */}
          <View style={styles.memoryTextSection}>
            <Text style={styles.memoryTextLabel}>Souvenir</Text>
            <TextInput
              style={styles.memoryTextInput}
              value={memory.text || ''}
              placeholder="Racontez votre souvenir…"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              editable={isMyMemory}
              onChangeText={(text) => {
                if (isMyMemory) {
                  setMemoryText(text);
                  // Mise à jour locale immédiate
                  updateLocalMemories(memory.id, { text });
                }
              }}
              onBlur={() => {
                if (isMyMemory && memory.text !== memoryText) {
                  handleUpdateMemory(memory.id);
                }
              }}
            />
          </View>

          {/* Localisation */}
          <View style={styles.memoryLocationSection}>
            <Text style={styles.memoryLocationLabel}>Lieu</Text>
            <TextInput
              style={styles.memoryLocationInput}
              value={memory.location_text || ''}
              placeholder="Lieu (facultatif)"
              placeholderTextColor="#666"
              editable={isMyMemory}
              onChangeText={(text) => {
                if (isMyMemory) {
                  setLocationText(text);
                  // Mise à jour locale immédiate
                  updateLocalMemory(memory.id, { location_text: text });
                }
              }}
              onBlur={() => {
                if (isMyMemory && memory.location_text !== locationText) {
                  handleUpdateMemory(memory.id);
                }
              }}
            />
          </View>

          {/* Amis associés */}
          <View style={styles.memoryFriendsSection}>
            <Text style={styles.memoryFriendsLabel}>Avec qui ?</Text>
            <TouchableOpacity 
              style={styles.memoryFriendsButton}
              onPress={() => {
                setEditingMemory(memory);
                setSelectedFriends(memory.friends_tagged || []);
                setShowFriendsModal(true);
              }}
            >
              {taggedFriends.length > 0 ? (
                <View style={styles.memoryFriendsList}>
                  {taggedFriends.slice(0, 3).map(friend => (
                    <ExpoImage
                      key={friend.id}
                      source={
                        friend.avatar
                          ? { uri: friend.avatar }
                          : require('../assets/images/default-wine.png')
                      }
                      style={styles.memoryFriendAvatar}
                      contentFit="cover"
                    />
                  ))}
                  {taggedFriends.length > 3 && (
                    <View style={styles.memoryFriendMore}>
                      <Text style={styles.memoryFriendMoreText}>
                        +{taggedFriends.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.memoryFriendsPlaceholder}>
                  Taguez vos amis
                </Text>
              )}
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          </View>

          {/* Actions (like) */}
          <View style={styles.memoryActions}>
            <TouchableOpacity 
              onPress={() => handleToggleLike(memory)}
              style={styles.memoryLikeButton}
            >
              <Ionicons 
                name={memory.has_liked ? 'heart' : 'heart-outline'} 
                size={20} 
                color={memory.has_liked ? VeeniColors.wine.red : '#CCCCCC'} 
              />
              <Text style={styles.memoryLikeCount}>
                {memory.likes_count || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Souvenirs - {wineName || 'Vin'}
          </Text>
        </View>
        
        <TouchableOpacity onPress={handleCreateMemory} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des souvenirs...</Text>
            </View>
          ) : memories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="camera-outline" size={64} color="#666666" />
              <Text style={styles.emptyTitle}>Aucun souvenir</Text>
              <Text style={styles.emptyText}>
                Partagez vos moments autour de ce vin avec vos amis
              </Text>
              <TouchableOpacity 
                onPress={handleCreateMemory}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Créer un souvenir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            memories.map(renderMemory)
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de création */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau souvenir</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Lieu */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Lieu (optionnel)</Text>
                <TextInput
                  style={styles.textInput}
                  value={locationText}
                  onChangeText={setLocationText}
                  placeholder="Ex: Dîner chez Julien à Paris"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Texte du souvenir */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Racontez votre souvenir</Text>
                <TextInput
                  style={styles.textArea}
                  value={memoryText}
                  onChangeText={setMemoryText}
                  placeholder="Partagez ce moment spécial..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Amis */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Avec qui ? (optionnel)</Text>
                <Text style={styles.inputHint}>
                  Taguez vos amis pour partager ce moment
                </Text>
                <View style={styles.friendsList}>
                  {friends.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      onPress={() => toggleFriendSelection(friend.id)}
                      style={[
                        styles.friendItem,
                        selectedFriends.includes(friend.id) && styles.friendItemSelected
                      ]}
                    >
                      <ExpoImage
                        source={
                          friend.avatar
                            ? { uri: friend.avatar }
                            : require('../assets/images/default-wine.png')
                        }
                        style={styles.friendAvatar}
                        contentFit="cover"
                      />
                      <Text style={styles.friendName}>{friend.first_name}</Text>
                      {selectedFriends.includes(friend.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveMemory}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal d'édition */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le souvenir</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Lieu */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Lieu (optionnel)</Text>
                <TextInput
                  style={styles.textInput}
                  value={locationText}
                  onChangeText={setLocationText}
                  placeholder="Ex: Dîner chez Julien à Paris"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Texte du souvenir */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Racontez votre souvenir</Text>
                <TextInput
                  style={styles.textArea}
                  value={memoryText}
                  onChangeText={setMemoryText}
                  placeholder="Partagez ce moment spécial..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Amis */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Avec qui ? (optionnel)</Text>
                <Text style={styles.inputHint}>
                  Taguez vos amis pour partager ce moment
                </Text>
                <View style={styles.friendsList}>
                  {friends.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      onPress={() => toggleFriendSelection(friend.id)}
                      style={[
                        styles.friendItem,
                        selectedFriends.includes(friend.id) && styles.friendItemSelected
                      ]}
                    >
                      <ExpoImage
                        source={
                          friend.avatar
                            ? { uri: friend.avatar }
                            : require('../assets/images/default-wine.png')
                        }
                        style={styles.friendAvatar}
                        contentFit="cover"
                      />
                      <Text style={styles.friendName}>{friend.first_name}</Text>
                      {selectedFriends.includes(friend.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUpdateMemory}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal d'actions */}
      <Modal
        visible={showActionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalAction} 
              onPress={() => {
                setShowActionsModal(false);
                if (selectedMemory) {
                  handleEditMemory(selectedMemory);
                }
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.modalActionText}>Modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalAction}>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.modalActionText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalAction} 
              onPress={() => {
                setShowActionsModal(false);
                if (selectedMemory) {
                  handleDeleteMemory(selectedMemory);
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
              <Text style={[styles.modalActionText, { color: '#FF4444' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: VeeniColors.wine.red,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Styles reprenant exactement la fiche vin détaillée
  memoryCard: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
    backgroundColor: '#2a2a2a',
  },
  memoryImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memorySettingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  mainInfo: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  memoryUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  memoryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memoryUserInfo: {
    flex: 1,
  },
  memoryUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memoryDate: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  memoryTextSection: {
    marginBottom: 20,
  },
  memoryTextLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  memoryTextInput: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  memoryLocationSection: {
    marginBottom: 20,
  },
  memoryLocationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  memoryLocationInput: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
  },
  memoryFriendsSection: {
    marginBottom: 20,
  },
  memoryFriendsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  memoryFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  memoryFriendsList: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memoryFriendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  memoryFriendMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#393C40',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  memoryFriendMoreText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memoryFriendsPlaceholder: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  memoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  memoryLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryLikeCount: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 6,
  },
  // Modales (style fiche vin détaillée)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  friendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#393C40',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  friendItemSelected: {
    backgroundColor: VeeniColors.wine.red,
  },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  friendName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#444444',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: VeeniColors.wine.red,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  modalActionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
});
