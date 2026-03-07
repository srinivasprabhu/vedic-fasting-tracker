import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { syncOnSignIn } from '@/lib/sync';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@/constants/auth';

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (__DEV__) console.log('[Auth] onAuthStateChange:', event, !!s);
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    syncOnSignIn(uid).then(() => {
      queryClient.invalidateQueries({ queryKey: ['fasting-records'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    });
  }, [session?.user?.id, queryClient]);

  const signInWithGoogle = useCallback(async (): Promise<{
    error: Error | null;
  }> => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      if (__DEV__) console.log('[Auth] GOOGLE_WEB_CLIENT_ID is empty. Check .env or EAS env vars.');
      return {
        error: new Error(
          'Google Sign-In is not configured. Please rebuild the app after setting environment variables.'
        ),
      };
    }
    try {
      const { GoogleSignin } = await import(
        '@react-native-google-signin/google-signin'
      );
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      if (!idToken) {
        return { error: new Error('Google sign-in was cancelled') };
      }

      // Google's iOS SDK may embed a nonce in the id_token automatically.
      // Extract it and pass to Supabase so both sides match.
      let nonce: string | undefined;
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.nonce) {
            nonce = payload.nonce;
          }
        }
      } catch {
        // JWT decode failed — proceed without nonce
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (e) {
      if (__DEV__) console.log('[Auth] Google sign-in error:', e);
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, []);

  const signInWithApple = useCallback(async (): Promise<{
    error: Error | null;
  }> => {
    if (Platform.OS !== 'ios') {
      return { error: new Error('Apple Sign-In is only available on iOS') };
    }
    try {
      const AppleAuth = await import('expo-apple-authentication');

      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const identityToken = credential.identityToken;
      const fullName = credential.fullName;
      if (!identityToken) {
        return { error: new Error('Apple sign-in was cancelled') };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce: rawNonce,
      });
      if (error) return { error: new Error(error.message) };

      if (fullName) {
        const fullNameStr = [fullName.givenName, fullName.familyName]
          .filter(Boolean)
          .join(' ');
        await supabase.auth.updateUser({
          data: {
            full_name: fullNameStr,
            given_name: fullName.givenName ?? undefined,
            family_name: fullName.familyName ?? undefined,
          },
        });
      }
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (__DEV__) console.log('[Auth] signOut called');
      // Use 'local' scope so we only clear this device's session.
      // More reliable on iOS than default 'global' (which calls server).
      await supabase.auth.signOut({ scope: 'local' });
      if (__DEV__) console.log('[Auth] signOut completed');
    } catch (e) {
      console.warn('[Auth] signOut error (clearing session anyway):', e);
      // Force clear session even if signOut fails (e.g. network, stale session)
      setSession(null);
    }
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isGuest: !session,
    isLoading,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
