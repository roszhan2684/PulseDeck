import type {
  ActivityItem,
  Challenge,
  Group,
  GroupMember,
  LeaderboardEntry,
  MediaType,
  Message,
  Profile,
  ProfileStats,
  ReactionType,
  Submission,
} from '@/types/domain';

export interface AuthResult {
  userId: string;
  needsOnboarding: boolean;
}

export type UploadPhase = 'preparing' | 'uploading' | 'processing';

export interface CreateSubmissionInput {
  challengeId: string;
  mediaType: MediaType;
  localUri?: string;
  text?: string;
  caption: string;
}

export interface SendMessageInput {
  clientId: string;
  groupId: string;
  body: string;
  replyToId?: string;
  mediaUrl?: string;
  challengeRef?: Message['challengeRef'];
}

export type ConnectionStatus = 'connected' | 'reconnecting';

export interface ChatHandlers {
  onMessage: (m: Message) => void;
  onTyping: (userId: string, typing: boolean) => void;
  onStatus?: (s: ConnectionStatus) => void;
}

/**
 * The single data boundary of the app. Components never talk to Supabase directly;
 * feature hooks call this interface, which is implemented by the demo and Supabase backends.
 */
export interface Backend {
  mode: 'demo' | 'supabase';
  auth: {
    restore(): Promise<AuthResult | null>;
    signIn(email: string, password: string): Promise<AuthResult>;
    signUp(email: string, password: string): Promise<AuthResult>;
    sendMagicLink(email: string): Promise<void>;
    demo(): Promise<AuthResult>;
    signOut(): Promise<void>;
  };
  profiles: {
    me(): Promise<Profile>;
    get(id: string): Promise<Profile>;
    update(patch: Partial<Omit<Profile, 'id'>>): Promise<Profile>;
    stats(id: string): Promise<ProfileStats>;
    submissions(id: string): Promise<Submission[]>;
    usernameAvailable(name: string): Promise<boolean>;
  };
  groups: {
    mine(): Promise<Group[]>;
    get(id: string): Promise<Group>;
    members(id: string): Promise<GroupMember[]>;
    create(input: { name: string; emoji: string }): Promise<Group>;
    join(code: string): Promise<Group>;
    leave(id: string): Promise<void>;
    rename(id: string, name: string): Promise<Group>;
    activity(id: string): Promise<ActivityItem[]>;
  };
  challenges: {
    current(groupId: string): Promise<Challenge | null>;
    get(id: string): Promise<Challenge>;
    history(groupId: string): Promise<Challenge[]>;
  };
  submissions: {
    list(challengeId: string): Promise<Submission[]>;
    create(input: CreateSubmissionInput, onProgress: (phase: UploadPhase, progress: number) => void): Promise<Submission>;
    react(submissionId: string, type: ReactionType, mode: 'toggle' | 'add'): Promise<void>;
    myVote(challengeId: string): Promise<string | null>;
    vote(challengeId: string, submissionId: string): Promise<void>;
  };
  chat: {
    list(groupId: string): Promise<Message[]>;
    send(input: SendMessageInput): Promise<Message>;
    react(messageId: string, emoji: string): Promise<void>;
    subscribe(groupId: string, handlers: ChatHandlers): () => void;
    setTyping(groupId: string, typing: boolean): void;
  };
  leaderboard: {
    get(groupId: string): Promise<LeaderboardEntry[]>;
    subscribe(groupId: string, onChange: (entries: LeaderboardEntry[]) => void): () => void;
  };
}
