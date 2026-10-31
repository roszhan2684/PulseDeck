import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, Button, Text } from '@/components/ui';
import { useAuthActions } from '@/features/auth/session';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { unsplash } from '@/lib/images';
import { useAppStore } from '@/store/appStore';
import { colors, gradients, layout, radii, shadows, space } from '@/theme';
import { duration, easing } from '@/theme/motion';

const HERO_HEIGHT = 330;

const cards = [
  { id: '1543466835-00a7907e9de1', rotate: -12, x: -0.26, y: 30, label: '🐶 Most dramatic pet' },
  { id: '1567620905732-2d1ec7ab7445', rotate: 9, x: 0.24, y: 0, label: '🥞 Breakfast under $10' },
  { id: '1518455027359-f3f8164ba6bd', rotate: -2, x: 0, y: 90, label: '🖥️ Worst desk setup' },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotionPref();
  const { demo, isDemo } = useAuthActions();
  const status = useAppStore((s) => s.authStatus);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const [heroSpace, setHeroSpace] = useState(HERO_HEIGHT);
  // The card collage is 330pt tall; shrink it on short screens instead of overlapping the copy.
  const heroScale = Math.min(1, Math.max(0.55, heroSpace / HERO_HEIGHT));
  if (status === 'signedIn' && !hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['rgba(124,92,255,0.28)', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.hero, { paddingTop: insets.top + space.lg }]} onLayout={(e) => setHeroSpace(e.nativeEvent.layout.height - insets.top - space.lg)}>
        <View style={[styles.collage, { transform: [{ scale: heroScale }] }]}>
          {cards.map((c, i) => (
            <FloatingCard key={c.id} index={i} reduced={reduced} style={{ transform: [{ translateX: c.x * width }, { translateY: c.y }, { rotate: `${c.rotate}deg` }] }} uri={unsplash(c.id, 500, 640)} label={c.label} />
          ))}
        </View>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(duration.large).easing(easing.enter).delay(200)} style={{ gap: space.sm }}>
          <View style={styles.brand}>
            <BrandMark size={34} />
            <Text variant="h3">PulseDeck</Text>
          </View>
          <Text variant="display">Tiny daily challenges for your favorite people.</Text>
          <Text variant="body" color="textMuted">
            One prompt a day. Post in 30 seconds. Vote, react, and keep the streak alive.
          </Text>
        </Animated.View>
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(duration.large).easing(easing.enter).delay(360)} style={{ gap: space.sm, marginTop: space.lg }}>
          <Button label="Create account" size="lg" fullWidth onPress={() => router.push('/signup')} />
          <Button label="I already have an account" variant="secondary" size="lg" fullWidth onPress={() => router.push('/login')} />
          {isDemo && <Button label="Explore the demo crew →" variant="ghost" fullWidth loading={demo.isPending} onPress={() => demo.mutate()} accessibilityHint="Signs in as Jordan with sample data" />}
        </Animated.View>
      </View>
    </View>
  );
}

function FloatingCard({ uri, label, index, reduced, style }: { uri: string; label: string; index: number; reduced: boolean; style: object }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!reduced) y.set(withDelay(index * 400, withRepeat(withSequence(withTiming(-10, { duration: 2200 }), withTiming(0, { duration: 2200 })), -1)));
  }, [index, reduced, y]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  // Static tilt/offset lives on a plain View; the entrance and the bob animate nested views,
  // so a layout animation never overwrites the transform.
  return (
    <View style={[styles.cardWrap, style]}>
      <Animated.View entering={reduced ? undefined : FadeInDown.springify().damping(16).delay(index * 120)}>
        <Animated.View style={[styles.card, bob]}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} accessibilityIgnoresInvertColors />
          <LinearGradient colors={gradients.mediaFade} style={StyleSheet.absoluteFill} />
          <Text variant="caption" style={styles.cardLabel}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { flex: 1, alignItems: 'center' },
  collage: { width: '100%', height: HERO_HEIGHT, alignItems: 'center', transformOrigin: 'top' },
  cardWrap: { position: 'absolute', top: 10 },
  card: { width: 170, height: 220, borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', ...shadows.md },
  cardLabel: { position: 'absolute', left: space.sm, right: space.sm, bottom: space.sm, fontFamily: 'Inter_600SemiBold' },
  bottom: { paddingHorizontal: layout.screenPadding },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs },
});
