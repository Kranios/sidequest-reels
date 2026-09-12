/**
 * REELS BUILT FROM T2 — THE REVEAL.
 *
 * Three secrets: a friend's three-week plan, a surprise that unlocked on the
 * morning, and a group chat that is hiding something. What changes is who is
 * keeping the secret, how long the blur holds, and whether there is a clock.
 *
 * CAPTURE NEEDED: all three point at app/travel_tracker.mp4 as a placeholder.
 * The real one is the HIDDEN SIDEQUEST screen — the blurred activity card.
 * Record it, drop it in public/app/, change `appVideo`.
 *
 * Note the sign-off: quiet on all three. That is the template's whole point.
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T2Reveal, t2RevealSchema, t2RevealDuration } from "../compositions/T2Reveal";

export const T2Reels: React.FC = () => (
  <>
    {/* 1. THREE WEEKS — the long hold. A clock runs the whole way down. */}
    <Composition
      id="T2-Reveal-ThreeWeeks"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",
        hookLine1: "My friend hid this",
        hookLine2: "from us for three weeks.",
        lockLabel: "Hidden by Ana",
        caption: "One hidden sidequest per trip.",
        revealedLabel: "unlocked",
        launchLine: "",

        showCountdown: true,
        countdownFrom: 180,
        countdownLabel: "unlocks in",
        countdownFormat: "mm:ss",

        revealAtSeconds: 6.0,
        revealFrames: 16,
        maxBlur: 30,
        revealDim: 0.4,
        showLock: true,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.14,
        bottomBandFrac: 0.24,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 0.4,
        bgSpeed: 0.25,
        bgBlur: 190,
        bgVignette: 0.86,

        hookFontSize: 60,
        captionFontSize: 42,
        timerFontSize: 54,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 5,
        dollyIn: 0.25,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        mainSeconds: 9.0,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(9.0, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />

    {/* 2. THE MORNING — heavier blur, a bare seconds clock, a later reveal.
           The most patient of the three. */}
    <Composition
      id="T2-Reveal-Morning"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",
        hookLine1: "She didn't know",
        hookLine2: "until the morning it unlocked.",
        lockLabel: "",
        caption: "Plan it. Hide it. Let it land.",
        revealedLabel: "",
        launchLine: "",

        showCountdown: true,
        countdownFrom: 9,
        countdownLabel: "",
        countdownFormat: "s",

        revealAtSeconds: 7.4,
        revealFrames: 24,
        maxBlur: 46,
        revealDim: 0.55,
        showLock: true,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.12,
        bottomBandFrac: 0.22,
        bandGutter: 28,
        phoneFill: 0.98,

        bgIntensity: 0.22,
        bgSpeed: 0.15,
        bgBlur: 210,
        bgVignette: 0.92,

        hookFontSize: 56,
        captionFontSize: 40,
        timerFontSize: 80,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 3,
        dollyIn: 0.15,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        mainSeconds: 10.0,
        ctaSeconds: 2.6,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(10.0, 2.6, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />

    {/* 3. THE GROUP CHAT — no clock, no lock label, warmer frame and a snappy
           reveal. Proves the template works without the countdown. */}
    <Composition
      id="T2-Reveal-GroupChat"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",
        hookLine1: "POV: the group chat has a secret",
        hookLine2: "and it isn't about you.",
        lockLabel: "",
        caption: "Somebody planned this behind your back.",
        revealedLabel: "surprise",
        launchLine: "",

        showCountdown: false,
        countdownFrom: 30,
        countdownLabel: "unlocks in",
        countdownFormat: "s",

        revealAtSeconds: 4.6,
        revealFrames: 9,
        maxBlur: 34,
        revealDim: 0.3,
        showLock: true,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.1,
        bottomBandFrac: 0.26,
        bandGutter: 28,
        phoneFill: 0.92,

        bgIntensity: 1,
        bgSpeed: 0.7,
        bgBlur: 150,
        bgVignette: 0.68,

        hookFontSize: 52,
        captionFontSize: 40,
        timerFontSize: 54,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 9,
        dollyIn: 0.4,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 104,

        mainSeconds: 7.4,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(7.4, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />
  </>
);
