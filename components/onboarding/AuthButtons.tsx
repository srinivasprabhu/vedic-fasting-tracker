import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface AuthButtonsProps {
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
  onContinueAsGuest: () => void;
  googleLoading: boolean;
  appleLoading: boolean;
  accentColor: string;
}

const PressableButton: React.FC<{
  onPress: () => void;
  style: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onPress, style, children, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const GoogleIcon = () => <Text style={styles.providerIcon}>G</Text>;

const AppleIcon = () => <Text style={styles.appleIcon}>{'\uF8FF'}</Text>;

export const AuthButtons: React.FC<AuthButtonsProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  onContinueAsGuest,
  googleLoading,
  appleLoading,
  accentColor,
}) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const slide1 = useRef(new Animated.Value(20)).current;
  const slide2 = useRef(new Animated.Value(20)).current;
  const slide3 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const makeAnim = (opacity: Animated.Value, slide: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 480,
          delay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 480,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    Animated.stagger(80, [
      makeAnim(anim1, slide1, 0),
      makeAnim(anim2, slide2, 0),
      makeAnim(anim3, slide3, 0),
    ]).start();
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>sign in to save your journey</Text>
        <View style={styles.dividerLine} />
      </View>

      <Animated.View style={{ opacity: anim1, transform: [{ translateY: slide1 }] }}>
        <PressableButton
          onPress={onGoogleSignIn}
          disabled={googleLoading || appleLoading}
          style={styles.socialBtn}
        >
          {googleLoading ? (
            <ActivityIndicator color={COLORS.cream} size="small" />
          ) : (
            <>
              <View style={styles.providerIconWrap}>
                <GoogleIcon />
              </View>
              <Text style={styles.socialBtnText}>Continue with Google</Text>
              <View style={{ width: 32 }} />
            </>
          )}
        </PressableButton>
      </Animated.View>

      {Platform.OS === 'ios' && (
        <Animated.View style={{ opacity: anim2, transform: [{ translateY: slide2 }] }}>
          <PressableButton
            onPress={onAppleSignIn}
            disabled={googleLoading || appleLoading}
            style={[styles.socialBtn, styles.appleBtn]}
          >
            {appleLoading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <View style={styles.providerIconWrap}>
                  <AppleIcon />
                </View>
                <Text style={[styles.socialBtnText, styles.appleBtnText]}>
                  Continue with Apple
                </Text>
                <View style={{ width: 32 }} />
              </>
            )}
          </PressableButton>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: anim3, transform: [{ translateY: slide3 }] }}>
        <TouchableOpacity
          onPress={onContinueAsGuest}
          disabled={googleLoading || appleLoading}
          style={styles.guestBtn}
          activeOpacity={0.6}
        >
          <Text style={styles.guestText}>Continue as guest</Text>
          <Text style={styles.guestSubText}> · data won't be saved</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.legal}>
        By continuing you agree to our{' '}
        <Text style={[styles.legalLink, { color: accentColor }]}>Terms</Text>
        {' & '}
        <Text style={[styles.legalLink, { color: accentColor }]}>Privacy Policy</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  } as ViewStyle,

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,

  dividerText: {
    fontSize: 10,
    color: 'rgba(240,224,192,0.3)',
    letterSpacing: 0.1,
    textTransform: 'lowercase',
  } as TextStyle,

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(240,224,192,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(240,224,192,0.12)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 54,
  } as ViewStyle,

  appleBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.92)',
  } as ViewStyle,

  providerIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  providerIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.cream,
  } as TextStyle,

  appleIcon: {
    fontSize: 20,
    color: '#1a1a1a',
  } as TextStyle,

  socialBtnText: {
    fontSize: 15,
    color: COLORS.cream,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  } as TextStyle,

  appleBtnText: {
    color: '#1a1a1a',
  } as TextStyle,

  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,

  guestText: {
    fontSize: 13,
    color: 'rgba(240,224,192,0.45)',
  } as TextStyle,

  guestSubText: {
    fontSize: 13,
    color: 'rgba(240,224,192,0.25)',
  } as TextStyle,

  legal: {
    fontSize: 10,
    color: 'rgba(240,224,192,0.2)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
  } as TextStyle,

  legalLink: {
    fontWeight: '500',
  } as TextStyle,
});
