import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fs, RADIUS } from '@/constants/theme';
import { StatValueText } from '@/components/ui/StatValueText';

type StatTileProps = {
  icon: React.ReactNode;
  value: string;
  label: string;
  iconBackground: string;
};

export function StatTile({ icon, value, label, iconBackground }: StatTileProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>{icon}</View>
      <StatValueText color={colors.text} size="lg">{value}</StatValueText>
      <Text style={styles.lbl}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: { text: string; textMuted: string; card: string; borderLight: string }) {
  return StyleSheet.create({
    card: {
      flexGrow: 1,
      flexBasis: '30%',
      minWidth: 100,
      maxWidth: '100%',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      padding: 12,
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
    } as ViewStyle,
    icon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    } as ViewStyle,
    lbl: {
      fontSize: fs(9),
      fontWeight: '600',
      marginTop: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: colors.textMuted,
    } as TextStyle,
  });
}
