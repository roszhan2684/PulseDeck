# Product — PulseDeck

**One line:** tiny daily challenges for close friend groups. Post in 30 seconds, react, vote, keep the streak.

## Users
Friend groups of 4–12 people, ages 18–30: roommates, college friends, coworkers, gaming crews. Private groups only. No public followers.

## Core loop
Open app → see today's challenge → browse friends' responses (swipe deck) → post your own → react / vote → chat → winner announced → streaks and leaderboard update → next challenge.

Target: a first-time poster can go from opening the app to a posted response in about 30 seconds (center **+** in the tab bar goes straight to the composer).

## Challenge lifecycle
| Phase | When | Primary CTA |
|---|---|---|
| upcoming | before `starts_at` | "Notify me" (schedules a reminder) |
| active | until `submission_ends_at`, viewer hasn't posted | Answer the challenge |
| submitted | active, viewer has posted | See the deck |
| voting | `submission_ends_at` → `voting_ends_at` | Vote for a winner |
| completed | after `voting_ends_at` | See results (winner card crowned) |

Logic lives in `src/domain/challengeState.ts` and is unit tested.

## Product rules (decided)
- **Reactions:** six types (🔥 😂 💀 ❤️ 👏 😮). One of each type per user per submission. Double-tap only *adds* 🔥 (it never removes, so rapid double-taps are safe). Long-press menu and the reaction bar toggle.
- **Votes:** one per user per challenge. Voting again moves the vote. You can't vote for your own post. Voting only during the voting window.
- **Submissions:** one per user per challenge. Posting again while open replaces the earlier response.
- **Winner:** most votes; ties go to the earliest post. Awards +1 weekly win.
- **Streaks:** consecutive days with a post in that group (America/New_York day boundary).
- **Leaderboard:** weekly (ISO week, resets Monday 12:00 AM ET). Metrics: wins, participation, reactions received, streak.
- **Chat:** realtime, optimistic send with retry, swipe-to-reply, emoji reactions, challenge references, photo sharing, typing indicator.

## Out of scope for v1
Public discovery, DMs, comments on individual submissions (chat covers it), editing posts after voting opens, Android-specific polish, Apple Sign In (needs a paid Apple Developer account; see `decisions.md`).
