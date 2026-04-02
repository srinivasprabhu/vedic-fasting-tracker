# Aayu Fasting App — RevenueCat In-App Purchase Implementation Prompt

## Context

Aayu is a React Native fasting app built with **Expo SDK 54**, **Expo Router**, **TypeScript**, and **EAS Build**. The app has a Free tier and a Pro tier. We need to implement in-app purchases using **RevenueCat** that work on both iOS and Android.

### Project Details
- **Bundle ID (iOS):** `com.vedicintermittentfasting.app`
- **Package name (Android):** `com.vedicintermittentfasting.app`
- **EAS Project ID:** `d3434280-b838-48ad-b763-529ba87b2693`
- **Expo SDK:** 54
- **Build system:** EAS Build (not Expo Go — native modules required)
- **Auth:** Supabase (Google Sign-In + Apple Sign-In), guests allowed
- **State management:** React Query + `@nkzw/create-context-hook` + AsyncStorage

### Current Pro Toggle (Dev Only)
There is currently a **developer toggle** in Settings that flips `isProUser` boolean via AsyncStorage (`aayu_pro_override` key). This is used for testing and needs to be **replaced by RevenueCat subscription state** in production, while keeping the dev toggle available in `__DEV__` mode.

The `isProUser` boolean is exposed from `contexts/UserProfileContext.ts` and consumed in:
- `app/(tabs)/insights/index.tsx` — 30D/90D range toggle, Pro metric cards, Smart Projection, Monthly Report
- `app/(tabs)/(home)/index.tsx` — FastPlanPickerModal `isProUser` prop (unlocks Advanced/Weekly/Long fasting plans)
- `components/FastPlanPickerModal.tsx` — Pro plan gating
- `app/settings.tsx` — Dev toggle switch

---

## What to Build

### 1. RevenueCat Setup

Install and configure RevenueCat for Expo:

```bash
npx expo install react-native-purchases
```

Add to `app.json` plugins:
```json
["react-native-purchases", { "iosApiKey": "YOUR_IOS_KEY", "androidApiKey": "YOUR_ANDROID_KEY" }]
```

Create a RevenueCat project at https://app.revenuecat.com with:
- **Product IDs:**
  - `aayu_pro_monthly` — Monthly subscription ($4.99/month)
  - `aayu_pro_yearly` — Annual subscription ($29.99/year — ~$2.50/month, 50% savings)
  - `aayu_pro_lifetime` — One-time purchase ($79.99, optional — add later)
- **Entitlement:** `pro` (maps to the Pro feature set)
- **Offering:** `default` (contains monthly + yearly products)

### 2. RevenueCat Context (`contexts/RevenueCatContext.tsx`)

Create a new React context that:

1. **Initializes RevenueCat** on app mount with the platform-specific API key
2. **Identifies the user** with Supabase user ID when authenticated (so purchases sync across devices), or uses anonymous ID for guests
3. **Listens to subscription status changes** via `Purchases.addCustomerInfoUpdateListener`
4. **Exposes:**
   - `isProUser: boolean` — derived from RevenueCat entitlements (`customerInfo.entitlements.active['pro']`)
   - `offerings: PurchasesOffering | null` — available products with prices
   - `purchasePackage(pkg): Promise<void>` — initiates purchase flow
   - `restorePurchases(): Promise<void>` — restore button handler
   - `subscriptionInfo: { productId, expiresDate, willRenew } | null` — for display in Settings
   - `isLoading: boolean` — true while fetching initial state

5. **Dev mode override:** If `__DEV__` is true AND the AsyncStorage `aayu_pro_override` key is `'true'`, override RevenueCat's `isProUser` to `true`. This preserves the developer toggle for testing without a real subscription.

6. **Guest → Sign-up migration:** When a guest user signs up (Supabase session changes from null to authenticated), call `Purchases.logIn(userId)` to transfer any purchases made as anonymous to the authenticated user. This is critical — if a guest buys Pro and then signs up, their purchase must follow them.

### 3. Paywall Screen (`app/paywall.tsx`)

Create a modal paywall screen that:

