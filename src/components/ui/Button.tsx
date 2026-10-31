import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, gradients, radii, space, type ColorToken } from '@/theme';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'lime';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** Shows an inline spinner and blocks presses; keeps the label for layout stability. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const heights: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };
const fg: Record<ButtonVariant, ColorToken> = { primary: 'white', secondary: 'text', ghost: 'text', danger: 'danger', lime: 'textInverse' };

/** Primary action button. States: default, pressed (spring), disabled, loading. */
export function Button({ label, onPress, variant = 'primary', size = 'md', icon: Icon, loading, disabled, fullWidth, accessibilityHint, style }: ButtonProps) {
  const inactive = disabled || loading;
  const color = colors[fg[variant]];
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={inactive}
      haptic="soft"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy: !!loading, disabled: !!inactive }}
      style={[styles.base, { height: heights[size], paddingHorizontal: size === 'sm' ? space.md : space.xl }, variantStyles[variant], fullWidth && styles.full, inactive && styles.disabled, style]}
    >
      {variant === 'primary' && <LinearGradient colors={gradients.pulse} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      <View style={[styles.row, loading && styles.hidden]}>
        {Icon && <Icon size={size === 'sm' ? 16 : 18} color={color} strokeWidth={2.4} />}
        <Text variant={size === 'sm' ? 'caption' : 'button'} style={{ color, fontFamily: 'Inter_600SemiBold' }}>
          {label}
        </Text>
      </View>
      {loading && <ActivityIndicator color={color} style={StyleSheet.absoluteFill} />}
    </AnimatedPressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  ghost: { backgroundColor: colors.transparent },
  danger: { backgroundColor: colors.dangerMuted },
  lime: { backgroundColor: colors.lime },
});

const styles = StyleSheet.create({
  base: { borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minWidth: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  hidden: { opacity: 0 },
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
});
