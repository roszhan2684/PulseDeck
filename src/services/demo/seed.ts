import { avatar, unsplash } from '@/lib/images';
import type { ActivityItem, Badge, Challenge, Group, LeaderboardEntry, Message, Profile, Submission } from '@/types/domain';

/** American demo data. Times are relative to app launch so the demo always feels "live". */
const NOW = Date.now();
const ago = (min: number) => new Date(NOW - min * 60_000).toISOString();
const fromNow = (min: number) => new Date(NOW + min * 60_000).toISOString();
const DAY = 24 * 60;

export const ME = 'u_me';

const p = (id: string, displayName: string, username: string, photo: string, city: string, bio: string): Profile => ({
  id,
  displayName,
  username,
  avatarUrl: avatar(photo),
  city,
  bio,
});

export const profiles: Record<string, Profile> = Object.fromEntries(
  [
    p(ME, 'Jordan Rivera', 'jordan.rivera', '1539571696357-5a69c17a67c6', 'Austin, TX', 'Breakfast taco evangelist. Will vote for your dog.'),
    p('u_maya', 'Maya Thompson', 'mayat', '1494790108377-be9c29b29330', 'Brooklyn, NY', 'Group chat admin by force.'),
    p('u_tyler', 'Tyler Brooks', 'tylerb', '1507003211169-0a1dd7228f2d', 'Denver, CO', 'Climbing, cold brew, chaos.'),
    p('u_ava', 'Ava Martinez', 'ava.mtz', '1438761681033-6461ffad8d80', 'Miami, FL', 'Works remote. Very remote.'),
    p('u_marcus', 'Marcus Johnson', 'marcusj', '1500648767791-00dcc994a43e', 'Atlanta, GA', 'Concert front row or nothing.'),
    p('u_chloe', 'Chloe Nguyen', 'chloe.ng', '1534528741775-53994a69daeb', 'Seattle, WA', 'Biscuit’s mom. Biscuit is a dog.'),
    p('u_ethan', 'Ethan Walker', 'ethanwalks', '1506794778202-cad84cf45f1d', 'Chicago, IL', 'Deep dish defender.'),
    p('u_sofia', 'Sofia Patel', 'sofiap', '1544005313-94ddf0286df2', 'San Francisco, CA', 'Product designer. Votes on vibes.'),
    p('u_caleb', 'Caleb Anderson', 'caleb.a', '1527980965255-d3b416303d12', 'Nashville, TN', 'Hot chicken > everything.'),
    p('u_harper', 'Harper Collins', 'harperc', '1524504388940-b1c1722653e1', 'Portland, OR', 'Thrift store sommelier.'),
  ].map((x) => [x.id, x]),
);

export const avatarChoices = [
  '1539571696357-5a69c17a67c6',
  '1517841905240-472988babdf9',
  '1472099645785-5658abf4ff4e',
  '1488426862026-3ee34a7d66df',
  '1535713875002-d1d0cf377fde',
  '1531123897727-8f129e1688ce',
  '1570295999919-56ceb5ecca61',
  '1580489944761-15a19d654956',
  '1599566150163-29194dcaad36',
].map(avatar);

const g = (id: string, name: string, emoji: string, photo: string, code: string, owner: string, description: string, days: number): Group => ({
  id,
  name,
  emoji,
  description,
  avatarUrl: unsplash(photo, 800, 500),
  inviteCode: code,
  ownerId: owner,
  memberCount: 0,
  createdAt: ago(days * DAY),
});

export const groups: Group[] = [
  g('g_4b', 'Apartment 4B', '🏠', '1502672260266-1c1ef2d93688', '4BFAM1', 'u_maya', 'Roommates + honorary roommates. Austin, TX.', 210),
  g('g_lunch', 'Lakeview Lunch Club', '🥪', '1555396273-367ea4eb4db5', 'LUNCH7', 'u_ethan', 'Chicago office crew. Lunch at 12:30 sharp.', 95),
  g('g_league', 'Sunday League', '🎮', '1542751371-adc38448a05e', 'GGWP42', 'u_marcus', 'Couch co-op, fantasy football, zero chill.', 140),
];

