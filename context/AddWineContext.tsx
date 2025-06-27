import React, { createContext, useContext, useState } from 'react';
import { AddWineItem, Wine } from '../types/wine';

interface AddWineContextType {
  items: AddWineItem[];
  setItems: (items: AddWineItem[]) => void;
  reset: () => void;
  addPhoto: (uri: string) => void;
  updateItem: (id: string, data: Partial<AddWineItem>) => void;
  removeItem: (id: string) => void;
  validatedWines: Wine[];
  setValidatedWines: (wines: Wine[]) => void;
}

const AddWineContext = createContext<AddWineContextType | undefined>(undefined);

export const AddWineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<AddWineItem[]>([]);
  const [validatedWines, setValidatedWines] = useState<Wine[]>([]);

  const reset = () => {
    setItems([]);
    setValidatedWines([]);
  };

  const addPhoto = (uri: string) => {
    setItems(prev => [...prev, {
      photo: { uri, id: Math.random().toString(36).slice(2) },
      ocr: { photoId: '', text: '', success: false },
      wine: {},
      status: 'pending',
    }]);
  };

  const updateItem = (id: string, data: Partial<AddWineItem>) => {
    setItems(prev => prev.map(item => item.photo.id === id ? { ...item, ...data } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.photo.id !== id));
  };

  return (
    <AddWineContext.Provider value={{ items, setItems, reset, addPhoto, updateItem, removeItem, validatedWines, setValidatedWines }}>
      {children}
    </AddWineContext.Provider>
  );
};

export const useAddWine = () => {
  const ctx = useContext(AddWineContext);
  if (!ctx) throw new Error('useAddWine must be used within AddWineProvider');
  return ctx;
}; 