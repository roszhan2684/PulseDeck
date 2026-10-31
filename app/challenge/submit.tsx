import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Camera, ImagePlus, RefreshCw, Send, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubmissionMedia } from '@/components/feed/SubmissionMedia';
import { Button, EmptyState, IconButton, SegmentedControl, Skeleton, Text, TextField } from '@/components/ui';
import { useChallenge, useChallengePhase, useCurrentChallenge } from '@/features/challenges/useChallenge';
import { useSelectedGroup } from '@/features/groups/useGroups';
import { UploadStatus } from '@/features/submissions/UploadStatus';
import { useFeed, useSubmissionUpload } from '@/features/submissions/useFeed';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { toast } from '@/store/toastStore';
import { colors, fonts, layout, radii, space } from '@/theme';
import { presets } from '@/theme/motion';
import type { MediaType, Submission } from '@/types/domain';

/** Local, unsaved submission used only to preview a draft with the real card renderer. */
const draft = (p: Partial<Submission>): Submission => ({
  id: 'preview',
  challengeId: '',
  userId: 'preview',
  author: { id: '', username: '', displayName: '', avatarUrl: '', bio: '' },
  mediaType: 'text',
  caption: '',
  createdAt: '',
  reactions: {},
  myReactions: [],
  voteCount: 0,
  ...p,
});

export default function Submit() {
  const params = useLocalSearchParams<{ challengeId?: string }>();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotionPref();
  const { group } = useSelectedGroup();
  const current = useCurrentChallenge(params.challengeId ? undefined : group?.id);
  const byId = useChallenge(params.challengeId ?? '');
  const challenge = params.challengeId ? byId.data : current.data;
  const feed = useFeed(challenge?.id);
  const { phase, mySubmission } = useChallengePhase(challenge, feed.data);
  const upload = useSubmissionUpload(challenge ?? undefined);
  const [type, setType] = useState<MediaType>('photo');
  const [media, setMedia] = useState<{ uri: string; type: MediaType } | null>(null);
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const pick = async (source: 'camera' | 'library') => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: type === 'video' ? ['videos'] : ['images'], quality: 0.8, allowsEditing: type === 'photo', aspect: [4, 5], videoMaxDuration: 15 };
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return toast.error('Camera access needed', 'Enable it in Settings, or pick from your library.');
      }
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) setMedia({ uri: res.assets[0].uri, type: res.assets[0].type === 'video' ? 'video' : 'photo' });
    } catch {
      toast.error('Couldn’t open the camera', 'This device may not have one. Try your library.');
    }
  };

  const ready = type === 'text' ? text.trim().length >= 3 : !!media;
  const submit = () => {
    if (!challenge || !ready) return;
    void upload.submit({ challengeId: challenge.id, mediaType: type === 'text' ? 'text' : (media?.type ?? 'photo'), localUri: media?.uri, text: type === 'text' ? text.trim() : undefined, caption });
  };

  if (upload.state.phase !== 'idle') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <UploadStatus state={upload.state} onRetry={upload.retry} onCancel={upload.reset} onDone={close} onViewDeck={() => challenge && router.replace(`/challenge/${challenge.id}` as Href)} />
      </View>
    );
  }

  const preview = type === 'text' && text.trim() ? draft({ text }) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon={X} accessibilityLabel="Close" onPress={close} />
        <Text variant="bodyStrong">New response</Text>
        <View style={{ width: 44 }} />
      </View>
      {!challenge ? (
        current.isLoading || byId.isLoading ? (
          <View style={styles.pad}><Skeleton height={400} radius={radii.xl} /></View>
        ) : (
          <EmptyState emoji="🌙" title="Nothing to answer right now" message="There’s no open challenge in this group. Check back when the next one drops." actionLabel="Close" onAction={close} />
        )
      ) : phase !== 'active' && phase !== 'submitted' ? (
        <EmptyState emoji="⏰" title="Submissions are closed" message={phase === 'upcoming' ? 'This challenge hasn’t started yet.' : 'Voting has started. Go pick a winner!'} actionLabel="Open the deck" onAction={() => router.replace(`/challenge/${challenge.id}` as Href)} />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Animated.View entering={presets.enter(reduced)} style={styles.prompt}>
              <Text style={{ fontSize: 30 }}>{challenge.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="overline" color="primary">Today’s challenge</Text>
                <Text variant="h3">{challenge.prompt}</Text>
              </View>
            </Animated.View>
            {mySubmission && <Text variant="caption" color="warning">You already posted. Submitting again replaces your response.</Text>}
            <SegmentedControl
              value={type}
              onChange={(t) => {
                setType(t);
                setMedia(null);
              }}
              options={[
                { value: 'photo', label: 'Photo' },
                { value: 'video', label: 'Video' },
                { value: 'text', label: 'Text' },
              ]}
            />
            <View style={styles.preview}>
              {type === 'text' ? (
                preview ? (
                  <SubmissionMedia submission={preview} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text variant="h3" color="textSubtle" align="center">Your hot take goes here</Text>
                  </View>
                )
              ) : media ? (
                <>
                  {media.type === 'video' ? (
                    <SubmissionMedia submission={draft({ mediaType: 'video', mediaUrl: media.uri })} active />
                  ) : (
                    <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  )}
                  <IconButton icon={RefreshCw} variant="glass" accessibilityLabel="Retake" onPress={() => setMedia(null)} style={styles.retake} />
                </>
              ) : (
                <View style={styles.placeholder}>
                  <Button label={type === 'video' ? 'Record a clip' : 'Take a photo'} icon={Camera} onPress={() => pick('camera')} />
                  <Button label="Choose from library" icon={ImagePlus} variant="secondary" onPress={() => pick('library')} />
                  {type === 'video' && <Text variant="caption" color="textSubtle">15 seconds max</Text>}
                </View>
              )}
            </View>
            {type === 'text' ? (
              <TextInput value={text} onChangeText={setText} placeholder="Type your answer…" placeholderTextColor={colors.textSubtle} multiline maxLength={180} style={styles.textInput} accessibilityLabel="Your answer" keyboardAppearance="dark" />
            ) : (
              <TextField label="Caption (optional)" value={caption} onChangeText={setCaption} placeholder="Explain yourself 👀" maxLength={140} />
            )}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
            <Button label="Post response" icon={Send} size="lg" fullWidth disabled={!ready} onPress={submit} accessibilityHint={ready ? undefined : 'Add a photo, video or text first'} />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: space.xs },
  pad: { padding: layout.screenPadding },
  content: { padding: layout.screenPadding, gap: space.md, paddingBottom: space.xxl },
  prompt: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, borderRadius: radii.lg, backgroundColor: colors.surface },
  preview: { aspectRatio: 4 / 5, borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
  retake: { position: 'absolute', top: space.sm, right: space.sm },
  textInput: { minHeight: 90, color: colors.text, fontFamily: fonts.body, fontSize: 16, padding: space.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, textAlignVertical: 'top' },
  footer: { paddingHorizontal: layout.screenPadding, paddingTop: space.sm },
});