export const memberships: Record<string, string[]> = {
  g_4b: [ME, 'u_maya', 'u_tyler', 'u_ava', 'u_marcus', 'u_chloe', 'u_ethan', 'u_sofia'],
  g_lunch: [ME, 'u_ethan', 'u_sofia', 'u_caleb', 'u_harper'],
  g_league: [ME, 'u_tyler', 'u_marcus', 'u_caleb', 'u_harper', 'u_chloe'],
};

const c = (
  id: string,
  groupId: string,
  prompt: string,
  emoji: string,
  description: string,
  start: number,
  subEnd: number,
  voteEnd: number,
  cover?: string,
  winner?: string,
): Challenge => ({
  id,
  groupId,
  prompt,
  emoji,
  description,
  startsAt: fromNow(start),
  submissionEndsAt: fromNow(subEnd),
  votingEndsAt: fromNow(voteEnd),
  status: voteEnd < 0 ? 'completed' : subEnd < 0 ? 'voting' : start > 0 ? 'scheduled' : 'active',
  createdBy: 'u_maya',
  coverUrl: cover ? unsplash(cover, 900) : undefined,
  winnerSubmissionId: winner,
});

export const challenges: Challenge[] = [
  c('c_desk', 'g_4b', 'Show us your worst desk setup', '🖥️', 'No cleaning allowed. We want the raw, unfiltered chaos.', -300, 390, 600, '1518455027359-f3f8164ba6bd'),
  c('c_lunch', 'g_lunch', 'Best lunch under $15 near the office', '🌯', 'Receipts optional. Flavor mandatory.', -1200, -60, 180, '1546069901-ba9599a7e63c'),
  c('c_setup', 'g_league', 'Gaming setup, lights on', '🕹️', 'RGB or bust. Show us the battle station.', 120, 840, 1080, '1511512578047-dfb367046420'),
  c('c_bfast', 'g_4b', 'Best breakfast under $10', '🥞', 'Diner, drive-thru or your own kitchen.', -3 * DAY, -2.6 * DAY, -2 * DAY, '1567620905732-2d1ec7ab7445', 's_b1'),
  c('c_pets', 'g_4b', 'Your pet’s most dramatic pose', '🐶', 'Borrowed pets count.', -5 * DAY, -4.6 * DAY, -4 * DAY, '1543466835-00a7907e9de1', 's_p1'),
  c('c_view', 'g_4b', 'Your view right now', '🌆', 'No editing. Whatever’s in front of you.', -7 * DAY, -6.6 * DAY, -6 * DAY, '1477959858617-67f85cf4f1df', 's_v1'),
  c('c_concert', 'g_4b', 'Concert throwback', '🎤', 'The best show you’ve ever been to.', -9 * DAY, -8.6 * DAY, -8 * DAY, '1501386761578-eac5c94b800a', 's_cn1'),
  c('c_coffee', 'g_4b', 'Your go-to coffee order', '☕', 'Show the cup, defend the order.', -12 * DAY, -11.6 * DAY, -11 * DAY, '1495474472287-4d71bcdd2085', 's_cf2'),
  c('c_sneaks', 'g_league', 'Sneaker rotation', '👟', 'Your current daily drivers.', -6 * DAY, -5.6 * DAY, -5 * DAY, '1542291026-7eec264c27ff', 's_sn1'),
];

const s = (
  id: string,
  challengeId: string,
  userId: string,
  photo: string | null,
  caption: string,
  reactions: Submission['reactions'],
  votes: number,
  minAgo: number,
  text?: string,
): Submission => ({
  id,
  challengeId,
  userId,
  author: profiles[userId],
  mediaType: photo ? 'photo' : 'text',
  mediaUrl: photo ? unsplash(photo, 1080) : undefined,
  thumbnailUrl: photo ? unsplash(photo, 360) : undefined,
  text,
  caption,
  createdAt: ago(minAgo),
  reactions,
  myReactions: [],
  voteCount: votes,
});

