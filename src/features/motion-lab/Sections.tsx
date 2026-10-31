import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Shuffle } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AnimatedAvatar,
  AnimatedCounter,
  AnimatedListItem,
  AnimatedModal,
  AnimatedPressable,
  AnimatedProgressBar,
  MotionCard,
  ReactionBurst,
  SharedMediaTransition,
  SwipeDeck,
  type Burst,
  type MediaRect,
} from '@/components/motion';
import { Button, Chip, Sheet, Skeleton, Text } from '@/components/ui';
import { avatar, unsplash } from '@/lib/images';
import { colors, radii, space, tints } from '@/theme';
import { gesture } from '@/theme/motion';
import { REACTION_TYPES } from '@/types/domain';
import { MotionSlider } from './MotionSlider';

export function ButtonsSection() {
  return (
    <View style={styles.wrap}>
      <Button label="Primary" />
      <Button label="Lime" variant="lime" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Loading" loading />
      <Button label="Disabled" disabled />
      <Button label="Danger" variant="danger" size="sm" />
    </View>
  );
}

export function CardsSection() {
  const [run, setRun] = useState(0);
  return (
    <View style={{ gap: space.sm }} key={run}>
      {['Staggered entrance', 'Press for card spring', 'Layout-aware'].map((t, i) => (
        <MotionCard key={t} index={i} onPress={() => undefined} style={{ padding: space.md }}>
          <Text variant="bodyStrong">{t}</Text>
        </MotionCard>
      ))}
      <Button label="Replay stagger" variant="secondary" size="sm" onPress={() => setRun((r) => r + 1)} />
    </View>
  );
}

export function ModalsSection() {
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <View style={styles.wrap}>
      <Button label="AnimatedModal (soft)" variant="secondary" size="sm" onPress={() => setModal(true)} />
      <Button label="Sheet (drag to dismiss)" variant="secondary" size="sm" onPress={() => setSheet(true)} />
      <AnimatedModal visible={modal} onClose={() => setModal(false)}>
        <Text variant="h2">Soft spring</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: space.md }}>
          Scale 0.9 → 1 with the soft spring. Fades only under reduced motion.
        </Text>
        <Button label="Close" onPress={() => setModal(false)} />
      </AnimatedModal>
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Bottom sheet">
        <Text variant="body" color="textMuted">
          Drag the handle down. Releases faster than {gesture.sheetDismissVelocity}pt/s or past {gesture.sheetDismissDistance}pt dismiss it.
        </Text>
      </Sheet>
    </View>
  );
}

export function SwipeSection({ width }: { width: number }) {
  const [index, setIndex] = useState(0);
  const [cfg, setCfg] = useState<{ distanceRatio: number; velocity: number; maxRotation: number }>({ distanceRatio: gesture.swipeDistanceRatio, velocity: gesture.swipeVelocity, maxRotation: gesture.maxRotationDeg });
  const cards = tints.map((c, i) => ({ id: String(i), c }));
  return (
    <View style={{ gap: space.sm, alignItems: 'center' }}>
      <SwipeDeck
        data={cards}
        index={index}
        onIndexChange={setIndex}
        keyExtractor={(x) => x.id}
        width={width - 40}
        height={180}
        config={cfg}
        renderCard={(x, i) => (
          <LinearGradient colors={[x.c, colors.surface]} style={[StyleSheet.absoluteFill, styles.deckCard]}>
            <Text variant="h1">Card {i + 1}</Text>
          </LinearGradient>
        )}
      />
      <View style={{ alignSelf: 'stretch', gap: space.xs, marginTop: space.md }}>
        <MotionSlider label="threshold (× width)" value={cfg.distanceRatio} min={0.1} max={0.6} step={0.02} onChange={(distanceRatio) => setCfg((c) => ({ ...c, distanceRatio }))} />
        <MotionSlider label="velocity (pt/s)" value={cfg.velocity} min={200} max={2000} step={50} onChange={(velocity) => setCfg((c) => ({ ...c, velocity }))} />
        <MotionSlider label="max rotation (deg)" value={cfg.maxRotation} min={0} max={30} step={1} onChange={(maxRotation) => setCfg((c) => ({ ...c, maxRotation }))} />
      </View>
    </View>
  );
}

