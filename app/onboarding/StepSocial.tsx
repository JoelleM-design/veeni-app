import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepSocial({ notifications, setNotifications, onNext, onBack, stepIndex = 0, totalSteps = 7 }: { notifications: boolean; setNotifications: (v: boolean) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  const [contactsPermission, setContactsPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkContactsPermission();
  }, []);

  const checkContactsPermission = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    setContactsPermission(status === 'granted');
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setContactsPermission(status === 'granted');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Pour profiter pleinement de l'application
        </Text>
        
        <View style={styles.section}>
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}>Active tes notifications</Text>
            <Text style={styles.sectionDesc}>Pour suivre les découvertes de tes proches autour du vin</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#393C40', true: '#FFFFFF' }}
            thumbColor={notifications ? '#222' : '#f4f3f4'}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}>Autorise l'accès à tes contacts</Text>
            <Text style={styles.sectionDesc}>Pour les retrouver facilement</Text>
          </View>
          <Switch
            value={contactsPermission || false}
            onValueChange={requestContactsPermission}
            trackColor={{ false: '#393C40', true: '#FFFFFF' }}
            thumbColor={(contactsPermission || false) ? '#222' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#222' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 48 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  sectionTextWrap: { flex: 1 },
  sectionTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  sectionDesc: { color: '#B0B0B0', fontSize: 14 },
  button: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginTop: 20, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
}); 