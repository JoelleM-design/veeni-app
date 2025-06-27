import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Masquer la tab bar si on est sur l'écran 'add'
  const currentRoute = state.routeNames[state.index];
  if (currentRoute === 'add') {
    return null;
  }

  return (
    <View style={styles.tabBar}>
      {/* Ma Cave */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('index')}
      >
        <Ionicons name="wine" size={28} color={state.index === 0 ? '#F6A07A' : '#B0B0B0'} />
        <Text style={[styles.tabLabel, { color: state.index === 0 ? '#F6A07A' : '#B0B0B0' }]}>Ma cave</Text>
      </TouchableOpacity>
      {/* Ajouter (central, surélevé) */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('add')}
      >
        <Ionicons name="add" size={36} color="#FFF" />
      </TouchableOpacity>
      {/* Mes envies */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('wishlist')}
      >
        <Ionicons name="star" size={28} color={state.index === 2 ? '#F6A07A' : '#B0B0B0'} />
        <Text style={[styles.tabLabel, { color: state.index === 2 ? '#F6A07A' : '#B0B0B0' }]}>Ma liste d&apos;envie</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="wishlist" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#222',
    height: 70,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F6A07A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
