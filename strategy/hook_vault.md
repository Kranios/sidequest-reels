# Hook Vault

Every hook that has shipped, so no line is used twice (Oskar's rule 6). Check
here before writing copy for a new reel; log the new hooks when it is built.

## Brand firewall — absolute rule

> **Tone of Voice är cynisk, observerande och specifik. Inga emojis, inga
> retoriska frågor och inget generiskt säljsnack (t.ex. 'Upptäck Sidequest').**

In practice: name the real figure (€9,584.85, not "thousands"), name the
behaviour (who paid, who is still waiting), and let the app appear as the
obvious answer rather than being announced. Never market Gluno — it is
`__DEV__` until it ships (feature_map.md).

## Numbers rule

Every figure in a reel must come from the fixture the capture was recorded
with, and every group of figures a viewer can add up must add up. A total
shown above rows means the rows sum to that total. A claim about who paid
must match the payer in the fixture.

---

## 2026-09-12 — Cost Split A/B test (theme 4, B-problem)

One feature, five templates, one variable: the template's psychology. All
figures come from the demo trip in `configs/fixtures/cost_split_demo.json`
(9 friends, 7 nights, Mallorca, 17 expenses, €9,584.85) — the same data the
app renders in `app/cost_split.mp4`.

| Reel ID | Driver | Hook (≤ 8 words) | Supporting lines |
|---|---|---|---|
| `T1-Receipt-CostSplit` | recognition | **€9,584.85** — "Nine friends. Seven nights. Seventeen receipts." | rows: who paid what (sum = €9,584.85) / "Ana booked the villa. Ana is still waiting." / "Already worked out. Nobody had to ask." |
| `T2-Reveal-CostSplit` | curiosity | "What the villa week cost. / Nobody looked." | "€9,584.85, assigned to the cent." |
| `T3-Speedrun-CostSplit` | competence | "Nine people. / One stopwatch." | "€9,584.85 to split." / over the one-take journey: "€850 dinner, split nine ways." / "Saved: one argument at the airport." |
| `T4-Callout-CostSplit` | humour | "Every trip has a treasurer. / Nobody elected them." | "Paid for the villa. Covered the wine tasting. Kept every receipt. Still owed €3,725.62." / "Tag the one still waiting." |
| `T5-Atlas-CostSplit` | aspiration | "Seven nights in Mallorca. / The maths already done." | "The trip, closed out." / stats: 9,584.85 euros spent · 0 spreadsheets opened |

### Where every figure comes from

| Figure | Source in the fixture |
|---|---|
| €9,584.85 | sum of the 17 expenses |
| 9 friends · 7 nights · 17 receipts | members · Villa Sóller, 7 nights (Jul 12–19) · expense count |
| T1 rows | amount each person paid: Ana 4,788.00 · Marcus 1,218.50 · Sam 1,143.20 · Leo 742.60 · Ravi 427.80 · Mia 360.00 · Ines 350.40 · Jo 329.35 · Ella 225.00 = 9,584.85 |
| Ana booked the villa | Villa Sóller, €4,284.00, paid by Ana |
| Ana's lines in T4 | Ana paid the villa, the cleaning fee and the wine tasting |
| €3,725.62 still owed | Ana's net balance (paid 4,788.00 − share 1,062.38) = sum of the settle-up debts to her |
| €850 dinner, split nine ways (T3) | the `cost_split_demo` journey: Leo saves "Farewell dinner", €850.00, split equally between all 9 (4 × 94.45 + 5 × 94.44 = 850.00) |

Verified 2026-09-12: every expense's payers and shares equal its total, the
nets sum to zero, and the settle-up debts clear every net exactly.

Tracking rows: `strategy/analytics_template.csv`.

---

## 2026-09-12 — Packing List batch (theme 6, B-problem)

Same five templates, a second feature: the shared packing list. Same trip and
nine friends as the Cost Split test, so the two batches read as one story.
Figures come from `configs/fixtures/packing_list_demo.json` as it stands at
the end of the `packing_list_demo` journey in `app/packing_list_demo.mp4`
(Leo ticks two items, adds "Portable speaker", assigns it to Mia).

| Reel ID | Driver | Hook (≤ 8 words) | Supporting lines |
|---|---|---|---|
| `T1-Receipt-PackingList` | recognition | **16** — "16 items. 9 people. One list." | rows: who has what assigned (sum = 16) / "Four unclaimed. Including the chargers." / "Two ticks. The whole group sees them." |
| `T2-Reveal-PackingList` | curiosity | "Sixteen things to pack. / Four have no owner." | "Every tick shows up on nine phones." |
| `T3-Speedrun-PackingList` | competence | "How we stop / double-packing." | "Shared packing list." / over the take: "Two ticked. One added. One handed to Mia." / "Nobody brings two umbrellas again." |
| `T4-Callout-PackingList` | humour | "Three umbrellas. / Zero sunscreen." | "Four chargers. No adapter. Two speakers. Zero snorkels." / "Put it on the list. With a name." |
| `T5-Atlas-PackingList` | aspiration | "Seven nights. Nine bags. / Packed as a group." | "Packed before the group chat woke up." / stats: 9 people · 1 shared list |

### Where every figure comes from

| Figure | Source |
|---|---|
| 16 items | the shared list after the journey: 15 in the fixture + "Portable speaker" |
| 9 people | members |
| T1 rows | shared items per assignee after the journey: Ines 2 · Jo 2 · Marcus 2 · Mia 2 (towels, speaker) · Sam 2 · Ella 1 · Ravi 1 · nobody 4 = 16 |
| four have no owner / "including the chargers" | unassigned: Cooler bag, Olive oil, Dish soap, Phone chargers |
| "Two ticked. One added. One handed to Mia." / "Two ticks" | the journey: Sunscreen SPF 50 and Snorkel masks ×4 ticked, speaker added, assigned to Mia (header 6/15 → 8/16) |
| "nine phones" / "1 shared list" | the shared list is visible to all nine members |

T4 is text-only: its lines are group-trip truths, not fixture figures. T5's
stats are the two that hold for the whole take — the on-screen counts move
from 6/15 to 8/16 while it plays.

---

## 2026-09-12 — Hidden SideQuest batch (theme 1, A-reveal)

The signature feature — the one no competitor has (feature_map.md). Same trip
and nine friends. Figures come from `configs/fixtures/hidden_sidequest_demo.json`
and the journey in `app/hidden_sidequest_demo.mp4`: Leo names it "Midnight
Cliff Jump", slides it hidden, sets the reveal to 23:30, leaves the teaser
"Swimsuits. No questions." and saves; the trip feed shows it sealed on day 1.

| Reel ID | Driver | Hook (≤ 8 words) | Supporting lines |
|---|---|---|---|
| `T1-Receipt-HiddenSideQuest` | recognition | **1** — "One secret plan." | rows: who knows it (Leo 1, the other eight 0) / "Reveals in 2 days, 7 hours." / "The other eight get a countdown." |
| `T2-Reveal-HiddenSideQuest` | curiosity | "They think it's a normal dinner. / Nobody knows what happens at 23:30." | lock "Hidden until reveal" / "The group gets one clue: swimsuits." |
| `T3-Speedrun-HiddenSideQuest` | competence | "How to lock / a secret SideQuest." | "Hidden until reveal." / over the take: "Named. Hidden. 23:30. Saved." / "Nobody finds out before 23:30." |
| `T4-Callout-HiddenSideQuest` | humour | "Don't tell the group chat / where you're going." | "Someone screenshots it. Someone guesses in one. Someone tells their partner. Surprise over by lunch." / "Lock it in SideQuest instead." |
| `T5-Atlas-HiddenSideQuest` | aspiration | "Mallorca Day 1. / Midnight cliff jump locked." | "The group sees a lock and a countdown." / stats: 8 friends in the dark · 1 clue given |

### Where every figure comes from

| Figure | Source |
|---|---|
| 1 secret plan · Leo 1, the others 0 | the journey creates the trip's only hidden SideQuest, as Leo; nine members |
| 2 days, 7 hours | the sealed row in the production-build take of 2026-09-25: "Reveals in 2d 7h 56m" (it was 2d 5h 56m in the first take) — counted from the moment of recording, so a re-record changes it; read it off the new take |
| 23:30 | the reveal time Leo sets |
| eight · 8 friends in the dark | nine members minus Leo, who made it |
| one clue: swimsuits · 1 clue given | the teaser "Swimsuits. No questions." |
| Day 1 | the SideQuest's date is the trip's first day ("Mon · Sep 14 · Day 1" in the feed) |
| a lock and a countdown | the sealed row: lock over the icon, "Reveals in …" |
| Midnight cliff jump | the title Leo types |

"They think it's a normal dinner" and T4's group-chat lines are narrative,
not fixture figures. T3 runs exactly 20.0 s, qa.py's cap (videoSeconds
17.6), so the sealed card holds ~1.2 s before the CTA.

---

## 2026-09-25 — Itinerary batch (theme 5, B-problem)

The shared itinerary: a day filed in the wrong order, dragged into place, and
a new activity added. Same Mallorca trip and nine friends as the other three
batches. Figures come from `configs/fixtures/itinerary_demo.json` as it stands
at the end of the `itinerary_demo` journey in `app/itinerary_demo.mp4` (Leo
drags the 20:30 dinner to the end of day 1, then adds "Beach Club" to day 2 at
14:00).

| Reel ID | Driver | Hook (≤ 8 words) | Supporting lines |
|---|---|---|---|
| `T1-Receipt-Itinerary` | recognition | **9** — "Group chat chaos." | rows: plans per day (sum = 9) / "Day 1 had four plans and no order." / "Sorted in 15 seconds." |
| `T2-Reveal-Itinerary` | curiosity | "They couldn't agree on the schedule. / So we just dragged it into place." | "Day 1 in order. Nobody sent a message." |
| `T3-Speedrun-Itinerary` | competence | "How to fix / a messy trip schedule." | "Drag, drop, add." / over the take: "Day 1 reordered. Beach Club added." / "One take. No group chat." |
| `T4-Callout-Itinerary` | humour | "Stop fighting over the itinerary. / Build it together instead." | "Beach at 11:00, says Mia. Dinner at 20:30, says Leo. Filed in that exact order." / "Fixed with one drag." / "Tag the schedule police." |
| `T5-Atlas-Itinerary` | aspiration | "Day 1 Chaos. / Itinerary locked and loaded." | "Eight days, in order." / stats: 4 plans on day one · 0 messages to agree them |

