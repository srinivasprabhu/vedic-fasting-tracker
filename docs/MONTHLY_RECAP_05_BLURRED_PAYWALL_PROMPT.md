# Step 5: Blurred PDF Preview Paywall

## What you're building

When a free user taps "Unlock full report" on the Monthly Recap screen (step 1), instead of going directly to the RevenueCat paywall, they first see a preview screen showing a blurred thumbnail of the PDF's first page — with a legible teaser at the top and a blur overlay across the rest. The "Unlock Pro" button at the bottom presents the paywall.

**Why this matters:** Free users currently see a generic "Get a detailed analysis" message. They have no idea what's actually in the PDF. By showing them the real first page (blurred but recognisable), we create concrete curiosity. They can see it's a real, polished report — not marketing copy.

## User flow

1. Free user is on the Monthly Recap screen (step 1)
2. Taps "Unlock full report" button
3. Modal slides up showing the blurred PDF preview
4. Top third is sharp and readable: "Your full report includes…" + 3 bullet points
5. Bottom two-thirds shows a blurred first-page thumbnail
6. "Unlock Aayu Pro" button at the bottom
7. Tap → existing RevenueCat paywall flow → on success, modal dismisses and the PDF generates

## Design decisions

- **Not a separate page** — it's a modal that sits on top of the Monthly Recap screen, so the user can easily dismiss and return to the recap
- **Static mockup image, not a real PDF render** — generating a real PDF thumbnail is expensive and adds complexity. We use a pre-designed preview image that represents what page 1 typically looks like
- **Blur intensity matches iOS native blur** — readable enough to see structure, not readable enough to read details
- **Pro user case:** If the user somehow lands here as a Pro user (e.g. entitlement state race condition), bypass the modal and go straight to PDF generation

---

## Task 1: Create the preview asset

You need a static PNG image that represents a blurred PDF first page. Two options:

**Option A (recommended):** Generate a real PDF preview once, screenshot its first page, apply a heavy blur in an image editor, save as `assets/images/pdf-preview-blurred.png`. This is the most authentic approach.

**Option B:** Design a representative mockup in Figma showing the typical layout structure (score ring, stat tiles, breakdown bars) with generic numbers, export as PNG, and blur it.

Target specs:
- PNG format, ~800px wide × 1100px tall (A4-ish ratio)
- Pre-blurred with ~25px Gaussian blur
- Dark theme background matching the PDF
- File saved at `assets/images/pdf-preview-blurred.png`

**Alternative if you don't want to create an asset right now:** render a View-based mockup on-the-fly using the user's actual data. See Task 3 below for this approach.

---

## Task 2: Create `components/paywall/PdfPreviewModal.tsx`

