// Required at the very top before any other imports
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Import global scrolling CSS for web
import './web/global-scrolling.css';

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, LogBox, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';

// Context Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CRMProvider } from './src/contexts/CRMContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Components
import SplashScreen from './src/components/SplashScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage',
]);

// Create a client for React Query
const queryClient = new QueryClient();

// Keep the native splash visible until we manually hide it
try {
  // It's safe to call multiple times
  ExpoSplashScreen.preventAutoHideAsync();
} catch {}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const linking = { enabled: Platform.OS !== 'web' } as const;

  useEffect(() => {
    // Ensure app is ready
    setIsReady(true);
    // Hide native splash as soon as React is ready to render our custom splash
    (async () => {
      try { await ExpoSplashScreen.hideAsync(); } catch {}
    })();
  }, []);

  // Show custom splash screen on app start
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const AppContent = () => (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <CRMProvider>
                <NavigationContainer linking={linking as any}>
                  <RootNavigator />
                </NavigationContainer>
                <StatusBar style="auto" />
              </CRMProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );

  return <AppContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});