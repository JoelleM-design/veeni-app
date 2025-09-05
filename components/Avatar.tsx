import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  initial?: string | null;
  size?: number;
}

export function Avatar({ uri, initial, size = 40 }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Ajouter un cache-buster à l'URL pour forcer le rechargement
  const uriWithCacheBuster = uri ? `${uri}?t=${Date.now()}` : null;

  // Si pas d'URI valide ou erreur de chargement, afficher les initiales
  if (!uriWithCacheBuster || imageError) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {typeof initial === 'string' && initial.length > 0 ? initial.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
    );
  }

  // Sinon, afficher l'image avec fallback sur erreur
  return (
    <Image
      source={{ uri: uriWithCacheBuster }}
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      onLoad={() => {
        // Image chargée avec succès
      }}
      onError={() => {
        setImageError(true);
      }}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#393C40', borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#333',
  },
  initial: {
    color: '#FFF',
    fontWeight: '600',
  },
}); 