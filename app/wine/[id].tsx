import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PersonalNoteModal from '../../components/PersonalNoteModal';
import { VeeniColors } from '../../constants/Colors';
import { useUser } from '../../hooks/useUser';
import { useWines } from '../../hooks/useWines';

export default function WineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { wines, updateWine } = useWines();
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [personalNote, setPersonalNote] = useState('');

  // Récupération du vin depuis la liste utilisateur
  const wine = useMemo(() => wines?.find(w => w.id === id), [wines, id]);

  // Gestion du like synchronisé
  const handleToggleFavorite = () => {
    if (wine) {
      updateWine(wine.id, { favorite: !wine.favorite });
    }
  };

  const handleAddBottle = () => {
    if (wine) {
      updateWine(wine.id, { stock: wine.stock + 1 });
    }
  };

  const handleRemoveBottle = () => {
    if (wine && wine.stock > 0) {
      updateWine(wine.id, { stock: wine.stock - 1 });
    }
  };

  const handleAddNote = (note: number) => {
    if (wine) {
      updateWine(wine.id, { note });
    }
  };

  const handleTransferToWishlist = () => {
    if (wine && wine.origin === 'cellar') {
      updateWine(wine.id, { origin: 'wishlist', stock: 0 });
      setShowModal(false);
    }
  };

  const handleTransferToCellar = () => {
    if (wine && wine.origin === 'wishlist') {
      updateWine(wine.id, { origin: 'cellar', stock: 1 });
      setShowModal(false);
    }
  };

  const handleSavePersonalNote = (note: string) => {
    if (wine) {
      // TODO: Sauvegarder la note personnelle dans la base
      setPersonalNote(note);
    }
  };

  // Barres de caractéristiques
  const renderBar = (value: number, maxValue: number = 5) => {
    const percentage = Math.max(0, Math.min(1, value / maxValue));
    return (
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${percentage * 100}%` }]} />
      </View>
    );
  };

  // Icône du type de vin
  const getWineTypeIcon = (type: string) => {
    switch (type) {
      case 'red': return 'wine';
      case 'white': return 'wine-outline';
      case 'rose': return 'wine';
      case 'sparkling': return 'sparkles';
      default: return 'wine';
    }
  };

  // Couleur du type de vin
  const getWineTypeColor = (type: string) => {
    switch (type) {
      case 'red': return VeeniColors.wine.red;
      case 'white': return VeeniColors.wine.white;
      case 'rose': return VeeniColors.wine.rose;
      case 'sparkling': return VeeniColors.wine.sparkling;
      default: return VeeniColors.wine.red;
    }
  };

  if (!wine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.emptyText}>Vin non trouvé.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header avec image de fond */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerBtn}>
              <Ionicons name="ellipsis-horizontal" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          {/* Image principale */}
          <View style={styles.imageContainer}>
            <Image 
              source={wine.imageUri ? { uri: wine.imageUri } : require('../../assets/images/default-wine.png')} 
              style={styles.wineImage} 
            />
            <TouchableOpacity style={styles.likeBtn} onPress={handleToggleFavorite}>
              <Ionicons 
                name={wine.favorite ? 'heart' : 'heart-outline'} 
                size={32} 
                color={VeeniColors.wine.red} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations principales */}
        <View style={styles.mainInfo}>
          <Text style={styles.wineName}>{wine.name}</Text>
          {wine.domaine && wine.domaine !== 'Domaine inconnu' && (
            <Text style={styles.domaine}>{wine.domaine}</Text>
          )}
          
          {/* Type et millésime */}
          <View style={styles.typeVintageRow}>
            <View style={[styles.typeBadge, { backgroundColor: getWineTypeColor(wine.color) }]}>
              <Ionicons name={getWineTypeIcon(wine.color)} size={16} color="#FFF" />
              <Text style={styles.typeText}>
                {wine.color === 'red' ? 'Rouge' : 
                 wine.color === 'white' ? 'Blanc' : 
                 wine.color === 'rose' ? 'Rosé' : 'Effervescent'}
              </Text>
            </View>
            {wine.vintage && (
              <View style={styles.vintageBadge}>
                <Text style={styles.vintageText}>{wine.vintage}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stock et actions */}
        <View style={styles.stockSection}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Stock</Text>
            <Text style={styles.stockValue}>{wine.stock} bouteille{wine.stock > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.stockActions}>
            <TouchableOpacity onPress={handleRemoveBottle} style={styles.stockBtn}>
              <Ionicons name="remove" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddBottle} style={styles.stockBtn}>
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Note utilisateur */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Ma note</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleAddNote(star)}
                style={styles.starBtn}
              >
                <Ionicons
                  name={star <= wine.note ? 'star' : 'star-outline'}
                  size={24}
                  color={star <= wine.note ? VeeniColors.accent.secondary : '#666'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations détaillées */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <View style={styles.detailGrid}>
            {wine.region && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Région</Text>
                <Text style={styles.detailValue}>{wine.region}</Text>
              </View>
            )}
            
            {wine.appellation && wine.appellation !== wine.region && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Appellation</Text>
                <Text style={styles.detailValue}>{wine.appellation}</Text>
              </View>
            )}
            
            {wine.grapes && wine.grapes.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cépages</Text>
                <Text style={styles.detailValue}>{wine.grapes.join(', ')}</Text>
              </View>
            )}
            
            {wine.description && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{wine.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Caractéristiques techniques */}
        {(wine.power > 0 || wine.tannin > 0 || wine.sweet > 0 || wine.acidity > 0) && (
          <View style={styles.characteristicsSection}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            
            {wine.power > 0 && (
              <View style={styles.characteristicRow}>
                <Text style={styles.characteristicLabel}>Puissance</Text>
                <View style={styles.characteristicBar}>
                  {renderBar(wine.power)}
                  <Text style={styles.characteristicValue}>{wine.power}/5</Text>
                </View>
              </View>
            )}
            
            {wine.tannin > 0 && (
              <View style={styles.characteristicRow}>
                <Text style={styles.characteristicLabel}>Tannins</Text>
                <View style={styles.characteristicBar}>
                  {renderBar(wine.tannin)}
                  <Text style={styles.characteristicValue}>{wine.tannin}/5</Text>
                </View>
              </View>
            )}
            
            {wine.sweet > 0 && (
              <View style={styles.characteristicRow}>
                <Text style={styles.characteristicLabel}>Sucrosité</Text>
                <View style={styles.characteristicBar}>
                  {renderBar(wine.sweet)}
                  <Text style={styles.characteristicValue}>{wine.sweet}/5</Text>
                </View>
              </View>
            )}
            
            {wine.acidity > 0 && (
              <View style={styles.characteristicRow}>
                <Text style={styles.characteristicLabel}>Acidité</Text>
                <View style={styles.characteristicBar}>
                  {renderBar(wine.acidity)}
                  <Text style={styles.characteristicValue}>{wine.acidity}/5</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Note personnelle */}
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Text style={styles.sectionTitle}>Note personnelle</Text>
            <TouchableOpacity onPress={() => setShowNoteModal(true)} style={styles.editNoteBtn}>
              <Ionicons name="create-outline" size={20} color={VeeniColors.accent.primary} />
            </TouchableOpacity>
          </View>
          {personalNote ? (
            <Text style={styles.personalNoteText}>{personalNote}</Text>
          ) : (
            <TouchableOpacity onPress={() => setShowNoteModal(true)} style={styles.addNoteBtn}>
              <Ionicons name="add" size={20} color="#666" />
              <Text style={styles.addNoteText}>Ajouter une note personnelle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Historique */}
        {wine.history && wine.history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {wine.history.map((event: any, index: number) => (
              <View key={index} style={styles.historyItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.historyText}>
                  {event.type === 'added' ? 'Ajouté à la cave' : 
                   event.type === 'tasted' ? 'Dégusté' : 
                   event.type === 'removed' ? 'Retiré' : 'Modifié'}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(event.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal d'actions */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actions</Text>
            
            {wine.origin === 'cellar' ? (
              <TouchableOpacity onPress={handleTransferToWishlist} style={styles.modalBtn}>
                <Ionicons name="heart-outline" size={20} color="#FFF" />
                <Text style={styles.modalBtnText}>Déplacer vers la wishlist</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleTransferToCellar} style={styles.modalBtn}>
                <Ionicons name="wine" size={20} color="#FFF" />
                <Text style={styles.modalBtnText}>Ajouter à la cave</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalBtn, styles.cancelBtn]}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal note personnelle */}
      <PersonalNoteModal
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSavePersonalNote}
        initialNote={personalNote}
        title="Note personnelle"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#23252A' },
  headerSection: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    marginTop: 8, 
    marginBottom: 16 
  },
  headerBtn: { 
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20
  },
  imageContainer: { 
    alignItems: 'center', 
    position: 'relative' 
  },
  wineImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 20, 
    resizeMode: 'cover',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  likeBtn: { 
    position: 'absolute', 
    top: 12, 
    right: 24, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8
  },
  mainInfo: { 
    marginHorizontal: 24, 
    marginTop: 24,
    marginBottom: 16 
  },
  wineName: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 28, 
    textAlign: 'center', 
    marginBottom: 8 
  },
  domaine: { 
    color: '#B0B0B0', 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 16 
  },
  typeVintageRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 12
  },
  typeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  typeText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: 'bold',
    marginLeft: 4
  },
  vintageBadge: { 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#35363A'
  },
  vintageText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  stockSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginHorizontal: 24, 
    marginBottom: 24,
    backgroundColor: '#2A2B30',
    padding: 16,
    borderRadius: 16
  },
  stockInfo: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 8
  },
  stockLabel: { 
    color: '#B0B0B0', 
    fontSize: 16 
  },
  stockValue: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  stockActions: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 8
  },
  stockBtn: { 
    padding: 8, 
    borderRadius: 20, 
    backgroundColor: VeeniColors.accent.primary,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ratingSection: { 
    marginHorizontal: 24, 
    marginBottom: 24 
  },
  sectionTitle: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginBottom: 12 
  },
  starsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8
  },
  starBtn: { 
    padding: 4 
  },
  detailsSection: { 
    marginHorizontal: 24, 
    marginBottom: 24 
  },
  detailGrid: { 
    backgroundColor: '#2A2B30',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  detailItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  detailLabel: { 
    color: '#B0B0B0', 
    fontSize: 14 
  },
  detailValue: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right'
  },
  characteristicsSection: { 
    marginHorizontal: 24, 
    marginBottom: 24 
  },
  characteristicRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    backgroundColor: '#2A2B30',
    padding: 12,
    borderRadius: 12
  },
  characteristicLabel: { 
    color: '#B0B0B0', 
    fontSize: 14, 
    width: 80 
  },
  characteristicBar: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  characteristicValue: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: 'bold',
    width: 30
  },
  noteSection: { 
    marginHorizontal: 24, 
    marginBottom: 24 
  },
  noteHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  editNoteBtn: { 
    padding: 8, 
    borderRadius: 20, 
    backgroundColor: 'rgba(246, 160, 122, 0.1)'
  },
  personalNoteText: { 
    color: '#FFF', 
    fontSize: 14,
    backgroundColor: '#2A2B30',
    padding: 16,
    borderRadius: 12,
    lineHeight: 20
  },
  addNoteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    backgroundColor: '#2A2B30',
    borderWidth: 1,
    borderColor: '#444',
    borderStyle: 'dashed'
  },
  addNoteText: { 
    color: '#666', 
    fontSize: 14, 
    marginLeft: 8 
  },
  historySection: { 
    marginHorizontal: 24, 
    marginBottom: 16 
  },
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
    backgroundColor: '#2A2B30',
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  historyText: { 
    color: '#FFF', 
    fontSize: 14,
    flex: 1
  },
  historyDate: { 
    color: '#B0B0B0', 
    fontSize: 12 
  },
  emptyText: { 
    color: '#B0B0B0', 
    fontSize: 16, 
    textAlign: 'center', 
    marginTop: 40 
  },
  barBg: { 
    flex: 1, 
    height: 8, 
    backgroundColor: '#444', 
    borderRadius: 4 
  },
  barFill: { 
    height: '100%', 
    backgroundColor: VeeniColors.accent.primary, 
    borderRadius: 4 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: '#292929', 
    borderRadius: 18, 
    padding: 24, 
    width: '85%', 
    maxHeight: '80%' 
  },
  modalTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 24 
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 16,
  },
  cancelBtn: {
    borderBottomWidth: 0,
  },
  cancelBtnText: {
    color: '#FF6B6B',
    fontSize: 16,
  },
}); 