import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  getRevenueCatApiKey,
  REVENUECAT_ENTITLEMENT_PRO,
} from '@/constants/revenuecat';

const PRO_OVERRIDE_KEY = 'aayu_pro_override';

const nativeIap = Platform.OS === 'ios' || Platform.OS === 'android';

function hasActiveProEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return typeof info.entitlements.active[REVENUECAT_ENTITLEMENT_PRO] !== 'undefined';
}

function isUserCancelled(error: unknown): boolean {
  if (error && typeof error === 'object' && 'userCancelled' in error) {
    return Boolean((error as { userCancelled?: boolean }).userCancelled);
  }
  return false;
}

export type SubscriptionInfo = {
  productId: string;
  expiresDate: string | null;
  willRenew: boolean;
  isLifetime: boolean;
};

type RevenueCatContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  /** True when RevenueCat reports an active `pro` entitlement (store or restore). */
  hasStoreEntitlement: boolean;
  /** __DEV__ only — local AsyncStorage override; exposed for the settings switch. */
  devProOverride: boolean;
  isProUser: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  presentPaywall: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  /** __DEV__ only — toggles AsyncStorage override for testing without a store subscription */
  toggleDevProOverride: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const configuredRef = useRef(false);
  const [isConfigured, setIsConfigured] = useState(!nativeIap);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [devProOverride, setDevProOverride] = useState(false);
  const [bootstrapDone, setBootstrapDone] = useState(!nativeIap);

  const loadDevOverride = useCallback(async () => {
    if (!__DEV__) return;
    try {
      const v = await AsyncStorage.getItem(PRO_OVERRIDE_KEY);
      setDevProOverride(v === 'true');
    } catch {
      setDevProOverride(false);
    }
  }, []);

  useEffect(() => {
    if (__DEV__) void loadDevOverride();
  }, [loadDevOverride]);

  useEffect(() => {
    if (!nativeIap) return;

    let cancelled = false;

    (async () => {
      try {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        else Purchases.setLogLevel(LOG_LEVEL.WARN);

        Purchases.configure({ apiKey: getRevenueCatApiKey() });
        configuredRef.current = true;
        if (!cancelled) setIsConfigured(true);

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) setCustomerInfo(info);
      } catch (e) {
        if (__DEV__) console.warn('[RevenueCat] configure failed:', e);
      } finally {
        if (!cancelled) setBootstrapDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!nativeIap || !isConfigured) return;

    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!nativeIap || !configuredRef.current || authLoading || !bootstrapDone) return;

    let cancelled = false;

    (async () => {
      try {
        if (userId) {
          const { customerInfo: info } = await Purchases.logIn(userId);
          if (!cancelled) setCustomerInfo(info);
        } else {
          // logOut() throws if already anonymous — typical for guests after configure().
          const anonymous = await Purchases.isAnonymous();
          if (!anonymous) {
            await Purchases.logOut();
          }
          const info = await Purchases.getCustomerInfo();
          if (!cancelled) setCustomerInfo(info);
        }
      } catch (e) {
        if (__DEV__) console.warn('[RevenueCat] login/logout sync failed:', e);
        try {
          const info = await Purchases.getCustomerInfo();
          if (!cancelled) setCustomerInfo(info);
        } catch {
          /* noop */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading, bootstrapDone]);

  const entitlementActive = hasActiveProEntitlement(customerInfo);
  const isProUser =
    entitlementActive || (__DEV__ && devProOverride);

  const subscriptionInfo = useMemo((): SubscriptionInfo | null => {
    const ent = customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_PRO];
    if (!ent) return null;
    const productId = ent.productIdentifier;
    const expires = ent.expirationDate;
    const willRenew = ent.willRenew;
    const idLower = productId.toLowerCase();
    const isLifetime = idLower.includes('lifetime');

    return {
      productId,
      expiresDate: expires,
      willRenew,
      isLifetime,
    };
  }, [customerInfo]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!nativeIap || !configuredRef.current) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      if (__DEV__) console.warn('[RevenueCat] getCustomerInfo failed:', e);
    }
  }, []);

  const presentPaywall = useCallback(async () => {
    if (!nativeIap) {
      Alert.alert('Not available', 'Subscriptions are available in the iOS and Android apps.');
      return;
    }
    if (!configuredRef.current) return;

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_PRO,
      });

      if (result === PAYWALL_RESULT.ERROR) {
        Alert.alert('Something went wrong', 'Could not open the subscription screen. Please try again.');
      }
    } catch (e) {
      if (__DEV__) console.warn('[RevenueCat] presentPaywallIfNeeded:', e);
      if (!isUserCancelled(e)) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Unable to show subscriptions.');
      }
    }
  }, []);

  const presentCustomerCenter = useCallback(async () => {
    if (!nativeIap) {
      Alert.alert('Not available', 'Subscription management is available in the iOS and Android apps.');
      return;
    }
    if (!configuredRef.current) return;

    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (e) {
      if (__DEV__) console.warn('[RevenueCat] presentCustomerCenter:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to open subscription management.');
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!nativeIap) return;
    if (!configuredRef.current) return;

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      if (hasActiveProEntitlement(info)) {
        Alert.alert('Restored', 'Your Aayu Pro access is active.');
      } else {
        Alert.alert('No purchases found', 'We could not find an active subscription for this account.');
      }
    } catch (e) {
      if (isUserCancelled(e)) return;
      if (__DEV__) console.warn('[RevenueCat] restorePurchases:', e);
      Alert.alert('Restore failed', e instanceof Error ? e.message : 'Please try again later.');
    }
  }, []);

  const toggleDevProOverride = useCallback(async () => {
    if (!__DEV__) return;
    const next = !devProOverride;
    setDevProOverride(next);
    await AsyncStorage.setItem(PRO_OVERRIDE_KEY, next ? 'true' : 'false');
  }, [devProOverride]);

  const value = useMemo(
    (): RevenueCatContextValue => ({
      isConfigured,
      isLoading:
        nativeIap &&
        (!bootstrapDone || (authLoading && !customerInfo)),
      customerInfo,
      hasStoreEntitlement: entitlementActive,
      devProOverride: __DEV__ ? devProOverride : false,
      isProUser,
      subscriptionInfo,
      presentPaywall,
      presentCustomerCenter,
      restorePurchases,
      refreshCustomerInfo,
      toggleDevProOverride,
    }),
    [
      isConfigured,
      bootstrapDone,
      authLoading,
      customerInfo,
      entitlementActive,
      devProOverride,
      isProUser,
      subscriptionInfo,
      presentPaywall,
      presentCustomerCenter,
      restorePurchases,
      refreshCustomerInfo,
      toggleDevProOverride,
    ],
  );

  return (
    <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>
  );
}

export function useRevenueCat(): RevenueCatContextValue {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat must be used within RevenueCatProvider');
  return ctx;
}
