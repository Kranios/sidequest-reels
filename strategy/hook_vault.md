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
| `T1-Receipt-HiddenSideQuest` | recognition | **1** — "One secret plan." | rows: who knows it (Leo 1, the other eight 0) / "Reveals in 2 days, 5 hours." / "The other eight get a countdown." |
| `T2-Reveal-HiddenSideQuest` | curiosity | "They think it's a normal dinner. / Nobody knows what happens at 23:30." | lock "Hidden until reveal" / "The group gets one clue: swimsuits." |
| `T3-Speedrun-HiddenSideQuest` | competence | "How to lock / a secret SideQuest." | "Hidden until reveal." / over the take: "Named. Hidden. 23:30. Saved." / "Nobody finds out before 23:30." |
| `T4-Callout-HiddenSideQuest` | humour | "Don't tell the group chat / where you're going." | "Someone screenshots it. Someone guesses in one. Someone tells their partner. Surprise over by lunch." / "Lock it in SideQuest instead." |
| `T5-Atlas-HiddenSideQuest` | aspiration | "Mallorca Day 1. / Midnight cliff jump locked." | "The group sees a lock and a countdown." / stats: 8 friends in the dark · 1 clue given |

### Where every figure comes from

| Figure | Source |
|---|---|
| 1 secret plan · Leo 1, the others 0 | the journey creates the trip's only hidden SideQuest, as Leo; nine members |
| 2 days, 5 hours | the sealed row in the take: "Reveals in 2d 5h 56m" — counted from the moment of recording, so a re-record changes it; read it off the new take |
| 23:30 | the reveal time Leo sets |
| eight · 8 friends in the dark | nine members minus Leo, who made it |
| one clue: swimsuits · 1 clue given | the teaser "Swimsuits. No questions." |
| Day 1 | the SideQuest's date is the trip's first day ("Mon · Sep 14 · Day 1" in the feed) |
| a lock and a countdown | the sealed row: lock over the icon, "Reveals in …" |
| Midnight cliff jump | the title Leo types |

"They think it's a normal dinner" and T4's group-chat lines are narrative,
not fixture figures. T3 runs 21.9 s — over qa.py's 20 s cap, set so on
request (videoSeconds 17.6 is the 20.0 s version).

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
