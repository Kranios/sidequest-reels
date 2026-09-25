# SideQuest Reel Factory — project context

Marketing reels for **SideQuest**, a group travel-planning app built by Oskar's
cousin Pontus. Goal: App Store / Play downloads ahead of the iOS 2026 launch.
Instagram: @sideqtravel · sidequesttravel.app

Output format: 9:16, 1080x1920, H.264, 30fps, no audio baked in.

---

## Current architecture (use this)

**`remotion/`** is the live system. Everything else is legacy.

```
capture/record_video.py   Playwright -> smooth-scrolling app video (mp4),
                          API calls answered from configs/fixtures/
configs/fixtures/         mock API data per screen (see WORKFLOW below)
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
                          hook_vault.md — every hook used + tone rule
docs/archive/             one-off GLB diagnostics (diagnose-screen, inspect-glb)
```

### Templates, and how you make reel #12

`src/compositions/` holds the five **templates** — the machinery. `src/reels/`
holds the **reels** — one `<Composition>` per reel, all sharing a template's
component and schema, differing only in `defaultProps`.

| Template | File | Goal | Tempo | Phone | Capture needed |
|---|---|---|---|---|---|
| T1 Receipt | `T1Receipt.tsx` | shares | medium | late payoff | cost split, real data |
| T2 Reveal | `T2Reveal.tsx` | comments | slow | centre throughout | hidden sidequest |
| T3 Speedrun | `T3Speedrun.tsx` | saves | fast | the tool, one take | one `--scenario` journey |
| T4 Callout | `T4Callout.tsx` | comments/shares | punchy | absent | **none** |
| T5 Atlas | `T5Atlas.tsx` | saves | slowest | the object | travel-tracker |

Registered reels — the Cost Split A/B test: `T1-Receipt-CostSplit`,
`T2-Reveal-CostSplit`, `T3-Speedrun-CostSplit`, `T4-Callout-CostSplit`,
`T5-Atlas-CostSplit`; and the Packing List batch (capture
`app/packing_list_demo.mp4`, fixture `packing_list_demo.json`):
`T1-Receipt-PackingList`, `T2-Reveal-PackingList`, `T3-Speedrun-PackingList`,
`T4-Callout-PackingList`, `T5-Atlas-PackingList`; and the Hidden SideQuest
batch (capture `app/hidden_sidequest_demo.mp4`, fixture
`hidden_sidequest_demo.json`): `T1-Receipt-HiddenSideQuest`,
`T2-Reveal-HiddenSideQuest`, `T3-Speedrun-HiddenSideQuest`,
`T4-Callout-HiddenSideQuest`, `T5-Atlas-HiddenSideQuest`; and the Itinerary
batch (capture `app/itinerary_demo.mp4`, fixture `itinerary_demo.json`):
`T1-Receipt-Itinerary`, `T2-Reveal-Itinerary`, `T3-Speedrun-Itinerary`,
`T4-Callout-Itinerary`, `T5-Atlas-Itinerary`; and the Spotify batch
(capture `app/spotify_demo.mp4`, fixture `spotify_demo.json`):
`T1-Receipt-Spotify`, `T2-Reveal-Spotify`, `T3-Speedrun-Spotify`,
`T4-Callout-Spotify`, `T5-Atlas-Spotify`. `videoStartFrom` is
in frames (30 fps); T1, T2 and T5 allow up to 600, so a phone beat can start
late in a take. The first fifteen template reels were removed for it;
they are recoverable from commit `1ff4ffd` and their hooks are in the retired
list in `strategy/hook_vault.md`.

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
`BlurReveal` (T2) · `Timer` — counts up or down (T2's countdown; T3's
stopwatch was removed 2026-09-25 as clutter) · `ScreenSwapper` —
real hard cuts, one `<Sequence>` per screen (no template uses it since T3
became one continuous `--scenario` take; kept for a multi-capture reel).

**Legacy (do not extend):** `compose/`, `render/`, `qa/`, `make_reel.ps1`,
`render_plate.ps1`. These were the PIL + Blender pipeline. Superseded because
each reel needed a 9-minute Blender render and had no real animation. Kept only
for reference. (`qa/qa.py check` is still the delivery gate — see WORKFLOW.)

---

## Hard-won facts — do NOT re-derive these

These cost hours to find. Trust them.

