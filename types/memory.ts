export interface WineMemory {
  id: string;
  wine_id: string;
  user_id: string;
  text?: string;
  photo_urls: string[];
  friends_tagged: string[];
  location_text?: string;
  created_at: string;
  updated_at: string;
  // Données jointes
  user?: {
    id: string;
    first_name?: string;
    avatar?: string;
  };
  likes_count?: number;
  is_liked_by_me?: boolean;
  tagged_friends?: Array<{
    id: string;
    first_name?: string;
    avatar?: string;
  }>;
}

export interface WineMemoryLike {
  id: string;
  memory_id: string;
  user_id: string;
  created_at: string;
  // Données jointes
  user?: {
    id: string;
    first_name?: string;
    avatar?: string;
  };
}

export interface CreateWineMemoryData {
  wine_id: string;
  text?: string;
  photo_urls?: string[];
  friends_tagged?: string[];
  location_text?: string;
}

export interface UpdateWineMemoryData {
  text?: string;
  photo_urls?: string[];
  friends_tagged?: string[];
  location_text?: string;
}

export interface WineWithMemory {
  wine: {
    id: string;
    name: string;
    domaine: string;
    vintage: string;
    wineType: string;
    country: string;
    countryName: string;
    flag_emoji: string;
    appellation: string;
    grapes: string[];
    imageUri?: string;
    description?: string;
    stock: number;
    favorite: boolean;
    personalComment?: string;
    rating: number;
    tastingProfile: any[];
    origin: string;
    user_wine_id: string;
  };
  memory: {
    id: string;
    user_id: string;
    text?: string;
    photo_urls: string[];
    friends_tagged: string[];
    location_text?: string;
    created_at: string;
    updated_at: string;
    user?: {
      id: string;
      first_name?: string;
      avatar?: string;
    };
  };
  isCreator: boolean;
  isMentioned: boolean;
}
