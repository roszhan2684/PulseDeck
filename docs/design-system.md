# Design system

Code is the source of truth (`src/theme`). These tables are the spec to mirror in Figma (pages 01 Foundations, 02 Components, 03 Motion).

## Color
| Token | Hex | Use |
|---|---|---|
| bg | #09090F | app background |
| surface / surfaceRaised / surfaceSunken | #13131C / #1B1B27 / #0E0E15 | cards, sheets, wells |
| border / borderStrong | #262635 / #383849 | hairlines |
| text / textMuted / textSubtle | #F4F4F8 / #A9A9BC / #7A7A90 | type hierarchy |
| primary | #7C5CFF | actions, selection |
| accent | #FF4F8B | gradient end, voting |
| lime | #C8FF4D | live, streak, success highlights |
| success / warning / danger / info | #2EE59D / #FFB547 / #FF5A6E / #4CC9F0 | status |
| gold / silver / bronze | #FFD15C / #CBD2E1 / #E3A06B | podium |
Gradients: **pulse** primary→accent (brand, primary buttons), sunset, aurora, lime, mediaFade (scrim for text on photos).

## Type
Bricolage Grotesque (display/headings, personality) + Inter (UI/body, legibility). Both free on Google Fonts.
| Style | Font | Size/Line | Tracking |
|---|---|---|---|
| Display | Bricolage 800 | 40/44 | −1.2 |
| H1 | Bricolage 700 | 30/36 | −0.6 |
| H2 | Bricolage 700 | 24/30 | −0.4 |
| H3 | Bricolage 600 | 19/24 | −0.2 |
| Body / Body strong | Inter 400 / 600 | 16/24 | 0 |
| Body small | Inter 400 | 14/20 | 0 |
| Caption | Inter 500 | 12/16 | 0.2 |
| Overline | Inter 600 caps | 11/14 | 1.2 |
| Button | Inter 600 | 16/20 | 0 |
| Metric | Bricolage 700 tabular | 28/32 | −0.5 |

## Spacing, radii, elevation
Spacing 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48. Radii 6 · 10 · 14 · 20 · 28 · 36 · pill. Screen padding 20. Min touch 44. Shadows sm / md / glow (violet).

## Components (variants)
Button (primary · lime · secondary · ghost · danger × sm/md/lg × default/pressed/disabled/loading) · IconButton (solid/ghost/glass, badge) · TextField (default/focus/error/hint, secure) · Avatar / AnimatedAvatar (selected, pulse) · AvatarStack · Card · Badge (7 tones, live dot) · Chip (selected, count) · SegmentedControl · Sheet · AnimatedModal · Toast (info/success/error, action) · Skeleton (+ ChallengeCard/Row skeletons) · EmptyState · ErrorState (per error kind) · SectionHeader · TabBar · ChallengeCard (5 phases) · SubmissionCard (photo/video/text, winner, voted) · ReactionPicker · ReactionBar · MessageBubble (sending/sent/failed, reply, reactions, challenge ref, media) · TypingIndicator · LeaderboardRow (podium, leader, me, movement) · StatTile · BadgeCarousel · SubmissionGrid.

## App icon
A deck of cards (ghosted back card, solid front card) with a pulse line, on the violet → magenta → pink gradient. Source of truth: `scripts/build-icons.py` → `brand/*.svg`.
| Asset | File |
|---|---|
| iOS / Expo icon (full bleed, OS masks corners) | `assets/images/icon.png` (1024) |
| Android adaptive | `assets/images/android-icon-{foreground,background,monochrome}.png` (mark in the 74% safe zone) |
| Splash | `assets/images/splash-icon.png` on #09090F |
| Web favicon (simplified for 16–48 px) | `website/assets/favicon.{svg,ico}`, `favicon-32.png`, Expo web `assets/images/favicon.png` |
| Apple touch / PWA | `website/assets/apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `site.webmanifest` |
| In-app & on-page logo | `<BrandMark />` (react-native-svg), `website/assets/logo.svg`, launch film |

## Inspiration
Mobbin (BeReal, Locket, Snapchat flows), Game UI Database + HUDS+GUIS (leaderboard, pulse rings), Design Spells (micro-interactions), 60fps (swipe and sheet physics).
