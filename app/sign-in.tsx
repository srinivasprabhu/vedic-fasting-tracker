import { fs } from '@/constants/theme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButtons } from '@/components/onboarding/AuthButtons';

export default function SignInScreen() {
  const { colors } = useTheme();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Sign In', error.message);
        return;
      }
      router.back();
    } catch (e) {
      Alert.alert('Sign In', 'Something went wrong.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        Alert.alert('Sign In', error.message);
        return;
      }
      router.back();
    } catch (e) {
      Alert.alert('Sign In', 'Something went wrong.');
    } finally {
      setAppleLoading(false);
    }
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },
    title: {
      fontSize: fs(24),
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: fs(15),
      color: colors.textMuted,
      marginBottom: 32,
    },
    authWrap: { marginTop: 16 },
  });

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Sign In',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Sign in to save your data</Text>
        <Text style={styles.subtitle}>
          Your fasting records and profile will sync across devices when signed in.
        </Text>
        <View style={styles.authWrap}>
          <AuthButtons
            onGoogleSignIn={handleGoogleSignIn}
            onAppleSignIn={handleAppleSignIn}
            onContinueAsGuest={() => router.back()}
            googleLoading={googleLoading}
            appleLoading={appleLoading}
            accentColor={colors.primary}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