export function BurstSection() {
  const [burst, setBurst] = useState<Burst | null>(null);
  return (
    <View>
      <View style={styles.burstBox}>
        <ReactionBurst burst={burst} />
        <Text variant="caption" color="textSubtle">
          Tap an emoji
        </Text>
      </View>
      <View style={[styles.wrap, { justifyContent: 'space-between' }]}>
        {REACTION_TYPES.map((r) => (
          <AnimatedPressable key={r} onPress={() => setBurst({ id: Date.now(), emoji: r })} haptic="selection" scaleTo={1.2} accessibilityLabel={`Burst ${r}`} style={styles.emoji}>
            <Text style={{ fontSize: 26, lineHeight: 32 }}>{r}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

const NAMES = ['Maya', 'Tyler', 'Ava', 'Marcus', 'Chloe'];
export function ReorderSection() {
  const [rows, setRows] = useState(NAMES.map((n, i) => ({ n, score: 50 - i * 7 })));
  const shuffle = () => setRows((r) => [...r.map((x) => ({ ...x, score: x.score + Math.floor(Math.random() * 20) }))].sort((a, b) => b.score - a.score));
  return (
    <View style={{ gap: space.xs }}>
      {rows.map((r, i) => (
        <AnimatedListItem key={r.n} style={styles.listRow}>
          <Text variant="bodyStrong" color="textMuted" style={{ width: 24 }}>
            {i + 1}
          </Text>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {r.n}
          </Text>
          <AnimatedCounter value={r.score} variant="bodyStrong" />
        </AnimatedListItem>
      ))}
      <Button label="Score + reorder" icon={Shuffle} variant="secondary" size="sm" onPress={shuffle} />
    </View>
  );
}

export function SharedSection() {
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const [origin, setOrigin] = useState<MediaRect | null>(null);
  const uri = unsplash('1506905925346-21bda4d32df4', 1080);
  return (
    <View>
      <AnimatedPressable onPress={() => ref.current?.measureInWindow((x, y, width, height) => setOrigin({ x, y, width, height }))} accessibilityLabel="Expand image">
        <View ref={ref} collapsable={false} style={styles.thumb}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
      </AnimatedPressable>
      <SharedMediaTransition visible={!!origin} origin={origin} onClose={() => setOrigin(null)}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </SharedMediaTransition>
    </View>
  );
}

export function CountersSection() {
  const [n, setN] = useState(412);
  return (
    <View style={{ gap: space.sm }}>
      <AnimatedCounter value={n} variant="display" color="lime" />
      <View style={styles.wrap}>
        <Button label="+1" size="sm" variant="secondary" onPress={() => setN((v) => v + 1)} />
        <Button label="+25" size="sm" variant="secondary" onPress={() => setN((v) => v + 25)} />
        <Button label="Random" size="sm" variant="secondary" onPress={() => setN(Math.floor(Math.random() * 10000))} />
      </View>
    </View>
  );
}

export function LoadingSection() {
  const [p, setP] = useState(0.3);
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" />
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      <AnimatedProgressBar progress={p} />
      <Button label="Randomize progress" size="sm" variant="secondary" onPress={() => setP(Math.random())} />
    </View>
  );
}

export function GestureSection() {
  const [sel, setSel] = useState(1);
  const [chips, setChips] = useState<string[]>(['Pets']);
  const faces = ['1494790108377-be9c29b29330', '1507003211169-0a1dd7228f2d', '1438761681033-6461ffad8d80'];
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.wrap}>
        {faces.map((f, i) => (
          <AnimatedPressable key={f} onPress={() => setSel(i)} accessibilityLabel={`Select avatar ${i + 1}`}>
            <AnimatedAvatar uri={avatar(f)} size={64} selected={sel === i} pulse={i === 2} />
          </AnimatedPressable>
        ))}
      </View>
      <View style={styles.wrap}>
        {['Pets', 'Food', 'Gaming'].map((c) => (
          <Chip key={c} label={c} selected={chips.includes(c)} onPress={() => setChips((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
  deckCard: { alignItems: 'center', justifyContent: 'center' },
  burstBox: { height: 160, alignItems: 'center', justifyContent: 'center', borderRadius: radii.lg, backgroundColor: colors.surfaceSunken, marginBottom: space.sm },
  emoji: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: space.sm, borderRadius: radii.md, backgroundColor: colors.surfaceRaised },
  thumb: { width: 140, height: 180, borderRadius: radii.xl, overflow: 'hidden' },
});
