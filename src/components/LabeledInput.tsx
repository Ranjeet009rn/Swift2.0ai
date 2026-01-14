import React from 'react';
import { View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Input from './ui/Input';

interface LabeledInputProps extends TextInputProps {
  label: string;
  note?: string;
}

export default function LabeledInput({ label, note, style, ...props }: LabeledInputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Input {...props} style={style} />
      {note ? <Text style={[styles.note, { color: colors.textSecondary }]}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  note: {
    fontSize: 12,
    marginTop: 6,
  },
});
