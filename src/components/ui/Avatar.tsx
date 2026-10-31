import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { Text } from './Text';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
}

/** Static avatar with initials fallback. Use AnimatedAvatar for selection or pulse rings. */
export function Avatar({ uri, name = '', size = 40, borderColor }: AvatarProps) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, borderColor ? { borderWidth: 2, borderColor } : null]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}’s avatar` : 'Avatar'}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={uri} />
      ) : (
        <Text variant="caption" color="textMuted">
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ base: { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });
