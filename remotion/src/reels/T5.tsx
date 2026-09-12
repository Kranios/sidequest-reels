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
  </>
);
