import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile } from '@/types/user';
import { detectCurrencyFromLocale, getCurrencyInfo } from '@/constants/currencies';

const PROFILE_KEY = 'vedic_user_profile';

async function loadProfile(): Promise<UserProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.log('Failed to load user profile:', e);
    return null;
  }
}

async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    console.log('User profile saved:', profile.name);
  } catch (e) {
    console.log('Failed to save user profile:', e);
  }
  return profile;
}

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: loadProfile,
  });

  const saveMutation = useMutation({
    mutationFn: saveProfile,
  });

  useEffect(() => {
    if (profileQuery.data !== undefined) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  const updateProfile = useCallback((newProfile: UserProfile) => {
    setProfile(newProfile);
    saveMutation.mutate(newProfile);
  }, [saveMutation]);

  const currencyCode = profile?.currency ?? detectCurrencyFromLocale();
  const currencyInfo = getCurrencyInfo(currencyCode);

  const hasProfile = profile !== null;

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const name = profile?.name ?? '';
    if (hour < 5) return `Shubh Ratri, ${name}`;
    if (hour < 12) return `Shubh Prabhat, ${name}`;
    if (hour < 17) return `Namaste, ${name}`;
    if (hour < 21) return `Shubh Sandhya, ${name}`;
    return `Shubh Ratri, ${name}`;
  }, [profile?.name]);

  const getInitial = useCallback(() => {
    if (!profile?.name) return '🙏';
    return profile.name.charAt(0).toUpperCase();
  }, [profile?.name]);

  return {
    profile,
    hasProfile,
    isLoading: profileQuery.isLoading,
    updateProfile,
    getGreeting,
    getInitial,
    currencyInfo,
  };
});
