import type { Challenge, Group, Message, Profile, ReactionType, Submission } from '@/types/domain';

/* Row shapes returned by Postgres (snake_case). Kept minimal: only the columns the app reads. */
export interface ProfileRow { id: string; username: string | null; display_name: string | null; avatar_url: string | null; bio: string | null; city: string | null }
export interface GroupRow { id: string; name: string; description: string | null; avatar_url: string | null; emoji: string | null; owner_id: string; invite_code: string; created_at: string; member_count?: number }
export interface ChallengeRow { id: string; group_id: string; prompt: string; description: string | null; emoji: string | null; cover_url: string | null; starts_at: string; submission_ends_at: string; voting_ends_at: string; status: Challenge['status']; created_by: string; winner_submission_id: string | null }
export interface FeedRow { id: string; challenge_id: string; user_id: string; media_type: Submission['mediaType']; media_url: string | null; thumbnail_url: string | null; body: string | null; caption: string | null; created_at: string; author: ProfileRow; reaction_counts: Record<string, number> | null; my_reactions: ReactionType[] | null; vote_count: number }
export interface MessageRow { id: string; client_id: string | null; group_id: string; user_id: string; body: string; media_url: string | null; reply_to_message_id: string | null; challenge_id: string | null; challenge_prompt?: string | null; created_at: string; message_reactions?: { user_id: string; reaction: string }[] }

export const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  username: r.username ?? '',
  displayName: r.display_name ?? r.username ?? '',
  avatarUrl: r.avatar_url ?? '',
  bio: r.bio ?? '',
  city: r.city ?? undefined,
});

export const toGroup = (r: GroupRow): Group => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  avatarUrl: r.avatar_url ?? '',
  emoji: r.emoji ?? '✨',
  ownerId: r.owner_id,
  inviteCode: r.invite_code,
  memberCount: r.member_count ?? 0,
  createdAt: r.created_at,
});

export const toChallenge = (r: ChallengeRow): Challenge => ({
  id: r.id,
  groupId: r.group_id,
  prompt: r.prompt,
  description: r.description ?? '',
  emoji: r.emoji ?? '✨',
  coverUrl: r.cover_url ?? undefined,
  startsAt: r.starts_at,
  submissionEndsAt: r.submission_ends_at,
  votingEndsAt: r.voting_ends_at,
  status: r.status,
  createdBy: r.created_by,
  winnerSubmissionId: r.winner_submission_id ?? undefined,
});

export const toSubmission = (r: FeedRow): Submission => ({
  id: r.id,
  challengeId: r.challenge_id,
  userId: r.user_id,
  author: toProfile(r.author),
  mediaType: r.media_type,
  mediaUrl: r.media_url ?? undefined,
  thumbnailUrl: r.thumbnail_url ?? r.media_url ?? undefined,
  text: r.body ?? undefined,
  caption: r.caption ?? '',
  createdAt: r.created_at,
  reactions: r.reaction_counts ?? {},
  myReactions: r.my_reactions ?? [],
  voteCount: r.vote_count,
});

export const toMessage = (r: MessageRow): Message => {
  const reactions: Message['reactions'] = {};
  for (const x of r.message_reactions ?? []) (reactions[x.reaction] ??= []).push(x.user_id);
  return {
    id: r.id,
    clientId: r.client_id ?? undefined,
    groupId: r.group_id,
    userId: r.user_id,
    body: r.body,
    mediaUrl: r.media_url ?? undefined,
    replyToId: r.reply_to_message_id ?? undefined,
    challengeRef: r.challenge_id ? { id: r.challenge_id, prompt: r.challenge_prompt ?? 'Challenge' } : undefined,
    createdAt: r.created_at,
    status: 'sent',
    reactions,
  };
};
