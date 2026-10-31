import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import type { Profile } from '@/types/domain';
import { Avatar } from './Avatar';
import { Text } from './Text';

export interface AvatarStackProps {
  profiles: Pick<Profile, 'id' | 'avatarUrl' | 'displayName'>[];
  size?: number;
  max?: number;
}

export function AvatarStack({ profiles, size = 28, max = 4 }: AvatarStackProps) {
  const shown = profiles.slice(0, max);
  const extra = profiles.length - shown.length;
  return (
    <View style={styles.row} accessible accessibilityLabel={`${profiles.length} people`}>
      {shown.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i ? -size * 0.32 : 0, zIndex: max - i }}>
          <Avatar uri={p.avatarUrl} name={p.displayName} size={size} borderColor={colors.bg} />
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.more, { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.32 }]}>
          <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  more: { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
});
