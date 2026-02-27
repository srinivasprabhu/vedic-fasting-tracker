import { useState, useCallback, useEffect, useRef } from 'react';
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
  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;

  useEffect(() => {
    if (themeQuery.data !== undefined) {
      setIsDark(themeQuery.data);
    }
  }, [themeQuery.data]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      saveMutateRef.current(next);
      console.log('Theme toggled to:', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const colors: ColorScheme = isDark ? darkColors : lightColors;

  return { colors, isDark, toggleTheme };
});
