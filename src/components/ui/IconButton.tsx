import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, hitSlop } from '@/theme';
import { AnimatedPressable } from '../motion/AnimatedPressable';

export interface IconButtonProps {
  icon: LucideIcon;
  /** Required: icon-only buttons need a spoken name. */
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: 'solid' | 'ghost' | 'glass';
  size?: number;
  color?: string;
  badge?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon: Icon, accessibilityLabel, onPress, variant = 'solid', size = 44, color = colors.text, badge, disabled, style }: IconButtonProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, styles[variant], disabled && { opacity: 0.4 }, style]}
    >
      <Icon size={size * 0.45} color={color} strokeWidth={2.2} />
      {badge && <View style={styles.badge} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  solid: { backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  ghost: { backgroundColor: colors.transparent },
  glass: { backgroundColor: 'rgba(9,9,15,0.55)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  badge: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.surfaceRaised },
});
