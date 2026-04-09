import { fs } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Clock, BarChart3, Lightbulb, BookOpen } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // On Android, account for the software nav bar; on iOS, the home indicator
  const tabBarHeight = 56 + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: fs(10),
          fontWeight: '500',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Clock size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Lightbulb size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 1} color={color} />,
        }}
      />
      {/* Daily hidden — detailed views accessible via tap-through from Today */}
      <Tabs.Screen
        name="daily"
        options={{
          href: null,
        }}
      />
      {/* Calendar hidden — only accessible from settings if Vedic mode is on */}
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
