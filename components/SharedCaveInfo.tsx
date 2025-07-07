import React from 'react';
import { Text } from 'react-native';
import { useSharedCave } from '../hooks/useSharedCave';

export const SharedCaveInfo: React.FC = () => {
  const { sharedCave, loading, userRole, caveState, getUserEmail } = useSharedCave();

  if (loading || caveState !== 'shared' || !sharedCave) {
    return null;
  }

  // Afficher le prénom du partenaire (si owner) ou du propriétaire (si partner)
  let partnerName = '';
  if (userRole === 'owner' && sharedCave.partner_id) {
    // On ne connaît que l'ID, donc on affiche juste 'Cave partagée' si pas de prénom
    partnerName = sharedCave.partner_first_name || '';
  } else if (userRole === 'partner' && sharedCave.owner_id) {
    partnerName = sharedCave.owner_first_name || '';
  }

  // Texte à afficher
  const text = partnerName
    ? `Cave partagée avec ${partnerName}`
    : 'Cave partagée';

  return (
    <Text style={{ textAlign: 'center', fontSize: 15, color: '#FFF', marginTop: 8, marginBottom: 2 }}>
      {text}
    </Text>
  );
}; 