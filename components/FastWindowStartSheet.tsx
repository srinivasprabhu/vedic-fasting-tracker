import { fs } from '@/constants/theme';
import type { ColorScheme } from '@/constants/colors';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS = ['AM', 'PM'] as const;

function minutesTo12h(totalMinutes: number): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  const m = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: Math.round(min / 5) * 5, period };
}

function to24hMinutes(hour12: number, minute: number, period: 'AM' | 'PM'): number {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  return h24 * 60 + minute;
}

// ─── Scroll wheel column ──────────────────────────────────────────────────────

interface WheelColumnProps<T> {
  data: T[];
  selected: T;
  onChange: (val: T) => void;
  format?: (val: T) => string;
  colors: ColorScheme;
  width: number;
}

function WheelColumn<T extends string | number>({
  data,
  selected,
  onChange,
  format,
  colors,
  width,
}: WheelColumnProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const selectedIdx = data.indexOf(selected);
  const scrollLock = useRef(false);

  useEffect(() => {
    if (selectedIdx >= 0 && listRef.current && !scrollLock.current) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: selectedIdx * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [selectedIdx]);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollLock.current = false;
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      if (data[clamped] !== selected) {
        Haptics.selectionAsync();
        onChange(data[clamped]);
      }
    },
    [data, selected, onChange],
  );

  const handleScrollBegin = useCallback(() => {
    scrollLock.current = true;
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    [],
  );

  const pad = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const isSelected = index === selectedIdx;
      return (
        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', width }}>
          <Text
            style={{
              fontSize: fs(isSelected ? 22 : 18),
              fontWeight: isSelected ? '700' : '400',
              color: isSelected ? colors.text : colors.textMuted,
              opacity: isSelected ? 1 : 0.45,
            }}
          >
            {format ? format(item) : String(item)}
          </Text>
        </View>
      );
    },
    [selectedIdx, colors, format, width],
  );

  return (
    <View style={{ width, height: PICKER_HEIGHT }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: pad }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollBeginDrag={handleScrollBegin}
        initialScrollIndex={selectedIdx >= 0 ? selectedIdx : 0}
      />
      {/* highlight band */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: pad,
          left: 4,
          right: 4,
          height: ITEM_HEIGHT,
          borderRadius: 10,
          backgroundColor: `${colors.primary}12`,
        }}
      />
    </View>
  );
}

// ─── Panel (no Modal) ─────────────────────────────────────────────────────────

export interface FastWindowStartPickerPanelProps {
  colors: ColorScheme;
  isDark: boolean;
  initialMinutes: number;
  onDismiss: () => void;
  onConfirm: (minutesFromMidnight: number) => void;
}

export function FastWindowStartPickerPanel({
  colors,
  isDark: _isDark,
  initialMinutes,
  onDismiss,
  onConfirm,
}: FastWindowStartPickerPanelProps) {
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeSheetStyles(colors), [colors]);
  const init = useMemo(() => minutesTo12h(initialMinutes), [initialMinutes]);
  const [hour, setHour] = useState(init.hour12);
  const [minute, setMinute] = useState(init.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(init.period);

  useEffect(() => {
    const v = minutesTo12h(initialMinutes);
    setHour(v.hour12);
    setMinute(v.minute);
    setPeriod(v.period);
  }, [initialMinutes]);

  const handleSave = useCallback(() => {
    const m = to24hMinutes(hour, minute, period);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(m);
    onDismiss();
  }, [hour, minute, period, onConfirm, onDismiss]);

  return (
    <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.card }]}>
      <Text style={s.title}>When does your fast start?</Text>
      <Text style={s.sub}>
        This is when you usually finish your last meal. End time follows your plan length.
      </Text>
      <View style={s.wheelRow}>
        <WheelColumn
          data={HOURS_12}
          selected={hour}
          onChange={setHour}
          format={(v) => String(v)}
          colors={colors}
          width={72}
        />
        <Text style={[s.colonSep, { color: colors.text }]}>:</Text>
        <WheelColumn
          data={MINUTES_5}
          selected={minute}
          onChange={setMinute}
          format={(v) => String(v).padStart(2, '0')}
          colors={colors}
          width={72}
        />
        <WheelColumn
          data={[...PERIODS]}
          selected={period}
          onChange={(v) => setPeriod(v as 'AM' | 'PM')}
          colors={colors}
          width={60}
        />
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={[s.btnGhost, { borderColor: colors.borderLight }]} onPress={onDismiss} activeOpacity={0.75}>
          <Text style={[s.btnGhostText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.85}>
          <Text style={[s.btnPrimaryText, { color: '#fff' }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Standalone sheet (Settings) ──────────────────────────────────────────────

export interface FastWindowStartSheetProps {
  visible: boolean;
  colors: ColorScheme;
  initialMinutes: number;
  onClose: () => void;
  onConfirm: (minutesFromMidnight: number) => void;
}

export function FastWindowStartSheet({
  visible,
  colors,
  initialMinutes,
  onClose,
  onConfirm,
}: FastWindowStartSheetProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} presentationStyle="overFullScreen">
      <View style={stylesStandalone.root}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Dismiss" />
        <FastWindowStartPickerPanel
          colors={colors}
          isDark={false}
          initialMinutes={initialMinutes}
          onDismiss={onClose}
          onConfirm={onConfirm}
        />
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stylesStandalone = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  } as ViewStyle,
});

function makeSheetStyles(colors: ColorScheme) {
  return StyleSheet.create({
    sheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
    } as ViewStyle,
    title: {
      fontSize: fs(18),
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    } as TextStyle,
    sub: {
      fontSize: fs(13),
      fontWeight: '500',
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 12,
    } as TextStyle,
    wheelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    } as ViewStyle,
    colonSep: {
      fontSize: fs(24),
      fontWeight: '700',
      marginHorizontal: 2,
    } as TextStyle,
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    } as ViewStyle,
    btnGhost: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    btnGhostText: { fontSize: fs(16), fontWeight: '600' } as TextStyle,
    btnPrimary: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    btnPrimaryText: { fontSize: fs(16), fontWeight: '600' } as TextStyle,
  });
}
