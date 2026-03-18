import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import { FONTS, SPACING } from '@/constants/theme';

interface SetupHeaderProps {
  step:    number;
  total:   number;
  onBack?: () => void;
  style?:  ViewStyle;
}

export const SetupHeader: React.FC<SetupHeaderProps> = ({
  step, total, onBack, style,
}) => {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? '#c8872a' : '#a06820';
  const goldLight = isDark ? '#e8a84c' : '#a06820';
  const muted = isDark ? 'rgba(240,224,192,0.4)' : '#7a5020';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? 'rgba(200,135,42,0.08)' : 'rgba(200,135,42,0.1)',
                borderColor:     isDark ? 'rgba(200,135,42,0.2)'  : 'rgba(200,135,42,0.28)',
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.backArrow, { color: goldLight }]}>←</Text>
          </TouchableOpacity>
        ) : (
          <AayuMandala size={30} color={goldColor} animated={false} />
        )}
      </View>

      <View style={styles.centre}>
        <Text style={[styles.star, { color: goldColor }]}>✦</Text>
        <Text style={[styles.wordmark, { color: goldColor }]}>Aayu</Text>
      </View>

      <View style={[styles.side, styles.sideRight]}>
        <View style={[
          styles.stepPill,
          {
            backgroundColor: isDark ? 'rgba(200,135,42,0.09)' : 'rgba(200,135,42,0.1)',
            borderColor:     isDark ? 'rgba(200,135,42,0.18)' : 'rgba(200,135,42,0.25)',
          },
        ]}>
          <Text style={[styles.stepText, { color: muted }]}>
            {step} of {total}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  } as ViewStyle,

  side: {
    width: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
  } as ViewStyle,

  sideRight: {
    alignItems: 'flex-end',
  } as ViewStyle,

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,

  backArrow: {
    fontSize: 18, lineHeight: 20,
    fontFamily: FONTS.bodyRegular,
  } as TextStyle,

  centre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  } as ViewStyle,

  star: {
    fontSize: 11,
    fontFamily: FONTS.bodyRegular,
  } as TextStyle,

  wordmark: {
    fontFamily: FONTS.displayLight,
    fontSize: 14,
    letterSpacing: 2.8,
  } as TextStyle,

  stepPill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  } as ViewStyle,

  stepText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    fontWeight: '500',
  } as TextStyle,
});
