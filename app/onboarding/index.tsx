import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import OnboardingHeader from '../../components/OnboardingHeader';
import { OnboardingProvider, useOnboarding } from '../../context/OnboardingContext';
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

function OnboardingContent() {
  console.log('ONBOARDING RENDER');
  const [step, setStep] = useState<Step>('welcome');
  const { stepIndex, totalSteps, canGoBack, setStepIndex, setCanGoBack, setOnBack } = useOnboarding();
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
      const newStep = steps[currentIndex + 1];
      const newIndex = currentIndex + 1;
      console.log('➡️ Next step:', { currentIndex, newIndex, newStep, canGoBack: newIndex > 0 });
      setStep(newStep);
      setStepIndex(newIndex);
      setCanGoBack(newIndex > 0);
    }
  };
  const back = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      const newStep = steps[currentIndex - 1];
      const newIndex = currentIndex - 1;
      console.log('⬅️ Back step:', { currentIndex, newIndex, newStep, canGoBack: newIndex > 0 });
      setStep(newStep);
      setStepIndex(newIndex);
      setCanGoBack(newIndex > 0);
    }
  };

  // Initialiser le contexte au démarrage
  useEffect(() => {
    const currentIndex = steps.indexOf(step);
    console.log('🔧 Initializing context:', { currentIndex, step, canGoBack: currentIndex > 0 });
    setStepIndex(currentIndex);
    setCanGoBack(currentIndex > 0);
    setOnBack(() => back);
  }, []);

  // Mettre à jour le contexte à chaque changement d'étape
  useEffect(() => {
    const currentIndex = steps.indexOf(step);
    console.log('🔄 Step changed, updating context:', { currentIndex, step, canGoBack: currentIndex > 0 });
    setStepIndex(currentIndex);
    setCanGoBack(currentIndex > 0);
    setOnBack(() => back);
  }, [step]);

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
      <OnboardingHeader 
        stepIndex={stepIndex} 
        totalSteps={totalSteps} 
        canGoBack={canGoBack} 
      />
      {loading && <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 40 }} />}
      {!loading && step === 'welcome' && <StepWelcome onNext={next} />}
      {!loading && step === 'firstName' && <StepFirstName value={firstName} onChange={setFirstName} onNext={next} onBack={back} stepIndex={0} totalSteps={6} />}
      {!loading && step === 'majority' && <StepMajority value={majority ?? false} onChange={setMajority} onNext={next} onBack={back} stepIndex={1} totalSteps={6} />}
      {!loading && step === 'email' && <StepEmail value={email} onChange={setEmail} onNext={next} onBack={back} stepIndex={2} totalSteps={6} />}
      {!loading && step === 'password' && <StepPassword value={password} onChange={setPassword} onNext={next} onBack={back} stepIndex={3} totalSteps={6} />}
      {!loading && step === 'social' && <StepSocial notifications={notifications} setNotifications={setNotifications} onNext={next} onBack={back} stepIndex={4} totalSteps={6} />}
      {!loading && step === 'finish' && <StepFinish firstName={firstName} onNext={handleRegister} onBack={back} stepIndex={5} totalSteps={6} />}
    </View>
  );
}

export default function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222' },
}); 