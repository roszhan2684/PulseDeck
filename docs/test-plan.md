# Test plan

## Automated (run on every checkpoint)
| Command | What it covers |
|---|---|
| `npm run typecheck` | strict TypeScript incl. Expo typed routes (every `href` checked) |
| `npm run lint` | eslint-config-expo + React Compiler rules, no `any`, no empty catch |
| `npm test` | 55 Jest tests (domain rules, demo-backend server rules, UI primitives) |
| `bash supabase/tests/verify.sh` | migrations + seed apply on Postgres; 16 RLS / RPC / trigger checks |
| `npx expo export --platform ios` | production bundle builds |

### Jest suites
- `challengeState.test.ts` — phase machine incl. exact boundaries, countdown formatting
- `leaderboard.test.ts` — sort, competition ranking ties, stable tie-break, live delta, immutability
- `messages.test.ts` — optimistic reconcile by clientId, realtime de-dup, ordering, failed/retry, reactions
- `reactions.test.ts` — toggle vs idempotent double-tap, multi-type, vote move/no-op
- `validation.test.ts` — username, email, password, invite code normalization, group names
- `demoBackend.test.ts` — session restore, bad credentials, membership filtering, invalid invite, permission after leaving, self-vote blocked, upload phase order, flaky upload failure, realtime echo carries clientId
- `components.test.tsx` — Button accessible name + loading blocks presses; ErrorState copy + recovery

### SQL checks (`supabase/tests/rls_test.sql`)
Outsider can't read groups/messages/submissions or post; member can't spoof `user_id`; can't edit others' profiles; voting outside window rejected; invalid invite rejected; join idempotent; reaction trigger updates author score; `create_group` makes owner + starter challenge.

## Manual matrix (simulator / device)
| Flow | Happy path | Failure / edge |
|---|---|---|
| Signup → onboarding | 7 steps, success hand-off to tabs | taken username, invalid code, back navigation keeps draft |
| Login | demo creds | `locked@pulsedeck.app` → auth error; magic-link sent state |
| Create / join group | sheet in Groups tab | invalid code copy; duplicate join is a no-op |
| Submit challenge | photo / video / text, progress phases | Settings → flaky network → "Upload failed" → Retry keeps media |
| Swipe feed | swipe both ways, velocity flick, snap back | first/last card rubber-band; a11y prev/next buttons |
| React | double-tap burst, long-press menu, chips | flaky network → rollback + toast; rapid double-taps never undo |
| Vote | voting phase, change vote | own post disabled; server rejects outside window |
| Chat | send, reply (swipe), react, photo, challenge ref | flaky → failed bubble → tap to retry; no duplicates after echo |
| Leaderboard | live reorder every ~4s, metric tabs | ties share rank |
| Profile | collapsing header, rolling stats, badges | empty grid state |
| Notifications | Settings → test notification → tap opens challenge | permission denied copy |
| Reduced motion | Settings → Reduced | no particles, no parallax, fades only, all actions still work |
| Logout / login | session cleared | session restored on relaunch |

## Not yet automated
Maestro E2E (flows above; `EXPO_PUBLIC_DEMO_AUTOLOGIN=1` makes them deterministic), Supabase realtime against a hosted project, physical-device haptics.
