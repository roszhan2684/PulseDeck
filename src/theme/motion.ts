import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/**
 * PulseDeck motion system. Every animation constant in the app comes from here.
 * Screens never hard-code durations or spring configs.
 */
export const duration = {
  /** Press feedback, toggles. 100–160ms */
  instant: 130,
  /** Small state changes, fades. 160–220ms */
  fast: 190,
  /** Navigation, list items. 220–320ms */
  standard: 270,
  /** Modals, hero sequences. 320–450ms */
  large: 420,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  enter: Easing.bezier(0.05, 0.7, 0.1, 1),
  exit: Easing.bezier(0.3, 0, 0.8, 0.15),
  linear: Easing.linear,
} as const;

export type SpringName = 'snappy' | 'standard' | 'soft' | 'playful';

/** Buttons → snappy · Cards → standard · Modals → soft · Reactions → playful */
export const springs: Record<SpringName, WithSpringConfig> = {
  snappy: { damping: 20, stiffness: 420, mass: 0.8 },
  standard: { damping: 22, stiffness: 240, mass: 1 },
  soft: { damping: 26, stiffness: 150, mass: 1 },
  playful: { damping: 9, stiffness: 260, mass: 0.7 },
};

export const timings: Record<keyof typeof duration, WithTimingConfig> = {
  instant: { duration: duration.instant, easing: easing.standard },
  fast: { duration: duration.fast, easing: easing.standard },
  standard: { duration: duration.standard, easing: easing.standard },
  large: { duration: duration.large, easing: easing.enter },
};

/** Gesture tuning for the swipe deck and sheets. */
export const gesture = {
  swipeDistanceRatio: 0.28,
  swipeVelocity: 800,
  maxRotationDeg: 12,
  backCardScale: 0.92,
  backCardOffsetY: 18,
  exitMultiplier: 1.4,
  sheetDismissDistance: 120,
  sheetDismissVelocity: 900,
  doubleTapMaxDelayMs: 260,
  longPressMs: 320,
} as const;

export const press = { scale: 0.96, cardScale: 0.98 } as const;

/** Delay between staggered list items. */
export const stagger = 45;

/** Layout-animation presets that collapse to fades under reduced motion. */
export const presets = {
  enter: (reduced: boolean, index = 0) =>
    reduced
      ? FadeIn.duration(duration.fast)
      : FadeInDown.duration(duration.standard)
          .easing(easing.enter)
          .delay(Math.min(index, 8) * stagger)
          .withInitialValues({ transform: [{ translateY: 14 }] }),
  exit: () => FadeOut.duration(duration.fast),
  layout: (reduced: boolean) =>
    reduced ? LinearTransition.duration(0) : LinearTransition.springify().damping(22).stiffness(240),
};

export const motion = { duration, easing, springs, timings, gesture, press, stagger, presets };
