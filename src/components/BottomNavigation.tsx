import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'analytics' },
    { id: 'raise', label: 'Raise Ticket', icon: 'add-circle' },
    { id: 'tickets', label: 'My Tickets', icon: 'list' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
                size={22} 
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
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  safeArea: {
    backgroundColor: '#ffffff',
  },
  navigation: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 60,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  navItemActive: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  navText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 3,
    textAlign: 'center',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
});

export default BottomNavigation;
