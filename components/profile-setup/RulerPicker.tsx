// components/profile-setup/RulerPicker.tsx
// Drum-roll vertical ruler picker — reusable for height and weight.
// Uses ScrollView with native snapToInterval (no manual scrollTo snapping).

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, NativeSyntheticEvent, NativeScrollEvent,
  ViewStyle, TextStyle, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import { hexAlpha } from '@/constants/colors';

const ITEM_H  = 48;
const DEFAULT_VISIBLE = 5;

export interface RulerPickerProps {
  value:            number;
  min:              number;
  max:              number;
  onChange:         (v: number) => void;
  unit:             string;
  hint?:            string;
  showDecimal?:     boolean;
  decimal?:         string;
  onDecimalChange?: (d: string) => void;
  accentColor?:     string;
  /** Shorter ruler for tight screens (e.g. current weight + BMI). Default 5 rows (~240pt). */
  visibleRows?:     3 | 4 | 5;
  /** Smaller readout + nudges to fit above bottom CTA on small devices. */
  compact?:         boolean;
}

const RulerRow: React.FC<{
  v: number; selected: boolean; isDark: boolean; accent: string; primary: string; trackLt: string;
}> = React.memo(({ v, selected, isDark, accent, primary, trackLt }) => {
  const major = v % 5 === 0;
  return (
    <View style={[
      rr.row,
      selected && { backgroundColor: isDark ? hexAlpha(primary, 0.12) : hexAlpha(primary, 0.08) },
    ]}>
      <Text style={[rr.num, {
        color:      selected ? accent : major ? (isDark ? 'rgba(240,224,192,.6)' : 'rgba(30,16,4,.55)') : (isDark ? 'rgba(240,224,192,.3)' : 'rgba(30,16,4,.25)'),
        fontSize:   selected ? 18 : major ? 13 : 11,
        fontWeight: (selected ? '700' : major ? '500' : '400') as any,
      }]}>
        {v}
      </Text>
      <View style={[rr.tick, {
        width:           selected ? 28 : major ? 18 : 10,
        height:          selected ? 2.5 : major ? 1.5 : 1,
        backgroundColor: selected ? accent : major ? (isDark ? hexAlpha(primary, 0.5) : hexAlpha(trackLt, 0.4)) : (isDark ? hexAlpha(primary, 0.2) : hexAlpha(trackLt, 0.15)),
      }]} />
    </View>
  );
});

const rr = StyleSheet.create({
  row:  { height: ITEM_H, flexDirection: 'row' as const, alignItems: 'center' as const, paddingLeft: 14, gap: 10 } as ViewStyle,
  num:  { fontFamily: FONTS.bodyMedium, minWidth: 36, textAlign: 'right' as const } as TextStyle,
  tick: { borderRadius: 2 } as ViewStyle,
});

