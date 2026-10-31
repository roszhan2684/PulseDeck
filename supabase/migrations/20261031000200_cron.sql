-- pg_cron is free on Supabase. Finalizes rounds and awards wins every 5 minutes.
create extension if not exists pg_cron;
select cron.schedule('finalize-challenges', '*/5 * * * *', $$select public.finalize_challenges()$$);
