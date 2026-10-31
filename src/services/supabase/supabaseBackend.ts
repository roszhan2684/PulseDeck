import * as Linking from 'expo-linking';
import { AppError, toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Badge, GroupMember, LeaderboardEntry, ProfileStats } from '@/types/domain';
import type { Backend } from '../types';
import {
  toChallenge,
  toGroup,
  toMessage,
  toProfile,
  toSubmission,
  type ChallengeRow,
  type FeedRow,
  type GroupRow,
  type MessageRow,
  type ProfileRow,
} from './mappers';

/** Supabase implementation. Ownership is enforced by RLS; the client never sends a user_id it didn't get from auth. */
const sb = () => {
  if (!supabase) throw new AppError('server', 'Supabase is not configured');
  return supabase;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw toAppError(new Error(res.error.message));
  if (res.data === null) throw new AppError('notFound', 'Not found');
  return res.data;
}

async function userId(): Promise<string> {
  const { data } = await sb().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new AppError('auth', 'Not signed in');
  return id;
}

async function authResult(id: string) {
  const { data } = await sb().from('profiles').select('username').eq('id', id).maybeSingle();
  return { userId: id, needsOnboarding: !data?.username };
}

const MESSAGE_SELECT = '*, message_reactions(user_id, reaction)';

function deriveBadges(s: Omit<ProfileStats, 'badges'>): Badge[] {
  const now = new Date().toISOString();
  const rules: [boolean, Badge][] = [
    [s.longestStreak >= 10, { id: 'streak', emoji: '🔥', title: 'Hot Streak', description: '10 days in a row', earnedAt: now }],
    [s.wins >= 1, { id: 'crowned', emoji: '👑', title: 'Crowned', description: 'Won a challenge', earnedAt: now }],
    [s.reactionsReceived >= 50, { id: 'loved', emoji: '❤️', title: 'Crowd Favorite', description: '50 reactions received', earnedAt: now }],
    [s.challengesCompleted >= 25, { id: 'shutter', emoji: '📸', title: 'Shutterbug', description: '25 responses', earnedAt: now }],
  ];
  return rules.filter(([earned]) => earned).map(([, b]) => b);
}

