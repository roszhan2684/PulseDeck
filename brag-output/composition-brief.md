# Hyperframes Composition Brief: PulseDeck

## Objective
Short upbeat launch film for PulseDeck that shows the real product loop: today's challenge → post → swipe/react → live chat + leaderboard → logo + live demo URL.

## Output
- Composition: `brag-output/composition/` (standalone `index.html`, `pulsedeck-launch`, 1920x1080, 24 s, 60 fps)
- Master render: `brag-output/brag-4k.mp4` (`--quality delivery --resolution 4k --fps 60`) → `brag.mp4` (poster baked as frame 0)
- Web copy: `website/assets/pulsedeck-launch.mp4` (1080p)

## Source material
- Project: PulseDeck (`README.md`, `website/index.html`, `app/`, `src/components/challenge/ChallengeCard.tsx`, `src/components/motion/SwipeDeck.tsx`, `docs/screenshots/*`)
- Strongest claim: "Tiny daily challenges for your favorite people."
- Recreated UI: Challenge Card (LIVE NOW, prompt, countdown, avatar stack, CTA), submit/upload/success states, swipe deck with reaction chips, group chat with reply quote, reactions leaderboard
- Verbatim copy: "Show us your worst desk setup", "Tiny daily challenges for your favorite people.", "pulsedeck-ten.vercel.app"
- Demo data: fictional American demo users and Unsplash photography (no real user data)

## Creative direction
- Tone: app-store preset, freeform "upbeat marketing launch spot with a wink"
- Hook: challenge card slams in with the prompt landing word by word and a ticking countdown
- Outro: logo lands on the 18.0 s music hit, URL + stack line
- Avoid: generic SaaS language, abstract filler, inventing features

## Visual identity
Background #09090F · text #F4F4F8 · accents #7C5CFF→#FF4F8B gradient, lime #C8FF4D · Bricolage Grotesque 700/800 + Inter 400–700 (local @font-face) · Apple Color Emoji via local().

## Storyboard
1. The drop — 0–4 s — challenge card + "One prompt. Every day."
2. Post — 4–8 s — photo drop, tap Post, upload 0→100%, "Posted!" + 🔥 burst
3. Deck — 8–12 s — drag-swipe with rotation, back card springs up, double-tap 🔥 burst, count 4→5
4. Live — 12–18 s — chat bubbles + typing; leaderboard "You" #3→#1, score rolls 41→58
5. Logo — 18–24 s — logo, wordmark, tagline, URL, stack; fade to black

## Audio
- Music: original score `assets/music/pulse-check.wav` (composed for this film by `brag-output/music/compose.py`; 120 BPM; -14 LUFS master; EQ carved for voice) at `data-volume` 0.26 with baked −6 dB ducking under each VO line → effective ≈0.13 under narration
- Cue guidance: by construction — strong cues 0.0 / 4.0 / 18.0 s, beats every 0.5 s; locks marked `// beat-locked` / `// beat-grid` in the timeline
- Audio-reactive: background glows read a precomputed per-frame RMS array (`assets/rms.js`) — opacity/scale only, no visualizer graphics
- Voiceover: Kokoro `af_heart`, 5 lines at 0.4 / 4.3 / 8.2 / 12.3 / 18.4 s
- SFX (CC0 Kenney, from the brag library): drop (photo), click (tap), glass (posted), card-slide (swipe), clicks (double-tap), soft impact (burst), drops (chat), card-fan (reorder) at 0.45–0.6