### The phone GLB (`remotion/public/iphone17pro.glb`)
Re-dump any of this with `node docs/archive/diagnose-screen.mjs` (the display
mesh in detail) or `node docs/archive/inspect-glb.mjs` (every mesh), from the
repo root.

- Display mesh is **`Cube.010_screen.001_0`** (material `screen.001`): local
  bbox flat on X (thickness `0.0013`), spans `Y 0.776 × Z 1.663`; world AABB
  `0.0013 × 1.6631 × 0.7761` at `(-0.037, 0.023, -0.123)`, world rotation
  `(-90°, 0, 0)`. 206 triangles, **4 boundary loops ⇒ 3 cutouts**, rounded
  outline (corner radius ≈ `0.1213`, 15.6 % of the width).
- **Its shipped UVs are unusable.** They sit in **seven disjoint islands**
  across `u [-0.953 … 0.992]` (94 verts at `u < 0`), and the mesh is two shells
  (113 verts with −X normals, 100 with +X) at five X depths.
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

### The phone look — `Phone.tsx`
- Screen material is a **MeshPhysicalMaterial** with the video as
  `emissiveMap`, base colour black and `toneMapped: false` — the app's colours
  come through exactly. Clearcoat 1 / roughness 0 is the glass;
  `envMapIntensity` 0.45 — at 1.0 the studio softbox lays a milky haze over
  the UI (rule 3).
- The recording's aspect is reconciled with the display (0.7761 / 1.6631) by a
  centred **cover crop** — `texture.repeat` on top of the regenerated planar
  UVs. This is NOT the forbidden repeat/offset attempt to fix the GLB's UV
  islands; those UVs are gone.
- **drei's `ContactShadows` only works lying flat.** Its blur pass renders a
  helper plane that sits fixed in the world XZ plane at y = 0, outside the
  scene graph. Stood upright, the shadow camera sees it edge-on and the shadow
  comes out empty. So the whole shot is laid on its back (`STAGE_ROTATION`,
  −90° about Z): model, camera position **and up vector**, lights and
  `environmentRotation` are built in the documented upright frame and rotated
  into the world. Lighting and reflections are unchanged. Pass its `scale` as
  a module-level constant — an inline array rebuilds two render targets every
  frame.
- The entrance is a Remotion `spring` (damping 11, stiffness 40, mass 1.8)
  from a 45° tilt on two axes and 0.88 zoom, settled in ~1.3 s. A stiff spring
  stretched with `durationInFrames` still snaps — the stretch includes its
  long tail. `entry={false}` turns it off where a phone must cut in hard.
- The canvas renders at `dpr={2}` for crisp UI text — see memory below.
- **The orbit is eased** (`Easing.inOut(Easing.sin)`), not linear.
- **Focus moments: `phoneFocus`** (T1, T2, T3, T5), which is
  `[{ at, u, v, zoom, hold }]`. The camera pans to a point on the glass and
  pushes in, on a spring with no overshoot, then lets go after `hold`.
  - `at` and `hold` are seconds on the CAPTURE's clock, the take times
    documented below. So `videoStartFrom` never shifts them.
  - `u` and `v` are the displayed picture, with 0,0 at top-left.
  - The point comes from the display mesh's box, measured at load.
  - A zoom makes the phone outgrow its stage band. At `zoom` 1.8 it covers
    the bottom band, so time captions outside a focus or keep the zoom near
    1.3. Tested at `at` 1.5, `v` 0.3, `zoom` 1.8 on T1-Receipt-CostSplit.

### Text hierarchy — one definition, five templates
- `src/type.ts` holds exactly three styles: **hook**, **support**, **caption**.
  Templates pick a tier and may scale it. They never set a font, colour or
  shadow of their own. `textStyle(tier, {fontSize})` scales tracking with the
  size so a big hook still reads as the hook.
- Draw copy through `<HookText> <SupportText> <CaptionText>` (`components/Text.tsx`).
  `Caption` used to be copy-pasted into every composition; it is not any more.
- **Kinetic words.** Every tier draws through `MaskedWord`: each word rises
  from behind its own mask (`overflow: hidden`, `translateY` 110 % → 0) on
  an underdamped spring (damping 14, stiffness 160, mass 0.6; the calm
  tiers use damping 20).
  - `accentWords` (optional on every template) turns those words pink and
    pops their scale once they land.
  - `exitAt` drops the words back out in reading order. Templates compute it
    with `exitBefore(sequenceEnd, ...texts)`, so the copy has left before
    the cut instead of being cut.
  - Every text spring used to be damping 200, which is why everything moved
    the same polite way.
