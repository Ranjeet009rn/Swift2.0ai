import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Client Dashboard - Only screen needed
import ClientDashboard from '../screens/ClientDashboard';

const Stack = createStackNavigator();

// Main Stack Navigator - Client Only
export default function MainNavigator() {
  const { colors } = useTheme();
  const { signOut, user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: 'rgba(5, 48, 142, 0.83)' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        options={{
          headerShown: false,
        }}
      >
        {() => <ClientDashboard 
          clientData={{ 
            licenseNumber: user?.email?.split('@')[0] || 'LC12345', 
            mobileNumber: '9108215657' 
          }} 
          onLogout={signOut} 
        />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
