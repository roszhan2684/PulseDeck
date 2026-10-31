# Architecture

```
app/                 Expo Router routes (thin: compose features, no data access)
src/
  theme/             tokens: colors, typography, spacing, motion  ← single source of truth
  components/
    ui/              visual primitives (no business logic)
    motion/          reusable motion primitives (Reanimated + Gesture Handler)
    feed/ chat/ profile/ leaderboard/ challenge/ group/   feature-level presentational components
  features/          hooks + feature logic (React Query) per domain
  domain/            pure business rules (unit tested, no React)
  services/
    types.ts         Backend interface — the only data boundary
    demo/            in-memory backend with latency, failures, realtime simulation
    supabase/        Supabase implementation (Postgres, Auth, Realtime, Storage)
  store/             Zustand: session, selected group, motion pref, onboarding draft, toasts
  lib/               errors, haptics, logger, query client, images, time
supabase/            migrations (schema + RLS + RPC + triggers), seed, edge function, SQL tests
tests/               Jest unit, backend-rule and component tests
```

## Data flow
```
Screen ─▶ feature hook (useFeed, useChat, useLeaderboard…) ─▶ backend (interface)
   ▲              │                                              ├─ demoBackend
   └── React Query cache ◀── realtime subscription ◀─────────────┘─ supabaseBackend
```
- **Server state** = React Query cache. Supabase is authoritative.
- **Global UI state** = Zustand, limited to: session, selected group, motion preference, onboarding draft, notification preferences, toasts.
- **Local UI state** = component state (index of the swipe deck, open sheets, drafts).
- Backend selection happens once in `services/backend.ts`: Supabase if `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` are set, otherwise demo.

## Optimistic updates
| Action | Where | Temp id | Rollback |
|---|---|---|---|
| Send message | `features/chat/useChat.ts` | `clientId` (also stored server-side, unique per user) | message marked `failed`, tap to retry |
| Reaction | `features/reactions/useReactions.ts` | n/a (idempotent toggle) | restore previous cache + toast |
| Vote | same | n/a | restore feed + previous vote + toast |
| Rename group / profile | `useGroups`, `useProfile` | n/a | restore previous + toast |

Reconciliation rules (`domain/messages.ts`): server row replaces the optimistic row with the same `clientId`; realtime echoes of a row already in the list are dropped (no duplicates).

## Realtime
- Chat: one channel per group. Postgres `INSERT` on `messages` + broadcast `typing` events. On reconnect (`reconnecting → connected`) the message query is invalidated to backfill anything missed.
- Leaderboard: `postgres_changes` on `leaderboard_scores`, refetch and push into the cache. Ranking is derived (`rankEntries`), never stored, so reorders animate via layout transitions.
- Demo backend emits the same events (echo of your own message, simulated friend typing + reply, score bumps every ~4s).

## Motion architecture
- All constants in `src/theme/motion.ts` (durations, easings, 4 springs, gesture thresholds, layout presets).
- `useReducedMotionPref()` merges iOS Reduce Motion with the in-app override (System / Reduced / Full).
- Gesture-driven animation runs on the UI thread (worklets). JS only receives settled results via `scheduleOnRN`.
- 13 motion primitives in `src/components/motion`, all demoed in `/dev/motion-lab`.

## Security
RLS on every table; ownership derived from `auth.uid()`; membership checks through `security definer` helpers to avoid policy recursion; group creation/join/voting through RPCs that validate windows and rules server-side; storage writes restricted to `<uid>/…`. Verified by `supabase/tests/rls_test.sql`.

## Navigation and auth guard
`app/_layout.tsx` uses `Stack.Protected`: signed-in + onboarded users get tabs and app routes; everyone else gets `(auth)`. Finishing onboarding flips the guard after a coordinated exit animation.
