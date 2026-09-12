# SideQuest Reel Factory — project context

Marketing reels for **SideQuest**, a group travel-planning app built by Oskar's
cousin Pontus. Goal: App Store / Play downloads ahead of the iOS 2026 launch.
Instagram: @sideqtravel · sidequesttravel.app

Output format: 9:16, 1080x1920, H.264, 30fps, no audio baked in.

---

## Current architecture (use this)

**`remotion/`** is the live system. Everything else is legacy.

```
capture/record_video.py   Playwright -> smooth-scrolling app video (mp4)
remotion/                 React/Remotion: phone, animation, text, render
  src/brand.ts            colours + logo geometry (SINGLE source of truth)
  src/safe-areas.ts       SAFE_INSETS — Instagram safe zone, ONE constant
  src/type.ts             THE TEXT HIERARCHY — hook / support / caption
  src/layout.ts           BANDS — splits the safe area, phone fit maths
  src/timing.ts           seconds -> frames, one rounding rule
  src/components/         Phone, Text, CTA, Wordmark, background + the five
                          reusable pieces (below)
  src/compositions/       ONE FILE PER TEMPLATE (T1..T5)
  src/reels/              ONE <Composition> PER REEL, grouped by template
strategy/                 themes, feature map, Higgsfield budget, analytics
                          templates_spec.md — the researched spec for T1..T5
```

### Templates, and how you make reel #12

`src/compositions/` holds the five **templates** — the machinery. `src/reels/`
holds the **reels** — one `<Composition>` per reel, all sharing a template's
component and schema, differing only in `defaultProps`.

| Template | File | Goal | Tempo | Phone | Capture needed |
|---|---|---|---|---|---|
| T1 Receipt | `T1Receipt.tsx` | shares | medium | late payoff | cost split, real data |
| T2 Reveal | `T2Reveal.tsx` | comments | slow | centre throughout | hidden sidequest |
| T3 Speedrun | `T3Speedrun.tsx` | saves | fast | the tool | one per step |
| T4 Callout | `T4Callout.tsx` | comments/shares | punchy | absent | **none** |
| T5 Atlas | `T5Atlas.tsx` | saves | slowest | the object | travel-tracker |

Registered reels: `T1-Receipt-{Villa,Flights,Tokyo}`,
`T2-Reveal-{ThreeWeeks,Morning,GroupChat}`,
`T3-Speedrun-{FiveDay,SixPeople,Packing}`,
`T4-Callout-{Planner,FivePeople,Friendships}`,
`T5-Atlas-{Countries,BeenVsGoing,Manifesting}`.

**A new reel is a new `<Composition>` block in `src/reels/T*.tsx`** — copy the
nearest one, rewrite the props, done. If it needs a change inside
`src/compositions/`, the template is missing a prop; add the prop rather than
forking the composition.

Every varying thing is already a zod prop: copy, numbers, names, currencies,
destinations, band split, timings, colours-within-brand. Section lengths are
derived from the content where the content sets them — add a line to T4's
`lines` or a step to T3's `steps` and the reel gets longer on its own.

### The five shared pieces

`NumberCounter` (T1, T5) · `KineticList` — stack rows or swap lines (T1, T4) ·
`BlurReveal` (T2) · `Timer` — counts up or down (T2, T3) · `ScreenSwapper` —
real hard cuts, one `<Sequence>` per screen (T3).

**Legacy (do not extend):** `compose/`, `render/`, `qa/`, `make_reel.ps1`,
`render_plate.ps1`. These were the PIL + Blender pipeline. Superseded because
each reel needed a 9-minute Blender render and had no real animation. Kept only
for reference.

---

## Hard-won facts — do NOT re-derive these

These cost hours to find. Trust them.

### The phone GLB (`remotion/public/iphone17pro.glb`)
Re-dump any of this with `node diagnose-screen.mjs` (the display mesh in
detail) or `node inspect-glb.mjs` (every mesh), from `remotion/`.

- Display mesh is **`Cube.010_screen.001_0`** (material `screen.001`): local
  bbox flat on X (thickness `0.0013`), spans `Y 0.776 × Z 1.663`; world AABB
  `0.0013 × 1.6631 × 0.7761` at `(-0.037, 0.023, -0.123)`, world rotation
  `(-90°, 0, 0)`. 206 triangles, **4 boundary loops ⇒ 3 cutouts**, rounded
  outline (corner radius ≈ `0.1213`, 15.6 % of the width).
- **Its shipped UVs are unusable.** They sit in **seven disjoint islands**
  across `u [-0.953 … 0.992]` (94 verts at `u < 0`), and the mesh is two
  shells (113 verts with −X normals, 100 with +X) at five X depths.
  `texture.repeat`/`offset` is a single linear transform — it can never gather
  seven islands into one picture. **Do not try to fix this with repeat/offset;
  five attempts each produced a different wrong result.**
- `Phone.tsx` instead **keeps the geometry and regenerates the UVs** with a
  planar projection from `attributes.position` (`projectPlanarUV`), normalised
  0–1 across the bbox. Which local axis becomes U/V and each one's sign are
  derived from the mesh's world orientation vs the camera, so there are no
  hardcoded flips. That gives the exact display shape — rounded corners and
  cutouts included — rigid in the model hierarchy.
