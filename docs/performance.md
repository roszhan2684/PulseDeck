# Performance

## Principles applied
- **Gestures on the UI thread.** SwipeDeck, sheet drag, swipe-to-reply, Motion Lab sliders and the shared media transition run entirely in worklets. JS is notified once per settled gesture (`scheduleOnRN`).
- **One shared value per deck.** Every card derives its transform from one `position`; no per-card JS state during a drag.
- **Windowed rendering.** The deck mounts at most 6 cards (index −2 … +3) regardless of feed size.
- **Thumbnails in lists.** Feed previews, grids and activity use 160–360 px Unsplash renditions; full 1080 px only for the expanded view. `expo-image` caches to memory + disk with `recyclingKey`.
- **Derived data memoized where it's recomputed on every tick** (ranking, chat maps). React Compiler is on for the rest.
- **Inverted list for chat** with item layout transitions, so new messages don't shift the viewport.
- **Font subsetting by import** (see below).

## Measured (MacBook, Expo SDK 58, iOS export)
| Metric | Before | After | How |
|---|---|---|---|
| iOS export size (bundle + assets) | 14.4 MB | **9.3 MB** | `npx expo export --platform ios`, `du -sk` |
| Asset files in export | 48 | **30** | same |
| Hermes bytecode bundle | 7.7 MB | 7.7 MB | same (dev deps tree-shaken by Metro) |
| Metro iOS bundle time (warm) | — | 5.4–6.5 s, 4,265 modules | Metro log |

Change: import each Google Font weight by subpath (`@expo-google-fonts/inter/400Regular`) instead of the package root.

## Still to measure on a physical iPhone
Not invented here. Fill these in from Xcode Instruments / Perf Monitor on device:
cold start, FPS during deck swipe (target 60/120 Hz with no dropped frames), chat with 500+ messages, leaderboard reorder, profile header scroll, memory after 50 feed cards. Budgets: deck swipe ≥ 58 fps, cold start < 2 s on iPhone 13, JS thread idle during gestures.
