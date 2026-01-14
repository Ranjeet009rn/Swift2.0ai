import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SimpleBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SimpleBottomNav: React.FC<SimpleBottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>🔥 BOTTOM MENU IS HERE 🔥</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, activeTab === 'dashboard' && styles.activeButton]}
          onPress={() => onTabChange('dashboard')}
        >
          <Text style={[styles.buttonText, activeTab === 'dashboard' && styles.activeText]}>
            📊 Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, activeTab === 'raise' && styles.activeButton]}
          onPress={() => onTabChange('raise')}
        >
          <Text style={[styles.buttonText, activeTab === 'raise' && styles.activeText]}>
            ➕ Raise Ticket
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, activeTab === 'tickets' && styles.activeButton]}
          onPress={() => onTabChange('tickets')}
        >
          <Text style={[styles.buttonText, activeTab === 'tickets' && styles.activeText]}>
            📋 My Tickets
          </Text>
        </TouchableOpacity>
      </View>
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
    borderTopWidth: 5,
    borderTopColor: '#ff0000',
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 9999,
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  debugText: {
    textAlign: 'center',
    backgroundColor: '#ff0000',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#1e3a8a',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  activeText: {
    color: '#ffffff',
  },
});

export default SimpleBottomNav;
