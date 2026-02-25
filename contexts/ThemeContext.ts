import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { lightColors, darkColors, ColorScheme } from '@/constants/colors';

const THEME_KEY = 'vedic_theme_dark';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [isDark, setIsDark] = useState<boolean>(false);

  const themeQuery = useQuery({
    queryKey: ['theme'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        return stored === 'true';
      } catch {
        return false;
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (dark: boolean) => {
      await AsyncStorage.setItem(THEME_KEY, dark ? 'true' : 'false');
      return dark;
    },
  });

  useEffect(() => {
    if (themeQuery.data !== undefined) {
      setIsDark(themeQuery.data);
    }
  }, [themeQuery.data]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    saveMutation.mutate(next);
    console.log('Theme toggled to:', next ? 'dark' : 'light');
  }, [isDark, saveMutation]);

  const colors: ColorScheme = isDark ? darkColors : lightColors;

  return { colors, isDark, toggleTheme };
});
