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
import { FONTS, SPACING, RADIUS } from '@/constants/theme';

const ITEM_H  = 48;
const VISIBLE = 5;
const RULER_H = ITEM_H * VISIBLE;
const HALF    = Math.floor(VISIBLE / 2);

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
}

const RulerRow: React.FC<{
  v: number; selected: boolean; isDark: boolean; accent: string;
}> = React.memo(({ v, selected, isDark, accent }) => {
  const major = v % 5 === 0;
  return (
    <View style={[
      rr.row,
      selected && { backgroundColor: isDark ? 'rgba(200,135,42,.12)' : 'rgba(200,135,42,.08)' },
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
        backgroundColor: selected ? accent : major ? (isDark ? 'rgba(200,135,42,.5)' : 'rgba(160,104,32,.4)') : (isDark ? 'rgba(200,135,42,.2)' : 'rgba(160,104,32,.15)'),
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
}) => {
  const { isDark } = useTheme();
  const accent  = accentColor ?? (isDark ? '#e8a84c' : '#a06820');
  const cream   = isDark ? '#f0e0c0' : '#1e1004';
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
      <View style={s.row}>

        {/* Ruler */}
        <View style={[s.rulerOuter, {
          backgroundColor: isDark ? 'rgba(200,135,42,.03)' : 'rgba(200,135,42,.04)',
          borderColor:     isDark ? 'rgba(200,135,42,.16)' : 'rgba(200,135,42,.2)',
        }]}>
          {/* Centre highlight band */}
          <View pointerEvents="none" style={[s.selBand, {
            top:             HALF * ITEM_H,
            backgroundColor: isDark ? 'rgba(200,135,42,.1)' : 'rgba(200,135,42,.07)',
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
              paddingTop:    HALF * ITEM_H,
              paddingBottom: HALF * ITEM_H,
            }}
          >
            {values.map(v => (
              <RulerRow key={v} v={v} selected={v === value} isDark={isDark} accent={accent} />
            ))}
          </ScrollView>

          {/* Gradient fades */}
          <View pointerEvents="none" style={[s.fade, s.fadeTop,    { backgroundColor: surfBg }]} />
          <View pointerEvents="none" style={[s.fade, s.fadeBottom, { backgroundColor: surfBg }]} />
        </View>

        {/* Display */}
        <View style={s.display}>
          <View style={s.bigValRow}>
            <Text style={[s.bigVal, { color: cream }]}>{value}</Text>
            <Text style={[s.bigUnit, { color: mutedCl }]}>{unit}</Text>
          </View>

          {hint ? (
            <Text style={[s.hint, { color: isDark ? '#3aaa6e' : '#208050' }]}>{hint}</Text>
          ) : null}

          {showDecimal && (
            <View style={[s.decimalWrap, {
              borderColor:     isDark ? 'rgba(200,135,42,.22)' : 'rgba(200,135,42,.28)',
              backgroundColor: isDark ? 'rgba(200,135,42,.05)' : 'rgba(200,135,42,.04)',
            }]}>
              <Text style={[s.decDot,   { color: mutedCl }]}>.</Text>
              <TextInput
                value={decimal}
                onChangeText={t => onDecimalChange?.(t.replace(/[^0-9]/g, '').slice(0, 1))}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="0"
                placeholderTextColor={isDark ? 'rgba(200,135,42,.25)' : 'rgba(160,104,32,.3)'}
                style={[s.decInput, { color: cream }]}
              />
              <Text style={[s.decUnit, { color: isDark ? 'rgba(200,135,42,.4)' : 'rgba(160,104,32,.45)' }]}>{unit}</Text>
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
            style={[s.nudgeBtn, {
              backgroundColor: isDark ? 'rgba(200,135,42,.08)' : 'rgba(200,135,42,.06)',
              borderColor:     isDark ? 'rgba(200,135,42,.2)'  : 'rgba(200,135,42,.22)',
            }]}
          >
            <Text style={[s.nudgeTxt, { color: accent }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:        { width: '100%' as any }                                                as ViewStyle,
  row:         { flexDirection: 'row' as const, gap: 16, alignItems: 'center' as const, marginBottom: SPACING.sm } as ViewStyle,
  rulerOuter:  { width: 110, height: RULER_H, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' as const, position: 'relative' as const, flexShrink: 0 } as ViewStyle,
  selBand:     { position: 'absolute' as const, left: 0, right: 0, height: ITEM_H, borderTopWidth: 1.5, borderBottomWidth: 1.5, zIndex: 1 } as ViewStyle,
  fade:        { position: 'absolute' as const, left: 0, right: 0, height: ITEM_H * 1.6, zIndex: 2, opacity: 0.9 } as ViewStyle,
  fadeTop:     { top: 0 }                                                              as ViewStyle,
  fadeBottom:  { bottom: 0 }                                                           as ViewStyle,
  display:     { flex: 1 }                                                             as ViewStyle,
  bigValRow:   { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 5, marginBottom: 4 } as ViewStyle,
  bigVal:      { fontFamily: FONTS.displayLight, fontSize: 58, fontWeight: '300' as const, lineHeight: 64, letterSpacing: -1.5 } as TextStyle,
  bigUnit:     { fontFamily: FONTS.bodyMedium, fontSize: 16, fontWeight: '500' as const } as TextStyle,
  hint:        { fontFamily: FONTS.bodyRegular, fontSize: 12, marginBottom: 10 }      as TextStyle,
  decimalWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' as const, gap: 2, marginTop: 6 } as ViewStyle,
  decDot:      { fontFamily: FONTS.displayLight, fontSize: 22, fontWeight: '300' as const } as TextStyle,
  decInput:    { fontFamily: FONTS.displayLight, fontSize: 22, fontWeight: '300' as const, minWidth: 18, padding: 0 } as TextStyle,
  decUnit:     { fontFamily: FONTS.bodyMedium, fontSize: 11, fontWeight: '500' as const, marginLeft: 2 } as TextStyle,
  nudgeRow:    { flexDirection: 'row' as const, gap: SPACING.sm }                     as ViewStyle,
  nudgeBtn:    { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const } as ViewStyle,
  nudgeTxt:    { fontFamily: FONTS.bodyMedium, fontSize: 22, fontWeight: '400' as const, lineHeight: 26 } as TextStyle,
});
