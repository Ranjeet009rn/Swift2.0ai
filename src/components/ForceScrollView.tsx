import React from 'react';
import { StyleSheet, ScrollView, RefreshControl, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ForceScrollViewProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const ForceScrollView: React.FC<ForceScrollViewProps> = ({ children, refreshing, onRefresh }) => {
  // For web, use a simple div with CSS
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          height: '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ minHeight: '100%', padding: 0 }}>
          {children}
        </div>
      </div>
    );
  }

  const insets = useSafeAreaInsets();
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
      showsVerticalScrollIndicator={true}
      bounces={true}
      refreshControl={onRefresh ? (
        <RefreshControl
          refreshing={!!refreshing}
          onRefresh={onRefresh}
          tintColor="#4f46e5"
          colors={["#4f46e5"]}
        />
      ) : undefined}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create<{ container: ViewStyle; content: ViewStyle }>({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});

export default ForceScrollView;