### Where every figure comes from

| Figure | Source |
|---|---|
| 9 plans | the trip's activities after the journey: 8 in the fixture + "Beach Club" |
| T1 rows | activities per day after the journey: day 1 = 4 · day 2 = 2 (boat + Beach Club) · day 3 = 1 · day 4 = 1 · day 7 = 1 = 9 |
| "four plans and no order" / "4 plans on day one" | day 1 holds Flight 07:40, Dinner 20:30, Beach 11:00, check-in 16:00 at sortIndex 0-3 — filed by drag order, not by time. The journey's Beach Club goes to day 2, so day 1 keeps its four for the whole take |
| 11:00 / Mia · 20:30 / Leo | the Beach, Cala Deià and Dinner, Sóller old town rows and their `ownerName` |
| "Sorted in 15 seconds." | the journey from the first press to the finished feed: the press is at ~5.0 s and the Beach Club is in the feed by ~14.0 s of the 18.4 s take re-recorded on 2026-09-25 (it was ~4.9 s and ~14.0 s of 17.6 s before) |
| "Eight days, in order." | Sep 16 – Sep 23, the trip's `startDate`/`endDate` — eight days, seven nights |
| 0 messages / "Nobody sent a message." | the reorder is a `PATCH /activities/reorder`; nothing goes through the chat |

T4 is text-only — it has no video prop at all — but its three deadpan lines are
still the fixture's day 1, not invented ones. T5's two stats are the pair that
hold for its whole beat.

T5's hook opened as "Mallorca Day 1." and was changed to "Day 1 Chaos." before
render: the original first line was word-for-word the one already used by
`T5-Atlas-HiddenSideQuest`, and a hook is never reused (rule 6). "Day 1 Chaos."
also sets up the same reel's "Itinerary locked and loaded." as a before/after.

**This is the first batch on the new CTA.** All five carry
"Plan together. Travel better."; T2 and T5 are `ctaVariant: "quiet"`, which
draws no launch line, so it is set on them for consistency and shows on T1, T3
and T4.

---

## 2026-09-25 — Spotify batch (theme 6, B-problem)

