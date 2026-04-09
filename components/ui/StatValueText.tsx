import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { fs } from '@/constants/theme';

export type StatValueTextSize = 'lg' | 'md' | 'xl';

type StatValueTextProps = {
  children: string;
  color: string;
  /** lg ≈ key stats (Insights / Today tiles), md ≈ metric grid, xl ≈ analytics overview */
  size?: StatValueTextSize;
};

const FONT: Record<StatValueTextSize, number> = { lg: fs(22), md: fs(20), xl: fs(28) };
const MIN_HEIGHT: Record<StatValueTextSize, number> = { lg: 52, md: 48, xl: 68 };

/**
 * Hero stat number in tight grids: stable min height, shrink-to-fit, up to 2 lines.
 */
export function StatValueText({ children, color, size = 'lg' }: StatValueTextProps) {
  const fontSize = FONT[size];
  return (
    <View style={[styles.wrap, { minHeight: MIN_HEIGHT[size] }]}>
      <Text
        style={[styles.text, { color, fontSize }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={size === 'xl' ? 0.5 : 0.55}
        maxFontSizeMultiplier={1.35}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  text: {
    width: '100%' as const,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  } as TextStyle,
});
