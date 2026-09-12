# SideQuest — 5 Reel Templates (build spec)

Researched spec for Claude Code. Five **templates**, not five reels. Each one
must be able to produce 20+ reels by swapping data, not by rebuilding anything.

Constant across all five: **the SideQuest wordmark never changes.** Same logo,
same pink dot, same geometry, every single time. Everything else varies.

---

## What the research says (design constraints, not opinions)

- **You have ~1 second.** Instagram weighs the first two seconds harder than
  TikTok does. A hook that needs 3 seconds to land is already dead.
- **Hook text: 6–8 words max**, bold, high contrast, centred. No clutter — no
  moving cursors, no flashing icons. A muted viewer must get the whole value in
  one second.
- **Faceless formats are the most scalable** — screen recordings, product
  shots and b-roll with text overlays. That is exactly our stack, and it's why
  we can out-produce competitors without a camera or actors.
- **Specific numbers beat round ones.** €2,847 reads as a receipt; €3,000 reads
  as marketing. A number alone is a weak hook — pair it with a stake and
  watch-through roughly doubles.
- **Pattern interrupts must be sustained.** One strange frame followed by ten
  normal ones loses viewers faster than no interrupt at all.
- **Text must never fight the product.** If the viewer has to choose where to
  look, retention drops. (Our chips-over-phone problem is this exact mistake.)
- **One goal per reel**: saved, shared, commented, or followed. Pick one per
  template and design for it.
- **Design for sound-off.** On-screen text carries the whole story; audio is
  added at upload.
- Text hierarchy is fixed across all templates: one style for hooks, one for
  supporting lines, one for captions. Consistency is what makes it look
  designed rather than assembled.

## Competitive gap we're aiming at

The entire category (Wanderlog, TripIt, Polarsteps, Plotline, Mindtrip,
Layla) markets **planning and place-capture**. In 2026 the fashionable angle is
turning Reels/TikToks into itineraries — crowded and getting more so.

Nobody markets:
1. **the surprise** — a planned activity hidden from your own group
2. **the group's emotional dynamics** — who plans, who freeloads, who pays

Those are our two open lanes. Templates 2 and 4 own them.

---

## T1 — THE RECEIPT
**Goal: shares.** Tempo: medium. Phone: arrives late, as the payoff.

Numbers in full screen, no phone at first. Amounts count up, names land, the
total settles — then silence, then the phone slides in with the split already
solved.

Opens on a number because specificity reads as truth. Always a real,
odd-looking figure: €2,847 not €3,000.

**Content engine (why it scales):** every trip anyone ever takes is a new
receipt. Vary destination, group size, currency, and which expense category
blew up. Dozens of reels, same build.
- "We split €2,847 — here's who owed what"
- "Four people, one villa, €1,940. The maths nobody wants to do."
- "The flights were €612 each. Then Marcus 'forgot' his card."

**Needs:** number counter animation, staggered name rows, one app capture
(cost split with real data). No 3D phone until the last beat.

---

## T2 — THE REVEAL
**Goal: comments.** Tempo: slow, held. Phone: centre stage the whole time.

Blurred activity card, a lock, a countdown — then the blur lifts. The entire
reel is one sustained pattern interrupt, which is what the research says
actually holds viewers.

Our only true category exclusive. Lead with it.

**Content engine:** every destination and every occasion is a new secret.
Birthdays, anniversaries, surprise detours, a friend's bucket-list item.
- "My friend hid this from us for three weeks"
- "She didn't know until the morning it unlocked"
- "POV: the group chat has a secret and it isn't about you"

**Needs:** blur→sharp animation on a real capture of the hidden sidequest
screen, countdown element, minimal camera movement. Quiet CTA — let the reveal
be the last thing felt, no urgency line.

---

## T3 — THE SPEEDRUN
**Goal: saves.** Tempo: fast. Phone: the tool, constantly moving.

Hard cuts through a real flow: create trip → add activities → invite friends →
split costs. A timer ticks in the corner. Competence porn — satisfying,
save-worthy, and it demos the product without feeling like a demo.

