// Types pour l'ajout de vin par scan
export type WineColor = 'red' | 'white' | 'rose' | 'sparkling';

export interface Photo {
  uri: string;
  id: string; // uuid
}

export interface OCRResult {
  photoId: string;
  text: string;
  success: boolean;
}

export interface Wine {
  id: string;
  name: string;
  domaine: string;
  vintage: number;
  color: 'red' | 'white' | 'rose' | 'sparkling';
  region: string;
  appellation: string;
  grapes: string[];
  power: number;
  tannin: number;
  sweet: number;
  acidity: number;
  description?: string;
  imageUri?: string;
  favorite: boolean;
  note: number;
  stock: number;
  origin: 'cellar' | 'wishlist';
  history: {
    type: 'added' | 'stock' | 'tasted' | 'noted' | 'seen';
    date: string;
    value?: number;
    friend?: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  // Champs pour l'OCR et enrichissement
  ocrText?: string;
  confidence?: 'high' | 'medium' | 'low';
  missingFields?: string[];
}

export type AddWineStatus = 'pending' | 'validated' | 'edited' | 'error';

export interface AddWineItem {
  photo: Photo;
  ocr: OCRResult;
  wine: Partial<Wine>;
  status: AddWineStatus;
  error?: string;
}

// Nouveaux types pour le flow complet
export interface PendingWine {
  id: string;
  photoUri: string;
  ocrText?: string;
  ocrSuccess: boolean;
  wineData: Partial<Wine>;
  status: 'pending' | 'validated' | 'ignored';
  createdAt: string;
  updatedAt: string;
}

export interface WineFormData {
  name: string;
  vintage: number;
  color: WineColor;
  grapes: string[];
  region: string;
  country: string;
  producer?: string;
  estimatedValue?: number;
  description?: string;
  photoUri?: string;
}

export interface WineCard {
  id: string;
  photoUri: string;
  name: string;
  vintage?: number;
  region?: string;
  grapes: string[];
  ocrSuccess: boolean;
  status: 'pending' | 'validated' | 'ignored';
} 