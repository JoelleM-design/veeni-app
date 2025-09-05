/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Design System Colors - Veeni App
export const VeeniColors = {
  // Background colors
  background: {
    primary: '#222',      // Main app background
    secondary: '#333',    // Cards, modals
    tertiary: '#444',     // Inputs, buttons
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
  },
  
  // Text colors
  text: {
    primary: '#FFF',      // Main text
    secondary: '#B0B0B0', // Subtitle text
    tertiary: '#999',     // Placeholder, disabled
    accent: '#FFFFFF',    // Accent color for highlights
  },
  
  // Accent colors
  accent: {
    primary: '#FFFFFF',   // Main accent (white)
    secondary: '#FF4F8B', // Secondary accent (pink)
    success: '#4CAF50',   // Success states
    error: '#FF6B6B',     // Error states
    warning: '#FFD700',   // Warning states
  },
  
  // Wine colors
  wine: {
    red: '#FF4F8B',       // Red wine
    white: '#FFF8DC',     // White wine
    rose: '#FFB6C1',      // Rosé wine
    sparkling: '#FFD700', // Sparkling wine
  },
  
  // Borders and separators
  border: {
    primary: '#444',      // Main borders
    secondary: '#393C40', // Secondary borders
    light: 'rgba(255, 255, 255, 0.1)', // Light borders
  },
  
  // Button colors
  button: {
    primary: '#FFF',      // Primary buttons
    secondary: '#333',    // Secondary buttons
    accent: '#FFFFFF',    // Accent buttons
    danger: '#FF6B6B',    // Danger buttons
  },
  
  // Input colors
  input: {
    background: '#333',   // Input background
    border: '#444',       // Input border
    text: '#FFF',         // Input text
    placeholder: '#999',  // Placeholder text
  },
};

// Typography system
export const Typography = {
  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },
  
  // Font weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
};

// Border radius system
export const BorderRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};
