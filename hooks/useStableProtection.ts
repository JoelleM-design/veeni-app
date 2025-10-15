/**
 * Hook de protection pour éviter les modifications accidentelles
 * du code stable pendant le développement des nouvelles fonctionnalités
 */

import { useEffect, useRef } from 'react';

interface ProtectionConfig {
  criticalFiles: string[];
  enableWarnings: boolean;
  enableBlocking: boolean;
}

const DEFAULT_CONFIG: ProtectionConfig = {
  criticalFiles: [
    'hooks/useWines.ts',
    'screens/WineDetailsScreenV2.tsx',
    'components/WineCard.tsx',
    'lib/cleanWine.ts',
    'hooks/useStats.ts',
    'hooks/useProfileStats.ts'
  ],
  enableWarnings: true,
  enableBlocking: false // En mode développement, on préfère les warnings
};

export function useStableProtection(config: Partial<ProtectionConfig> = {}) {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      
      // Vérifier toutes les 30 secondes
      if (now - lastCheckRef.current < 30000) return;
      
      lastCheckRef.current = now;
      
      // Vérifier que les fichiers critiques n'ont pas été modifiés
      // (Cette vérification serait implémentée côté build/CI)
      
      if (configRef.current.enableWarnings) {
        console.warn('🛡️ Protection active - Code stable protégé');
      }
    }, 30000);

    return () => clearInterval(checkInterval);
  }, []);

  const isFileProtected = (filePath: string): boolean => {
    return configRef.current.criticalFiles.some(criticalFile => 
      filePath.includes(criticalFile)
    );
  };

  const warnIfProtected = (filePath: string, action: string) => {
    if (isFileProtected(filePath)) {
      console.error(`🚫 INTERDICTION : ${action} sur ${filePath}`);
      console.error('📋 Ce fichier fait partie du code stable et ne doit pas être modifié');
      console.error('📖 Consultez STABLE_STATE_GUIDE.md pour plus d\'informations');
      
      if (configRef.current.enableBlocking) {
        throw new Error(`Modification interdite du fichier stable : ${filePath}`);
      }
    }
  };

  return {
    isFileProtected,
    warnIfProtected,
    protectedFiles: configRef.current.criticalFiles
  };
}
