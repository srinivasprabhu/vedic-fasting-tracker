import { fs } from '@/constants/theme';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { UPCOMING_VEDIC_DAYS, FAST_TYPE_COLORS } from '@/mocks/vedic-data';
import { VedicFastDay } from '@/types/fasting';
import type { ColorScheme } from '@/constants/colors';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function VedicCalendarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<VedicFastDay | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const monthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fastDayMap = new Map<string, VedicFastDay>();
  UPCOMING_VEDIC_DAYS.forEach(day => {
    fastDayMap.set(day.date, day);
  });

  const bumpMonthAnim = useCallback(() => {
    Animated.sequence([
      Animated.timing(monthAnim, { toValue: 0.85, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(monthAnim, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
  }, [monthAnim]);

  const prevMonth = useCallback(() => {
    bumpMonthAnim();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }, [currentMonth, bumpMonthAnim]);

  const nextMonth = useCallback(() => {
    bumpMonthAnim();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }, [currentMonth, bumpMonthAnim]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const handleDayPress = useCallback((day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const fastDay = fastDayMap.get(dateStr);
    if (fastDay) {
      setSelectedDay(fastDay);
      setModalVisible(true);
    }
  }, [currentYear, currentMonth, fastDayMap]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Text style={styles.screenTitle}>Vedic Calendar</Text>
          <Text style={styles.screenSubtitle}>Auspicious fasting days</Text>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Animated.Text style={[styles.monthText, { opacity: monthAnim }]}>
              {MONTHS[currentMonth]} {currentYear}
            </Animated.Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(day => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          <Animated.View style={[styles.calendarGrid, { opacity: monthAnim }]}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const fastDay = fastDayMap.get(dateStr);
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                  ]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={fastDay ? 0.6 : 1}
                >
                  <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                  ]}>
                    {day}
                  </Text>
                  {fastDay && (
                    <View
                      style={[
                        styles.fastDot,
                        { backgroundColor: FAST_TYPE_COLORS[fastDay.type] || colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.eventsTitle}>Upcoming Fasts</Text>
            {UPCOMING_VEDIC_DAYS.filter((day) => day.date >= todayStr).slice(0, 8).map((day) => (
              <TouchableOpacity
                key={day.id}
                style={styles.eventCard}
                onPress={() => {
                  setSelectedDay(day);
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: FAST_TYPE_COLORS[day.type] || colors.primary },
                  ]}
                />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{day.name}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(day.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })} · {day.deity}
                  </Text>
                </View>
                <Star size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            <View style={{ height: 32 }} />
          </ScrollView>
        </Animated.View>

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {selectedDay && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{selectedDay.name}</Text>
                  <Text style={styles.modalDeity}>Dedicated to {selectedDay.deity}</Text>
                  <Text style={styles.modalDate}>
                    {new Date(selectedDay.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>

                  <Text style={styles.modalSectionTitle}>Significance</Text>
                  <Text style={styles.modalText}>{selectedDay.significance}</Text>

                  <Text style={styles.modalSectionTitle}>Benefits</Text>
                  {selectedDay.benefits.map((benefit, i) => (
                    <View key={i} style={styles.modalBullet}>
                      <Text style={styles.modalBulletDot}>•</Text>
                      <Text style={styles.modalBulletText}>{benefit}</Text>
                    </View>
                  ))}

                  <Text style={styles.modalSectionTitle}>Rules & Guidelines</Text>
                  {selectedDay.rules.map((rule, i) => (
                    <View key={i} style={styles.modalBullet}>
                      <Text style={styles.modalBulletNum}>{i + 1}.</Text>
                      <Text style={styles.modalBulletText}>{rule}</Text>
                    </View>
                  ))}
                  <View style={{ height: 24 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    screenTitle: {
      fontSize: fs(28),
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: fs(14),
      color: colors.textSecondary,
      marginBottom: 20,
      marginTop: 2,
    },
    monthNav: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 16,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    monthText: {
      fontSize: fs(17),
      fontWeight: '600' as const,
      color: colors.text,
    },
    weekdayRow: {
      flexDirection: 'row' as const,
      marginBottom: 8,
    },
    weekdayText: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: fs(12),
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    calendarGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginBottom: 20,
    },
    dayCell: {
      width: '14.28%' as any,
      aspectRatio: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    todayCell: {
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
    },
    dayText: {
      fontSize: fs(14),
      color: colors.text,
      fontWeight: '400' as const,
    },
    todayText: {
      fontWeight: '700' as const,
      color: colors.primary,
    },
    fastDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      marginTop: 2,
    },
    eventsList: {
      flex: 1,
    },
    eventsTitle: {
      fontSize: fs(16),
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    eventCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    eventDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 12,
    },
    eventInfo: {
      flex: 1,
    },
    eventName: {
      fontSize: fs(15),
      fontWeight: '600' as const,
      color: colors.text,
    },
    eventDate: {
      fontSize: fs(12),
      color: colors.textSecondary,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end' as const,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '80%' as any,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center' as const,
      marginBottom: 16,
    },
    modalClose: {
      position: 'absolute' as const,
      top: 20,
      right: 20,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 1,
    },
    modalTitle: {
      fontSize: fs(22),
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 4,
    },
    modalDeity: {
      fontSize: fs(14),
      color: colors.primary,
      fontWeight: '500' as const,
      marginBottom: 4,
    },
    modalDate: {
      fontSize: fs(13),
      color: colors.textSecondary,
      marginBottom: 20,
    },
    modalSectionTitle: {
      fontSize: fs(15),
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    modalText: {
      fontSize: fs(14),
      color: colors.textSecondary,
      lineHeight: 20,
    },
    modalBullet: {
      flexDirection: 'row' as const,
      marginBottom: 6,
      paddingRight: 16,
    },
    modalBulletDot: {
      fontSize: fs(14),
      color: colors.primary,
      marginRight: 8,
      lineHeight: 20,
    },
    modalBulletNum: {
      fontSize: fs(13),
      color: colors.primary,
      marginRight: 8,
      fontWeight: '600' as const,
      lineHeight: 20,
      minWidth: 18,
    },
    modalBulletText: {
      flex: 1,
      fontSize: fs(14),
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}
