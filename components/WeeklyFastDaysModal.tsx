import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';
import {
  defaultWeeklyFastDays,
  formatWeeklyFastDaysShort,
  requiredWeeklyFastDayCount,
} from '@/utils/fastingPlanSchedule';
const DAY_ROWS: { js: number; label: string; short: string }[] = [
  { js: 0, label: 'Sunday', short: 'Sun' },
  { js: 1, label: 'Monday', short: 'Mon' },
  { js: 2, label: 'Tuesday', short: 'Tue' },
  { js: 3, label: 'Wednesday', short: 'Wed' },
  { js: 4, label: 'Thursday', short: 'Thu' },
  { js: 5, label: 'Friday', short: 'Fri' },
  { js: 6, label: 'Saturday', short: 'Sat' },
];

export interface WeeklyFastDaysModalProps {
  visible: boolean;
  planTemplateId: 'if_5_2' | 'if_4_3';
  initialDays?: number[] | null;
  onClose: () => void;
  onConfirm: (days: number[]) => void;
}

export const WeeklyFastDaysModal: React.FC<WeeklyFastDaysModalProps> = ({
  visible,
  planTemplateId,
  initialDays,
  onClose,
  onConfirm,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const required = requiredWeeklyFastDayCount(planTemplateId)!;

  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (!visible) return;
    const seed =
      initialDays && initialDays.length === required
        ? initialDays
        : defaultWeeklyFastDays(planTemplateId);
    setSelected(new Set(seed));
  }, [visible, planTemplateId, required, initialDays]);

  const toggle = useCallback((js: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(js)) next.delete(js);
      else if (next.size < required) next.add(js);
      return next;
    });
  }, [required]);

  const count = selected.size;
  const canSave = count === required;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm([...selected].sort((a, b) => a - b));
    onClose();
  }, [canSave, onClose, onConfirm, selected]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Fasting days</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <X size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Choose {required} days per week for your {planTemplateId === 'if_5_2' ? '5:2' : '4:3'} plan.
            Reminders follow these days.
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {DAY_ROWS.map(({ js, label, short }) => {
              const on = selected.has(js);
              return (
                <TouchableOpacity
                  key={js}
                  style={[
                    styles.dayRow,
                    {
                      backgroundColor: on
                        ? (isDark ? 'rgba(200,135,42,.2)' : 'rgba(200,135,42,.12)')
                        : colors.surface,
                      borderColor: on ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => toggle(js)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dayShort, { color: on ? colors.primary : colors.textMuted }]}>
                    {short}
                  </Text>
                  <Text style={[styles.dayLabel, { color: colors.text }]}>{label}</Text>
                  {on && (
                    <View style={[styles.check, { backgroundColor: colors.primary }]}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.countLine, { color: colors.textSecondary }]}>
            {count}/{required} selected
            {canSave ? ` · ${formatWeeklyFastDaysShort([...selected])}` : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? colors.primary : colors.border },
            ]}
            disabled={!canSave}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
    },
    sheet: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 20,
      maxHeight: '88%',
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    title: { fontSize: 20, fontWeight: '700' as const },
    sub: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
    list: { maxHeight: 360 },
    dayRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
      gap: 12,
    },
    dayShort: { width: 36, fontSize: 13, fontWeight: '700' as const },
    dayLabel: { flex: 1, fontSize: 16, fontWeight: '600' as const },
    check: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' as const },
    countLine: { fontSize: 13, marginTop: 8, marginBottom: 14, textAlign: 'center' as const },
    saveBtn: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center' as const,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  });
}
