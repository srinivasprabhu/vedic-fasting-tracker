# Aayu — Sentry + PostHog Setup Guide

## Prerequisites
- Expo SDK 54 project (already configured)
- EAS CLI installed (`npm install -g eas-cli`)
- Sentry account (free: https://sentry.io/signup/)
- PostHog account (free: https://posthog.com/signup — choose US or EU cloud)

---

## Part 1: Sentry (Crash Reporting)

### Step 1 — Create Sentry project

1. Go to https://sentry.io → Create account (free tier = 5,000 events/month)
2. Create a new project → Select "React Native"
3. Copy your **DSN** — it looks like: `https://abc123@o456.ingest.sentry.io/789`
4. Note your **org slug** and **project slug** from the URL

### Step 2 — Install Sentry

Run in your project root:
```bash
npx expo install @sentry/react-native
```

### Step 3 — Add Sentry plugin to app.json

Add the Sentry plugin to your existing plugins array in `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@sentry/react-native/expo",
      ... (your existing plugins)
    ]
  }
}
```

**Important:** The `@sentry/react-native/expo` plugin must be listed. It handles iOS/Android native setup automatically.

### Step 4 — Add environment variables

Create or update `.env` in project root (do NOT commit this file):
```env
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn-here@o000.ingest.sentry.io/000
```

Add to `.gitignore` if not already there:
```
.env
.env.local
```

### Step 5 — Initialise Sentry in app/_layout.tsx

The Cursor prompt below handles this. Sentry.init() must run before any React rendering — it goes at the top of the file, after imports.

### Step 6 — Configure source maps for EAS Build

Add to `eas.json` under each build profile:
```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_ORG": "your-org-slug",
        "SENTRY_PROJECT": "your-project-slug"
      }
    }
  }
}
```

Create a `sentry.properties` file in project root (NOT committed — add to .gitignore):
```
defaults.org=your-org-slug
defaults.project=your-project-slug
auth.token=your-sentry-auth-token
```

Generate the auth token at: https://sentry.io/settings/auth-tokens/ → Create New Token → Select "Release: Admin" + "Organization: Read" scopes.

### Step 7 — Test locally

After the code changes (from Cursor prompt), run:
```bash
npx expo start --dev-client
```
Then trigger a test crash from Settings → Developer section, or add a temporary button that throws an error. Check Sentry dashboard to verify the event appears.

---

## Part 2: PostHog (Analytics)

### Step 1 — Create PostHog project

1. Go to https://posthog.com/signup → Create free account
2. Choose US or EU cloud (EU is better for GDPR if you have European users)
3. Create a project
4. Copy your **API key** (looks like: `phc_abc123...`)
5. Copy your **host URL** (US: `https://us.i.posthog.com`, EU: `https://eu.i.posthog.com`)

### Step 2 — Install PostHog

```bash
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
```

Note: Several of these deps (expo-file-system, expo-application, expo-device, expo-localization) may already be installed or available via Expo. The PostHog RN SDK uses them internally.

### Step 3 — Add environment variables

Add to your `.env`:
```env
EXPO_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Step 4 — Create the analytics utility

The Cursor prompt below creates `lib/analytics.ts` — a thin wrapper around PostHog that provides typed event helpers.

### Step 5 — Wrap the app with PostHogProvider

The Cursor prompt modifies `app/_layout.tsx` to add the PostHog provider inside the existing provider tree.

### Step 6 — Add the 5 critical launch events

The Cursor prompt adds event calls to:
1. `app/_layout.tsx` — `app_opened` on mount
2. `app/onboarding.tsx` — `onboarding_completed` when user finishes
3. `app/(tabs)/(home)/index.tsx` — `fast_started` and `fast_completed`
4. `contexts/RevenueCatContext.tsx` — `paywall_shown`, `paywall_dismissed`, `paywall_converted`

### Step 7 — Verify locally

After changes, open the app → check PostHog dashboard → Live Events tab. You should see `app_opened` appear within seconds.

---

## Part 3: Verification checklist

After Cursor applies the prompt:

- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npx expo start --dev-client` — app launches without crash
- [ ] Open app → check Sentry dashboard → verify test event appears
- [ ] Open app → check PostHog Live Events → verify `app_opened` appears
- [ ] Start a fast → verify `fast_started` in PostHog
- [ ] End a fast → verify `fast_completed` in PostHog
- [ ] Tap Pro feature → verify `paywall_shown` in PostHog
- [ ] Trigger a JS error in dev → verify it appears in Sentry
- [ ] Run `npx expo prebuild --clean` → verify iOS/Android builds succeed

---

## Costs at your scale

| Service | Free tier | When you'll outgrow it |
|---------|-----------|----------------------|
| Sentry | 5,000 events/month | ~500 daily active users |
| PostHog | 1,000,000 events/month | ~10,000 daily active users |

You won't pay anything until you're well past product-market fit.
