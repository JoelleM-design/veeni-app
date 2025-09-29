import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VeeniColors } from '../constants/Colors';
import { useAllFriends } from '../hooks/useAllFriends';
import { useMemoryPhotoUpload } from '../hooks/useMemoryPhotoUpload';
import { useUser } from '../hooks/useUser';
import { useWineMemoriesOptimized } from '../hooks/useWineMemoriesOptimized';
import { CreateWineMemoryData } from '../types/memory';

const { width } = Dimensions.get('window');

interface WineMemoriesScreenV2Props {
  wineId: string;
  wineName?: string;
  isReadOnlyMode?: boolean;
  isEmbedded?: boolean; // Si true, ne pas utiliser SafeAreaView
}

export default function WineMemoriesScreenV2({ wineId, wineName, isReadOnlyMode = false, isEmbedded = false }: WineMemoriesScreenV2Props) {
  const router = useRouter();
  const { user } = useUser();
  const { friends } = useAllFriends();
  const { memories, loading, createMemory, updateMemory } = useWineMemoriesOptimized(wineId);
  const { pickImage, uploadPhoto, uploading } = useMemoryPhotoUpload();
  
  // Obtenir le souvenir actuel directement depuis les memories
  const currentMemory = memories && memories.length > 0 ? memories[0] : null;
  
  // Debug logs
  console.log('🔍 DEBUG currentMemory:', {
    memoriesLength: memories?.length,
    currentMemory: currentMemory ? {
      id: currentMemory.id,
      user_id: currentMemory.user_id,
      friends_tagged: currentMemory.friends_tagged
    } : null
  });

  // Déterminer si l'utilisateur connecté peut modifier le souvenir
  const canEditMemory = useMemo(() => {
    if (!user || !currentMemory) return !isReadOnlyMode;
    // L'utilisateur peut modifier seulement s'il est le créateur du souvenir
    return currentMemory.user_id === user.id;
  }, [user, currentMemory, isReadOnlyMode]);

  // Obtenir la liste complète des participants (créateur + amis tagués)
  const getAllParticipants = useMemo(() => {
    console.log('🔍 getAllParticipants called:', {
      friendsLength: friends?.length,
      currentMemoryUserId: currentMemory?.user_id,
      editingFieldsFriendsTagged: editingFields?.friends_tagged,
      currentMemoryFriendsTagged: currentMemory?.friends_tagged
    });
    
    if (!friends) return [];
    
    const participants = new Set<string>();
    
    // Ajouter le créateur du souvenir
    if (currentMemory?.user_id) {
      participants.add(currentMemory.user_id);
    }
    
    // Ajouter les amis tagués (depuis les mises à jour locales ou la base)
    const friendsTagged = editingFields?.friends_tagged !== undefined 
      ? editingFields.friends_tagged 
      : (currentMemory?.friends_tagged || []);
    
    friendsTagged.forEach(friendId => participants.add(friendId));
    
    const result = Array.from(participants).map(userId => {
      // Chercher d'abord dans les amis
      let foundUser = friends.find(f => f.id === userId);
      
      // Si pas trouvé dans les amis, c'est peut-être l'utilisateur connecté
      if (!foundUser && userId === user?.id) {
        foundUser = { id: user.id, first_name: user.first_name || 'Utilisateur', avatar: user.avatar };
      }
      
      return foundUser ? { id: userId, ...foundUser } : null;
    }).filter(Boolean);
    
    console.log('🎯 getAllParticipants result:', {
      participantsCount: participants.size,
      participants: Array.from(participants),
      resultLength: result.length,
      resultNames: result.map(r => r.first_name)
    });
    
    return result;
  }, [currentMemory, friends, editingFields]);
  
  // État local pour les mises à jour immédiates (comme la fiche détaillée)
  const [localMemoryUpdates, setLocalMemoryUpdates] = useState<Partial<any>>({});
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // États de base
  const [memoryText, setMemoryText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour la modale de sélection d'amis
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Fermer le clavier
  const dismissKeyboard = () => {
    try {
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erreur lors de la fermeture du clavier:', error);
    }
  };

  // Source de vérité UI: mémoire DB + mises à jour locales (comme la fiche détaillée)
  const safeMemory = useMemo(() => {
    if (!currentMemory) return null;
    const result = { ...currentMemory, ...localMemoryUpdates };
    return result;
  }, [currentMemory, localMemoryUpdates]);

  // Nettoyer les mises à jour locales quand la mémoire se met à jour depuis la base
  useEffect(() => {
    if (currentMemory && Object.keys(localMemoryUpdates).length > 0) {
      // Vérifier si les valeurs locales sont maintenant synchronisées avec la base
      const isSynced = Object.entries(localMemoryUpdates).every(([key, value]) => {
        return currentMemory[key as keyof typeof currentMemory] === value;
      });
      
      if (isSynced) {
        setLocalMemoryUpdates({});
      }
    }
  }, [currentMemory, localMemoryUpdates]);

  // Gestion des changements de champs (comme la fiche détaillée)
  const handleFieldChange = (field: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldFocus = (field: string, currentValue: any, placeholder: string) => {
    setFocusedField(field);
    if (editingFields[field] === undefined) {
      setEditingFields(prev => ({ ...prev, [field]: currentValue }));
    }
  };

  const handleFieldBlur = async (field: string) => {
    setFocusedField(null);
    const newValue = editingFields[field];
    if (newValue !== undefined && newValue !== safeMemory?.[field as keyof typeof safeMemory]) {
      try {
        setIsSaving(true);
        console.log('🔄 Sauvegarde du champ:', field, newValue);
        
        // Auto-inclure le créateur dans friends_tagged
        const friendsTagged = field === 'friends_tagged' ? newValue : (safeMemory?.friends_tagged || []);
        const friendsWithCreator = Array.from(new Set([...(friendsTagged || []), user?.id].filter(Boolean)));
        
        const memoryData: CreateWineMemoryData = {
          wine_id: wineId,
          text: field === 'text' ? newValue : (safeMemory?.text || ''),
          location_text: field === 'location_text' ? newValue : (safeMemory?.location_text || ''),
          friends_tagged: friendsWithCreator,
          photo_urls: field === 'photo_urls' ? newValue : (safeMemory?.photo_urls || [])
        };

        if (currentMemory) {
          // Mise à jour optimiste immédiate
          setLocalMemoryUpdates(prev => {
            const newUpdates = { ...prev, [field]: newValue };
            if (field === 'friends_tagged') {
              newUpdates.friends_tagged = friendsWithCreator;
            }
            return newUpdates;
          });
          
          await updateMemory(currentMemory.id, memoryData);
          console.log('✅ Souvenir mis à jour');
        } else {
          const newMemory = await createMemory(memoryData);
          // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(newMemory);
          console.log('✅ Nouveau souvenir créé');
        }
        
        setEditingFields(prev => {
          const newFields = { ...prev };
          delete newFields[field];
          return newFields;
        });
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de ${field}:`, error);
        // Revenir à la valeur précédente en cas d'erreur
        setLocalMemoryUpdates(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Initialiser les données du souvenir existant (chargement immédiat depuis le cache)
  useEffect(() => {
    if (memories.length > 0) {
      const memory = memories[0]; // Un seul souvenir par vin
      // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(memory);
      setMemoryText(memory.text || '');
      setLocationText(memory.location_text || '');
      setSelectedFriends(memory.friends_tagged || []);
      setPhotoUrls(memory.photo_urls || []);
      console.log('✅ Souvenir chargé depuis le cache:', memory);
    } else {
      // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(null);
      setMemoryText('');
      setLocationText('');
      setSelectedFriends([]);
      setPhotoUrls([]);
      console.log('ℹ️ Aucun souvenir en cache pour ce vin');
    }
  }, [memories]);

  // Charger les données initiales depuis le cache local immédiatement
  useEffect(() => {
    const cachedMemories = memories.filter(m => m.wine_id === wineId);
    if (cachedMemories.length > 0) {
      const memory = cachedMemories[0];
      // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(memory);
      setMemoryText(memory.text || '');
      setLocationText(memory.location_text || '');
      setSelectedFriends(memory.friends_tagged || []);
      setPhotoUrls(memory.photo_urls || []);
      console.log('🚀 Chargement immédiat depuis le cache local');
    }
  }, [wineId]);

  // Toggle ami sélectionné (avec sauvegarde immédiate)
  const toggleFriendSelection = async (friendId: string) => {
    try {
      const currentFriends = safeMemory?.friends_tagged || [];
      const newFriends = currentFriends.includes(friendId) 
        ? currentFriends.filter(id => id !== friendId)
        : [...currentFriends, friendId];
      
      // Auto-inclusion du créateur
      const friendsWithCreator = Array.from(new Set([...newFriends, user?.id].filter(Boolean)));

      console.log('🔄 toggleFriendSelection debug:', {
        friendId,
        currentFriends,
        newFriends,
        user_id: user?.id,
        friendsWithCreator
      });

      // Mise à jour optimiste immédiate
      setLocalMemoryUpdates(prev => ({
        ...prev,
        friends_tagged: friendsWithCreator
      }));
      
      // Mise à jour des champs en édition pour l'affichage en temps réel
      setEditingFields(prev => {
        const newFields = {
          ...prev,
          friends_tagged: friendsWithCreator
        };
        console.log('📝 setEditingFields:', newFields);
        return newFields;
      });

      const memoryData: CreateWineMemoryData = {
        wine_id: wineId,
        text: safeMemory?.text || '',
        location_text: safeMemory?.location_text || '',
        friends_tagged: friendsWithCreator,
        photo_urls: safeMemory?.photo_urls || []
      };

      if (currentMemory) {
        await updateMemory(currentMemory.id, memoryData);
      } else {
        const newMemory = await createMemory(memoryData);
        // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(newMemory);
      }
    } catch (error) {
      console.error('Erreur dans toggleFriendSelection:', error);
    }
  };

  // Gestion des photos (avec sauvegarde immédiate)
  const handleAddPhoto = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        const uploadedUrl = await uploadPhoto(imageUri, wineId);
        if (uploadedUrl) {
          const currentPhotos = safeMemory?.photo_urls || [];
          const newPhotos = [...currentPhotos, uploadedUrl];
          
          // Mise à jour optimiste immédiate
          setLocalMemoryUpdates(prev => ({
            ...prev,
            photo_urls: newPhotos
          }));
          
          // Sauvegarde
          const memoryData: CreateWineMemoryData = {
            wine_id: wineId,
            text: safeMemory?.text || '',
            location_text: safeMemory?.location_text || '',
            friends_tagged: safeMemory?.friends_tagged || [],
            photo_urls: newPhotos
          };

          if (currentMemory) {
            await updateMemory(currentMemory.id, memoryData);
          } else {
            const newMemory = await createMemory(memoryData);
            // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(newMemory);
          }
        }
      }
    } catch (error) {
      console.error('Erreur dans handleAddPhoto:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la photo');
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      const currentPhotos = safeMemory?.photo_urls || [];
      const newPhotos = currentPhotos.filter((_, i) => i !== index);
      
      // Mise à jour optimiste immédiate
      setLocalMemoryUpdates(prev => ({
        ...prev,
        photo_urls: newPhotos
      }));
      
      // Sauvegarde
      const memoryData: CreateWineMemoryData = {
        wine_id: wineId,
        text: safeMemory?.text || '',
        location_text: safeMemory?.location_text || '',
        friends_tagged: safeMemory?.friends_tagged || [],
        photo_urls: newPhotos
      };

      if (currentMemory) {
        await updateMemory(currentMemory.id, memoryData);
      } else {
        const newMemory = await createMemory(memoryData);
        // setCurrentMemory (supprimé - currentMemory est maintenant calculé directement)(newMemory);
      }
    } catch (error) {
      console.error('Erreur dans handleRemovePhoto:', error);
    }
  };



  const content = (
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
          {/* Formulaire de création */}
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.memoryForm}>
            {/* Image du souvenir */}
            <View style={styles.imageContainer}>
              {(safeMemory?.photo_urls && safeMemory.photo_urls.length > 0) ? (
                <>
                  {console.log('🖼️ Affichage image:', safeMemory.photo_urls[0])}
                  <ExpoImage
                    source={{ uri: safeMemory.photo_urls[0] }}
                    style={styles.memoryImage}
                    contentFit="cover"
                    onError={(error) => console.error('❌ Erreur affichage image:', error)}
                    onLoad={() => console.log('✅ Image chargée avec succès')}
                  />
                </>
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="camera-outline" size={48} color="#666666" />
                </View>
              )}
              
              {canEditMemory && (
                <>
                  <TouchableOpacity 
                    onPress={handleAddPhoto} 
                    style={styles.addPhotoButton}
                    disabled={uploading}
                  >
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  {(safeMemory?.photo_urls && safeMemory.photo_urls.length > 0) && (
                    <TouchableOpacity 
                      onPress={() => handleRemovePhoto(0)}
                      style={styles.removePhotoButton}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Informations principales */}
            <View style={styles.mainInfo}>
              {/* Texte du souvenir */}
              <View style={styles.memoryTextSection}>
                <Text style={styles.memoryTextLabel}>Souvenir</Text>
                {!canEditMemory ? (
                  <Text style={styles.memoryTextReadOnly}>
                    {safeMemory?.text || 'Aucun souvenir partagé'}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.memoryTextInput}
                    value={editingFields.text !== undefined ? editingFields.text : (safeMemory?.text || '')}
                    placeholder="Racontez votre souvenir…"
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    onChangeText={(text) => handleFieldChange('text', text)}
                    onFocus={() => handleFieldFocus('text', safeMemory?.text || '', 'Racontez votre souvenir…')}
                    onBlur={() => handleFieldBlur('text')}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    textAlignVertical="top"
                  />
                )}
              </View>

              {/* Localisation */}
              <View style={styles.memoryLocationSection}>
                <Text style={styles.memoryLocationLabel}>Lieu</Text>
                {!canEditMemory ? (
                  <Text style={styles.memoryLocationReadOnly}>
                    {safeMemory?.location_text || 'Non spécifié'}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.memoryLocationInput}
                    value={editingFields.location_text !== undefined ? editingFields.location_text : (safeMemory?.location_text || '')}
                    placeholder="Lieu (facultatif)"
                    placeholderTextColor="#666"
                    onChangeText={(text) => handleFieldChange('location_text', text)}
                    onFocus={() => handleFieldFocus('location_text', safeMemory?.location_text || '', 'Lieu (facultatif)')}
                    onBlur={() => handleFieldBlur('location_text')}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                )}
              </View>

              {/* Amis associés */}
              <View style={styles.memoryFriendsSection}>
                <Text style={styles.memoryFriendsLabel}>Avec qui ?</Text>
                {!canEditMemory ? (
                  <View style={styles.friendsListReadOnly}>
                    {getAllParticipants.length > 0 ? (
                      getAllParticipants.map((participant) => (
                        <View key={participant.id} style={styles.friendItemReadOnly}>
                          <ExpoImage
                            source={
                              participant.avatar
                                ? { uri: participant.avatar }
                                : require('../assets/images/default-wine.png')
                            }
                            style={styles.friendAvatar}
                            contentFit="cover"
                          />
                          <Text style={styles.friendName}>
                            {participant.first_name}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noFriendsText}>Aucun ami associé</Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.friendsSelector}
                    onPress={() => setShowFriendsModal(true)}
                  >
                    <View style={styles.friendsDisplay}>
                      {getAllParticipants.length > 0 ? (
                        <View style={styles.selectedFriendsContainer}>
                          {getAllParticipants.map((participant) => (
                            <View key={participant.id} style={styles.selectedFriendTag}>
                              <ExpoImage
                                source={
                                  participant.avatar
                                    ? { uri: participant.avatar }
                                    : require('../assets/images/default-wine.png')
                                }
                                style={styles.friendAvatarSmall}
                                contentFit="cover"
                              />
                              <Text style={styles.selectedFriendName}>
                                {participant.first_name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.friendsPlaceholder}>Sélectionner des amis</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Indicateurs de statut */}
              <View style={styles.statusIndicators}>
                {isSaving && (
                  <View style={styles.savingIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.savingText}>Sauvegarde...</Text>
                  </View>
                )}
                {loading && !currentMemory && (
                  <View style={styles.loadingIndicator}>
                    <Ionicons name="sync" size={16} color="#999" />
                    <Text style={styles.loadingText}>Synchronisation...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>

        </ScrollView>
      </KeyboardAvoidingView>
  );

  // Si intégré dans WineDetailsScreenV2, ne pas utiliser SafeAreaView
  if (isEmbedded) {
    return (
      <>
        {content}
        {/* Modal sélection amis */}
        <Modal
          visible={showFriendsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFriendsModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFriendsModal(false)}
          >
            <View style={styles.friendsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner des amis</Text>
                <TouchableOpacity onPress={() => setShowFriendsModal(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
                <FlatList
                  data={friends || []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item: friend }) => {
                    const currentFriends = safeMemory?.friends_tagged || [];
                    const isSelected = currentFriends.includes(friend.id);
                    return (
                      <TouchableOpacity
                        style={[styles.modalFriendItem, isSelected && styles.modalFriendItemSelected]}
                        onPress={() => toggleFriendSelection(friend.id)}
                      >
                        <ExpoImage
                          source={
                            friend.avatar
                              ? { uri: friend.avatar }
                              : require('../assets/images/default-wine.png')
                          }
                          style={styles.modalFriendAvatar}
                          contentFit="cover"
                        />
                        <Text style={styles.modalFriendName}>{friend.first_name}</Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Sinon, utiliser SafeAreaView
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {content}
      {/* Modal sélection amis */}
      <Modal
        visible={showFriendsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFriendsModal(false)}
        >
          <View style={styles.friendsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner des amis</Text>
              <TouchableOpacity onPress={() => setShowFriendsModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <FlatList
                data={friends || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item: friend }) => {
                  const currentFriends = safeMemory?.friends_tagged || [];
                  const isSelected = currentFriends.includes(friend.id);
                  return (
                    <TouchableOpacity
                      style={[styles.modalFriendItem, isSelected && styles.modalFriendItemSelected]}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <ExpoImage
                        source={
                          friend.avatar
                            ? { uri: friend.avatar }
                            : require('../assets/images/default-wine.png')
                        }
                        style={styles.modalFriendAvatar}
                        contentFit="cover"
                      />
                      <Text style={styles.modalFriendName}>{friend.first_name}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
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
  memoryForm: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  memoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  mainInfo: {
    paddingTop: 20,
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
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  memoryTextReadOnly: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#CCCCCC',
    backgroundColor: '#2a2a2a',
    minHeight: 100,
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
  memoryLocationReadOnly: {
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#CCCCCC',
    backgroundColor: '#2a2a2a',
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
  friendsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  friendsDisplay: {
    flex: 1,
  },
  selectedFriendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedFriendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#393C40',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  friendAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  selectedFriendName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  friendsPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  friendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendsListReadOnly: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendItemReadOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444444',
    marginRight: 8,
    marginBottom: 8,
  },
  noFriendsText: {
    color: '#666',
    fontStyle: 'italic',
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
  },
  statusIndicators: {
    marginTop: 16,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(153, 153, 153, 0.1)',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Styles pour la modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  friendsModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
  },
  modalFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalFriendItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalFriendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalFriendName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Styles pour les indicateurs de créateur
  creatorIndicator: {
    fontSize: 12,
    color: '#FFD700',
    fontStyle: 'italic',
  },
  creatorIndicatorSmall: {
    fontSize: 10,
    color: '#FFD700',
    fontStyle: 'italic',
  },
});