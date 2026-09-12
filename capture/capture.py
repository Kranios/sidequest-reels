"""
SideQuest Reel Factory v2 — Playwright capture harness.

Captures the REAL SideQuest app UI (brand rule #1). Modes:

  still  <route> <name>              one PNG of a screen
  scroll <route> <name> [frames] [px] PNG sequence scrolling the screen
  batch                              all screens in SCREENS
  record <route> <name>              browse a route in your LOGGED-IN session
                                     and SAVE every /api response to
                                     cache/api_recordings/<name>.json — this
                                     captures the exact JSON shape the app wants
  replay <route> <name> [--from REC] serve recorded (or fixture) API responses
                                     so the screen renders FILLED without a
                                     backend, then screenshot it

Recommended flow for a filled, believable screen:
  1. record it once from your logged-in session:
        python capture/capture.py record travel-tracker travel_tracker
  2. optionally hand-edit cache/api_recordings/travel_tracker.json to add more
     content (more countries, activities, expenses) in the SAME shape
  3. replay + screenshot any time, no backend, identical every run:
        python capture/capture.py replay travel-tracker travel_tracker

App URL via SQ_APP_URL (default http://localhost:8081).
"""
import asyncio
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPTURES = ROOT / "cache" / "captures"
RECORDINGS = ROOT / "cache" / "api_recordings"
FIXTURES = ROOT / "configs" / "fixtures"
CAPTURES.mkdir(parents=True, exist_ok=True)
RECORDINGS.mkdir(parents=True, exist_ok=True)

APP_URL = os.environ.get("SQ_APP_URL", "http://localhost:8081")
VIEWPORT = {"width": 390, "height": 844}
SCALE = 3  # -> 1170x2532 device pixels

# Canonical screens for batch (route, name, mode). Routes use the app's real
# paths (hyphens, not underscores). Names are the output file stems.
SCREENS = [
    ("travel-tracker",                "travel_tracker",   "still"),
    ("create-trip",                   "create_trip",      "still"),
]

# A believable traveller's map: visited across Europe + a few further afield,
# a couple planned. Edit freely — keys are ISO-2 codes, values are
# visited / planned / living. Fills the globe with NO backend/login.
DEFAULT_COUNTRY_STATUS = {
    "SE": "living",
    "ES": "visited", "IT": "visited", "FR": "visited", "DE": "visited",
    "GB": "visited", "NL": "visited", "PT": "visited", "GR": "visited",
    "HR": "visited", "CZ": "visited", "DK": "visited", "NO": "visited",
    "TH": "visited", "US": "visited", "JP": "planned", "ID": "planned",
    "MX": "planned",
}


# ----------------------------------------------------------------- launch
async def _launch(record_to=None, replay_from=None):
    from playwright.async_api import async_playwright
    p = await async_playwright().start()
    browser = await p.chromium.launch(
        args=["--force-device-scale-factor=%d" % SCALE])
    ctx = await browser.new_context(viewport=VIEWPORT, device_scale_factor=SCALE)
    page = await ctx.new_page()

    if record_to is not None:
        # Save every /api response body, keyed by URL path, as we browse.
        recorded = record_to

        async def on_response(resp):
            url = resp.url
            if "/api/" in url or "sidequesttravel" in url:
                try:
                    body = await resp.text()
                    # store by path (strip origin + query) so replay matches
                    from urllib.parse import urlparse
                    path = urlparse(url).path
                    recorded[path] = {
                        "status": resp.status,
                        "body": body,
                        "content_type": resp.headers.get("content-type", "application/json"),
                    }
                except Exception:
                    pass
        page.on("response", on_response)

    if replay_from is not None:
        async def handler(route):
            from urllib.parse import urlparse
            path = urlparse(route.request.url).path
            rec = replay_from.get(path)
            if rec is None:
                # try suffix match (path params differ)
                for k, v in replay_from.items():
                    if path.endswith(k.split("/")[-1]) or k.endswith(path.split("/")[-1]):
                        rec = v
                        break
            if rec is None:
                await route.fulfill(status=200, content_type="application/json", body="{}")
            else:
                await route.fulfill(status=rec["status"],
                                    content_type=rec.get("content_type", "application/json"),
                                    body=rec["body"])
        await page.route("**/api/**", handler)
        await page.route("**sidequesttravel**/**", handler)

    return p, browser, page


# ----------------------------------------------------------------- modes
async def capture_still(route, name):
    p, browser, page = await _launch()
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    out = CAPTURES / f"{name}.png"
    await page.screenshot(path=str(out))
    await browser.close(); await p.stop()
    print(f"still: {out}")


