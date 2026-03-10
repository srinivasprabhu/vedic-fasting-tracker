import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { BookOpen, X, ChevronRight, Zap, FlaskConical, Leaf } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import {
  FAST_TYPES,
  INTERMITTENT_FAST_TYPES,
  FAST_TYPE_COLORS,
  AUTOPHAGY_STAGES,
  AUTOPHAGY_BENEFITS,
  IF_GUIDE_TIPS,
} from '@/mocks/vedic-data';
import { FastTypeInfo } from '@/types/fasting';
import type { AutophagyStage } from '@/mocks/vedic-data';

type TabKey = 'vedic' | 'intermittent' | 'autophagy' | 'fasting';

const ALL_TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'autophagy', label: 'Autophagy', icon: '🧬' },
  { key: 'intermittent', label: 'IF Methods', icon: '⏱️' },
  { key: 'fasting', label: 'Food', icon: '🍃' },
  { key: 'vedic', label: 'Vedic', icon: '🕉️' },
];

export default function KnowledgeScreen() {
  const { colors } = useTheme();
  const { profile } = useUserProfile();
  const showVedic = profile?.fastingPath === 'vedic' || profile?.fastingPath === 'both';
  const TABS = useMemo(
    () => (showVedic ? ALL_TABS : ALL_TABS.filter(t => t.key !== 'vedic')),
    [showVedic]
  );
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<TabKey>('autophagy');

  useEffect(() => {
    if (!showVedic && activeTab === 'vedic') {
      setActiveTab('autophagy');
    }
  }, [showVedic, activeTab]);

  const [selectedFast, setSelectedFast] = useState<FastTypeInfo | null>(null);
  const [selectedStage, setSelectedStage] = useState<AutophagyStage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  const tabWidth = tabBarWidth > 0 ? (tabBarWidth - 12) / TABS.length : 0;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const switchTab = useCallback((tab: TabKey) => {
    const tabIndex = TABS.findIndex(t => t.key === tab);
    const targetX = tabIndex * tabWidth;

    Animated.spring(tabIndicator, {
      toValue: targetX,
      useNativeDriver: false,
      tension: 70,
      friction: 10,
    }).start();

    Animated.sequence([
      Animated.timing(contentFade, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTab(tab);
  }, [tabIndicator, contentFade, tabWidth]);

  const openDetail = useCallback((fast: FastTypeInfo) => {
    setSelectedFast(fast);
    setModalVisible(true);
  }, []);

  const openStageDetail = useCallback((stage: AutophagyStage) => {
    setSelectedStage(stage);
    setStageModalVisible(true);
  }, []);

  const renderFastCard = useCallback((fast: FastTypeInfo, index: number) => {
    return (
      <FastCard key={fast.type} fast={fast} index={index} onPress={openDetail} colors={colors} />
    );
  }, [openDetail, colors]);

  const renderVedicTab = () => (
    <>
      <View style={styles.introCard}>
        <BookOpen size={20} color={colors.primary} />
        <Text style={styles.introText}>
          Vedic fasting (Upvas/Vrat) is a sacred practice rooted in thousands of years of Indian spiritual tradition. Each fast is dedicated to a specific deity and carries unique spiritual and health benefits.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Types of Vedic Fasts</Text>

      {FAST_TYPES.map((fast, index) => renderFastCard(fast, index))}

      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>General Guidelines</Text>
        <View style={styles.guideCard}>
          {[
            { emoji: '🌅', title: 'Sankalp', text: 'Begin every fast with a clear intention (Sankalp). State your purpose and dedication before sunrise.' },
            { emoji: '🧘', title: 'Meditation', text: 'Combine fasting with meditation and prayer for maximum spiritual benefit.' },
            { emoji: '🍃', title: 'Satvic Diet', text: 'When eating during fasts, choose pure, satvic foods — fruits, milk, nuts, and specific grains.' },
            { emoji: '🙏', title: 'Parana', text: 'Break your fast (Parana) at the prescribed time with gratitude and a small offering.' },
            { emoji: '💧', title: 'Hydration', text: 'Unless observing Nirjala, stay hydrated with water, coconut water, or herbal teas.' },
            { emoji: '🕉️', title: 'Mantra', text: 'Chanting the appropriate mantra during your fast amplifies its spiritual potency.' },
          ].map((item, i) => (
            <View key={i} style={styles.guideItem}>
              <Text style={styles.guideEmoji}>{item.emoji}</Text>
              <View style={styles.guideText}>
                <Text style={styles.guideTitle}>{item.title}</Text>
                <Text style={styles.guideDesc}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderIntermittentTab = () => (
    <>
      <View style={styles.introCard}>
        <Zap size={20} color="#2E86AB" />
        <Text style={styles.introText}>
          Intermittent fasting (IF) is a time-restricted eating pattern backed by modern science. It aligns beautifully with Vedic fasting principles — both honor the body's natural rhythms of nourishment and rest.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Fasting Protocols</Text>

      {INTERMITTENT_FAST_TYPES.map((fast, index) => renderFastCard(fast, index))}

      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>Getting Started with IF</Text>
        <View style={styles.guideCard}>
          {IF_GUIDE_TIPS.map((item, i) => (
            <View key={i} style={styles.guideItem}>
              <Text style={styles.guideEmoji}>{item.emoji}</Text>
              <View style={styles.guideText}>
                <Text style={styles.guideTitle}>{item.title}</Text>
                <Text style={styles.guideDesc}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {showVedic && (
        <View style={styles.guideSection}>
          <Text style={styles.sectionTitle}>Vedic + IF Synergy</Text>
          <View style={styles.synergyCard}>
            <Text style={styles.synergyEmoji}>🕉️ + ⏱️</Text>
            <Text style={styles.synergyTitle}>Ancient Wisdom Meets Modern Science</Text>
            <Text style={styles.synergyText}>
              Vedic sages practiced time-restricted eating millennia before science validated it. Ekadashi fasts align with 24-hour protocols. Somvar Vrat mirrors 16:8 fasting. The spiritual discipline of Vedic fasting combined with the metabolic science of IF creates a holistic approach to health and self-mastery.
            </Text>
          </View>
        </View>
      )}
    </>
  );

  const renderAutophagyTab = () => (
    <>
      <View style={[styles.introCard, { borderColor: '#8B6DB520' }]}>
        <FlaskConical size={20} color="#8B6DB5" />
        <Text style={styles.introText}>
          Autophagy (from Greek: "self-eating") is your body's cellular recycling system. Discovered by Yoshinori Ohsumi (2016 Nobel Prize), it's activated during fasting and is the key mechanism behind fasting's profound health benefits.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Fasting Timeline</Text>
      <Text style={styles.sectionSubtitle}>What happens to your body hour by hour</Text>

      <View style={styles.timelineContainer}>
        {AUTOPHAGY_STAGES.map((stage, index) => (
          <TouchableOpacity
            key={stage.hour}
            style={styles.timelineItem}
            onPress={() => openStageDetail(stage)}
            activeOpacity={0.7}
            testID={`autophagy-stage-${stage.hour}`}
          >
            <View style={styles.timelineLine}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: getStageColor(stage.hour) },
              ]} />
              {index < AUTOPHAGY_STAGES.length - 1 && (
                <View style={[styles.timelineConnector, { backgroundColor: getStageColor(stage.hour) + '30' }]} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineIcon}>{stage.icon}</Text>
                <View style={styles.timelineInfo}>
                  <View style={styles.timelineTopRow}>
                    <Text style={[styles.timelineHour, { color: getStageColor(stage.hour) }]}>
                      {stage.hour}h
                    </Text>
                    <Text style={styles.timelineTitle}>{stage.title}</Text>
                  </View>
                  <Text style={styles.timelineDesc} numberOfLines={2}>{stage.description}</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>Benefits of Autophagy</Text>
        <Text style={styles.sectionSubtitle}>Why your cells need this deep clean</Text>

        {AUTOPHAGY_BENEFITS.map((benefit, index) => (
          <View key={index} style={styles.autophagyBenefitCard}>
            <View style={styles.benefitCardHeader}>
              <View style={[styles.benefitIconCircle, { backgroundColor: benefit.color + '15' }]}>
                <Text style={styles.benefitCardIcon}>{benefit.icon}</Text>
              </View>
              <Text style={[styles.benefitCardTitle, { color: benefit.color }]}>{benefit.title}</Text>
            </View>
            <Text style={styles.benefitCardDesc}>{benefit.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>The Science</Text>
        <View style={styles.scienceCard}>
          <View style={styles.scienceItem}>
            <Text style={styles.scienceEmoji}>🏆</Text>
            <View style={styles.scienceTextWrap}>
              <Text style={styles.scienceTitle}>Nobel Prize 2016</Text>
              <Text style={styles.scienceDesc}>Yoshinori Ohsumi won the Nobel Prize in Physiology for discovering the mechanisms of autophagy, validating what Vedic traditions practiced for millennia.</Text>
            </View>
          </View>
          <View style={styles.scienceDivider} />
          <View style={styles.scienceItem}>
            <Text style={styles.scienceEmoji}>🔬</Text>
            <View style={styles.scienceTextWrap}>
              <Text style={styles.scienceTitle}>mTOR Pathway</Text>
              <Text style={styles.scienceDesc}>Fasting inhibits the mTOR pathway (growth signaling), which activates autophagy. This is the cellular switch between "growth mode" and "repair mode."</Text>
            </View>
          </View>
          <View style={styles.scienceDivider} />
          <View style={styles.scienceItem}>
            <Text style={styles.scienceEmoji}>⚡</Text>
            <View style={styles.scienceTextWrap}>
              <Text style={styles.scienceTitle}>AMPK Activation</Text>
              <Text style={styles.scienceDesc}>Low energy during fasting activates AMPK, a master energy sensor that triggers autophagy and improves mitochondrial function.</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  const FASTING_FRIENDLY_ITEMS = [
    {
      emoji: '💧',
      title: 'Water',
      desc: 'Plain still or sparkling water. Zero calories, no insulin response. Essential for hydration and electrolyte balance.',
      science: 'No metabolic impact.',
    },
    {
      emoji: '☕',
      title: 'Black Coffee',
      desc: 'No sugar, cream, or milk. Coffee alone has ~2–5 calories per cup and does not trigger insulin or break autophagy.',
      science: 'Studies show caffeine may enhance fat oxidation and ketone production during fasting.',
    },
    {
      emoji: '🍵',
      title: 'Plain Tea',
      desc: 'Green, black, white, or herbal tea — no milk, honey, or sugar. Zero calories.',
      science: 'Green tea catechins may support autophagy; polyphenols have no metabolic impact.',
    },
    {
      emoji: '🧂',
      title: 'Salt',
      desc: 'A pinch of salt in water helps maintain electrolytes. Especially useful during longer fasts.',
      science: 'Sodium has no calories; prevents hyponatremia.',
    },
    {
      emoji: '🫧',
      title: 'Sparkling Water',
      desc: 'Unflavored or naturally flavored (no sweeteners). Same as still water.',
      science: 'No calories; no insulin response.',
    },
    {
      emoji: '⚡',
      title: 'Electrolytes (No Sugar)',
      desc: 'Sodium, potassium, magnesium in water — without sweeteners or calories.',
      science: 'Replenishes minerals lost during fasting; no metabolic impact.',
    },
  ];

  const BREAKS_FAST_ITEMS = [
    { emoji: '🥛', label: 'Milk, cream, butter' },
    { emoji: '🍯', label: 'Honey, sugar, syrup' },
    { emoji: '🥤', label: 'Juice, soda, sweetened drinks' },
    { emoji: '🍲', label: 'Bone broth, soup' },
    { emoji: '🥜', label: 'Nuts, seeds, coconut oil' },
    { emoji: '🍋', label: 'Lemon juice (if > 1 tbsp)' },
  ];

  const renderFastingFriendlyTab = () => (
    <>
      <View style={[styles.introCard, { borderColor: '#1B7A6E30' }]}>
        <Leaf size={20} color="#1B7A6E" />
        <Text style={styles.introText}>
          During a fast, anything with calories triggers a metabolic response. The items below are scientifically accepted as not breaking a fast — they have negligible or zero calories and do not trigger insulin.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Safe During Fast</Text>
      <Text style={styles.sectionSubtitle}>Zero or negligible calories</Text>

      {FASTING_FRIENDLY_ITEMS.map((item, i) => (
        <View key={i} style={[styles.guideCard, { marginBottom: 10 }]}>
          <View style={styles.guideItem}>
            <Text style={styles.guideEmoji}>{item.emoji}</Text>
            <View style={styles.guideText}>
              <Text style={styles.guideTitle}>{item.title}</Text>
              <Text style={styles.guideDesc}>{item.desc}</Text>
              <View style={[styles.scienceBadge, { backgroundColor: '#1B7A6E15' }]}>
                <Text style={[styles.scienceBadgeText, { color: '#1B7A6E' }]}>{item.science}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>What Breaks a Fast</Text>
        <Text style={styles.sectionSubtitle}>Avoid these during your fasting window</Text>
        <View style={styles.breaksCard}>
          {BREAKS_FAST_ITEMS.map((item, i) => (
            <View key={i} style={styles.breakItem}>
              <Text style={styles.breakEmoji}>{item.emoji}</Text>
              <Text style={styles.breakLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.guideSection}>
        <Text style={styles.sectionTitle}>Gray Area</Text>
        <View style={styles.grayCard}>
          <Text style={styles.grayText}>
            Some debate exists around artificial sweeteners (e.g. stevia, aspartame) and small amounts of lemon or ACV. Research is mixed — some studies show minimal insulin response; others suggest caution. For strict autophagy, stick to water, black coffee, and plain tea.
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.headerArea, { opacity: fadeAnim }]}>
          <Text style={styles.screenTitle}>Knowledge</Text>
          <Text style={styles.screenSubtitle}>Wisdom for body, mind & spirit</Text>

          <View
            style={styles.tabBar}
            onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
          >
            {tabBarWidth > 0 && (
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    width: tabWidth,
                    transform: [{ translateX: tabIndicator }],
                  },
                ]}
              />
            )}
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => switchTab(tab.key)}
                activeOpacity={0.7}
                testID={`knowledge-tab-${tab.key}`}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.ScrollView
          style={[styles.scroll, { opacity: contentFade }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'vedic' && renderVedicTab()}
          {activeTab === 'intermittent' && renderIntermittentTab()}
          {activeTab === 'autophagy' && renderAutophagyTab()}
          {activeTab === 'fasting' && renderFastingFriendlyTab()}
          <View style={{ height: 32 }} />
        </Animated.ScrollView>

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
              {selectedFast && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalIcon}>{selectedFast.icon}</Text>
                  <Text style={styles.modalTitle}>{selectedFast.name}</Text>
                  {selectedFast.category === 'vedic' ? (
                    <Text style={styles.modalDeity}>Dedicated to {selectedFast.deity}</Text>
                  ) : (
                    <Text style={[styles.modalDeity, { color: '#2E86AB' }]}>Intermittent Fasting</Text>
                  )}
                  <Text style={styles.modalDuration}>Recommended duration: {selectedFast.duration} hours</Text>

                  <Text style={styles.modalDesc}>{selectedFast.description}</Text>

                  <Text style={styles.modalSectionTitle}>Benefits</Text>
                  {selectedFast.benefits.map((benefit, i) => (
                    <View key={i} style={styles.modalBullet}>
                      <View style={[styles.bulletDot, { backgroundColor: FAST_TYPE_COLORS[selectedFast.type] || colors.primary }]} />
                      <Text style={styles.modalBulletText}>{benefit}</Text>
                    </View>
                  ))}

                  <Text style={styles.modalSectionTitle}>Rules & Guidelines</Text>
                  {selectedFast.rules.map((rule, i) => (
                    <View key={i} style={styles.modalBullet}>
                      <Text style={styles.modalBulletNum}>{i + 1}</Text>
                      <Text style={styles.modalBulletText}>{rule}</Text>
                    </View>
                  ))}
                  <View style={{ height: 24 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          visible={stageModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setStageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setStageModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {selectedStage && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalIcon}>{selectedStage.icon}</Text>
                  <Text style={styles.modalTitle}>{selectedStage.title}</Text>
                  <Text style={[styles.modalDeity, { color: getStageColor(selectedStage.hour) }]}>
                    {selectedStage.hour} hours into fast
                  </Text>
                  <Text style={[styles.modalDesc, { marginTop: 16 }]}>{selectedStage.description}</Text>

                  <Text style={styles.modalSectionTitle}>What's Happening</Text>
                  {getStageDetails(selectedStage.hour).map((detail, i) => (
                    <View key={i} style={styles.modalBullet}>
                      <View style={[styles.bulletDot, { backgroundColor: getStageColor(selectedStage.hour) }]} />
                      <Text style={styles.modalBulletText}>{detail}</Text>
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

const FastCard = React.memo(({ fast, index, onPress, colors }: { fast: FastTypeInfo; index: number; onPress: (f: FastTypeInfo) => void; colors: ReturnType<typeof import('@/contexts/ThemeContext').useTheme>['colors'] }) => {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const animValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 500,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animValue, index]);

  return (
    <Animated.View
      style={{
        opacity: animValue,
        transform: [{
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity
        style={styles.fastCard}
        onPress={() => onPress(fast)}
        activeOpacity={0.7}
        testID={`knowledge-${fast.type}`}
      >
        <View style={styles.fastCardTop}>
          <View style={styles.fastCardLeft}>
            <Text style={styles.fastIconText}>{fast.icon}</Text>
            <View style={styles.fastInfo}>
              <Text style={styles.fastName}>{fast.name}</Text>
              <Text style={styles.fastDeity}>
                {fast.category === 'vedic' ? `${fast.deity} · ` : ''}{fast.duration}h
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>
        <Text style={styles.fastDesc} numberOfLines={2}>{fast.description}</Text>
        <View style={styles.benefitTags}>
          {fast.benefits.slice(0, 2).map((b, i) => (
            <View
              key={i}
              style={[
                styles.benefitTag,
                { backgroundColor: (FAST_TYPE_COLORS[fast.type] || colors.primary) + '15' },
              ]}
            >
              <Text
                style={[
                  styles.benefitTagText,
                  { color: FAST_TYPE_COLORS[fast.type] || colors.primary },
                ]}
                numberOfLines={1}
              >
                {b}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

function getStageColor(hour: number): string {
  if (hour <= 4) return '#8B7355';
  if (hour <= 12) return '#C97B2A';
  if (hour <= 16) return '#E05A33';
  if (hour <= 18) return '#1B7A6E';
  if (hour <= 24) return '#2E86AB';
  if (hour <= 36) return '#8B6DB5';
  return '#6C4F82';
}

function getStageDetails(hour: number): string[] {
  const details: Record<number, string[]> = {
    0: [
      'Insulin levels rise to process incoming nutrients',
      'Glucose is the primary energy source',
      'mTOR pathway is active (growth mode)',
      'No autophagy occurring — cells are in building mode',
    ],
    4: [
      'Insulin begins to drop as digestion completes',
      'Body transitions to using stored glycogen',
      'Blood sugar stabilizes',
      'Digestive system begins to rest',
    ],
    12: [
      'Glycogen stores are being depleted',
      'Body begins shifting to fat metabolism',
      'Growth hormone starts to increase',
      'Mild cellular stress triggers early repair signals',
    ],
    16: [
      'Significant fat oxidation — body burning stored fat',
      'Ketone body production begins in the liver',
      'mTOR pathway is inhibited, switching to repair mode',
      'Early autophagy activation in some tissues',
    ],
    18: [
      'Autophagy is significantly upregulated across tissues',
      'Cells actively identify and tag damaged proteins',
      'Lysosomes break down cellular waste for recycling',
      'Anti-inflammatory pathways are strongly activated',
    ],
    24: [
      'Full autophagy mode — deep cellular cleaning underway',
      'Damaged mitochondria are recycled (mitophagy)',
      'Misfolded proteins and aggregates are cleared',
      'Stem cell regeneration pathways begin activating',
      'Growth hormone surges to preserve lean muscle mass',
    ],
    36: [
      'Peak autophagy levels — maximum cellular renewal',
      'Immune system regeneration is underway',
      'Growth hormone elevated up to 300% above baseline',
      'Old immune cells broken down and replaced',
      'Profound improvements in insulin sensitivity',
    ],
    48: [
      'Significant immune system reset and renewal',
      'New white blood cells generated from stem cells',
      'Deep tissue repair across all organ systems',
      'Maximum metabolic flexibility achieved',
      'Cognitive clarity and neuroplasticity enhanced',
    ],
  };
  return details[hour] || [];
}

import type { ColorScheme } from '@/constants/colors';

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    headerArea: {
      paddingHorizontal: 20,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
      marginTop: 12,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      marginTop: 2,
    },
    tabBar: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 6,
      marginBottom: 18,
      position: 'relative' as const,
    },
    tabIndicator: {
      position: 'absolute' as const,
      top: 6,
      left: 6,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabItem: {
      flex: 1,
      height: 40,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 4,
      paddingHorizontal: 4,
      zIndex: 1,
    },
    tabIcon: {
      fontSize: 12,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.textMuted,
    },
    tabLabelActive: {
      color: colors.text,
      fontWeight: '600' as const,
    },
    introCard: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row' as const,
      gap: 12,
      alignItems: 'flex-start' as const,
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    introText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 14,
    },
    fastCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    fastCardTop: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    fastCardLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    fastIconText: {
      fontSize: 28,
    },
    fastInfo: {
      gap: 2,
    },
    fastName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
    fastDeity: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    fastDesc: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 10,
    },
    benefitTags: {
      flexDirection: 'row' as const,
      gap: 6,
      flexWrap: 'wrap' as const,
    },
    benefitTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    benefitTagText: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
    guideSection: {
      marginTop: 16,
    },
    guideCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginTop: 8,
    },
    guideItem: {
      flexDirection: 'row' as const,
      gap: 12,
      marginBottom: 16,
    },
    guideEmoji: {
      fontSize: 24,
      marginTop: 2,
    },
    guideText: {
      flex: 1,
    },
    guideTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    guideDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    synergyCard: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      alignItems: 'center' as const,
      marginTop: 8,
    },
    synergyEmoji: {
      fontSize: 28,
      marginBottom: 10,
    },
    synergyTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    synergyText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center' as const,
    },
    timelineContainer: {
      marginBottom: 8,
    },
    timelineItem: {
      flexDirection: 'row' as const,
      minHeight: 72,
    },
    timelineLine: {
      width: 28,
      alignItems: 'center' as const,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginTop: 4,
      zIndex: 1,
    },
    timelineConnector: {
      width: 2,
      flex: 1,
      marginTop: 2,
      marginBottom: -4,
    },
    timelineContent: {
      flex: 1,
      paddingLeft: 10,
      paddingBottom: 14,
    },
    timelineHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 10,
    },
    timelineIcon: {
      fontSize: 22,
      marginTop: -2,
    },
    timelineInfo: {
      flex: 1,
    },
    timelineTopRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      marginBottom: 4,
    },
    timelineHour: {
      fontSize: 14,
      fontWeight: '700' as const,
      minWidth: 28,
    },
    timelineTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
    },
    timelineDesc: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    autophagyBenefitCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    benefitCardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      marginBottom: 8,
    },
    benefitIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    benefitCardIcon: {
      fontSize: 20,
    },
    benefitCardTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    benefitCardDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    scienceCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginTop: 8,
    },
    scienceItem: {
      flexDirection: 'row' as const,
      gap: 12,
      paddingVertical: 4,
    },
    scienceEmoji: {
      fontSize: 24,
      marginTop: 2,
    },
    scienceTextWrap: {
      flex: 1,
    },
    scienceTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    scienceDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    scienceDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 12,
    },
    scienceBadge: {
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start' as const,
    },
    scienceBadgeText: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    breaksCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginTop: 8,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
    },
    breakItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      minWidth: '45%' as any,
    },
    breakEmoji: {
      fontSize: 18,
    },
    breakLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    grayCard: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginTop: 8,
    },
    grayText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
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
      maxHeight: '85%' as any,
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
    modalIcon: {
      fontSize: 40,
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 4,
    },
    modalDeity: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '500' as const,
      marginBottom: 2,
    },
    modalDuration: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    modalDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
      marginBottom: 20,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 10,
      marginTop: 8,
    },
    modalBullet: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 8,
      gap: 10,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 7,
    },
    modalBulletNum: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '700' as const,
      minWidth: 18,
      lineHeight: 20,
    },
    modalBulletText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}
