"""Original score for the PulseDeck launch film — "Pulse Check" (120 BPM, C major, 24 s).

Pure numpy/scipy synthesis, so the track is new, royalty-free and reproducible:
    python3 brag-output/music/compose.py
Structure (bars are 2 s): intro + riser (0-4) → drop (4) → bell hook (8-16) → break + riser (16-18)
→ logo hit (18) → outro (18-24). Music ducks under each voiceover line.
"""
import numpy as np
from pathlib import Path
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48_000
BPM = 120
BEAT = 60 / BPM
LEN = 24.0
N = int(SR * LEN)
rng = np.random.default_rng(7)
OUT = Path(__file__).resolve().parents[1] / "composition" / "assets" / "music"

# Voiceover windows (start, duration) — music ducks underneath.
VO = [(0.4, 2.90), (4.3, 2.58), (8.2, 3.52), (12.3, 3.90), (18.4, 3.46)]

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def t(n): return np.arange(n) / SR
def lp(x, f, order=2): return sosfilt(butter(order, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def saw(f, n, ph=0.0): return 2 * ((t(n) * f + ph) % 1) - 1

def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain

def env(n, a, d, s=0.0, r=0.0, hold=None):
    """ADSR-ish envelope in seconds; hold = sustain length."""
    a_n, d_n = int(a * SR), int(d * SR)
    hold_n = int((hold or 0) * SR)
    r_n = int(r * SR)
    e = np.concatenate([np.linspace(0, 1, max(a_n, 1)), np.linspace(1, s, max(d_n, 1)), np.full(hold_n, s), np.linspace(s, 0, max(r_n, 1))])
    return np.pad(e, (0, max(0, n - len(e))))[:n]

# ---------- progression: C – G – Am – F (one chord per 2 s bar) ----------
CHORDS = {
    "C": ([60, 64, 67, 74], 36), "G": ([59, 62, 67, 69], 43),
    "Am": ([60, 64, 69, 71], 45), "F": ([60, 65, 69, 72], 41),
}
BARS = ["C", "G", "Am", "F", "C", "G", "Am", "F", "C", "G", "C", "F"]

L = np.zeros(N); R = np.zeros(N)
drums = np.zeros(N); bass = np.zeros(N)
pad_l = np.zeros(N); pad_r = np.zeros(N)
pluck = np.zeros(N); bell = np.zeros(N); fx = np.zeros(N)

# ---------- pad: detuned supersaw, slow attack ----------
for b, name in enumerate(BARS):
    notes, _ = CHORDS[name]
    n = int(2.2 * SR)
    for m in notes:
        for k, det in enumerate([-0.12, -0.05, 0.0, 0.06, 0.13]):
            f = hz(m) * 2 ** (det / 12)
            v = saw(f, n, ph=rng.random()) * env(n, 0.35, 0.6, 0.7, 0.5, hold=0.8)
            place(pad_l if k % 2 == 0 else pad_r, v, b * 2.0, 0.05)
pad_l, pad_r = lp(pad_l, 2400), lp(pad_r, 2400)

# ---------- pluck arp: 16ths, filter opens at the drop ----------
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
for b, name in enumerate(BARS):
    notes, _ = CHORDS[name]
    for s in range(16):
        at = b * 2.0 + s * BEAT / 4
        if 16.0 <= at < 18.0 and s % 2: continue  # thinner in the break
        m = notes[pattern[s % 8]] + 12
        n = int(0.32 * SR)
        v = (saw(hz(m), n) * 0.6 + np.sign(np.sin(2 * np.pi * hz(m) * t(n))) * 0.4) * np.exp(-t(n) * 16)
        cutoff = 900 if at < 4.0 else (1800 + 2400 * min(1, (at - 4) / 4)) if at < 16 else 1600
        accent = 1.0 if s % 4 == 0 else 0.7
        place(pluck, lp(v, cutoff), at, 0.16 * accent)

# ---------- bass: offbeat 8ths, sub + filtered saw ----------
for b, name in enumerate(BARS):
    _, root = CHORDS[name]
    if b < 2 or 8 <= b < 9: continue
    for e8 in range(8):
        at = b * 2.0 + e8 * BEAT / 2
        n = int(0.24 * SR)
        f = hz(root)
        v = (np.sin(2 * np.pi * f * t(n)) * 0.8 + lp(saw(f, n), 500) * 0.5) * env(n, 0.005, 0.18, 0.4, 0.04, hold=0.0)
        place(bass, v, at, 0.32 if e8 % 2 else 0.22)

# ---------- drums ----------
def kick(n=int(0.45 * SR)):
    tt = t(n)
    f = 48 + 110 * np.exp(-tt * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-tt * 300) * 0.25
    return np.tanh((body + click) * 1.6)

def clap(n=int(0.3 * SR)):
    noise = bp(rng.standard_normal(n), 900, 2600)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += np.exp(-t(n - i) * (60 if k < 2 else 14))
    return noise * e * 0.5

def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    return hp(rng.standard_normal(n), 7500) * np.exp(-t(n) * (14 if open_ else 70))

KICK, CLAP = kick(), clap()
duck = np.ones(N)  # sidechain envelope from kicks
for b in range(12):
    for q in range(4):
        at = b * 2.0 + q * BEAT
        full = 4.0 <= at < 16.0
        intro = 2.0 <= at < 4.0
        outro = at >= 18.0
        if full or (intro and q in (0, 2)) or (outro and q in (0, 2)) or at == 0.0:
            place(drums, KICK, at, 0.9 if full or at in (0.0, 18.0) else 0.55)
            i = int(at * SR); k = int(0.16 * SR)
            duck[i:i + k] = np.minimum(duck[i:i + k], 1 - 0.65 * np.exp(-t(k) * 18))
        if (full or outro) and q in (1, 3):
            place(drums, CLAP, at, 0.55)
        for h in range(2):
            hat_at = at + h * BEAT / 2
            if 4.0 <= hat_at < 18.0 or outro:
                is_open = 12.0 <= hat_at < 16.0 and h == 1
                place(drums, hat(is_open), hat_at, 0.10 if h else 0.06)

# ---------- fx: risers into the drop and the logo, impacts ----------
def riser(start, end):
    n = int((end - start) * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n); chunk = int(0.05 * SR)
    for c in range(0, n, chunk):
        prog = c / n
        out[c:c + chunk] = bp(noise[c:c + chunk + 0], 400 + 7000 * prog ** 2, 900 + 9000 * prog ** 2)[: len(out[c:c + chunk])]
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * (t(n) / (n / SR)) ** 2) / SR) * 0.15
    return (out * 0.35 + tone) * np.linspace(0, 1, n) ** 2

