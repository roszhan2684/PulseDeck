"""PulseDeck brand icon generator — one SVG source → every app, splash and web icon.

    python3 scripts/build-icons.py

Mark: a deck of cards (the back card ghosted, the front card solid) with a pulse line,
on the brand's violet → pink gradient. Writes SVG masters to brand/ and rasters to
assets/images (Expo app) and website/assets (marketing site). Rasterizes with headless
Chrome (transparent background), downsamples with Lanczos.
"""
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND, APP, WEB = ROOT / "brand", ROOT / "assets" / "images", ROOT / "website" / "assets"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

DEFS = """
  <linearGradient id="pd-bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7C5CFF"/><stop offset="0.58" stop-color="#C04FD0"/><stop offset="1" stop-color="#FF4F8B"/>
  </linearGradient>
  <radialGradient id="pd-hl" cx="0.22" cy="0.12" r="0.8">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.30"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pd-vg" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.6" stop-color="#1A0630" stop-opacity="0"/><stop offset="1" stop-color="#1A0630" stop-opacity="0.28"/>
  </radialGradient>
  <linearGradient id="pd-ink" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7C5CFF"/><stop offset="1" stop-color="#FF4F8B"/>
  </linearGradient>
  <filter id="pd-sh" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#2A0A4A" flood-opacity="0.38"/>
  </filter>"""

PULSE = "-150,34 -72,34 -38,-84 6,150 48,-34 78,34 112,34"
BACK = '<g transform="translate(446 492) rotate(-15)"><rect x="-200" y="-264" width="400" height="528" rx="66" fill="#FFFFFF" fill-opacity="0.30"/></g>'
FRONT = f"""<g transform="translate(552 532) rotate(7)" filter="url(#pd-sh)">
    <rect x="-214" y="-278" width="428" height="556" rx="70" fill="#FFFFFF"/>
    <polyline points="{PULSE}" fill="none" stroke="url(#pd-ink)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="150" cy="34" r="30" fill="#FF4F8B"/>
  </g>"""


def svg(body: str, defs: str = DEFS) -> str:
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs>{defs}</defs>{body}</svg>\n'


BG = '<rect width="1024" height="1024" fill="url(#pd-bg)"/><rect width="1024" height="1024" fill="url(#pd-hl)"/><rect width="1024" height="1024" fill="url(#pd-vg)"/>'
MARK = BACK + FRONT


def scaled(inner: str, s: float) -> str:
    """Scale content about the canvas center (Android safe zone)."""
    o = 512 * (1 - s)
    return f'<g transform="translate({o:.1f} {o:.1f}) scale({s})">{inner}</g>'


MASTERS = {
    # Full-bleed square: iOS / App Store / Expo icon (the OS applies the corner mask).
    "icon": svg(BG + MARK),
    # Rounded squircle-ish tile for the web (favicon, apple-touch fallback, in-page logo).
    "icon-rounded": svg(
        f'<clipPath id="pd-clip"><rect width="1024" height="1024" rx="232"/></clipPath><g clip-path="url(#pd-clip)">{BG}{MARK}</g>'
    ),
    # Favicon-optimised: bigger front card, thicker pulse, so it still reads at 16-32 px.
    "favicon": svg(
        '<clipPath id="pd-clip"><rect width="1024" height="1024" rx="232"/></clipPath><g clip-path="url(#pd-clip)">' + BG
        + '<g transform="translate(470 470) rotate(-14) scale(1.18)"><rect x="-200" y="-264" width="400" height="528" rx="70" fill="#FFFFFF" fill-opacity="0.32"/></g>'
        + f'<g transform="translate(540 540) rotate(7) scale(1.22)" filter="url(#pd-sh)"><rect x="-214" y="-278" width="428" height="556" rx="76" fill="#FFFFFF"/>'
        + f'<polyline points="{PULSE}" fill="none" stroke="url(#pd-ink)" stroke-width="66" stroke-linecap="round" stroke-linejoin="round"/></g></g>'
    ),
    "android-background": svg(BG),
    "android-foreground": svg(scaled(MARK, 0.74)),
    # Monochrome (Android 13 themed icons): front card silhouette with the pulse knocked out.
    "android-monochrome": svg(
        scaled(
            '<mask id="pd-m"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(552 532) rotate(7)">'
            f'<polyline points="{PULSE}" fill="none" stroke="#000" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>'
            '<circle cx="150" cy="34" r="32" fill="#000"/></g></mask>'
            '<g mask="url(#pd-m)"><g transform="translate(446 492) rotate(-15)"><rect x="-200" y="-264" width="400" height="528" rx="66" fill="#fff" fill-opacity="0.45"/></g>'
            '<g transform="translate(552 532) rotate(7)"><rect x="-214" y="-278" width="428" height="556" rx="70" fill="#fff"/></g></g>',
            0.74,
        )
    ),
}


def render(svg_text: str, out: Path, size: int = 1024) -> Image.Image:
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / "i.html"
        png = Path(tmp) / "i.png"
        html.write_text(f'<html><body style="margin:0;background:transparent">{svg_text}</body></html>')
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
             "--window-size=1024,1024", f"--screenshot={png}", html.as_uri()],
            check=True, capture_output=True,
        )
        img = Image.open(png).convert("RGBA").crop((0, 0, 1024, 1024))
    if size != 1024:
        img = img.resize((size, size), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    return img


def main():
    BRAND.mkdir(exist_ok=True)
    for name, text in MASTERS.items():
        (BRAND / f"{name}.svg").write_text(text)
    full = render(MASTERS["icon"], BRAND / "icon-1024.png")
    rounded = render(MASTERS["icon-rounded"], BRAND / "icon-rounded-1024.png")

    # Expo app
    full.convert("RGB").save(APP / "icon.png")  # iOS wants no alpha
    render(MASTERS["android-background"], APP / "android-icon-background.png")
    render(MASTERS["android-foreground"], APP / "android-icon-foreground.png")
    render(MASTERS["android-monochrome"], APP / "android-icon-monochrome.png")
    rounded.save(APP / "splash-icon.png")
    small = render(MASTERS["favicon"], BRAND / "favicon-1024.png")
    small.resize((48, 48), Image.LANCZOS).save(APP / "favicon.png")

    # Marketing site
    (WEB / "favicon.svg").write_text(MASTERS["favicon"])
    (WEB / "logo.svg").write_text(MASTERS["icon-rounded"])
    full.convert("RGB").resize((180, 180), Image.LANCZOS).save(WEB / "apple-touch-icon.png")
    for s in (192, 512):
        rounded.resize((s, s), Image.LANCZOS).save(WEB / f"icon-{s}.png")
    small.save(WEB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    small.resize((32, 32), Image.LANCZOS).save(WEB / "favicon-32.png")
    print("icons written to brand/, assets/images/, website/assets/")


if __name__ == "__main__":
    main()