- **The finish: `components/Grade.tsx`**, the last layer in every template.
  - Film grain: `feTurbulence` with a new seed each frame, `grain` (0.04
    by default, optional prop).
  - A glint that sweeps across the phone glass, used on T2's reveal.
  - `GRADE_FILTER` (`contrast(1.06) saturate(1.08)`) is applied to
    `AnimatedBackground` ONLY. A grade over the whole frame would change the
    colours of the app's UI (rule 3).

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

### Rendering the 3D phone — GPU and memory
- **Render on the GPU.** `remotion.config.ts` sets
  `setChromiumOpenGlRenderer("angle")`. Chrome's headless default draws WebGL
  in software (SwiftShader). At `dpr={2}` that ran at ~7 s per frame, and the
  long renders were killed for low memory. On the GPU (RTX 3070) a phone reel
  runs at ~0.2 s per frame: T1 (402 frames) in under a minute, T3 (597
  frames) in 2 min, all 15 template reels in ~25 min. The frames match: a
  still differs by a mean of 0.6/255. The old "2.6 s per frame, 18 min per
  reel" figures were software rendering.
- **The OffthreadVideo cache is capped at 512 MB**
  (`setOffthreadVideoCacheSizeInBytes`). The phone's texture comes through
  `useOffthreadVideoTexture`, and by default the cache may use half the RAM
  that is free when the render starts. A T3 take filled ~2.8 GB and got the
  job killed.
- Render phone reels **one at a time** at `--concurrency=1`. `PHONE_DPR`
  stays 2; there is no need to lower it now. `remotion.config.ts` now sets
  `Config.setConcurrency(1)`: Remotion's default is half the logical cores
  (8 here), which means 8 WebGL tabs, and that made the PC unusable.
- **Batch renders: `remotion/render.ps1 <id> [<id> …] [-OutDir] [-Crf]`.**
  It bundles once and passes `--concurrency=1 --gl=angle` explicitly. It
  runs at BelowNormal priority and re-lowers Chrome's GPU process, which
  raises itself to AboveNormal. It kills leftovers between reels and picks
  the CRF per template (T2 4, T5 8). The lower priority does not slow the
  render (0.28 vs 0.25 s/frame measured). T1 took 62 s this way.
- For stills, **bundle once** (`npx remotion bundle src/index.ts
  --out-dir=<dir>`) and pass the bundle dir to `npx remotion still`, because
  every `still src/index.ts …` re-bundles.
- `remotion.config.ts` sets CRF 16. Don't also pass `--video-bitrate`: the
  renderer refuses both. Dark, slow reels need a lower CRF to clear QA's
  4.0 Mbps floor. Measured on the 2026-09-14 batch:
  - T1, T3 and T4 pass at CRF 10–16.
  - T5 needs CRF 8 (it measured 3.7–3.8 Mbps at CRF 10).
  - T2 needs CRF 4 (3.3 Mbps at CRF 10, 3.7 at CRF 8, 4.5 at CRF 4).
- **The mp4 container adds ~0.053 s** to the duration that `qa.py` reads, so
  600 frames measures 20.05 s and fails the 20 s cap. Keep a reel at ≤ 598
  frames.
- **A single `remotion still` can come out with no phone at all.** The whole
  3D canvas is empty, not magenta. T3-Speedrun-Spotify frames 196-200 and 204
  did this on every attempt, while a video render of frames 180-220 had the
  phone in all 41. It is a timing race in the one-frame still path. Before
  you call it a bug, check the frame with `render --frames=a-b`.
- **Check for a magenta frame 0.** On a GPU render the phone screen can come
  out magenta in the first frame, intermittently, because the texture is not
  ready yet. This happened once in 15 reels, and re-rendering fixed it.
  `qa.py` does not catch it, so scan every frame for pixels with R>180, G<90,
  B>180.