```tsx
import { fs } from '@/constants/theme';
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image,
  ScrollView, ViewStyle, TextStyle, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Lock, Check, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
  monthLabel: string;
}

const TEASER_BULLETS = [
  { icon: 'rhythm', text: 'Your daily rhythm map — exact start & break times' },
  { icon: 'behavior', text: 'Behaviour intelligence — weekend drop-off, recovery rate' },
  { icon: 'progression', text: 'Month-over-month progression with projected score' },
  { icon: 'prescription', text: 'Personalised next-month plan — 4 specific actions' },
];

export default function PdfPreviewModal({ visible, onClose, onUnlock, monthLabel }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const handleUnlock = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock();
  }, [onUnlock]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>AAYU PRO</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your full {monthLabel} report</Text>
          </View>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Teaser bullets (SHARP — the readable part) */}
          <View style={[styles.teaserCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.teaserHeader, { color: colors.text }]}>What's inside</Text>
            {TEASER_BULLETS.map((b, i) => (
              <View key={i} style={styles.teaserRow}>
                <View style={[styles.teaserCheck, { backgroundColor: colors.successLight }]}>
                  <Check size={12} color={colors.success} />
                </View>
                <Text style={[styles.teaserText, { color: colors.textSecondary }]}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Blurred PDF preview (THE TEASE) */}
          <View style={styles.previewWrap}>
            <Text style={[styles.previewLabel, { color: colors.textMuted }]}>PAGE 1 PREVIEW</Text>
            <View style={styles.previewImageWrap}>
              <Image
                source={require('@/assets/images/pdf-preview-blurred.png')}
                style={styles.previewImage}
                resizeMode="cover"
                blurRadius={Platform.OS === 'ios' ? 8 : 12}
              />
              {/* Dark vignette overlay at bottom to transition into the lock CTA */}
              <View style={styles.previewFade} pointerEvents="none" />
              {/* Lock icon overlay centred */}
              <View style={styles.lockOverlay} pointerEvents="none">
                <View style={[styles.lockCircle, { backgroundColor: colors.primary }]}>
                  <Lock size={28} color="#fff" />
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.trustLine, { color: colors.textMuted }]}>
            5 pages · personalised insights · PDF you can save and share
          </Text>
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
            onPress={handleUnlock}
            activeOpacity={0.85}
          >
            <Lock size={15} color="#fff" />
            <Text style={styles.unlockLabel}>Unlock Aayu Pro</Text>
          </TouchableOpacity>
          <Text style={[styles.fineprint, { color: colors.textMuted }]}>
            Cancel anytime from Settings. Restores across devices.
          </Text>
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
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 18,
    } as ViewStyle,
    headerTextCol: { flex: 1 } as ViewStyle,
    eyebrow: {
      fontSize: fs(10),
      fontWeight: '800',
      letterSpacing: 1.5,
      marginBottom: 4,
    } as TextStyle,
    title: {
      fontSize: fs(20),
      fontWeight: '700',
      letterSpacing: -0.3,
    } as TextStyle,
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    } as ViewStyle,
    scroll: { flex: 1 } as ViewStyle,
    scrollContent: { paddingHorizontal: 20, paddingBottom: 120 } as ViewStyle,
    teaserCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 18,
      marginBottom: 20,
    } as ViewStyle,
    teaserHeader: {
      fontSize: fs(15),
      fontWeight: '700',
      marginBottom: 14,
    } as TextStyle,
    teaserRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    } as ViewStyle,
    teaserCheck: {
      width: 22, height: 22, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
      marginTop: 1,
    } as ViewStyle,
    teaserText: { fontSize: fs(13), lineHeight: 19, flex: 1 } as TextStyle,
    previewWrap: { alignItems: 'center', marginBottom: 16 } as ViewStyle,
    previewLabel: {
      fontSize: fs(10),
      fontWeight: '700',
      letterSpacing: 1.5,
      marginBottom: 10,
    } as TextStyle,
    previewImageWrap: {
      width: '100%',
      aspectRatio: 210 / 297, // A4 ratio
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.card,
      position: 'relative',
    } as ViewStyle,
    previewImage: {
      width: '100%',
      height: '100%',
    },
    previewFade: {
      position: 'absolute',
      left: 0, right: 0, bottom: 0,
      height: '30%',
      backgroundColor: colors.background,
      opacity: 0.75,
    } as ViewStyle,
    lockOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    lockCircle: {
      width: 64, height: 64, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center',
    } as ViewStyle,
    trustLine: {
      fontSize: fs(12),
      textAlign: 'center',
      marginTop: 4,
    } as TextStyle,
    actionBar: {
      position: 'absolute',
      left: 0, right: 0, bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'ios' ? 28 : 18,
      borderTopWidth: 1,
    } as ViewStyle,
    unlockBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 14,
    } as ViewStyle,
    unlockLabel: {
      fontSize: fs(15),
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.2,
    } as TextStyle,
    fineprint: {
      fontSize: fs(11),
      textAlign: 'center',
      marginTop: 8,
    } as TextStyle,
  });
}
```

---

## Task 3: (Alternative) Render a live mockup instead of using a static asset

If you don't want to create the static blurred PNG, you can render the blurred preview using the user's actual report data. Replace the `<Image>` element with a View-based mockup:

