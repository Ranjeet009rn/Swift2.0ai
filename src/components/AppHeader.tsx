import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  backgroundColor?: string;
  textColor?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showLogout = false,
  onLogout,
  backgroundColor = '#4f46e5',
  textColor = '#ffffff',
  showRefresh = false,
  onRefresh,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {typeof onRefresh === 'function' && (
            <TouchableOpacity 
              style={[styles.logoutButton, { marginRight: 8 }]}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={22} color={textColor} />
              <Text style={[styles.logoutText, { color: textColor }]}>Refresh</Text>
            </TouchableOpacity>
          )}
          {showLogout && onLogout && (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={24} color={textColor} />
              <Text style={[styles.logoutText, { color: textColor }]}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default AppHeader;
