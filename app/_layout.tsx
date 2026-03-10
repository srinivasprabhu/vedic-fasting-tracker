import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '@/contexts/AuthContext';
import { FastingProvider } from '@/contexts/FastingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import {
  registerForPushNotifications,
  getNotificationsEnabled,
  scheduleDailyReminder,
  scheduleWeeklySummary,
} from '@/utils/notifications';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@/constants/auth';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
}

// Configure Google Sign-In only in standalone builds (not Expo Go — native module not available)
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
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

    getNotificationsEnabled().then((enabled) => {
      if (enabled) {
        scheduleDailyReminder();
        scheduleWeeklySummary();
      }
    });

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
