import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProfileStatsV2 } from '../hooks/useProfileStatsV2';
import { useUser } from '../hooks/useUser';

/**
 * Composant de test pour vérifier les statistiques du profil V2
 * Affiche les métriques calculées côté Supabase
 */
export default function ProfileStatsV2Test() {
  const { user } = useUser();
  const { stats, loading, error, refetch } = useProfileStatsV2(user?.id || null);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Veuillez vous connecter pour voir les statistiques</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={refetch}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistiques du Profil V2</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.tasted}</Text>
          <Text style={styles.statLabel}>Dégustés</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.common}</Text>
          <Text style={styles.statLabel}>Communs</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.inspired}</Text>
          <Text style={styles.statLabel}>Inspirés</Text>
        </View>
      </View>

      <View style={styles.additionalStats}>
        <Text style={styles.sectionTitle}>Métriques additionnelles</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Cave:</Text>
          <Text style={styles.statValue}>{stats.cellar} vins</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Liste d'envie:</Text>
          <Text style={styles.statValue}>{stats.wishlist} vins</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total bouteilles:</Text>
          <Text style={styles.statValue}>{stats.totalBottles} bouteilles</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={refetch}>
        <Text style={styles.buttonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F6A07A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  additionalStats: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  statValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#F6A07A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});


