import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import StepEmail from './StepEmail';
import StepFinish from './StepFinish';
import StepFirstName from './StepFirstName';
import StepMajority from './StepMajority';
import StepPassword from './StepPassword';
import StepSocial from './StepSocial';
import StepWelcome from './StepWelcome';

const steps = [
  'welcome',
  'firstName',
  'majority',
  'email',
  'password',
  'social',
  'finish',
];

type Step = typeof steps[number];

export default function Onboarding() {
  console.log('ONBOARDING RENDER');
  const [step, setStep] = useState<Step>('welcome');
  const [firstName, setFirstName] = useState('');
  const [majority, setMajority] = useState<boolean | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const go = (s: Step) => setStep(s);
  const next = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };
  const back = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  async function handleRegister() {
    setLoading(true);
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          data: { 
            first_name: firstName, 
            majority, 
            notifications 
          } 
        } 
      });
      
      if (signUpError) {
        Alert.alert('Erreur', signUpError.message);
        return;
      }

      if (data.user) {
        // Créer l'utilisateur dans la table User
        const { error: userError } = await supabase
          .from('User')
          .insert({
            id: data.user.id,
            first_name: firstName,
            email: email,
            onboarding_complete: true,
            has_notifications_active: notifications,
          });

        if (userError) {
          console.error('Erreur création utilisateur:', userError);
          // On continue quand même, l'utilisateur peut être créé plus tard
        } else {
          // Créer un nouveau household pour cet utilisateur
          const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .insert({
              name: `Cave de ${firstName}`,
              join_code: joinCode,
            })
            .select()
            .single();

          if (householdError) {
            console.error('Erreur création household:', householdError);
          } else if (householdData) {
            // Lier l'utilisateur au household
            const { error: userHouseholdError } = await supabase
              .from('user_household')
              .insert({
                user_id: data.user.id,
                household_id: householdData.id,
              });

            if (userHouseholdError) {
              console.error('Erreur liaison utilisateur-household:', userHouseholdError);
            }
          }
        }
      }

      // Redirige immédiatement vers l'onglet principal (ma cave)
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* <Text style={{color: 'red', fontWeight: 'bold', fontSize: 20, margin: 24}}>DEBUG ONBOARDING</Text> */}
      {loading && <ActivityIndicator size="large" color="#F6A07A" style={{ marginTop: 40 }} />}
      {!loading && step === 'welcome' && <StepWelcome key="welcome" onNext={next} />}
      {!loading && step === 'firstName' && <StepFirstName key="firstName" value={firstName} onChange={setFirstName} onNext={next} onBack={back} stepIndex={steps.indexOf('firstName')} totalSteps={steps.length} />}
      {!loading && step === 'majority' && <StepMajority key="majority" value={majority ?? false} onChange={setMajority} onNext={next} onBack={back} stepIndex={steps.indexOf('majority')} totalSteps={steps.length} />}
      {!loading && step === 'email' && <StepEmail key="email" value={email} onChange={setEmail} onNext={next} onBack={back} stepIndex={steps.indexOf('email')} totalSteps={steps.length} />}
      {!loading && step === 'password' && <StepPassword key="password" value={password} onChange={setPassword} onNext={next} onBack={back} stepIndex={steps.indexOf('password')} totalSteps={steps.length} />}
      {!loading && step === 'social' && <StepSocial key="social" notifications={notifications} setNotifications={setNotifications} onNext={next} onBack={back} stepIndex={steps.indexOf('social')} totalSteps={steps.length} />}
      {!loading && step === 'finish' && <StepFinish key="finish" firstName={firstName} onNext={handleRegister} onBack={back} stepIndex={steps.indexOf('finish')} totalSteps={steps.length} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222' },
}); 