import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileStats } from '../components/ProfileStats';

interface ProfileScreenExampleProps {
  userId: string;
  viewerId?: string;
  isOwnProfile?: boolean;
}

export function ProfileScreenExample({ 
  userId, 
  viewerId, 
  isOwnProfile = false 
}: ProfileScreenExampleProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isOwnProfile ? 'Mon Profil' : 'Profil'}
        </Text>
        <Text style={styles.subtitle}>
          {isOwnProfile ? 'Vos statistiques' : 'Statistiques de cet utilisateur'}
        </Text>
      </View>

      {/* Statistiques principales */}
      <ProfileStats 
        userId={userId} 
        viewerId={viewerId}
        showLabels={true}
        showDetails={true}
      />

      {/* Section d'information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>🔐 Authentification</Text>
          <Text style={styles.infoText}>
            Les statistiques nécessitent une authentification valide pour accéder aux données.
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>📊 Calculs</Text>
          <Text style={styles.infoText}>
            • Dégustés: Basés sur wine_history (event_type = 'tasted')
          </Text>
          <Text style={styles.infoText}>
            • Favoris: Vins marqués comme favoris
          </Text>
          <Text style={styles.infoText}>
            • Wishlist/Cave: Tous les vins (même si amount = 0)
          </Text>
          <Text style={styles.infoText}>
            • Communs: Vins partagés avec {viewerId ? 'cet utilisateur' : 'vos amis'}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>🔄 Mise à jour</Text>
          <Text style={styles.infoText}>
            Les statistiques se mettent à jour automatiquement en temps réel.
          </Text>
        </View>
      </View>

      {/* Section de debug */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>🐛 Debug</Text>
        <Text style={styles.debugText}>
          Si les statistiques affichent 0, vérifiez :
        </Text>
        <Text style={styles.debugText}>
          1. L'utilisateur est bien authentifié
        </Text>
        <Text style={styles.debugText}>
          2. Les données existent dans Supabase
        </Text>
        <Text style={styles.debugText}>
          3. Les politiques RLS permettent l'accès
        </Text>
        <Text style={styles.debugText}>
          4. La connexion réseau fonctionne
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#F6A07A',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoSection: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  debugSection: {
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
});




