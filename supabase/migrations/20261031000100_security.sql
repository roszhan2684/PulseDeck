-- Row Level Security, helper functions, views, RPCs, triggers, storage and realtime.
-- Principle: the client never decides ownership. Every write is checked against auth.uid().

-- ---------- helpers (security definer avoids RLS recursion on group_members) ----------
create or replace function public.is_member(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = p_group and user_id = auth.uid());
$$;

create or replace function public.is_group_admin(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = p_group and user_id = auth.uid() and role in ('owner', 'admin'));
$$;

create or replace function public.challenge_group(p_challenge uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select group_id from challenges where id = p_challenge;
$$;

create or replace function public.shares_group(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members a join group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

create or replace function public.current_period() returns text
language sql stable as $$ select to_char(now() at time zone 'America/New_York', 'IYYY-"W"IW'); $$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
alter table public.reactions enable row level security;
alter table public.votes enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.streaks enable row level security;
alter table public.leaderboard_scores enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_tokens enable row level security;

create policy "profiles: read self or groupmates" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_group(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "groups: members read" on public.groups for select to authenticated using (public.is_member(id));
create policy "groups: admins update" on public.groups for update to authenticated
  using (public.is_group_admin(id)) with check (public.is_group_admin(id));
-- inserts happen through create_group() so the owner membership is always created atomically

create policy "members: read own groups" on public.group_members for select to authenticated using (public.is_member(group_id));
create policy "members: leave or admin remove" on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_group_admin(group_id));
-- inserts happen through create_group() / join_group()

create policy "challenges: members read" on public.challenges for select to authenticated using (public.is_member(group_id));
create policy "challenges: admins create" on public.challenges for insert to authenticated
  with check (public.is_group_admin(group_id) and created_by = auth.uid());

create policy "submissions: members read" on public.submissions for select to authenticated
  using (public.is_member(public.challenge_group(challenge_id)));
create policy "submissions: create own while open" on public.submissions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_member(public.challenge_group(challenge_id))
    and exists (select 1 from public.challenges c where c.id = challenge_id and now() between c.starts_at and c.submission_ends_at)
  );
create policy "submissions: update own while open" on public.submissions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.challenges c where c.id = challenge_id and now() < c.submission_ends_at));
create policy "submissions: delete own" on public.submissions for delete to authenticated using (user_id = auth.uid());

create policy "reactions: members read" on public.reactions for select to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_id and public.is_member(public.challenge_group(s.challenge_id))));
create policy "reactions: react as self" on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.submissions s where s.id = submission_id and public.is_member(public.challenge_group(s.challenge_id))));
create policy "reactions: remove own" on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy "votes: members read" on public.votes for select to authenticated using (public.is_member(public.challenge_group(challenge_id)));
-- votes are written only through cast_vote()

create policy "messages: members read" on public.messages for select to authenticated using (public.is_member(group_id));
create policy "messages: send as self" on public.messages for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(group_id));
create policy "messages: edit own" on public.messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "message reactions: members read" on public.message_reactions for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id and public.is_member(m.group_id)));
create policy "message reactions: react as self" on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and public.is_member(m.group_id)));
create policy "message reactions: remove own" on public.message_reactions for delete to authenticated using (user_id = auth.uid());

create policy "streaks: members read" on public.streaks for select to authenticated using (public.is_member(group_id));
create policy "scores: members read" on public.leaderboard_scores for select to authenticated using (public.is_member(group_id));

