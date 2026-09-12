"""
Record the SideQuest app as SMOOTH VIDEO for Remotion.

Screenshot-per-frame capture (our old scroll mode) produces choppy motion.
Playwright can record the browser directly, and a paced smooth scroll driven on
rAF gives genuinely fluid motion that Remotion can map onto the phone screen.

  python capture/record_video.py <route> <name> [seconds] [--warmup MS]
                                [--selector CSS] [--keep-splash]

  python capture/record_video.py travel-tracker travel_tracker 6

Writes remotion/public/app/<name>.mp4 (converted from Playwright's webm).
The globe is seeded first, so the map is FILLED — no backend or login needed.

TWO THINGS THIS APP DOES THAT BREAK NAIVE CAPTURE
-------------------------------------------------
1. THE DOCUMENT NEVER SCROLLS. React Native Web renders <ScrollView> as an
   inner overflow div, so document.body.scrollHeight == window.innerHeight
   (844 == 844) while the real scroller has scrollHeight 13884. window.scrollTo
   is a no-op here. We locate the largest scrollable element and animate its
   scrollTop instead, falling back to the window only if the document really is
   the scroller.

2. THE APP BOOTS WITH A SPLASH (purple -> white -> logo) before the view
   renders, and Playwright starts recording at page creation, NOT at goto — so
   waiting longer only records more splash. We wait for real content, settle
   for --warmup ms, then trim exactly that much off the front during the
   webm -> mp4 conversion. The delivered file starts inside the app.
   --keep-splash opts out.
"""
import argparse
import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Windows consoles default to cp1252; the app's icon fonts and our own output
# contain non-latin1 glyphs. Force UTF-8 or prints crash the run.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "remotion" / "public" / "app"
RAW_DIR = ROOT / "cache" / "recordings"
OUT_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)

APP_URL = os.environ.get("SQ_APP_URL", "http://localhost:8081")
VIEWPORT = {"width": 390, "height": 844}
SCALE = 3

# Settle time after the view renders, ms. Bump per screen if a heavy route
# (globe, maps) is still painting when the scroll starts.
DEFAULT_WARMUP_MS = 6000

# A view counts as "loaded" once something can actually scroll this far. The
# splash is a single non-scrolling panel, so this doubles as a content check.
MIN_SCROLL_OVERFLOW = 200

# Finds the element that actually scrolls. Returns null when nothing does.
# Shared by the readiness wait and the scroll driver so they can never disagree.
FIND_SCROLLER_JS = """
() => {
  let best = null, bestOver = 0;
  for (const el of document.querySelectorAll('*')) {
    const st = getComputedStyle(el);
    if (!/auto|scroll/.test(st.overflowY)) continue;
    const over = el.scrollHeight - el.clientHeight;
    if (over > bestOver) { bestOver = over; best = el; }
  }
  const docOver = document.documentElement.scrollHeight - window.innerHeight;
  if (docOver > bestOver) { window.__sqScroller = null; return docOver; }
  window.__sqScroller = best;
  return bestOver;
}
"""

sys.path.insert(0, str(ROOT / "capture"))
try:
    from capture import DEFAULT_COUNTRY_STATUS
except Exception:
    DEFAULT_COUNTRY_STATUS = {
        "SE": "living", "ES": "visited", "IT": "visited", "FR": "visited",
        "DE": "visited", "GB": "visited", "NL": "visited", "PT": "visited",
        "GR": "visited", "HR": "visited", "CZ": "visited", "DK": "visited",
        "NO": "visited", "TH": "visited", "US": "visited",
        "JP": "planned", "ID": "planned", "MX": "planned",
    }


