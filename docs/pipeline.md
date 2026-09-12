# SideQuest Reel Factory v2 — Pipeline & Runbook

## What this base is
A clean production base for SideQuest marketing reels. No references to any old
sandbox — set your own asset paths (below). Proven to run end-to-end: compose
produces a valid 1080x1920 H.264 reel and QA passes.

## Directory map
```
reel_factory_v2/
├── lib/brand.py          # Brand constants — SINGLE source of truth (logo, palette)
├── strategy/             # feature_map.md, themes.md, analytics_template.csv
├── configs/              # one JSON per reel + fixtures/ (real on-screen data)
├── capture/capture.py    # Playwright: real app UI (still + scroll modes)
├── render/render_phone.py# Blender: animated 3D phone (camera orbit + dolly)
├── compose/compose.py    # b-roll + phone + kinetic text + brand CTA -> mp4
├── qa/qa.py              # blank/CTA checks + contact sheet (review before posting)
├── audio/                # music beds / beat maps (added on upload to IG)
├── assets/fonts|brand    # Raleway fonts + brand assets
├── cache/captures|renders|broll   # intermediate media
└── output/               # finished reels + qa/
```

## The 4 media sources and when to use each
1. **Playwright capture** — real app screens. ALWAYS for any app UI (rule #1).
   Use `scroll` mode to get living, scrolling UI instead of a frozen frame.
2. **Blender** — 3D phone with a camera move, when a screen deserves a hero
   shot. Not every reel needs it (rule #5).
3. **Higgsfield** — b-roll, hooks, atmosphere (travel footage, group vibe).
   Sells the feeling. NEVER used to fake app UI.
4. **Higgsfield Blender bridge** — drive the phone rig / camera faster than
   local CPU render when iterating.

## Setup (one command)
```
bash scripts/setup.sh /path/to/mobile-master
```
This installs Python deps + chromium, confirms the bundled Raleway fonts,
and fetches Blender + a CC0 studio HDRI. You supply the iPhone GLB (licensing)
at `assets/iphone17pro.glb`.

### What's already done for you
- **Raleway fonts** — bundled in `assets/fonts/` (Black/Bold/Regular, extracted
  from the variable font). Logo verified pixel-correct against your logo HTML.
- **Brand lock** — `lib/brand.py` uses the EXACT values from your logo canvas
  (fontSize 100, tracking -5.6, dot r=11 on the baseline).
- **Blender screen-texturing** — `render_phone.py` now maps the capture onto the
  display mesh (emissive) automatically.
- **Local-run + mocking** — see below.

## Running the real app for capture (no backend, no login)
The app is an Expo app that normally talks to `api.sidequesttravel.app` +
Supabase. For capture we DON'T want live data — we want your fixtures on screen
(rule #9), identical every run. So:

```
bash scripts/run_app.sh /path/to/mobile-master build   # serves localhost:8124
export SQ_APP_URL=http://localhost:8124
python capture/capture.py batch                        # grabs all batch-1 screens
```

Playwright intercepts every `/api/**` call and answers from
`configs/fixtures/*.json` (see `capture/setup_mocks` + `FIXTURE_ROUTES`).
No backend runs, no auth needed. Edit the fixture to change on-screen data.
`build` mode (static export) is the most stable for capture; `dev` mode gives
hot reload if you're iterating on screens.

## Produce a reel
```
# 1. capture real screens (still or scrolling)
python capture/capture.py scroll trip/<id>  trip_detail 45 18
python capture/capture.py still  travel-tracker travel_tracker

# 2. (optional) hero phone render with motion
blender -b -P render/render_phone.py -- cache/captures/trip_detail.png cache/renders/trip_detail 45

# 3. drop any Higgsfield b-roll into cache/broll/ (referenced by config "broll")

# 4. compose
python compose/compose.py configs/theme01_reveal.json

# 5. QA — then eyeball the contact sheet before posting (rule #7)
python qa/qa.py output/theme01_reveal.mp4
```

## Encode
compose uses ~10 Mbps (preset slow) so IG's re-encode still looks clean. For
quick iteration, temporarily lower to `-preset ultrafast` / `-b:v 4M`.

## Audio
Reels are rendered silent (`-an`). Add trending audio at upload time in IG, OR
place a bed in `audio/` and mux before posting. Design cuts to land on the beat
for best reach.

## Known TODO (remaining)
- Confirm the app's real route slugs match capture/SCREENS (e.g. trip id in the
  URL). Adjust SCREENS + FIXTURE_ROUTES to the actual dist-web routes.
- Fix cost_split + packing_list routes in the web build if they don't render
  (needed for theme 4). If they route fine with fixtures, nothing to do.
- Point `assets/iphone17pro.glb` at your phone model (you already have one).
- If your GLB's screen mesh isn't auto-detected, set `SQ_SCREEN_MESH` to its
  mesh name (render_phone.py falls back to the largest flat mesh otherwise).

## Done
- Raleway fonts bundled + logo verified pixel-correct.
- compose motion/kinetic-text/high-bitrate/brand-CTA — verified end-to-end.
- Blender animated camera + screen texturing wired.
- Local app run + fixture mocking wired.
- QA verified.
