import { Pressable, StyleSheet, View } from 'react-native';
import { hitSlop, layout, space } from '@/theme';
import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  inset?: boolean;
}

export function SectionHeader({ title, actionLabel, onAction, inset = true }: SectionHeaderProps) {
  return (
    <View style={[styles.row, inset && { paddingHorizontal: layout.screenPadding }]}>
      <Text variant="h3" accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text variant="caption" color="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm } });
