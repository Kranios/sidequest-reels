/**
 * REELS BUILT FROM T5 — THE ATLAS.
 *
 * All three use the travel-tracker capture we already have. What changes is
 * the seed the numbers describe, the temperature of the frame and how much of
 * it the phone takes: a stat card, a been-vs-going comparison, and a silent
 * hero shot with no numbers at all.
 *
 * If you record a new globe seed, change appVideo and the two stat values.
 * Nothing else.
 *
 * defaultProps stays an inline literal so Studio's Save can write back
 * (CLAUDE.md).
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T5Atlas, t5AtlasSchema, t5AtlasDuration } from "../compositions/T5Atlas";

export const T5Reels: React.FC = () => (
  <>
    {/* ---------------------------------------------------------------- *
     * 1. FOURTEEN COUNTRIES — the stat card. Two numbers, one of them
     *    deliberately odd (6.9%, not "about 7%").
     * ---------------------------------------------------------------- */}
    <Composition
      id="T5-Atlas-Countries"
      component={T5Atlas}
      schema={t5AtlasSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",

        hookLine1: "14 countries.",
        hookLine2: "6.9% of the world.",
        hookSubtext: "There is a lot left.",
        caption: "Your map, filling in.",

        showStats: true,
        statAValue: 14,
        statADecimals: 0,
        statASuffix: "",
        statALabel: "countries",
        statBValue: 6.9,
        statBDecimals: 1,
        statBSuffix: "%",
        statBLabel: "of the world",

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
        bgSpeed: 0.18,
        bgBlur: 200,
        bgVignette: 0.88,

        hookFontSize: 84,
        statFontSize: 76,
        statLabelFontSize: 24,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 7,
        dollyIn: 0.35,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 112,
        launchLine: "",

        introSeconds: 2.2,
        globeSeconds: 7.0,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t5AtlasDuration(2.2, 7.0, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t5AtlasDuration(
          props.introSeconds,
          props.globeSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* ---------------------------------------------------------------- *
     * 2. BEEN VS GOING — the comparison. Warmer frame, both numbers are
     *    counts, and the copy sets them against each other.
     * ---------------------------------------------------------------- */}
    <Composition
      id="T5-Atlas-BeenVsGoing"
      component={T5Atlas}
      schema={t5AtlasSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",

        hookLine1: "Everywhere I've been.",
        hookLine2: "Everywhere I'm going.",
        hookSubtext: "One map holds both.",
        caption: "Two colours. One map.",

        showStats: true,
        statAValue: 23,
        statADecimals: 0,
        statASuffix: "",
        statALabel: "visited",
        statBValue: 11,
        statBDecimals: 0,
        statBSuffix: "",
        statBLabel: "on the list",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.22,
        bottomBandFrac: 0.12,
        bandGutter: 28,
        phoneFill: 0.98,

        bgIntensity: 0.85,
        bgSpeed: 0.4,
        bgBlur: 180,
        bgVignette: 0.7,

        hookFontSize: 72,
        statFontSize: 88,
        statLabelFontSize: 26,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 12,
        dollyIn: 0.55,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 104,
        launchLine: "",

        introSeconds: 2.0,
        globeSeconds: 6.4,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t5AtlasDuration(2.0, 6.4, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t5AtlasDuration(
          props.introSeconds,
          props.globeSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* ---------------------------------------------------------------- *
     * 3. MANIFESTING 2027 — no numbers at all. The phone nearly fills the
     *    stage, the frame is almost black, the camera barely moves. The
     *    quietest thing we make.
     * ---------------------------------------------------------------- */}
    <Composition
      id="T5-Atlas-Manifesting"
      component={T5Atlas}
      schema={t5AtlasSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",

        hookLine1: "Countries I'm",
        hookLine2: "manifesting for 2027.",
        hookSubtext: "",
        caption: "Save this. Come back in a year.",

        showStats: false,
        statAValue: 0,
        statADecimals: 0,
        statASuffix: "",
        statALabel: "countries",
        statBValue: 0,
        statBDecimals: 0,
        statBSuffix: "",
        statBLabel: "continents",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.06,
        bottomBandFrac: 0.16,
        bandGutter: 28,
        phoneFill: 0.98,

        bgIntensity: 0.12,
        bgSpeed: 0.1,
        bgBlur: 220,
        bgVignette: 0.95,

        hookFontSize: 78,
        statFontSize: 76,
        statLabelFontSize: 24,
        captionFontSize: 38,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 4,
        dollyIn: 0.2,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 120,
        launchLine: "",

        introSeconds: 2.4,
        globeSeconds: 8.5,
        ctaSeconds: 2.6,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t5AtlasDuration(2.4, 8.5, 2.6, CANVAS.fps)}
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
