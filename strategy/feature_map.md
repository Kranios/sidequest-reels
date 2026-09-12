# SideQuest — Feature Map (marketing source of truth)

What the app actually contains, mapped to how it sells. Reels pull from here so
we never market a feature that doesn't exist or misrepresent one.

## Signature / unique (lead with these)
- **Hidden SideQuest (surprise-reveal)** — plan an activity, lock it, blur the
  cover, pick the exact moment it reveals to the group. Route: `trip/[id]/sidequest/`.
  Component: `hidden-sidequest-card.tsx`, `lib/activity-blur.ts`. NO competitor has this.
- **Travel-tracker (3D globe)** — countries fill in (visited / planned / living),
  world map + globe. Route: `travel-tracker.tsx`. Extremely save/share-friendly.

## All-in-one shared trip (the "5 apps → 1" story)
- Cost split (equal/exact/percentage, balances, settle up) — `trip/[id]/split.tsx`
- Packing list — `trip/[id]/packing-list.tsx`
- Documents — `trip/[id]/documents.tsx`
- Weather — `trip/[id]/weather.tsx`
- Shared calendar — `(tabs)/calendar.tsx`
- Trip functions hub / tools — `trip/[id]/functions.tsx`
- Travelers, invites, roles — `invite/[code].tsx`, `share/[shareCode].tsx`
- Spotify (per landing page)

## In development — DO NOT market until live
- **Gluno (AI planner assistant)** — flagged `__DEV__` / `ENABLE_GLUNO_ASSISTANT`.
  Keep out of launch campaign. Revisit when shipped.

## Launch mechanic (bake into CTAs)
- iOS launch 2026. First 50 members get **lifetime premium free**.
  Waitlist CTA: follow @sideqtravel + like the reel. Built-in urgency.

## Screens worth capturing (for app-demo segments)
trip_detail, trip_functions (tools hub), split (with real € data),
packing_list, travel_tracker (globe), hidden_sidequest (blurred → revealed),
create_trip flow (for speedrun).
