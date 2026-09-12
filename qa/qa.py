"""
SideQuest Reel Factory v2 — Preflight + QA (gate before delivery)

Philosophy: catch everything a machine safely can, stay SILENT when all is
well, and SHOUT only when something is wrong. You should never be the one who
discovers a broken glyph or an off-screen caption.

Modes:
  python qa/qa.py preflight configs/<reel>.json      (BEFORE the Blender render)
  python qa/qa.py check     output/<reel>.mp4         (AFTER compose)
  python qa/qa.py all       configs/<reel>.json output/<reel>.mp4

Exit 0 = PASS (quiet). Non-zero = FAIL (prints exactly what's wrong).
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from lib import brand as B  # noqa: E402

QA_OUT = ROOT / "output" / "qa"
QA_OUT.mkdir(parents=True, exist_ok=True)
W, H = B.W, B.H

_FONT_CACHE = {}


def _cmap(font_path):
    if font_path not in _FONT_CACHE:
        p = ROOT / font_path
        _FONT_CACHE[font_path] = set(TTFont(str(p)).getBestCmap().keys()) if p.exists() else None
    return _FONT_CACHE[font_path]


def _missing_glyphs(text, font_path):
    cmap = _cmap(font_path)
    if cmap is None:
        return []
    return sorted({c for c in text if c != " " and ord(c) not in cmap})


def _collect_strings(config):
    out = []
    for i, s in enumerate(config.get("sections", [])):
        tag = f"section {i} ({s.get('type')})"
        for line in s.get("text_lines", []):
            out.append((f"{tag} text_line", line.get("text", ""), B.FONT_BLACK))
        for key in ("subtext", "subtitle", "label", "launch_line"):
            if s.get(key):
                out.append((f"{tag} {key}", s[key], B.FONT_BLACK))
    out.append(("CTA wordmark", B.WORDMARK_TEXT, B.FONT_BLACK))
    out.append(("CTA handle", B.HANDLE, B.FONT_BLACK))
    out.append(("CTA url", B.URL, B.FONT_BLACK))
    return out


def preflight(config_path):
    problems = []
    cfg_path = Path(config_path)
    try:
        raw = cfg_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as e:
        return [f"config is not valid UTF-8: {e}"]
    try:
        config = json.loads(raw)
    except json.JSONDecodeError as e:
        return [f"config is not valid JSON: {e}"]

    for field in ("reel_id", "sections"):
        if field not in config:
            problems.append(f"config missing required field: {field}")
    if problems:
        return problems

    for fp in (B.FONT_BLACK, B.FONT_BOLD, B.FONT_REGULAR):
        if not (ROOT / fp).exists():
            problems.append(f"font missing: {fp} (text will not be brand-accurate)")

    for label, text, font in _collect_strings(config):
        miss = _missing_glyphs(text, font)
        if miss:
            problems.append(f"{label}: font has no glyph for {miss} in {text!r} (renders as boxes)")

    ctas = [s for s in config["sections"] if s.get("type") == "cta"]
    if not ctas:
        problems.append("no CTA section (reel won't tell viewers where to go)")
    for c in ctas:
        if c.get("duration_s", 2.5) < 2.5:
            problems.append(f"CTA duration {c.get('duration_s')}s < 2.5s minimum")

    for i, s in enumerate(config["sections"]):
        if s.get("type") == "phone_screen":
            screen = s.get("screen", "")
            seq = ROOT / "cache" / "renders" / screen
            still1 = ROOT / "cache" / "renders" / f"phone_{screen}.png"
            still2 = ROOT / "cache" / "renders" / f"{screen}.png"
            has_seq = seq.is_dir() and any(seq.glob("f*.png"))
            if not (has_seq or still1.exists() or still2.exists()):
                problems.append(f"section {i}: phone screen '{screen}' has no render "
                                f"(expected cache/renders/{screen}/ or phone_{screen}.png)")

    try:
        _render_text_preview(config)
    except Exception as e:
        problems.append(f"could not build text preview: {e}")
    return problems


def _render_text_preview(config):
    from compose import compose as C
    tiles = []
    for s in config["sections"]:
        if s["type"] in ("hook", "cta"):
            frames = list(C.SECTIONS[s["type"]](s, config.get("fps", 30)))
            if frames:
                tiles.append(frames[len(frames) // 2])
                tiles.append(frames[-1])
    if not tiles:
        return
    tw = 300
    th = int(tw * H / W)
    sheet = Image.new("RGB", (tw * len(tiles), th), (20, 20, 20))
    for i, im in enumerate(tiles):
        sheet.paste(im.resize((tw, th)), (i * tw, 0))
    sheet.save(QA_OUT / "text_preview.jpg", quality=90)


def _probe(mp4):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate",
         "-show_entries", "format=duration,bit_rate",
         "-of", "json", str(mp4)], capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return {}


def _frames(mp4, n=12):
    tmp = QA_OUT / "_frames"
    tmp.mkdir(exist_ok=True)
    for f in tmp.glob("*.png"):
        f.unlink()
    info = _probe(mp4)
    dur = float(info.get("format", {}).get("duration", 0) or 0)
    step = max(dur / n, 0.1)
    out = []
    for i in range(n):
        p = tmp / f"q{i:02d}.png"
        subprocess.run(["ffmpeg", "-y", "-ss", f"{i*step:.2f}", "-i", str(mp4),
                        "-frames:v", "1", str(p)], capture_output=True)
        if p.exists():
            out.append(p)
    return out, dur, info


def _mean(path):
    return sum(Image.open(path).convert("L").resize((48, 85)).getdata()) / (48 * 85)


def check(mp4):
    mp4 = Path(mp4)
    problems = []
    if not mp4.exists():
        return [f"file not found: {mp4}"]
    frames, dur, info = _frames(mp4)
    st = (info.get("streams") or [{}])[0]

    if (st.get("width"), st.get("height")) != (W, H):
        problems.append(f"resolution {st.get('width')}x{st.get('height')} != {W}x{H}")
    rate = st.get("r_frame_rate", "0/1")
    try:
        num, den = rate.split("/")
        fps = float(num) / float(den)
        if abs(fps - B.FPS) > 1:
            problems.append(f"fps {fps:.0f} != {B.FPS}")
    except (ValueError, ZeroDivisionError):
        problems.append(f"could not read fps ({rate})")
    if not (8 <= dur <= 20):
        problems.append(f"duration {dur:.1f}s outside 8-20s")
    br = int(info.get("format", {}).get("bit_rate", 0) or 0)
    # 4.0 Mbps, not 6: flat app graphics on a dark ground compress hard at
    # CRF 16 (T1 measured 4.3 Mbps), and forcing a higher bitrate would only
    # inflate the file, not improve it.
    if br and br < 4_000_000:
        problems.append(f"bitrate {br/1e6:.1f} Mbps < 4.0 Mbps (IG will look muddy)")

    for i, p in enumerate(frames):
        if 0 < i < len(frames) - 1:
            m = _mean(p)
            if m > 250:
                problems.append(f"frame {i} near-white (blank?)")
            elif m < 4:
                problems.append(f"frame {i} near-black (blank?)")
    if frames and _mean(frames[-1]) < 6:
        problems.append("final/CTA frame is blank")

    _contact_sheet(frames)
    return problems


def _contact_sheet(frames):
    if not frames:
        return
    cols, tw = 4, 240
    th = int(tw * H / W)
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * th), (20, 20, 20))
    for i, p in enumerate(frames):
        r, c = divmod(i, cols)
        sheet.paste(Image.open(p).convert("RGB").resize((tw, th)), (c * tw, r * th))
    sheet.save(QA_OUT / "contact_sheet.jpg", quality=88)


def _report(title, problems):
    if not problems:
        return True
    print(f"\n  X {title} - {len(problems)} problem(s):")
    for p in problems:
        print(f"    - {p}")
    return False


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    mode = sys.argv[1]
    ok = True
    if mode == "preflight":
        ok = _report("PREFLIGHT", preflight(sys.argv[2]))
    elif mode == "check":
        ok = _report("QA CHECK", check(sys.argv[2]))
    elif mode == "all":
        ok = _report("PREFLIGHT", preflight(sys.argv[2]))
        if ok and len(sys.argv) > 3:
            ok = _report("QA CHECK", check(sys.argv[3]))
    else:
        print("unknown mode:", mode)
        sys.exit(2)
    if ok:
        print("OK PASS")
        sys.exit(0)
    print("\n  -> fix the above before delivering. Preview/contact sheet in output/qa/")
    sys.exit(1)


if __name__ == "__main__":
    main()
