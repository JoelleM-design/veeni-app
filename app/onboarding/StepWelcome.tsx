import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StepWelcome({ onNext }: { onNext: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>veeni</Text>
      <Text style={styles.subtitle}>Gère ta cave et partage tes vins avec tes proches !</Text>
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Créer un compte</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
        <Text style={styles.linkText}>Tu as déjà un compte ? <Text style={{ textDecorationLine: 'underline' }}>Connecte-toi</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#FFF', fontSize: 32, fontFamily: 'VeganFont', marginBottom: 8, paddingHorizontal: 20, textAlign: 'center' },
  subtitle: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginTop: 0 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 8 },
  linkText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
}); 