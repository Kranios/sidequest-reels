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
 * COST SPLIT A/B TEST (see strategy/hook_vault.md). No phone and no capture:
 * only the copy changes. €3,725.62 is what the demo trip still owes Ana
 * (configs/fixtures/cost_split_demo.json).
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T4Callout, t4CalloutSchema, t4CalloutDuration } from "../compositions/T4Callout";

export const T4Reels: React.FC = () => (
  <>
    {/* COST SPLIT — the treasurer nobody elected. Punchy rant, accent on the
        figure that stings, a punchline that asks for the tag. */}
    <Composition
      id="T4-Callout-CostSplit"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "Every trip has a treasurer.",
        hookLine2: "Nobody elected them.",
        hookSubtext: "",
        lines: [
          { text: "Paid for the villa.", accent: false },
          { text: "Covered the wine tasting.", accent: false },
          { text: "Kept every receipt.", accent: false },
          { text: "Still owed €3,725.62.", accent: true },
        ],
        punchline: "Tag the one still waiting.",
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

        hookFontSize: 66,
        lineFontSize: 72,
        punchFontSize: 76,
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
      durationInFrames={294}
      calculateMetadata={({ props }) => ({
        durationInFrames: t4CalloutDuration(props, CANVAS.fps),
      })}
    />
  </>
);
