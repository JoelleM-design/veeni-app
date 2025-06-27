import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PhotoItem } from '../hooks/useWineScan';

interface WinePhotoPreviewProps {
  photo: PhotoItem;
  onRemove: (photoId: string) => void;
}

const getStatusColor = (status?: 'success' | 'warning' | 'error') => {
  switch (status) {
    case 'success':
      return '#4CAF50';
    case 'warning':
      return '#FF9800';
    case 'error':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

const getStatusIcon = (status?: 'success' | 'warning' | 'error') => {
  switch (status) {
    case 'success':
      return 'checkmark-circle';
    case 'warning':
      return 'alert-circle';
    case 'error':
      return 'close-circle';
    default:
      return 'ellipse';
  }
};

const getWineTypeColor = (wineType?: string) => {
  switch (wineType) {
    case 'red':
      return '#FF4F8B';
    case 'white':
      return '#FFF8DC';
    case 'rose':
      return '#FFB6C1';
    case 'sparkling':
      return '#FFD700';
    default:
      return '#F6A07A';
  }
};

export const WinePhotoPreview: React.FC<WinePhotoPreviewProps> = ({ photo, onRemove }) => {
  const statusColor = getStatusColor(photo.ocr?.status);
  const statusIcon = getStatusIcon(photo.ocr?.status);
  const wineTypeColor = getWineTypeColor(photo.ocr?.wine?.wine_type);

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      
      {/* Indicateur de statut */}
      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
        <Ionicons name={statusIcon as any} size={16} color="#FFF" />
      </View>

      {/* Overlay avec informations du vin */}
      {photo.ocr?.wine && photo.ocr.status === 'success' && (
        <View style={styles.wineInfoOverlay}>
          <View style={[styles.wineTypeIndicator, { backgroundColor: wineTypeColor }]} />
          <View style={styles.wineTextContainer}>
            <Text style={styles.wineName} numberOfLines={1}>
              {photo.ocr.wine.name}
            </Text>
            {photo.ocr.wine.year && (
              <Text style={styles.wineYear}>
                {photo.ocr.wine.year}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Message d'erreur */}
      {photo.ocr?.status === 'error' && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText} numberOfLines={2}>
            {photo.ocr.text}
          </Text>
        </View>
      )}

      {/* Indicateur de chargement */}
      {photo.isScanning && (
        <View style={styles.scanningOverlay}>
          <Ionicons name="scan" size={16} color="#F6A07A" />
        </View>
      )}

      {/* Bouton de suppression */}
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => onRemove(photo.id)}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      >
        <Ionicons name="close-circle" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  statusIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  wineInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  wineTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  wineTextContainer: {
    flex: 1,
  },
  wineName: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
  },
  wineYear: {
    color: '#FFF',
    fontSize: 7,
    opacity: 0.8,
    lineHeight: 8,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(244,67,54,0.9)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  errorText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '500',
    lineHeight: 8,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
}); 