/**
 * REELS BUILT FROM T3 — THE SPEEDRUN.
 *
 * Three runs of different length and shape: a whole trip, a six-person plan,
 * and a twenty-second packing sprint. The run IS the `steps` array — add a
 * step and both the reel and the clock grow.
 *
 * CAPTURES NEEDED: every step currently points at app/travel_tracker.mp4 as a
 * placeholder, so the cuts and the timing are real but the screens repeat.
 * Record one capture per step and swap the `video` fields:
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
    {/* 1. FIVE-DAY TRIP — four steps, whip cuts, a stopwatch in tenths. */}
    <Composition
      id="T3-Speedrun-FiveDay"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        hookLine1: "A 5-day trip",
        hookLine2: "in 30 seconds.",
        hookSubtext: "No group chat required.",
        steps: [
          { video: "app/travel_tracker.mp4", label: "Create the trip", holdSeconds: 1.6 },
          { video: "app/travel_tracker.mp4", label: "Add the activities", holdSeconds: 1.6 },
          { video: "app/travel_tracker.mp4", label: "Invite everyone", holdSeconds: 1.5 },
          { video: "app/travel_tracker.mp4", label: "Split the costs", holdSeconds: 1.8 },
        ],
        caption: "Saved you an evening.",
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

        hookFontSize: 88,
        stepFontSize: 46,
        timerFontSize: 48,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 10,
        dollyIn: 0.3,
        videoStartFrom: 10,

        ctaVariant: "urgent",
        ctaLogoSize: 104,

        hookSeconds: 1.4,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={330}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />

    {/* 2. SIX PEOPLE — a longer run, five steps, slide cuts and a mm:ss clock
           that reads like a real planning session compressed. */}
    <Composition
      id="T3-Speedrun-SixPeople"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        hookLine1: "Planning a trip",
        hookLine2: "with six people.",
        hookSubtext: "Start to finish.",
        steps: [
          { video: "app/travel_tracker.mp4", label: "One shared trip", holdSeconds: 1.4 },
          { video: "app/travel_tracker.mp4", label: "Everyone adds ideas", holdSeconds: 1.4 },
          { video: "app/travel_tracker.mp4", label: "Vote on the plan", holdSeconds: 1.3 },
          { video: "app/travel_tracker.mp4", label: "Lock the dates", holdSeconds: 1.3 },
          { video: "app/travel_tracker.mp4", label: "Costs split themselves", holdSeconds: 1.7 },
        ],
        caption: "Six people. One source of truth.",
        launchLine: "First 50 get lifetime access — free.",

        showTimer: true,
        timerLabel: "planning time",
        timerFormat: "mm:ss",
        timerRate: 26,
        timerAlign: "center",

        transition: "slide",
        transitionFrames: 9,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.17,
        bottomBandFrac: 0.15,
        bandGutter: 28,
        phoneFill: 0.92,

        bgIntensity: 0.8,
        bgSpeed: 1.3,
        bgBlur: 160,
        bgVignette: 0.76,

        hookFontSize: 80,
        stepFontSize: 44,
        timerFontSize: 54,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 14,
        dollyIn: 0.45,
        videoStartFrom: 10,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        hookSeconds: 1.6,
        ctaSeconds: 2.6,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={330}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />

    {/* 3. PACKING SPRINT — the short one. Three steps, punch cuts, whole
           seconds on the clock, and the phone nearly fills the stage. */}
    <Composition
      id="T3-Speedrun-Packing"
      component={T3Speedrun}
      schema={t3SpeedrunSchema}
      defaultProps={{
        hookLine1: "Packing, documents,",
        hookLine2: "weather.",
        hookSubtext: "Twenty seconds.",
        steps: [
          { video: "app/travel_tracker.mp4", label: "Packing list", holdSeconds: 1.5 },
          { video: "app/travel_tracker.mp4", label: "Documents in one place", holdSeconds: 1.5 },
          { video: "app/travel_tracker.mp4", label: "Weather for the week", holdSeconds: 1.6 },
        ],
        caption: "Everything before you leave.",
        launchLine: "",

        showTimer: true,
        timerLabel: "",
        timerFormat: "s",
        timerRate: 1,
        timerAlign: "start",

        transition: "punch",
        transitionFrames: 6,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.11,
        bottomBandFrac: 0.15,
        bandGutter: 24,
        phoneFill: 1,

        bgIntensity: 0.5,
        bgSpeed: 0.9,
        bgBlur: 180,
        bgVignette: 0.84,

        hookFontSize: 92,
        stepFontSize: 44,
        timerFontSize: 62,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 8,
        dollyIn: 0.25,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        hookSeconds: 1.2,
        ctaSeconds: 2.2,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={330}
      calculateMetadata={({ props }) => ({
        durationInFrames: t3SpeedrunDuration(props, CANVAS.fps),
      })}
    />
  </>
);
