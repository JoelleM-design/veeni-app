import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ProfileStatsBarProps {
  tastedCount: number;
  favoritesCount: number;
  visitsCount: number;
  loading?: boolean;
  error?: Error | null;
  style?: any;
}

export const ProfileStatsBar: React.FC<ProfileStatsBarProps> = ({ 
  tastedCount, 
  favoritesCount, 
  visitsCount, 
  loading,
  error,
  style 
}) => {
  if (loading) {
    return (
      <View style={[styles.statsContainer, style]}>
        <View style={styles.statsRow}>
          <ActivityIndicator size="small" color="#F6A07A" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.statsContainer, style]}>
        <View style={styles.statsRow}>
          <Text style={styles.errorText}>
            Erreur lors du chargement des statistiques
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.statsContainer, style]}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tastedCount}</Text>
          <Text style={styles.statLabel}>dégustés</Text>
        </View>
        
        <View style={styles.statSeparator} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{favoritesCount}</Text>
          <Ionicons name="heart" size={16} color="#F6A07A" />
        </View>
        
        <View style={styles.statSeparator} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{visitsCount}</Text>
          <Ionicons name="star" size={16} color="#F6A07A" />
        </View>
        
        <View style={styles.statSeparator} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{visitsCount}</Text>
          <Text style={styles.statLabel}>visites</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#444',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  statNumber: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
  },
  statSeparator: {
    width: 1,
    height: 28,
    backgroundColor: '#444',
    alignSelf: 'center',
  },
  errorText: {
    color: '#F6A07A',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
}); 