1. **Shows when:** User taps a locked Pro feature (30D/90D toggle, locked metric card, locked plan, "Unlock Aayu Pro" banner, monthly report generate button)
2. **Design:** Match the existing Aayu dark theme (background `#0e0703`, gold accent `#e8a84c`, cream text `#f0e0c0`). Use the mandala mark from `assets/brand/logo-mark-mono-dark.svg` as the hero visual (or the `AayuMandala` component with gold colour). See `assets/brand/BRAND_GUIDE.md` for the complete colour palette.
3. **Content:**
   - Hero: "Unlock Aayu Pro" with mandala mark or ✦ icon
   - Feature list (what Pro includes):
     - 30-day and 90-day metabolic insights
     - Smart Weight Projection (AI-powered)
     - Monthly PDF health reports
     - Advanced fasting plans (20:4, OMAD, 36h, 5:2, 4:3)
     - Fat burned, HGH boost, inflammation tracking
     - Cellular age reduction estimates
   - **Two pricing cards:** Monthly ($4.99/mo) and Yearly ($29.99/yr with "Save 50%" badge)
   - Yearly card should be visually emphasized (bordered, "Best Value" badge)
   - "Start 7-day free trial" CTA button (if trial is available from RevenueCat)
   - "Restore purchases" link at bottom
   - Fine print: "Cancel anytime. Subscription auto-renews."
4. **Presented as:** Expo Router modal (`presentation: 'modal'`, slide from bottom)
5. **After purchase:** Dismiss modal, `isProUser` updates reactively via RevenueCat listener, all Pro features unlock immediately

### 4. Replace Pro Toggle in UserProfileContext

Modify `contexts/UserProfileContext.ts`:

1. **Import** `isProUser` from the new RevenueCat context instead of managing it internally
2. **Remove** the AsyncStorage-based `isProUser` state and `toggleProUser` function from production code
3. **Keep** the dev override: In `__DEV__` mode, expose `toggleProUser` and let it override the RevenueCat state
4. **Continue exposing** `isProUser` and `toggleProUser` (dev only) from the context return so all existing consumers work unchanged

### 5. Wire Up Paywall Triggers

Update the following files to navigate to the paywall when a free user taps a Pro feature:

**`app/(tabs)/insights/index.tsx`:**
- 30D/90D range toggle: when `locked` is true and user taps, navigate to `/paywall`
- Smart Projection locked card: onPress → `/paywall`
- Monthly Report locked card: onPress → `/paywall`
- "Unlock Aayu Pro" banner: onPress → `/paywall`

**`components/FastPlanPickerModal.tsx`:**
- `onUpgrade` callback: change from `setShowPlanPicker(false)` to `router.push('/paywall')`

**`app/(tabs)/(home)/index.tsx`:**
- Update the `onUpgrade` prop of `FastPlanPickerModal` to navigate to paywall

### 6. Settings — Subscription Management

Add a "Subscription" section in `app/settings.tsx`:

- **If Pro:** Show "Aayu Pro" with a green checkmark, subscription type (Monthly/Yearly), renewal date, and "Manage Subscription" button (opens native subscription management — App Store settings on iOS, Play Store on Android)
- **If Free:** Show "Upgrade to Pro" with the gold ✦ badge, tapping navigates to paywall
- **Restore Purchases** button (always visible)
- **Dev toggle** (`__DEV__` only): Keep the existing toggle switch but label it "DEV: Override Pro" and make it visually distinct (e.g., red border)

### 7. Provider Hierarchy

Update `app/_layout.tsx` to add the RevenueCat provider. It must be:
- **Inside** `AuthProvider` (needs access to Supabase user ID for RevenueCat identification)
- **Outside** `UserProfileProvider` (so UserProfileContext can consume RevenueCat state)

```
QueryClientProvider
  GestureHandlerRootView
    ThemeProvider
      AuthProvider
        RevenueCatProvider          ← NEW
          UserProfileProvider
            NotificationScheduleSync
            DailySyncManager
            FastingProvider
              RootLayoutNav
```

---

## Technical Requirements

### RevenueCat SDK Configuration
```typescript
import Purchases from 'react-native-purchases';

// In RevenueCatProvider initialization:
Purchases.configure({
  apiKey: Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY,
});

// When user authenticates:
await Purchases.logIn(supabaseUserId);

// When user signs out:
await Purchases.logOut();
```

### Entitlement Check Pattern
```typescript
const customerInfo = await Purchases.getCustomerInfo();
const isPro = customerInfo.entitlements.active['pro'] !== undefined;
```

### Purchase Flow
```typescript
const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    // customerInfo is automatically updated, listener fires
  } catch (e) {
    if (e.userCancelled) return; // User cancelled — do nothing
    throw e; // Real error
  }
};
```

