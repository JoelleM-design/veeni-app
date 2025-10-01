import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SWRConfig } from 'swr';
import { OnboardingProvider } from '../context/OnboardingContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { supabase } from '../lib/supabase';

function OnboardingLayout() {
  console.log('🔍 OnboardingLayout render');
  
  return (
    <View style={{ flex: 1, backgroundColor: '#222' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding/index" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    VeganFont: require('../assets/fonts/VeganFont.ttf'),
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('RootLayout: Initialisation de l\'effet');
    let isMounted = true;
    setError(null);
    
    let timeout = setTimeout(() => {
      console.log('RootLayout: Timeout atteint');
      if (isMounted) {
        setError('Timeout récupération session Supabase');
        setIsLoading(false);
      }
    }, 5000);

    console.log('RootLayout: Tentative de récupération de la session');
    
    const attemptSessionRecovery = async (retryCount = 0) => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('RootLayout: Réponse de getSession reçue', { session: !!session, error: !!sessionError });
        clearTimeout(timeout);
        
        if (isMounted) {
          if (sessionError) {
            console.error('RootLayout: Erreur de session', sessionError);
            
            // Retry automatique pour les erreurs réseau
            if (sessionError.message?.includes('Network') && retryCount < 2) {
              console.log(`RootLayout: Retry ${retryCount + 1}/2 dans 2 secondes...`);
              setTimeout(() => attemptSessionRecovery(retryCount + 1), 2000);
              return;
            }
            
            setError(`Erreur de session: ${sessionError.message}`);
          } else {
            setSession(session);
          }
          setIsLoading(false);
        }
      } catch (e) {
        const err = e as Error;
        console.error('RootLayout: Erreur lors de getSession', err);
        clearTimeout(timeout);
        
        if (isMounted) {
          // Retry automatique pour les erreurs réseau
          if ((err as any).message?.includes('Network') && retryCount < 2) {
            console.log(`RootLayout: Retry ${retryCount + 1}/2 dans 2 secondes...`);
            setTimeout(() => attemptSessionRecovery(retryCount + 1), 2000);
            return;
          }
          
          setError(`Erreur de connexion à Supabase: ${err.message}`);
          setIsLoading(false);
        }
      }
    };
    
    attemptSessionRecovery();

    console.log('RootLayout: Configuration de l\'écouteur auth state change');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('RootLayout: Auth state change', { event, session: !!session });
      if (isMounted) {
        setSession(session);
      }
      if (event === 'PASSWORD_RECOVERY') {
        // Router vers l'écran de réinitialisation lorsque le deep link s'ouvre
        try {
          // Utiliser Redirect n'est pas possible ici, on laisse expo-router router via Linking
          // L'écran dédié gèrera la saisie du nouveau mot de passe
        } catch (e) {}
      }
    });

    return () => {
      console.log('RootLayout: Nettoyage de l\'effet');
      isMounted = false;
      clearTimeout(timeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (!loaded || isLoading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff'}}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{color:'#222', marginTop:16}}>Chargement…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff'}}>
        <Text style={{color:'red', fontSize:18, margin:24}}>{error}</Text>
      </View>
    );
  }

  if (!session && !isLoading && !error && pathname !== '/onboarding' && pathname !== '/login') {
    console.log('RootLayout: Redirection vers onboarding');
    return <Redirect href="/onboarding" />;
  }

  // Redirection vers mes-vins si l'utilisateur est connecté et sur la racine
  if (session && (pathname === '/' || pathname === '/(tabs)')) {
    console.log('RootLayout: Redirection vers mes-vins');
    return <Redirect href="/(tabs)/mes-vins" />;
  }

  console.log('RootLayout: Rendu normal avec session', { hasSession: !!session });
  
  // Si on est sur l'onboarding, utiliser le layout spécial avec header global
  if (pathname.startsWith('/onboarding')) {
    return (
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 1000,
        }}
      >
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <OnboardingProvider>
            <OnboardingLayout />
          </OnboardingProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SWRConfig>
    );
  }

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 1000,
      }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="friend/[id]" />
          <Stack.Screen name="wine/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SWRConfig>
  );
}