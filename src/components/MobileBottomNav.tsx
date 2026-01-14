import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <View 
      style={styles.container}
      // @ts-ignore - Web-specific className
      className={Platform.OS === 'web' ? 'mobile-bottom-nav' : undefined}
    >
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'dashboard' && styles.activeItem]}
          // @ts-ignore - Web-specific className
          className={Platform.OS === 'web' ? `nav-item ${activeTab === 'dashboard' ? 'active' : ''}` : undefined}
          onPress={() => onTabChange('dashboard')}
        >
          <Ionicons 
            name="analytics" 
            size={24} 
            color={activeTab === 'dashboard' ? '#ffffff' : '#6b7280'} 
          />
          <Text 
            style={[styles.navText, activeTab === 'dashboard' && styles.activeText]}
            // @ts-ignore - Web-specific className
            className={Platform.OS === 'web' ? `nav-text ${activeTab === 'dashboard' ? 'active' : ''}` : undefined}
          >
            Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'raise' && styles.activeItem]}
          // @ts-ignore - Web-specific className
          className={Platform.OS === 'web' ? `nav-item ${activeTab === 'raise' ? 'active' : ''}` : undefined}
          onPress={() => onTabChange('raise')}
        >
          <Ionicons 
            name="add-circle" 
            size={24} 
            color={activeTab === 'raise' ? '#ffffff' : '#6b7280'} 
          />
          <Text 
            style={[styles.navText, activeTab === 'raise' && styles.activeText]}
            // @ts-ignore - Web-specific className
            className={Platform.OS === 'web' ? `nav-text ${activeTab === 'raise' ? 'active' : ''}` : undefined}
          >
            Raise Ticket
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'tickets' && styles.activeItem]}
          // @ts-ignore - Web-specific className
          className={Platform.OS === 'web' ? `nav-item ${activeTab === 'tickets' ? 'active' : ''}` : undefined}
          onPress={() => onTabChange('tickets')}
        >
          <Ionicons 
            name="list" 
            size={24} 
            color={activeTab === 'tickets' ? '#ffffff' : '#6b7280'} 
          />
          <Text 
            style={[styles.navText, activeTab === 'tickets' && styles.activeText]}
            // @ts-ignore - Web-specific className
            className={Platform.OS === 'web' ? `nav-text ${activeTab === 'tickets' ? 'active' : ''}` : undefined}
          >
            My Tickets
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
    width: screenWidth,
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1000,
    zIndex: 1000,
  },
  navBar: {
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeItem: {
    backgroundColor: '#1e3a8a',
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  activeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default MobileBottomNav;
