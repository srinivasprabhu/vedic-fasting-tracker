import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { FONT_SCALE } from '@/constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '@/contexts/AuthContext';
import { FastingProvider } from '@/contexts/FastingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { registerForPushNotifications } from '@/utils/notifications';
import { NotificationScheduleSync } from '@/components/NotificationScheduleSync';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@/constants/auth';

SplashScreen.preventAutoHideAsync();

// ─── Global font scale ─────────────────────────────────────────────────────────
// Override default Text and TextInput to apply FONT_SCALE from theme.ts
// This scales ALL text in the app by the configured factor (1.2 = 20% larger)
const originalTextRender = (Text as any).render;
if (originalTextRender) {
  (Text as any).render = function(props: any, ref: any) {
    const style = props.style;
    let fontSize = undefined;
    if (style) {
      // Extract fontSize from style (could be array or object)
      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean).map(s => typeof s === 'object' ? s : {}))
        : (typeof style === 'object' ? style : {});
      if (flatStyle.fontSize) {
        fontSize = Math.round(flatStyle.fontSize * FONT_SCALE);
      }
    }
    const newProps = fontSize
      ? { ...props, style: [style, { fontSize }] }
      : props;
    return originalTextRender.call(this, newProps, ref);
  };
}

// Same for TextInput
const originalTextInputRender = (TextInput as any).render;
if (originalTextInputRender) {
  (TextInput as any).render = function(props: any, ref: any) {
    const style = props.style;
    let fontSize = undefined;
    if (style) {
      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean).map(s => typeof s === 'object' ? s : {}))
        : (typeof style === 'object' ? style : {});
      if (flatStyle.fontSize) {
        fontSize = Math.round(flatStyle.fontSize * FONT_SCALE);
      }
    }
    const newProps = fontSize
      ? { ...props, style: [style, { fontSize }] }
      : props;
    return originalTextInputRender.call(this, newProps, ref);
  };
}

if (Platform.OS !== 'web') {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
}

// Configure Google Sign-In only in standalone builds (not Expo Go — native module not available)
const isExpoGo = Constants.executionEnvironment === 'storeClient';
if (GOOGLE_WEB_CLIENT_ID && !isExpoGo && Platform.OS !== 'web') {
  import('@react-native-google-signin/google-signin')
    .then(({ GoogleSignin }) => {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      });
      if (__DEV__) console.log('[Auth] GoogleSignin configured');
    })
    .catch((e) => {
      if (__DEV__) console.log('[Auth] GoogleSignin configure failed:', e);
    });
}

const queryClient = new QueryClient();
const ONBOARDING_KEY = 'vedic_onboarding_complete';
const PROFILE_KEY = 'vedic_user_profile';

function RootLayoutNav() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('Notification received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) console.log('Notification tapped:', response.notification.request.content.title);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        const profileData = await AsyncStorage.getItem(PROFILE_KEY);
        console.log('Onboarding status:', completed, 'Profile:', !!profileData);
        if (completed !== 'true') {
          setShowOnboarding(true);
        } else if (!profileData) {
          setNeedsProfile(true);
        }
      } catch (e) {
        console.log('Error checking onboarding:', e);
        setShowOnboarding(true);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isReady && showOnboarding) {
      router.replace('/onboarding' as any);
    } else if (isReady && needsProfile) {
      router.replace('/profile-setup' as any);
    }
  }, [isReady, showOnboarding, needsProfile]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0604' },
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0604' },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          presentation: 'card',
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="fast-complete"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <ThemeProvider>
          <AuthProvider>
            <UserProfileProvider>
              <NotificationScheduleSync />
              <FastingProvider>
                <RootLayoutNav />
              </FastingProvider>
            </UserProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
