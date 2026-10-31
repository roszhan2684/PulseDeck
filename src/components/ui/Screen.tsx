import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** Apply top safe-area inset. */
  edgeTop?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edgeTop = true, padded = false, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, edgeTop && { paddingTop: insets.top }, padded && styles.padded, style]}>{children}</View>;
}

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, back = true, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton icon={ChevronLeft} accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.titles}>
        {title && (
          <Text variant="bodyStrong" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.spacer, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: layout.screenPadding },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: space.xs, gap: space.sm },
  titles: { flex: 1, alignItems: 'center' },
  spacer: { width: 44, flexDirection: 'row' },
  right: { justifyContent: 'flex-end', width: 'auto', minWidth: 44 },
});
