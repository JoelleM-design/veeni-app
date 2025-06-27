import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatsBarProps {
  values: { red: number; white: number; rose: number; sparkling: number; total: number };
  labels?: { red: string; white: string; rose: string; sparkling: string };
  totalLabel?: string;
  style?: any;
}

export const StatsBar: React.FC<StatsBarProps> = ({ values, labels, totalLabel = 'vins', style }) => {
  const defaultLabels = {
    red: 'rouges',
    white: 'blancs',
    rose: 'rosés',
    sparkling: 'pétillants',
  };
  const l = labels || defaultLabels;
  return (
    <View style={[styles.statsOutlineBox, style]}>
      <View style={styles.statsRowOutline}>
        <View style={styles.statItemOutline}>
          <Text style={styles.statNumberOutline}>{values.red}</Text>
          <Text style={styles.statLabelOutline}>{l.red}</Text>
        </View>
        <View style={styles.statSeparatorOutline} />
        <View style={styles.statItemOutline}>
          <Text style={styles.statNumberOutline}>{values.white}</Text>
          <Text style={styles.statLabelOutline}>{l.white}</Text>
        </View>
        <View style={styles.statSeparatorOutline} />
        <View style={styles.statItemOutline}>
          <Text style={styles.statNumberOutline}>{values.rose}</Text>
          <Text style={styles.statLabelOutline}>{l.rose}</Text>
        </View>
        <View style={styles.statSeparatorOutline} />
        <View style={styles.statItemOutline}>
          <Text style={styles.statNumberOutline}>{values.sparkling}</Text>
          <Text style={styles.statLabelOutline}>{l.sparkling}</Text>
        </View>
      </View>
      {totalLabel ? (
        <Text style={styles.totalText}><Text style={styles.totalNumber}>{values.total}</Text> <Text style={styles.totalLabel}>{totalLabel}</Text></Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  statsOutlineBox: {
    marginTop: 18,
    marginBottom: 0,
    marginHorizontal: 18,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#444',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  statsRowOutline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 40,
  },
  statItemOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 2,
  },
  statNumberOutline: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 0,
  },
  statLabelOutline: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 0,
    marginTop: 0,
    letterSpacing: 0.1,
  },
  statSeparatorOutline: {
    width: 1,
    height: 28,
    backgroundColor: '#444',
    alignSelf: 'center',
  },
  totalText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'System',
    marginTop: 10,
    textAlign: 'center',
  },
  totalNumber: {
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'System',
    color: '#FFF',
  },
  totalLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'System',
  },
}); 