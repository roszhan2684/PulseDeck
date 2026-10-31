import { CircleAlert, Lock, SearchX, Sparkles, WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { AppError, errorCopy, toAppError, type ErrorKind } from '@/lib/errors';
import { colors, radii, space } from '@/theme';
import { presets } from '@/theme/motion';
import { Button } from './Button';
import { Text } from './Text';

const icons: Partial<Record<ErrorKind, typeof WifiOff>> = { network: WifiOff, permission: Lock, notFound: SearchX, realtime: WifiOff };

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '✨', title, message, actionLabel, onAction }: EmptyStateProps) {
  const reduced = useReducedMotionPref();
  return (
    <Animated.View entering={presets.enter(reduced)} style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      <Text variant="bodySmall" color="textMuted" align="center" style={styles.msg}>
        {message}
      </Text>
      {actionLabel && <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" icon={Sparkles} />}
    </Animated.View>
  );
}

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

/** Category-aware error view: human copy + recovery action. The raw error is logged by toAppError. */
export function ErrorState({ error, onRetry, compact }: ErrorStateProps) {
  const reduced = useReducedMotionPref();
  const e = error instanceof AppError ? error : toAppError(error);
  const copy = errorCopy[e.kind];
  const Icon = icons[e.kind] ?? CircleAlert;
  return (
    <Animated.View entering={presets.enter(reduced)} style={[styles.wrap, compact && styles.compact]} accessibilityRole="alert">
      <View style={[styles.badge, { backgroundColor: colors.dangerMuted }]}>
        <Icon size={28} color={colors.danger} />
      </View>
      <Text variant="h3" align="center">
        {copy.title}
      </Text>
      <Text variant="bodySmall" color="textMuted" align="center" style={styles.msg}>
        {copy.message}
      </Text>
      {onRetry && <Button label={copy.action} onPress={onRetry} variant="secondary" size="sm" />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.sm },
  compact: { padding: space.lg },
  badge: { width: 72, height: 72, borderRadius: radii.xl, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  msg: { maxWidth: 280, marginBottom: space.sm },
});
