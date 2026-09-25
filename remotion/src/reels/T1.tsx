/**
 * REELS BUILT FROM T1 — THE RECEIPT.
 *
 * One <Composition> per reel; only props differ.
 *
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). Every figure below is the
 * demo trip in configs/fixtures/cost_split_demo.json — the same data the app
 * renders in app/cost_split.mp4 (rule 9).
 *
 * THE ROWS MUST ADD UP TO THE TOTAL. The template reads as "here is the
 * total, here is who covered it", so a viewer sums the rows against the
 * figure above them. They are what each of the nine paid, and together they
 * are exactly the €9,584.85 the seventeen expenses come to.
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T1Receipt, t1ReceiptSchema, t1ReceiptDuration } from "../compositions/T1Receipt";

export const T1Reels: React.FC = () => (
  <>
    {/* COST SPLIT — the receipt. A specific, un-round total, then who paid
        it — one person carrying half — then the app with the split done. */}
    <Composition
      id="T1-Receipt-CostSplit"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/cost_split.mp4",
        currency: "€",
        total: 9584.85,
        totalDecimals: 2,
        thousandsSeparator: ",",
        stakeLine: "Nine friends. Seven nights. Seventeen receipts.",
        // 4788.00 + 1218.50 + 1143.20 + 742.60 + 427.80 + 360.00 + 350.40
        // + 329.35 + 225.00 = 9584.85
        rows: [
          { name: "Ana", amount: 4788.0, flagged: true },
          { name: "Marcus", amount: 1218.5, flagged: false },
          { name: "Sam", amount: 1143.2, flagged: false },
          { name: "Leo", amount: 742.6, flagged: false },
          { name: "Ravi", amount: 427.8, flagged: false },
          { name: "Mia", amount: 360.0, flagged: false },
          { name: "Ines", amount: 350.4, flagged: false },
          { name: "Jo", amount: 329.35, flagged: false },
          { name: "Ella", amount: 225.0, flagged: false },
        ],
        rowNote: "Ana booked the villa. Ana is still waiting.",
        caption: "Already worked out. Nobody had to ask.",
        launchLine: "First 50 get lifetime access — free.",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.14,
        bottomBandFrac: 0.16,
        bandGutter: 44,
        phoneFill: 0.95,

        bgIntensity: 0.7,
        bgSpeed: 0.6,
        bgBlur: 160,
        bgVignette: 0.8,

        totalFontSize: 136,
        runningTotalFontSize: 60,
        stakeFontSize: 36,
        rowFontSize: 44,
        rowGap: 12,
        rowStagger: 5,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 12,
        dollyIn: 0.45,
        videoStartFrom: 0,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        totalSeconds: 2.4,
        rowsSeconds: 4.4,
        phoneSeconds: 4.2,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.4, 4.4, 4.2, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* PACKING LIST — the receipt, for stuff. The figure is the shared list's
        16 items once the demo has added the speaker; the rows are who has
        what assigned, and they add up to it: 2+2+2+2+2+1+1 plus the 4 nobody
        claimed (Cooler bag, Olive oil, Dish soap, Phone chargers) = 16 —
        configs/fixtures/packing_list_demo.json. The phone plays the first
        4.2 s of app/packing_list_demo.mp4: the two ticks. */}
    <Composition
      id="T1-Receipt-PackingList"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/packing_list_demo.mp4",
        currency: "",
        total: 16,
        totalDecimals: 0,
        thousandsSeparator: ",",
        stakeLine: "16 items. 9 people. One list.",
        // 2 + 2 + 2 + 2 + 2 + 1 + 1 + 4 = 16
        rows: [
          { name: "Ines", amount: 2, flagged: false },
          { name: "Jo", amount: 2, flagged: false },
          { name: "Marcus", amount: 2, flagged: false },
          { name: "Mia", amount: 2, flagged: false },
          { name: "Sam", amount: 2, flagged: false },
          { name: "Ella", amount: 1, flagged: false },
          { name: "Ravi", amount: 1, flagged: false },
          { name: "Nobody", amount: 4, flagged: true },
        ],
        rowNote: "Four unclaimed. Including the chargers.",
        caption: "Two ticks. The whole group sees them.",
        launchLine: "First 50 get lifetime access — free.",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.14,
        bottomBandFrac: 0.16,
        bandGutter: 44,
        phoneFill: 0.95,

        bgIntensity: 0.8,
        bgSpeed: 0.7,
        bgBlur: 150,
        bgVignette: 0.78,

        totalFontSize: 180,
        runningTotalFontSize: 60,
        stakeFontSize: 36,
        rowFontSize: 44,
        rowGap: 12,
        rowStagger: 5,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 12,
        dollyIn: 0.45,
        videoStartFrom: 0,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        totalSeconds: 2.4,
        rowsSeconds: 4.4,
        phoneSeconds: 4.2,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.4, 4.4, 4.2, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* HIDDEN SIDEQUEST — the receipt for a secret. The figure is the one
        plan; the rows are who knows it, and they add up to it: Leo 1, the
        other eight 0 — he made the trip's only hidden SideQuest
        (configs/fixtures/hidden_sidequest_demo.json + the journey). The
        phone plays app/hidden_sidequest_demo.mp4 from 14.0 s (frame 420):
        the teaser, the save, and from ~16.4 s the sealed card reading
        "Reveals in 2d 5h 56m" — the rowNote rounds it down, never up. */}
    <Composition
      id="T1-Receipt-HiddenSideQuest"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/hidden_sidequest_demo.mp4",
        currency: "",
        total: 1,
        totalDecimals: 0,
        thousandsSeparator: ",",
        stakeLine: "One secret plan.",
        // 1 + 8 × 0 = 1
        rows: [
          { name: "Leo", amount: 1, flagged: true },
          { name: "Ana", amount: 0, flagged: false },
          { name: "Jo", amount: 0, flagged: false },
          { name: "Sam", amount: 0, flagged: false },
          { name: "Marcus", amount: 0, flagged: false },
          { name: "Ines", amount: 0, flagged: false },
          { name: "Mia", amount: 0, flagged: false },
          { name: "Ravi", amount: 0, flagged: false },
          { name: "Ella", amount: 0, flagged: false },
        ],
        rowNote: "Reveals in 2 days, 5 hours.",
        caption: "The other eight get a countdown.",
        launchLine: "First 50 get lifetime access — free.",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.14,
        bottomBandFrac: 0.16,
        bandGutter: 44,
        phoneFill: 0.95,

        bgIntensity: 0.7,
        bgSpeed: 0.6,
        bgBlur: 160,
        bgVignette: 0.82,

        totalFontSize: 220,
        runningTotalFontSize: 60,
        stakeFontSize: 36,
        rowFontSize: 44,
        rowGap: 12,
        rowStagger: 5,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 12,
        dollyIn: 0.45,
        videoStartFrom: 420,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        totalSeconds: 2.4,
        rowsSeconds: 4.6,
        phoneSeconds: 6.0,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.4, 4.6, 6.0, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />
    {/* ITINERARY — the receipt for a week of plans. The figure is the 9
        activities the trip holds once the journey has added the Beach Club;
        the rows are the days they fall on, and they add up to it: 4 + 2 + 1
        + 1 + 1 = 9 (configs/fixtures/itinerary_demo.json plus the
        itinerary_demo journey). Day 1 is the flagged row — it is the day
        that was filed in the wrong order. The phone plays
        app/itinerary_demo.mp4 from 2.0 s (frame 60) for 4.2 s, which is the
        whole argument in one beat: day 1 filed out of order, the carry from
        ~4.2 s, the drop at ~4.9 s, and the list chronological from 5.19 s —
        ending at 6.2 s, just as the Add activity form would open. Starting
        here also lets the phone's entrance spring settle (~1.3 s) before the
        drag begins. */}
    <Composition
      id="T1-Receipt-Itinerary"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/itinerary_demo.mp4",
        currency: "",
        total: 9,
        totalDecimals: 0,
        thousandsSeparator: ",",
        stakeLine: "Group chat chaos.",
        // 4 + 2 + 1 + 1 + 1 = 9
        rows: [
          { name: "Day 1", amount: 4, flagged: true },
          { name: "Day 2", amount: 2, flagged: false },
          { name: "Day 3", amount: 1, flagged: false },
          { name: "Day 4", amount: 1, flagged: false },
          { name: "Day 7", amount: 1, flagged: false },
        ],
        rowNote: "Day 1 had four plans and no order.",
        caption: "Sorted in 15 seconds.",
        launchLine: "Plan together. Travel better.",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.14,
        bottomBandFrac: 0.16,
        bandGutter: 44,
        phoneFill: 0.95,

        bgIntensity: 0.75,
        bgSpeed: 0.65,
        bgBlur: 155,
        bgVignette: 0.8,

        totalFontSize: 220,
        runningTotalFontSize: 60,
        stakeFontSize: 36,
        rowFontSize: 44,
        rowGap: 12,
        rowStagger: 5,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 12,
        dollyIn: 0.45,
        videoStartFrom: 60,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        totalSeconds: 2.4,
        rowsSeconds: 4.4,
        phoneSeconds: 4.2,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.4, 4.4, 4.2, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />
  </>
);
