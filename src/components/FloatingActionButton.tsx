import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingActionButtonProps {
  onPress: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  // App bottom nav height; adjust if your bottom bar height changes
  const appBottomNavHeight = 70;
  // Web spec from inspect
  const fabSizeWeb = 58;
  const bottomWeb = 93;
  const rightWeb = 15;
  // Native spec
  const fabSizeNative = 75;
  const nativeBottom = Math.max(insets.bottom, 16) + appBottomNavHeight + 6; // slightly closer to bottom nav
  const iconSize = Math.max(24, Math.min(36, (Platform.OS === 'web' ? fabSizeWeb : fabSizeNative) * 0.46));

  // Right-side positioning above bottom nav
  const webStyles: any = Platform.OS === 'web' ? {
    position: 'fixed',
    bottom: bottomWeb,
    right: rightWeb,
    zIndex: 10002,
    width: fabSizeWeb,
    height: fabSizeWeb,
    borderRadius: fabSizeWeb / 2,
  } : {
    position: 'absolute',
    bottom: nativeBottom,
    right: 20,
    width: fabSizeNative,
    height: fabSizeNative,
    borderRadius: fabSizeNative / 2,
    zIndex: 10001,
  };

  return (
    <TouchableOpacity 
      style={[styles.fab, webStyles]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={iconSize} color="#ffffff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10001,
  },
});

export default FloatingActionButton;
