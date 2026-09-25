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

    {/* PACKING LIST — the group bag, itemised. No phone and no capture;
        these are the group-trip truths everyone recognises, in one
        deadpan parallel list, with the fix as the punchline. */}
    <Composition
      id="T4-Callout-PackingList"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "Three umbrellas.",
        hookLine2: "Zero sunscreen.",
        hookSubtext: "",
        lines: [
          { text: "Four chargers.", accent: false },
          { text: "No adapter.", accent: false },
          { text: "Two speakers.", accent: false },
          { text: "Zero snorkels.", accent: true },
        ],
        punchline: "Put it on the list. With a name.",
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

        bgIntensity: 1.15,
        bgSpeed: 1.2,
        bgBlur: 135,
        bgVignette: 0.64,
        bgPulse: true,

        hookFontSize: 86,
        lineFontSize: 96,
        punchFontSize: 72,
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

    {/* HIDDEN SIDEQUEST — why a surprise dies in the group chat. No phone
        and no capture: the hook is the advice, the lines are what every
        group chat does to a secret, the punchline is where to put it
        instead. Group-trip truths, not fixture figures. */}
    <Composition
      id="T4-Callout-HiddenSideQuest"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "Don't tell the group chat",
        hookLine2: "where you're going.",
        hookSubtext: "",
        lines: [
          { text: "Someone screenshots it.", accent: false },
          { text: "Someone guesses in one.", accent: false },
          { text: "Someone tells their partner.", accent: false },
          { text: "Surprise over by lunch.", accent: true },
        ],
        punchline: "Lock it in SideQuest instead.",
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

        bgIntensity: 1.1,
        bgSpeed: 1.1,
        bgBlur: 135,
        bgVignette: 0.64,
        bgPulse: true,

        hookFontSize: 66,
        lineFontSize: 72,
        // 62, not 72: at 72 "instead." broke onto a line of its own.
        punchFontSize: 62,
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
    {/* ITINERARY — no phone and no capture, only the copy (T4 has no video
        prop at all). The three deadpan lines are day 1 of the demo trip as
        the fixture files it: Mia's beach at 11:00 and Leo's dinner at 20:30,
        with the dinner sitting above the beach because the feed orders a day
        by sortIndex, not by time (configs/fixtures/itinerary_demo.json). The
        accent line is the fix, and the punchline asks for the tag. */}
    <Composition
      id="T4-Callout-Itinerary"
      component={T4Callout}
      schema={t4CalloutSchema}
      defaultProps={{
        hookLine1: "Stop fighting over the itinerary.",
        hookLine2: "Build it together instead.",
        hookSubtext: "",
        lines: [
          { text: "Beach at 11:00, says Mia.", accent: false },
          { text: "Dinner at 20:30, says Leo.", accent: false },
          { text: "Filed in that exact order.", accent: false },
          { text: "Fixed with one drag.", accent: true },
        ],
        punchline: "Tag the schedule police.",
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

        // Sized down from the Cost Split reel's 66/72/76: these lines are
        // longer, and both HookText and the line list wrap rather than clip.
        hookFontSize: 50,
        lineFontSize: 64,
        punchFontSize: 70,
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
