"""
SideQuest Reel Factory v2 — Compose Module

Assembles b-roll + animated phone renders + kinetic text + brand CTA into a
1080x1920 H.264 reel. Config-driven. Key upgrades over v1:
  - Motion everywhere (Ken Burns on stills/b-roll, frame sequences for animated
    phone renders and captured scrolls)
  - Kinetic text (word-by-word reveal) instead of static popups
  - High bitrate (~10 Mbps) so Instagram's re-encode still looks clean
  - Brand-locked CTA pulled from lib/brand.py (never diverges from the app logo)
  - Reveal helper for the hidden-sidequest theme (blur -> unblur)

Run:  python compose/compose.py configs/<reel>.json
"""
import json
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Resolve project root regardless of where the script is called from
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from lib import brand as B  # noqa: E402

CACHE    = ROOT / "cache"
RENDERS  = CACHE / "renders"
CAPTURES = CACHE / "captures"
BROLL    = CACHE / "broll"
OUTPUT   = ROOT / "output"
OUTPUT.mkdir(exist_ok=True)

W, H, FPS = B.W, B.H, B.FPS
BG = B.hex_to_rgb(B.BG_DARK)


# ---------- text helpers ----------
def _font(path, size):
    p = ROOT / path
    if not p.exists():
        # graceful fallback so the pipeline still runs before fonts are installed
        return ImageFont.load_default()
    return ImageFont.truetype(str(p), size)


def draw_centered(draw, text, y, font, color, tracking=0):
    if tracking == 0:
        bbox = draw.textbbox((0, 0), text, font=font)
        x = (W - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), text, fill=color, font=font)
        return
    # manual letter-spacing
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, fill=color, font=font)
        x += w + tracking


def draw_shadowed(draw, text, y, font, color, shadow=(0, 0, 0), spread=3):
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (W - (bbox[2] - bbox[0])) // 2
    for dx in range(-spread, spread + 1):
        for dy in range(-spread, spread + 1):
            draw.text((x + dx, y + dy), text, fill=shadow, font=font)
    draw.text((x, y), text, fill=color, font=font)


# ---------- motion helpers ----------
def ken_burns(img, num_frames, zoom_start=1.0, zoom_end=1.08, pan=(0, 0)):
    """Yield num_frames frames slowly zooming/panning a still (adds life)."""
    base = img.convert("RGB")
    bw, bh = base.size
    for i in range(num_frames):
        t = i / max(num_frames - 1, 1)
        z = zoom_start + (zoom_end - zoom_start) * t
        cw, ch = int(W / z), int(H / z)
        cx = (bw - cw) // 2 + int(pan[0] * t)
        cy = (bh - ch) // 2 + int(pan[1] * t)
        cx = max(0, min(cx, bw - cw))
        cy = max(0, min(cy, bh - ch))
        frame = base.crop((cx, cy, cx + cw, cy + ch)).resize((W, H), Image.LANCZOS)
        yield frame


def load_on_bg(path):
    img = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", (W, H), BG + (255,))
    if img.size != (W, H):
        img = img.resize((W, H), Image.LANCZOS)
    return Image.alpha_composite(bg, img).convert("RGB")


def fade_from_black(frame, i, n=6):
    if i >= n:
        return frame
    black = Image.new("RGB", (W, H), BG)
    return Image.blend(black, frame, i / n)