def impact(n=int(2.2 * SR)):
    tt = t(n)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 50 * np.exp(-tt * 9)) / SR) * np.exp(-tt * 2.2)
    air = lp(rng.standard_normal(n), 3000) * np.exp(-tt * 5) * 0.3
    return np.tanh((boom + air) * 1.4)

place(fx, riser(2.0, 4.0), 2.0, 0.5)
place(fx, riser(16.0, 18.0), 16.0, 0.55)
place(fx, impact(), 4.0, 0.45)
place(fx, impact(), 18.0, 0.7)
place(fx, impact()[: int(1.2 * SR)], 0.0, 0.35)

# ---------- bell hook (8–16 s) and outro bell (18–24 s) ----------
HOOK = [
    (0, 76), (0.5, 79), (1.0, 84), (1.75, 83), (2.0, 74), (2.5, 79), (3.0, 83), (3.75, 81),
    (4.0, 72), (4.5, 76), (5.0, 81), (5.75, 79), (6.0, 72), (6.5, 77), (7.0, 81), (7.5, 79),
]
def bell_note(m, n=int(1.4 * SR)):
    tt = t(n); f = hz(m)
    return (np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 12)) * np.exp(-tt * 3.2)
for off, m in HOOK:
    place(bell, bell_note(m), 8.0 + off, 0.11)  # offsets in seconds across bars 5-8
for off, m in [(0, 84), (1.0, 79), (2.0, 76), (4.0, 72)]:
    place(bell, bell_note(m), 18.0 + off, 0.12)

# ---------- mix ----------
bass *= duck; pad_l *= 0.6 + 0.4 * duck; pad_r *= 0.6 + 0.4 * duck
dry_l = drums + bass + pad_l + pluck * 0.9 + bell * 0.8 + fx
dry_r = drums + bass + pad_r + pluck * 0.75 + bell * 0.95 + fx

# Stereo ping-pong delay on the pluck (dotted 8th).
d = int(0.375 * SR)
delay_l = np.zeros(N); delay_r = np.zeros(N)
delay_l[d:] += pluck[:-d] * 0.32; delay_r[2 * d:] += pluck[:-2 * d] * 0.22
delay_l[3 * d:] += pluck[:-3 * d] * 0.12

# Plate-ish reverb send (decaying filtered noise IR).
ir_n = int(1.9 * SR)
ir_l = lp(rng.standard_normal(ir_n), 6000) * np.exp(-t(ir_n) * 3.4)
ir_r = lp(rng.standard_normal(ir_n), 6000) * np.exp(-t(ir_n) * 3.4)
send = pad_l + pad_r + pluck * 0.6 + bell * 1.2
rev_l = fftconvolve(send, ir_l)[:N] * 0.018
rev_r = fftconvolve(send, ir_r)[:N] * 0.018

mix_l = dry_l + delay_l + rev_l
mix_r = dry_r + delay_r + rev_r

# Duck under voiceover (baked so the bed sits politely under the narration).
vo_gain = np.ones(N)
ramp = int(0.12 * SR)
for start, dur in VO:
    i, j = int(start * SR), int((start + dur + 0.15) * SR)
    vo_gain[i:j] = np.minimum(vo_gain[i:j], 0.5)
    vo_gain[max(0, i - ramp):i] = np.minimum(vo_gain[max(0, i - ramp):i], np.linspace(1, 0.5, i - max(0, i - ramp)))
    vo_gain[j:j + ramp] = np.minimum(vo_gain[j:j + ramp], np.linspace(0.5, 1, len(vo_gain[j:j + ramp])))
fade = np.ones(N); fn = int(1.6 * SR); fade[-fn:] = np.linspace(1, 0, fn) ** 1.5
fade[: int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))

stereo = np.stack([mix_l, mix_r], axis=1) * (vo_gain * fade)[:, None]
stereo = hp(stereo.T, 28).T  # clean sub rumble
stereo = np.tanh(stereo / np.max(np.abs(stereo)) * 1.25) * 0.89  # soft-clip master
OUT.mkdir(parents=True, exist_ok=True)
wavfile.write(OUT / "pulse-check-raw.wav", SR, stereo.astype(np.float32))
print("wrote", OUT / "pulse-check-raw.wav")
