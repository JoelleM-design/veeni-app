import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
    supabase.auth.getSession()
      .then(({ data: { session }, error: sessionError }) => {
        console.log('RootLayout: Réponse de getSession reçue', { session: !!session, error: !!sessionError });
        clearTimeout(timeout);
        if (isMounted) {
          if (sessionError) {
            console.error('RootLayout: Erreur de session', sessionError);
            setError(`Erreur de session: ${sessionError.message}`);
          } else {
            setSession(session);
          }
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error('RootLayout: Erreur lors de getSession', e);
        clearTimeout(timeout);
        if (isMounted) {
          setError(`Erreur de connexion à Supabase: ${e.message}`);
          setIsLoading(false);
        }
      });

    console.log('RootLayout: Configuration de l\'écouteur auth state change');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('RootLayout: Auth state change', { event, session: !!session });
      if (isMounted) {
        setSession(session);
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
        <ActivityIndicator size="large" color="#F6A07A" />
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
  return (
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
  );
}