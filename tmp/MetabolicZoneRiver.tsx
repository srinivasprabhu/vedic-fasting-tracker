import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetabolicZone {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  benefit: string;
  startHour: number;
  endHour: number | null; // null = open-ended
  color: string;
  icon: string;
}

interface MetabolicZoneRiverProps {
  /** Hours elapsed since fast started */
  hoursElapsed: number;
  /** Callback when user taps a zone */
  onZonePress?: (zone: MetabolicZone) => void;
}

type ZoneState = 'past' | 'active' | 'next' | 'future';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  bg:        '#0e0905',
  card:      '#1a1108',
  cardAlt:   '#221608',
  gold:      '#c8872a',
  goldLight: '#e8a84c',
  goldPale:  '#f5d48a',
  cream:     '#f0e0c0',
  muted:     '#7a6040',
  text:      '#e8d5b0',

  // Zone colors
  anabolic:    '#5b8dd9',
  catabolic:   '#d4a017',
  fatBurning:  '#e07b30',
  ketosis:     '#c05050',
  autophagy:   '#8b6bbf',
  deepRenewal: '#3aaa6e',
} as const;

const ZONES: MetabolicZone[] = [
  {
    id: 'anabolic',
    name: 'Anabolic',
    subtitle: 'Digesting food, insulin elevated',
    description:
      'Your body is processing the last meal. Insulin is elevated, cells are in growth mode, and energy from food is being absorbed.',
    benefit:
      '"Rest and digest. Your body is at work absorbing nourishment — the foundation of every fast."',
    startHour: 0,
    endHour: 4,
    color: COLORS.anabolic,
    icon: '🌊',
  },
  {
    id: 'catabolic',
    name: 'Catabolic',
    subtitle: 'Glycogen depletion begins',
    description:
      'Insulin drops and your body begins breaking down stored glycogen in the liver for fuel. The metabolic shift has begun.',
    benefit:
      '"Your body is breaking down stored glycogen. Energy is shifting. The burn begins — stay the course."',
    startHour: 4,
    endHour: 12,
    color: COLORS.catabolic,
    icon: '🔥',
  },
  {
    id: 'fatBurning',
    name: 'Fat Burning',
    subtitle: 'Active fat oxidation',
    description:
      'Glycogen stores are nearly depleted. Your body switches to burning fat as the primary fuel source. This is where body composition changes.',
    benefit:
      '"Fat cells are opening. Ancient energy reserves, untouched for years, are now powering your every breath."',
    startHour: 12,
    endHour: 18,
    color: COLORS.fatBurning,
    icon: '⚡',
  },
  {
    id: 'ketosis',
    name: 'Ketosis',
    subtitle: 'Deep ketone production',
    description:
      'The liver produces ketone bodies from fat. Your brain shifts from glucose to ketones — many report profound mental clarity.',
    benefit:
      '"The ancient state of the fasting sage. Your mind clears, sharpens, sees further. The Vedic rishis knew this depth."',
    startHour: 18,
    endHour: 24,
    color: COLORS.ketosis,
    icon: '🧠',
  },
  {
    id: 'autophagy',
    name: 'Autophagy',
    subtitle: 'Cellular cleansing peak',
    description:
      'Your cells begin digesting damaged proteins and organelles — a Nobel Prize-winning process of deep cellular renewal.',
    benefit:
      '"Shodhan — purification. Your cells are sweeping clean what no longer serves. Renewal at the level of life itself."',
    startHour: 24,
    endHour: 48,
    color: COLORS.autophagy,
    icon: '✨',
  },
  {
    id: 'deepRenewal',
    name: 'Deep Renewal',
    subtitle: 'Stem cell regeneration',
    description:
      'Extended fasting triggers stem cell production. Immune system resets. This is the territory of the ancient Vedic fast.',
    benefit:
      '"You have entered the sacred fast. The body rebuilds itself from within — a rebirth that the ancients called tapas."',
    startHour: 48,
    endHour: null,
    color: COLORS.deepRenewal,
    icon: '🌱',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getZoneState(zone: MetabolicZone, hoursElapsed: number): ZoneState {
  const end = zone.endHour ?? Infinity;
  if (hoursElapsed >= end) return 'past';
  if (hoursElapsed >= zone.startHour) return 'active';

  // Is it the very next zone?
  const activeZone = ZONES.find(
    (z) => hoursElapsed >= z.startHour && hoursElapsed < (z.endHour ?? Infinity)
  );
  if (activeZone) {
    const activeIdx = ZONES.indexOf(activeZone);
    const thisIdx = ZONES.indexOf(zone);
    if (thisIdx === activeIdx + 1) return 'next';
  }
  return 'future';
}

function getZoneProgress(zone: MetabolicZone, hoursElapsed: number): number {
  const duration = (zone.endHour ?? zone.startHour + 24) - zone.startHour;
  const elapsed = hoursElapsed - zone.startHour;
  return Math.min(Math.max(elapsed / duration, 0), 1);
}

function formatHoursToNext(zone: MetabolicZone, hoursElapsed: number): string {
  if (!zone.endHour) return '∞';
  const remaining = zone.endHour - hoursElapsed;
  if (remaining <= 0) return '0m';
  const h = Math.floor(remaining);
  const m = Math.round((remaining - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatElapsed(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface PulsingDotProps {
  color: string;
  size?: number;
}

const PulsingDot: React.FC<PulsingDotProps> = ({ color, size = 20 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.35,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
      {/* Inner dot */}
      <View
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: (size * 0.45) / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

interface LiveBadgeProps {}

const LiveBadge: React.FC<LiveBadgeProps> = () => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
};

interface ProgressBarProps {
  progress: number; // 0–1
  color: string;
  startLabel: string;
  endLabel: string;
  middleLabel: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  startLabel,
  endLabel,
  middleLabel,
}) => {
  const width = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [progress]);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{startLabel}</Text>
        <Text style={[styles.progressLabel, { color: COLORS.goldLight }]}>{middleLabel}</Text>
        <Text style={styles.progressLabel}>{endLabel}</Text>
      </View>
    </View>
  );
};

interface ZoneNodeProps {
  zone: MetabolicZone;
  state: ZoneState;
  isLast: boolean;
}

const ZoneNode: React.FC<ZoneNodeProps> = ({ zone, state, isLast }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cardOpacity =
    state === 'past' ? 0.35 :
    state === 'future' ? 0.2 :
    state === 'next' ? 0.55 :
    1;

  const isActive = state === 'active';
  const isPast = state === 'past';

  return (
    <Animated.View
      style={[
        styles.zoneRow,
        { opacity: Animated.multiply(fadeAnim, cardOpacity) as any, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Left: spine + node */}
      <View style={styles.zoneNodeCol}>
        {/* Connector line above (except first) */}
        <View
          style={[
            styles.connectorLine,
            { backgroundColor: isPast ? zone.color : COLORS.card },
            { opacity: isPast ? 0.5 : 0.15 },
          ]}
        />

        {/* Node circle */}
        {isActive ? (
          <View style={[styles.nodeCircle, { borderColor: zone.color }]}>
            <PulsingDot color={zone.color} size={20} />
          </View>
        ) : (
          <View style={[styles.nodeCircle, { borderColor: zone.color, opacity: cardOpacity }]}>
            {isPast ? (
              <Text style={{ fontSize: 10, color: zone.color }}>✓</Text>
            ) : (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: zone.color,
                  opacity: 0.4,
                }}
              />
            )}
          </View>
        )}

        {/* Connector line below (except last) */}
        {!isLast && (
          <View
            style={[
              styles.connectorLineBottom,
              {
                backgroundColor: zone.color,
                opacity: isPast ? 0.5 : 0.1,
              },
            ]}
          />
        )}
      </View>

      {/* Right: content */}
      <View
        style={[
          styles.zoneContent,
          isActive && {
            backgroundColor: `${zone.color}12`,
            borderColor: `${zone.color}40`,
            borderWidth: 1,
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.zoneHeader}>
          <View style={styles.zoneNameRow}>
            <Text style={styles.zoneIcon}>{zone.icon}</Text>
            <Text
              style={[
                styles.zoneName,
                isActive && { color: zone.color },
              ]}
            >
              {zone.name}
            </Text>
          </View>

          <View style={styles.badgeRow}>
            {isActive && (
              <View style={styles.nowBadge}>
                <Text style={styles.nowBadgeText}>NOW</Text>
              </View>
            )}
            {state === 'next' && (
              <View style={[styles.nextBadge, { borderColor: `${zone.color}50` }]}>
                <Text style={[styles.nextBadgeText, { color: zone.color }]}>NEXT</Text>
              </View>
            )}
            <Text style={styles.zoneTimeText}>
              {zone.endHour ? `${zone.startHour}–${zone.endHour}h` : `${zone.startHour}h+`}
              {isPast ? ' ✓' : ''}
            </Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.zoneSubtitle}>{zone.subtitle}</Text>

        {/* Active zone extras */}
        {isActive && (
          <>
            <ProgressBar
              progress={getZoneProgress(zone, /* injected via parent */ 9.5)}
              color={zone.color}
              startLabel={`${zone.startHour}h`}
              endLabel={zone.endHour ? `${zone.endHour}h` : '∞'}
              middleLabel={`${formatHoursToNext(zone, 9.5)} left`}
            />
            <View style={styles.benefitBox}>
              <Text style={styles.benefitText}>{zone.benefit}</Text>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const MetabolicZoneRiver: React.FC<MetabolicZoneRiverProps> = ({
  hoursElapsed,
  onZonePress,
}) => {
  const activeZone = ZONES.find(
    (z) => hoursElapsed >= z.startHour && hoursElapsed < (z.endHour ?? Infinity)
  );

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Your Journey</Text>
            <Text style={styles.headerSub}>
              {formatElapsed(hoursElapsed)} into your fast
            </Text>
          </View>
          <LiveBadge />
        </View>

        {/* Active zone summary pill */}
        {activeZone && (
          <View style={[styles.activePill, { borderColor: `${activeZone.color}40` }]}>
            <View style={[styles.activePillDot, { backgroundColor: activeZone.color }]} />
            <Text style={[styles.activePillText, { color: activeZone.color }]}>
              {activeZone.name}
            </Text>
            <Text style={styles.activePillSub}> · {activeZone.subtitle}</Text>
            <Text style={styles.activePillSub}>
              {' · '}
              {activeZone.endHour
                ? `${formatHoursToNext(activeZone, hoursElapsed)} to ${
                    ZONES[ZONES.indexOf(activeZone) + 1]?.name ?? 'completion'
                  }`
                : 'Peak state'}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* River */}
      <View style={styles.river}>
        {ZONES.map((zone, idx) => (
          <ZoneNode
            key={zone.id}
            zone={zone}
            state={getZoneState(zone, hoursElapsed)}
            isLast={idx === ZONES.length - 1}
          />
        ))}
      </View>

      {/* Footer encouragement */}
      {activeZone && (
        <View style={styles.footer}>
          <Text style={styles.footerQuote}>
            "The body achieves what the mind believes."
          </Text>
          <Text style={styles.footerSub}>— Ancient Vedic Wisdom</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  } as ViewStyle,

  // Header
  header: {
    marginBottom: 28,
  } as ViewStyle,

  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,

  headerTitle: {
    fontFamily: 'Cormorant-Light', // map to Cormorant Garamond in your font setup
    fontSize: 26,
    color: COLORS.cream,
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,

  headerSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 0.3,
  } as TextStyle,

  // Live badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(58,170,110,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(58,170,110,0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  } as ViewStyle,

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3aaa6e',
  } as ViewStyle,

  liveText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    color: '#3aaa6e',
    letterSpacing: 0.15,
  } as TextStyle,

  // Active pill
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  } as ViewStyle,

  activePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  } as ViewStyle,

  activePillText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,

  activePillSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,

  // River
  river: {
    position: 'relative',
  } as ViewStyle,

  // Zone row
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 2,
  } as ViewStyle,

  // Node column (spine)
  zoneNodeCol: {
    width: 44,
    alignItems: 'center',
    flexShrink: 0,
  } as ViewStyle,

  connectorLine: {
    width: 2,
    height: 12,
    borderRadius: 1,
  } as ViewStyle,

  connectorLineBottom: {
    width: 2,
    flex: 1,
    minHeight: 12,
    borderRadius: 1,
  } as ViewStyle,

  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Zone content
  zoneContent: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  } as ViewStyle,

  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  } as ViewStyle,

  zoneNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  zoneIcon: {
    fontSize: 14,
  } as TextStyle,

  zoneName: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: COLORS.cream,
    fontWeight: '500',
  } as TextStyle,

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  nowBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,

  nowBadgeText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    color: '#1a0f00',
    fontWeight: '700',
    letterSpacing: 0.15,
  } as TextStyle,

  nextBadge: {
    backgroundColor: 'rgba(200,135,42,0.1)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,

  nextBadgeText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.12,
  } as TextStyle,

  zoneTimeText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: COLORS.muted,
  } as TextStyle,

  zoneSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  } as TextStyle,

  // Progress bar
  progressWrap: {
    marginTop: 10,
    marginBottom: 4,
  } as ViewStyle,

  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  } as ViewStyle,

  progressFill: {
    height: '100%',
    borderRadius: 4,
  } as ViewStyle,

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  } as ViewStyle,

  progressLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: COLORS.muted,
  } as TextStyle,

  // Benefit quote box
  benefitBox: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(200,135,42,0.05)',
    borderLeftWidth: 2,
    borderLeftColor: COLORS.gold,
    borderRadius: 6,
  } as ViewStyle,

  benefitText: {
    fontFamily: 'Cormorant-Italic', // Cormorant Garamond Italic
    fontSize: 13,
    color: COLORS.goldPale,
    lineHeight: 20,
    fontStyle: 'italic',
  } as TextStyle,

  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 20,
  } as ViewStyle,

  footerQuote: {
    fontFamily: 'Cormorant-LightItalic',
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  } as TextStyle,

  footerSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: `${COLORS.muted}80`,
    marginTop: 4,
    letterSpacing: 0.15,
  } as TextStyle,
});

