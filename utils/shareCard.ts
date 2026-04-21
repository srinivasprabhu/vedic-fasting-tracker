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
