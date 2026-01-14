import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth screens
import CleanLoginScreen from '../screens/CleanLoginScreen';

export type AuthStackParamList = {
  Login: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: 'rgba(5, 48, 142, 0.83)' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Login" options={{ headerShown: false }}>
        {() => (
          <CleanLoginScreen 
            onLoginSuccess={() => {
              // Login success is automatically handled by AuthContext
              // User will be redirected to MainNavigator
              console.log('Login successful - redirecting to main app');
            }} 
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
