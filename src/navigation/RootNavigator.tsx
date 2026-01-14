import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { colors } = useTheme();

  console.log('RootNavigator - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  if (isLoading) {
    console.log('RootNavigator - showing loading screen');
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  console.log('RootNavigator - showing', isAuthenticated ? 'MainNavigator' : 'AuthNavigator');
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}
