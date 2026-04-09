import { fs } from '@/constants/theme';
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown, Waves, Flame, Zap, Brain, Sparkles, Leaf, Check } from 'lucide-react-native';
import type { ColorScheme } from '@/constants/colors';
import { METABOLIC_ZONE_PALETTE } from '@/constants/metabolicZones';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import MetabolicZoneModal from './MetabolicZoneModal';

interface MetabolicZone {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  benefit: string;
  startHour: number;
  endHour: number | null;
  color: string;
  icon: string;
}

export type MetabolicZoneRiverVariant = 'card' | 'embedded';

interface MetabolicZoneRiverProps {
  hoursElapsed: number;
  isActive: boolean;
  colors: ColorScheme;
  /** `embedded`: compact strip for inside the timer card (fasting only). `card`: full section below the fold. */
  variant?: MetabolicZoneRiverVariant;
}

type ZoneState = 'past' | 'active' | 'next' | 'future';

const ZONE_COLORS = METABOLIC_ZONE_PALETTE;

const ZONE_ICON_MAP: Record<string, React.FC<any>> = {
  Waves, Flame, Zap, Brain, Sparkles, Leaf,
};

const ZONES: MetabolicZone[] = [
  {
    id: 'anabolic',
    name: 'Anabolic',
    subtitle: 'Digesting food, insulin elevated',
    description: 'Your body is processing the last meal. Insulin is elevated, cells are in growth mode.',
    benefit: '"Rest and digest. Your body is at work absorbing nourishment — the foundation of every fast."',
    startHour: 0,
    endHour: 4,
    color: ZONE_COLORS.anabolic,
    icon: 'Waves',
  },
  {
    id: 'catabolic',
    name: 'Catabolic',
    subtitle: 'Glycogen depletion begins',
    description: 'Insulin drops and your body begins breaking down stored glycogen for fuel.',
    benefit: '"Your body is breaking down stored glycogen. Energy is shifting. The burn begins — stay the course."',
    startHour: 4,
    endHour: 12,
    color: ZONE_COLORS.catabolic,
    icon: 'Flame',
  },
  {
    id: 'fatBurning',
    name: 'Fat Burning',
    subtitle: 'Active fat oxidation',
    description: 'Your body switches to burning fat as the primary fuel source.',
    benefit: '"Fat cells are opening. Ancient energy reserves are now powering your every breath."',
    startHour: 12,
    endHour: 18,
    color: ZONE_COLORS.fatBurning,
    icon: 'Zap',
  },
  {
    id: 'ketosis',
    name: 'Ketosis',
    subtitle: 'Deep ketone production',
    description: 'The liver produces ketone bodies from fat. Your brain shifts to ketones.',
    benefit: '"The ancient state of the fasting sage. Your mind clears, sharpens, sees further."',
    startHour: 18,
    endHour: 24,
    color: ZONE_COLORS.ketosis,
    icon: 'Brain',
  },
  {
    id: 'autophagy',
    name: 'Autophagy',
    subtitle: 'Cellular cleansing peak',
    description: 'Your cells begin digesting damaged proteins — deep cellular renewal.',
    benefit: '"Shodhan — purification. Your cells are sweeping clean what no longer serves."',
    startHour: 24,
    endHour: 48,
    color: ZONE_COLORS.autophagy,
    icon: 'Sparkles',
  },
  {
    id: 'deepRenewal',
    name: 'Deep Renewal',
    subtitle: 'Stem cell regeneration',
    description: 'Extended fasting triggers stem cell production and immune system reset.',
    benefit: '"The body rebuilds itself from within — a rebirth that the ancients called tapas."',
    startHour: 48,
    endHour: null,
    color: ZONE_COLORS.deepRenewal,
    icon: 'Leaf',
  },
];

function getZoneState(zone: MetabolicZone, hoursElapsed: number): ZoneState {
  const end = zone.endHour ?? Infinity;
  if (hoursElapsed >= end) return 'past';
  if (hoursElapsed >= zone.startHour) return 'active';
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

const PulsingDot: React.FC<{ color: string; size?: number }> = ({ color, size = 20 }) => {
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.35, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity, reduceMotion]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute' as const,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
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

const RiverLiveBadge: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [opacity, reduceMotion]);

  return (
    <View style={riverStyles.liveBadge}>
      <Animated.View style={[riverStyles.liveDot, { opacity }]} />
      <Text style={riverStyles.liveText}>LIVE</Text>
    </View>
  );
};

