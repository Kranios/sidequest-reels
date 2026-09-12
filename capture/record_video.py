"""
Record the SideQuest app as SMOOTH VIDEO for Remotion.

Screenshot-per-frame capture (our old scroll mode) produces choppy motion.
Playwright can record the browser directly, and a paced smooth scroll driven on
rAF gives genuinely fluid motion that Remotion can map onto the phone screen.

  python capture/record_video.py <route> <name> [seconds] [--warmup MS]
                                [--selector SEL] [--keep-splash]
                                [--scroll-to FRACTION] [--fixture JSON ...]
                                [--safe-area TOP,BOTTOM] [--scenario NAME]

  python capture/record_video.py travel-tracker travel_tracker 6
  python capture/record_video.py trip/demo/split cost_split 6 --scroll-to 0.2 \
      --selector "text=Villa Sóller"
  python capture/record_video.py trip/demo/split cost_split_demo \
      --scenario cost_split_demo

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

SCENARIOS (--scenario)
----------------------
The default, "scroll", records a paced scroll. Any other scenario records a
USER JOURNEY instead: a scripted person taps, types and saves, with a visible
"phantom touch" dot standing in for the finger (a recording has no cursor).
Scenarios aim only with Playwright text locators — get_by_text,
get_by_placeholder — never CSS, so nobody has to dig React Native Web class
names out of the DOM. For a scenario the script also:
  - signs in a demo user (a fixture member) by seeding a Supabase session in
    localStorage — screens like Add Expense do nothing without a user;
  - applies a POST to the expenses route to an in-memory copy of the fixture,
    so what the demo saves comes back in the list, with the balances
    recomputed to the cent. The fixture file is never modified.
The positional `seconds` (scroll duration) is ignored by scenarios.

  cost_split_demo   Leo opens Add Expense, types "Farewell dinner" and 850,
                    saves; the new row lands at the top of the list.

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
import base64
import copy
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
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


# ------------------------------------------------------------ stateful mocks
# A journey that SAVES something must see it come back: after the POST the app
# re-fetches the list, and a static fixture would answer without the new row —
# the demo would "save" and show nothing (rule 9: the reel shows what the app
# shows). So a POST to the expenses route is applied to an in-memory copy of
# the fixture, and the balances are recomputed from it the way the fixture's
# own were built: largest-remainder split to the cent, nets, greedy settle-up.
EXPENSES = "/api/trips/{id}/expenses"
BALANCES = "/api/trips/{id}/expenses/balances"
SETTLEMENTS = "/api/trips/{id}/expenses/settlements"
MEMBERS = "/api/trips/{id}/members"


def _cents(x):
    return round(float(x) * 100)


def _split_cents(total_c, weights):
    """{user: weight} -> {user: cents}, summing exactly to total_c; leftover
    cents go to the largest remainders, in the order the users were given."""
    wsum = sum(weights.values()) or 1
    raw = {u: total_c * w / wsum for u, w in weights.items()}
    out = {u: int(v) for u, v in raw.items()}
    order = list(weights)
    left = total_c - sum(out.values())
    for u in sorted(raw, key=lambda u: (-(raw[u] - out[u]), order.index(u)))[:left]:
        out[u] += 1
    return out


def _recompute_balances(state):
    names = {m["id"]: m["name"] for m in state[MEMBERS]}
    net = {u: 0 for u in names}
    for e in state[EXPENSES]:
        for p in e["payers"]:
            net[p["userId"]] += _cents(p["amount"])
        for p in e["participants"]:
            net[p["userId"]] -= _cents(p["amount"])
    for s in state.get(SETTLEMENTS, []):
        net[s["fromUserId"]] += _cents(s["amount"])
        net[s["toUserId"]] -= _cents(s["amount"])

    # Largest debtor pays largest creditor until both sides clear.
    cred = [[c, u] for u, c in net.items() if c > 0]
    debt = [[-c, u] for u, c in net.items() if c < 0]
    debts = []
    while cred and debt:
        cred.sort(reverse=True)
        debt.sort(reverse=True)
        amt = min(cred[0][0], debt[0][0])
        debts.append({"fromUserId": debt[0][1], "fromUserName": names[debt[0][1]],
                      "toUserId": cred[0][1], "toUserName": names[cred[0][1]],
                      "amount": amt / 100})
        cred[0][0] -= amt
        debt[0][0] -= amt
        cred = [x for x in cred if x[0] > 0]
        debt = [x for x in debt if x[0] > 0]

    avatars = {b["userId"]: b.get("avatarUrl") for b in state[BALANCES]["balances"]}
    state[BALANCES] = {
        "balances": [{"userId": u, "userName": names[u], "avatarUrl": avatars.get(u),
                      "net": net[u] / 100} for u in names],
        "simplifiedDebts": debts,
    }


def _post_expense(state, trip_id, body, user):
    """Turn the app's POST body into the Expense the backend would return,
    newest first, and bring the balances up to date."""
    names = {m["id"]: m["name"] for m in state[MEMBERS]}
    total_c = _cents(body["totalAmount"])
    if body.get("splitMode") == "exact":
        shares = {p["userId"]: _cents(p["value"]) for p in body["participants"]}
    else:  # equal (value 1 each) or percentage (value = percent)
        shares = _split_cents(total_c, {p["userId"]: float(p["value"])
                                        for p in body["participants"]})
    existing = state[EXPENSES]
    expense = {
        "id": f"exp-new-{len(existing) + 1:02d}",
        "tripId": trip_id,
        "description": body["description"],
        "totalAmount": total_c / 100,
        "date": body["date"],
        "splitMode": body.get("splitMode", "equal"),
        "currency": existing[0]["currency"] if existing else "EUR",
        "receiptUrl": body.get("receiptUrl"),
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "createdByUserId": user["id"],
        "createdByName": user["name"],
        "payers": [{"userId": p["userId"], "userName": names.get(p["userId"], "?"),
                    "amount": _cents(p["amount"]) / 100} for p in body["payers"]],
        "participants": [{"userId": u, "userName": names.get(u, "?"), "amount": c / 100}
                         for u, c in shares.items()],
    }
    existing.insert(0, expense)
    _recompute_balances(state)
    return expense


async def install_api_mocks(page, routes, user=None):
    """Answer **/api/** from the fixtures. Returns (served, missed) for the log.

    Bodies are served from a deep copy, so a scenario's POST can change what
    later GETs see without touching the fixture on disk. With a `user`, the
    profile sync returns them and POSTs to the expenses route are applied."""
    app_host = urlparse(APP_URL).netloc
    state = {pattern: copy.deepcopy(body) for pattern, _rx, body, _src in routes}
    served, missed = {}, []
    can_post = user is not None and all(k in state for k in (EXPENSES, BALANCES, MEMBERS))

    async def fulfill_json(route, body, status=200):
        await route.fulfill(status=status, content_type="application/json",
                            body=json.dumps(body, ensure_ascii=False))

    async def handler(route):
        req = route.request
        url = urlparse(req.url)
        if url.netloc == app_host:  # the app's own bundle and assets
            await route.continue_()
            return
        if req.method == "GET":
            for pattern, rx, _body, _src in routes:
                if rx.match(url.path):
                    served[pattern] = served.get(pattern, 0) + 1
                    await fulfill_json(route, state[pattern])
                    return
        if req.method == "POST" and user is not None:
            if url.path == "/api/auth/sync":
                served["POST /api/auth/sync"] = served.get("POST /api/auth/sync", 0) + 1
                await fulfill_json(route, {
                    "id": user["id"], "name": user["name"], "email": user["email"],
                    "avatarUrl": None, "hasCompletedOnboarding": True, "role": None,
                    "language": "en",
                })
                return
            if can_post and _route_regex(EXPENSES).match(url.path):
                trip_id = url.path.split("/")[3]
                expense = _post_expense(state, trip_id, req.post_data_json, user)
                served[f"POST {EXPENSES}"] = served.get(f"POST {EXPENSES}", 0) + 1
                await fulfill_json(route, expense, status=201)
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


# ------------------------------------------------------------ demo sign-in
# Screens like Add Expense do nothing without a signed-in user (openAddModal
# returns early). supabase-js restores a session from localStorage with no
# network call as long as it has access_token, refresh_token and a future
# expires_at, and it decodes the access token as a JWT — so the token is a
# well-formed, unsigned one. The backend's profile sync is mocked above.
def _b64url(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def supabase_storage_key():
    """supabase-js's default key: sb-<first label of the project host>-auth-token."""
    url = os.environ.get("EXPO_PUBLIC_SUPABASE_URL") or "https://placeholder.supabase.co"
    return f"sb-{urlparse(url).hostname.split('.')[0]}-auth-token"


async def seed_demo_session(page, user):
    now = int(time.time())
    exp = now + 10 * 365 * 24 * 3600
    claims = {"sub": user["id"], "email": user["email"], "role": "authenticated",
              "aud": "authenticated", "iat": now, "exp": exp}
    token = ".".join([
        _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()),
        _b64url(json.dumps(claims).encode()),
        _b64url(b"demo"),
    ])
    session = {
        "access_token": token,
        "refresh_token": "demo-refresh-token",
        "token_type": "bearer",
        "expires_in": exp - now,
        "expires_at": exp,
        "user": {
            "id": user["id"], "aud": "authenticated", "role": "authenticated",
            "email": user["email"], "app_metadata": {},
            "user_metadata": {"name": user["name"], "language": "en"},
            "created_at": "2026-05-06T18:00:00Z",
        },
    }
    await page.add_init_script(
        "window.localStorage.setItem(%s, %s);"
        % (json.dumps(supabase_storage_key()), json.dumps(json.dumps(session)))
    )


def demo_user(routes, member_id):
    """A fixture member as the signed-in user, so their name shows as "(you)"."""
    for pattern, _rx, body, _src in routes:
        if pattern == MEMBERS:
            for m in body:
                if m["id"] == member_id:
                    return {"id": m["id"], "name": m["name"],
                            "email": f"{m['name'].lower()}@demo.invalid"}
    raise SystemExit(f"demo user {member_id!r} is not a member in the loaded fixtures")


# ------------------------------------------------------------ phantom touch
# A recording has no cursor, so a scripted tap is invisible. This draws one:
# a translucent dot that follows the mouse and ripples on every press, so a
# viewer sees where the "finger" goes. pointer-events: none is load-bearing —
# without it the dot sits on top of whatever it hovers and swallows the very
# click Playwright is trying to make.
PHANTOM_TOUCH_JS = r"""
(() => {
  const CSS = `
    #phantom-touch {
      position: fixed;
      top: 0;
      left: 0;
      width: 30px;
      height: 30px;
      margin: -15px 0 0 -15px;  /* centre the dot on the pointer */
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      pointer-events: none;
      z-index: 99999;
      opacity: 0;               /* hidden until the first move */
      transition: transform 0.1s ease-out, top 0.1s, left 0.1s;
    }
    #phantom-touch.phantom-click {
      animation: phantom-ripple 300ms ease-out;
    }
    @keyframes phantom-ripple {
      from { transform: scale(1);   opacity: 1; }
      to   { transform: scale(1.5); opacity: 0; }
    }
  `;
  const mount = () => {
    if (document.getElementById('phantom-touch')) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const dot = document.createElement('div');
    dot.id = 'phantom-touch';
    document.body.appendChild(dot);
    // Capture phase, so an app handler that stops propagation can't hide it.
    document.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      dot.style.opacity = '1';
    }, true);
    document.addEventListener('mousedown', () => {
      dot.classList.remove('phantom-click');
      void dot.offsetWidth;  // restart the animation on back-to-back taps
      dot.classList.add('phantom-click');
      setTimeout(() => dot.classList.remove('phantom-click'), 300);
    }, true);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
"""


async def inject_phantom_touch(page):
    """Draw the phantom finger in every document the page loads, from boot."""
    await page.add_init_script(PHANTOM_TOUCH_JS)


# ------------------------------------------------------------ human helpers
# Every helper takes a Playwright LOCATOR (page.get_by_text, get_by_placeholder,
# get_by_role ...), never a CSS string: React Native Web has no app class
# names to aim at, but the words a viewer reads are always there.
HUMAN_MOVE_STEPS = 30       # interpolated mouse positions per move = the glide
HUMAN_CLICK_PAUSE_MS = 300  # hover before the tap, so the eye lands first
HUMAN_TYPE_DELAY_MS = 150   # per keystroke


async def _bring_into_view(page, locator):
    """Smooth-scroll an off-screen element to the middle before the finger
    heads for it — otherwise the dot glides off the edge of the frame, and
    Playwright's own scroll-into-view is an instant jump that reads as a cut."""
    await locator.wait_for(state="visible")
    in_view = await locator.evaluate(
        "el => { const r = el.getBoundingClientRect();"
        " return r.top >= 0 && r.bottom <= window.innerHeight; }"
    )
    if not in_view:
        await locator.evaluate(
            "el => el.scrollIntoView({behavior: 'smooth', block: 'center'})"
        )
        await page.wait_for_timeout(800)


async def human_move(page, locator, steps=HUMAN_MOVE_STEPS):
    """Glide the mouse — and the phantom dot — to the element's centre."""
    await _bring_into_view(page, locator)
    box = await locator.bounding_box()
    if box is None:
        raise RuntimeError(f"human_move: {locator} has no bounding box")
    await page.mouse.move(box["x"] + box["width"] / 2,
                          box["y"] + box["height"] / 2, steps=steps)


async def human_click(page, locator):
    """Move there, hover a beat, tap."""
    await human_move(page, locator)
    await page.wait_for_timeout(HUMAN_CLICK_PAUSE_MS)
    await locator.click()


async def human_type(page, locator, text):
    """Tap the field, then type it one key at a time."""
    await human_click(page, locator)
    await locator.press_sequentially(text, delay=HUMAN_TYPE_DELAY_MS)


async def lift_finger(page):
    """Fade the dot out, like a finger leaving the glass — so a closing hold
    shows the result, not a grey dot parked on the button it last pressed."""
    await page.evaluate(
        "() => { const d = document.getElementById('phantom-touch'); if (!d) return;"
        " d.style.transition += ', opacity 0.25s'; d.style.opacity = '0'; }"
    )


# ------------------------------------------------------------ scenarios
# Every locator is text the app itself renders (the capture pins en-US), so a
# scenario survives any restyle that keeps the words.
OPENING_BEAT_MS = 1500  # the screen, untouched, before the first tap
STEP_PAUSE_MS = 2000    # between beats, so a viewer keeps up
FINAL_HOLD_MS = 3000    # the result, held long enough to land on film


async def scenario_cost_split_demo(page):
    """Log an expense the way a person would: open the sheet, name it, price
    it, save — and stay on the list where the new row appears."""
    await page.wait_for_timeout(OPENING_BEAT_MS)
    # Before the sheet opens, "Add Expense" is only the floating button.
    await human_click(page, page.get_by_text("Add Expense", exact=True).first)
    await page.wait_for_timeout(STEP_PAUSE_MS)  # the sheet slides up

    await human_type(page, page.get_by_placeholder("Dinner at restaurant", exact=False),
                     "Farewell dinner")
    await human_type(page, page.get_by_placeholder("250", exact=True), "850")
    await page.wait_for_timeout(STEP_PAUSE_MS)

    # With the sheet open, "Add Expense" is its title AND its submit button;
    # the submit is the last one, at the foot of the form.
    await human_click(page, page.get_by_text("Add Expense", exact=True).last)
    # Lift as soon as the ripple has played: the sheet closes onto the list
    # and the floating button lands right under where the finger was.
    await page.wait_for_timeout(400)
    await lift_finger(page)
    await page.wait_for_timeout(STEP_PAUSE_MS)  # sheet closes, list reloads
    await page.wait_for_timeout(FINAL_HOLD_MS)


# name -> (the journey, the fixture member it runs as)
SCENARIOS = {
    "cost_split_demo": (scenario_cost_split_demo, "u5"),
}


async def record(route, name, seconds=6.0, warmup_ms=DEFAULT_WARMUP_MS,
                 selector=None, keep_splash=False, scroll_to=1.0, fixtures=None,
                 safe_area=DEFAULT_SAFE_AREA, scenario="scroll"):
    from playwright.async_api import async_playwright
    api_routes = load_fixture_routes(fixtures)
    journey, user = None, None
    if scenario != "scroll":
        journey, member_id = SCENARIOS[scenario]
        user = demo_user(api_routes, member_id)

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
    served, missed = await install_api_mocks(page, api_routes, user)
    if journey:
        await inject_phantom_touch(page)
        await seed_demo_session(page, user)
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
    if journey:
        # Rest the finger lower-centre before the cut, so the dot is already
        # on screen in the first frame instead of flying in from the corner.
        await page.mouse.move(VIEWPORT["width"] * 0.6, VIEWPORT["height"] * 0.62)
    await page.wait_for_timeout(warmup_ms)

    # Everything before this instant is boot/splash and gets trimmed below.
    trim_s = 0.0 if keep_splash else max(time.monotonic() - rec_t0, 0.0)

    if journey:
        print(f"scenario: {scenario} (signed in as {user['name']})")
        await journey(page)
    else:
        # Resolve the scroller once more now that the view has settled, then
        # drive it on rAF. CSS `scroll-behavior: smooth` fights programmatic
        # scrolling, so force auto first.
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
                    help="scroll duration in seconds (default 6; ignored by "
                         "scenarios)")
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
    ap.add_argument("--scenario", default="scroll",
                    choices=["scroll", *SCENARIOS],
                    help="'scroll' (default) records a paced scroll; a named "
                         "scenario records a scripted user journey with a "
                         "visible phantom touch, e.g. cost_split_demo")
    a = ap.parse_args()

    asyncio.run(record(a.route, a.name, a.seconds, a.warmup,
                       a.selector, a.keep_splash, max(0.0, min(1.0, a.scroll_to)),
                       a.fixture, a.safe_area, a.scenario))