export const RulerPicker: React.FC<RulerPickerProps> = ({
  value, min, max, onChange, unit, hint,
  showDecimal = false, decimal = '', onDecimalChange, accentColor,
  visibleRows: visibleRowsProp, compact = false,
}) => {
  const { isDark, colors } = useTheme();
  const visibleRows = visibleRowsProp ?? DEFAULT_VISIBLE;
  const halfPad     = Math.floor(visibleRows / 2);
  const rulerH      = ITEM_H * visibleRows;

  const accent  = accentColor ?? colors.primary;
  const primary = colors.primary;
  const trackLt = colors.trackWeight;
  const cream   = isDark ? colors.text : '#1e1004';
  const mutedCl = isDark ? '#7a6040' : '#7a5028';
  const surfBg  = isDark ? '#0a0703' : '#fdf3e3';

  const scrollRef    = useRef<ScrollView>(null);
  const emittedValue = useRef(value);
  const isUserDrag   = useRef(false);
  const mounted      = useRef(false);

  const values = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );

  // Scroll to initial value on mount
  useEffect(() => {
    const y = (value - min) * ITEM_H;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
      mounted.current = true;
    }, 100);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When value changes externally (nudge buttons), scroll to follow
  useEffect(() => {
    if (!mounted.current || isUserDrag.current) return;
    const y = (value - min) * ITEM_H;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, [value, min]);

  const handleScrollBegin = useCallback(() => {
    isUserDrag.current = true;
  }, []);

  // Fires continuously during scroll — update display value + haptics
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y   = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    const v   = Math.min(max, Math.max(min, min + idx));
    if (v !== emittedValue.current) {
      emittedValue.current = v;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(v);
    }
  }, [min, max, onChange]);

  // Only fires after momentum ends — emit final value, clear drag flag
  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserDrag.current = false;
    const y   = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    const v   = Math.min(max, Math.max(min, min + idx));
    if (v !== emittedValue.current) {
      emittedValue.current = v;
      onChange(v);
    }
  }, [min, max, onChange]);

  // When user lifts finger without flinging, momentum doesn't fire — clear drag flag
  const handleDragEnd = useCallback(() => {
    isUserDrag.current = false;
  }, []);

  const nudge = useCallback((delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    }
  }, [value, min, max, onChange]);

  return (
    <View style={s.wrap}>
      <View style={[s.row, compact && s.rowCompact]}>

        {/* Ruler */}
        <View style={[s.rulerOuter, {
          height: rulerH,
          backgroundColor: isDark ? hexAlpha(primary, 0.03) : hexAlpha(primary, 0.04),
          borderColor:     isDark ? hexAlpha(primary, 0.16) : hexAlpha(primary, 0.2),
        }]}>
          {/* Centre highlight band */}
          <View pointerEvents="none" style={[s.selBand, {
            top:             halfPad * ITEM_H,
            backgroundColor: isDark ? hexAlpha(primary, 0.1) : hexAlpha(primary, 0.07),
            borderTopColor:    `${accent}60`,
            borderBottomColor: `${accent}60`,
          }]} />

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_H}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBegin}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollEndDrag={handleDragEnd}
            overScrollMode="never"
            bounces={Platform.OS === 'ios'}
            nestedScrollEnabled
            contentContainerStyle={{
              paddingTop:    halfPad * ITEM_H,
              paddingBottom: halfPad * ITEM_H,
            }}
          >
            {values.map(v => (
              <RulerRow key={v} v={v} selected={v === value} isDark={isDark} accent={accent} primary={primary} trackLt={trackLt} />
            ))}
          </ScrollView>

          {/* Gradient fades */}
          <View pointerEvents="none" style={[s.fade, s.fadeTop,    { backgroundColor: surfBg }]} />
          <View pointerEvents="none" style={[s.fade, s.fadeBottom, { backgroundColor: surfBg }]} />
        </View>

        {/* Display */}
        <View style={s.display}>
          <View style={s.bigValRow}>
            <Text style={[s.bigVal, compact && s.bigValCompact, { color: cream }]}>{value}</Text>
            <Text style={[s.bigUnit, compact && s.bigUnitCompact, { color: mutedCl }]}>{unit}</Text>
          </View>

          {hint ? (
            <Text style={[s.hint, { color: isDark ? '#3aaa6e' : '#208050' }]}>{hint}</Text>
          ) : null}

          {showDecimal && (
            <View style={[s.decimalWrap, {
              borderColor:     isDark ? hexAlpha(primary, 0.22) : hexAlpha(primary, 0.28),
              backgroundColor: isDark ? hexAlpha(primary, 0.05) : hexAlpha(primary, 0.04),
            }]}>
              <Text style={[s.decDot,   { color: mutedCl }]}>.</Text>
              <TextInput
                value={decimal}
                onChangeText={t => onDecimalChange?.(t.replace(/[^0-9]/g, '').slice(0, 1))}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="0"
                placeholderTextColor={isDark ? hexAlpha(primary, 0.25) : hexAlpha(trackLt, 0.3)}
                style={[s.decInput, { color: cream }]}
              />
              <Text style={[s.decUnit, { color: isDark ? hexAlpha(primary, 0.4) : hexAlpha(trackLt, 0.45) }]}>{unit}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Nudge */}
      <View style={s.nudgeRow}>
        {[{ delta: -1, label: '−' }, { delta: 1, label: '+' }].map(({ delta, label }) => (
          <TouchableOpacity
            key={label}
            onPress={() => nudge(delta)}
            activeOpacity={0.7}
            style={[s.nudgeBtn, compact && s.nudgeBtnCompact, {
              backgroundColor: isDark ? hexAlpha(primary, 0.08) : hexAlpha(primary, 0.06),
              borderColor:     isDark ? hexAlpha(primary, 0.2)  : hexAlpha(primary, 0.22),
            }]}
          >
            <Text style={[s.nudgeTxt, compact && s.nudgeTxtCompact, { color: accent }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:        { width: '100%' as any }                                                as ViewStyle,
  row:         { flexDirection: 'row' as const, gap: 16, alignItems: 'center' as const, marginBottom: SPACING.sm } as ViewStyle,
  rowCompact:  { gap: 12, marginBottom: 6 }                                            as ViewStyle,
  rulerOuter:  { width: 110, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' as const, position: 'relative' as const, flexShrink: 0 } as ViewStyle,
  selBand:     { position: 'absolute' as const, left: 0, right: 0, height: ITEM_H, borderTopWidth: 1.5, borderBottomWidth: 1.5, zIndex: 1 } as ViewStyle,
  fade:        { position: 'absolute' as const, left: 0, right: 0, height: ITEM_H * 1.6, zIndex: 2, opacity: 0.9 } as ViewStyle,
  fadeTop:     { top: 0 }                                                              as ViewStyle,
  fadeBottom:  { bottom: 0 }                                                           as ViewStyle,
  display:     { flex: 1 }                                                             as ViewStyle,
  bigValRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 5, marginBottom: 4 } as ViewStyle,
  bigVal:      { fontFamily: FONTS.displayLight, fontSize: fs(58), fontWeight: '300' as const, lineHeight: lh(58), letterSpacing: -1.5 } as TextStyle,
  bigValCompact: { fontSize: fs(44), lineHeight: lh(44), letterSpacing: -1, fontWeight: '300' as const } as TextStyle,
  bigUnit:     { fontFamily: FONTS.bodyMedium, fontSize: fs(16), fontWeight: '500' as const, lineHeight: lh(16) } as TextStyle,
  bigUnitCompact: { fontSize: fs(14), lineHeight: lh(14) } as TextStyle,
  hint:        { fontFamily: FONTS.bodyRegular, fontSize: fs(12), marginBottom: 10 }      as TextStyle,
  decimalWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' as const, gap: 2, marginTop: 6 } as ViewStyle,
  decDot:      { fontFamily: FONTS.displayLight, fontSize: fs(22), fontWeight: '300' as const, lineHeight: lh(22) } as TextStyle,
  decInput:    { fontFamily: FONTS.displayLight, fontSize: fs(22), fontWeight: '300' as const, lineHeight: lh(22), minWidth: 18, padding: 0 } as TextStyle,
  decUnit:     { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '500' as const, marginLeft: 2 } as TextStyle,
  nudgeRow:    { flexDirection: 'row' as const, gap: SPACING.sm }                     as ViewStyle,
  nudgeBtn:    { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
  nudgeBtnCompact: { paddingVertical: 9 } as ViewStyle,
  nudgeTxt:    { fontFamily: FONTS.bodyMedium, fontSize: fs(22), fontWeight: '400' as const, lineHeight: lh(22) } as TextStyle,
  nudgeTxtCompact: { fontSize: fs(18), lineHeight: lh(18) } as TextStyle,
});
