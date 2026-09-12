/**
 * REELS BUILT FROM T3 — THE SPEEDRUN.
 *
 * One <Composition> per reel; only props differ. The run is ONE continuous
 * capture of a scripted user journey — record a new one with
 * `record_video.py <route> <name> --scenario <scenario>` (CLAUDE.md, "User
 * journeys") and point `appVideo` at it.
 *
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). The capture is
 * app/cost_split_demo.mp4 (16.6 s): Leo logs a €850 farewell dinner, swipes
 * the form up to the save button, and splits it nine ways; the saved row is
 * on screen from ~12.0 s. videoSeconds 14.5 plays the whole journey plus
 * 2.5 s of the result and drops only the idle hold at the end — so the reel
 * is 16.9 s (qa.py caps a reel at 20 s). Re-record the journey and these
 * times move: re-check where the result lands before trusting videoSeconds.
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T3Speedrun, t3SpeedrunSchema, t3SpeedrunDuration } from "../compositions/T3Speedrun";

export const T3Reels: React.FC = () => (
  <>
    {/* COST SPLIT — one expense, logged and split against the clock, in a
        single take. Urgent sign-off. */}
    <Composition
      id="T3-Speedrun-CostSplit"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        appVideo: "app/cost_split_demo.mp4",
        hookLine1: "Nine people.",
        hookLine2: "One stopwatch.",
        hookSubtext: "€9,584.85 to split.",
        runCaption: "€850 dinner, split nine ways.",
        caption: "Saved: one argument at the airport.",
        launchLine: "First 50 get lifetime access — free.",

        showTimer: true,
        timerLabel: "elapsed",
        timerFormat: "s.t",
        timerRate: 1,
        timerAlign: "end",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.18,
        bottomBandFrac: 0.14,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 1.15,
        bgSpeed: 1.8,
        bgBlur: 140,
        bgVignette: 0.72,

        hookFontSize: 64,
        runCaptionFontSize: 42,
        timerFontSize: 48,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 10,
        dollyIn: 0.3,
        videoStartFrom: 0,

        ctaVariant: "urgent",
        ctaLogoSize: 104,

        hookSeconds: 2.0,
        videoSeconds: 14.5,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t3SpeedrunDuration({ videoSeconds: 14.5, ctaSeconds: 2.4 }, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />

    {/* PACKING LIST — tick, add, assign against the clock. The capture is
        app/packing_list_demo.mp4 (15.3 s); Mia's avatar lands on the new row
        and the header reads 8/16 from ~12.0 s, so videoSeconds 14.5 shows
        the result for ~2.5 s without a frozen tail. 16.9 s in all. */}
    <Composition
      id="T3-Speedrun-PackingList"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        appVideo: "app/packing_list_demo.mp4",
        hookLine1: "How we stop",
        hookLine2: "double-packing.",
        hookSubtext: "Shared packing list.",
        runCaption: "Two ticked. One added. One handed to Mia.",
        caption: "Nobody brings two umbrellas again.",
        launchLine: "First 50 get lifetime access — free.",

        showTimer: true,
        timerLabel: "elapsed",
        timerFormat: "s.t",
        timerRate: 1,
        timerAlign: "end",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.18,
        bottomBandFrac: 0.14,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 1.1,
        bgSpeed: 1.7,
        bgBlur: 140,
        bgVignette: 0.72,

        hookFontSize: 64,
        runCaptionFontSize: 40,
        timerFontSize: 48,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 10,
        dollyIn: 0.3,
        videoStartFrom: 0,

        ctaVariant: "urgent",
        ctaLogoSize: 104,

        hookSeconds: 2.0,
        videoSeconds: 14.5,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t3SpeedrunDuration({ videoSeconds: 14.5, ctaSeconds: 2.4 }, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />

    {/* HIDDEN SIDEQUEST — plant a secret against the clock. The capture is
        app/hidden_sidequest_demo.mp4 (20.2 s): Leo names it, slides it
        hidden, sets the reveal to 23:30, leaves the teaser, saves, and the
        trip feed shows it sealed from ~16.4 s. videoSeconds 19.5 holds the
        sealed card for ~3.1 s. That makes the reel 21.9 s — over qa.py's
        20 s cap, set so on request; videoSeconds 17.6 is the 20.0 s version
        (~1.2 s of the card). */}
    <Composition
      id="T3-Speedrun-HiddenSideQuest"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        appVideo: "app/hidden_sidequest_demo.mp4",
        hookLine1: "How to lock",
        hookLine2: "a secret SideQuest.",
        hookSubtext: "Hidden until reveal.",
        runCaption: "Named. Hidden. 23:30. Saved.",
        caption: "Nobody finds out before 23:30.",
        launchLine: "First 50 get lifetime access — free.",

        showTimer: true,
        timerLabel: "elapsed",
        timerFormat: "s.t",
        timerRate: 1,
        timerAlign: "end",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.18,
        bottomBandFrac: 0.14,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 1.05,
        bgSpeed: 1.6,
        bgBlur: 140,
        bgVignette: 0.74,

        hookFontSize: 64,
        runCaptionFontSize: 42,
        timerFontSize: 48,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 10,
        dollyIn: 0.3,
        videoStartFrom: 0,

        ctaVariant: "urgent",
        ctaLogoSize: 104,

        hookSeconds: 2.0,
        videoSeconds: 19.5,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t3SpeedrunDuration({ videoSeconds: 19.5, ctaSeconds: 2.4 }, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />
  </>
);