async def capture_scroll(route, name, frames=45, px=18):
    p, browser, page = await _launch()
    # seed the globe so travel-tracker scrolls through a FILLED map
    await page.add_init_script(
        "window.localStorage.setItem('travel_tracker_status_map', %s);"
        % json.dumps(json.dumps(DEFAULT_COUNTRY_STATUS))
    )
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")
    await page.wait_for_timeout(1200)
    seq = CAPTURES / name
    seq.mkdir(exist_ok=True)
    for i in range(frames):
        await page.screenshot(path=str(seq / f"f{i:04d}.png"))
        await page.evaluate(f"window.scrollBy(0, {px})")
        await page.wait_for_timeout(30)
    await browser.close(); await p.stop()
    print(f"scroll seq: {seq} ({frames} frames)")


async def do_record(route, name):
    recorded = {}
    seen_urls = []
    p, browser, page = await _launch()

    from urllib.parse import urlparse

    async def on_response(resp):
        url = resp.url
        seen_urls.append(url)
        # record any JSON-ish response from the app's own origin or backend
        ct = resp.headers.get("content-type", "")
        looks_api = ("/api/" in url or "sidequesttravel" in url
                     or "supabase" in url or "application/json" in ct)
        if looks_api:
            try:
                body = await resp.text()
                path = urlparse(url).path
                recorded[path] = {
                    "status": resp.status,
                    "body": body,
                    "content_type": ct or "application/json",
                }
            except Exception:
                pass

    page.on("response", on_response)

    print(f"Recording {route} — loading in your session…")
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")
    await page.wait_for_timeout(2500)
    # reload once to force any cached data to re-fetch through our listener
    print("  reloading to force fresh API calls…")
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(3500)

    await page.screenshot(path=str(CAPTURES / f"{name}.png"))
    await browser.close(); await p.stop()

    out = RECORDINGS / f"{name}.json"
    out.write_text(json.dumps(recorded, indent=2), encoding="utf-8")
    print(f"recorded {len(recorded)} API responses -> {out}")
    print(f"saw {len(seen_urls)} total responses; unique hosts/paths:")
    shown = set()
    for u in seen_urls:
        pu = urlparse(u)
        key = f"{pu.netloc}{pu.path}"
        if key not in shown and ("api" in u or "supabase" in u or "sidequest" in u):
            print(f"   - {key}")
            shown.add(key)
    if not recorded:
        print("⚠ still nothing matched. Check the URLs above — tell Claude which "
              "host the data comes from and we'll target it.")


async def do_replay(route, name, from_name=None):
    rec_file = RECORDINGS / f"{(from_name or name)}.json"
    if not rec_file.exists():
        print(f"✗ no recording at {rec_file} — run 'record' first")
        return
    recorded = json.loads(rec_file.read_text(encoding="utf-8"))
    p, browser, page = await _launch(replay_from=recorded)
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    out = CAPTURES / f"{name}.png"
    await page.screenshot(path=str(out))
    await browser.close(); await p.stop()
    print(f"replay still: {out} (served {len(recorded)} mocked endpoints)")


async def do_seed(route, name, status=None):
    """Write travel-tracker country status into localStorage, then capture the
    filled globe. No backend, no login — the tracker reads this key directly."""
    status = status or DEFAULT_COUNTRY_STATUS
    p, browser, page = await _launch()
    # set the key BEFORE the app boots so it reads it on first render
    await page.add_init_script(
        "window.localStorage.setItem('travel_tracker_status_map', %s);"
        % json.dumps(json.dumps(status))
    )
    await page.goto(f"{APP_URL}/{route.lstrip('/')}", wait_until="networkidle")
    await page.wait_for_timeout(2500)
    out = CAPTURES / f"{name}.png"
    await page.screenshot(path=str(out))
    await browser.close(); await p.stop()
    visited = sum(1 for v in status.values() if v in ("visited", "living"))
    print(f"seeded {len(status)} countries ({visited} visited) -> {out}")


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    mode = sys.argv[1]
    if mode == "batch":
        async def run_all():
            for route, name, m in SCREENS:
                if m == "scroll":
                    await capture_scroll(route, name)
                else:
                    await capture_still(route, name)
        asyncio.run(run_all()); return
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(1)
    route, name = sys.argv[2], sys.argv[3]
    if mode == "still":
        asyncio.run(capture_still(route, name))
    elif mode == "scroll":
        fr = int(sys.argv[4]) if len(sys.argv) > 4 else 45
        px = int(sys.argv[5]) if len(sys.argv) > 5 else 18
        asyncio.run(capture_scroll(route, name, fr, px))
    elif mode == "record":
        asyncio.run(do_record(route, name))
    elif mode == "replay":
        frm = None
        if "--from" in sys.argv:
            frm = sys.argv[sys.argv.index("--from") + 1]
        asyncio.run(do_replay(route, name, frm))
    elif mode == "seed":
        asyncio.run(do_seed(route, name))
    else:
        print("unknown mode:", mode); sys.exit(1)


if __name__ == "__main__":
    main()