```tsx
import { Flame, Clock, TrendingUp } from 'lucide-react-native';

// Inside the component, receive additional props:
interface Props {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
  monthLabel: string;
  score: number;         // NEW
  completedFasts: number; // NEW
}

// Replace <Image> with a scaled-down dark card:
<View style={styles.mockupCard}>
  <Text style={styles.mockupHeader}>AAYU</Text>
  <Text style={styles.mockupScoreLabel}>METABOLIC SCORE</Text>
  <Text style={styles.mockupScoreValue}>{score}</Text>
  <Text style={styles.mockupSubLabel}>Strong Foundation</Text>
  {/* Fake bars */}
  <View style={styles.mockupBars}>
    <View style={styles.mockupBar} />
    <View style={styles.mockupBar} />
    <View style={styles.mockupBar} />
    <View style={styles.mockupBar} />
  </View>
  {/* Fake stat row */}
  <View style={styles.mockupStats}>
    <View style={styles.mockupStat}>
      <Flame size={14} color="#c8872a" />
      <Text style={styles.mockupStatValue}>{completedFasts}</Text>
    </View>
    <View style={styles.mockupStat}>
      <Clock size={14} color="#c8872a" />
      <Text style={styles.mockupStatValue}>--h</Text>
    </View>
    <View style={styles.mockupStat}>
      <TrendingUp size={14} color="#c8872a" />
      <Text style={styles.mockupStatValue}>--d</Text>
    </View>
  </View>
  {/* Lorem-ipsum placeholder lines */}
  <View style={styles.mockupLines}>
    <View style={[styles.mockupLine, { width: '80%' }]} />
    <View style={[styles.mockupLine, { width: '65%' }]} />
    <View style={[styles.mockupLine, { width: '70%' }]} />
  </View>
</View>
```

Add these styles with hardcoded dark-theme colours (NOT using `colors` tokens because the mockup should look like the PDF):

```typescript
mockupCard: {
  width: '100%',
  aspectRatio: 210 / 297,
  borderRadius: 16,
  backgroundColor: '#1a1008',
  padding: 24,
  overflow: 'hidden',
} as ViewStyle,
mockupHeader: { color: '#c8872a', fontSize: 14, fontWeight: '700', letterSpacing: 2 } as TextStyle,
mockupScoreLabel: { color: '#8c7a6a', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginTop: 24 } as TextStyle,
mockupScoreValue: { color: '#c8872a', fontSize: 72, fontWeight: '800', marginTop: 8, letterSpacing: -2 } as TextStyle,
mockupSubLabel: { color: '#f0e0c0', fontSize: 16, fontWeight: '700', marginTop: 4 } as TextStyle,
mockupBars: { marginTop: 18, gap: 8 } as ViewStyle,
mockupBar: { height: 6, backgroundColor: '#c8872a', borderRadius: 3, opacity: 0.6, width: '70%' } as ViewStyle,
mockupStats: { flexDirection: 'row', gap: 16, marginTop: 20 } as ViewStyle,
mockupStat: { flexDirection: 'row', alignItems: 'center', gap: 4 } as ViewStyle,
mockupStatValue: { color: '#f0e0c0', fontSize: 12, fontWeight: '700' } as TextStyle,
mockupLines: { marginTop: 18, gap: 6 } as ViewStyle,
mockupLine: { height: 8, backgroundColor: '#4a3020', borderRadius: 4 } as ViewStyle,
```

Then the `blurRadius` on the parent `<View>` (or a child `<Image>` wrapper using `expo-blur`) provides the blur effect.

**Note:** Applying `blurRadius` directly on a View is not supported in React Native. For the live-mockup approach, either:
1. Wrap the mockup in `<BlurView intensity={80} style={StyleSheet.absoluteFill}>` from `expo-blur` and position the mockup as an absolute background, OR
2. Accept that the mockup is sharp and rely on the lock icon + CTA to carry the "gated content" message visually

For simplicity, **recommend option A (static PNG asset).** It gives you a real PDF-styled look with proper blur, no `expo-blur` complexity.

---

## Task 4: Wire the modal into the Monthly Recap screen

**File:** `app/monthly-recap.tsx` (from step 1)

Add imports:
```typescript
import PdfPreviewModal from '@/components/paywall/PdfPreviewModal';
```

Add state:
```typescript
const [previewModalVisible, setPreviewModalVisible] = useState(false);
```

Find the existing `handleDownloadPdf` function. Modify it so that free users open the preview modal instead of the paywall directly:

