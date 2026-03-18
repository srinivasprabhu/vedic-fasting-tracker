// components/ScoreBreakdownModal.tsx
// Full-screen modal showing detailed Metabolic Discipline Score breakdown.

import React, { useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing, ViewStyle, TextStyle,
} from 'react-native';
import { X, Clock, TrendingUp, Moon, Zap, Sparkles, Heart, Lock } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import {
  MetabolicScoreBreakdown,
  getScoreLevel,
  getScoreColor,
} from '@/utils/metabolic-score';
import type { ColorScheme } from '@/constants/colors';

// ─── Mini score ring ──────────────────────────────────────────────────────────

const MiniRing: React.FC<{ score: number; color: string; colors: ColorScheme }> = ({ score, color, colors }) => {
  const SIZE = 64;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMF = 2 * Math.PI * R;
  const fill = CIRCUMF * (score / 100);

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={colors.surface} strokeWidth={STROKE} />
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke={color} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${CIRCUMF}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[{ fontSize: 20, fontWeight: '800', color, letterSpacing: -0.5 }]}>{score}</Text>
        <Text style={[{ fontSize: 9, color: colors.textMuted, marginTop: -1 }]}>/100</Text>
      </View>
    </View>
  );
};

// ─── Score component row ──────────────────────────────────────────────────────

const ScoreComponentRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  grade: string;
  pct: number;
  insight: string;
  color: string;
  colors: ColorScheme;
  isPro?: boolean;
}> = ({ icon, title, subtitle, grade, pct, insight, color, colors, isPro }) => {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: Math.min(pct / 100, 1),
      duration: 800,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={[rowS.container, { borderBottomColor: colors.borderLight }]}>
      <View style={rowS.header}>
        <View style={[rowS.iconWrap, { backgroundColor: `${color}18` }]}>{icon}</View>
        <View style={rowS.titleBlock}>
          <Text style={[rowS.title, { color: colors.text }]}>{title}</Text>
          <Text style={[rowS.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        {isPro ? (
          <View style={rowS.proBadge}>
            <Text style={rowS.proText}>PRO</Text>
          </View>
        ) : (
          <View style={rowS.gradeBlock}>
            <Text style={[rowS.grade, { color }]}>{grade}</Text>
            <Text style={[rowS.gradePct, { color: colors.textMuted }]}>{pct}/100</Text>
          </View>
        )}
      </View>

      {!isPro && (
        <View style={[rowS.barTrack, { backgroundColor: colors.surface }]}>
          <Animated.View style={[
            rowS.barFill,
            { backgroundColor: color, width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]} />
        </View>
      )}

      <Text style={[rowS.insight, { color: isPro ? colors.textMuted : colors.textSecondary }]}>
        {isPro ? `Unlock Pro to ${insight.toLowerCase()}` : insight}
      </Text>
    </View>
  );
};

const rowS = StyleSheet.create({
  container: { paddingVertical: 16, borderBottomWidth: 1 } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } as ViewStyle,
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 } as ViewStyle,
  titleBlock: { flex: 1 } as ViewStyle,
  title: { fontSize: 15, fontWeight: '700' } as TextStyle,
  subtitle: { fontSize: 12, marginTop: 1 } as TextStyle,
  gradeBlock: { alignItems: 'flex-end' } as ViewStyle,
  grade: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 } as TextStyle,
  gradePct: { fontSize: 11, fontWeight: '500', marginTop: 1 } as TextStyle,
  proBadge: { backgroundColor: 'rgba(232,168,76,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 } as ViewStyle,
  proText: { fontSize: 10, fontWeight: '800', color: '#e8a84c', letterSpacing: 0.8 } as TextStyle,
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 } as ViewStyle,
  barFill: { height: '100%' as any, borderRadius: 3 } as ViewStyle,
  insight: { fontSize: 12, lineHeight: 17 } as TextStyle,
});

// ─── Main modal ───────────────────────────────────────────────────────────────

interface ScoreBreakdownModalProps {
  visible: boolean;
  score: MetabolicScoreBreakdown;
  onClose: () => void;
}