export const submissions: Submission[] = [
  s('s_d1', 'c_desk', 'u_maya', '1484807352052-23338990c6c6', 'cable management is a state of mind', { '🔥': 4, '😂': 3, '💀': 2 }, 0, 260),
  s('s_d2', 'c_desk', 'u_tyler', '1527864550417-7fd91fc51a46', 'monitor arm is held up by my old calc textbook. it is load bearing.', { '😂': 6, '💀': 4 }, 0, 190),
  s('s_d3', 'c_desk', 'u_ava', null, '', { '💀': 5, '😂': 4, '❤️': 1 }, 0, 150, 'I don’t have a desk. I work from the Target parking lot. 4 bars of LTE and a dream.'),
  s('s_d4', 'c_desk', 'u_marcus', '1593642632559-0c6d3fc62b89', 'the plant is fake. so is my productivity', { '🔥': 2, '😂': 5 }, 0, 95),
  s('s_d5', 'c_desk', 'u_chloe', '1499951360447-b19be8fe80f5', 'my “minimalist era” (everything is on the floor, out of frame)', { '❤️': 3, '👏': 2 }, 0, 40),
  s('s_d6', 'c_desk', 'u_ethan', '1497366811353-6870744d04b2', 'corporate made me post this', { '😮': 2, '😂': 1 }, 0, 25),
  s('s_l1', 'c_lunch', 'u_ethan', '1546069901-ba9599a7e63c', 'Sweetgreen? never heard of her. $11.50', { '🔥': 2, '👏': 1 }, 1, 600),
  s('s_l2', 'c_lunch', 'u_sofia', '1565299624946-b28f40a0ae38', 'Lou Malnati’s lunch special. zero regrets.', { '🔥': 4, '❤️': 2 }, 2, 540),
  s('s_l3', 'c_lunch', 'u_caleb', '1540189549336-e6e99c3679fe', 'meal prep sunday finally paid off', { '👏': 3 }, 0, 400),
  s('s_l4', 'c_lunch', 'u_harper', '1504674900247-0877df9cc836', 'food truck on Wacker, $12, life changing', { '😮': 2, '🔥': 3 }, 1, 300),
  s('s_b1', 'c_bfast', 'u_ava', '1567620905732-2d1ec7ab7445', 'IHOP who? homemade, $4 total', { '🔥': 7, '❤️': 4 }, 5, 3.2 * DAY),
  s('s_b2', 'c_bfast', 'u_marcus', '1484723091739-30a097e8f929', 'french toast at 2am counts as breakfast', { '😂': 5 }, 2, 3.1 * DAY),
  s('s_b3', 'c_bfast', 'u_maya', '1482049016688-2d3e1b311543', 'avocado toast. yes I’m a cliché', { '❤️': 3 }, 1, 3 * DAY),
  s('s_p1', 'c_pets', 'u_chloe', '1543466835-00a7907e9de1', 'Biscuit has never worked a day in her life', { '❤️': 9, '😂': 3 }, 4, 5.2 * DAY),
  s('s_p2', 'c_pets', 'u_tyler', '1514888286974-6c03e2ca1dba', 'he is plotting something', { '💀': 6 }, 2, 5.1 * DAY),
  s('s_p3', 'c_pets', ME, '1517849845537-4d257902454a', 'Rocco demanded to be included', { '❤️': 6, '🔥': 2 }, 2, 5 * DAY),
  s('s_v1', 'c_view', ME, '1477959858617-67f85cf4f1df', 'downtown from the parking garage roof', { '🔥': 8, '😮': 3 }, 4, 7.2 * DAY),
  s('s_v2', 'c_view', 'u_ethan', '1496442226666-8d4d0e62e6e9', 'work trip to NYC, not complaining', { '😮': 4 }, 2, 7.1 * DAY),
  s('s_v3', 'c_view', 'u_ava', '1507525428034-b723cf961d3e', 'Miami. sorry not sorry', { '🔥': 5, '💀': 2 }, 1, 7 * DAY),
  s('s_cn1', 'c_concert', 'u_marcus', '1501386761578-eac5c94b800a', 'front row at Lollapalooza', { '🔥': 6, '👏': 3 }, 4, 9.2 * DAY),
  s('s_cn2', 'c_concert', ME, '1470229722913-7c0e2dbbafd3', 'ACL weekend two, never forget', { '🔥': 5 }, 2, 9.1 * DAY),
  s('s_cn3', 'c_concert', 'u_chloe', '1514525253161-7a46d19cd819', 'lost my voice, found my people', { '❤️': 4 }, 1, 9 * DAY),
  s('s_cf1', 'c_coffee', 'u_maya', '1509042239860-f550ce710b93', 'black coffee, black heart', { '💀': 3 }, 1, 12.2 * DAY),
  s('s_cf2', 'c_coffee', ME, '1495474472287-4d71bcdd2085', 'oat milk cortado. judge me.', { '❤️': 4, '😂': 2 }, 3, 12.1 * DAY),
  s('s_sn1', 'c_sneaks', 'u_tyler', '1542291026-7eec264c27ff', 'the reds stay clean', { '🔥': 5 }, 3, 6.1 * DAY),
  s('s_sn2', 'c_sneaks', ME, '1460353581641-37baddab0fa2', 'rotation is mostly this one pair', { '😂': 3 }, 2, 6 * DAY),
];

