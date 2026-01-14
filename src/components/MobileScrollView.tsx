import React from 'react';
import { ScrollView, View, StyleSheet, Platform } from 'react-native';

interface MobileScrollViewProps {
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
}

const MobileScrollView: React.FC<MobileScrollViewProps> = ({ 
  children, 
  style, 
  contentContainerStyle 
}) => {
  // Mobile-specific scroll properties
  const mobileScrollProps = {
    showsVerticalScrollIndicator: true,
    bounces: true,
    alwaysBounceVertical: true,
    scrollEnabled: true,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
    // Force scrolling on web/mobile browsers
    ...(Platform.OS === 'web' && {
      style: {
        ...style,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        height: '100%',
        maxHeight: '100vh',
      }
    })
  };

  return (
    <ScrollView
      {...mobileScrollProps}
      style={[styles.defaultStyle, style]}
      contentContainerStyle={[styles.defaultContentStyle, contentContainerStyle]}
      // @ts-ignore - Web-specific className
      className={Platform.OS === 'web' ? 'mobile-scroll-container' : undefined}
    >
      <View 
        // @ts-ignore - Web-specific className
        className={Platform.OS === 'web' ? 'scroll-content' : undefined}
        style={Platform.OS === 'web' ? { minHeight: 1500 } : undefined}
      >
        {children}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  defaultStyle: {
    flex: 1,
  },
  defaultContentStyle: {
    flexGrow: 1,
    paddingBottom: 100, // Space for navigation
    minHeight: 1200, // Force scrolling
  },
});

export default MobileScrollView;
