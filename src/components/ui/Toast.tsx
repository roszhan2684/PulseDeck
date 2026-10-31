import { CircleAlert, CircleCheck, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { useToastStore, type ToastTone } from '@/store/toastStore';
import { colors, radii, shadows, space } from '@/theme';
import { presets } from '@/theme/motion';
import { Text } from './Text';

const icons: Record<ToastTone, { Icon: typeof Info; color: string }> = {
  info: { Icon: Info, color: colors.info },
  success: { Icon: CircleCheck, color: colors.success },
  error: { Icon: CircleAlert, color: colors.danger },
};

/** Renders toasts from the global toast store. Mount once at the root. Announced to screen readers. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotionPref();
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + space.xs }]}>
      {toasts.map((t) => {
        const { Icon, color } = icons[t.tone];
        return (
          <Animated.View
            key={t.id}
            entering={reduced ? FadeIn : FadeInUp.springify().damping(18)}
            exiting={reduced ? FadeOut : FadeOutUp}
            layout={presets.layout(reduced)}
            style={styles.toast}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Pressable onPress={() => dismiss(t.id)} style={styles.row} accessibilityLabel={`${t.title}. ${t.message ?? ''}`}>
              <Icon size={20} color={color} />
              <View style={styles.body}>
                <Text variant="bodyStrong">{t.title}</Text>
                {t.message && (
                  <Text variant="bodySmall" color="textMuted">
                    {t.message}
                  </Text>
                )}
              </View>
              {t.action && (
                <Pressable
                  onPress={() => {
                    t.action?.onPress();
                    dismiss(t.id);
                  }}
                  style={styles.action}
                  accessibilityRole="button"
                >
                  <Text variant="caption" color="primary" style={{ fontFamily: 'Inter_700Bold' }}>
                    {t.action.label}
                  </Text>
                </Pressable>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: space.md, right: space.md, gap: space.xs, zIndex: 999 },
  toast: { backgroundColor: colors.surfaceRaised, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, ...shadows.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  body: { flex: 1 },
  action: { paddingHorizontal: space.sm, paddingVertical: space.xs, minHeight: 44, justifyContent: 'center' },
});
