import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, space } from '@/theme';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'lime';

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceRaised, fg: colors.textMuted },
  primary: { bg: colors.primaryMuted, fg: '#B9A8FF' },
  accent: { bg: colors.accentMuted, fg: colors.accent },
  success: { bg: colors.successMuted, fg: colors.success },
  warning: { bg: colors.warningMuted, fg: colors.warning },
  danger: { bg: colors.dangerMuted, fg: colors.danger },
  lime: { bg: colors.limeMuted, fg: colors.lime },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Leading live dot (e.g. "Live now"). */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', dot, style }: BadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.base, { backgroundColor: t.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      <Text variant="overline" style={{ color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 5, borderRadius: radii.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
