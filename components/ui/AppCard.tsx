import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, SPACING } from '@/constants/theme';

type AppCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** default: standard card border; elevated: slightly warmer surface */
  variant?: 'default' | 'elevated';
};

export function AppCard({ children, style, variant = 'default' }: AppCardProps) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    backgroundColor: variant === 'elevated' ? colors.surfaceWarm : colors.card,
    borderColor: colors.borderLight,
  };
  return <View style={[base, style]}>{children}</View>;
}
