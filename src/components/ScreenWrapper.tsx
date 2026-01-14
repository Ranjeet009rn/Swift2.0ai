import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import BottomNavigation from './BottomNavigation';

interface ScreenWrapperProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showBottomNav?: boolean;
  scrollable?: boolean;
  header?: React.ReactNode;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  showBottomNav = true,
  scrollable = true,
  header
}) => {
  const content = scrollable ? (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={true}
      scrollEnabled={true}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {header}
      {content}
      {showBottomNav && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150, // Space for bottom navigation
    minHeight: 1000, // Force minimum height to ensure scrolling
  },
});

export default ScreenWrapper;
