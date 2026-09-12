/**
 * REELS BUILT FROM T4 — THE CALLOUT.
 *
 * One <Composition> per reel. The component and the schema are shared; only
 * the props differ. Making reel #12 means copying a block below and rewriting
 * the strings — never touching T4Callout.tsx.
 *
 * defaultProps MUST stay an inline object literal (see CLAUDE.md): Studio's
 * Save button writes slider tweaks back into this file and can only do that
 * for a literal. That is also why the four safe numbers are spelled out here
 * rather than read from SAFE_INSETS — re-sync them by hand if the constant
 * changes.
 *
 * The three below are deliberately different animals: a rant, a numbered list
 * and a slow burn. Same template.
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T4Callout, t4CalloutSchema, t4CalloutDuration } from "../compositions/T4Callout";

export const T4Reels: React.FC = () => (
  <>
    {/* ---------------------------------------------------------------- *
     * 1. THE PLANNER — the rant. One villain, building to a punchline.
     *    Loud background, accent on the line that stings.
     * ---------------------------------------------------------------- */}
    <Composition
      id="T4-Callout-Planner"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "Every group has",
        hookLine2: "that one person",
        hookSubtext: "You already know who.",
        lines: [
          { text: "Plans nothing.", accent: false },
          { text: "Books nothing.", accent: false },
          { text: "Pays late.", accent: false },
          { text: "Complains first.", accent: true },
        ],
        punchline: "Send this to them.",
        kicker: "",
        launchLine: "First 50 get lifetime access — free.",

        showCounter: false,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.2,
        bottomBandFrac: 0.18,
        bandGutter: 28,

        bgIntensity: 1.2,
        bgSpeed: 1.1,
        bgBlur: 130,
        bgVignette: 0.62,
        bgPulse: true,

        hookFontSize: 86,
        lineFontSize: 96,
        punchFontSize: 84,
        kickerFontSize: 40,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        hookSeconds: 1.8,
        lineSeconds: 1.0,
        punchSeconds: 1.6,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={330}
      calculateMetadata={({ props }) => ({
        durationInFrames: t4CalloutDuration(props, CANVAS.fps),
      })}
    />

    {/* ---------------------------------------------------------------- *
     * 2. FIVE PEOPLE — the numbered list. Counter on, faster, a kicker
     *    that asks for the comment. Quiet sign-off: the list is the point.
     * ---------------------------------------------------------------- */}
    <Composition
      id="T4-Callout-FivePeople"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "The five people",
        hookLine2: "on every group trip",
        hookSubtext: "Which one are you?",
        lines: [
          { text: "The spreadsheet one", accent: false },
          { text: "The ghost", accent: false },
          { text: "The yes-to-everything one", accent: false },
          { text: "The one who is always cold", accent: false },
          { text: "The one still owing you money", accent: true },
        ],
        punchline: "",
        kicker: "Tag all five.",
        launchLine: "",

        showCounter: true,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.28,
        bottomBandFrac: 0.22,
        bandGutter: 28,

        bgIntensity: 0.95,
        bgSpeed: 1.6,
        bgBlur: 160,
        bgVignette: 0.5,
        bgPulse: true,

        hookFontSize: 78,
        lineFontSize: 72,
        punchFontSize: 84,
        kickerFontSize: 44,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        hookSeconds: 1.6,
        lineSeconds: 0.9,
        punchSeconds: 0,
        ctaSeconds: 2.2,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={330}
      calculateMetadata={({ props }) => ({
        durationInFrames: t4CalloutDuration(props, CANVAS.fps),
      })}
    />

    {/* ---------------------------------------------------------------- *
     * 3. FRIENDSHIPS — the slow burn. Dark, near-still background, long
     *    holds, urgent sign-off. Same component, opposite temperature.
     * ---------------------------------------------------------------- */}
    <Composition
      id="T4-Callout-Friendships"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "Things that end",
        hookLine2: "friendships",
        hookSubtext: "Number three is shared holidays.",
        lines: [
          { text: "Money", accent: false },
          { text: "Weddings", accent: false },
          { text: "Group trips", accent: true },
        ],
        punchline: "One of these is fixable.",
        kicker: "",
        launchLine: "First 50 get lifetime access — free.",

        showCounter: false,

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.28,
        bottomBandFrac: 0.24,
        bandGutter: 40,

        bgIntensity: 0.5,
        bgSpeed: 0.25,
        bgBlur: 200,
        bgVignette: 0.9,
        bgPulse: false,

        hookFontSize: 96,
        lineFontSize: 124,
        punchFontSize: 72,
        kickerFontSize: 40,

        ctaVariant: "urgent",
        ctaLogoSize: 104,

        hookSeconds: 2.2,
        lineSeconds: 1.4,
        punchSeconds: 2.0,
        ctaSeconds: 2.8,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={330}
      calculateMetadata={({ props }) => ({
        durationInFrames: t4CalloutDuration(props, CANVAS.fps),
      })}
    />
  </>
);
