import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

interface UniversalBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const UniversalBottomNav: React.FC<UniversalBottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      {/* Spacer to push content up */}
      <View style={styles.spacer} />
      
      {/* Fixed Navigation */}
      <View style={styles.fixedNav}>
        <View style={styles.debugBar}>
          <Text style={styles.debugText}>🚀 NAVIGATION ALWAYS HERE 🚀</Text>
        </View>
        
        <View style={styles.navContainer}>
          <TouchableOpacity 
            style={[styles.navButton, activeTab === 'dashboard' && styles.activeButton]}
            onPress={() => onTabChange('dashboard')}
          >
            <Text style={styles.navIcon}>📊</Text>
            <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeText]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, activeTab === 'raise' && styles.activeButton]}
            onPress={() => onTabChange('raise')}
          >
            <Text style={styles.navIcon}>➕</Text>
            <Text style={[styles.navText, activeTab === 'raise' && styles.activeText]}>
              Raise Ticket
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, activeTab === 'tickets' && styles.activeButton]}
            onPress={() => onTabChange('tickets')}
          >
            <Text style={styles.navIcon}>📋</Text>
            <Text style={[styles.navText, activeTab === 'tickets' && styles.activeText]}>
              My Tickets
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  spacer: {
    height: 100, // Creates space so content doesn't go behind nav
  },
  fixedNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopWidth: 6,
    borderTopColor: '#ff0000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 99999,
    zIndex: 999999,
  },
  debugBar: {
    backgroundColor: '#ff0000',
    paddingVertical: 8,
    alignItems: 'center',
  },
  debugText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12, // Extra padding for iPhone home indicator
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minHeight: 60,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#1e3a8a',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  activeText: {
    color: '#ffffff',
  },
});

export default UniversalBottomNav;
