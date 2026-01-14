import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';

interface User {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithOtp: (licenseNo: string, mobileNo: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const clientData = await AsyncStorage.getItem('client_data');
      console.log('Loading stored user, clientData:', clientData);
      
      if (clientData) {
        const client = JSON.parse(clientData);
        console.log('Parsed client data:', client);
        
        const userData = {
          id: client.cid?.toString() || '1',
          name: client.client_name || client.clientName || 'User',
          email: (client.license_no || client.licenseNumber || 'user') + '@tally.com',
          licenseNumber: client.license_no || client.licenseNumber || 'N/A'
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
      } else {
        console.log('No client data found');
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // PHP API login with OTP
  const signInWithOtp = async (licenseNo: string, mobileNo: string, otp: string) => {
    console.log('🚀 STARTING LOGIN PROCESS');
    console.log('License:', licenseNo, 'Mobile:', mobileNo, 'OTP:', otp);
    try {
      const response = await fetch(`${PHP_API_URL}client_verify_otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseNumber: licenseNo,
          mobileNumber: mobileNo,
          otp: otp
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const clientData = result.data.client;
        
        console.log('=== LOGIN SUCCESS DEBUG ===');
        console.log('Full API result:', result);
        console.log('Client data from API:', clientData);
        console.log('License from API:', clientData.license_no);
        console.log('Mobile from API:', clientData.mobile_no);
        
        // Save to AsyncStorage with all fields
        await AsyncStorage.setItem('jwt_token', result.data.token);
        await AsyncStorage.setItem('token_expiry', result.data.expiresAt);
        await AsyncStorage.setItem('client_data', JSON.stringify(clientData));
        
        console.log('Saved to AsyncStorage:', JSON.stringify(clientData));
        
        // Set user
        setUser({
          id: clientData.cid.toString(),
          name: clientData.client_name || clientData.contact_person,
          email: clientData.email || (clientData.license_no + '@tally.com'),
          licenseNumber: clientData.license_no
        });
      } else {
        console.log('Login failed:', result);
        throw new Error(result.message || 'Invalid credentials or OTP');
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Login failed');
    }
  };

  // Logout
  const signOut = async () => {
    try {
      // Simply clear stored data
      await AsyncStorage.removeItem('client_data');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('jwt_token');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setUser(null);
    }
  };

  // Function to refresh auth state
  const refreshAuth = async () => {
    console.log('RefreshAuth called - reloading user data');
    setIsLoading(true);
    await loadStoredUser();
    console.log('RefreshAuth completed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithOtp,
        signOut,
        isAuthenticated: !!user,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
