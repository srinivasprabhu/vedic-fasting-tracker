import { CurrencyInfo } from '@/types/user';
import { Platform, NativeModules } from 'react-native';

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', mealCost: 150 },
  { code: 'USD', symbol: '$', name: 'US Dollar', mealCost: 12 },
  { code: 'EUR', symbol: '€', name: 'Euro', mealCost: 10 },
  { code: 'GBP', symbol: '£', name: 'British Pound', mealCost: 9 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', mealCost: 15 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', mealCost: 18 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', mealCost: 10 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', mealCost: 35 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', mealCost: 30 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', mealCost: 15 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', mealCost: 150 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', mealCost: 1000 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', mealCost: 10000 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', mealCost: 40 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', mealCost: 120 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', mealCost: 35 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', mealCost: 18 },
];

const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'IN': 'INR', 'US': 'USD', 'GB': 'GBP', 'CA': 'CAD', 'AU': 'AUD',
  'SG': 'SGD', 'AE': 'AED', 'SA': 'SAR', 'MY': 'MYR', 'TH': 'THB',
  'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY', 'ZA': 'ZAR', 'BR': 'BRL',
  'NZ': 'NZD', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
  'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'IE': 'EUR',
  'FI': 'EUR', 'GR': 'EUR',
};

export function detectCurrencyFromLocale(): string {
  try {
    let locale = 'en-US';

    if (Platform.OS === 'web') {
      locale = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    } else if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale
        || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        || 'en-US';
    } else if (Platform.OS === 'android') {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en_US';
    }

    const parts = locale.replace('_', '-').split('-');
    const country = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';

    if (country && LOCALE_CURRENCY_MAP[country]) {
      return LOCALE_CURRENCY_MAP[country];
    }

    console.log('Could not detect currency from locale, defaulting to USD. Locale:', locale);
    return 'USD';
  } catch (e) {
    console.log('Error detecting currency:', e);
    return 'USD';
  }
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[1];
}