- **A killed Remotion render does not clean up after itself on Windows.** It
  leaves `chrome-headless-shell.exe`, `remotion.exe` and `ffmpeg.exe` behind,
  several GB each, and the next attempt then dies faster than the last. They
  all live under `remotion/node_modules`, so they are safe to find and kill
  by path. The name is `chrome-headless-shell.exe`, NOT `chrome.exe` (that is
  the user's browser) and not `headless_shell.exe`. Match on the name as well:
  a running Studio's `esbuild.exe` lives there too.

  ```powershell
  Get-CimInstance Win32_Process |
    Where-Object { $_.ExecutablePath -like '*reel_factory_v2\remotion\node_modules*' -and
                   $_.Name -in 'chrome-headless-shell.exe','remotion.exe','ffmpeg.exe','ffprobe.exe' } |
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
- **The CTA line. "First 50 get lifetime access — free." is retired — do not
  use it on any reel, ever again.** The standard sign-off is now
  **"Plan together. Travel better."**, and it is the default in
  `remotion/src/brand.ts` (`BRAND.launchLine`), which is what `<CTA>` falls
  back to when a reel passes no `launchLine`. A reel may pass a variant that
  suits its own copy — the line is a positioning statement, not a fixed
  string — but it may not go back to an offer or a scarcity claim. Note the
  old line survives in three places on purpose: the fifteen Cost Split /
  Packing List / Hidden SideQuest reels and `Root.tsx`'s two pre-template
  reels, which are already rendered and approved, and `compose/compose.py`,
  which is legacy. Sweep those only when Oskar asks. `strategy/feature_map.md`
  still records the launch offer itself as a fact about the product; that is
  not a CTA and stays.
- `ctaVariant: "quiet"` (T2, T5) never draws the launch line at all —
  `showLaunch = variant !== "quiet"` in `components/CTA.tsx`. Setting
  `launchLine` on a quiet reel is harmless but changes nothing on screen.
- Read config files with **explicit UTF-8** on Windows, or em-dashes render as
  garbage. This was a real bug.

### App capture
- App runs locally: `cd D:\sidequest-mobile && npx expo start --web` (port 8081).
  Needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set.
  For capture, placeholders work (`https://placeholder.supabase.co` /
  `placeholder`), plus `EXPO_PUBLIC_API_URL=http://localhost:5079` — a dead
  base, so an un-mocked call fails locally instead of reaching production (a
  401 from production signs the app out mid-capture). `CI=1` stops Expo
  opening a browser. The app lives in `C:\Users\osgr1\Downloads\mobile-master`.
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
- **Photos: trip covers and the hero carousel.** The app already has both.
  `trip.imageUrl` is the cover, and `buildSlideshowItems`
  (`components/slideshow-cover.tsx`) crossfades it with every activity's
  `imageUrl`, sorted by date and time. That only happens while
  `slideshowEnabled` is on and the activity has no `excludeFromSlideshow`.
  Each activity with a photo also gets it as its thumbnail in the feed. A
  fixture with `imageUrl: null` shows grey placeholder tiles.
  Fixtures point at `https://media.sidequest.demo/<file>`, and
  `install_media_route` serves those files from `configs/fixtures/media/`
  (Unsplash photos, credited in `CREDITS.md`). Nothing is fetched from the
  network during a take.
- **API mocking.** `record_video.py` answers every `**/api/**` request that is
  not for the app's own origin from the `routes` object of
  `configs/fixtures/*.json` (path → exact response body). `{id}` matches any
  one path segment, so `trip/demo/split` works for any id; matching is exact,
  so `/expenses` never swallows `/expenses/balances`. Unmatched calls get a
  404 and are listed after the run — check that list.
- **There are no app class names.** RN Web emits `css-view-…`, so a selector
  like `.expense-list` never matches. Use a text selector on something the
  fixture puts on screen: `--selector "text=Villa Sóller"`.
- **Language follows the device locale** (this machine is Swedish). Capture
  pins `locale="en-US"` and the light scheme, so reels get the English UI.
- **Desktop Chromium has no safe area**, so the app laid its header where the
  3D phone's Dynamic Island covers it ("Cost S▮"). Capture sets real insets
  with CDP `Emulation.setSafeAreaInsetsOverride` (59/34 px, iPhone 17 Pro) and
  the app pads itself — nothing is injected into the page. `--safe-area 0,0`
  turns it off.
- Playwright records at **25 fps**; Remotion samples by time, so that's fine.
  Past the end of a capture the phone holds the last frame.

