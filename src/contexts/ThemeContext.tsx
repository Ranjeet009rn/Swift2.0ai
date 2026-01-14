import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  colors: {
    primary: string;
    background: string;
    card: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    success: string;
    error: string;
    warning: string;
  };
};

const lightColors = {
  primary: '#22C55E', // emerald-500
  background: '#FFFFFF',
  card: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#212529',
  textSecondary: '#5B6472',
  border: '#E9ECEF',
  notification: '#22C55E',
  success: '#40C057',
  error: '#FA5252',
  warning: '#FCC419',
};

const darkColors = {
  primary: '#16A34A', // emerald-600
  background: '#121212',
  card: '#1E1E1E',
  surface: '#171717',
  text: '#F8F9FA',
  textSecondary: '#A1A8B0',
  border: '#343A40',
  notification: '#16A34A',
  success: '#69DB7C',
  error: '#FF8787',
  warning: '#FFD43B',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme() || 'light';
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme);

  // Platform-aware storage helpers
  const storage = {
    getItem: async (key: string): Promise<string | null> => {
      if (Platform.OS === 'web') {
        try {
          return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        } catch {
          return null;
        }
      }
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      if (Platform.OS === 'web') {
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        } catch {}
        return;
      }
      await SecureStore.setItemAsync(key, value);
    },
    deleteItem: async (key: string): Promise<void> => {
      if (Platform.OS === 'web') {
        try {
          if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        } catch {}
        return;
      }
      await SecureStore.deleteItemAsync(key);
    },
  };

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedTheme = (await storage.getItem('themeMode')) as ThemeMode | null;
        if (savedTheme) {
          setThemeMode(savedTheme);
          updateTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };

    loadThemePreference();
  }, []);

  const updateTheme = (mode: ThemeMode) => {
    if (mode === 'system') {
      setTheme(systemColorScheme);
    } else {
      setTheme(mode);
    }
  };

  const handleSetThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      updateTheme(mode);
      await storage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode: handleSetThemeMode,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}