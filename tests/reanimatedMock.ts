/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Minimal Reanimated stand-in for component tests. Reanimated 4.7's bundled mock
 * boots the native initializer under jest-expo, so we render animated components
 * as plain views and make layout-animation builders chainable no-ops.
 */
const RN = require('react-native');

const chain: unknown = new Proxy(function () {}, { get: () => chain, apply: () => chain });
const passthrough = (v: unknown) => v;
const shared = (v: unknown) => ({ value: v, get: () => v, set: () => undefined });

module.exports = {
  __esModule: true,
  default: { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, FlatList: RN.FlatList, Image: RN.Image, createAnimatedComponent: passthrough },
  createAnimatedComponent: passthrough,
  useSharedValue: shared,
  useDerivedValue: (fn: () => unknown) => shared(fn()),
  useAnimatedStyle: () => ({}),
  useAnimatedScrollHandler: () => () => undefined,
  useAnimatedKeyboard: () => ({ height: shared(0), state: shared(0) }),
  useReducedMotion: () => false,
  withSpring: passthrough,
  withTiming: passthrough,
  withDelay: (_d: number, v: unknown) => v,
  withRepeat: passthrough,
  withSequence: (...v: unknown[]) => v[v.length - 1],
  interpolate: () => 0,
  interpolateColor: () => 'transparent',
  Extrapolation: { CLAMP: 'clamp' },
  Easing: new Proxy({}, { get: () => () => passthrough }),
  ReduceMotion: { System: 'system' },
  ...Object.fromEntries(
    ['FadeIn', 'FadeOut', 'FadeInDown', 'FadeInUp', 'FadeInLeft', 'FadeInRight', 'FadeOutUp', 'ZoomIn', 'ZoomOut', 'LinearTransition'].map((k) => [k, chain]),
  ),
};
