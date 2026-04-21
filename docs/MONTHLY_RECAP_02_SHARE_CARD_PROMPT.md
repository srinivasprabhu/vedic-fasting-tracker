# Step 2: Shareable Summary Card

## What you're building

An Instagram-friendly square (1080×1080) image that the user can share to social media or messaging apps. This is generated on-device from the user's monthly report data, captured as a PNG, and handed to the OS share sheet.

**Why this matters:** Every share is a free brand impression. When someone posts "Just hit my 88 metabolic score on Aayu 🔥" on their Instagram story, their followers see it — and some of those followers become users. This is the single highest-leverage marketing channel you have, and it costs zero dollars.

## User flow

1. User is on the Monthly Recap screen (from step 1)
2. User taps "Share" button
3. A modal appears showing a preview of the square card (the actual image being shared)
4. User taps "Share to…" → iOS/Android share sheet opens
5. User picks Instagram, Messages, WhatsApp, etc.
6. Done

## File structure

Create these new files:

```
components/share/SummaryCard.tsx            — The visual card (rendered, then captured)
components/share/ShareSummaryModal.tsx      — Modal with preview + share button
utils/shareCard.ts                          — Capture-and-share logic
```

## Tech choice

Use `react-native-view-shot` to capture the card as a PNG. It's the standard library for this, works with both iOS and Android, and handles the React Native → image conversion via native views.

---

## Task 1: Install the dependency

```bash
npx expo install react-native-view-shot
```

No config plugin needed — it works with managed Expo via `expo-dev-client`. If the user is building with EAS, it will be picked up automatically on the next build.

---

## Task 2: Create `components/share/SummaryCard.tsx`

This is the visual card that gets captured as an image. It's a 1080×1080 square (or close to it — we'll render it at a smaller size on-screen but capture at 3x resolution for sharpness).

**Design goals:**
- Square aspect ratio (Instagram-friendly)
- Score as the hero element (huge, centered)
- Minimal text — this is a social share, not a report
- Aayu branding visible but not dominant
- Works on both dark and light mode (but we force dark theme for the share card because it looks better)

```tsx
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import type { MonthlyReportData } from '@/utils/monthly-report';

interface Props {
  data: MonthlyReportData;
}

const CARD_SIZE = 360; // Display size — captured at 3x for 1080×1080 output

const SummaryCard = forwardRef<View, Props>(({ data }, ref) => {
  // Score colour by tier (matches recap screen)
  const scoreColor =
    data.metabolicScore >= 85 ? '#7AAE79' :
    data.metabolicScore >= 70 ? '#e8a84c' :
    data.metabolicScore >= 50 ? '#E8913A' :
    '#B8A898';

  // Delta label (only shown when not baseline and we have previous month data)
  const delta = data.prevMonth ? data.metabolicScore - data.prevMonth.metabolicScore : null;
  const deltaLabel = data.isBaseline
    ? null
    : delta === null
    ? null
    : delta > 0
    ? `+${delta} from last month`
    : delta < 0
    ? `${delta} from last month`
    : null;

  // Ring geometry
  const ringSize = 200;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumf = 2 * Math.PI * ringRadius;
  const ringFill = ringCircumf * (data.metabolicScore / 100);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {/* Aayu branding — top left */}
      <View style={styles.brandRow}>
        <AayuLogoMark size={20} color="#c8872a" />
        <Text style={styles.brandText}>Aayu</Text>
      </View>

      {/* Month label */}
      <Text style={styles.monthLabel}>{data.monthLabel.toUpperCase()}</Text>

      {/* Hero score */}
      <View style={styles.scoreWrap}>
        <Svg width={ringSize} height={ringSize}>
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke="rgba(240,224,192,0.1)"
            strokeWidth={ringStroke}
            fill="none"
          />
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke={scoreColor}
            strokeWidth={ringStroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${ringFill} ${ringCircumf}`}
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
          />
        </Svg>

        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{data.metabolicScore}</Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>
      </View>

      <Text style={styles.scoreLabel}>{data.metabolicLabel}</Text>
      <Text style={styles.scoreSub}>Metabolic discipline score</Text>

      {deltaLabel && (
        <View style={[styles.deltaPill, { backgroundColor: delta! > 0 ? 'rgba(122,174,121,0.15)' : 'rgba(232,168,76,0.15)' }]}>
          <Text style={[styles.deltaText, { color: delta! > 0 ? '#7AAE79' : '#e8a84c' }]}>{deltaLabel}</Text>
        </View>
      )}

      {/* Stat row */}
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.completedFasts}</Text>
          <Text style={styles.statLabel}>Fasts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.avgFastDuration.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Avg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.bestStreak}d</Text>
          <Text style={styles.statLabel}>Best streak</Text>
        </View>
      </View>

      {/* Footer tag */}
      <Text style={styles.footer}>aayu.app</Text>
    </View>
  );
});

