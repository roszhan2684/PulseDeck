import { CircleCheck, CloudUpload, RotateCcw, Sparkles, WandSparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AnimatedProgressBar, ReactionBurst } from '@/components/motion';
import { Button, Text } from '@/components/ui';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { errorCopy } from '@/lib/errors';
import { colors, gradients, space } from '@/theme';
import { presets, springs } from '@/theme/motion';
import type { UploadState } from './useFeed';

const copy = {
  preparing: { Icon: WandSparkles, title: 'Preparing your post', body: 'Compressing so it uploads fast.' },
  uploading: { Icon: CloudUpload, title: 'Uploading', body: 'Keep the app open for a sec.' },
  processing: { Icon: Sparkles, title: 'Almost there', body: 'Adding it to the deck.' },
};

export interface UploadStatusProps {
  state: Exclude<UploadState, { phase: 'idle' }>;
  onRetry: () => void;
  onCancel: () => void;
  onViewDeck: () => void;
  onDone: () => void;
}

/** Every upload phase is explained. No unlabeled spinners. */
export function UploadStatus({ state, onRetry, onCancel, onViewDeck, onDone }: UploadStatusProps) {
  const reduced = useReducedMotionPref();
  if (state.phase === 'success') return <Success onViewDeck={onViewDeck} onDone={onDone} />;
  if (state.phase === 'failure') {
    const c = errorCopy[state.error.kind === 'upload' || state.error.kind === 'network' ? 'upload' : state.error.kind];
    return (
      <Animated.View entering={presets.enter(reduced)} style={styles.wrap} accessibilityRole="alert">
        <View style={[styles.icon, { backgroundColor: colors.dangerMuted }]}>
          <RotateCcw size={30} color={colors.danger} />
        </View>
        <Text variant="h2" align="center">
          {c.title}
        </Text>
        <Text variant="body" color="textMuted" align="center">
          {c.message}
        </Text>
        <Button label="Retry upload" icon={RotateCcw} size="lg" fullWidth onPress={onRetry} />
        <Button label="Edit post" variant="ghost" fullWidth onPress={onCancel} />
      </Animated.View>
    );
  }
  const { Icon, title, body } = copy[state.phase];
  const overall = state.phase === 'preparing' ? 0.08 : state.phase === 'uploading' ? 0.1 + state.progress * 0.75 : 0.95;
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite" accessibilityLabel={`${title}, ${Math.round(overall * 100)} percent`}>
      <View style={styles.icon}>
        <Icon size={30} color={colors.primary} />
      </View>
      <Text variant="h2" align="center">
        {title}
      </Text>
      <Text variant="body" color="textMuted" align="center">
        {body}
      </Text>
      <View style={styles.bar}>
        <AnimatedProgressBar progress={overall} height={8} accessibilityLabel="Upload progress" />
        <Text variant="caption" color="textSubtle" align="right">
          {Math.round(overall * 100)}%
        </Text>
      </View>
    </View>
  );
}

function Success({ onViewDeck, onDone }: { onViewDeck: () => void; onDone: () => void }) {
  const reduced = useReducedMotionPref();
  const s = useSharedValue(0);
  const [burst] = useState(() => ({ id: Date.now(), emoji: '🔥' }));
  useEffect(() => {
    s.set(withSpring(1, springs.playful));
  }, [s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: reduced ? 1 : s.get() }], opacity: Math.min(1, s.get() * 2) }));
  return (
    <View style={styles.wrap}>
      <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.success, style]}>
          <CircleCheck size={56} color={colors.textInverse} strokeWidth={2.4} />
        </Animated.View>
        <ReactionBurst burst={burst} size={80} particles={8} />
      </View>
      <Text variant="display" align="center">
        Posted!
      </Text>
      <Text variant="body" color="textMuted" align="center">
        Streak extended. Now go see what everyone else did.
      </Text>
      <Button label="See the deck" size="lg" fullWidth onPress={onViewDeck} />
      <Button label="Done" variant="ghost" fullWidth onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.sm },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  bar: { alignSelf: 'stretch', gap: space.xs, marginTop: space.lg },
  success: { width: 104, height: 104, borderRadius: 52, backgroundColor: gradients.lime[0], alignItems: 'center', justifyContent: 'center' },
});
