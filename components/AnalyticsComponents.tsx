import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BarData, MilestoneData, MetabolicZone, formatHours } from '@/utils/analytics-helpers';
import type { ColorScheme } from '@/constants/colors';

export function AnimatedBar({ item, index }: { item: BarData; index: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: item.maxValue > 0 ? item.value / item.maxValue : 0,
      duration: 800,
      delay: index * 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [item.value, item.maxValue, index, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{item.label}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width }]} />
      </View>
      <Text style={styles.barValue}>{formatHours(item.value)}</Text>
    </View>
  );
}

export function MetabolicZoneCard({ zone, isActive, index }: { zone: MetabolicZone; isActive: boolean; index: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, index]);

  return (
    <Animated.View
      style={[
        styles.zoneItem,
        isActive && { backgroundColor: zone.color + '15', borderColor: zone.color + '40' },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.zoneDot, { backgroundColor: zone.color }, isActive && styles.zoneDotActive]} />
      <View style={styles.zoneTextWrap}>
        <View style={styles.zoneHeaderRow}>
          <Text style={[styles.zoneName, isActive && { color: zone.color, fontWeight: '700' as const }]}>{zone.name}</Text>
          <Text style={styles.zoneRange}>{zone.range}</Text>
        </View>
        <Text style={styles.zoneDesc}>{zone.description}</Text>
      </View>
      {isActive && (
        <View style={[styles.zoneActiveBadge, { backgroundColor: zone.color }]}>
          <Text style={styles.zoneActiveText}>NOW</Text>
        </View>
      )}
    </Animated.View>
  );
}

export function ScoreGauge({
  value,
  maxValue,
  label,
  color,
  suffix,
  icon,
}: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  suffix?: string;
  icon: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: Math.min(value / maxValue, 1),
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, maxValue, animVal]);

  const widthAnim = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.gaugeCard}>
      <View style={styles.gaugeHeader}>
        <View style={[styles.gaugeIconWrap, { backgroundColor: color + '18' }]}>
          {icon}
        </View>
        <View style={styles.gaugeTextWrap}>
          <Text style={styles.gaugeLabel}>{label}</Text>
          <Text style={[styles.gaugeValue, { color }]}>
            {Math.round(value)}{suffix ?? ''}
          </Text>
        </View>
      </View>
      <View style={styles.gaugeTrack}>
        <Animated.View style={[styles.gaugeFill, { width: widthAnim, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ImpactCard({
  icon,
  value,
  label,
  sublabel,
  color,
  index,
  knowledgeId,
  onInfoPress,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  color: string;
  index: number;
  knowledgeId?: string;
  onInfoPress?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 120,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, index]);

  const cardContent = (
    <Animated.View style={[styles.impactCard, { transform: [{ scale: scaleAnim }] }]}>
      {knowledgeId && (
        <View style={styles.infoHint}>
          <Info size={13} color={colors.textMuted} />
        </View>
      )}
      <View style={[styles.impactIconWrap, { backgroundColor: color + '18' }]}>
        {icon}
      </View>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
      <Text style={styles.impactSublabel}>{sublabel}</Text>
    </Animated.View>
  );

  if (knowledgeId && onInfoPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onInfoPress(knowledgeId)}
        style={styles.impactCardTouchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

export function MilestoneRow({ milestone, index }: { milestone: MilestoneData; index: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: Math.min(milestone.progress / milestone.target, 1),
      duration: 900,
      delay: index * 80 + 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [slideAnim, opacityAnim, progressAnim, milestone.progress, milestone.target, index]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.milestoneRow,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View
        style={[
          styles.milestoneIcon,
          { backgroundColor: milestone.unlocked ? milestone.color + '20' : colors.surface },
        ]}
      >
        {milestone.icon}
      </View>
      <View style={styles.milestoneContent}>
        <View style={styles.milestoneHeader}>
          <Text style={[styles.milestoneTitle, !milestone.unlocked && styles.milestoneLocked]}>
            {milestone.title}
          </Text>
          {milestone.unlocked && (
            <View style={[styles.unlockedBadge, { backgroundColor: milestone.color + '20' }]}>
              <Text style={[styles.unlockedText, { color: milestone.color }]}>Unlocked</Text>
            </View>
          )}
        </View>
        <Text style={styles.milestoneDesc}>{milestone.description}</Text>
        <View style={styles.milestoneProgressTrack}>
          <Animated.View
            style={[
              styles.milestoneProgressFill,
              { width: progressWidth, backgroundColor: milestone.unlocked ? milestone.color : colors.textMuted },
            ]}
          />
        </View>
        <Text style={styles.milestoneProgressText}>
          {Math.min(milestone.progress, milestone.target)} / {milestone.target}
        </Text>
      </View>
    </Animated.View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    barRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    barLabel: {
      width: 32,
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surface,
      marginHorizontal: 8,
      overflow: 'hidden' as const,
    },
    barFill: {
      height: '100%' as any,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    barValue: {
      width: 36,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right' as const,
      fontWeight: '500' as const,
    },
    zoneItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 10,
      borderRadius: 10,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    zoneDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    zoneDotActive: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    zoneTextWrap: {
      flex: 1,
    },
    zoneHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    zoneName: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.text,
    },
    zoneRange: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    zoneDesc: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    zoneActiveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginLeft: 8,
    },
    zoneActiveText: {
      fontSize: 9,
      fontWeight: '800' as const,
      color: '#fff',
      letterSpacing: 0.5,
    },
    gaugeCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    gaugeHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      marginBottom: 10,
    },
    gaugeIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    gaugeTextWrap: {
      flex: 1,
    },
    gaugeLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500' as const,
    },
    gaugeValue: {
      fontSize: 18,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    gaugeTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
    },
    gaugeFill: {
      height: '100%' as any,
      borderRadius: 3,
    },
    impactCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flexGrow: 1,
      alignItems: 'center' as const,
    },
    impactCardTouchable: {
      flexGrow: 1,
      flexBasis: '45%' as any,
    },
    impactIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 8,
    },
    impactValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    impactLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center' as const,
    },
    impactSublabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center' as const,
    },
    infoHint: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      opacity: 0.5,
    },
    milestoneRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    milestoneIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    },
    milestoneContent: {
      flex: 1,
    },
    milestoneHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    milestoneTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    milestoneLocked: {
      color: colors.textMuted,
    },
    milestoneDesc: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
      marginBottom: 6,
    },
    milestoneProgressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
    },
    milestoneProgressFill: {
      height: '100%' as any,
      borderRadius: 2,
    },
    milestoneProgressText: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 3,
      textAlign: 'right' as const,
    },
    unlockedBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    unlockedText: {
      fontSize: 10,
      fontWeight: '600' as const,
    },
  });
}
