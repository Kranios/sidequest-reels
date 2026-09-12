"""
Record the SideQuest app as SMOOTH VIDEO for Remotion.

Screenshot-per-frame capture (our old scroll mode) produces choppy motion.
Playwright can record the browser directly, and a paced smooth scroll driven on
rAF gives genuinely fluid motion that Remotion can map onto the phone screen.

  python capture/record_video.py <route> <name> [seconds] [--warmup MS]
                                [--selector SEL] [--keep-splash]
                                [--scroll-to FRACTION] [--fixture JSON ...]
                                [--safe-area TOP,BOTTOM]

  python capture/record_video.py travel-tracker travel_tracker 6
  python capture/record_video.py trip/demo/split cost_split 6 --scroll-to 0.2 \
      --selector "text=Villa Sóller"

Writes remotion/public/app/<name>.mp4 (converted from Playwright's webm).
The globe is seeded first, so the map is FILLED — no backend or login needed.

API MOCKING
-----------
Every request matching **/api/** that is NOT for the app's own origin is
answered from a fixture in configs/fixtures/ — nothing reaches a backend. A
fixture is a JSON file with a "routes" object mapping a path to the exact body
the endpoint returns:

  { "routes": { "/api/trips/{id}/expenses": [ ... ] } }

{name} segments match any single path segment, so dynamic routes such as
trip/demo/split (-> /api/trips/demo/expenses) resolve against the same entry
whatever the id is. Matching is exact on the path, so /expenses never swallows
/expenses/balances. Unmatched calls get a 404 and are listed after the run.
By default every fixture with a "routes" key is loaded; --fixture narrows it.

FOUR THINGS THIS APP DOES THAT BREAK NAIVE CAPTURE
--------------------------------------------------
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

3. THERE ARE NO APP CLASS NAMES. React Native Web emits generated classes
   (css-view-1dbjc4n ...), so a selector like ".expense-list" never matches.
   --selector takes any Playwright selector; a text selector on something the
   fixture puts on screen ("text=Villa Sóller") is the reliable choice. If the
   selector never appears we fall back to the "something scrolls" check.

4. A DESKTOP BROWSER HAS NO SAFE AREA. env(safe-area-inset-top) is 0, so the
   app lays its header at the very top — where the 3D phone's Dynamic Island
   then covers it ("Cost S▮"). On a real iPhone the app pads the header below
   the status bar. We emulate that with Chromium's
   Emulation.setSafeAreaInsetsOverride, so the app applies its OWN insets —
   nothing is injected into the page. Default 59/34 px: an iPhone 17 Pro's
   status bar and home indicator. --safe-area 0,0 turns it off.
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

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
FIXTURE_DIR = ROOT / "configs" / "fixtures"
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

# Safe-area insets, CSS px (top, bottom): iPhone 17 Pro status bar with the
# Dynamic Island, and the home indicator. Matches the GLB on screen.
DEFAULT_SAFE_AREA = (59, 34)

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


def _route_regex(pattern):
    """'/api/trips/{id}/expenses' -> ^/api/trips/[^/]+/expenses$"""
    segs = [r"[^/]+" if re.fullmatch(r"\{[^/{}]+\}", s) else re.escape(s)
            for s in pattern.split("/")]
    return re.compile("^" + "/".join(segs) + "$")


def load_fixture_routes(paths=None):
    """[(pattern, regex, body, source)] from every fixture with a "routes" key."""
    files = [Path(p) for p in paths] if paths else sorted(FIXTURE_DIR.glob("*.json"))
    routes = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        for pattern, body in (data.get("routes") or {}).items():
            routes.append((pattern, _route_regex(pattern), body, f.name))
    return routes


async def install_api_mocks(page, routes):
    """Answer **/api/** from the fixtures. Returns (served, missed) for the log."""
    app_host = urlparse(APP_URL).netloc
    served, missed = {}, []

    async def handler(route):
        req = route.request
        url = urlparse(req.url)
        if url.netloc == app_host:  # the app's own bundle and assets
            await route.continue_()
            return
        if req.method == "GET":
            for pattern, rx, body, _src in routes:
                if rx.match(url.path):
                    served[pattern] = served.get(pattern, 0) + 1
                    await route.fulfill(status=200, content_type="application/json",
                                        body=json.dumps(body, ensure_ascii=False))
                    return
        missed.append(f"{req.method} {url.path}")
        await route.fulfill(status=404, content_type="application/json",
                            body='{"error":"not mocked"}')

    await page.route("**/api/**", handler)
    return served, missed


async def emulate_safe_area(ctx, page, top, bottom):
    """Give the page real safe-area insets, so the app pads itself as on a phone."""
    if not (top or bottom):
        return
    cdp = await ctx.new_cdp_session(page)
    try:
        await cdp.send("Emulation.setSafeAreaInsetsOverride", {"insets": {
            "top": top, "topMax": top, "bottom": bottom, "bottomMax": bottom,
            "left": 0, "leftMax": 0, "right": 0, "rightMax": 0,
        }})
    except Exception as e:
        print(f"WARNING: safe-area emulation unavailable ({e}) - the app header "
              f"will sit under the phone's Dynamic Island")


async def record(route, name, seconds=6.0, warmup_ms=DEFAULT_WARMUP_MS,
                 selector=None, keep_splash=False, scroll_to=1.0, fixtures=None,
                 safe_area=DEFAULT_SAFE_AREA):
    from playwright.async_api import async_playwright
    api_routes = load_fixture_routes(fixtures)

    p = await async_playwright().start()
    browser = await p.chromium.launch(args=["--force-device-scale-factor=%d" % SCALE])
    ctx = await browser.new_context(
        viewport=VIEWPORT,
        device_scale_factor=SCALE,
        # Pinned so the app renders in English and its default light theme
        # whatever the host machine is set to — reel copy is English.
        locale="en-US",
        color_scheme="light",
        record_video_dir=str(RAW_DIR),
        record_video_size={"width": VIEWPORT["width"] * SCALE,
                           "height": VIEWPORT["height"] * SCALE},
    )
    page = await ctx.new_page()
    # Recording starts about here — everything after this lands in the file.
    rec_t0 = time.monotonic()

    await emulate_safe_area(ctx, page, *safe_area)
    served, missed = await install_api_mocks(page, api_routes)
    await page.add_init_script(
        "window.localStorage.setItem('travel_tracker_status_map', %s);"
        % json.dumps(json.dumps(DEFAULT_COUNTRY_STATUS))
    )
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")

    # Sit through the splash until real content exists.
    ready_timeout = max(warmup_ms * 3, 15000)
    ready = False
    if selector:
        try:
            await page.wait_for_selector(selector, timeout=ready_timeout)
            ready = True
        except Exception:
            print(f"WARNING: selector {selector!r} not found within {ready_timeout} ms - "
                  f"falling back to the 'something scrolls' check. React Native Web has "
                  f"no app class names; use a text selector, e.g. \"text=Villa Sóller\"")
    if not ready:
        try:
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

    if api_routes:
        print(f"api mocks: {len(api_routes)} route(s) loaded, served "
              + (", ".join(f"{k} x{v}" for k, v in served.items()) or "nothing"))
    if missed:
        print("api mocks: unmatched (404) -> " + ", ".join(sorted(set(missed))))

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


def _safe_area_arg(value):
    try:
        top, bottom = (int(v) for v in value.split(","))
    except ValueError:
        raise argparse.ArgumentTypeError("expected TOP,BOTTOM in CSS px, e.g. 59,34")
    return top, bottom


if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Record a SideQuest screen as smooth video for Remotion.",
    )
    ap.add_argument("route", help="app route, hyphenated (e.g. travel-tracker, "
                                  "trip/demo/split)")
    ap.add_argument("name", help="output file stem (e.g. travel_tracker)")
    ap.add_argument("seconds", nargs="?", type=float, default=6.0,
                    help="scroll duration in seconds (default 6)")
    ap.add_argument("--warmup", type=int, default=DEFAULT_WARMUP_MS,
                    metavar="MS",
                    help=f"settle time after the view renders, ms "
                         f"(default {DEFAULT_WARMUP_MS}); raise for heavy screens")
    ap.add_argument("--selector", default=None, metavar="SEL",
                    help="wait for this Playwright selector (CSS or text=...) "
                         "instead of the default 'something scrolls' check")
    ap.add_argument("--keep-splash", action="store_true",
                    help="don't trim the boot sequence off the front")
    ap.add_argument("--scroll-to", type=float, default=1.0, metavar="FRACTION",
                    help="how far down to scroll, 0-1 of the scrollable height "
                         "(default 1.0 = all the way). Long screens often end "
                         "in dull list content — travel-tracker looks best at "
                         "about 0.2, which covers globe -> continent cards.")
    ap.add_argument("--fixture", action="append", default=None, metavar="JSON",
                    help="API fixture to serve (repeatable). Default: every "
                         "configs/fixtures/*.json that has a \"routes\" key.")
    ap.add_argument("--safe-area", type=_safe_area_arg, default=DEFAULT_SAFE_AREA,
                    metavar="TOP,BOTTOM",
                    help="emulated safe-area insets in CSS px (default %d,%d = "
                         "iPhone 17 Pro); 0,0 turns emulation off" % DEFAULT_SAFE_AREA)
    a = ap.parse_args()

    asyncio.run(record(a.route, a.name, a.seconds, a.warmup,
                       a.selector, a.keep_splash, max(0.0, min(1.0, a.scroll_to)),
                       a.fixture, a.safe_area))
