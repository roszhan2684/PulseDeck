import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space, tints } from '@/theme';
import type { Submission } from '@/types/domain';
import { Text } from '../ui';

const tintFor = (id: string) => tints[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % tints.length];

export interface SubmissionMediaProps {
  submission: Submission;
  /** Only the active card plays video. */
  active?: boolean;
  /** Use the full-size asset instead of the feed thumbnail. */
  full?: boolean;
}

/** Renders a submission's media: photo, short looping video, or a typographic text card. */
export function SubmissionMedia({ submission, active = false, full = false }: SubmissionMediaProps) {
  if (submission.mediaType === 'text') {
    const tint = tintFor(submission.userId);
    return (
      <LinearGradient colors={[tint, colors.bg]} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={[StyleSheet.absoluteFill, styles.text]}>
        <Text style={styles.quote}>“</Text>
        <Text variant="h1" style={{ fontSize: 28, lineHeight: 34 }} maxFontSizeMultiplier={1.2}>
          {submission.text}
        </Text>
      </LinearGradient>
    );
  }
  if (submission.mediaType === 'video' && submission.mediaUrl) return <Video uri={submission.mediaUrl} playing={active} />;
  return (
    <Image
      source={{ uri: full ? submission.mediaUrl : (submission.mediaUrl ?? submission.thumbnailUrl) }}
      placeholder={{ uri: submission.thumbnailUrl }}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      transition={200}
      accessibilityLabel={submission.caption || `Photo by ${submission.author.displayName}`}
    />
  );
}

function Video({ uri, playing }: { uri: string; playing: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);
  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  text: { padding: space.xxl, justifyContent: 'center' },
  quote: { fontSize: 96, lineHeight: 96, color: 'rgba(255,255,255,0.35)', fontFamily: 'BricolageGrotesque_800ExtraBold' },
});
