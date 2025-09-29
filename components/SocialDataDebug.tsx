import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { buildSocialData } from '../lib/buildSocialData';

interface SocialDataDebugProps {
  wineId: string;
  viewerUserId: string;
  contextOwnerUserId: string;
}

export default function SocialDataDebug({ wineId, viewerUserId, contextOwnerUserId }: SocialDataDebugProps) {
  const [socialData, setSocialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await buildSocialData(wineId, viewerUserId, contextOwnerUserId);
        setSocialData(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [wineId, viewerUserId, contextOwnerUserId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Chargement des données sociales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Données Sociales</Text>
      
      <Text style={styles.label}>Paramètres:</Text>
      <Text style={styles.text}>wineId: {wineId}</Text>
      <Text style={styles.text}>viewerUserId: {viewerUserId}</Text>
      <Text style={styles.text}>contextOwnerUserId: {contextOwnerUserId}</Text>
      <Text style={styles.text}>Même utilisateur: {viewerUserId === contextOwnerUserId ? 'OUI' : 'NON'}</Text>
      
      <Text style={styles.label}>Données sociales:</Text>
      <Text style={styles.text}>Origin: {socialData?.origin ? `${socialData.origin.type} de ${socialData.origin.friend.first_name}` : 'Aucune'}</Text>
      <Text style={styles.text}>Aussi en cave: {socialData?.alsoInCave?.map(f => f.first_name).join(', ') || 'Aucun'}</Text>
      <Text style={styles.text}>Aussi en liste d'envie: {socialData?.alsoInWishlist?.map(f => f.first_name).join(', ') || 'Aucun'}</Text>
      <Text style={styles.text}>Aussi dégusté: {socialData?.alsoTasted?.map(f => f.first_name).join(', ') || 'Aucun'}</Text>
      <Text style={styles.text}>Inspirés par moi: {socialData?.inspiredByMe?.map(f => f.first_name).join(', ') || 'Aucun'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F6A07A',
    marginTop: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 2,
  },
});
