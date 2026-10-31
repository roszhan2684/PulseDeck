-- Local demo data for `supabase db reset`. Every account's password: pulsedeck123
-- Photos: Unsplash CDN (free to use under the Unsplash License).
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, crypt('pulsedeck123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now()
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'jordan@pulsedeck.app'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'maya@pulsedeck.app'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'tyler@pulsedeck.app'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'ava@pulsedeck.app'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'marcus@pulsedeck.app')
) as u(id, email);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@pulsedeck.app';

update public.profiles p set username = v.username, display_name = v.display_name, city = v.city, bio = v.bio,
  avatar_url = 'https://images.unsplash.com/photo-' || v.photo || '?auto=format&q=70&w=240&h=240&fit=crop&crop=faces'
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'jordan.rivera', 'Jordan Rivera', 'Austin, TX', 'Breakfast taco evangelist.', '1539571696357-5a69c17a67c6'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'mayat', 'Maya Thompson', 'Brooklyn, NY', 'Group chat admin by force.', '1494790108377-be9c29b29330'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'tylerb', 'Tyler Brooks', 'Denver, CO', 'Climbing, cold brew, chaos.', '1507003211169-0a1dd7228f2d'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'ava.mtz', 'Ava Martinez', 'Miami, FL', 'Works remote. Very remote.', '1438761681033-6461ffad8d80'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'marcusj', 'Marcus Johnson', 'Atlanta, GA', 'Concert front row or nothing.', '1500648767791-00dcc994a43e')
) as v(id, username, display_name, city, bio, photo)
where p.id = v.id;

insert into public.groups (id, name, description, emoji, owner_id, invite_code, avatar_url) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Apartment 4B', 'Roommates + honorary roommates. Austin, TX.', '🏠', '22222222-2222-2222-2222-222222222222', '4BFAM1',
   'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&q=75&w=800&h=500&fit=crop');

insert into public.group_members (group_id, user_id, role)
select 'aaaaaaaa-0000-0000-0000-000000000001', id, case when id = '22222222-2222-2222-2222-222222222222' then 'owner'::member_role else 'member'::member_role end
from public.profiles;

insert into public.challenges (id, group_id, prompt, description, emoji, cover_url, starts_at, submission_ends_at, voting_ends_at, status, created_by) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Show us your worst desk setup', 'No cleaning allowed.', '🖥️',
   'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&q=75&w=900', now() - interval '5 hours', now() + interval '6 hours', now() + interval '10 hours', 'active', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Best breakfast under $10', 'Diner, drive-thru or your own kitchen.', '🥞',
   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&q=75&w=900', now() - interval '3 days', now() - interval '62 hours', now() - interval '2 days', 'completed', '22222222-2222-2222-2222-222222222222');

insert into public.submissions (id, challenge_id, user_id, media_type, media_url, thumbnail_url, body, caption) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'photo',
   'https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&q=75&w=1080', 'https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&q=75&w=360', null, 'cable management is a state of mind'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'photo',
   'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&q=75&w=1080', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&q=75&w=360', null, 'monitor arm is held up by my old calc textbook'),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'text', null, null,
   'I don’t have a desk. I work from the Target parking lot. 4 bars of LTE and a dream.', ''),
  ('dddddddd-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'photo',
   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&q=75&w=1080', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&q=75&w=360', null, 'IHOP who? homemade, $4 total');

update public.challenges set winner_submission_id = 'dddddddd-0000-0000-0000-000000000004' where id = 'cccccccc-0000-0000-0000-000000000002';

insert into public.reactions (submission_id, user_id, reaction_type) values
  ('dddddddd-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '🔥'),
  ('dddddddd-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '😂'),
  ('dddddddd-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', '💀'),
  ('dddddddd-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', '😂');

insert into public.messages (group_id, user_id, body, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'ok who left the oat milk out AGAIN 😤', now() - interval '3 hours'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'not me. I’m lactose intolerant and emotionally unavailable', now() - interval '176 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'it was Marcus. I have Ring footage', now() - interval '171 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'taco tuesday at Veracruz after this? 🌮', now() - interval '12 minutes');
