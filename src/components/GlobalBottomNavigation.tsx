import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface GlobalBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const GlobalBottomNavigation: React.FC<GlobalBottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'analytics' },
    { id: 'raise', label: 'Raise Ticket', icon: 'add-circle' },
    { id: 'tickets', label: 'My Tickets', icon: 'list' },
  ];

  return (
    <View style={styles.fixedContainer}>
      {/* Debug indicator */}
      <View style={styles.debugBar}>
        <Text style={styles.debugText}>🔥 NAVIGATION MENU HERE 🔥</Text>
      </View>
      <View style={styles.navigation}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.navItem,
              activeTab === tab.id && styles.navItemActive
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={26} 
              color={activeTab === tab.id ? '#1e3a8a' : '#6b7280'} 
            />
            <Text style={[
              styles.navText,
              activeTab === tab.id && styles.navTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 90,
    backgroundColor: '#ffffff',
    borderTopWidth: 4,
    borderTopColor: '#ff0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 999999,
  },
  navigation: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#dbeafe',
  },
  navText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
  debugBar: {
    backgroundColor: '#ff0000',
    paddingVertical: 6,
    alignItems: 'center',
  },
  debugText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GlobalBottomNavigation;
