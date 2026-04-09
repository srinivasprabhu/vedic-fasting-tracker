import { fs } from '@/constants/theme';
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { X, Waves, Flame, Zap, Brain, Sparkles, Leaf } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZONE_ICON_MAP: Record<string, React.FC<any>> = {
  Waves, Flame, Zap, Brain, Sparkles, Leaf,
};

export interface MetabolicZoneInfo {
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

interface MetabolicZoneModalProps {
  visible: boolean;
  zone: MetabolicZoneInfo | null;
  onClose: () => void;
}

export default function MetabolicZoneModal({ visible, zone, onClose }: MetabolicZoneModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  if (!zone) return null;

  const timeRange = zone.endHour
    ? `${zone.startHour}–${zone.endHour}h`
    : `${zone.startHour}h+`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: zone.color + '20' }]}>
              {(() => { const Icon = ZONE_ICON_MAP[zone.icon]; return Icon ? <Icon size={24} color={zone.color} /> : null; })()}
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: colors.text }]}>{zone.name}</Text>
              <Text style={[styles.timeBadge, { color: zone.color }]}>{timeRange}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {zone.subtitle}
          </Text>

          <View style={[styles.accentLine, { backgroundColor: zone.color }]} />

          <Text style={[styles.description, { color: colors.text }]}>
            {zone.description}
          </Text>

          <View style={[styles.benefitBox, { borderLeftColor: zone.color }]}>
            <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
              {zone.benefit}
            </Text>
          </View>

          <Text style={[styles.tapHint, { color: colors.textMuted }]}>
            Tap outside or close to dismiss
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingBottom: 40,
      maxHeight: SCREEN_HEIGHT * 0.7,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderLight,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: fs(22),
      fontWeight: '700',
      marginBottom: 2,
    },
    timeBadge: {
      fontSize: fs(13),
      fontWeight: '600',
    },
    closeBtn: {
      padding: 4,
    },
    subtitle: {
      fontSize: fs(14),
      marginBottom: 16,
    },
    accentLine: {
      height: 3,
      borderRadius: 2,
      width: 48,
      marginBottom: 20,
    },
    description: {
      fontSize: fs(16),
      lineHeight: 24,
      marginBottom: 20,
    },
    benefitBox: {
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
    },
    benefitText: {
      fontSize: fs(15),
      lineHeight: 22,
      fontStyle: 'italic',
    },
    tapHint: {
      fontSize: fs(12),
      textAlign: 'center',
    },
  });
}
