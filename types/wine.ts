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
}

export type AddWineStatus = 'pending' | 'validated' | 'edited' | 'error';

export interface AddWineItem {
  photo: Photo;
  ocr: OCRResult;
  wine: Partial<Wine>;
  status: AddWineStatus;
  error?: string;
} 