import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const REVIEW_STATE_KEY = 'aayu_review_state';
const MIN_COMPLETED_FASTS = 1;
const DISMISS_COOLDOWN_MS = 30 * 24 * 3600_000; // 30 days

interface ReviewState {
  hasReviewed: boolean;
  lastDismissedAt: number | null;
  promptCount: number;
}

async function getState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { hasReviewed: false, lastDismissedAt: null, promptCount: 0 };
}

async function saveState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
}

export function useReviewPrompt(completedFastCount: number, streak: number) {
  const [visible, setVisible] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);

  useEffect(() => {
    getState().then(setReviewState);
  }, []);

  useEffect(() => {
    if (!reviewState) return;
    if (reviewState.hasReviewed) return;

    if (reviewState.lastDismissedAt) {
      const elapsed = Date.now() - reviewState.lastDismissedAt;
      if (elapsed < DISMISS_COOLDOWN_MS) return;
    }

    const eligible =
      completedFastCount >= MIN_COMPLETED_FASTS || streak >= 7;

    setVisible(eligible);
  }, [reviewState, completedFastCount, streak]);

  const handleReview = useCallback(async () => {
    setVisible(false);
    const next: ReviewState = {
      hasReviewed: true,
      lastDismissedAt: null,
      promptCount: (reviewState?.promptCount ?? 0) + 1,
    };
    setReviewState(next);
    await saveState(next);

    if (Platform.OS !== 'web' && await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
    }
  }, [reviewState]);

  const handleDismiss = useCallback(async () => {
    setVisible(false);
    const next: ReviewState = {
      hasReviewed: false,
      lastDismissedAt: Date.now(),
      promptCount: (reviewState?.promptCount ?? 0) + 1,
    };
    setReviewState(next);
    await saveState(next);
  }, [reviewState]);

  return { visible, handleReview, handleDismiss };
}
