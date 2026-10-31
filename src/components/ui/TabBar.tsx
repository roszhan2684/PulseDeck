import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Tabs } from 'expo-router';
import { House, MessageCircle, Plus, User, Users } from 'lucide-react-native';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { colors, gradients, radii, shadows, space } from '@/theme';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { MotionTabIndicator } from '../motion/MotionTabIndicator';
import { Text } from './Text';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, { Icon: typeof House; label: string }> = {
  index: { Icon: House, label: 'Home' },
  groups: { Icon: Users, label: 'Groups' },
  chat: { Icon: MessageCircle, label: 'Chat' },
  profile: { Icon: User, label: 'Profile' },
};
const SLOTS = 5; // 4 tabs + center "post" action

/** Floating blurred tab bar with a spring indicator and a center post action. */
export function TabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / SLOTS;
  const slotFor = (i: number) => (i >= 2 ? i + 1 : i);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]} pointerEvents="box-none">
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <MotionTabIndicator index={slotFor(state.index)} itemWidth={slot} height={48} inset={8} color={colors.primaryMuted} style={{ top: 8 }} />
        {state.routes.map((route, i) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const onPress = () => {
            if (focused) return;
            haptics.selection();
            navigateToTab(route.key);
          };
          return (
            <View key={route.key} style={[styles.slot, i === 2 && { marginLeft: slot }]}>
              <Pressable onPress={onPress} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={meta.label}>
                <meta.Icon size={22} color={focused ? colors.text : colors.textSubtle} strokeWidth={focused ? 2.4 : 2} />
                <Text variant="caption" color={focused ? 'text' : 'textSubtle'} style={{ fontSize: 10 }}>
                  {meta.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
        <View style={[styles.center, { left: slot * 2, width: slot }]} pointerEvents="box-none">
          <AnimatedPressable onPress={() => router.push('/challenge/submit')} haptic="medium" accessibilityLabel="Answer today’s challenge" style={styles.post}>
            <LinearGradient colors={gradients.pulse} style={StyleSheet.absoluteFill} />
            {/* Wrapped so it stacks above the absolute gradient on web, too. */}
            <View>
              <Plus size={26} color={colors.white} strokeWidth={2.6} />
            </View>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md },
  bar: { flexDirection: 'row', height: 64, borderRadius: radii.xxl, overflow: 'hidden', backgroundColor: 'rgba(19,19,28,0.72)', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, ...shadows.md },
  slot: { flex: 1 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  post: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', ...shadows.glow },
});
