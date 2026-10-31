import * as ImagePicker from 'expo-image-picker';
import { ArrowUp, Hash, ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, fonts, radii, space } from '@/theme';
import type { Challenge, Message } from '@/types/domain';
import { IconButton, Text } from '../ui';

export interface ComposerProps {
  replyTo: Message | null;
  replyName?: string;
  challenge?: Challenge | null;
  onCancelReply: () => void;
  onSend: (body: string, extra: { mediaUrl?: string; challengeRef?: Message['challengeRef'] }) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function Composer({ replyTo, replyName, challenge, onCancelReply, onSend, onTyping, disabled }: ComposerProps) {
  const reduced = useReducedMotionPref();
  const [text, setText] = useState('');
  const [attachChallenge, setAttachChallenge] = useState(false);
  const canSend = text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text, { challengeRef: attachChallenge && challenge ? { id: challenge.id, prompt: challenge.prompt } : undefined });
    setText('');
    setAttachChallenge(false);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) onSend('', { mediaUrl: res.assets[0].uri });
  };

  return (
    <View style={styles.wrap}>
      {(replyTo || attachChallenge) && (
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(180)} exiting={FadeOut.duration(120)} style={styles.context}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {replyTo ? `Replying to ${replyName}` : 'Referencing challenge'}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {replyTo ? replyTo.body : challenge?.prompt}
            </Text>
          </View>
          <IconButton icon={X} size={32} variant="ghost" accessibilityLabel="Cancel" onPress={() => (replyTo ? onCancelReply() : setAttachChallenge(false))} />
        </Animated.View>
      )}
      <View style={styles.row}>
        <IconButton icon={ImagePlus} variant="ghost" accessibilityLabel="Share a photo" onPress={pickPhoto} disabled={disabled} color={colors.textMuted} />
        {challenge && <IconButton icon={Hash} variant="ghost" accessibilityLabel="Reference today’s challenge" onPress={() => setAttachChallenge((v) => !v)} color={attachChallenge ? colors.lime : colors.textMuted} />}
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            onTyping();
          }}
          placeholder="Message the crew"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          multiline
          maxLength={1000}
          keyboardAppearance="dark"
          accessibilityLabel="Message"
          editable={!disabled}
        />
        {canSend && (
          <Animated.View entering={reduced ? undefined : ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(120)}>
            <IconButton icon={ArrowUp} accessibilityLabel="Send message" onPress={send} style={styles.send} color={colors.white} size={40} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.bg, paddingTop: space.xs },
  context: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space.md, marginBottom: space.xs, paddingLeft: space.sm, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surface, borderRadius: radii.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.xs, gap: 2 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, color: colors.text, fontFamily: fonts.body, fontSize: 16, backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: space.md, paddingTop: 10, paddingBottom: 10, marginBottom: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  send: { backgroundColor: colors.primary, marginLeft: space.xxs, marginBottom: 2 },
});
