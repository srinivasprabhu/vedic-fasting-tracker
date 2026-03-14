# Aayu Fasting

Your personal fasting companion — track, learn, and transform your health with science-backed intermittent fasting and ancient Vedic wisdom.

## Tech Stack

- **React Native** + **Expo** (SDK 54)
- **Expo Router** — file-based routing
- **TypeScript**
- **React Query** — server state management
- **Supabase** — authentication and database
- **Lucide React Native** — icons

## Getting Started

```bash
# Install dependencies
bun install

# Start the dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Building for Production

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Project Structure

```
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/             # Tab navigation
│   ├── onboarding.tsx      # Onboarding flow
│   ├── profile-setup.tsx   # Profile setup
│   ├── settings.tsx        # Settings
│   └── _layout.tsx         # Root layout
├── components/             # Reusable components
├── contexts/               # React contexts (Auth, Theme, Fasting, etc.)
├── constants/              # Theme, colors, config
├── hooks/                  # Custom hooks
├── lib/                    # Supabase client, sync logic
├── mocks/                  # Static data (vedic data, knowledge)
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```