async def record(route, name, seconds=6.0, warmup_ms=DEFAULT_WARMUP_MS,
                 selector=None, keep_splash=False, scroll_to=1.0):
    from playwright.async_api import async_playwright
    p = await async_playwright().start()
    browser = await p.chromium.launch(args=["--force-device-scale-factor=%d" % SCALE])
    ctx = await browser.new_context(
        viewport=VIEWPORT,
        device_scale_factor=SCALE,
        record_video_dir=str(RAW_DIR),
        record_video_size={"width": VIEWPORT["width"] * SCALE,
                           "height": VIEWPORT["height"] * SCALE},
    )
    page = await ctx.new_page()
    # Recording starts about here — everything after this lands in the file.
    rec_t0 = time.monotonic()

    await page.add_init_script(
        "window.localStorage.setItem('travel_tracker_status_map', %s);"
        % json.dumps(json.dumps(DEFAULT_COUNTRY_STATUS))
    )
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")

    # Sit through the splash until real content exists.
    ready_timeout = max(warmup_ms * 3, 15000)
    try:
        if selector:
            await page.wait_for_selector(selector, timeout=ready_timeout)
        else:
            await page.wait_for_function(
                f"() => ({FIND_SCROLLER_JS})() > {MIN_SCROLL_OVERFLOW}",
                timeout=ready_timeout,
            )
    except Exception:
        print(f"WARNING: content not ready within {ready_timeout} ms - "
              f"recording anyway; check the route or pass --selector")
    await page.wait_for_timeout(warmup_ms)

    # Everything before this instant is boot/splash and gets trimmed below.
    trim_s = 0.0 if keep_splash else max(time.monotonic() - rec_t0, 0.0)

    # Resolve the scroller once more now that the view has settled, then drive
    # it on rAF. CSS `scroll-behavior: smooth` fights programmatic scrolling,
    # so force auto first.
    overflow = await page.evaluate(FIND_SCROLLER_JS)
    target = await page.evaluate(
        "() => window.__sqScroller ? "
        "(window.__sqScroller.tagName + '.' + "
        "String(window.__sqScroller.className).split(' ')[0]) : 'window'"
    )
    print(f"scroller: {target}  (scrollable {int(overflow)} px, "
          f"using {scroll_to:.0%} = {int(overflow * scroll_to)} px)")
    if overflow < MIN_SCROLL_OVERFLOW:
        print("WARNING: nothing meaningful to scroll - the clip will be static")

    await page.evaluate(
        """([secs, frac]) => new Promise((done) => {
            const el = window.__sqScroller;
            const target = el || document.scrollingElement || document.documentElement;
            target.style && (target.style.scrollBehavior = 'auto');
            document.documentElement.style.scrollBehavior = 'auto';
            const full = el
              ? Math.max(el.scrollHeight - el.clientHeight, 1)
              : Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const max = full * frac;
            const dur = secs * 1000;
            const t0 = performance.now();
            const ease = (t) => t < .5 ? 2*t*t : -1 + (4 - 2*t) * t; // easeInOut
            const step = (now) => {
              const t = Math.min((now - t0) / dur, 1);
              const y = max * ease(t);
              if (el) el.scrollTop = y; else window.scrollTo(0, y);
              if (t < 1) requestAnimationFrame(step); else done();
            };
            requestAnimationFrame(step);
        })""",
        [seconds, scroll_to],
    )
    await page.wait_for_timeout(600)
    await ctx.close()
    await browser.close()
    await p.stop()

    webms = sorted(RAW_DIR.glob("*.webm"), key=lambda f: f.stat().st_mtime)
    if not webms:
        print("no recording produced")
        return
    src = webms[-1]
    dst = OUT_DIR / f"{name}.mp4"

    cmd = ["ffmpeg", "-y"]
    if trim_s > 0.05:
        cmd += ["-ss", f"{trim_s:.3f}"]  # drop the boot/splash from the front
    cmd += ["-i", str(src), "-c:v", "libx264", "-preset", "slow",
            "-crf", "16", "-pix_fmt", "yuv420p", "-an", str(dst)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("ffmpeg failed:\n", r.stderr[-600:])
        return
    src.unlink(missing_ok=True)

    if trim_s > 0.05:
        print(f"trimmed {trim_s:.2f}s of boot/splash off the front")
    print(f"recorded -> {dst}")
    print("use it in Remotion as staticFile('app/%s.mp4')" % name)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Record a SideQuest screen as smooth video for Remotion.",
    )
    ap.add_argument("route", help="app route, hyphenated (e.g. travel-tracker)")
    ap.add_argument("name", help="output file stem (e.g. travel_tracker)")
    ap.add_argument("seconds", nargs="?", type=float, default=6.0,
                    help="scroll duration in seconds (default 6)")
    ap.add_argument("--warmup", type=int, default=DEFAULT_WARMUP_MS,
                    metavar="MS",
                    help=f"settle time after the view renders, ms "
                         f"(default {DEFAULT_WARMUP_MS}); raise for heavy screens")
    ap.add_argument("--selector", default=None, metavar="CSS",
                    help="wait for this element instead of the default "
                         "'something scrolls' check")
    ap.add_argument("--keep-splash", action="store_true",
                    help="don't trim the boot sequence off the front")
    ap.add_argument("--scroll-to", type=float, default=1.0, metavar="FRACTION",
                    help="how far down to scroll, 0-1 of the scrollable height "
                         "(default 1.0 = all the way). Long screens often end "
                         "in dull list content — travel-tracker looks best at "
                         "about 0.2, which covers globe -> continent cards.")
    a = ap.parse_args()

    asyncio.run(record(a.route, a.name, a.seconds, a.warmup,
                       a.selector, a.keep_splash, max(0.0, min(1.0, a.scroll_to))))
