// Supabase Edge Function (Deno). Wire it to a Database Webhook on INSERT into public.notifications.
// Sends Expo push notifications (free service) and respects per-group preferences.
import { createClient } from 'jsr:@supabase/supabase-js@2';

type NotificationRow = { user_id: string; type: string; group_id: string; entity_id: string };

const copy: Record<string, (prompt: string) => { title: string; body: string }> = {
  new_challenge: (p) => ({ title: 'New challenge 🔔', body: p }),
  voting_open: (p) => ({ title: 'Voting is open 🗳️', body: `Pick a winner for “${p}”` }),
  winner: (p) => ({ title: 'We have a winner 👑', body: `Results are in for “${p}”` }),
};

Deno.serve(async (req) => {
  const { record } = (await req.json()) as { record: NotificationRow };
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: pref } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .match({ user_id: record.user_id, group_id: record.group_id, type: record.type })
    .maybeSingle();
  if (pref && !pref.enabled) return new Response('muted', { status: 200 });

  const [{ data: tokens }, { data: challenge }] = await Promise.all([
    supabase.from('push_tokens').select('token').eq('user_id', record.user_id),
    supabase.from('challenges').select('id, prompt').eq('id', record.entity_id).maybeSingle(),
  ]);
  if (!tokens?.length || !challenge) return new Response('nothing to send', { status: 200 });

  const message = (copy[record.type] ?? copy.new_challenge)(challenge.prompt);
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokens.map((t) => ({ to: t.token, ...message, data: { url: `/challenge/${challenge.id}` } }))),
  });
  return new Response(await res.text(), { status: res.status });
});
