import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { X, BookOpen, FlaskConical, Sparkles, ListChecks, FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { MetricKnowledge } from '@/mocks/metric-knowledge';
import type { ColorScheme } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MetricKnowledgeModalProps {
  visible: boolean;
  metric: MetricKnowledge | null;
  onClose: () => void;
}

function SectionBlock({
  icon,
  title,
  color,
  children,
  index,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
  index: number;
  colors: ColorScheme;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 150 + index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: 150 + index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.sectionBlock,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function MetricKnowledgeModal({ visible, metric, onClose }: MetricKnowledgeModalProps) {
  const { colors, isDark } = useTheme();
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

  if (!metric) return null;

  const vedicBg = isDark ? '#2A1E3A' : '#F8F0FF';
  const vedicText = isDark ? '#C8B4E8' : '#5A4A7A';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
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
            <View style={[styles.headerEmojiWrap, { backgroundColor: metric.color + '18' }]}>
              <Text style={styles.headerEmoji}>{metric.emoji}</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{metric.title}</Text>
              <Text style={[styles.headerBadge, { color: metric.color }]}>Learn More</Text>
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

          <Text style={styles.shortDesc}>{metric.shortDesc}</Text>

          <View style={[styles.accentLine, { backgroundColor: metric.color }]} />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <SectionBlock
              icon={<FlaskConical size={16} color={metric.color} />}
              title="The Science"
              color={metric.color}
              index={0}
              colors={colors}
            >
              <Text style={styles.bodyText}>{metric.science}</Text>
            </SectionBlock>

            <SectionBlock
              icon={<BookOpen size={16} color={metric.color} />}
              title="How Fasting Helps"
              color={metric.color}
              index={1}
              colors={colors}
            >
              <Text style={styles.bodyText}>{metric.howFastingHelps}</Text>
            </SectionBlock>

            {metric.vedicPerspective && (
              <SectionBlock
                icon={<Sparkles size={16} color="#7B68AE" />}
                title="Vedic Perspective"
                color="#7B68AE"
                index={2}
                colors={colors}
              >
                <View style={[styles.vedicCard, { backgroundColor: vedicBg }]}>
                  <Text style={[styles.vedicText, { color: vedicText }]}>{metric.vedicPerspective}</Text>
                </View>
              </SectionBlock>
            )}

            <SectionBlock
              icon={<ListChecks size={16} color={metric.color} />}
              title="Key Facts"
              color={metric.color}
              index={3}
              colors={colors}
            >
              {metric.keyFacts.map((fact, i) => (
                <View key={i} style={styles.factRow}>
                  <View style={[styles.factBullet, { backgroundColor: metric.color }]} />
                  <Text style={styles.factText}>{fact}</Text>
                </View>
              ))}
            </SectionBlock>

            {metric.sources.length > 0 && (
              <SectionBlock
                icon={<FileText size={16} color={colors.textMuted} />}
                title="Sources"
                color={colors.textMuted}
                index={4}
                colors={colors}
              >
                {metric.sources.map((source, i) => (
                  <Text key={i} style={styles.sourceText}>{source}</Text>
                ))}
              </SectionBlock>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end' as const,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: SCREEN_HEIGHT * 0.80,
      paddingHorizontal: 22,
      paddingTop: 10,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderLight,
      alignSelf: 'center' as const,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
      marginBottom: 12,
    },
    headerEmojiWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    headerEmoji: {
      fontSize: 26,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.3,
    },
    headerBadge: {
      fontSize: 12,
      fontWeight: '600' as const,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    shortDesc: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 14,
    },
    accentLine: {
      height: 3,
      borderRadius: 2,
      marginBottom: 6,
    },
    scrollArea: {
      flex: 1,
      flexGrow: 1,
    },
    scrollContent: {
      paddingTop: 12,
      paddingBottom: 20,
    },
    sectionBlock: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      marginBottom: 10,
    },
    sectionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.2,
    },
    bodyText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    vedicCard: {
      borderRadius: 12,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: '#7B68AE',
    },
    vedicText: {
      fontSize: 14,
      lineHeight: 22,
      fontStyle: 'italic' as const,
    },
    factRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 10,
      marginBottom: 8,
    },
    factBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 7,
    },
    factText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    sourceText: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 4,
      fontStyle: 'italic' as const,
    },
  });
}