```typescript
const handleDownloadPdf = useCallback(async () => {
  if (!data || !profile) return;

  // Free users: show the blurred preview modal first
  if (!isProUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewModalVisible(true);
    return;
  }

  // Pro users: go straight to PDF generation (existing logic)
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setGeneratingPdf(true);

  try {
    const Print = await import('expo-print');
    const html = buildReportHTML(data);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await markReportGenerated(data.month, data.year);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Aayu Report — ${data.monthLabel}`,
        UTI: 'com.adobe.pdf',
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    console.warn('[MonthlyRecap] PDF error:', e);
    Alert.alert('Error', 'Could not generate the PDF. Please try again.');
  } finally {
    setGeneratingPdf(false);
  }
}, [data, profile, isProUser]);
```

Add a handler for "Unlock" inside the modal — it closes the preview modal and presents the paywall:

```typescript
const handlePreviewUnlock = useCallback(async () => {
  setPreviewModalVisible(false);
  // Small delay so the modal fully dismisses before the paywall presents
  setTimeout(() => {
    void presentPaywall();
  }, 250);
}, [presentPaywall]);
```

Add the modal to the JSX after `ShareSummaryModal` (or wherever your modals live):

```tsx
{data && (
  <PdfPreviewModal
    visible={previewModalVisible}
    onClose={() => setPreviewModalVisible(false)}
    onUnlock={handlePreviewUnlock}
    monthLabel={data.monthLabel}
  />
)}
```

---

## Task 5: Handle post-purchase refresh

When the user completes the paywall and becomes Pro, the modal won't be visible anymore (we dismissed it before presenting the paywall). On return to the recap screen, the "Unlock full report" button in `RecapActionButtons` should now read "Download full report" automatically because `isProUser` is reactive.

**But** — if the user purchased Pro inside the modal flow, they'd probably expect the PDF to auto-generate right after. This is optional polish:

```typescript
// In the Monthly Recap screen, add this effect:
const prevIsProUserRef = useRef(isProUser);
useEffect(() => {
  // Detect the transition from free → Pro
  if (!prevIsProUserRef.current && isProUser && previewModalVisible === false) {
    // User just became Pro and the preview modal was recently closed
    // Auto-trigger the PDF generation
    void handleDownloadPdf();
  }
  prevIsProUserRef.current = isProUser;
}, [isProUser, previewModalVisible, handleDownloadPdf]);
```

This is a nice-to-have. Skip it if it feels like too much wiring.

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Free user: tap "Unlock full report" → preview modal slides up (not the paywall directly)
- [ ] Modal shows: eyebrow "AAYU PRO", title with month label, 4 bullet points, blurred preview image, lock icon overlay, "Unlock Aayu Pro" button, fineprint
- [ ] Blurred preview is readable enough to see structure but not details
- [ ] Close (X) dismisses the modal without paywall
- [ ] Tap "Unlock Aayu Pro" → modal dismisses → paywall appears
- [ ] Complete paywall purchase → return to recap screen → button now reads "Download full report"
- [ ] (If Task 5 done) PDF auto-generates after purchase completes
- [ ] Pro user: tap "Download full report" → PDF generates directly, NO preview modal shown
- [ ] Toggle dev Pro override → behaviour flips accordingly

## What this step does NOT do

- Does NOT change the paywall itself (that's RevenueCat's UI)
- Does NOT add any new RevenueCat products or pricing
- Does NOT change the recap screen layout (step 1 is untouched)
- Does NOT change the share card (step 2) or notification (step 3) or PDF (step 4)

## Design notes

The preview modal is the single most important conversion touchpoint in the app. A few principles to keep in mind:

- **Show concrete value, not generic promises.** The bullet points should reference specific features ("daily rhythm map", "weekend drop-off") not vague ones ("advanced analytics")
- **The blur must be convincing.** Too sharp and users feel they've already seen it. Too blurry and it looks broken. The ~25px Gaussian blur from Task 1 is a good default.
- **Keep fineprint brief.** Users reading fine print are shopping for reasons to not convert. "Cancel anytime. Restores across devices." is enough.
- **Don't add testimonials or social proof in this modal.** That belongs in the paywall itself, not the preview gate. Each screen should have one job.
