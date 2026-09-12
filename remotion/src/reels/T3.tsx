/**
 * REELS BUILT FROM T3 — THE SPEEDRUN.
 *
 * One <Composition> per reel; only props differ. The run IS the `steps` array
 * — add a step and both the reel and the clock grow.
 *
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). Three steps, all on
 * app/cost_split.mp4 for now, so each cut lands on the same screen. Record the
 * trip picker and the add-expense sheet as their own captures and swap the
 * first two `video` fields to make the run read as a real flow:
 *
 *   python capture/record_video.py <route> <name> <seconds> --scroll-to <frac>
 *
 * Routes use hyphens (travel-tracker, not travel_tracker) — see CLAUDE.md.
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T3Speedrun, t3SpeedrunSchema, t3SpeedrunDuration } from "../compositions/T3Speedrun";

export const T3Reels: React.FC = () => (
  <>
    {/* COST SPLIT — nine people against the clock. Whip cuts, a stopwatch in
        tenths, urgent sign-off. */}
    <Composition
      id="T3-Speedrun-CostSplit"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        hookLine1: "Nine people.",
        hookLine2: "One stopwatch.",
        hookSubtext: "€9,584.85 to split.",
        steps: [
          { video: "app/cost_split.mp4", label: "Pick the trip", holdSeconds: 2.0 },
          { video: "app/cost_split.mp4", label: "Log the expense", holdSeconds: 2.0 },
          { video: "app/cost_split.mp4", label: "Settle up", holdSeconds: 2.4 },
        ],
        caption: "Saved: one argument at the airport.",
        launchLine: "First 50 get lifetime access — free.",

        showTimer: true,
        timerLabel: "elapsed",
        timerFormat: "s.t",
        timerRate: 1,
        timerAlign: "end",

        transition: "whip",
        transitionFrames: 7,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.15,
        bottomBandFrac: 0.15,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 1.15,
        bgSpeed: 1.8,
        bgBlur: 140,
        bgVignette: 0.72,

        hookFontSize: 92,
        stepFontSize: 46,
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

        hookSeconds: 1.6,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={312}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />
  </>
);
