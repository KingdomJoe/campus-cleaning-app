import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

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
      const saved = await SecureStore.getItemAsync('theme_mode');
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
      await SecureStore.setItemAsync('theme_mode', mode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },
  toggleTheme: async () => {
    const nextMode = get().themeMode === 'dark' ? 'light' : 'dark';
    set({ themeMode: nextMode });
    try {
      await SecureStore.setItemAsync('theme_mode', nextMode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },
}));