export default function ScoreBreakdownModal({ visible, score, onClose }: ScoreBreakdownModalProps) {
  const { colors, isDark } = useTheme();
  const level = getScoreLevel(score.total);
  const scoreColor = getScoreColor(level, isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>
        {/* Handle bar */}
        <View style={[s.handle, { backgroundColor: colors.borderLight }]} />

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Score Breakdown</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.surface }]}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={s.heroRow}>
            <MiniRing score={score.total} color={scoreColor} colors={colors} />
            <View style={s.heroMeta}>
              <Text style={[s.heroLabel, { color: colors.text }]}>{score.label}</Text>
              {score.vsLastWeek !== 0 && (
                <Text style={[s.heroChange, { color: score.vsLastWeek > 0 ? colors.success : colors.error }]}>
                  {score.vsLastWeek > 0 ? '▲' : '▼'} {Math.abs(score.vsLastWeek)} points vs last week
                </Text>
              )}
            </View>
          </View>

          {/* Score components */}
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>SCORE COMPONENTS</Text>

          <ScoreComponentRow
            icon={<Clock size={16} color="#e8a84c" />}
            title="Fasting Duration"
            subtitle={`Avg fast length vs your ${score.targetHours}h goal`}
            grade={score.durationGrade}
            pct={score.durationPct}
            insight={score.durationInsight}
            color="#e8a84c"
            colors={colors}
          />

          <ScoreComponentRow
            icon={<TrendingUp size={16} color="#5B8C5A" />}
            title="Consistency"
            subtitle="Days hitting your fasting target"
            grade={score.consistencyGrade}
            pct={score.consistencyPct}
            insight={score.consistencyInsight}
            color="#5B8C5A"
            colors={colors}
          />

          <ScoreComponentRow
            icon={<Moon size={16} color="#7B68AE" />}
            title="Circadian Alignment"
            subtitle="Overnight fasting overlap"
            grade={score.circadianGrade}
            pct={score.circadianPct}
            insight={score.circadianInsight}
            color="#7B68AE"
            colors={colors}
          />

          <ScoreComponentRow
            icon={<Zap size={16} color="#E8913A" />}
            title="Deep Fast Quality"
            subtitle="16h+ fasts and metabolic depth"
            grade={score.deepFastGrade}
            pct={score.deepFastPct}
            insight={score.deepFastInsight}
            color="#E8913A"
            colors={colors}
          />

          {/* Pro-locked components */}
          <ScoreComponentRow
            icon={<Sparkles size={16} color="#7B68AE" />}
            title="Autophagy Activation"
            subtitle="Cellular renewal depth score"
            grade=""
            pct={0}
            insight="See your autophagy score and cellular renewal time."
            color="#7B68AE"
            colors={colors}
            isPro
          />

          <ScoreComponentRow
            icon={<Heart size={16} color="#C25450" />}
            title="Inflammation Index"
            subtitle="Trend-based inflammation score"
            grade=""
            pct={0}
            insight="Track your 30-day inflammation reduction trend."
            color="#C25450"
            colors={colors}
            isPro
          />

          {/* How it's calculated */}
          <View style={[s.howCard, { backgroundColor: colors.surfaceWarm, borderColor: colors.primaryLight }]}>
            <Text style={[s.howTitle, { color: colors.primary }]}>HOW THIS SCORE IS CALCULATED</Text>
            <Text style={[s.howText, { color: colors.textSecondary }]}>
              Your score combines fasting duration, consistency, circadian timing, and depth — weighted by what the research says matters most for metabolic health. It updates after every completed fast.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 } as ViewStyle,
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0 } as ViewStyle,
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 } as TextStyle,
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 } as ViewStyle,
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 20 } as ViewStyle,
  heroMeta: { flex: 1 } as ViewStyle,
  heroLabel: { fontSize: 18, fontWeight: '700', marginBottom: 4 } as TextStyle,
  heroChange: { fontSize: 13, fontWeight: '600' } as TextStyle,
  sectionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4, marginTop: 8 } as TextStyle,
  howCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 20 } as ViewStyle,
  howTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 } as TextStyle,
  howText: { fontSize: 13, lineHeight: 19 } as TextStyle,
});
