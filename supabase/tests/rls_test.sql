-- RLS checks run as the `authenticated` role with different JWT subjects.
grant usage on schema public, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
insert into auth.users (id, email) values ('99999999-9999-9999-9999-999999999999', 'outsider@pulsedeck.app');

set role authenticated;
-- 1. An outsider sees no groups, messages, or submissions.
select set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', false);
select 'outsider groups' as check, count(*) = 0 as pass from public.groups;
select 'outsider messages' as check, count(*) = 0 as pass from public.messages;
select 'outsider submissions' as check, count(*) = 0 as pass from public.submissions;
-- 2. An outsider cannot post into a group they are not in.
do $$ begin
  insert into public.messages (group_id, user_id, body) values ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'hi');
  raise notice 'FAIL: outsider message insert allowed';
exception when insufficient_privilege then raise notice 'PASS: outsider message insert blocked'; end $$;
-- 3. A member cannot spoof another user's id.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select 'member sees group' as check, count(*) = 1 as pass from public.groups;
select 'member sees feed' as check, count(*) = 4 as pass from public.submissions;
do $$ begin
  insert into public.messages (group_id, user_id, body) values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'spoof');
  raise notice 'FAIL: spoofed message allowed';
exception when insufficient_privilege then raise notice 'PASS: spoofed user_id blocked'; end $$;
-- 4. Members can't edit someone else's profile.
update public.profiles set bio = 'hacked' where id = '22222222-2222-2222-2222-222222222222';
select 'profile untouched' as check, bio <> 'hacked' as pass from public.profiles where id = '22222222-2222-2222-2222-222222222222';
-- 5. Self-vote is rejected; vote outside the voting window is rejected.
do $$ begin perform public.cast_vote('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002');
  raise notice 'FAIL: vote during submissions allowed';
exception when invalid_parameter_value then raise notice 'PASS: vote outside voting window blocked'; end $$;
-- 6. Joining by invite code works and is idempotent; bad codes fail.
select set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', false);
do $$ begin perform public.join_group('ZZZZZZ'); raise notice 'FAIL: bad code accepted';
exception when no_data_found then raise notice 'PASS: invalid invite code rejected'; end $$;
select 'join returns group' as check, name = 'Apartment 4B' as pass from public.join_group('4bfam1');
select 'join is idempotent' as check, member_count = 6 as pass from public.join_group('4BFAM1');
-- 7. Message as self after joining, and a reaction updates the author's score via trigger.
insert into public.messages (group_id, user_id, body, client_id) values ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'hey crew', 'c_1');
select 'message as self' as check, count(*) = 1 as pass from public.messages where client_id = 'c_1';
insert into public.reactions (submission_id, user_id, reaction_type) values ('dddddddd-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', '🔥');
select 'reaction score trigger' as check, reaction_score >= 1 as pass from public.leaderboard_overview where user_id = '22222222-2222-2222-2222-222222222222';
-- 8. create_group makes the caller owner with a starter challenge.
select 'create_group' as check, member_count = 1 as pass from public.create_group('Night Owls', '🦉');
select 'starter challenge' as check, count(*) = 1 as pass from public.challenges c join public.groups g on g.id = c.group_id where g.name = 'Night Owls';
reset role;
