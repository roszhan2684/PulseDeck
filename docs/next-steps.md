# Next steps

Ordered by portfolio impact. Status as of 2026-10-31.

## Done
- App: onboarding, daily challenge, swipe deck, reactions, realtime chat, groups, profiles, leaderboard, Motion Lab, notifications, reduced motion
- Demo backend + Supabase backend (schema, RLS, RPCs, triggers, storage, realtime, cron, push Edge Function)
- 55 Jest tests, 16 SQL/RLS checks, typecheck/lint clean, iOS export builds
- Marketing site with in-browser iPhone walkthrough (https://pulsedeck-ten.vercel.app), 4K launch film with original score + voiceover, GitHub repo, portfolio case study (roszhan.vercel.app → Works → PulseDeck)

## To do
1. **Figma file** — authorize the Figma connector (claude.ai → Settings → Connectors), then generate pages 01 Foundations, 02 Components, 03 Motion and 04–11 screens from `docs/design-system.md` + `docs/motion-spec.md`. Add Figma-vs-production pairs to the README.
2. **Physical iPhone pass** — dev build (`npx eas-cli build --profile development`, free tier), then record in `docs/metrics.md`: cold start, deck swipe FPS (Perf Monitor / Instruments), chat 500-message scroll, leaderboard reorder, memory after 50 cards. Full VoiceOver + largest Dynamic Type pass (`docs/accessibility.md`).
3. **Run Maestro** — `maestro test .maestro/core-loop.yaml` on the simulator; add flows for onboarding, failed upload → retry, invalid invite.
4. **Hosted Supabase** — create a free project, apply migrations + seed, set `.env`, verify two-device realtime chat, reconnect backfill and leaderboard events; wire the `notify-challenge` webhook.
5. **Private media** — move the `submissions` bucket to private + signed URLs via a membership-checked RPC (ADR-007).
6. **TestFlight** — needs an Apple Developer account ($99/yr; skip until ready). Then Apple Sign In (ADR-008).
7. **Polish backlog** — per-group challenge scheduling UI for admins, comment threads on submissions, Android pass, CI (GitHub Actions: typecheck, lint, jest, SQL verify).
8. **Resume** — rewrite bullets with the measured numbers from step 2 only.
