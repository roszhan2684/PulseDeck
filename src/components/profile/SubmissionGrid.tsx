import { Image } from 'expo-image';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { thumbnail } from '@/lib/images';
import { colors, layout, radii, space } from '@/theme';
import type { Submission } from '@/types/domain';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Text } from '../ui';

const COLS = 3;

/** Three-column grid of a user's responses using lightweight thumbnails. */
export function SubmissionGrid({ submissions, onPress }: { submissions: Submission[]; onPress: (s: Submission) => void }) {
  const { width } = useWindowDimensions();
  const size = (Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2 - space.xs * (COLS - 1)) / COLS;
  return (
    <View style={styles.grid}>
      {submissions.map((s) => (
        <AnimatedPressable key={s.id} onPress={() => onPress(s)} style={[styles.cell, { width: size, height: size * 1.25 }]} accessibilityLabel={s.caption || s.text || 'Response'}>
          {s.mediaType === 'text' ? (
            <View style={styles.text}>
              <Text variant="caption" numberOfLines={5}>
                {s.text}
              </Text>
            </View>
          ) : (
            <Image source={{ uri: s.thumbnailUrl ? thumbnail(s.thumbnailUrl) : s.mediaUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          )}
        </AnimatedPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, paddingHorizontal: layout.screenPadding },
  cell: { borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.surface },
  text: { flex: 1, padding: space.sm, backgroundColor: colors.primaryMuted, justifyContent: 'center' },
});
