import { Easing, Keyframe, cubicBezier } from 'react-native-reanimated';

// Curves from the motion spec. Never ease-in on UI.
export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);

// The same curves as easing functions, for layout animations (entering/exiting) and withTiming.
// cubicBezier() above is for CSS transitions and keyframe animations only.
export const EASE_OUT_FN = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT_FN = Easing.bezier(0.77, 0, 0.175, 1);

/** Content arriving: settles up from 12px below while fading in. */
export const settleIn = (duration = 320) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.97 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_OUT_FN },
  }).duration(duration);

// Pebl's breath: inhale 4s, exhale 6s. Same rhythm as the device's haptic pulse.
export const INHALE_MS = 4000;
export const EXHALE_MS = 6000;
export const BREATH_MS = INHALE_MS + EXHALE_MS;
export const INHALE_PCT = `${(INHALE_MS / BREATH_MS) * 100}%`; // '40%'

export const colors = {
  black: '#000000',
  plum: '#120E14',
  ink: '#1C1C1E',
  pearl: '#F5F5F7',
  rose: '#F2C3CD',
  roseDeep: '#D98AA3',
  roseText: '#A0465B',
  cherry: '#8E1B33',
};
