import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AayuMandala } from '@/components/onboarding/AayuMandala';
import { ChevronLeft } from 'lucide-react-native';
import { FONTS, SPACING, fs, lh } from '@/constants/theme';

interface SetupHeaderProps {
  step:    number;
  total:   number;
  onBack?: () => void;
  style?:  ViewStyle;
}

export const SetupHeader: React.FC<SetupHeaderProps> = ({
  step, total, onBack, style,
}) => {
  const { colors } = useTheme();
  const goldColor = colors.primary;
  const goldLight = colors.trackWeight;
  const muted = colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                backgroundColor: `${colors.primary}14`,
                borderColor: `${colors.primary}40`,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={goldLight} />
          </TouchableOpacity>
        ) : (
          <AayuMandala size={30} color={goldColor} animated={false} />
        )}
      </View>

      <View style={styles.centre}>
        <Text style={[styles.star, { color: goldColor }]} accessible={false} importantForAccessibility="no">
          ✦
        </Text>
        <Text style={[styles.wordmark, { color: goldColor }]}>Aayu</Text>
      </View>

      <View style={[styles.side, styles.sideRight]}>
        <View style={[
          styles.stepPill,
          {
            backgroundColor: `${colors.primary}18`,
            borderColor: `${colors.primary}40`,
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
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,

  backArrow: {
    fontSize: fs(18), lineHeight: lh(18),
    fontFamily: FONTS.bodyRegular,
  } as TextStyle,

  centre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  } as ViewStyle,

  star: {
    fontSize: fs(11),
    fontFamily: FONTS.bodyRegular,
  } as TextStyle,

  wordmark: {
    fontFamily: FONTS.displayLight,
    fontSize: fs(14),
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
    fontSize: fs(11),
    fontWeight: '500',
  } as TextStyle,
});
