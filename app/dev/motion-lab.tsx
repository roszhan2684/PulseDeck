import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MotionCard } from '@/components/motion';
import { Screen, ScreenHeader, SegmentedControl, Text } from '@/components/ui';
import {
  BurstSection,
  ButtonsSection,
  CardsSection,
  CountersSection,
  GestureSection,
  LoadingSection,
  ModalsSection,
  ReorderSection,
  SharedSection,
  SwipeSection,
} from '@/features/motion-lab/Sections';
import { SpringSection } from '@/features/motion-lab/SpringSection';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { useAppStore, type MotionPreference } from '@/store/appStore';
import { layout, space } from '@/theme';

function Section({ title, note, index, children }: { title: string; note: string; index: number; children: ReactNode }) {
  return (
    <MotionCard index={index} style={styles.card}>
      <Text variant="h3" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="caption" color="textMuted" style={{ marginBottom: space.md }}>
        {note}
      </Text>
      {children}
    </MotionCard>
  );
}

/** Developer route: every production motion primitive, with live tuning. */
export default function MotionLab() {
  const { width } = useWindowDimensions();
  const inner = Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2 - space.md * 2;
  const pref = useAppStore((s) => s.motionPreference);
  const setPref = useAppStore((s) => s.setMotionPreference);
  const reduced = useReducedMotionPref();
  const sections: [string, string, ReactNode][] = [
    ['Springs', 'Presets from theme/motion.ts. Drag the sliders, watch the curve, replay the real spring.', <SpringSection key="s" width={inner} />],
    ['Swipe physics', 'SwipeDeck with tunable threshold, release velocity and rotation.', <SwipeSection key="sw" width={inner} />],
    ['Reaction bursts', 'Playful spring + radial particles (particles off under reduced motion).', <BurstSection key="b" />],
    ['List reordering', 'Layout transitions move rows physically; digits roll.', <ReorderSection key="r" />],
    ['Shared transitions', 'Tap to expand from the thumbnail rect; drag down to dismiss.', <SharedSection key="sh" />],
    ['Counters', 'NumberFlow-style rolling digits.', <CountersSection key="c" />],
    ['Buttons', 'Snappy press scale, loading and disabled states.', <ButtonsSection key="bt" />],
    ['Cards', 'Staggered entrance and press feedback.', <CardsSection key="cd" />],
    ['Modals', 'Soft spring dialog and gesture sheet.', <ModalsSection key="m" />],
    ['Loading states', 'Skeletons and spring progress.', <LoadingSection key="l" />],
    ['Gesture interactions', 'Animated selection borders, pulse rings and chips.', <GestureSection key="g" />],
  ];
  return (
    <Screen>
      <ScreenHeader title="Motion Lab" subtitle={reduced ? 'Reduced motion active' : 'Full motion'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: space.xs }}>
          <Text variant="caption" color="textMuted">
            Motion preference
          </Text>
          <SegmentedControl<MotionPreference>
            value={pref}
            onChange={setPref}
            options={[
              { value: 'system', label: 'Match iOS' },
              { value: 'reduce', label: 'Reduced' },
              { value: 'full', label: 'Full' },
            ]}
          />
        </View>
        {sections.map(([title, note, node], i) => (
          <Section key={title} title={title} note={note} index={i}>
            {node}
          </Section>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, gap: space.md, paddingBottom: space.huge },
  card: { padding: space.md },
});