### Store Config (App Store Connect + Google Play Console)

**iOS (App Store Connect):**
- Create subscription group: "Aayu Pro"
- Add products: `aayu_pro_monthly` (auto-renewable, $4.99) and `aayu_pro_yearly` (auto-renewable, $29.99)
- Configure 7-day free trial on yearly plan
- Set up Shared Secret for RevenueCat webhook

**Android (Google Play Console):**
- Create subscription: `aayu_pro_monthly` with base plan (₹449/month)
- Create subscription: `aayu_pro_yearly` with base plan (₹2499/year)
- Configure 7-day free trial offer on yearly plan
- Set up RevenueCat Service Account credentials

### Environment Variables
Add to `.env` and EAS secrets:
```
REVENUECAT_IOS_API_KEY=appl_xxxxx
REVENUECAT_ANDROID_API_KEY=goog_xxxxx
```

---

## Files to Create
1. `contexts/RevenueCatContext.tsx` — RevenueCat provider with entitlement state
2. `app/paywall.tsx` — Paywall modal screen with pricing cards
3. `constants/revenuecat.ts` — API keys and entitlement/product ID constants

## Files to Modify
1. `app/_layout.tsx` — Add `RevenueCatProvider` to provider hierarchy
2. `contexts/UserProfileContext.ts` — Replace AsyncStorage Pro toggle with RevenueCat state
3. `app/settings.tsx` — Add Subscription section, update dev toggle
4. `app/(tabs)/insights/index.tsx` — Wire locked features to paywall navigation
5. `app/(tabs)/(home)/index.tsx` — Wire `onUpgrade` to paywall navigation
6. `components/FastPlanPickerModal.tsx` — Update `onUpgrade` to navigate to paywall
7. `app.json` — Add `react-native-purchases` plugin
8. `package.json` — Add `react-native-purchases` dependency

---

## Important Edge Cases to Handle

1. **Guest purchases:** Guest buys Pro → signs up later → `Purchases.logIn(userId)` must transfer the entitlement. If it fails, show "Restore Purchases" prompt.

2. **Subscription expiry:** When RevenueCat fires a customerInfo update with no active `pro` entitlement, `isProUser` must immediately become `false`. All Pro features should gracefully degrade (show locked state, don't crash).

3. **Family Sharing (iOS):** RevenueCat handles this automatically if configured in App Store Connect.

4. **Promo codes:** RevenueCat supports Apple promo codes. No special code needed — they show up as active entitlements.

5. **Offline purchases:** RevenueCat caches entitlement status locally. The app should work offline for Pro users who have previously synced.

6. **Refunds:** When Apple/Google processes a refund, RevenueCat webhook updates the entitlement. Next app launch or customerInfo check will reflect the change.

7. **Downgrade from yearly to monthly:** RevenueCat handles this automatically — the yearly plan remains active until expiry, then monthly kicks in.

8. **Trial expiry:** After 7-day trial, if user doesn't cancel, it auto-converts to paid. RevenueCat handles this — no special code needed.

---

## Pricing Strategy Notes

- **Monthly ($4.99):** Anchor price, most people see this first
- **Yearly ($29.99):** 50% savings, should be the recommended option (bigger card, "Best Value" badge, "Save 50%" text)
- **7-day free trial:** Only on yearly to encourage commitment. Monthly is direct purchase.
- **Indian pricing:** Use Apple/Google's auto-localized pricing tiers (₹449/month, ₹2499/year is roughly equivalent)

---

## Testing Checklist

After implementation, verify:
- [ ] RevenueCat initializes without errors on app launch
- [ ] Anonymous user can view paywall
- [ ] Monthly purchase flow works (sandbox/test)
- [ ] Yearly purchase flow works with free trial
- [ ] `isProUser` updates immediately after purchase
- [ ] All Pro features unlock: 30D/90D, Pro plans, Smart Projection, Monthly Report, advanced metrics
- [ ] Restore purchases works
- [ ] Guest purchase → sign up → purchase transfers
- [ ] Sign out → sign in → entitlement persists
- [ ] Settings shows subscription details (type, renewal date)
- [ ] Dev toggle still works in `__DEV__` mode
- [ ] Paywall dismisses properly after purchase
- [ ] Paywall shows correct localized prices
- [ ] App doesn't crash when subscription expires mid-session
