import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function Input({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <TextInput
        {...props}
        placeholderTextColor={'#94A3B8'}
        style={[styles.input, { color: colors.text }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 14,
  },
});
