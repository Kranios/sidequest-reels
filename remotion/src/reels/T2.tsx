/**
 * REELS BUILT FROM T2 — THE REVEAL.
 *
 * One <Composition> per reel; only props differ.
 *
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). The secret here is the
 * bill itself: the expense list sits blurred under the hook, then lifts.
 * Lock and countdown are OFF on purpose — on the cost-split screen they would
 * imply a timed-unlock feature that only the hidden sidequest has, and
 * feature_map.md forbids misrepresenting a feature. The blur is editorial.
 * Figures match configs/fixtures/cost_split_demo.json (rule 9).
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T2Reveal, t2RevealSchema, t2RevealDuration } from "../compositions/T2Reveal";

export const T2Reels: React.FC = () => (
  <>
    {/* COST SPLIT — the bill nobody wanted to open. Slow hold, one reveal,
        quiet sign-off. */}
    <Composition
      id="T2-Reveal-CostSplit"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/cost_split.mp4",
        hookLine1: "What the villa week cost.",
        hookLine2: "Nobody looked.",
        lockLabel: "",
        caption: "€9,584.85, assigned to the cent.",
        revealedLabel: "the receipts",
        launchLine: "",

        showCountdown: false,
        countdownFrom: 30,
        countdownLabel: "",
        countdownFormat: "s",

        revealAtSeconds: 3.0,
        revealFrames: 18,
        maxBlur: 34,
        revealDim: 0.44,
        showLock: false,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.12,
        bottomBandFrac: 0.22,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 0.3,
        bgSpeed: 0.2,
        bgBlur: 200,
        bgVignette: 0.9,

        hookFontSize: 58,
        captionFontSize: 40,
        timerFontSize: 54,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 4,
        dollyIn: 0.2,
        videoStartFrom: 0,

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

    {/* PACKING LIST — the list blurred under the hook, then the group's
        packing in full view. Lock and countdown off: the packing list has no
        timed unlock either. mainSeconds 13.0 runs app/packing_list_demo.mp4
        past the moment Mia gets the speaker (~12.0 s), so the reveal pays
        off. Figures: configs/fixtures/packing_list_demo.json — 16 items, 4
        with no owner. */}
    <Composition
      id="T2-Reveal-PackingList"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/packing_list_demo.mp4",
        hookLine1: "Sixteen things to pack.",
        hookLine2: "Four have no owner.",
        lockLabel: "",
        caption: "Every tick shows up on nine phones.",
        revealedLabel: "the list",
        launchLine: "",

        showCountdown: false,
        countdownFrom: 30,
        countdownLabel: "",
        countdownFormat: "s",

        revealAtSeconds: 3.0,
        revealFrames: 18,
        maxBlur: 34,
        revealDim: 0.44,
        showLock: false,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.12,
        bottomBandFrac: 0.22,
        bandGutter: 28,
        phoneFill: 0.95,

        bgIntensity: 0.35,
        bgSpeed: 0.2,
        bgBlur: 200,
        bgVignette: 0.88,

        hookFontSize: 58,
        captionFontSize: 40,
        timerFontSize: 54,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 4,
        dollyIn: 0.2,
        videoStartFrom: 0,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        mainSeconds: 13.0,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(13.0, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />
  </>
);