// ─── Usage Example ────────────────────────────────────────────────────────────

/**
 * Example usage in your screen:
 *
 * import MetabolicZoneRiver from './MetabolicZoneRiver';
 *
 * export default function AnalyticsScreen() {
 *   const [hoursElapsed, setHoursElapsed] = useState(9.5);
 *
 *   // In real app: calculate from fast start timestamp
 *   // const hoursElapsed = (Date.now() - fastStartTime) / 3_600_000;
 *
 *   return (
 *     <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0905' }}>
 *       <MetabolicZoneRiver
 *         hoursElapsed={hoursElapsed}
 *         onZonePress={(zone) => console.log('Tapped:', zone.name)}
 *       />
 *     </SafeAreaView>
 *   );
 * }
 *
 * ─── Font setup (app.json with expo-font or react-native-fonts) ───────────────
 *
 * Install: npx expo install expo-font @expo-google-fonts/cormorant-garamond @expo-google-fonts/dm-sans
 *
 * In _layout.tsx or App.tsx:
 * import { useFonts } from 'expo-font';
 * import {
 *   CormorantGaramond_300Light,
 *   CormorantGaramond_300Light_Italic,
 *   CormorantGaramond_600SemiBold,
 * } from '@expo-google-fonts/cormorant-garamond';
 * import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
 *
 * const [fontsLoaded] = useFonts({
 *   'Cormorant-Light': CormorantGaramond_300Light,
 *   'Cormorant-Italic': CormorantGaramond_300Light_Italic,
 *   'Cormorant-LightItalic': CormorantGaramond_300Light_Italic,
 *   'DMSans-Regular': DMSans_400Regular,
 *   'DMSans-Medium': DMSans_500Medium,
 * });
 */

export default MetabolicZoneRiver;
export type { MetabolicZone, MetabolicZoneRiverProps };
