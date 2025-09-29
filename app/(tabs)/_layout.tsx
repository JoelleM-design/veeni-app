import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Masquer la tab bar si on est sur l'écran 'add'
  const currentRoute = state.routeNames[state.index];
  if (currentRoute === 'add') {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 1)']}
        style={styles.tabBarWrapper}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.tabBar}>
          {/* Mes vins (nouvel écran) */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('mes-vins')}
          >
            <Ionicons name="wine" size={28} color={state.index === 0 ? '#FFFFFF' : '#B0B0B0'} />
            <Text style={[styles.tabLabel, { color: state.index === 0 ? '#FFFFFF' : '#B0B0B0' }]}>Mes vins</Text>
          </TouchableOpacity>
          {/* Ajouter (central, surélevé) */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('add')}
          >
            <Ionicons name="add" size={36} color="#000" />
          </TouchableOpacity>
          {/* Profil */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('profile')}
          >
            <Ionicons name="person" size={28} color={state.index === 2 ? '#FFFFFF' : '#B0B0B0'} />
            <Text style={[styles.tabLabel, { color: state.index === 2 ? '#FFFFFF' : '#B0B0B0' }]}>Profil</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
      <Tabs.Screen name="mes-vins" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 140,
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 140,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingTop: 8,
    zIndex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: 'transparent',
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});