const ProgressBar: React.FC<{
  progress: number;
  color: string;
  startLabel: string;
  endLabel: string;
  middleLabel: string;
  colors: ColorScheme;
}> = ({ progress, color, startLabel, endLabel, middleLabel, colors }) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  return (
    <View style={riverStyles.progressWrap}>
      <View style={[riverStyles.progressTrack, { backgroundColor: colors.borderLight }]}>
        <Animated.View
          style={[
            riverStyles.progressFill,
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
      <View style={riverStyles.progressLabels}>
        <Text style={[riverStyles.progressLabel, { color: colors.textMuted }]}>{startLabel}</Text>
        <Text style={[riverStyles.progressLabel, { color: colors.primary }]}>{middleLabel}</Text>
        <Text style={[riverStyles.progressLabel, { color: colors.textMuted }]}>{endLabel}</Text>
      </View>
    </View>
  );
};

const ZoneNode: React.FC<{
  zone: MetabolicZone;
  state: ZoneState;
  isLast: boolean;
  hoursElapsed: number;
  colors: ColorScheme;
  onPress?: () => void;
}> = ({ zone, state, isLast, hoursElapsed, colors, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const cardOpacity =
    state === 'past' ? 0.82 :
    state === 'future' ? 0.52 :
    state === 'next' ? 0.68 :
    1;

  const isActive = state === 'active';
  const isPast = state === 'past';

  const content = (
    <>
      <View style={riverStyles.zoneNodeCol}>
        <View
          style={[
            riverStyles.connectorLine,
            { backgroundColor: isPast ? zone.color : colors.borderLight },
            { opacity: isPast ? 0.5 : 0.2 },
          ]}
        />
        {isActive ? (
          <View style={[riverStyles.nodeCircle, { borderColor: zone.color, backgroundColor: colors.card }]}>
            <PulsingDot color={zone.color} size={20} />
          </View>
        ) : (
          <View style={[riverStyles.nodeCircle, { borderColor: zone.color, backgroundColor: colors.card, opacity: cardOpacity }]}>
            {isPast ? (
              <Check size={10} color={zone.color} strokeWidth={3} />
            ) : (
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: zone.color, opacity: 0.4 }} />
            )}
          </View>
        )}
        {!isLast && (
          <View
            style={[
              riverStyles.connectorLineBottom,
              { backgroundColor: zone.color, opacity: isPast ? 0.5 : 0.1 },
            ]}
          />
        )}
      </View>

      <View
        style={[
          riverStyles.zoneContent,
          isActive && {
            backgroundColor: `${zone.color}12`,
            borderColor: `${zone.color}40`,
            borderWidth: 1,
          },
        ]}
      >
        <View style={riverStyles.zoneHeader}>
          <View style={riverStyles.zoneNameRow}>
            <View style={[riverStyles.zoneIconCircle, { backgroundColor: `${zone.color}15` }]}>
              {(() => { const Icon = ZONE_ICON_MAP[zone.icon]; return Icon ? <Icon size={16} color={zone.color} /> : null; })()}
            </View>
            <Text style={[riverStyles.zoneName, { color: colors.text }, isActive && { color: zone.color }]}>
              {zone.name}
            </Text>
          </View>
          <View style={riverStyles.badgeRow}>
            {isActive && (
              <View style={[riverStyles.nowBadge, { backgroundColor: zone.color }]}>
                <Text style={riverStyles.nowBadgeText}>NOW</Text>
              </View>
            )}
            {state === 'next' && (
              <View style={[riverStyles.nextBadge, { borderColor: `${zone.color}50`, backgroundColor: `${zone.color}10` }]}>
                <Text style={[riverStyles.nextBadgeText, { color: zone.color }]}>NEXT</Text>
              </View>
            )}
            <Text style={[riverStyles.zoneTimeText, { color: colors.textSecondary }]}>
              {zone.endHour ? `${zone.startHour}–${zone.endHour}h` : `${zone.startHour}h+`}
            </Text>
            {isPast && <Check size={12} color={colors.success} strokeWidth={3} />}
          </View>
        </View>

        <Text style={[riverStyles.zoneSubtitle, { color: colors.textSecondary }]}>{zone.subtitle}</Text>

        {isActive && (
          <>
            <ProgressBar
              progress={getZoneProgress(zone, hoursElapsed)}
              color={zone.color}
              startLabel={`${zone.startHour}h`}
              endLabel={zone.endHour ? `${zone.endHour}h` : '∞'}
              middleLabel={`${formatHoursToNext(zone, hoursElapsed)} left`}
              colors={colors}
            />
            <View style={[riverStyles.benefitBox, { backgroundColor: `${zone.color}08`, borderLeftColor: zone.color }]}>
              <Text style={[riverStyles.benefitText, { color: colors.textSecondary }]}>{zone.benefit}</Text>
            </View>
          </>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          riverStyles.zoneRow,
          { opacity: Animated.multiply(fadeAnim, cardOpacity) as unknown as number, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {content}
      </Animated.View>
    </TouchableOpacity>
  );
};

const MetabolicZoneRiver: React.FC<MetabolicZoneRiverProps> = ({
  hoursElapsed,
  isActive,
  colors,
  variant = 'card',
}) => {
  const [selectedZone, setSelectedZone] = useState<MetabolicZone | null>(null);
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const activeZone = useMemo(
    () => ZONES.find((z) => hoursElapsed >= z.startHour && hoursElapsed < (z.endHour ?? Infinity)),
    [hoursElapsed]
  );

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  const toggleBreakdown = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBreakdownExpanded((v) => !v);
  }, []);

  if (variant === 'embedded') {
    if (!isActive || !activeZone) return null;
    const countdownLabel = formatHoursToNext(activeZone, hoursElapsed);

    return (
      <View style={embeddedStyles.wrap}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={toggleBreakdown}
          accessibilityRole="button"
          accessibilityLabel={`${activeZone.name}, ${activeZone.subtitle}. Tap to ${breakdownExpanded ? 'hide' : 'show'} fasting stages`}
          accessibilityState={{ expanded: breakdownExpanded }}
        >
          <View
            style={[
              embeddedStyles.strip,
              {
                borderColor: `${colors.primary}40`,
                backgroundColor: `${colors.primary}0D`,
              },
            ]}
          >
            <View style={embeddedStyles.stripLeft}>
              <View style={[embeddedStyles.stripDot, { backgroundColor: activeZone.color }]} />
              <Text style={[embeddedStyles.stripName, { color: activeZone.color }]} numberOfLines={1}>
                {activeZone.name}
              </Text>
              <Text style={[embeddedStyles.stripSep, { color: colors.textMuted }]}>·</Text>
              <Text
                style={[embeddedStyles.stripSub, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {activeZone.subtitle}
              </Text>
            </View>
            <View style={embeddedStyles.stripRight}>
              <Text style={[embeddedStyles.stripCountdown, { color: colors.text }]} numberOfLines={1}>
                {countdownLabel}
              </Text>
              <ChevronDown
                size={18}
                color={colors.textSecondary}
                style={{
                  transform: [{ rotate: breakdownExpanded ? '180deg' : '0deg' }],
                }}
              />
            </View>
          </View>
        </TouchableOpacity>

        {breakdownExpanded && (
          <ScrollView
            style={embeddedStyles.riverScroll}
            contentContainerStyle={embeddedStyles.riverScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {ZONES.map((zone, idx) => (
              <ZoneNode
                key={zone.id}
                zone={zone}
                state={getZoneState(zone, hoursElapsed)}
                isLast={idx === ZONES.length - 1}
                hoursElapsed={hoursElapsed}
                colors={colors}
                onPress={() => setSelectedZone(zone)}
              />
            ))}
          </ScrollView>
        )}

        <MetabolicZoneModal
          visible={selectedZone !== null}
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      </View>
    );
  }

  return (
    <View style={riverStyles.container}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={toggleBreakdown}
        accessibilityRole="button"
        accessibilityLabel="Metabolic journey"
        accessibilityHint={breakdownExpanded ? 'Collapse fasting stages' : 'Expand fasting stages'}
        accessibilityState={{ expanded: breakdownExpanded }}
      >
        <Animated.View style={[riverStyles.header, { opacity: headerOpacity }]}>
          <View style={riverStyles.headerTop}>
            <View style={riverStyles.headerTitleBlock}>
              <Text style={[riverStyles.headerTitle, { color: colors.text }]}>Metabolic Journey</Text>
              {isActive && (
                <Text style={[riverStyles.headerSub, { color: colors.textSecondary }]}>
                  {formatElapsed(hoursElapsed)} into your fast
                </Text>
              )}
              <Text style={[riverStyles.expandHint, { color: colors.textSecondary }]}>
                {breakdownExpanded ? 'Hide stages' : 'Tap to see fasting stages'}
              </Text>
            </View>
            <ChevronDown
              size={22}
              color={colors.textSecondary}
              style={{
                marginRight: 6,
                alignSelf: 'flex-start',
                marginTop: 2,
                transform: [{ rotate: breakdownExpanded ? '180deg' : '0deg' }],
              }}
            />
            {isActive ? (
              <RiverLiveBadge />
            ) : (
              <View style={[riverStyles.idleBadge, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}>
                <Text style={[riverStyles.idleText, { color: colors.textSecondary }]}>Not fasting</Text>
              </View>
            )}
          </View>

          {isActive && activeZone && (
            <View style={[riverStyles.activePill, { borderColor: `${activeZone.color}40`, backgroundColor: `${activeZone.color}08` }]}>
              <View style={[riverStyles.activePillDot, { backgroundColor: activeZone.color }]} />
              <Text style={[riverStyles.activePillText, { color: activeZone.color }]}>
                {activeZone.name}
              </Text>
              <Text style={[riverStyles.activePillSub, { color: colors.textSecondary }]}> · {activeZone.subtitle}</Text>
              {activeZone.endHour && (
                <Text style={[riverStyles.activePillSub, { color: colors.textSecondary }]}>
                  {' · '}{formatHoursToNext(activeZone, hoursElapsed)} to {ZONES[ZONES.indexOf(activeZone) + 1]?.name ?? 'completion'}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {breakdownExpanded && (
        <View style={riverStyles.river}>
          {ZONES.map((zone, idx) => (
            <ZoneNode
              key={zone.id}
              zone={zone}
              state={isActive ? getZoneState(zone, hoursElapsed) : 'future'}
              isLast={idx === ZONES.length - 1}
              hoursElapsed={hoursElapsed}
              colors={colors}
              onPress={() => setSelectedZone(zone)}
            />
          ))}
        </View>
      )}

      <MetabolicZoneModal
        visible={selectedZone !== null}
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
      />
    </View>
  );
};

const riverStyles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 24,
  } as ViewStyle,

  header: {
    marginBottom: 16,
  } as ViewStyle,

  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,

  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  } as ViewStyle,

  expandHint: {
    fontSize: fs(13),
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 18,
  } as TextStyle,

  headerTitle: {
    fontSize: fs(24),
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
    lineHeight: 30,
  } as TextStyle,

  headerSub: {
    fontSize: fs(14),
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 20,
  } as TextStyle,

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(58,170,110,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(58,170,110,0.35)',
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minHeight: 34,
  } as ViewStyle,

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3aaa6e',
  } as ViewStyle,

  liveText: {
    fontSize: fs(13),
    color: '#3aaa6e',
    fontWeight: '600',
    letterSpacing: 0.4,
  } as TextStyle,

  idleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 17,
    minHeight: 34,
    justifyContent: 'center',
  } as ViewStyle,

  idleText: {
    fontSize: fs(13),
    fontWeight: '700',
    letterSpacing: 0.5,
  } as TextStyle,

  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  } as ViewStyle,

  activePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  } as ViewStyle,

  activePillText: {
    fontSize: fs(15),
    fontWeight: '600',
  } as TextStyle,

  activePillSub: {
    fontSize: fs(13),
    lineHeight: 18,
  } as TextStyle,

  river: {
    position: 'relative',
  } as ViewStyle,

  zoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
    minHeight: 76,
  } as ViewStyle,

  zoneNodeCol: {
    width: 40,
    alignItems: 'center',
    flexShrink: 0,
  } as ViewStyle,

  connectorLine: {
    width: 2,
    height: 10,
    borderRadius: 1,
  } as ViewStyle,

  connectorLineBottom: {
    width: 2,
    flex: 1,
    minHeight: 10,
    borderRadius: 1,
  } as ViewStyle,

  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  zoneContent: {
    flex: 1,
    marginLeft: 6,
    marginBottom: 6,
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

  zoneIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  zoneName: {
    fontSize: fs(17),
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  nowBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,

  nowBadgeText: {
    fontSize: fs(10),
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  } as TextStyle,

  nextBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,

  nextBadgeText: {
    fontSize: fs(10),
    fontWeight: '600',
    letterSpacing: 0.3,
  } as TextStyle,

  zoneTimeText: {
    fontSize: fs(14),
    fontWeight: '500',
    lineHeight: 18,
  } as TextStyle,

  zoneSubtitle: {
    fontSize: fs(14),
    marginBottom: 2,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  progressWrap: {
    marginTop: 10,
    marginBottom: 4,
  } as ViewStyle,

  progressTrack: {
    height: 5,
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
    fontSize: fs(13),
    fontWeight: '500',
  } as TextStyle,

  benefitBox: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderRadius: 6,
  } as ViewStyle,

  benefitText: {
    fontSize: fs(14),
    lineHeight: 20,
    fontStyle: 'italic',
  } as TextStyle,
});

const embeddedStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 10,
    marginBottom: 0,
  } as ViewStyle,
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 10,
  } as ViewStyle,
  stripLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
  } as ViewStyle,
  stripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  } as ViewStyle,
  stripName: {
    fontSize: fs(15),
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
    minWidth: 56,
  } as TextStyle,
  stripSep: {
    fontSize: fs(13),
    fontWeight: '500',
    opacity: 0.85,
    flexShrink: 0,
  } as TextStyle,
  stripSub: {
    fontSize: fs(13),
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
    lineHeight: 18,
  } as TextStyle,
  stripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  } as ViewStyle,
  stripCountdown: {
    fontSize: fs(13),
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 0,
  } as TextStyle,
  riverScroll: {
    marginTop: 10,
    width: '100%',
    maxHeight: 300,
  } as ViewStyle,
  riverScrollContent: {
    paddingBottom: 4,
  } as ViewStyle,
});

export default MetabolicZoneRiver;