const m = (id: string, groupId: string, userId: string, body: string, minAgo: number, extra: Partial<Message> = {}): Message => ({
  id,
  groupId,
  userId,
  body,
  createdAt: ago(minAgo),
  status: 'sent',
  reactions: {},
  ...extra,
});

export const messages: Message[] = [
  m('m1', 'g_4b', 'u_maya', 'ok who left the oat milk out AGAIN 😤', 180),
  m('m2', 'g_4b', 'u_tyler', 'not me. I’m lactose intolerant and emotionally unavailable', 176, { reactions: { '😂': ['u_ava', 'u_marcus', ME] } }),
  m('m3', 'g_4b', 'u_ava', 'it was Marcus. I have Ring footage', 171),
  m('m4', 'g_4b', 'u_marcus', 'I plead the fifth', 168, { reactions: { '💀': ['u_maya'] } }),
  m('m5', 'g_4b', 'u_chloe', 'today’s prompt is a personal attack', 121, { challengeRef: { id: 'c_desk', prompt: 'Show us your worst desk setup' } }),
  m('m6', 'g_4b', 'u_ethan', 'Tyler’s monitor arm being held up by a calc textbook is sending me 💀', 116),
  m('m7', 'g_4b', 'u_tyler', 'it’s load bearing. do NOT touch the textbook.', 110, { replyToId: 'm6' }),
  m('m8', 'g_4b', 'u_sofia', 'voting opens at 9pm ET, get your posts in 🗳️', 61),
  m('m9', 'g_4b', 'u_maya', 'Jordan you’re the only one who hasn’t posted 👀', 42, { reactions: { '👀': ['u_ava', 'u_tyler'] } }),
  m('m10', 'g_4b', 'u_ava', 'his desk is probably spotless, that’s the problem', 40),
  m('m11', 'g_4b', 'u_marcus', 'taco tuesday at Veracruz after this? 🌮', 12),
  m('m12', 'g_4b', 'u_chloe', 'I’m in', 10, { replyToId: 'm11' }),
  m('m13', 'g_4b', 'u_maya', 'always', 8, { reactions: { '🔥': ['u_marcus'] } }),
  m('m20', 'g_lunch', 'u_ethan', 'vote closes at 3. Sofia’s pizza is the frontrunner and I’m not ok with it', 50),
  m('m21', 'g_lunch', 'u_sofia', 'deep dish is a lifestyle, Ethan', 44),
  m('m22', 'g_lunch', 'u_harper', 'food truck supremacy', 20),
  m('m30', 'g_league', 'u_marcus', 'new challenge drops in 2 hours. clean your setups 🕹️', 30),
  m('m31', 'g_league', 'u_caleb', 'mine is beyond saving', 26),
];

export const botReplies = [
  'lmaooo',
  'say less 🔥',
  'no because why is this so accurate',
  'Jordan with the hot take',
  'brb screenshotting this',
  'ok but who’s bringing snacks',
  'this is why you’re my favorite roommate',
  'voting for you btw 🗳️',
];

const lb = (userId: string, wins: number, participation: number, reactions: number, streak: number): LeaderboardEntry => ({
  userId,
  profile: profiles[userId],
  wins,
  participation,
  reactions,
  streak,
});

