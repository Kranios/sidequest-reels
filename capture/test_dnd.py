"""
Drag-and-drop probe for the trip itinerary on React Native Web.

The trip feed is a DraggableDayList (the app's components/draggable-day-list.tsx).
Each row is a react-native-gesture-handler Pan with
activateAfterLongPress(350 ms), so a drag has to press, hold still, and only
then move. This script checks four things before a scenario is built on it:

  1. a plain Playwright mouse drag (down, hold, move in steps, up) starts
     that gesture on web, i.e. the row follows the pointer;
  2. the drop lands where the pointer let go, so day 1 of
     configs/fixtures/itinerary_demo.json comes out chronological;
  3. the app sends PATCH .../activities/reorder and the mock answers it;
  4. the mock keeps the new order, so it survives a reload.

    python capture/test_dnd.py            # headless
    python capture/test_dnd.py --headed   # watch it happen

Needs the app on :8081 (CLAUDE.md, App capture). Screenshots go to
cache/dnd_test/. Exit 0 means all four held.
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from record_video import (  # noqa: E402
    APP_URL, DEFAULT_SAFE_AREA, FIXTURE_DIR, ROOT, VIEWPORT,
    demo_user, emulate_safe_area, inject_phantom_touch, install_api_mocks,
    load_fixture_routes, seed_demo_session,
)

FIXTURE = FIXTURE_DIR / "itinerary_demo.json"
ROUTE = "trip/demo"
DRAGGED = "Dinner, Sóller old town"
DAY_ONE = ["Flight to Palma", DRAGGED, "Beach, Cala Deià", "Villa Sóller check-in"]
EXPECTED = ["Flight to Palma", "Beach, Cala Deià", "Villa Sóller check-in", DRAGGED]

HOLD_MS = 500       # past the list's 350 ms activateAfterLongPress
MOVE_STEPS = 24     # small steps: a gesture recogniser wants a stream, not a jump
MOVE_STEP_MS = 25
DAY_TOP_Y = 230     # where day 1's first row is parked before the drag, well
                    # clear of the list's auto-scroll edges (150 px top, 140 bottom)
OUT = ROOT / "cache" / "dnd_test"


async def title_boxes(page, titles):
    return {t: await page.get_by_text(t, exact=True).first.bounding_box() for t in titles}


def order_of(boxes):
    return [t for t, _ in sorted(boxes.items(), key=lambda kv: kv[1]["y"] if kv[1] else 1e9)]


async def open_trip(page):
    await page.goto(f"{APP_URL}/{ROUTE}", wait_until="networkidle")
    await page.get_by_text(DRAGGED, exact=True).first.wait_for(timeout=30000)
    await page.wait_for_timeout(800)


async def main(headed):
    from playwright.async_api import async_playwright
    OUT.mkdir(parents=True, exist_ok=True)
    routes = load_fixture_routes([FIXTURE])
    user = demo_user(routes, "u5")

    p = await async_playwright().start()
    browser = await p.chromium.launch(headless=not headed)
    ctx = await browser.new_context(viewport=VIEWPORT, device_scale_factor=2,
                                    locale="en-US", color_scheme="light")
    page = await ctx.new_page()
    errors, dialogs = [], []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("dialog", lambda d: (dialogs.append(d.message), asyncio.ensure_future(d.dismiss())))

    await emulate_safe_area(ctx, page, *DEFAULT_SAFE_AREA)
    served, missed = await install_api_mocks(page, routes, user)
    await inject_phantom_touch(page)
    await seed_demo_session(page, user)
    await open_trip(page)

    # Park day 1 high on the screen so the drag never enters an auto-scroll edge.
    boxes = await title_boxes(page, DAY_ONE)
    await page.mouse.move(VIEWPORT["width"] / 2, VIEWPORT["height"] / 2)
    await page.mouse.wheel(0, boxes[DAY_ONE[0]]["y"] - DAY_TOP_Y)
    await page.wait_for_timeout(700)
    boxes = await title_boxes(page, DAY_ONE)
    before = order_of(boxes)
    await page.screenshot(path=str(OUT / "1_before.png"))

    # The drop is decided by the dragged row's centre against the other rows'
    # midpoints, so aim that centre just past the check-in row's midpoint.
    src, last = boxes[DRAGGED], boxes["Villa Sóller check-in"]
    pitch = boxes["Beach, Cala Deià"]["y"] - src["y"]
    x = src["x"] + min(src["width"] / 2, 80)
    y0 = src["y"] + src["height"] / 2
    y1 = last["y"] + last["height"] / 2 + pitch * 0.6

    await page.mouse.move(x, y0)
    await page.mouse.down()
    await page.wait_for_timeout(HOLD_MS)
    await page.screenshot(path=str(OUT / "2_held.png"))
    for i in range(1, MOVE_STEPS + 1):
        await page.mouse.move(x, y0 + (y1 - y0) * i / MOVE_STEPS)
        await page.wait_for_timeout(MOVE_STEP_MS)
    await page.wait_for_timeout(250)
    await page.screenshot(path=str(OUT / "3_dragging.png"))
    mid = (await title_boxes(page, [DRAGGED]))[DRAGGED]
    followed = mid["y"] - src["y"]
    await page.mouse.up()
    await page.wait_for_timeout(1200)
    after = order_of(await title_boxes(page, DAY_ONE))
    await page.screenshot(path=str(OUT / "4_after.png"))

    await open_trip(page)  # a fresh load: the order must now come from the mock
    reloaded = order_of(await title_boxes(page, DAY_ONE))
    await page.screenshot(path=str(OUT / "5_reloaded.png"))

    await ctx.close()
    await browser.close()
    await p.stop()

    checks = {
        "row followed the pointer": abs(followed - (y1 - y0)) < pitch * 0.5,
        "drop landed chronological": after == EXPECTED,
        "PATCH reorder answered": served.get("PATCH activities", 0) > 0,
        "order survived a reload": reloaded == EXPECTED,
    }
    print(f"pointer travel {y1 - y0:.0f} px, row moved {followed:.0f} px mid-drag")
    print("before:  ", " > ".join(before))
    print("after:   ", " > ".join(after))
    print("reloaded:", " > ".join(reloaded))
    print("mocks served:", ", ".join(f"{k} x{v}" for k, v in served.items()))
    if missed:
        print("mocks unmatched (404):", ", ".join(sorted(set(missed))))
    if dialogs:
        print("app dialogs:", " | ".join(dialogs))
    if errors:
        print(f"console errors ({len(errors)}):", " | ".join(e[:160] for e in errors[:5]))
    for name, ok in checks.items():
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
    print(f"screenshots: {OUT}")
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--headed", action="store_true", help="show the browser")
    sys.exit(asyncio.run(main(ap.parse_args().headed)))