The trip's shared playlist: one Spotify link, saved on the trip, open to
everyone on it. The app has NO song search, track list or per-song avatars.
The feature is the link, and the reels claim nothing more. Same Mallorca trip
and nine friends as the other batches. Figures come from
`configs/fixtures/spotify_demo.json` and the `spotify_demo` journey in
`app/spotify_demo.mp4`: Leo opens Trip tools, pastes a playlist link, saves,
and the "Spotify playlist" row then shows "Open".

| Reel ID | Driver | Hook (≤ 8 words) | Supporting lines |
|---|---|---|---|
| `T1-Receipt-Spotify` | recognition | **9** — "One aux. Nine opinions." | rows: the nine travelers, 1 each (sum = 9) / "Leo pasted it once." / "One link. Everyone has the playlist." |
| `T2-Reveal-Spotify` | curiosity | "Nobody wants to play DJ. / Share the playlist link. Let the group handle it." | "Saved once. Open for all nine." |
| `T3-Speedrun-Spotify` | competence | "How to share / the trip playlist." | "One link. Zero chaos." / over the take: "Link pasted. Playlist shared." / "Saved once. Nine people have it." |
| `T4-Callout-Spotify` | humour | "Stop asking for the Spotify link. / It's already in the trip planner." | "Posted in the group chat. Buried by lunch. Asked for again at the gate." / "Saved once, in the trip." / "Tag the one who never finds it." |
| `T5-Atlas-Spotify` | aspiration | "Seven nights. One playlist. / Everyone has access." | "Sóller, Mallorca. Soundtrack sorted." / stats: 9 travelers with access · 0 links lost in the chat |

### Where every figure comes from

| Figure | Source |
|---|---|
| 9 / "Nine opinions" / "all nine" / "Nine people" | `/members` in the fixture: Ana, Jo, Sam, Marcus, Leo, Ines, Mia, Ravi, Ella |
| T1 rows | one row per member, 1 each: 9 × 1 = 9. Leo is flagged because he pastes the link in the take |
| "Seven nights" / "Sóller, Mallorca" | the trip's `startDate`/`endDate` ({today+2} to {today+9}) and `destination` |
| 0 links lost in the chat | saving is `PATCH /api/trips/{id}/spotify`; nothing is posted to the chat |

T4 is text-only. Its three group-chat lines are narrative, like T2's in the
Hidden SideQuest batch, and none of them carries a figure.

**Copy changed from the brief before build (approved 2026-09-25):** the
brief's "Who has the aux?" (T1) and "Tired of playing DJ?" (T2) broke the
no-rhetorical-questions firewall. They became "One aux. Nine opinions." and
"Nobody wants to play DJ.". "One link. Everyone adds their tracks." claimed an
in-app feature that does not exist and became "One link. Everyone has the
playlist.". "Roadtrip Playlist." did not fit a flight-and-villa trip and
became "Seven nights. One playlist.".

All five set "Plan together. Travel better."; T2 and T5 are `quiet`, so it
shows on T1, T3 and T4.

---

## Retired CTA — do not use again

- "First 50 get lifetime access — free." Retired 2026-09-25 by Oskar. The
  standard sign-off is now **"Plan together. Travel better."** (the default in
  `remotion/src/brand.ts`), or a variant that fits the reel's own copy. No
  offer lines, no scarcity claims. See the Brand section of CLAUDE.md for
  which already-rendered reels still carry the old line and why.

---

## Retired — used before 2026-09-12

The first template reels (removed from `src/reels/` for this test; recoverable
from git commit `1ff4ffd`). Do not reuse.

- T1: "Nine days. One villa. Four people." · "The flights were €612 each." · "Six people. Ten days. Tokyo."
- T2: "My friend hid this from us for three weeks." · "She didn't know until the morning it unlocked." · "POV: the group chat has a secret and it isn't about you."
- T3: "A 5-day trip in 30 seconds." · "Planning a trip with six people." · "Packing, documents, weather."
- T4: "Every group has that one person" · "The five people on every group trip" · "Things that end friendships"
- T5: "14 countries. 6.9% of the world." · "Everywhere I've been. Everywhere I'm going." · "Countries I'm manifesting for 2027."
- Pre-template: "Where you've been. Where you're going." · "One app. The whole trip."
