# Decision log (ADRs)

### ADR-001 Backend behind an interface, demo backend by default
**Context:** The app must be reviewable without anyone provisioning a backend, and must not cost money.
**Decision:** `services/types.ts` defines `Backend`. `demoBackend` (in-memory, simulated latency/realtime/failures) runs when no Supabase env vars are present; `supabaseBackend` runs when they are.
**Consequences:** Screens never import Supabase. Error, retry and rollback paths can be demoed on any device via Settings → *Simulate flaky network*. Two implementations must stay in sync (mitigated by sharing domain logic and mappers).

### ADR-002 React Query for server state, Zustand for app state
Optimistic update + rollback, cache invalidation and realtime cache writes come for free. Zustand holds only cross-screen UI state (persisted with AsyncStorage). No Redux.

### ADR-003 `client_id` on messages
Adds a column not in the original data model. Lets the client reconcile optimistic rows with server rows and makes resend idempotent (`unique(user_id, client_id)`).

### ADR-004 Ranking is derived, not stored
`leaderboard_scores` stores raw counters; rank is computed client-side with competition ranking (1, 2, 2, 4) and a stable username tie-break, so layout transitions animate reorders deterministically.

### ADR-005 Gesture Handler v3 hook API
SDK 58 ships RNGH 3.3. New code uses `usePanGesture` / `useTapGesture` / `useLongPressGesture` + `useCompetingGestures` / `useExclusiveGestures` rather than the legacy `Gesture.Pan()` builder.

### ADR-006 Single continuous `position` for the swipe deck
Instead of animating each card independently, one shared value (in card units) drives every card's translate/rotate/scale/opacity through interpolation. Next *and* previous are the same gesture; interrupted animations can be grabbed mid-flight; velocity is handed to the spring on release.

### ADR-007 Public storage bucket with owner-only writes
Media is served from a public bucket with unguessable paths (`<uid>/<challenge>-<timestamp>`). Writes are restricted by policy to the owner's folder. **Trade-off:** anyone with a URL can view it. Future: private bucket + signed URLs issued by an RPC that checks group membership.

### ADR-008 No Apple Sign In in v1
Requires a paid Apple Developer Program membership and entitlement setup. Email/password and magic link are implemented. Supabase supports Apple as a drop-in later.

### ADR-009 Figma replaced by a code-first design system for now
The Figma connector is not authorized in this environment, so the design system is defined in code (`src/theme`) and documented in `docs/design-system.md`, with the live component gallery in `/dev/motion-lab`. Figma pages should be generated from these tokens next (see README → Next steps).

### ADR-010 Per-weight font imports
Importing `@expo-google-fonts/*` from the package root bundles every weight. Importing each used weight by subpath cut the iOS export from 14.4 MB to 9.3 MB (measured, see `metrics.md`).

### ADR-011 Reanimated test mock
Reanimated 4.7's bundled Jest mock boots the native initializer under `jest-expo`. Component tests use a small explicit mock (`tests/reanimatedMock.ts`). Motion is verified in the simulator / Motion Lab rather than in Jest.
