import React from "react";
import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/Raleway";
import { CANVAS } from "./brand";
import {
  GlobeReel,
  globeReelSchema,
  globeReelDuration,
} from "./compositions/GlobeReel";
import {
  ShowcaseReel,
  showcaseReelSchema,
  showcaseReelDuration,
} from "./compositions/ShowcaseReel";
import { T1Reels } from "./reels/T1";
import { T2Reels } from "./reels/T2";
import { T3Reels } from "./reels/T3";
import { T4Reels } from "./reels/T4";
import { T5Reels } from "./reels/T5";

// Raleway Black is the brand face; loading it here guarantees every
// composition renders with it instead of a fallback.
loadFont("normal", { weights: ["900"] });

/**
 * THE TEMPLATES live in src/compositions/T1..T5. THE REELS built from them
 * live in src/reels/T*.tsx — one <Composition> per reel, sharing the
 * template's component and schema. A new reel is a new block there, never a
 * new composition file.
 *
 * The two compositions still declared inline below pre-date the templates.
 * They have been migrated onto the shared band layout and text hierarchy, so
 * they behave like the templates do; new work should start from a template.
 *
 * defaultProps MUST stay an inline object literal on each <Composition>.
 * Remotion Studio's Save button writes your slider tweaks back into the source,
 * and it can only do that for a literal — referencing a constant gives
 * "Can't save default props" in the Props panel.
 *
 * SAFE AREA: safeTop/Bottom/Left/Right below mirror SAFE_INSETS in
 * src/safe-areas.ts, which is still the single source of truth. They're
 * spelled out as numbers only because Save cannot write back through a
 * reference — if you change SAFE_INSETS, re-sync them everywhere.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ---- Reels built from the five templates ---- */}
      <T1Reels />
      <T2Reels />
      <T3Reels />
      <T4Reels />
      <T5Reels />

      {/* ---- Pre-template compositions, migrated to the shared layout ---- */}
      <Composition
        id="GlobeReel"
        component={GlobeReel}
        schema={globeReelSchema}
        defaultProps={{
          appVideo: "app/travel_tracker.mp4",

          hookLine1: "Where you've been.",
          hookLine2: "Where you're going.",
          hookSubtext: "One map. Your whole world.",
          caption: "Watch your world fill in.",
          launchLine: "First 50 get lifetime access — free.",

          showSafeArea: false,
          safeTop: 220,
          safeBottom: 450,
          safeLeft: 65,
          safeRight: 120,

          topBandFrac: 0.1,
          bottomBandFrac: 0.22,
          bandGutter: 28,
          phoneFill: 0.95,

          hookFontSize: 78,
          hookOffsetY: 0,
          captionFontSize: 44,
          ctaVariant: "standard",
          ctaLogoSize: 104,
          ctaOffsetY: 0,

          screenRotDeg: 0,
          screenFlipY: false,
          phoneOffsetY: 0,
          swingDeg: 18,
          videoStartFrom: 10,

          hookSeconds: 2.2,
          phoneSeconds: 4.5,
          ctaSeconds: 2.8,
        }}
        fps={CANVAS.fps}
        width={CANVAS.width}
        height={CANVAS.height}
        durationInFrames={globeReelDuration(2.2, 4.5, 2.8, CANVAS.fps)}
        // Keep the clip length in sync when you drag the timing sliders.
        calculateMetadata={({ props }) => ({
          durationInFrames: globeReelDuration(
            props.hookSeconds,
            props.phoneSeconds,
            props.ctaSeconds,
            CANVAS.fps
          ),
        })}
      />

      {/* ShowcaseReel — "One app. The whole trip." The busy one: animated
          background, feature chips, 3D phone + live scroll, CTA on the moving
          background. The chips/caption overlap is gone: they sit in the top
          and bottom TEXT BANDS and the phone is centred in the stage band
          between them (src/layout.ts), so the band split — not an offset —
          is what keeps them apart. */}
      <Composition
        id="ShowcaseReel"
        component={ShowcaseReel}
        schema={showcaseReelSchema}
        defaultProps={{
          appVideo: "app/travel_tracker.mp4",

          hookLine1: "One app.",
          hookLine2: "The whole trip.",
          hookSubtext: "Stop juggling five of them.",
          chip1: "Shared plans",
          chip2: "Split costs",
          chip3: "Hidden sidequests",
          caption: "Everything in one place.",
          launchLine: "First 50 get lifetime access — free.",

          showSafeArea: false,
          safeTop: 220,
          safeBottom: 450,
          safeLeft: 65,
          safeRight: 120,

          topBandFrac: 0.24,
          bottomBandFrac: 0.14,
          bandGutter: 36,
          phoneFill: 0.98,

          bgIntensity: 1,
          bgSpeed: 1,
          bgBlur: 130,
          bgVignette: 0.78,

          hookFontSize: 82,
          hookOffsetY: 0,

          chipsFontSize: 34,
          chipsOffsetX: 0,
          chipsGap: 20,
          chipsStagger: 7,

          captionFontSize: 44,

          screenRotDeg: 0,
          screenFlipY: false,
          phoneOffsetY: 0,
          swingDeg: 18,
          videoStartFrom: 10,

          ctaVariant: "standard",
          ctaLogoSize: 104,
          ctaOffsetY: 0,

          hookSeconds: 2.0,
          phoneSeconds: 5.5,
          ctaSeconds: 2.6,
        }}
        fps={CANVAS.fps}
        width={CANVAS.width}
        height={CANVAS.height}
        durationInFrames={showcaseReelDuration(2.0, 5.5, 2.6, CANVAS.fps)}
        // Keep the clip length in sync when you drag the timing sliders.
        calculateMetadata={({ props }) => ({
          durationInFrames: showcaseReelDuration(
            props.hookSeconds,
            props.phoneSeconds,
            props.ctaSeconds,
            CANVAS.fps
          ),
        })}
      />
    </>
  );
};