SummaryCard.displayName = 'SummaryCard';
export default SummaryCard;

// ─── Inline brand mark (matches the PDF logo) ────────────────────────────────
function AayuLogoMark({ size = 20, color = '#c8872a' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <G transform={`translate(48,48)`}>
        <Circle cx={0} cy={0} r={44} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <Path
            key={deg}
            d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z"
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            strokeOpacity={0.8}
            strokeLinejoin="round"
            transform={`rotate(${deg})`}
          />
        ))}
        <Path d="M0,-6 4.3,0 0,6 -4.3,0Z" fill={color} />
      </G>
    </Svg>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
// Hardcoded dark theme — share cards always render dark for social media contrast.
const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#0a0604',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  } as ViewStyle,
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 4,
  } as ViewStyle,
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c8872a',
    letterSpacing: 0.3,
  } as TextStyle,
  monthLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    color: '#8c7a6a',
    letterSpacing: 2,
    marginBottom: 22,
  } as TextStyle,
  scoreWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
  } as ViewStyle,
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  } as TextStyle,
  scoreMax: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8c7a6a',
    marginTop: -4,
  } as TextStyle,
  scoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0e0c0',
    marginTop: 14,
    letterSpacing: -0.3,
  } as TextStyle,
  scoreSub: {
    fontSize: 11,
    color: '#8c7a6a',
    marginTop: 3,
  } as TextStyle,
  deltaPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 12,
  } as ViewStyle,
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240,224,192,0.1)',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  } as ViewStyle,
  statItem: { alignItems: 'center', flex: 1 } as ViewStyle,
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0e0c0',
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: 10,
    color: '#8c7a6a',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(240,224,192,0.1)',
  } as ViewStyle,
  footer: {
    position: 'absolute',
    bottom: 16,
    fontSize: 10,
    color: '#5c4a3a',
    fontWeight: '600',
    letterSpacing: 1,
  } as TextStyle,
});
```

---

## Task 3: Create `utils/shareCard.ts`

The capture-and-share helper. Takes a ref to the card component, captures it as PNG at 3x scale (producing a 1080×1080 image), then passes to OS share sheet.

```typescript
// utils/shareCard.ts
// Capture the summary card as a PNG and share via OS share sheet.

import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { MutableRefObject } from 'react';
import type { View } from 'react-native';

export interface CaptureOptions {
  /** Display size of the card in the UI (e.g. 360). We capture at 3× for a 1080px output. */
  cardSize: number;
}

/**
 * Capture a View ref as a PNG image and return the file URI.
 * @param ref — React ref attached to the SummaryCard View
 * @param opts — capture options
 */
export async function captureSummaryCard(
  ref: MutableRefObject<View | null>,
  opts: CaptureOptions,
): Promise<string | null> {
  if (!ref.current) return null;
  try {
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      // Scale up so a 360px display card produces a ~1080px PNG
      width: opts.cardSize * 3,
      height: opts.cardSize * 3,
    });
    return uri;
  } catch (e) {
    if (__DEV__) console.warn('[captureSummaryCard] error:', e);
    return null;
  }
}

/**
 * Share the captured card via the OS share sheet.
 */
