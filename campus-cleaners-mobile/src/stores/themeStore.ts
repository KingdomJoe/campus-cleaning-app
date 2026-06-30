import { Platform } from 'react-native';
import { create } from 'zustand';

const THEME_KEY = 'theme_mode';

async function storageGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  const SecureStore = require('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function storageSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = require('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

interface ThemeState {
  themeMode: 'light' | 'dark';
  initializeTheme: () => Promise<void>;
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light',
  initializeTheme: async () => {
    try {
      const saved = await storageGetItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ themeMode: saved });
      }
    } catch (e) {
      console.warn('Failed to load theme preference', e);
    }
  },
  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    try {
      await storageSetItem(THEME_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },
  toggleTheme: async () => {
    const nextMode = get().themeMode === 'dark' ? 'light' : 'dark';
    set({ themeMode: nextMode });
    try {
      await storageSetItem(THEME_KEY, nextMode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },
}));
