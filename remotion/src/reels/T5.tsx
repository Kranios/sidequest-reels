/**
 * REELS BUILT FROM T5 — THE ATLAS.
 *
 * One <Composition> per reel; only props differ. defaultProps stays an inline
 * literal so Studio's Save can write back (CLAUDE.md).
 *
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). The Atlas temperature —
 * slowest drift, near-black frame, two numbers, no sell — applied to a trip
 * that is fully settled. The stats are the demo trip's total and the
 * spreadsheets it took (configs/fixtures/cost_split_demo.json, rule 9).
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T5Atlas, t5AtlasSchema, t5AtlasDuration } from "../compositions/T5Atlas";

export const T5Reels: React.FC = () => (
  <>
    {/* COST SPLIT — the closed book. Quiet hook, two figures, the expense
        list drifting past, wordmark only. */}
    <Composition
      id="T5-Atlas-CostSplit"
      component={T5Atlas}
      schema={t5AtlasSchema}
      defaultProps={{
        appVideo: "app/cost_split.mp4",

        hookLine1: "Seven nights in Mallorca.",
        hookLine2: "The maths already done.",
        hookSubtext: "",
        caption: "The trip, closed out.",

        showStats: true,
        statAValue: 9584.85,
        statADecimals: 2,
        statASuffix: "",
        statALabel: "euros spent",
        statBValue: 0,
        statBDecimals: 0,
        statBSuffix: "",
        statBLabel: "spreadsheets opened",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.2,
        bottomBandFrac: 0.12,
        bandGutter: 28,
        phoneFill: 1,

        bgIntensity: 0.25,
        bgSpeed: 0.15,
        bgBlur: 210,
        bgVignette: 0.9,

        hookFontSize: 64,
        statFontSize: 76,
        statLabelFontSize: 22,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 5,
        dollyIn: 0.25,
        videoStartFrom: 0,

        ctaVariant: "quiet",
        ctaLogoSize: 112,
        launchLine: "",

        introSeconds: 2.4,
        globeSeconds: 7.0,
        ctaSeconds: 2.6,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t5AtlasDuration(2.4, 7.0, 2.6, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t5AtlasDuration(
          props.introSeconds,
          props.globeSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* PACKING LIST — the slow version of the same list. globeSeconds 12.5
        lets app/packing_list_demo.mp4 reach its end state (8/16, the speaker
        with Mia). The two stats are ones that hold the whole way through —
        9 people, 1 shared list — because the counts on screen move from 6/15
        to 8/16 while it plays (configs/fixtures/packing_list_demo.json). */}
    <Composition
      id="T5-Atlas-PackingList"
      component={T5Atlas}
      schema={t5AtlasSchema}
      defaultProps={{
        appVideo: "app/packing_list_demo.mp4",

        hookLine1: "Seven nights. Nine bags.",
        hookLine2: "Packed as a group.",
        hookSubtext: "",
        caption: "Packed before the group chat woke up.",

        showStats: true,
        statAValue: 9,
        statADecimals: 0,
        statASuffix: "",
        statALabel: "people",
        statBValue: 1,
        statBDecimals: 0,
        statBSuffix: "",
        statBLabel: "shared list",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.2,
        bottomBandFrac: 0.12,
        bandGutter: 28,
        phoneFill: 1,

        bgIntensity: 0.3,
        bgSpeed: 0.15,
        bgBlur: 210,
        bgVignette: 0.9,

        hookFontSize: 64,
        statFontSize: 76,
        statLabelFontSize: 22,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 5,
        dollyIn: 0.25,
        videoStartFrom: 0,

        ctaVariant: "quiet",
        ctaLogoSize: 112,
        launchLine: "",

        introSeconds: 2.4,
        globeSeconds: 12.5,
        ctaSeconds: 2.6,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t5AtlasDuration(2.4, 12.5, 2.6, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t5AtlasDuration(
          props.introSeconds,
          props.globeSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* HIDDEN SIDEQUEST — day one, with a secret in it. The phone plays
        app/hidden_sidequest_demo.mp4 from 5.0 s (frame 150): the slide into
        Hidden until reveal (5.6–6.2 s), the reveal set to 23:30, the save,
        and the sealed card from ~16.4 s — globeSeconds 14 ends at 19.0 s,
        so it holds ~2.6 s. Stats: 8 of the nine members don't know (Leo
        made it), and the teaser is the one clue they get
        (configs/fixtures/hidden_sidequest_demo.json + the journey). */}
    <Composition
      id="T5-Atlas-HiddenSideQuest"
      component={T5Atlas}
      schema={t5AtlasSchema}
      defaultProps={{
        appVideo: "app/hidden_sidequest_demo.mp4",

        hookLine1: "Mallorca Day 1.",
        hookLine2: "Midnight cliff jump locked.",
        hookSubtext: "",
        caption: "The group sees a lock and a countdown.",

        showStats: true,
        statAValue: 8,
        statADecimals: 0,
        statASuffix: "",
        statALabel: "friends in the dark",
        statBValue: 1,
        statBDecimals: 0,
        statBSuffix: "",
        statBLabel: "clue given",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.2,
        bottomBandFrac: 0.12,
        bandGutter: 28,
        phoneFill: 1,

        bgIntensity: 0.25,
        bgSpeed: 0.15,
        bgBlur: 210,
        bgVignette: 0.92,

        hookFontSize: 64,
        statFontSize: 76,
        statLabelFontSize: 22,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 5,
        dollyIn: 0.25,
        videoStartFrom: 150,

        ctaVariant: "quiet",
        ctaLogoSize: 112,
        launchLine: "",

        introSeconds: 2.4,
        globeSeconds: 14.0,
        ctaSeconds: 2.6,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t5AtlasDuration(2.4, 14.0, 2.6, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t5AtlasDuration(
          props.introSeconds,
          props.globeSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />
  </>
);