create policy "notifications: own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications: mark read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notification prefs: own" on public.notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(group_id));
create policy "push tokens: own" on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- views (security_invoker: the caller's RLS applies) ----------
create view public.group_overview with (security_invoker = true) as
  select g.*, (select count(*) from public.group_members m where m.group_id = g.id)::int as member_count
  from public.groups g;

create view public.group_member_overview with (security_invoker = true) as
  select m.group_id, m.user_id, m.role, m.joined_at,
    to_jsonb(p.*) as profile,
    coalesce(s.current_streak, 0) as current_streak,
    exists (
      select 1 from public.submissions sub join public.challenges c on c.id = sub.challenge_id
      where c.group_id = m.group_id and sub.user_id = m.user_id and now() between c.starts_at and c.voting_ends_at
    ) as posted_today
  from public.group_members m
  join public.profiles p on p.id = m.user_id
  left join public.streaks s on s.user_id = m.user_id and s.group_id = m.group_id;

create view public.submission_feed with (security_invoker = true) as
  select sub.*, c.group_id,
    to_jsonb(p.*) as author,
    coalesce((select jsonb_object_agg(rc.reaction_type, rc.n) from (
      select r.reaction_type, count(*) as n from public.reactions r where r.submission_id = sub.id group by r.reaction_type
    ) rc), '{}'::jsonb) as reaction_counts,
    coalesce((select array_agg(r.reaction_type) from public.reactions r where r.submission_id = sub.id and r.user_id = auth.uid()), '{}') as my_reactions,
    (select count(*) from public.votes v where v.submission_id = sub.id)::int as vote_count
  from public.submissions sub
  join public.challenges c on c.id = sub.challenge_id
  join public.profiles p on p.id = sub.user_id;

create view public.leaderboard_overview with (security_invoker = true) as
  select m.group_id, m.user_id, to_jsonb(p.*) as profile,
    coalesce(ls.win_score, 0) as win_score,
    coalesce(ls.participation_score, 0) as participation_score,
    coalesce(ls.reaction_score, 0) as reaction_score,
    coalesce(st.current_streak, 0) as current_streak
  from public.group_members m
  join public.profiles p on p.id = m.user_id
  left join public.leaderboard_scores ls on ls.user_id = m.user_id and ls.group_id = m.group_id and ls.period = public.current_period()
  left join public.streaks st on st.user_id = m.user_id and st.group_id = m.group_id;

create view public.challenge_winners with (security_invoker = true) as
  select c.id as challenge_id, c.group_id, s.user_id
  from public.challenges c join public.submissions s on s.id = c.winner_submission_id;

create view public.reactions_received with (security_invoker = true) as
  select s.user_id, count(r.id)::int as total
  from public.submissions s join public.reactions r on r.submission_id = s.id
  group by s.user_id;

-- ---------- RPCs ----------
create or replace function public.create_group(p_name text, p_emoji text default '✨')
returns setof public.group_overview
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  insert into groups (name, emoji, owner_id) values (trim(p_name), coalesce(p_emoji, '✨'), v_uid) returning id into v_id;
  insert into group_members (group_id, user_id, role) values (v_id, v_uid, 'owner');
  insert into streaks (user_id, group_id) values (v_uid, v_id);
  insert into challenges (group_id, prompt, description, emoji, starts_at, submission_ends_at, voting_ends_at, status, created_by)
  values (v_id, 'Show us what’s in your fridge', 'Your first challenge. No judgment (some judgment).', '🧊',
          now(), now() + interval '8 hours', now() + interval '12 hours', 'active', v_uid);
  return query select * from group_overview where id = v_id;
end $$;

create or replace function public.join_group(p_code text)
returns setof public.group_overview
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  select id into v_id from groups where invite_code = upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));
  if v_id is null then raise exception 'No group uses that invite code' using errcode = 'P0002'; end if;
  insert into group_members (group_id, user_id) values (v_id, v_uid) on conflict do nothing;
  insert into streaks (user_id, group_id) values (v_uid, v_id) on conflict do nothing;
  return query select * from group_overview where id = v_id;
end $$;