export async function shareCapturedCard(uri: string, monthLabel: string): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: `Aayu — ${monthLabel} recap`,
      UTI: 'public.png',
    });
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[shareCapturedCard] error:', e);
    return false;
  }
}
```

---

## Task 4: Create `components/share/ShareSummaryModal.tsx`

The modal that shows a preview of the card and a Share button. Opens from the Monthly Recap screen's Share button.

```tsx
import { fs } from '@/constants/theme';
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator,
  Platform, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import SummaryCard from './SummaryCard';
import { captureSummaryCard, shareCapturedCard } from '@/utils/shareCard';
import type { MonthlyReportData } from '@/utils/monthly-report';
import type { ColorScheme } from '@/constants/colors';
import type { View as RNView } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  data: MonthlyReportData | null;
}

const CARD_DISPLAY_SIZE = 360;

export default function ShareSummaryModal({ visible, onClose, data }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const cardRef = useRef<RNView | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharing(true);
    try {
      const uri = await captureSummaryCard(cardRef, { cardSize: CARD_DISPLAY_SIZE });
      if (!uri) {
        setSharing(false);
        return;
      }
      const shared = await shareCapturedCard(uri, data.monthLabel);
      if (shared) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setSharing(false);
    }
  }, [data]);

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Share your month</Text>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.preview}>
          <SummaryCard ref={cardRef} data={data} />
        </View>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Share to Instagram, WhatsApp, or wherever you connect with friends.
        </Text>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary, opacity: sharing ? 0.7 : 1 }]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Share2 size={18} color="#fff" />
                <Text style={styles.shareLabel}>Share to…</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    } as ViewStyle,
    title: { fontSize: fs(18), fontWeight: '700' } as TextStyle,
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    } as ViewStyle,
    preview: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    } as ViewStyle,
    hint: {
      fontSize: fs(13),
      textAlign: 'center',
      paddingHorizontal: 32,
      marginTop: 16,
      lineHeight: 18,
    } as TextStyle,
    actionBar: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 8 : 20,
    } as ViewStyle,
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 14,
    } as ViewStyle,
    shareLabel: { fontSize: fs(15), fontWeight: '700', color: '#fff' } as TextStyle,
  });
}
```

---

## Task 5: Wire the Share button in the recap screen

In `app/monthly-recap.tsx` (from step 1), import the modal and wire it up:

```typescript
import ShareSummaryModal from '@/components/share/ShareSummaryModal';
```

Add modal visibility state inside the component:
```typescript
const [shareModalVisible, setShareModalVisible] = useState(false);
```

Replace the `handleShareSummary` function body (which was a placeholder):

```typescript
const handleShareSummary = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setShareModalVisible(true);
}, []);
```

Add the modal at the end of the JSX, after the `</SafeAreaView>`:

```tsx
<ShareSummaryModal
  visible={shareModalVisible}
  onClose={() => setShareModalVisible(false)}
  data={data}
/>
```

---

## Verification checklist

- [ ] `npx expo install react-native-view-shot` succeeded
- [ ] Rebuild the dev client (`npx expo prebuild --clean && npx expo run:ios --device`) — view-shot needs native code
- [ ] Open the Monthly Recap screen
- [ ] Tap "Share" → modal slides up showing the summary card preview
- [ ] Card shows: Aayu logo, month label, score ring, "Strong Foundation"-style label, delta pill, 3-stat row, "aayu.app" footer
- [ ] Card is a dark theme (always, regardless of user's theme preference)
- [ ] Tap "Share to…" → OS share sheet opens with a PNG
- [ ] Share to Photos → saved image is ~1080×1080 (or 3× whatever CARD_DISPLAY_SIZE is)
- [ ] Share to Messages → friend receives a crisp square image
- [ ] Share to Instagram Stories → the card fills the frame nicely

## What this step does NOT do

- It does NOT add the push notification (step 3)
- It does NOT change the PDF (step 4)
- It does NOT add the blurred preview paywall (step 5)

## Notes on design

The card intentionally uses hardcoded dark theme colours (`#0a0604`, `#f0e0c0`, `#c8872a`) rather than theme tokens because:
1. Social media feeds are mostly dark — a dark card with warm accent stands out
2. The card must look identical on every device regardless of the user's theme setting
3. The brand identity should be consistent across every share

Do NOT use theme tokens for the SummaryCard — it's a branded asset, not a themed UI surface.
