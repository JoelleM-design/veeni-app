import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../../hooks/useUser';
import WineDetailsScreenV2 from '../../screens/WineDetailsScreenV2';

export default function WineDetailRoute() {
  const params = useLocalSearchParams();
  const { user } = useUser();
  const id = params.id ? (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : '';
  const tab = (params.tab as 'cellar' | 'wishlist' | 'tasted') || 'cellar';
  const friendId = params.friendId as string | undefined;
  const readOnly = params.readOnly as string | undefined;
  const wineData = params.wineData as string | undefined;
  const returnToOcr = params.returnToOcr as string | undefined;

  // S'assurer que wineId est toujours une chaîne valide
  const wineId = id || '';

  if (!wineId || !user) {
    return null;
  }

  // Déterminer le contexte et les utilisateurs
  const viewerUserId = user.id;
  const contextOwnerUserId = friendId || user.id; // Si friendId existe, c'est un ami, sinon c'est l'utilisateur courant
  const context = (friendId && readOnly === 'true') ? 'friend' : tab; // Si c'est un ami en mode lecture seule, utiliser 'friend' comme contexte

  return (
    <WineDetailsScreenV2
      wineId={wineId}
      viewerUserId={viewerUserId}
      contextOwnerUserId={contextOwnerUserId}
      context={context}
      wineData={wineData}
      returnToOcr={returnToOcr}
    />
  );
} 