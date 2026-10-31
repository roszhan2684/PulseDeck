-- PulseDeck schema. RLS is enabled on every table in 20261031000100_security.sql.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'member');
create type public.challenge_status as enum ('scheduled', 'active', 'voting', 'completed');
create type public.media_type as enum ('photo', 'video', 'text');
create type public.notification_type as enum ('new_challenge', 'friend_submission', 'reaction', 'comment', 'voting_open', 'winner', 'streak_reminder');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  city text check (char_length(city) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 32),
  description text not null default '',
  avatar_url text,
  emoji text not null default '✨',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)) check (invite_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  prompt text not null check (char_length(prompt) between 3 and 120),
  description text not null default '',
  emoji text not null default '✨',
  cover_url text,
  starts_at timestamptz not null,
  submission_ends_at timestamptz not null,
  voting_ends_at timestamptz not null,
  status public.challenge_status not null default 'scheduled',
  created_by uuid references public.profiles (id) on delete set null,
  winner_submission_id uuid,
  created_at timestamptz not null default now(),
  check (starts_at < submission_ends_at and submission_ends_at < voting_ends_at)
);
create index challenges_group_time_idx on public.challenges (group_id, starts_at desc);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  media_type public.media_type not null,
  media_url text,
  thumbnail_url text,
  body text check (char_length(body) <= 280),
  caption text not null default '' check (char_length(caption) <= 140),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id),
  check ((media_type = 'text' and body is not null) or (media_type <> 'text' and media_url is not null))
);
create index submissions_user_idx on public.submissions (user_id, created_at desc);
alter table public.challenges
  add constraint challenges_winner_fk foreign key (winner_submission_id) references public.submissions (id) on delete set null;

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('🔥', '😂', '💀', '❤️', '👏', '😮')),
  created_at timestamptz not null default now(),
  unique (submission_id, user_id, reaction_type)
);
create index reactions_submission_idx on public.reactions (submission_id);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  -- client-generated id: lets the app reconcile optimistic messages and makes retries idempotent
  client_id text,
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 1000),
  media_url text,
  reply_to_message_id uuid references public.messages (id) on delete set null,
  challenge_id uuid references public.challenges (id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique (user_id, client_id)
);
create index messages_group_time_idx on public.messages (group_id, created_at desc);

create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 16),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, reaction)
);

create table public.streaks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_participation_date date,
  primary key (user_id, group_id)
);

create table public.leaderboard_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  period text not null, -- ISO week, e.g. 2026-W44
  participation_score int not null default 0,
  reaction_score int not null default 0,
  win_score int not null default 0,
  total_score int generated always as (participation_score * 10 + reaction_score + win_score * 50) stored,
  updated_at timestamptz not null default now(),
  primary key (user_id, group_id, period)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  actor_id uuid references public.profiles (id) on delete set null,
  group_id uuid references public.groups (id) on delete cascade,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  type public.notification_type not null,
  enabled boolean not null default true,
  primary key (user_id, group_id, type)
);

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'ios',
  created_at timestamptz not null default now()
);
