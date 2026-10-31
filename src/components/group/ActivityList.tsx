import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { timeAgo } from '@/lib/time';
import { colors, radii, space } from '@/theme';
import type { ActivityItem } from '@/types/domain';
import { AnimatedListItem } from '../motion/AnimatedListItem';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Avatar, Text } from '../ui';

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <View style={styles.list}>
      {items.map((a, i) => (
        <AnimatedListItem key={a.id} index={i}>
          <AnimatedPressable onPress={a.href ? () => router.push(a.href as Href) : undefined} disabled={!a.href} scaleTo={0.98} style={styles.row} accessibilityLabel={`${a.actor.displayName} ${a.text}, ${timeAgo(a.createdAt)} ago`}>
            <Avatar uri={a.actor.avatarUrl} name={a.actor.displayName} size={36} />
            <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={2}>
              <Text variant="bodySmall" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {a.actor.displayName.split(' ')[0]}
              </Text>{' '}
              {a.text}
              <Text variant="bodySmall" color="textSubtle">
                {'  '}
                {timeAgo(a.createdAt)}
              </Text>
            </Text>
            {a.thumbnailUrl && <Image source={{ uri: a.thumbnailUrl }} style={styles.thumb} contentFit="cover" />}
          </AnimatedPressable>
        </AnimatedListItem>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs, minHeight: 48 },
  thumb: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.surface },
});
