import { useRouter } from 'expo-router';
import MesVinsScreen from '../screens/MesVinsScreen';

export default function MesVinsTab() {
  const router = useRouter();
  
  const handleWinePress = (wineId: string, wineData?: any) => {
    // Déterminer le tab basé sur l'origine du vin
    let tab = 'cellar';
    if (wineData?.origin === 'wishlist') {
      tab = 'wishlist';
    } else if (wineData?.origin === 'tasted') {
      tab = 'tasted';
    }
    
    router.push({
      pathname: '/wine/[id]',
      params: { 
        id: wineId,
        tab: tab,
        // Passer les données pour un rendu immédiat (évite un retour si le cache n'est pas prêt)
        wineData: wineData ? JSON.stringify(wineData) : undefined,
      }
    });
  };
  
  return <MesVinsScreen onWinePress={handleWinePress} />;
}
