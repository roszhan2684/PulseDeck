# Brag Plan: PulseDeck

## What is this app?
A motion-first iOS app where close friend groups get one tiny daily challenge ("Show us your worst desk setup"), post in 30 seconds, swipe through each other's answers, react, vote, chat and climb a live leaderboard.

## The angle
A confident, upbeat launch spot (app-store polish with real personality): the product's own absurd prompt — the worst desk setup — is the hero. Every scene is the actual app doing its thing: the card drops, the photo posts, the deck swipes, the leaderboard reshuffles. The joke is in the content (messy desks), the brag is in the motion.

## Hook (first 2-3 seconds)
A giant "TODAY'S CHALLENGE" card slams onto a dark stage with the LIVE NOW badge pulsing, and "Show us your worst desk setup" lands word by word over a real messy-desk photo while a countdown ticks. Narrator: "Every day, your group chat gets one tiny challenge."

## Key moments (the middle)
- Post in 30 seconds: a desk photo drops into the composer, progress fills 0→100%, a lime check pops with a 🔥 burst and "Posted!".
- The swipe deck: a cursor drags Maya's card left — it tilts and flies off, Tyler's card scales up from behind; a double-tap fires a 🔥 burst and the count rolls 4 → 5.
- Live: chat bubbles pop in one by one with a typing indicator; the leaderboard reshuffles — "You" climbs from #3 to #1 as digits roll.

## Outro / punchline
⚡ PulseDeck logo lands on the strongest music hit (18.0 s), tagline "Tiny daily challenges for your favorite people.", URL pulsedeck-ten.vercel.app and the stack line.

## User flow worth showing
Today's challenge → post a photo (upload states) → swipe + double-tap react → chat + leaderboard update.

## Tone
- Preset: app-store
- Creative direction: upbeat marketing launch spot with a wink — premium, warm, confident
- Interpretation: clean slides and springy reveals, readable holds, one voice carrying the story, no chaos.

## Format: landscape — 1920x1080
## Duration: 24 seconds (12 bars at 120 BPM; every scene starts on a bar line)

## Visual identity (from the project)
- Background: #09090F (surface #13131C, raised #1B1B27)
- Accent: pulse gradient #7C5CFF → #FF4F8B; lime #C8FF4D for live/success
- Text: #F4F4F8, muted #A9A9BC
- Display font: Bricolage Grotesque 800/700
- Body font: Inter 400–700
- Strongest visual element: the Challenge Card (photo + gradient scrim + LIVE NOW badge + countdown) and the tilted swipe-card stack

## Share copy (draft)
I built PulseDeck: one tiny daily challenge for your friend group, a physics swipe deck, realtime chat and a leaderboard that physically reshuffles. Try the live iPhone demo in your browser →

## Audio direction
- Role: warm, upbeat bed kept low under a single narrator
- Music: ORIGINAL score "Pulse Check" (composed for this video, `music/compose.py`, 120 BPM, C major, -14 LUFS master) — deliberately not a stock/bundled track
- Music treatment: low bed (0.24) with baked ducking under every VO line; riser into the 4.0 s drop, break at 16 s, big hit at 18.0 s for the logo, 1.6 s fade-out
- Music cue guidance: strong cues (by construction) at 0.0 (soft hit), 4.0 (drop + impact), 18.0 (logo impact); beat grid = every 0.5 s, bars every 2.0 s
- Audio-reactive treatment: subtle — background glow/phone presence breathes with music RMS; no visualizer graphics
- SFX posture: light, motion-matched (card slide on swipe, soft drop on post, glass clink on success, click on taps)
- Restraint rule: VO always wins; SFX never on top of a VO word peak at full volume

## Voiceover script
Kokoro `af_heart`, generated per line and placed at scene starts:
1. 0.4 s — "Every day, your group chat gets one tiny challenge." (2.90 s)
2. 4.3 s — "Snap it, post it. Thirty seconds, tops." (2.58 s)
3. 8.2 s — "Then swipe through everyone's answers, and double-tap the best one." (3.52 s)
4. 12.3 s — "Chat in real time, vote, and watch the leaderboard reshuffle live." (3.90 s)
5. 18.4 s — "PulseDeck. Tiny daily challenges for your favorite people." (3.46 s)

## Storyboard

### Scene 1 — The drop — 0–4 s
Challenge card (deskhero photo, scrim, LIVE NOW pulse, "TODAY'S CHALLENGE", prompt, CLOSES IN countdown ticking 6:29:59→6:29:56, avatar stack "6 of 8 in") slams in and settles; side copy "One prompt. Every day."
Sequential/interaction: prompt words land one by one, countdown ticks each second.
Audio intent: confident open; soft hit at 0, riser to the drop. Transition: clean slide → Scene 2

### Scene 2 — Post in 30 seconds — 4–8 s
iPhone frame: composer with prompt chip; desk photo drops in; "Post response" pressed; progress 0→100% ("Uploading 64%"); lime check pops + 🔥 burst + "Posted!". Side copy "Post in 30 seconds."
Sequential/interaction: simulated tap, progress fill, success pop. Audio: drop + click + glass clink. Transition: slide → Scene 3

### Scene 3 — The deck — 8–12 s
iPhone frame with a 3-card stack (Maya, Tyler, Marcus desk photos with captions/reaction chips); cursor drags top card left — rotation follows — card exits; next card scales up; double-tap → 🔥 burst, chip count 4→5. Side copy "Swipe. React. 🔥"
Audio: card slide on exit, soft pop on burst. Transition: slide → Scene 4

### Scene 4 — Live — 12–18 s
Two phones: chat bubbles pop in one by one (Marcus "taco tuesday after this? 🌮", Chloe "I'm in", You "say less 🔥") + typing dots; leaderboard rows reorder (You #3 → #1), digits roll 41 → 58. Side copy "Realtime chat. Live leaderboard."
Audio: soft drops per bubble (every other beat), whoosh on reorder. Transition: hard cut on the 18.0 s hit → Scene 5

### Scene 5 — Logo — 18–24 s
⚡ logo + "PulseDeck" lands on the 18.0 s impact; tagline; "Try the live demo → pulsedeck-ten.vercel.app"; small stack line "React Native · Expo · Reanimated · Supabase". Hold, fade out with the music.

**Music mood:** upbeat, warm, premium
**Audio summary:** a low original bed that builds into a drop under the post flow, grooves under the deck and live scenes, breaks, and hits hard on the logo while one warm narrator carries the story.
