# Motion specification

Tokens: `src/theme/motion.ts`. Durations: instant 130 · fast 190 · standard 270 · large 420 ms. Springs (damping/stiffness/mass): snappy 20/420/0.8 · standard 22/240/1 · soft 26/150/1 · playful 9/260/0.7.

| Interaction | Trigger | From → To | Motion | Related | Reduced motion |
|---|---|---|---|---|---|
| Button press | press in/out | scale 1 → 0.96 | snappy spring | soft haptic | opacity 1 → 0.7 |
| Card swipe | horizontal pan (12 pt) | follows finger; rotate ±12°, back card 0.92 → 1, +18 pt → 0 | standard spring with release velocity; commit at 28% width or 800 pt/s; rubber-band 25% at ends | dim layer on back cards | no rotate/scale; cross-fade + 20 pt slide |
| Double-tap react | 2 taps < 260 ms | emoji 0.2 → 1, rises 30 pt, fades after 520 ms; 7 particles radial 720 ms | playful spring | selection haptic, count +1 | emoji fade only, no particles |
| Long-press menu | 320 ms hold | 6 emojis zoom in, 27 ms stagger | spring damping 12 | medium haptic | fade |
| Expand media | tap card | card rect → full screen, radius 28 → 0 | soft spring | caption fades in at 70% | fade |
| Dismiss media / sheet | drag down | follows finger, scale to 0.6 | close past 120 pt or 900 pt/s, else standard spring back | backdrop fades with drag | fade |
| Leaderboard reorder | live score event | row slides to new index; digits roll | layout spring 22/240; digit standard spring | ▲▼ movement chevrons | instant layout |
| New chat message | insert | rises in from composer; others shift | spring damping 18 + item layout transition | — | no entrance |
| Swipe to reply | pan right 14 pt | bubble follows ×0.6, reply icon fades/scales | snappy spring back | selection haptic at 56 pt | same (functional) |
| Onboarding step | Continue / Back | content enters from right/left | 270 ms enter easing | progress bar springs | fade 190 ms |
| Onboarding finish | Let's go | screen scales 1 → 1.12 and fades | 420 ms exit easing, then tabs fade in | success haptic | immediate |
| Profile header | scroll | 330 → 52 pt bar; image parallax 0.45×, pull-to-stretch 1.5× | scroll-driven | title cross-fades into bar | no parallax/stretch |
| Tab change | tap | pill slides between tabs | snappy spring | selection haptic | 190 ms timing |
| Pulse ring | posted today | ring scale 1 → 1.35, opacity .55 → 0, loop 1.6 s | timing | — | static ring |
