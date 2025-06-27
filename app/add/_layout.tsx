import { Stack } from 'expo-router';
import React from 'react';
import { AddWineProvider } from '../../context/AddWineContext';

export default function AddLayout() {
  return (
    <AddWineProvider>
      <Stack />
    </AddWineProvider>
  );
} 