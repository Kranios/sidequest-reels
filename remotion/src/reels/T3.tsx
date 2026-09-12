/**
 * REELS BUILT FROM T3 — THE SPEEDRUN.
 *
 * One <Composition> per reel; only props differ. The run is ONE continuous
 * capture of a scripted user journey — record a new one with
 * `record_video.py <route> <name> --scenario <scenario>` (CLAUDE.md, "User
 * journeys") and point `appVideo` at it.
 *
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). The capture is
 * app/cost_split_demo.mp4 (19.76 s): Leo logs a €850 farewell dinner and
 * splits it nine ways; the saved row is on screen from ~14.5 s. videoSeconds
 * 17.0 plays the whole journey plus 2.5 s of the result and drops only the
 * idle hold at the end — so the reel is 19.4 s, under qa.py's 20 s cap.
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

        hookSeconds: 2.4,
        videoSeconds: 17.0,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t3SpeedrunDuration({ videoSeconds: 17.0, ctaSeconds: 2.4 }, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />
  </>
);
