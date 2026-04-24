import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  ViewStyle, TextStyle,
} from 'react-native';
import { FONTS, fs } from '@/constants/theme';

export interface BMIScaleProps {
  bmi: number;
  isDark: boolean;
  compact?: boolean;
}

export const BMIScale: React.FC<BMIScaleProps> = ({ bmi, isDark, compact }) => {
  const minBMI = 10;
  const maxBMI = 40;
  const pct = Math.min(100, Math.max(0, ((bmi - minBMI) / (maxBMI - minBMI)) * 100));
  const needleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(needleAnim, {
      toValue: pct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, needleAnim]);

  const barHeight = compact ? 5 : 8;
  const needleHeight = compact ? 9 : 14;
  const needleWidth = compact ? 2 : 3;

  return (
    <View style={{ marginTop: compact ? 4 : 6 }}>
      <View style={[styles.bar, { height: barHeight }]}>
        <View style={[styles.seg, { flex: 1.7, backgroundColor: '#5b8dd9' }]} />
        <View style={[styles.seg, { flex: 1.5, backgroundColor: '#3aaa6e' }]} />
        <View style={[styles.seg, { flex: 1, backgroundColor: '#e8c05a' }]} />
        <View style={[styles.seg, { flex: 1.2, backgroundColor: '#e07b30' }]} />
        <View style={[styles.seg, { flex: 2, backgroundColor: '#e05555' }]} />
      </View>
      <View style={[styles.needleTrack, { height: needleHeight }]}>
        <Animated.View
          style={[
            styles.needle,
            {
              width: needleWidth,
              height: needleHeight,
              marginLeft: -needleWidth / 2,
              left: needleAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {!compact && (
        <View style={styles.labels}>
          {['Under', 'Normal', 'Over', 'Obese'].map((l) => (
            <Text
              key={l}
              style={[
                styles.lbl,
                {
                  color: isDark ? 'rgba(200,135,42,.4)' : 'rgba(160,104,32,.45)',
                },
              ]}
            >
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  } as ViewStyle,
  seg: {
    height: '100%' as const,
  } as ViewStyle,
  needleTrack: {
    position: 'relative',
  } as ViewStyle,
  needle: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#fff',
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  } as ViewStyle,
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  } as ViewStyle,
  lbl: {
    fontFamily: FONTS.bodyRegular,
    fontSize: fs(10),
  } as TextStyle,
});
