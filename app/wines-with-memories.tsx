import { useLocalSearchParams } from 'expo-router';
import WinesWithMemoriesScreen from '../screens/WinesWithMemoriesScreen';

export default function WinesWithMemoriesRoute() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const viewerId = params.viewerId as string | undefined;

  if (!userId) {
    return null;
  }

  return (
    <WinesWithMemoriesScreen
      userId={userId}
      viewerId={viewerId}
    />
  );
}




