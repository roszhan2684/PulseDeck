# Metrics (measured, not estimated)

Measured 2026-10-31 on the development machine. Device metrics are pending a physical-iPhone session (see `performance.md`).

| Metric | Value | Source |
|---|---|---|
| Reusable UI primitives | 17 | `src/components/ui` |
| Motion primitives | 13 | `src/components/motion` |
| Routes (screens) | 16 | `app/` |
| App source (TS/TSX) | ~8,000 lines | `app/` + `src/` |
| SQL (migrations + seed) | 526 lines | `supabase/` |
| Jest tests | 55 passing, 7 suites | `npm test` |
| SQL/RLS checks | 16 passing | `supabase/tests/verify.sh` |
| Domain-logic coverage | 98% statements, 93% branches | `jest --coverage` (src/domain) |
| iOS export size | 9.3 MB (from 14.4 MB) | `expo export` |
| Metro iOS bundle | 5.4–6.5 s, 4,265 modules | Metro log |
| Largest screen file | 181 lines | `app/challenge/[id].tsx` |
| TypeScript errors / lint errors | 0 / 0 | `npm run typecheck`, `npm run lint` |

Pending (device): cold start, swipe FPS, P95 message-to-render, P95 reaction latency, upload duration, Figma component count.