- No net scaling in the chain: `…fbx` scales `0.01`, `Cube010` scales `100`;
  they cancel to world scale `(1,1,1)`.
- **`Cube.010_glass.002_0` is the BACK glass panel** (on +X, MeshPhysical,
  ~5% opacity) — *not* the camera lenses. The lenses are **`lensinglass`**.
  `Phone.tsx` hides both glass shells; never texture either.
- The screen faces **−X**. A camera on +X shows the back.
- **Blender is Z-up, three.js is Y-up.** The GLB's long axis is Y, so in
  three.js the phone stands upright and the camera must orbit in the **X/Z
  plane**. Orbiting in X/Y swings the camera over the phone and looks broken.
- If the screen renders **magenta**, the video never reached the texture
  (wrong path or the Video element didn't decode). That's a deliberate signal.

### Text hierarchy — one definition, five templates
- `src/type.ts` holds exactly three styles: **hook**, **support**, **caption**.
  Templates pick a tier and may scale it. They never set a font, colour or
  shadow of their own. `textStyle(tier, {fontSize})` scales tracking with the
  size so a big hook still reads as the hook.
- Draw copy through `<HookText> <SupportText> <CaptionText>` (`components/Text.tsx`).
  `Caption` used to be copy-pasted into every composition; it is not any more.

### Bands — why text can no longer land on the phone
- `splitSafeArea(insets, topFrac, bottomFrac, gutter)` in `src/layout.ts` cuts
  the safe area into **top (text) · stage (phone/media) · bottom (text)**.
  Text renders into a text band; the phone is centred in the stage band. The
  old arrangement had both sharing one box, held apart by hand-set offsets like
  `chipsOffsetY: 60` — that is what used to break.
- `<Phone band={bands.stage} bandFill={0.95}>` **derives** the camera distance
  from the band height using the measured model (body 1.6838 world units, fov
  30 → `radius = 6032.7 / wanted-pixel-height`). Stop dialling in `radius`.
- Phone.tsx recentres the GLB's bounding box on the origin at load. Without it
  the model's own `z = -0.123` put the phone ~60 px left of frame centre.
- Rule of thumb: `bandGutter` 28 is tight, 44 breathes. Raise it if a figure
  or caption looks like it is touching the phone.

### Rendering the 3D phone — memory
- A reel with the phone in it renders at roughly 40 s per 100 frames and holds
  ~4 GB. **Render them one at a time**, and use `--concurrency=2` if anything
  else is open — four in a chain alongside a browser will run a 16 GB machine
  out of memory and the OS will kill the job.
- **A killed Remotion render does not clean up after itself on Windows.** It
  leaves `chrome-headless-shell.exe`, `remotion.exe` and `ffmpeg.exe` behind,
  several GB each, and the next attempt then dies faster than the last. They
  all live under `remotion/node_modules`, so they are safe to identify and kill
  by path — and note the name is `chrome-headless-shell.exe`, NOT `chrome.exe`
  (that is the user's browser) and not `headless_shell.exe`:

  ```powershell
  Get-CimInstance Win32_Process |
    Where-Object { $_.ExecutablePath -like '*reel_factory_v2emotion
ode_modules*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  ```

### Instagram safe zones
- One constant: `SAFE_INSETS` in `src/safe-areas.ts`. Same for every reel.
- Published numbers disagree badly (320 / 350 / 400 / 450 / 672 px bottom).
  The largest come from Meta's *advertising* guidance and are over-cautious.
  Starting points: loose 150/320/50/100 · standard 220/450/65/120 ·
  strict 269/672/65/65.
- **Three tiers of framing** — this is the rule that makes reels look designed:
  - full-bleed: backgrounds, b-roll, glows — run off every edge
  - safe-framed: the subject (the phone) — must be fully visible
  - safe-text: anything readable — strictly inside the insets

### Brand (never drift)
- Wordmark "SideQuest" + pink dot `#F4A7B0`; dot sits **on the text baseline**.
  Geometry from the real logo export: fontSize 100, tracking −5.6, dot r=11,
  gap 6. Mirrored in `lib/brand.py` and `remotion/src/brand.ts` — keep in sync.
- Font: Raleway Black (900). Background `#0A0908`.
- Read config files with **explicit UTF-8** on Windows, or em-dashes render as
  garbage. This was a real bug.

### App capture
- App runs locally: `cd <mobile-master> && npx expo start --web` (port 8081).
  Needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set.
- Routes use **hyphens**: `travel-tracker`, not `travel_tracker`. Getting this
  wrong renders Expo's "Unmatched Route" page into the reel.
- The travel-tracker globe reads countries from **localStorage**, key
  `travel_tracker_status_map`, shape `{ "SE": "visited", ... }` with values
  `visited | planned | living`. Seeding this fills the globe with **no backend
  and no login** — see `DEFAULT_COUNTRY_STATUS` in `capture/capture.py`.
- Playwright launches a *clean* browser — it is NOT logged in as the user.
- **The document never scrolls.** React Native Web renders `<ScrollView>` as an
  inner overflow div, so `document.body.scrollHeight === window.innerHeight`
  (844 === 844) while the real scroller (`div.css-view-…`) has `scrollHeight`
  ~13900. `window.scrollTo` is a **no-op** — an early version of
  `record_video.py` "scrolled" 1 px and nobody noticed. The script now finds
  the largest scrollable element and animates its `scrollTop`.
- **The app boots with a splash sequence** (purple → white → logo) before the
  view renders, and Playwright starts recording at `new_page()`, *not* at
  `goto` — so waiting longer only records more splash. `record_video.py` waits
  for real content, settles for `--warmup` ms, then **trims exactly that much
  off the front** in the ffmpeg step. The mp4 starts inside the app.
  `--keep-splash` opts out.
- **Don't scroll the whole way.** travel-tracker's lower 75 % is a plain
  alphabetical country list — dull in a reel. `--scroll-to 0.2` covers globe →
  stats → all seven continent cards and stops at the filter row.
- Console output must be **UTF-8** (`sys.stdout.reconfigure`): the app's icon
  fonts emit private-use glyphs that crash Windows' default cp1252 console.
- Belt-and-braces if a capture still opens on a splash frame: `videoStartFrom`
  (zod prop on both compositions, default 10) skips that many frames. It is
  implemented as `<Sequence from={-n}>` in `Phone.tsx`, **not**
  `<Video startFrom>` — `<Video>` only exists on the preview path, so a
  `startFrom` there fixes Studio and silently does nothing to the render.

---

## Rules from Oskar (non-negotiable)

1. **Real app UI only.** SideQuest screens must be captured from the running
   app. Never HTML mockups of SideQuest.
2. **The logo must never differ** from the real SideQuest logo.
3. Screens must look **exactly** like the app.
4. Capture our own screens — images he sends are references, not assets.
5. The 3D phone is optional; use it where it fits, not on every reel.
6. **Be creative** — don't reuse the same hook line on every video.
7. **Review visually before delivering.** Never hand over an unchecked reel.
8. Short reels preferred (~10–15s).
9. If app data is shown (e.g. cost split), real data must be in place.
10. Do not modify anything inside the SideQuest app source; do not leak it.

Working language: **Swedish**. Reel content: **English**.
Responses: concise, technically precise, minimal hedging.

---

## Making a reel

```bash
# 1. app running on :8081, then record the screen as smooth video
#    (T4 needs no capture at all — start there if you just want a reel out)
python capture/record_video.py travel-tracker travel_tracker 6 --scroll-to 0.2

# 2. iterate live (safe-area overlay + every prop in the Props panel)
cd remotion && npm run dev

# 3. render one reel by its composition id
npx remotion render src/index.ts T4-Callout-Planner out/templates/T4-Planner.mp4

# 4. before delivering: typecheck and eyeball a few frames
npx tsc --noEmit
npx remotion still src/index.ts T1-Receipt-Villa out/check.png --frame=250
```

Pick the template from the table above, copy the closest reel block in
`src/reels/T*.tsx`, rewrite the props. `GlobeReel` and `ShowcaseReel` pre-date
the templates and are kept because they are already rendered — `GlobeReel` is
superseded by `T5Atlas`; start new work from a template.

**Keep `defaultProps` an inline object literal on `<Composition>`.** Studio's
Save button writes your slider tweaks back into the source and can only do that
for a literal — referencing a constant gives *"Can't save default props"* in the
Props panel. That also means the safe-area numbers are spelled out there rather
than read from `SAFE_INSETS`; re-sync them by hand if you change the constant.

---

## Strategy

10 themes in 3 categories (see `strategy/themes.md`). Test 2 reels per theme,
then double down on the winning category. Measure **saves, shares and profile
visits**, not just views — views only prove the hook worked.

Ratio target: ~70% emotion/story, 30% app demo. The app appears ~3s in, never
as the opening.

Signature features worth leading with: the **hidden sidequest** (blur → reveal,
no competitor has it) and the **travel-tracker globe** (very save-friendly).
**Gluno** (AI planner) is `__DEV__` — do not market it until it ships.

Higgsfield is for b-roll and hooks only — never for faking app UI. Draft at
720p, finish at 1080p; credits don't roll over. See
`strategy/higgsfield_budget.md`.

---

## Known open items

- **Captures missing for T1, T2 and T3.** Every reel in those three points at
  `app/travel_tracker.mp4` as a placeholder, so the timing and the cuts are
  real but the screen is wrong. Record and swap `appVideo` / `steps[].video`:
  - T1 — the cost-split screen with **real data** in it (rule 9).
  - T2 — the hidden sidequest card, in its hidden state.
  - T3 — one capture per step: create trip, add activities, invite, split.
- `backdrop-filter` on chips may render differently than the preview.
- WebGL lighting won't match Blender's path tracing — tune `Environment` in
  `Phone.tsx` if the phone looks flat.

Closed: chips/caption overlapping the phone in `ShowcaseReel` (bands, see
above), and the missing compositions for themes 1 and 4 (T2 Reveal and
T1 Receipt).