**Content engine:** every feature combination is a new run, and the timer makes
it a format people expect variations of.
- "A 5-day trip in 30 seconds"
- "Planning a trip with 6 people, start to finish"
- "Packing list, documents, weather — 20 seconds"

**Needs:** multi-screen captures with quick transitions (whip/slide), a running
timer component, tighter cuts than any other template. Urgent CTA fits here.

---

## T4 — THE CALLOUT
**Goal: comments and shares.** Tempo: punchy. Phone: absent until the last beat.

Almost pure text. Group-travel truths everyone recognises, delivered as fast
kinetic lines over a moving background. ~90% feeling, 10% product — the ratio
the research favours, and the cheapest template to produce.

**Content engine:** effectively unlimited. Every group-travel frustration,
role, and cliché is a reel. This is the volume workhorse.
- "Every group has that one person who plans nothing"
- "The five people on every group trip"
- "Things that end friendships: shared holidays"

**Needs:** only kinetic text and the animated background. No capture required.
Build this one first — it proves the pipeline with the least moving parts.

---

## T5 — THE ATLAS
**Goal: saves.** Tempo: slow, cinematic. Phone: the object, barely moving.

Near-ASMR. The globe filling in, slow rotation, minimal text, dark and
expensive-looking. No sell at all. Built to be saved and re-shared, not
laughed at.

**Content engine:** every combination of countries and every travel identity is
a new one. Seeded entirely from localStorage, so no backend and no limits.
- "14 countries. 6.9% of the world."
- "Everywhere I've been vs everywhere I'm going"
- "Countries I'm manifesting for 2027"

**Needs:** travel-tracker capture (we have it), slow camera move, restrained
text. CTA is logo and handle only.

---

## Why these five and not five variations of one thing

| | Driver | Tempo | Phone role | Goal |
|---|---|---|---|---|
| T1 Receipt | recognition | medium | late payoff | shares |
| T2 Reveal | curiosity | slow | centre | comments |
| T3 Speedrun | competence | fast | tool | saves |
| T4 Callout | humour | punchy | absent | comments |
| T5 Atlas | aspiration | slowest | object | saves |

Five different psychological drivers, four different tempos, four different
roles for the phone. Whatever wins, we'll know *why* — which is the entire
point of testing before doubling down.

---

## Capability check — everything above is buildable with what we have

Confirmed available:
- real app UI capture, stills and smooth scrolling video (Playwright)
- 3D phone with live video on screen, animated camera (Remotion + our GLB)
- kinetic text, springs, staggered reveals, transitions (Remotion)
- animated gradient backgrounds, vignettes, blur (Remotion/CSS)
- number counters, timers, data animation (trivial in Remotion)
- Instagram safe areas as one shared constant

Deliberately NOT proposed, because we can't produce it reliably:
- talking heads, real hands, real faces
- real travel footage of actual places (Higgsfield only, and credits are thin)
- voiceover or audio-synced editing (audio is added at upload)

Higgsfield is optional b-roll for T2 and T4 hooks only. Every template must
work with **zero** Higgsfield credits — treat AI footage as garnish, never as a
dependency.

---

## What Claude Code should build

1. Five compositions, one per template, each with its own zod schema.
2. Shared components where behaviour is identical (logo, safe areas, text
   hierarchy) — templates must never drift from the brand.
3. Every varying element as a prop: all copy, numbers, names, destinations,
   timings, colours-within-brand. Making reel #12 from a template must mean
   editing props, never editing the composition.
4. Reusable pieces the templates share: `NumberCounter`, `BlurReveal`,
   `Timer`, `ScreenSwapper` (fast cuts between captures), `KineticList`.
5. Keep the text hierarchy identical across all five: one hook style, one
   supporting style, one caption style.
6. Fix the existing overlap problem while doing it — text must never sit on
   top of the phone.

Definition of done for each template: **produce three visibly different reels
from it by changing only props.** If that needs a code change, the template
isn't finished.
