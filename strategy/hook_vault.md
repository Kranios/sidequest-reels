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
| `T3-Speedrun-CostSplit` | competence | "Nine people. / One stopwatch." | "€9,584.85 to split." / steps: "Pick the trip", "Log the expense", "Settle up" / "Saved: one argument at the airport." |
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

Verified 2026-09-12: every expense's payers and shares equal its total, the
nets sum to zero, and the settle-up debts clear every net exactly.

Tracking rows: `strategy/analytics_template.csv`.

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