# ---------- section renderers ----------
def sec_hook(section, fps):
    """Kinetic hook: words appear one at a time over optional b-roll."""
    n = int(section.get("duration_s", 2.5) * fps)
    lines = section.get("text_lines", [])
    words = " ".join(l["text"] for l in lines).split()
    subtext = section.get("subtext", "")
    broll = section.get("broll")  # optional filename in cache/broll

    base_frames = None
    if broll and (BROLL / broll).exists():
        base_frames = list(ken_burns(Image.open(BROLL / broll), n, 1.0, 1.10))

    font = _font(B.FONT_BLACK, 72)
    subfont = _font(B.FONT_BLACK, 26)
    for i in range(n):
        if base_frames:
            frame = base_frames[i].copy()
            # darken for legibility
            ov = Image.new("RGB", (W, H), (0, 0, 0))
            frame = Image.blend(frame, ov, 0.45)
        else:
            frame = Image.new("RGB", (W, H), BG)
        draw = ImageDraw.Draw(frame)
        shown = min(len(words), int((i / n) * len(words)) + 1)
        text_so_far = " ".join(words[:shown])
        # wrap to <=3 words per line for punch
        wl = text_so_far.split()
        rows = [" ".join(wl[j:j+3]) for j in range(0, len(wl), 3)]
        y = H // 2 - 60 - (len(rows) - 1) * 45
        for r_idx, row in enumerate(rows):
            color = B.hex_to_rgb(lines[min(r_idx, len(lines)-1)].get("color", B.WHITE)) if lines else (255,255,255)
            draw_shadowed(draw, row, y + r_idx * 90, font, color)
        if shown >= len(words) and subtext:
            draw_centered(draw, subtext, H // 2 + 140, subfont, B.hex_to_rgb(B.GRAY_SUB))
        yield fade_from_black(frame, i)


def sec_phone(section, fps):
    """Animated phone: plays a frame sequence if present, else Ken-Burns a still.

    A frame sequence lives in cache/renders/<screen>/f0000.png ... (Blender
    camera move or captured scroll). Falls back to a single still.
    """
    n = int(section.get("duration_s", 2.5) * fps)
    screen = section["screen"]
    subtitle = section.get("subtitle", "")
    sub_color = B.hex_to_rgb(section.get("subtitle_color", B.PINK))

    seq_dir = RENDERS / screen
    frames = sorted(seq_dir.glob("f*.png")) if seq_dir.is_dir() else []
    subfont = _font(B.FONT_BLACK, 40)

    # Precompute Ken-Burns frames once for the still fallback (not per-frame)
    kb = None
    if not frames:
        still = RENDERS / f"phone_{screen}.png"
        if not still.exists():
            still = RENDERS / f"{screen}.png"
        base = load_on_bg(still) if still.exists() else Image.new("RGB", (W, H), BG)
        kb = list(ken_burns(base, n, 1.0, 1.05))

    for i in range(n):
        if frames:
            src = frames[min(i, len(frames) - 1)]
            frame = load_on_bg(src)
        else:
            frame = kb[i].copy()
        if subtitle:
            draw = ImageDraw.Draw(frame)
            draw_shadowed(draw, subtitle, H - 150, subfont, sub_color)
        yield fade_from_black(frame, i)


def sec_reveal(section, fps):
    """Hidden-sidequest reveal: blurred capture -> sharp, with a beat of hold.

    Expects a single captured screen (the activity in the feed). We blur it
    heavily, then ramp the blur to zero over the middle third.
    """
    n = int(section.get("duration_s", 3.0) * fps)
    screen = section["screen"]
    still = RENDERS / f"phone_{screen}.png"
    if not still.exists():
        still = CAPTURES / f"{screen}.png"
    base = load_on_bg(still) if still.exists() else Image.new("RGB", (W, H), BG)
    label = section.get("label", "")
    subfont = _font(B.FONT_BLACK, 40)

    hold = n // 3
    for i in range(n):
        if i < hold:
            blur = 24
        elif i < 2 * hold:
            t = (i - hold) / max(hold, 1)
            blur = 24 * (1 - t)
        else:
            blur = 0
        frame = base.filter(ImageFilter.GaussianBlur(blur)) if blur > 0.5 else base.copy()
        draw = ImageDraw.Draw(frame)
        if label and i < 2 * hold:
            draw_shadowed(draw, "🔒 " + label, H // 2, subfont, B.hex_to_rgb(B.PINK))
        yield frame


def sec_cta(section, fps):
    """Brand-locked CTA — wordmark + pink dot + handle + url + launch line."""
    n = int(section.get("duration_s", 2.5) * fps)
    launch = section.get("launch_line", "First 50 get lifetime access — free.")
    logo_font = _font(B.FONT_BLACK, B.WORDMARK_FONTSIZE)
    handle_font = _font(B.FONT_BLACK, 34)
    url_font = _font(B.FONT_BLACK, 28)
    launch_font = _font(B.FONT_BLACK, 30)

    base = Image.new("RGB", (W, H), BG)
    d0 = ImageDraw.Draw(base)
    # measure wordmark with exact tracking
    widths = [d0.textlength(ch, font=logo_font) for ch in B.WORDMARK_TEXT]
    word_w = sum(widths) + B.WORDMARK_TRACKING * (len(B.WORDMARK_TEXT) - 1)
    total_w = word_w + B.DOT_GAP + B.DOT_DIAMETER
    lx = (W - total_w) / 2
    ly = H // 2 - 120

    for i in range(n):
        frame = base.copy()
        draw = ImageDraw.Draw(frame)
        # wordmark with exact letter-spacing (white on dark bg)
        x = lx
        for ch, w in zip(B.WORDMARK_TEXT, widths):
            draw.text((x, ly), ch, fill=B.hex_to_rgb(B.WORDMARK_COLOR_DARK), font=logo_font)
            x += w + B.WORDMARK_TRACKING
        # pink dot: bottom of dot touches the text baseline (cap bottom)
        asc, desc = logo_font.getmetrics()
        baseline = ly + asc                       # alphabetic baseline
        dot_x = x + B.DOT_GAP
        dot_y = baseline - B.DOT_DIAMETER         # dot bottom on baseline
        draw.ellipse([dot_x, dot_y, dot_x + B.DOT_DIAMETER, dot_y + B.DOT_DIAMETER],
                     fill=B.hex_to_rgb(B.DOT_COLOR))
        draw_centered(draw, B.HANDLE, ly + 160, handle_font, B.hex_to_rgb(B.GRAY_HANDLE))
        draw_centered(draw, B.URL, ly + 210, url_font, B.hex_to_rgb(B.GRAY_URL))
        # launch urgency line pulses in after 0.4s
        if i > int(0.4 * fps):
            draw_centered(draw, launch, ly + 300, launch_font, B.hex_to_rgb(B.PINK))
        yield fade_from_black(frame, i)


SECTIONS = {
    "hook": sec_hook,
    "phone_screen": sec_phone,
    "reveal": sec_reveal,
    "cta": sec_cta,
}


# ---------- assembly ----------
def compose_reel(config_path):
    config = json.loads(Path(config_path).read_text(encoding="utf-8"))
    fps = config.get("fps", FPS)
    reel_id = config["reel_id"]
    print(f"▶ Composing: {config['title']}  ({reel_id})")

    out_dir = OUTPUT / reel_id
    out_dir.mkdir(parents=True, exist_ok=True)

    idx = 0
    for section in config["sections"]:
        st = section["type"]
        fn = SECTIONS.get(st)
        if not fn:
            print(f"  ⚠ unknown section: {st}")
            continue
        count = 0
        for frame in fn(section, fps):
            frame.save(out_dir / f"f{idx:05d}.png")
            idx += 1
            count += 1
        print(f"  {st}: {count} frames")

    print(f"  total: {idx} frames ({idx/fps:.1f}s)")

    out_path = out_dir / "reel.mp4"
    # Force a constant ~10 Mbps. On near-static content CRF/target modes let
    # x264 undershoot to ~0.1-2 Mbps and IG then destroys it. Setting b:v =
    # minrate = maxrate with a matched bufsize pins a true CBR that always
    # clears IG's threshold. nal-hrd=cbr makes x264 pad to hold the rate.
    rate = "10M"
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(out_dir / "f%05d.png"),
        "-c:v", "libx264", "-preset", "slow",
        "-b:v", rate, "-minrate", rate, "-maxrate", rate, "-bufsize", "10M",
        "-x264-params", "nal-hrd=cbr:force-cfr=1",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
        str(out_path),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("ffmpeg error:\n", r.stderr[-800:])
        return None

    for f in out_dir.glob("f*.png"):
        f.unlink()

    final = OUTPUT / f"{reel_id}.mp4"
    import shutil
    shutil.copy2(out_path, final)
    print(f"✓ {final}  ({os.path.getsize(final)//1024} KB, {idx/fps:.1f}s)")
    return str(final)


if __name__ == "__main__":
    cfg = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "configs" / "theme01_reveal.json")
    compose_reel(cfg)
