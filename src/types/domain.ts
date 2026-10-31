export type ID = string;
export type ISODate = string;

export interface Profile {
  id: ID;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  city?: string;
}

export interface ProfileStats {
  currentStreak: number;
  longestStreak: number;
  challengesCompleted: number;
  wins: number;
  reactionsReceived: number;
  badges: Badge[];
}

export interface Badge {
  id: ID;
  emoji: string;
  title: string;
  description: string;
  earnedAt: ISODate;
}

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Group {
  id: ID;
  name: string;
  description: string;
  avatarUrl: string;
  emoji: string;
  ownerId: ID;
  inviteCode: string;
  memberCount: number;
  createdAt: ISODate;
}

export interface GroupMember {
  userId: ID;
  role: MemberRole;
  joinedAt: ISODate;
  profile: Profile;
  postedToday: boolean;
  currentStreak: number;
}

export type ChallengeStatus = 'scheduled' | 'active' | 'voting' | 'completed';

export interface Challenge {
  id: ID;
  groupId: ID;
  prompt: string;
  description: string;
  emoji: string;
  startsAt: ISODate;
  submissionEndsAt: ISODate;
  votingEndsAt: ISODate;
  status: ChallengeStatus;
  createdBy: ID;
  coverUrl?: string;
  winnerSubmissionId?: ID;
}

export type MediaType = 'photo' | 'video' | 'text';

export const REACTION_TYPES = ['🔥', '😂', '💀', '❤️', '👏', '😮'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];
export const DEFAULT_REACTION: ReactionType = '🔥';

export type ReactionCounts = Partial<Record<ReactionType, number>>;

export interface Submission {
  id: ID;
  challengeId: ID;
  userId: ID;
  author: Profile;
  mediaType: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  text?: string;
  caption: string;
  createdAt: ISODate;
  reactions: ReactionCounts;
  myReactions: ReactionType[];
  voteCount: number;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface Message {
  id: ID;
  /** Client-generated id used to reconcile optimistic messages with server rows. */
  clientId?: ID;
  groupId: ID;
  userId: ID;
  body: string;
  mediaUrl?: string;
  replyToId?: ID;
  challengeRef?: { id: ID; prompt: string };
  createdAt: ISODate;
  status: MessageStatus;
  reactions: Partial<Record<string, ID[]>>;
}

export type LeaderboardMetric = 'wins' | 'participation' | 'reactions' | 'streak';

export interface LeaderboardEntry {
  userId: ID;
  profile: Profile;
  wins: number;
  participation: number;
  reactions: number;
  streak: number;
}

export interface RankedEntry extends LeaderboardEntry {
  rank: number;
  score: number;
}

export type ActivityKind = 'submission' | 'reaction' | 'vote' | 'win' | 'join' | 'streak';

export interface ActivityItem {
  id: ID;
  kind: ActivityKind;
  actor: Profile;
  text: string;
  createdAt: ISODate;
  thumbnailUrl?: string;
  href?: string;
}

export type NotificationType =
  | 'new_challenge'
  | 'friend_submission'
  | 'reaction'
  | 'comment'
  | 'voting_open'
  | 'winner'
  | 'streak_reminder';

export const NOTIFICATION_TYPES: { type: NotificationType; label: string; description: string }[] = [
  { type: 'new_challenge', label: 'New challenge', description: 'When today’s prompt drops' },
  { type: 'friend_submission', label: 'Friend submissions', description: 'When someone posts a response' },
  { type: 'reaction', label: 'Reactions', description: 'When friends react to your post' },
  { type: 'comment', label: 'Chat mentions', description: 'Replies and mentions in chat' },
  { type: 'voting_open', label: 'Voting opens', description: 'When it’s time to pick a winner' },
  { type: 'winner', label: 'Winner announced', description: 'Results at the end of each round' },
  { type: 'streak_reminder', label: 'Streak reminder', description: 'A nudge before your streak breaks' },
];