export const leaderboards: Record<string, LeaderboardEntry[]> = {
  g_4b: [
    lb(ME, 2, 6, 41, 12),
    lb('u_maya', 3, 7, 52, 15),
    lb('u_tyler', 1, 5, 38, 4),
    lb('u_ava', 2, 7, 47, 9),
    lb('u_marcus', 1, 4, 29, 3),
    lb('u_chloe', 1, 6, 33, 7),
    lb('u_ethan', 0, 3, 18, 2),
    lb('u_sofia', 0, 5, 22, 6),
  ],
  g_lunch: [lb(ME, 1, 4, 17, 12), lb('u_ethan', 2, 5, 21, 5), lb('u_sofia', 2, 5, 26, 8), lb('u_caleb', 0, 3, 9, 1), lb('u_harper', 1, 4, 15, 4)],
  g_league: [lb(ME, 1, 3, 12, 12), lb('u_tyler', 2, 4, 19, 4), lb('u_marcus', 1, 4, 22, 3), lb('u_caleb', 0, 2, 6, 1), lb('u_harper', 1, 3, 11, 4), lb('u_chloe', 0, 3, 14, 7)],
};

const badge = (id: string, emoji: string, title: string, description: string, daysAgo: number): Badge => ({
  id,
  emoji,
  title,
  description,
  earnedAt: ago(daysAgo * DAY),
});

export const badges: Badge[] = [
  badge('b1', '🔥', 'Hot Streak', '10 days in a row', 2),
  badge('b2', '👑', 'Crowned', 'Won your first challenge', 40),
  badge('b3', '😂', 'Class Clown', '50 laugh reactions', 18),
  badge('b4', '🌅', 'Early Bird', 'Posted within 10 min of a drop, 5 times', 25),
  badge('b5', '🗳️', 'Civic Duty', 'Voted in 25 rounds', 9),
  badge('b6', '📸', 'Shutterbug', '25 photo responses', 30),
];

export const statsByUser: Record<string, { currentStreak: number; longestStreak: number; challengesCompleted: number; wins: number; reactionsReceived: number }> = {
  [ME]: { currentStreak: 12, longestStreak: 21, challengesCompleted: 38, wins: 6, reactionsReceived: 412 },
};

const act = (id: string, kind: ActivityItem['kind'], actor: string, text: string, minAgo: number, extra: Partial<ActivityItem> = {}): ActivityItem => ({
  id,
  kind,
  actor: profiles[actor],
  text,
  createdAt: ago(minAgo),
  ...extra,
});

export const activity: Record<string, ActivityItem[]> = {
  g_4b: [
    act('a1', 'submission', 'u_ethan', 'posted to “Worst desk setup”', 25, { thumbnailUrl: unsplash('1497366811353-6870744d04b2', 160, 160), href: '/challenge/c_desk' }),
    act('a2', 'submission', 'u_chloe', 'posted to “Worst desk setup”', 40, { thumbnailUrl: unsplash('1499951360447-b19be8fe80f5', 160, 160), href: '/challenge/c_desk' }),
    act('a3', 'reaction', 'u_maya', 'reacted 💀 to Tyler’s desk', 70),
    act('a4', 'submission', 'u_marcus', 'posted to “Worst desk setup”', 95, { thumbnailUrl: unsplash('1593642632559-0c6d3fc62b89', 160, 160), href: '/challenge/c_desk' }),
    act('a5', 'streak', 'u_maya', 'hit a 15-day streak 🔥', 300),
    act('a6', 'win', 'u_ava', 'won “Best breakfast under $10” 👑', 2 * DAY, { thumbnailUrl: unsplash('1567620905732-2d1ec7ab7445', 160, 160) }),
  ],
  g_lunch: [
    act('a10', 'vote', 'u_harper', 'voted in “Best lunch under $15”', 30),
    act('a11', 'submission', 'u_harper', 'posted to “Best lunch under $15”', 300, { thumbnailUrl: unsplash('1504674900247-0877df9cc836', 160, 160), href: '/challenge/c_lunch' }),
  ],
  g_league: [act('a20', 'win', 'u_tyler', 'won “Sneaker rotation” 👑', 5 * DAY, { thumbnailUrl: unsplash('1542291026-7eec264c27ff', 160, 160) })],
};
