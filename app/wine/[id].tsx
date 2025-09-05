import { useLocalSearchParams } from 'expo-router';
import EditableWineDetailsScreen from '../../screens/EditableWineDetailsScreen';

export default function WineDetailRoute() {
  const params = useLocalSearchParams();
  const id = params.id ? (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : '';
  const isFromOcr = params.isFromOcr === 'true';
  const tab = (params.tab as 'cellar' | 'wishlist' | 'tasted') || 'cellar';

  // S'assurer que wineId est toujours une chaîne valide
  const wineId = id || '';

  if (!wineId) {
    return null;
  }

  return <EditableWineDetailsScreen wineId={wineId} isFromOcr={isFromOcr} tab={tab} />;
} 