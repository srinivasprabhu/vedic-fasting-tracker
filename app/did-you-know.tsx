import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { DID_YOU_KNOW_SLIDES } from '@/mocks/did-you-know-slides';

const DARK_PANEL = '#1E1E1E';
const HERO_TITLE_COLOR = '#2F6A3C';
const CTA_GREEN = '#3D9A5C';
const WAVE_H = 36;

export default function DidYouKnowScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = DID_YOU_KNOW_SLIDES[index];
  const total = DID_YOU_KNOW_SLIDES.length;
  const isLast = index >= total - 1;

  /** Nearly full screen: small strip under status bar stays tappable to dismiss; no 720pt cap on tall phones. */
  const topGap = Math.max(insets.top, 10) + 8;
  const sheetMaxHeight = Math.max(380, Math.round(height - topGap));

  const wavePath = useMemo(() => {
    const w = width;
    const yTop = 10;
    return `M 0 ${yTop} Q ${w / 2} ${WAVE_H + 4} ${w} ${yTop} L ${w} ${WAVE_H + 18} L 0 ${WAVE_H + 18} Z`;
  }, [width]);

  const close = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const onContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      router.back();
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [isLast, total]);

  const onSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  return (
    <View
      style={[styles.overlayRoot, { minHeight: height }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={close}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
      />
      <View
        style={[styles.sheet, { height: sheetMaxHeight }]}
        pointerEvents="auto"
      >
        <View style={styles.sheetInner}>
          <View style={styles.heroBlock}>
            <LinearGradient
              colors={slide.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroInner}>
              <View style={styles.handleBar} />
              <View style={styles.progressRow}>
                {DID_YOU_KNOW_SLIDES.map((s, i) => (
                  <View
                    key={s.id}
                    style={[
                      styles.progressSeg,
                      i <= index ? styles.progressSegOn : styles.progressSegOff,
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={close}
                style={styles.closeBtn}
                accessibilityLabel="Close"
                hitSlop={12}
              >
                <X size={22} color={HERO_TITLE_COLOR} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.topTitle}>{slide.topTitle}</Text>
              <View style={styles.heroAbstract}>
                <View style={[styles.blob, styles.blob1]} />
                <View style={[styles.blob, styles.blob2]} />
              </View>
            </View>
            <Svg
              width={width}
              height={WAVE_H + 22}
              style={styles.waveSvg}
              pointerEvents="none"
            >
              <Path d={wavePath} fill={DARK_PANEL} />
            </Svg>
          </View>

          <View style={styles.panel}>
            <Text style={styles.headline}>{slide.headline}</Text>
            <Text style={styles.body}>{slide.body}</Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={onContinue}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Done' : 'Continue to next fact'}
            >
              <Text style={styles.ctaText}>{isLast ? 'Done' : 'Continue'}</Text>
            </TouchableOpacity>
            {!isLast && (
              <TouchableOpacity onPress={onSkip} style={styles.skipWrap} accessibilityRole="button">
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
            <SafeAreaView edges={['bottom']} style={styles.bottomSafe} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  } as ViewStyle,
  sheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: DARK_PANEL,
    zIndex: 1,
    elevation: 8,
  } as ViewStyle,
  sheetInner: {
    flex: 1,
    flexDirection: 'column',
  } as ViewStyle,
  heroBlock: {
    height: 248,
    flexShrink: 0,
    position: 'relative',
  } as ViewStyle,
  heroInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: WAVE_H + 2,
  } as ViewStyle,
  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginBottom: 12,
  } as ViewStyle,
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingRight: 52,
  } as ViewStyle,
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  } as ViewStyle,
  progressSegOn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  } as ViewStyle,
  progressSegOff: {
    backgroundColor: 'rgba(0,0,0,0.14)',
  } as ViewStyle,
  closeBtn: {
    position: 'absolute',
    top: 36,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  } as ViewStyle,
  topTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: -0.3,
    color: HERO_TITLE_COLOR,
  } as TextStyle,
  heroAbstract: {
    flex: 1,
    minHeight: 72,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  blob: {
    position: 'absolute',
    borderRadius: 999,
  } as ViewStyle,
  blob1: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.38)',
  } as ViewStyle,
  blob2: {
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ translateX: 28 }, { translateY: 16 }],
  } as ViewStyle,
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  } as ViewStyle,
  panel: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: DARK_PANEL,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 200,
  } as ViewStyle,
  headline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 10,
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 20,
  } as TextStyle,
  cta: {
    backgroundColor: CTA_GREEN,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  } as ViewStyle,
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0D1F12',
  } as TextStyle,
  skipWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
  } as TextStyle,
  bottomSafe: {
    minHeight: 0,
  } as ViewStyle,
});
