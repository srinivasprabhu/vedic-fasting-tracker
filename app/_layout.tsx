import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '@/contexts/AuthContext';
import { FastingProvider } from '@/contexts/FastingContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { RevenueCatProvider } from '@/contexts/RevenueCatContext';
import { registerForPushNotifications } from '@/utils/notifications';
import { NotificationScheduleSync } from '@/components/NotificationScheduleSync';
import { DailySyncManager } from '@/components/DailySyncManager';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@/constants/auth';
import BrandedSplash from '@/components/BrandedSplash';
import { ONBOARDING_COMPLETE_KEY, PROFILE_STORAGE_KEY } from '@/constants/storageKeys';

SplashScreen.preventAutoHideAsync();

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

function RootLayoutNav() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);
  const [showBrandedSplash, setShowBrandedSplash] = useState<boolean>(true);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('Notification received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (__DEV__) console.log('Notification tapped:', response.notification.request.content.title);
      const data = response.notification.request.content.data as { type?: string } | undefined;
      if (data?.type === 'monthly_recap') {
        router.push('/monthly-recap' as any);
      }
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

  // Cold start: open recap when the user launched the app from the monthly recap notification.
  useEffect(() => {
    if (!isReady || showOnboarding || needsProfile) return;
    let cancelled = false;
    void Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (cancelled || !response) return;
      const data = response.notification.request.content.data as { type?: string } | undefined;
      if (data?.type === 'monthly_recap') {
        router.push('/monthly-recap' as any);
        try {
          await Notifications.clearLastNotificationResponseAsync();
        } catch {}
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isReady, showOnboarding, needsProfile]);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        const profileData = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
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
    <>
      {showBrandedSplash && (
        <BrandedSplash onFinish={() => setShowBrandedSplash(false)} />
      )}
      <RootStack />
    </>
  );
}

/** Stack routes that need theme-aware `contentStyle` must live under `useTheme`. */
function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="vedic-calendar"
        options={{
          title: 'Vedic calendar',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background } as const,
          headerTintColor: colors.primary,
          headerShadowVisible: false,
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
      <Stack.Screen
        name="did-you-know"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          contentStyle: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
        }}
      />
      <Stack.Screen
        name="monthly-recap"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { flex: 1, backgroundColor: colors.background },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <RevenueCatProvider>
              <UserProfileProvider>
                <DailySyncManager />
                <FastingProvider>
                  <NotificationScheduleSync />
                  <RootLayoutNav />
                </FastingProvider>
              </UserProfileProvider>
            </RevenueCatProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