### User journeys — `--scenario` and Phantom Touch
- `record_video.py --scenario cost_split_demo` records a scripted user instead
  of a scroll: after a 1.5 s beat on the list, Leo opens Add Expense, types
  "Farewell dinner" and 850, swipes the form up to the save button, saves,
  and the new row lands at the top (16.6 s).
  The default, `--scenario scroll`, is unchanged; scenarios ignore `seconds`.
  ```bash
  python capture/record_video.py trip/demo/split cost_split_demo --scenario cost_split_demo
  ```
- **Phantom Touch.** A recording has no cursor, so `inject_phantom_touch()`
  draws one: a 30 px translucent dot that follows the mouse and ripples
  (1.5×, fade, 300 ms) on every press. It MUST keep `pointer-events: none` —
  without it the dot sits on top of what it hovers and swallows Playwright's
  click. `lift_finger()` fades it out before the closing hold, so the result
  isn't covered by a dot parked on the last button.
- **Aim with text, never CSS.** `human_move` / `human_click` / `human_type`
  take Playwright locators (`get_by_text`, `get_by_placeholder`). A move is
  NOT a straight line: it follows a quadratic Bézier from where the mouse is
  (tracked in `_MOUSE`; Playwright doesn't expose it) to the target, bowed
  sideways by 8–18 % of the distance to a random side, eased out over 14
  steps — quick off the mark, soft landing. The RNG is seeded, so a
  re-record moves the same way. They hover 120 ms before a tap, type at 70 ms
  a key, and bring an off-screen target in with `human_scroll()`: the finger
  glides to open space and swipes while 25 eased wheel steps move the
  content over ~1 s, clamped to the scroller's real room so the ease-out
  lands instead of stalling. Never `scrollIntoView()` — Chromium's smooth
  scroll takes ~0.4 s, too fast to read, and leaves the finger parked over
  whatever slides under it. Wheel, not drag: RN Web doesn't scroll on a
  mouse drag. Place the mouse with
  `mouse_to()`, not `page.mouse.move()`, or the next arc starts from the
  wrong point. Locators are the ENGLISH UI strings — the
  capture pins en-US. "Add Expense" is the floating button until the sheet
  opens; then it is both the sheet's title and its submit, and the submit is
  `.last`. Nobody has to find a class name.
- **A journey needs a user.** Add Expense does nothing signed out
  (`openAddModal` returns early). Scenarios seed a Supabase session in
  localStorage under `sb-<project ref>-auth-token` (ref from
  `EXPO_PUBLIC_SUPABASE_URL`, default `placeholder`) as a fixture member, and
  the mock answers `POST /api/auth/sync` with that profile. supabase-js only
  needs `access_token`, `refresh_token` and a future `expires_at`, and decodes
  the token as a JWT — so it is a well-formed, unsigned one.
- **Saves are stateful.** A journey's writes are applied to an in-memory copy
  of the fixture, so what it saves comes back when the app reloads (rule 9);
  the fixture file is never changed. Expenses: a POST to
  `/api/trips/{id}/expenses`, balances recomputed to the cent with the
  fixture's own rules (recomputing the untouched fixture reproduces its
  balances and debts exactly). Packing list: POST items and categories, PATCH
  items (`isChecked`, `text`, `assignedToUserId` — the name is looked up from
  `/members` — or `clearAssignment`), DELETE items and categories.
  Activities: a POST to `/api/trips/{id}/activities` returns what the
  backend gives the creator (`isHiddenForViewer` false; `isRevealed` false
  while hidden, so the feed seals it), and a GET by id opens it.
  Itinerary drags: the trip feed orders each day by `sortIndex`, not by time.
  `PATCH /activities/reorder` (`{date, activityIds}`) stamps `sortIndex`
  0..n-1 in the order it is sent. `PATCH /activities/{aid}/move` does the
  same and also changes the activity's date; a hotel stay keeps its number
  of nights. Fixture: `itinerary_demo.json`, where day 1 files the 20:30
  dinner before the 11:00 beach. `python capture/test_dnd.py` checks the
  drag end to end.
