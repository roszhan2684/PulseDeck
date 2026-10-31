import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyReaction, applyVote } from '@/domain/reactions';
import { normalizeInviteCode } from '@/domain/validation';
import { AppError } from '@/lib/errors';
import { inviteCode, uid } from '@/lib/ids';
import { unsplash } from '@/lib/images';
import { useAppStore } from '@/store/appStore';
import type { Challenge, GroupMember, LeaderboardEntry, Message, Submission } from '@/types/domain';
import type { Backend, ChatHandlers } from '../types';
import * as seed from './seed';

/**
 * In-memory backend used when Supabase isn't configured. It mimics server behavior:
 * latency, auth, ownership checks, realtime echo and typing, and optional failures
 * (Settings → "Simulate flaky network") so error and rollback paths can be demoed.
 */
const SESSION_KEY = 'pulsedeck-demo-session';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const db = {
  profiles: clone(seed.profiles),
  groups: clone(seed.groups),
  memberships: clone(seed.memberships),
  challenges: clone(seed.challenges),
  submissions: clone(seed.submissions),
  messages: clone(seed.messages),
  leaderboards: clone(seed.leaderboards),
  activity: clone(seed.activity),
  votes: {} as Record<string, string>,
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => wait(180 + Math.random() * 260);

async function call<T>(fn: () => T, failable = true): Promise<T> {
  await latency();
  if (failable && useAppStore.getState().simulateFailures && Math.random() < 0.5) {
    throw new AppError('network', 'Simulated network failure');
  }
  return fn();
}

const me = () => seed.ME;
const isMember = (groupId: string) => (db.memberships[groupId] ?? []).includes(me());
const assertMember = (groupId: string) => {
  if (!isMember(groupId)) throw new AppError('permission', 'Not a member of this group');
};
const findChallenge = (id: string) => {
  const ch = db.challenges.find((c) => c.id === id);
  if (!ch) throw new AppError('notFound', 'Challenge not found');
  return ch;
};
const withCount = (gId: string) => {
  const grp = db.groups.find((x) => x.id === gId);
  if (!grp) throw new AppError('notFound', 'Group not found');
  return { ...grp, memberCount: db.memberships[gId]?.length ?? 0 };
};
const postedToday = (userId: string, groupId: string) => {
  const current = db.challenges.find((c) => c.groupId === groupId && c.status !== 'completed');
  return !!current && db.submissions.some((s) => s.challengeId === current.id && s.userId === userId);
};

const chatListeners = new Map<string, Set<ChatHandlers>>();
const emit = (groupId: string, fn: (h: ChatHandlers) => void) => chatListeners.get(groupId)?.forEach(fn);

function scheduleBotReply(groupId: string) {
  const others = (db.memberships[groupId] ?? []).filter((u) => u !== me());
  const friend = others[Math.floor(Math.random() * others.length)];
  if (!friend) return;
  setTimeout(() => emit(groupId, (h) => h.onTyping(friend, true)), 900);
  setTimeout(() => {
    const msg: Message = {
      id: uid('m'),
      groupId,
      userId: friend,
      body: seed.botReplies[Math.floor(Math.random() * seed.botReplies.length)],
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: {},
    };
    db.messages.push(msg);
    emit(groupId, (h) => {
      h.onTyping(friend, false);
      h.onMessage(msg);
    });
  }, 2600);
}

export const demoBackend: Backend = {
  mode: 'demo',
  auth: {
    restore: async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as { userId: string; needsOnboarding: boolean }) : null;
    },
    signIn: async (email) =>
      call(() => {
        if (email.trim().toLowerCase() === 'locked@pulsedeck.app') throw new AppError('auth', 'Invalid email or password');
        const res = { userId: me(), needsOnboarding: false };
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(res)).catch(() => undefined);
        return res;
      }, false),
    signUp: async () =>
      call(() => {
        // A brand-new account: blank profile, no groups. Onboarding fills both in.
        db.profiles[me()] = { ...db.profiles[me()], username: '', displayName: '', bio: '' };
        Object.keys(db.memberships).forEach((gId) => {
          db.memberships[gId] = db.memberships[gId].filter((u) => u !== me());
        });
        const res = { userId: me(), needsOnboarding: true };
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(res)).catch(() => undefined);
        return res;
      }, false),
    sendMagicLink: async () => call(() => undefined, false),
    demo: async () => demoBackend.auth.signIn('demo@pulsedeck.app', 'demo'),
    signOut: async () => {
      await AsyncStorage.removeItem(SESSION_KEY);
    },
  },

  profiles: {
    me: () => call(() => db.profiles[me()], false),
    get: (id) =>
      call(() => {
        const prof = db.profiles[id];
        if (!prof) throw new AppError('notFound', 'Profile not found');
        return prof;
      }, false),
    update: (patch) =>
      call(() => {
        db.profiles[me()] = { ...db.profiles[me()], ...patch };
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: me(), needsOnboarding: false })).catch(() => undefined);
        return db.profiles[me()];
      }),
    stats: (id) =>
      call(() => {
        const base = seed.statsByUser[id];
        const lbs = Object.values(db.leaderboards).flat().filter((e) => e.userId === id);
        const mine = db.submissions.filter((s) => s.userId === id);
        return {
          currentStreak: base?.currentStreak ?? Math.max(0, ...lbs.map((e) => e.streak)),
          longestStreak: base?.longestStreak ?? Math.max(0, ...lbs.map((e) => e.streak)) + 3,
          challengesCompleted: base?.challengesCompleted ?? mine.length * 4,
          wins: base?.wins ?? lbs.reduce((n, e) => n + e.wins, 0),
          reactionsReceived: base?.reactionsReceived ?? lbs.reduce((n, e) => n + e.reactions, 0),
          badges: id === me() ? seed.badges : seed.badges.slice(0, 3),
        };
      }, false),
    submissions: (id) =>
      call(() => db.submissions.filter((s) => s.userId === id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), false),
    usernameAvailable: (name) =>
      call(() => !Object.values(db.profiles).some((pr) => pr.id !== me() && pr.username === name), false),
  },

  groups: {
    mine: () => call(() => db.groups.filter((x) => isMember(x.id)).map((x) => withCount(x.id)), false),
    get: (id) =>
      call(() => {
        assertMember(id);
        return withCount(id);
      }, false),
    members: (id) =>
      call(() => {
        assertMember(id);
        const lbs = db.leaderboards[id] ?? [];
        return (db.memberships[id] ?? []).map<GroupMember>((userId, i) => ({
          userId,
          role: db.groups.find((x) => x.id === id)?.ownerId === userId ? 'owner' : 'member',
          joinedAt: new Date(Date.now() - (i + 1) * 86_400_000 * 9).toISOString(),
          profile: db.profiles[userId],
          postedToday: postedToday(userId, id),
          currentStreak: lbs.find((e) => e.userId === userId)?.streak ?? 0,
        }));
      }, false),
    create: ({ name, emoji }) =>
      call(() => {
        const id = uid('g');
        const grp = {
          id,
          name: name.trim(),
          emoji,
          description: 'A brand new crew.',
          avatarUrl: unsplash('1529156069898-49953e39b3ac', 800, 500),
          inviteCode: inviteCode(),
          ownerId: me(),
          memberCount: 1,
          createdAt: new Date().toISOString(),
        };
        db.groups.push(grp);
        db.memberships[id] = [me()];
        db.leaderboards[id] = [{ userId: me(), profile: db.profiles[me()], wins: 0, participation: 0, reactions: 0, streak: 0 }];
        const now = Date.now();
        db.challenges.push({
          id: uid('c'),
          groupId: id,
          prompt: 'Show us what’s in your fridge',
          emoji: '🧊',
          description: 'Your first challenge. No judgment (some judgment).',
          startsAt: new Date(now - 60_000).toISOString(),
          submissionEndsAt: new Date(now + 8 * 3_600_000).toISOString(),
          votingEndsAt: new Date(now + 12 * 3_600_000).toISOString(),
          status: 'active',
          createdBy: me(),
          coverUrl: unsplash('1556911220-bff31c812dba', 900),
        });
        return withCount(id);
      }),
    join: (code) =>
      call(() => {
        const grp = db.groups.find((x) => x.inviteCode === normalizeInviteCode(code));
        if (!grp) throw new AppError('notFound', 'No group uses that invite code');
        if (!isMember(grp.id)) db.memberships[grp.id] = [...(db.memberships[grp.id] ?? []), me()];
        const lbs = (db.leaderboards[grp.id] ??= []);
        if (!lbs.some((e) => e.userId === me())) lbs.push({ userId: me(), profile: db.profiles[me()], wins: 0, participation: 0, reactions: 0, streak: 0 });
        return withCount(grp.id);
      }),
    leave: (id) =>
      call(() => {
        db.memberships[id] = (db.memberships[id] ?? []).filter((u) => u !== me());
      }),
    rename: (id, name) =>
      call(() => {
        assertMember(id);
        const grp = db.groups.find((x) => x.id === id);
        if (!grp) throw new AppError('notFound', 'Group not found');
        grp.name = name.trim();
        return withCount(id);
      }),
    activity: (id) => call(() => (assertMember(id), db.activity[id] ?? []), false),
  },

  challenges: {
    current: (groupId) =>
      call(() => {
        assertMember(groupId);
        const now = Date.now();
        const list = db.challenges.filter((x) => x.groupId === groupId && Date.parse(x.votingEndsAt) > now);
        return list.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0] ?? null;
      }, false),
    get: (id) => call(() => findChallenge(id), false),
    history: (groupId) =>
      call(
        () =>
          db.challenges
            .filter((x) => x.groupId === groupId && Date.parse(x.votingEndsAt) <= Date.now())
            .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)),
        false,
      ),
  },

  submissions: {
    list: (challengeId) =>
      call(() => {
        assertMember(findChallenge(challengeId).groupId);
        return db.submissions.filter((x) => x.challengeId === challengeId).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
      }, false),
    create: async (input, onProgress) => {
      const ch: Challenge = findChallenge(input.challengeId);
      assertMember(ch.groupId);
      onProgress('preparing', 0);
      await wait(450);
      const flaky = useAppStore.getState().simulateFailures;
      for (let i = 1; i <= 10; i++) {
        await wait(input.mediaType === 'text' ? 40 : 160);
        onProgress('uploading', i / 10);
        if (flaky && i === 6 && Math.random() < 0.6) throw new AppError('upload', 'Upload interrupted');
      }
      onProgress('processing', 1);
      await wait(650);
      const sub: Submission = {
        id: uid('s'),
        challengeId: input.challengeId,
        userId: me(),
        author: db.profiles[me()],
        mediaType: input.mediaType,
        mediaUrl: input.localUri,
        thumbnailUrl: input.localUri,
        text: input.text,
        caption: input.caption.trim(),
        createdAt: new Date().toISOString(),
        reactions: {},
        myReactions: [],
        voteCount: 0,
      };
      db.submissions = db.submissions.filter((x) => !(x.challengeId === input.challengeId && x.userId === me()));
      db.submissions.push(sub);
      const lbs = db.leaderboards[ch.groupId];
      const entry = lbs?.find((e) => e.userId === me());
      if (entry) entry.participation += 1;
      (db.activity[ch.groupId] ??= []).unshift({
        id: uid('a'),
        kind: 'submission',
        actor: db.profiles[me()],
        text: `posted to “${ch.prompt}”`,
        createdAt: sub.createdAt,
        thumbnailUrl: input.localUri,
        href: `/challenge/${ch.id}`,
      });
      return sub;
    },
    react: (submissionId, type, mode) =>
      call(() => {
        const idx = db.submissions.findIndex((x) => x.id === submissionId);
        if (idx < 0) throw new AppError('notFound', 'Submission not found');
        db.submissions[idx] = applyReaction(db.submissions[idx], type, mode);
      }),
    myVote: (challengeId) => call(() => db.votes[challengeId] ?? null, false),
    vote: (challengeId, submissionId) =>
      call(() => {
        const target = db.submissions.find((x) => x.id === submissionId);
        if (target?.userId === me()) throw new AppError('validation', 'You can’t vote for your own post');
        db.submissions = applyVote(db.submissions, db.votes[challengeId] ?? null, submissionId);
        db.votes[challengeId] = submissionId;
      }),
  },

  chat: {
    list: (groupId) =>
      call(() => (assertMember(groupId), db.messages.filter((x) => x.groupId === groupId)), false),
    send: (input) =>
      call(() => {
        assertMember(input.groupId);
        const msg: Message = {
          id: uid('m'),
          clientId: input.clientId,
          groupId: input.groupId,
          userId: me(),
          body: input.body,
          mediaUrl: input.mediaUrl,
          replyToId: input.replyToId,
          challengeRef: input.challengeRef,
          createdAt: new Date().toISOString(),
          status: 'sent',
          reactions: {},
        };
        db.messages.push(msg);
        // Realtime echo, like a Postgres INSERT broadcast. The client de-duplicates it.
        setTimeout(() => emit(input.groupId, (h) => h.onMessage(msg)), 60);
        scheduleBotReply(input.groupId);
        return msg;
      }),
    react: (messageId, emoji) =>
      call(() => {
        const msg = db.messages.find((x) => x.id === messageId);
        if (!msg) throw new AppError('notFound', 'Message not found');
        const users = msg.reactions[emoji] ?? [];
        msg.reactions[emoji] = users.includes(me()) ? users.filter((u) => u !== me()) : [...users, me()];
      }),
    subscribe: (groupId, handlers) => {
      const set = chatListeners.get(groupId) ?? new Set();
      set.add(handlers);
      chatListeners.set(groupId, set);
      handlers.onStatus?.('connected');
      return () => set.delete(handlers);
    },
    setTyping: () => undefined,
  },

  leaderboard: {
    get: (groupId) => call(() => (assertMember(groupId), clone(db.leaderboards[groupId] ?? [])), false),
    subscribe: (groupId, onChange) => {
      // Simulates live scoring events (reactions and votes landing) every few seconds.
      const id = setInterval(() => {
        const lbs: LeaderboardEntry[] = db.leaderboards[groupId] ?? [];
        const pick = lbs[Math.floor(Math.random() * lbs.length)];
        if (!pick || pick.userId === me()) return;
        pick.reactions += 1 + Math.floor(Math.random() * 4);
        if (Math.random() < 0.25) pick.wins += 1;
        if (Math.random() < 0.3) pick.participation += 1;
        onChange(clone(lbs));
      }, 3800);
      return () => clearInterval(id);
    },
  },
};

