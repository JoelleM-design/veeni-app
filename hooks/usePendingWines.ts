import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type PendingWine = {
  id: string;
  imageUri: string;
  rawText: string;
  name?: string;
  year?: string;
  type?: 'red' | 'white' | 'rose' | 'sparkling';
  region?: string;
  country?: string;
  grapes?: string[];
  producer?: string;
  price_estimate?: number;
  user_note?: string;
  validated: boolean;
};

export function usePendingWines() {
  const [pendingWines, setPendingWines] = useState<PendingWine[]>([]);

  // Ajouter un vin (après OCR)
  const addPendingWine = (wine: Omit<PendingWine, 'id' | 'validated'>) => {
    setPendingWines((prev) => [
      ...prev,
      { ...wine, id: uuidv4(), validated: false },
    ]);
  };

  // Supprimer un vin
  const removePendingWine = (id: string) => {
    setPendingWines((prev) => prev.filter((w) => w.id !== id));
  };

  // Vider la liste
  const clearPendingWines = () => setPendingWines([]);

  // Éditer un vin
  const editPendingWine = (id: string, data: Partial<PendingWine>) => {
    setPendingWines((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...data } : w))
    );
  };

  // Valider une fiche
  const validatePendingWine = (id: string) => {
    setPendingWines((prev) =>
      prev.map((w) => (w.id === id ? { ...w, validated: true } : w))
    );
  };

  return {
    pendingWines,
    addPendingWine,
    removePendingWine,
    clearPendingWines,
    editPendingWine,
    validatePendingWine,
  };
} 