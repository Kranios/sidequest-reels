# SideQuest Reels — Remotion system

Our own iPhone GLB + Remotion's animation system + Instagram-safe layout.

## Why this replaced the Blender-per-reel pipeline
The old flow rendered the phone in Blender for every reel: ~9 minutes per
iteration, texture-swapping bugs, and manual 2D compositing. Here the phone is
a real-time 3D model, the app screen is just a video you swap, and every
animation is code. Iteration goes from minutes to instant preview.

Blender is still useful for a hero shot where path-traced quality matters —
it just isn't in the loop for everyday reels any more.

## Setup (once)
```
cd remotion
npm install
```
Put the phone model at `public/iphone17pro.glb`:
```
copy ..\assets\iphone17pro.glb public\iphone17pro.glb
```

## Make a reel
1. Start the SideQuest app locally (separate terminal), then record the screen
   as smooth video — the globe is seeded automatically, no backend/login:
   ```
   python ..\capture\record_video.py travel-tracker travel_tracker 6
   ```
   Writes `public/app/travel_tracker.mp4`.

2. Preview and iterate live:
   ```
   npm run dev
   ```
   In Remotion Studio flip `showSafeArea` to `true` to see exactly where
   Instagram's UI will sit. Nothing readable should touch the red bands.

3. Render:
   ```
   npx remotion render GlobeReel out/globe.mp4
   ```

## Instagram safe areas
`src/safe-areas.ts`. Meta unified its 9:16 safe zones in March 2026 around the
tightest placement (Reels) and moved to percentages, so most published pixel
guides are now too loose.

- `strict` (default) — 269 top / 672 bottom / 65 sides. Safe on every Meta
  placement. This is what we ship.
- `standard` — 220 / 450 / 65 / 120. Roomier, older guidance, slightly riskier.

Every text layer renders inside `safeBoxStyle()`, so captions and the CTA can
never end up under the caption bar or the like/comment/share column. The phone
and backgrounds may extend outside — only *readable* things are constrained.

## Facts baked in (don't re-derive)
- screen mesh: `Cube.010_screen.001_0` (the `glass` mesh is the camera lenses —
  texturing that one shows the phone's back)
- camera sits on **-X**; +X faces the back
- the screen UV is rotated 180°, handled with `texture.rotation` in Phone.tsx
- logo geometry is locked in `src/brand.ts`, mirroring `lib/brand.py`

## Files
- `src/brand.ts` — colours, wordmark geometry, handle/url/launch line
- `src/safe-areas.ts` — Instagram safe zones + `safeBoxStyle()`
- `src/components/Phone.tsx` — GLB + video texture + camera move
- `src/components/Hook.tsx` — word-by-word spring hook
- `src/components/CTA.tsx` — brand-locked closing card
- `src/components/SafeAreaOverlay.tsx` — dev guide, off when rendering
- `src/compositions/GlobeReel.tsx` — theme 7, the template for new themes

## Adding a theme
Copy `GlobeReel.tsx`, change the hook lines, caption and app video, then
register it in `src/Root.tsx` as a new `<Composition>`.
