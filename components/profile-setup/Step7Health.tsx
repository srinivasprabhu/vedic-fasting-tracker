// Step7Health — "Any health concerns?"
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ViewStyle, TextStyle,
} from 'react-native';
import { Heart, Check, Droplet, Sparkles, Flower2, Pill, HeartPulse, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, fs, lh } from '@/constants/theme';
import type { HealthConcern } from '@/types/user';

const OPTIONS: { id: HealthConcern; label: string; Icon: typeof Heart; color: string }[] = [
  { id: 'none',         label: 'None',                   Icon: Check,      color: '#7AAE79' },
  { id: 'diabetes',     label: 'Diabetes / Pre-diabetes', Icon: Droplet,    color: '#C25450' },
  { id: 'thyroid',      label: 'Thyroid condition',      Icon: Sparkles,   color: '#7B68AE' },
  { id: 'pcos',         label: 'PCOS',                   Icon: Flower2,    color: '#e07b30' },
  { id: 'hypertension', label: 'High blood pressure',    Icon: Heart,      color: '#C25450' },
  { id: 'cholesterol',  label: 'High cholesterol',       Icon: Pill,       color: '#5b8dd9' },
  { id: 'heart',        label: 'Heart condition',        Icon: HeartPulse, color: '#C25450' },
  { id: 'prefer_not',   label: 'Prefer not to say',      Icon: Lock,       color: '#7a6040' },
];

interface Props {
  value:    HealthConcern[];
  onChange: (v: HealthConcern[]) => void;
}

export const Step7Health: React.FC<Props> = ({ value, onChange }) => {
  const { isDark } = useTheme();
  const iconOpac  = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpac,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggle = (id: HealthConcern) => {
    if (id === 'none') { onChange(['none']); return; }
    const without = value.filter((v) => v !== 'none');
    if (without.includes(id)) {
      const next = without.filter((v) => v !== id);
      onChange(next.length === 0 ? ['none'] : next);
    } else {
      onChange([...without, id]);
    }
  };

  const cream    = isDark ? '#f0e0c0' : '#1e1004';
  const goldLt   = isDark ? '#e8a84c' : '#a06820';
  const mutedSub = isDark ? 'rgba(240,224,192,0.42)' : 'rgba(60,35,10,0.48)';

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.iconWrap, { opacity: iconOpac, transform: [{ scale: iconScale }], backgroundColor: '#C2545015', borderColor: isDark ? 'rgba(194,84,80,0.2)' : 'rgba(194,84,80,0.28)' }]}>
        <Heart size={20} color="#C25450" />
      </Animated.View>
      <Text style={[s.heading, { color: cream }]}>
        Any health{'\n'}<Text style={[s.accent, { color: goldLt }]}>concerns?</Text>
      </Text>
      <Text style={[s.sub, { color: mutedSub }]}>Helps keep your fasting safe · select all that apply</Text>

      <View style={s.grid}>
        {OPTIONS.map((opt) => {
          const sel = value.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => toggle(opt.id)}
              activeOpacity={0.8}
              style={[
                s.chip,
                {
                  backgroundColor: sel
                    ? isDark ? 'rgba(200,135,42,0.16)' : 'rgba(200,135,42,0.11)'
                    : isDark ? 'rgba(200,135,42,0.04)' : 'rgba(255,255,255,0.65)',
                  borderColor: sel
                    ? isDark ? 'rgba(200,135,42,0.58)' : 'rgba(200,135,42,0.52)'
                    : isDark ? 'rgba(200,135,42,0.14)' : 'rgba(200,135,42,0.2)',
                },
              ]}
            >
              <opt.Icon size={14} color={sel ? goldLt : opt.color} />
              <Text style={[s.chipLabel, { color: sel ? goldLt : isDark ? '#e8d5b0' : '#3a2010' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.privacyRow}>
        <Lock size={12} color={isDark ? 'rgba(240,224,192,0.22)' : 'rgba(60,35,10,0.28)'} />
        <Text style={[s.privacy, { color: isDark ? 'rgba(240,224,192,0.22)' : 'rgba(60,35,10,0.28)' }]}>
          Stored privately on your device only.
        </Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:       { flex: 1, paddingTop: SPACING.xl }                                                                                                                              as ViewStyle,
  iconWrap:   { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: SPACING.lg }         as ViewStyle,
  heading:    { fontFamily: FONTS.displayLight, fontSize: fs(38), lineHeight: lh(38), letterSpacing: 0.2, marginBottom: SPACING.xs }                                                  as TextStyle,
  accent:     { fontFamily: FONTS.displayItalic, fontSize: fs(38), lineHeight: lh(38) }                                                                                            as TextStyle,
  sub:        { fontFamily: FONTS.bodyRegular, fontSize: fs(13), lineHeight: lh(13, 1.35), marginBottom: SPACING.lg }                                                               as TextStyle,
  grid:       { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: SPACING.lg }                                                                  as ViewStyle,
  chip:       { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1.5 } as ViewStyle,
  chipLabel:  { fontFamily: FONTS.bodyMedium, fontSize: fs(11), fontWeight: '500' as const }                                                                                      as TextStyle,
  privacyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 }                                                                                         as ViewStyle,
  privacy:    { fontFamily: FONTS.bodyRegular, fontSize: fs(10), lineHeight: lh(10, 1.35) }                                                                                        as TextStyle,
});
