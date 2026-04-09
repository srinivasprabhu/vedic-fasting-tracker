/**
 * useReducedMotion - Accessibility hook for respecting user's motion preferences
 *
 * Returns true when the user has enabled "Reduce Motion" in their device settings.
 * Use this to disable or simplify animations for users who are sensitive to motion.
 *
 * Usage:
 *   const reduceMotion = useReducedMotion();
 *   Animated.timing(anim, { duration: reduceMotion ? 0 : 300, ... });
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReduceMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Helper to get animation duration based on reduced motion preference
 * Returns 0 if reduce motion is enabled, otherwise returns the provided duration
 */
export function getAnimationDuration(duration: number, reduceMotion: boolean): number {
  return reduceMotion ? 0 : duration;
}

/**
 * Helper to get animation config that respects reduced motion
 */
export function getAnimationConfig(
  config: { duration: number; [key: string]: any },
  reduceMotion: boolean
): { duration: number; [key: string]: any } {
  return {
    ...config,
    duration: reduceMotion ? 0 : config.duration,
  };
}
