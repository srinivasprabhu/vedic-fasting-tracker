import { useState, useCallback, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { lightColors, darkColors, ColorScheme } from '@/constants/colors';
import {
  THEME_PREFERENCE_KEY,
  THEME_LEGACY_DARK_KEY,
} from '@/constants/storageKeys';

export type ThemePreference = 'system' | 'light' | 'dark';

function resolveSystemIsDark(): boolean {
  const scheme = Appearance.getColorScheme();
  if (scheme === 'dark') return true;
  if (scheme === 'light') return false;
  return false;
}

async function loadThemeFromStorage(): Promise<{
  preference: ThemePreference;
  isDark: boolean;
}> {
  try {
    const prefRaw = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
    const legacy = await AsyncStorage.getItem(THEME_LEGACY_DARK_KEY);

    if (prefRaw === 'light' || prefRaw === 'dark') {
      return { preference: prefRaw, isDark: prefRaw === 'dark' };
    }
    if (prefRaw === 'system') {
      return { preference: 'system', isDark: resolveSystemIsDark() };
    }

    if (legacy !== null) {
      const isDark = legacy !== 'false';
      const migrated: ThemePreference = isDark ? 'dark' : 'light';
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, migrated);
      await AsyncStorage.removeItem(THEME_LEGACY_DARK_KEY);
      return { preference: migrated, isDark };
    }

    return { preference: 'system', isDark: resolveSystemIsDark() };
  } catch {
    return { preference: 'system', isDark: resolveSystemIsDark() };
  }
}

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isDark, setIsDark] = useState<boolean>(() => resolveSystemIsDark());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await loadThemeFromStorage();
      if (!cancelled) {
        setPreference(next.preference);
        setIsDark(next.isDark);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || preference !== 'system') return;
    setIsDark(resolveSystemIsDark());
  }, [hydrated, preference]);

  useEffect(() => {
    if (preference !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'dark') setIsDark(true);
      else if (colorScheme === 'light') setIsDark(false);
      else setIsDark(false);
    });
    return () => sub.remove();
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const newPref: ThemePreference = next ? 'dark' : 'light';
      setPreference(newPref);
      void AsyncStorage.setItem(THEME_PREFERENCE_KEY, newPref);
      if (__DEV__) console.log('Theme toggled to:', newPref);
      return next;
    });
  }, []);

  const colors: ColorScheme = isDark ? darkColors : lightColors;
  const followsSystem = preference === 'system';

  return { colors, isDark, toggleTheme, themePreference: preference, followsSystem, themeHydrated: hydrated };
});
