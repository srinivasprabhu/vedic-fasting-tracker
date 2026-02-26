import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Platform,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface FastTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectNow: () => void;
  onSelectCustom: (timestamp: number) => void;
  title: string;
  maxDate?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function FastTimePickerModal({
  visible,
  onClose,
  onSelectNow,
  onSelectCustom,
  title,
  maxDate,
}: FastTimePickerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const dayCellSize = Math.min(Math.floor((screenWidth - 40 - 12) / 7), 44);
  const styles = useMemo(() => makeStyles(colors, dayCellSize), [colors, dayCellSize]);

  const now = new Date();
  const max = maxDate ?? now;

  const [step, setStep] = useState<'choice' | 'date' | 'time'>('choice');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(max));
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(max.getFullYear(), max.getMonth(), 1));
  const [selectedHour, setSelectedHour] = useState<number>(max.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(Math.floor(max.getMinutes() / 5) * 5);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      const d = maxDate ?? new Date();
      setStep('choice');
      setSelectedDate(new Date(d));
      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedHour(d.getHours());
      setSelectedMinute(Math.floor(d.getMinutes() / 5) * 5);
      slideAnim.setValue(800);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropAnim, slideAnim, maxDate]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 800, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [backdropAnim, slideAnim, onClose]);

  const handleNow = useCallback(() => {
    closeModal();
    setTimeout(() => onSelectNow(), 100);
  }, [closeModal, onSelectNow]);

  const handleCustom = useCallback(() => {
    setStep('date');
  }, []);

  const handleDateSelect = useCallback((day: number) => {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(d);
  }, [calendarMonth]);

  const handleDateConfirm = useCallback(() => {
    setStep('time');
  }, []);

  const handleTimeConfirm = useCallback(() => {
    const ts = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedHour,
      selectedMinute,
      0,
      0
    ).getTime();
    closeModal();
    setTimeout(() => onSelectCustom(ts), 100);
  }, [selectedDate, selectedHour, selectedMinute, closeModal, onSelectCustom]);

  const prevMonth = useCallback(() => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    if (next <= new Date(max.getFullYear(), max.getMonth() + 1, 0)) {
      setCalendarMonth(next);
    }
  }, [calendarMonth, max]);

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const today = new Date();

    const canGoNext = new Date(year, month + 1, 1) <= new Date(max.getFullYear(), max.getMonth() + 1, 0);

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(firstDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthArrow} activeOpacity={0.6}>
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonth(calendarMonth)}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
            activeOpacity={0.6}
            disabled={!canGoNext}
          >
            <ChevronRight size={20} color={canGoNext ? colors.text : colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDayRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.weekDayLabel}>{d}</Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === null) return <View key={di} style={styles.dayCell} />;
              const dateObj = new Date(year, month, day);
              const isAfterMax = dateObj > max;
              const isSelected = isSameDay(dateObj, selectedDate);
              const isToday = isSameDay(dateObj, today);

              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => !isAfterMax && handleDateSelect(day)}
                  disabled={isAfterMax}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isAfterMax && styles.dayTextDisabled,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderTimePicker = () => {
    const isToday = isSameDay(selectedDate, new Date());
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    return (
      <View style={styles.timePicker}>
        <Text style={styles.timePickerLabel}>
          {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeDisplayText}>
            {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
          </Text>
        </View>

        <Text style={styles.timeSectionLabel}>Hour</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll} contentContainerStyle={styles.timeScrollContent}>
          {HOURS.map(h => {
            const disabled = isToday && h > currentHour;
            return (
              <TouchableOpacity
                key={h}
                style={[
                  styles.timeChip,
                  selectedHour === h && styles.timeChipSelected,
                  disabled && styles.timeChipDisabled,
                ]}
                onPress={() => !disabled && setSelectedHour(h)}
                disabled={disabled}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.timeChipText,
                  selectedHour === h && styles.timeChipTextSelected,
                  disabled && styles.timeChipTextDisabled,
                ]}>
                  {h.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.timeSectionLabel}>Minute</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll} contentContainerStyle={styles.timeScrollContent}>
          {MINUTES.map(m => {
            const disabled = isToday && selectedHour === currentHour && m > currentMinute;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.timeChip,
                  selectedMinute === m && styles.timeChipSelected,
                  disabled && styles.timeChipDisabled,
                ]}
                onPress={() => !disabled && setSelectedMinute(m)}
                disabled={disabled}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.timeChipText,
                  selectedMinute === m && styles.timeChipTextSelected,
                  disabled && styles.timeChipTextDisabled,
                ]}>
                  {m.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeModal}>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn} activeOpacity={0.6}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === 'choice' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
              bounces={false}
            >
              <View style={styles.choiceContainer}>
                <TouchableOpacity style={styles.choiceCard} onPress={handleNow} activeOpacity={0.7}>
                  <View style={[styles.choiceIcon, { backgroundColor: colors.successLight }]}>
                    <Clock size={22} color={colors.success} />
                  </View>
                  <View style={styles.choiceTextWrap}>
                    <Text style={styles.choiceTitle}>Now</Text>
                    <Text style={styles.choiceDesc}>Use the current time</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.choiceCard} onPress={handleCustom} activeOpacity={0.7}>
                  <View style={[styles.choiceIcon, { backgroundColor: colors.primaryLight }]}>
                    <CalendarDays size={22} color={colors.primary} />
                  </View>
                  <View style={styles.choiceTextWrap}>
                    <Text style={styles.choiceTitle}>Custom Time</Text>
                    <Text style={styles.choiceDesc}>Pick a date & time in the past</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {step === 'date' && (
            <View style={styles.stepContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                style={styles.stepScroll}
              >
                {renderCalendar()}
              </ScrollView>
              <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleDateConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmBtnText}>Select Time →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'time' && (
            <View style={styles.stepContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                style={styles.stepScroll}
              >
                {renderTimePicker()}
              </ScrollView>
              <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
                <View style={styles.timeActions}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep('date')} activeOpacity={0.7}>
                    <Text style={styles.backBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleTimeConfirm} activeOpacity={0.7}>
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorScheme, dayCellSize: number) {
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end' as const,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      maxHeight: '85%' as any,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderLight,
      alignSelf: 'center' as const,
      marginTop: 10,
      marginBottom: 8,
    },
    sheetHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 12,
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.text,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    choiceContainer: {
      gap: 10,
      paddingBottom: 8,
    },
    choiceCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      gap: 14,
    },
    choiceIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    choiceTextWrap: {
      flex: 1,
    },
    choiceTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    choiceDesc: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    stepContainer: {
      flex: 1,
      flexShrink: 1,
      minHeight: 100,
    },
    stepScroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    bottomAction: {
      paddingTop: 8,
    },
    calendar: {
      marginBottom: 16,
    },
    calendarHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 14,
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
    monthArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    monthArrowDisabled: {
      opacity: 0.4,
    },
    weekDayRow: {
      flexDirection: 'row' as const,
      marginBottom: 6,
    },
    weekDayLabel: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textMuted,
    },
    weekRow: {
      flexDirection: 'row' as const,
    },
    dayCell: {
      flex: 1,
      height: dayCellSize,
      maxHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: dayCellSize / 2,
      margin: 1,
    },
    dayCellSelected: {
      backgroundColor: colors.primary,
    },
    dayCellToday: {
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    dayText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.text,
    },
    dayTextDisabled: {
      color: colors.textMuted,
      opacity: 0.4,
    },
    dayTextSelected: {
      color: colors.textLight,
      fontWeight: '700' as const,
    },
    dayTextToday: {
      color: colors.primary,
      fontWeight: '700' as const,
    },
    timePicker: {
      marginBottom: 16,
    },
    timePickerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 10,
      textAlign: 'center' as const,
    },
    timeDisplay: {
      alignSelf: 'center' as const,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 28,
      paddingVertical: 14,
      marginBottom: 20,
    },
    timeDisplayText: {
      fontSize: 36,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: 2,
    },
    timeSectionLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    timeScroll: {
      marginBottom: 16,
    },
    timeScrollContent: {
      gap: 6,
      paddingRight: 20,
    },
    timeChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
      minWidth: 46,
      alignItems: 'center' as const,
    },
    timeChipSelected: {
      backgroundColor: colors.primary,
    },
    timeChipDisabled: {
      opacity: 0.35,
    },
    timeChipText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    timeChipTextSelected: {
      color: colors.textLight,
    },
    timeChipTextDisabled: {
      color: colors.textMuted,
    },
    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center' as const,
      flex: 1,
      minHeight: 48,
      justifyContent: 'center' as const,
    },
    confirmBtnText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.textLight,
    },
    timeActions: {
      flexDirection: 'row' as const,
      gap: 10,
    },
    backBtn: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center' as const,
    },
    backBtnText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
  });
}