- **`--scenario packing_list_demo`** (`trip/demo/packing-list`, fixture
  `packing_list_demo.json`: the same Mallorca trip and nine friends, Leo
  signed in). Leo ticks off "Sunscreen SPF 50" and "Snorkel masks ×4", taps
  "Add item…", types "Portable speaker" + Return, taps the person icon on the
  new row and picks "Mia". 15.3 s; header 6/15 → 8/16, and Mia's avatar sits
  on the new row from ~12.0 s — put `videoSeconds` around 14.5 in T3.
  ```bash
  python capture/record_video.py trip/demo/packing-list packing_list_demo --scenario packing_list_demo
  ```
- **`--scenario hidden_sidequest_demo`** (route `trip/demo`, fixture
  `hidden_sidequest_demo.json`: the same Mallorca trip and nine friends, Leo
  signed in, the trip upcoming). A prelude taps "Add activity" on the trip
  before the cut — loading `trip/<id>/sidequest/new` directly leaves no trip
  behind the form for Back to return to. Leo types "Midnight Cliff Jump",
  drags "Hidden until reveal", picks "Hidden until reveal", sets the reveal
  time 18:00 → 23:30 (on web the form's second `HH:MM` field), types the
  teaser "Swimsuits. No questions." (the field caps at 35) and saves. The app
  opens the saved SideQuest; Leo taps Back and the trip feed shows it sealed
  on day 1: "Hidden sidequest · Reveals in 2d 5h 56m". 20.2 s; the sealed
  card is on screen from ~17.0 s. The countdown runs from the moment of
  recording, so reel copy quotes it from the take, never from the fixture.
  No cover photo, so the card shows the SideQuest compass under the lock —
  the app blurs only a cover image.
  ```bash
  python capture/record_video.py trip/demo hidden_sidequest_demo --scenario hidden_sidequest_demo
  ```
- **Slide-to-unlock: `human_slide(page, label)`.** SideQuest's activation
  track only answers a drag. From its label the helper climbs to the first
  ancestor ≥ 44 px tall and ≥ 60 % of the screen wide (the track), presses
  the thumb half a track-height in from the left end, pulls it to the right
  end over 0.65 s and lets go. RN Web's PanResponder takes mouse drags.
- **Drag-to-reorder: `human_drag(page, source, target, hold_time=500)`.**
  The itinerary's `DraggableDayList` is a gesture-handler Pan with
  `activateAfterLongPress(350)`, so a drag has to press, hold still and only
  then move. The helper:
  - finds both rows from their text, with the same climb as `human_slide`;
  - glides to the source row's centre and holds for `hold_time` ms, while
    the dot swells and darkens;
  - carries the row along a gentle bow, 18 paced steps over 0.8 s;
  - lets go on the target row's far edge, past its midpoint and short of
    the next row's, so the row lands just beyond the target. The dot lifts
    off with a ring.

  Keep both rows clear of the list's auto-scroll edges (150 px from the top
  of the viewport, 140 px from the bottom), or the list scrolls under the
  drag. During the carry the other rows don't reflow, and the carried row
  has no background, so its text crosses the rows it passes. That is how the
  app looks, not a capture fault.
- **`--scenario itinerary_demo`** (route `trip/demo`, fixture
  `itinerary_demo.json`: the same Mallorca trip and nine friends, Leo signed
  in, the trip upcoming). The take runs 17.6 s. Leo:
  1. swipes day 1 up and drags "Dinner, Sóller old town" (20:30) below
     "Villa Sóller check-in" (16:00);
  2. opens Add activity and types "Beach Club";
  3. picks "Food". There is no restaurant or bar category, and Food is one
     of the three chips shown before "Show more";
  4. changes the date to day 2 and the time to 14:00. The web date field's
     placeholder is `ÅÅÅÅ-MM-DD` in every locale;
  5. saves, taps Back from the saved activity and swipes to day 2.

  A new activity lands LAST in its day, because the app sends no
  `sortIndex`. That is why the club goes on day 2, after the 10:00 boat
  day, and not on the day that was just put in order.
  ```bash
  python capture/record_video.py trip/demo itinerary_demo --scenario itinerary_demo \
      --selector "text=Dinner, Sóller old town"
  ```
