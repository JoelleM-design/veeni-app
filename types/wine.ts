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
  producer?: {
    name: string;
  };
  vintage?: number;
  color?: string;
  grapes?: string[];
  region?: string;
  country?: string;
  appellation?: string;
  domaine?: string;
  description?: string;
  imageUri?: string;
  note?: number;
  personalComment?: string;
  stock?: number;
  priceRange?: string;
  origin?: 'cellar' | 'wishlist' | 'tasted';
  createdAt?: string;
  updatedAt?: string;
  acidity?: number;
  power?: number;
  sweet?: number;
  tannin?: number;
  tastingProfile?: {
    acidity: number;
    power: number;
    sweetness: number;
    tannin: number;
  };
  history?: any[];
  favorite?: boolean; // Propriété pour les favoris
  lastTastedAt?: string; // Date de la dernière dégustation
  tastingCount?: number; // Nombre de dégustations
  // Origine sociale (wishlist depuis un ami)
  sourceUser?: {
    id: string;
    first_name?: string;
    avatar?: string;
  };
  // Amis qui possèdent aussi ce vin (détecté par wine_id)
  commonFriends?: Array<{
    id: string;
    firstName: string;
    avatar?: string;
  }>;
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