create or replace function public.cast_vote(p_challenge uuid, p_submission uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_c challenges; v_owner uuid;
begin
  select * into v_c from challenges where id = p_challenge;
  if v_c.id is null or not is_member(v_c.group_id) then raise exception 'permission denied' using errcode = '42501'; end if;
  if now() not between v_c.submission_ends_at and v_c.voting_ends_at then raise exception 'Voting is closed' using errcode = '22023'; end if;
  select user_id into v_owner from submissions where id = p_submission and challenge_id = p_challenge;
  if v_owner is null then raise exception 'Submission not in this challenge' using errcode = '22023'; end if;
  if v_owner = v_uid then raise exception 'You can’t vote for your own post' using errcode = '22023'; end if;
  insert into votes (challenge_id, submission_id, user_id) values (p_challenge, p_submission, v_uid)
  on conflict (challenge_id, user_id) do update set submission_id = excluded.submission_id, created_at = now();
end $$;

-- Closes rounds: advances status and crowns the most-voted submission. Run by pg_cron every 5 minutes.
create or replace function public.finalize_challenges()
returns void
language plpgsql security definer set search_path = public as $$
declare r record; v_winner uuid; v_user uuid;
begin
  update challenges set status = 'active' where status = 'scheduled' and now() >= starts_at;
  update challenges set status = 'voting' where status = 'active' and now() >= submission_ends_at;
  for r in select * from challenges where status = 'voting' and now() >= voting_ends_at loop
    select s.id, s.user_id into v_winner, v_user from submissions s left join votes v on v.submission_id = s.id
      where s.challenge_id = r.id group by s.id, s.user_id, s.created_at order by count(v.id) desc, s.created_at asc limit 1;
    update challenges set status = 'completed', winner_submission_id = v_winner where id = r.id;
    if v_user is not null then
      insert into leaderboard_scores (user_id, group_id, period, win_score) values (v_user, r.group_id, current_period(), 1)
      on conflict (user_id, group_id, period) do update set win_score = leaderboard_scores.win_score + 1, updated_at = now();
    end if;
  end loop;
end $$;

-- ---------- triggers ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger submissions_touch before update on public.submissions for each row execute function public.touch_updated_at();

-- Participation + streak bookkeeping on every new submission.
create or replace function public.on_submission_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_group uuid := challenge_group(new.challenge_id); v_today date := (now() at time zone 'America/New_York')::date;
begin
  insert into leaderboard_scores (user_id, group_id, period, participation_score) values (new.user_id, v_group, current_period(), 1)
  on conflict (user_id, group_id, period) do update set participation_score = leaderboard_scores.participation_score + 1, updated_at = now();
  insert into streaks (user_id, group_id, current_streak, longest_streak, last_participation_date) values (new.user_id, v_group, 1, 1, v_today)
  on conflict (user_id, group_id) do update set
    current_streak = case
      when streaks.last_participation_date = v_today then streaks.current_streak
      when streaks.last_participation_date = v_today - 1 then streaks.current_streak + 1
      else 1 end,
    longest_streak = greatest(streaks.longest_streak, case when streaks.last_participation_date = v_today - 1 then streaks.current_streak + 1 else 1 end),
    last_participation_date = v_today;
  return new;
end $$;
create trigger submission_created after insert on public.submissions for each row execute function public.on_submission_created();

-- Reaction score follows the submission author.
create or replace function public.on_reaction_changed() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_sub submissions; v_delta int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  select * into v_sub from submissions where id = coalesce(new.submission_id, old.submission_id);
  if v_sub.id is null then return null; end if;
  insert into leaderboard_scores (user_id, group_id, period, reaction_score)
  values (v_sub.user_id, challenge_group(v_sub.challenge_id), current_period(), greatest(v_delta, 0))
  on conflict (user_id, group_id, period) do update set reaction_score = greatest(0, leaderboard_scores.reaction_score + v_delta), updated_at = now();
  return null;
end $$;
create trigger reaction_changed after insert or delete on public.reactions for each row execute function public.on_reaction_changed();

-- Fan out a notification row per member when a challenge is created (the push Edge Function reads these).
create or replace function public.on_challenge_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, type, actor_id, group_id, entity_id)
  select m.user_id, 'new_challenge', new.created_by, new.group_id, new.id from group_members m where m.group_id = new.group_id;
  return new;
end $$;
create trigger challenge_created after insert on public.challenges for each row execute function public.on_challenge_created();

-- ---------- storage: users can only write inside their own folder ----------
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', true) on conflict (id) do nothing;
create policy "submissions bucket: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "submissions bucket: update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "submissions bucket: delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- realtime ----------
alter publication supabase_realtime add table public.messages, public.leaderboard_scores, public.reactions;