- **Spotify is ONE shared playlist link per trip — nothing more.** There is no
  in-app song search, no track list and no per-song avatars. The feature is
  the "Spotify playlist" row in Trip tools (the grid bubble, a11y label "Open
  trip tools"). It opens "Spotify for this event", where you paste a public
  link and press "Save link": `PATCH /api/trips/{id}/spotify`
  `{spotifyUrl}` returns the trip. After that the row shows "▶ Open". Never
  script a song-picking journey; it would be fake UI (rules 1 and 3).
- **`--scenario spotify_demo`** (route `trip/demo`, fixture
  `spotify_demo.json`: the itinerary trip with day 1 in time order and
  `spotifyUrl: null`, Leo signed in). Leo opens Trip tools, taps "Spotify
  playlist", pastes a playlist link and saves. He then reopens the tools,
  where the row now shows "Open". The take runs 11.6 s. The tools sheet
  closes for ~0.5 s before the Spotify sheet opens; the app does that.
  ```bash
  python capture/record_video.py trip/demo spotify_demo --scenario spotify_demo
  ```
- **Relative dates: `{today±N}`.** The Add activity form refuses dates in the
  past and a reveal that has already passed, so a fixture for an upcoming
  trip can't hold fixed dates — it would break a week later. Any string in a
  fixture body may say `{today+2}`, `{today-30}T18:00:00Z` or `{today}`;
  `load_fixture_routes` replaces it with that ISO date, counted from the day
  of recording.
- **Pacing.** `human_scroll` and `human_slide` wait for each step's moment on
  the clock (`_pace`), not a fixed gap: every Playwright step is a round
  trip, and fixed gaps stretched a 1 s swipe to ~1.7 s. A take that must run
  tighter wraps its journey in `with tempo(move_steps=…, type_ms=…,
  scroll_ms=…)`; the shared `HUMAN_*` values come back after, so the other
  takes re-record as tuned. The SideQuest take runs at `SQ_TEMPO`: 8-step
  glides, 35 ms keys, 0.8 s swipes, 600 ms between beats, 0.8 s on the saved
  SideQuest, 2.5 s final hold — 36 s at the shared pacing, 20.2 s at this.
- **Icon-only controls: `human_click_row_control(page, text, pick)`.** A
  checkbox or an assign button has no text to aim at, but its row does. From
  the row's text, the helper climbs to the nearest flex-row container and taps
  a sibling: `"first"` = the checkbox, `"after"` = the control right after the
  text (the assign button). DOM shape, never class names. "Add item…" is both
  the category's tap target and the draft input's placeholder — tap
  `get_by_text(…).first`, type into `get_by_placeholder(…)`.
- A new scenario is an async function built from the helpers plus one entry
  in `SCENARIOS`: name → (function, fixture member id, fixture file,
  prelude or None — a step run before the cut). A
  scenario loads ONLY its own fixture unless `--fixture` says otherwise, so
  two fixtures that share a route (both define `/members`) can't cross wires;
  when several are loaded, the first file wins for GETs and for the in-memory
  copy alike.

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
python capture/record_video.py trip/demo/split cost_split 6 --scroll-to 0.2 \
    --selector "text=Villa Sóller"

# 2. iterate live (safe-area overlay + every prop in the Props panel)
cd remotion && npm run dev

# 3. render one reel by its composition id (phone reels: concurrency 1)
npx remotion render src/index.ts T4-Callout-CostSplit out/templates/T4-CostSplit.mp4
npx remotion render src/index.ts T1-Receipt-CostSplit ../output/T1.mp4 --concurrency=1

# 4. before delivering: typecheck and eyeball a few frames
npx tsc --noEmit
npx remotion still src/index.ts T1-Receipt-CostSplit out/check.png --frame=250
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

## WORKFLOW: Creating Reels for a New Feature

Proven on Cost Split (2026-09-12): one feature, one reel per template, and the
template's psychology is the variable under test.

1. **Pick a shipped feature** from `strategy/feature_map.md`. Never Gluno —
   it is `__DEV__` until it ships.
2. **Mock data — a fixture, not a login.**
   - Read the screen in the app source (read-only, rule 10) for the
     `/api/**` calls it makes and the types they return (`lib/types.ts`).
   - Write `configs/fixtures/<feature>_demo.json` with a `routes` object:
     path → exact response body. Put in enough rows that the screen overflows
     by **more than 200 px** — the capture waits for scrollable content and
     needs something to scroll.
   - Compute every derived figure (totals, balances, debts) from the raw rows
     with a script; never type them. Then re-check independently: each item's
     parts equal its total, nets sum to zero, debts clear the nets exactly.
3. **Dynamic IDs.** Record a route like `trip/demo/split`; the fixture key
   `/api/trips/{id}/expenses` serves it. `{name}` is one path segment, matched
   exactly. Keep the app pointed at the dead API base (see App capture).
4. **Record** with `record_video.py <route> <name> 6 --scroll-to 0.2
   --selector "text=<on-screen text>"`. Check the log — every route served,
   nothing unmatched — and look at the first, middle and last frames.
5. **One `<Composition>` per template** in `src/reels/T*.tsx`, id
   `T<n>-<Template>-<Feature>`:
   - T1, T2, T5: `appVideo: "app/<name>.mp4"`.
   - **T3 exception:** one continuous take, no cuts. Record a user journey
     with `record_video.py <route> <name> --scenario <scenario>` and point
     `appVideo` at it. The hook overlaps the start of the take; set
     `videoSeconds` to end ~2 s after the result appears, so the reel stays
     within 20 s.
   - **T4 exception:** no phone and no video prop at all — only the copy
     (`hookLine1/2`, `lines`, `punchline`).
   - `videoStartFrom: 0` — the capture already trims the splash.
   - T2's reveal: the blur creeps from `maxBlur` to `teaseBlur` across the
     hold, then snaps in `revealFrames` (8) with `revealFlash` and
     `revealPunch`. Viewers leave during a flat blur, so reveal by ~3 s. If
     the result comes late in the take, use `videoStartFrom` to start the
     take later rather than holding the blur longer.
   - T2's lock and countdown imply a timed unlock. Turn them off
     (`showLock`, `showCountdown`) for any feature that doesn't have one.
6. **Duration limit: 8–20 s** — `qa.py` fails anything outside it; aim for
   10–15 s. Check with `npx remotion compositions <bundle>`.
7. **The numbers must add up on screen.** Every figure comes from the fixture.
   A total shown above rows means the rows sum to that total; a claim about
   who paid must match the payer in the fixture. (The first T1 cut put
   €9,584.85 over five debts that summed to €3,713.07.) Log where each figure
   comes from in `strategy/hook_vault.md`.
8. **Tone of Voice** (`strategy/hook_vault.md`): cynical, observant, specific.
   No emojis, no rhetorical questions, no generic sales talk ("Discover
   SideQuest"). Hooks are 6–8 words at most; size them so each hook line
   fits on one line. Check the vault's retired list — never reuse a hook —
   and log the new ones.
9. **Tracking:** add each reel id to `strategy/analytics_template.csv`
   (`reel_id`, `theme`, `category`).
10. **Review and QA** (rule 7): `npx tsc --noEmit`; bundle once and render
    stills of each reel's beats; render one reel and run
    `python qa/qa.py check output/<file>.mp4`; look at
    `output/qa/contact_sheet.jpg`. Stop for Oskar's OK before committing.
    If Playwright or Remotion crashes, run the kill-by-path command above
    before retrying.

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

- **QA bitrate floor.** `qa.py`'s floor is 4.0 Mbps (lowered from 6 on
  2026-09-12): flat app graphics compress hard at CRF 16 — the T1 test
  measured 4.3 Mbps at CRF 16 and 5.6 Mbps at CRF 12. Darker, stiller reels
  dip under 4.0 and need a lower CRF, not a lower floor. On blurred dark frames
  each CRF step buys less and less: T2 went from 3.3 Mbps at CRF 10 to 3.7 at
  CRF 8 and 4.5 at CRF 4. T5 needs CRF 8. See "Rendering the 3D phone".
- **Still to capture:** the hidden sidequest card in its hidden state (T2's
  intended screen), and more `--scenario` journeys for T3 (create a trip,
  invite friends, settle up). T3 itself now plays one continuous take
  (`app/cost_split_demo.mp4`), so the old per-step captures are not needed.
- T1's first frame is empty background (the counter fades in from frame 4) —
  a weak cover if Instagram picks frame 0.
- `backdrop-filter` on chips may render differently than the preview.
- WebGL lighting won't match Blender's path tracing — tune `Environment` in
  `Phone.tsx` if the phone looks flat.

Closed: chips/caption overlapping the phone in `ShowcaseReel` (bands, see
above), the missing compositions for themes 1 and 4 (T2 Reveal and T1
Receipt), the cost-split capture with real data (`app/cost_split.mp4`), and the
Dynamic Island covering the app header (safe-area emulation).