export const supabaseBackend: Backend = {
  mode: 'supabase',
  auth: {
    restore: async () => {
      const { data } = await sb().auth.getSession();
      return data.session ? authResult(data.session.user.id) : null;
    },
    signIn: async (email, password) => {
      const { data, error } = await sb().auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new AppError('auth', error?.message ?? 'Sign in failed');
      return authResult(data.user.id);
    },
    signUp: async (email, password) => {
      const { data, error } = await sb().auth.signUp({ email, password });
      if (error || !data.user) throw new AppError('auth', error?.message ?? 'Sign up failed');
      return { userId: data.user.id, needsOnboarding: true };
    },
    sendMagicLink: async (email) => {
      const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: Linking.createURL('/') } });
      if (error) throw toAppError(error, 'auth');
    },
    demo: async () => {
      throw new AppError('auth', 'Demo login is only available in demo mode');
    },
    signOut: async () => {
      await sb().auth.signOut();
    },
  },

  profiles: {
    me: async () => toProfile(unwrap<ProfileRow>(await sb().from('profiles').select('*').eq('id', await userId()).single())),
    get: async (id) => toProfile(unwrap<ProfileRow>(await sb().from('profiles').select('*').eq('id', id).single())),
    update: async (patch) => {
      const row = { username: patch.username, display_name: patch.displayName, avatar_url: patch.avatarUrl, bio: patch.bio, city: patch.city };
      const res = await sb().from('profiles').update(row).eq('id', await userId()).select('*').single();
      return toProfile(unwrap<ProfileRow>(res));
    },
    stats: async (id) => {
      const [streaks, subs, wins, reactions] = await Promise.all([
        sb().from('streaks').select('current_streak, longest_streak').eq('user_id', id),
        sb().from('submissions').select('id', { count: 'exact', head: true }).eq('user_id', id),
        sb().from('challenge_winners').select('challenge_id', { count: 'exact', head: true }).eq('user_id', id),
        sb().from('reactions_received').select('total').eq('user_id', id).maybeSingle(),
      ]);
      const st = streaks.data ?? [];
      const base = {
        currentStreak: Math.max(0, ...st.map((x) => x.current_streak as number)),
        longestStreak: Math.max(0, ...st.map((x) => x.longest_streak as number)),
        challengesCompleted: subs.count ?? 0,
        wins: wins.count ?? 0,
        reactionsReceived: (reactions.data?.total as number | undefined) ?? 0,
      };
      return { ...base, badges: deriveBadges(base) };
    },
    submissions: async (id) =>
      unwrap<FeedRow[]>(await sb().from('submission_feed').select('*').eq('user_id', id).order('created_at', { ascending: false })).map(toSubmission),
    usernameAvailable: async (name) => {
      const { count } = await sb().from('profiles').select('id', { count: 'exact', head: true }).eq('username', name).neq('id', await userId());
      return (count ?? 0) === 0;
    },
  },

  groups: {
    mine: async () => unwrap<GroupRow[]>(await sb().from('group_overview').select('*').order('created_at')).map(toGroup),
    get: async (id) => toGroup(unwrap<GroupRow>(await sb().from('group_overview').select('*').eq('id', id).single())),
    members: async (id) => {
      const rows = unwrap<{ user_id: string; role: GroupMember['role']; joined_at: string; posted_today: boolean; current_streak: number; profile: ProfileRow }[]>(
        await sb().from('group_member_overview').select('*').eq('group_id', id),
      );
      return rows.map((r) => ({ userId: r.user_id, role: r.role, joinedAt: r.joined_at, postedToday: r.posted_today, currentStreak: r.current_streak, profile: toProfile(r.profile) }));
    },
    create: async ({ name, emoji }) => toGroup(unwrap<GroupRow>(await sb().rpc('create_group', { p_name: name, p_emoji: emoji }).single())),
    join: async (code) => toGroup(unwrap<GroupRow>(await sb().rpc('join_group', { p_code: code }).single())),
    leave: async (id) => {
      const { error } = await sb().from('group_members').delete().eq('group_id', id).eq('user_id', await userId());
      if (error) throw toAppError(error);
    },
    rename: async (id, name) => toGroup(unwrap<GroupRow>(await sb().from('groups').update({ name }).eq('id', id).select('*').single())),
    activity: async (id) => {
      const rows = unwrap<FeedRow[]>(await sb().from('submission_feed').select('*').eq('group_id', id).order('created_at', { ascending: false }).limit(8));
      return rows.map((r) => ({
        id: r.id,
        kind: 'submission' as const,
        actor: toProfile(r.author),
        text: 'posted a response',
        createdAt: r.created_at,
        thumbnailUrl: r.thumbnail_url ?? undefined,
        href: `/challenge/${r.challenge_id}`,
      }));
    },
  },

  challenges: {
    current: async (groupId) => {
      const res = await sb()
        .from('challenges')
        .select('*')
        .eq('group_id', groupId)
        .gt('voting_ends_at', new Date().toISOString())
        .order('starts_at')
        .limit(1)
        .maybeSingle();
      if (res.error) throw toAppError(res.error);
      return res.data ? toChallenge(res.data as ChallengeRow) : null;
    },
    get: async (id) => toChallenge(unwrap<ChallengeRow>(await sb().from('challenges').select('*').eq('id', id).single())),
    history: async (groupId) =>
      unwrap<ChallengeRow[]>(
        await sb().from('challenges').select('*').eq('group_id', groupId).lte('voting_ends_at', new Date().toISOString()).order('starts_at', { ascending: false }),
      ).map(toChallenge),
  },

  submissions: {
    list: async (challengeId) =>
      unwrap<FeedRow[]>(await sb().from('submission_feed').select('*').eq('challenge_id', challengeId).order('created_at')).map(toSubmission),
    create: async (input, onProgress) => {
      const uid = await userId();
      onProgress('preparing', 0);
      let mediaUrl: string | null = null;
      if (input.localUri && input.mediaType !== 'text') {
        const ext = input.mediaType === 'video' ? 'mp4' : 'jpg';
        const path = `${uid}/${input.challengeId}-${Date.now()}.${ext}`;
        const body = await (await fetch(input.localUri)).arrayBuffer();
        onProgress('uploading', 0.1);
        const up = await sb().storage.from('submissions').upload(path, body, { contentType: input.mediaType === 'video' ? 'video/mp4' : 'image/jpeg', upsert: true });
        if (up.error) throw new AppError('upload', up.error.message);
        onProgress('uploading', 1);
        mediaUrl = sb().storage.from('submissions').getPublicUrl(path).data.publicUrl;
      }
      onProgress('processing', 1);
      const res = await sb()
        .from('submissions')
        .upsert({ challenge_id: input.challengeId, user_id: uid, media_type: input.mediaType, media_url: mediaUrl, body: input.text, caption: input.caption }, { onConflict: 'challenge_id,user_id' })
        .select('id')
        .single();
      const id = unwrap<{ id: string }>(res).id;
      return toSubmission(unwrap<FeedRow>(await sb().from('submission_feed').select('*').eq('id', id).single()));
    },
    react: async (submissionId, type, mode) => {
      const uid = await userId();
      const existing = await sb().from('reactions').select('id').eq('submission_id', submissionId).eq('user_id', uid).eq('reaction_type', type).maybeSingle();
      if (existing.data && mode === 'add') return;
      const res = existing.data
        ? await sb().from('reactions').delete().eq('id', existing.data.id)
        : await sb().from('reactions').insert({ submission_id: submissionId, user_id: uid, reaction_type: type });
      if (res.error) throw toAppError(res.error);
    },
    myVote: async (challengeId) => {
      const res = await sb().from('votes').select('submission_id').eq('challenge_id', challengeId).eq('user_id', await userId()).maybeSingle();
      return (res.data?.submission_id as string | undefined) ?? null;
    },
    vote: async (challengeId, submissionId) => {
      const res = await sb().rpc('cast_vote', { p_challenge: challengeId, p_submission: submissionId });
      if (res.error) throw toAppError(res.error, 'validation');
    },
  },

  chat: {
    list: async (groupId) =>
      unwrap<MessageRow[]>(await sb().from('messages').select(MESSAGE_SELECT).eq('group_id', groupId).is('deleted_at', null).order('created_at').limit(200)).map(toMessage),
    send: async (input) => {
      const res = await sb()
        .from('messages')
        .insert({
          client_id: input.clientId,
          group_id: input.groupId,
          user_id: await userId(),
          body: input.body,
          media_url: input.mediaUrl,
          reply_to_message_id: input.replyToId,
          challenge_id: input.challengeRef?.id,
        })
        .select(MESSAGE_SELECT)
        .single();
      return toMessage(unwrap<MessageRow>(res));
    },
    react: async (messageId, emoji) => {
      const uid = await userId();
      const existing = await sb().from('message_reactions').select('id').eq('message_id', messageId).eq('user_id', uid).eq('reaction', emoji).maybeSingle();
      const res = existing.data
        ? await sb().from('message_reactions').delete().eq('id', existing.data.id)
        : await sb().from('message_reactions').insert({ message_id: messageId, user_id: uid, reaction: emoji });
      if (res.error) throw toAppError(res.error);
    },
    subscribe: (groupId, handlers) => {
      const channel = sb()
        .channel(`group:${groupId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, (payload) =>
          handlers.onMessage(toMessage(payload.new as MessageRow)),
        )
        .on('broadcast', { event: 'typing' }, ({ payload }) => handlers.onTyping(payload.userId as string, payload.typing as boolean))
        .subscribe((status) => handlers.onStatus?.(status === 'SUBSCRIBED' ? 'connected' : 'reconnecting'));
      return () => {
        sb().removeChannel(channel);
      };
    },
    setTyping: (groupId, typing) => {
      void userId().then((id) => sb().channel(`group:${groupId}`).send({ type: 'broadcast', event: 'typing', payload: { userId: id, typing } }));
    },
  },

  leaderboard: {
    get: async (groupId) => {
      const rows = unwrap<{ user_id: string; win_score: number; participation_score: number; reaction_score: number; current_streak: number; profile: ProfileRow }[]>(
        await sb().from('leaderboard_overview').select('*').eq('group_id', groupId),
      );
      return rows.map<LeaderboardEntry>((r) => ({
        userId: r.user_id,
        profile: toProfile(r.profile),
        wins: r.win_score,
        participation: r.participation_score,
        reactions: r.reaction_score,
        streak: r.current_streak,
      }));
    },
    subscribe: (groupId, onChange) => {
      const channel = sb()
        .channel(`leaderboard:${groupId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_scores', filter: `group_id=eq.${groupId}` }, () => {
          void supabaseBackend.leaderboard.get(groupId).then(onChange);
        })
        .subscribe();
      return () => {
        sb().removeChannel(channel);
      };
    },
  },
};
