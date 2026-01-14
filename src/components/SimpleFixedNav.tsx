import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

interface SimpleFixedNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SimpleFixedNav: React.FC<SimpleFixedNavProps> = ({ activeTab, onTabChange }) => {
  const insets = useSafeAreaInsets();
  
  // Web-specific inline styles for guaranteed positioning
  const webStyles = Platform.OS === 'web' ? {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100vw' as any,
    zIndex: 9999,
  } : {};

  return (
    <View style={[styles.fixedBottom, webStyles, { 
      paddingBottom: insets.bottom,
      height: 70 + insets.bottom 
    }]}>
      <View style={styles.navContainer}>
        <TouchableOpacity 
          style={[styles.button, activeTab === 'dashboard' && styles.activeButton]}
          onPress={() => onTabChange('dashboard')}
        >
          <Ionicons 
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeTab === 'dashboard' ? '#3b82f6' : '#64748b'} 
          />
          <Text style={[styles.text, activeTab === 'dashboard' && styles.activeText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, activeTab === 'tickets' && styles.activeButton]}
          onPress={() => onTabChange('tickets')}
        >
          <Ionicons 
            name={activeTab === 'tickets' ? 'list' : 'list-outline'} 
            size={24} 
            color={activeTab === 'tickets' ? '#3b82f6' : '#64748b'} 
          />
          <Text style={[styles.text, activeTab === 'tickets' && styles.activeText]}>My Tickets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, activeTab === 'profile' && styles.activeButton]}
          onPress={() => onTabChange('profile')}
        >
          <Ionicons 
            name={activeTab === 'profile' ? 'person' : 'person-outline'} 
            size={24} 
            color={activeTab === 'profile' ? '#3b82f6' : '#64748b'} 
          />
          <Text style={[styles.text, activeTab === 'profile' && styles.activeText]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, activeTab === 'askMe' && styles.activeButton]}
          onPress={() => onTabChange('askMe')}
        >
          <Ionicons 
            name={activeTab === 'askMe' ? 'logo-android' : 'logo-android'} 
            size={24} 
            color={activeTab === 'askMe' ? '#3b82f6' : '#64748b'} 
          />
          <Text style={[styles.text, activeTab === 'askMe' && styles.activeText]}>Ask me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 999,
  },
  navContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  activeText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default SimpleFixedNav;
