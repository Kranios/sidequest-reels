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
        revealFrames: 8,
        maxBlur: 34,
        teaseBlur: 12,
        revealFlash: 0.35,
        revealPunch: 0.06,
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
        revealFrames: 8,
        maxBlur: 34,
        teaseBlur: 12,
        revealFlash: 0.35,
        revealPunch: 0.06,
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

    {/* HIDDEN SIDEQUEST — the one feature the lock belongs to, so it is ON,
        labelled with the app's own words; the countdown stays off (a timer
        racing to 0 in three seconds would misstate a reveal days away). The
        hook is twelve words and lands word by word by ~2.8 s, so the blur
        waits until 3.8 s: a full second to read it (at 56 px "23:30." fell
        onto a line of its own — 48 keeps it on the second line). The phone
        plays app/hidden_sidequest_demo.mp4 from 6.4 s (frame 192): sharp at
        4.4 s on the reveal schedule still reading 18:00; Leo's finger lands
        and types "23:" by 5.0 s and "23:30" by 5.3 s (checked on rendered
        stills) — the hook's "23:30" pays off on screen. Then the
        teaser "Swimsuits. No questions." (the caption's one clue), the save,
        and the sealed card from reel ~10.0 s. mainSeconds 13.2 ends at take
        19.6 s, inside the 20.2 s capture. */}
    <Composition
      id="T2-Reveal-HiddenSideQuest"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/hidden_sidequest_demo.mp4",
        hookLine1: "They think it's a normal dinner.",
        hookLine2: "Nobody knows what happens at 23:30.",
        lockLabel: "Hidden until reveal",
        caption: "The group gets one clue: swimsuits.",
        revealedLabel: "the plan",
        launchLine: "",

        showCountdown: false,
        countdownFrom: 30,
        countdownLabel: "",
        countdownFormat: "s",

        revealAtSeconds: 3.8,
        revealFrames: 8,
        maxBlur: 34,
        teaseBlur: 12,
        revealFlash: 0.35,
        revealPunch: 0.06,
        revealDim: 0.44,
        showLock: true,

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

        hookFontSize: 48,
        captionFontSize: 40,
        timerFontSize: 54,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 4,
        dollyIn: 0.2,
        videoStartFrom: 192,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        mainSeconds: 13.2,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(13.2, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />
    {/* ITINERARY — day 1, filed in the wrong order, blurred under the hook.
        The blur lifts on the drop: in app/itinerary_demo.mp4 Leo presses the
        20:30 dinner at ~4.2 s, carries it down, lets go at ~4.9 s and the
        list settles chronological at 5.19 s — so revealAtSeconds 5.0 over
        revealFrames 18 clears the blur across 5.0-5.6 s, exactly as the row
        lands. Lock and countdown are OFF: the itinerary has no timed unlock,
        and implying one would misrepresent the feature (same call as the
        Cost Split and Packing List reels). The blur is editorial. */}
    <Composition
      id="T2-Reveal-Itinerary"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/itinerary_demo.mp4",
        hookLine1: "They couldn't agree on the schedule.",
        hookLine2: "So we just dragged it into place.",
        lockLabel: "",
        caption: "Day 1 in order. Nobody sent a message.",
        revealedLabel: "day one",
        launchLine: "Plan together. Travel better.",

        showCountdown: false,
        countdownFrom: 30,
        countdownLabel: "",
        countdownFormat: "s",

        revealAtSeconds: 5.0,
        revealFrames: 8,
        maxBlur: 34,
        teaseBlur: 12,
        revealFlash: 0.35,
        revealPunch: 0.06,
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

        // 46, not the 58 the Cost Split reel uses: these two hook lines are
        // 36 and 33 characters and HookText wraps rather than clips, so a
        // bigger size would break each of them onto two rows.
        hookFontSize: 46,
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

        mainSeconds: 9.5,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(9.5, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />
    {/* SPOTIFY — the whole journey plays blurred under the hook, and the blur
        lifts on the result. In app/spotify_demo.mp4 Leo saves the link at
        ~6.2 s, the sheet closes, he reopens Trip tools and from ~8.0 s the
        "Spotify playlist" row carries "Open". revealAtSeconds 7.6 over
        revealFrames 18 clears the blur across 7.6-8.2 s, as that row lands.
        Lock and countdown are OFF: a playlist link has no timed unlock. */}
    <Composition
      id="T2-Reveal-Spotify"
      component={T2Reveal}
      schema={t2RevealSchema}
      defaultProps={{
        appVideo: "app/spotify_demo.mp4",
        hookLine1: "Nobody wants to play DJ.",
        hookLine2: "Share the playlist link. Let the group handle it.",
        lockLabel: "",
        caption: "Saved once. Open for all nine.",
        revealedLabel: "the playlist",
        launchLine: "Plan together. Travel better.",

        showCountdown: false,
        countdownFrom: 30,
        countdownLabel: "",
        countdownFormat: "s",

        revealAtSeconds: 7.6,
        revealFrames: 8,
        maxBlur: 34,
        teaseBlur: 12,
        revealFlash: 0.35,
        revealPunch: 0.06,
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

        // The second hook line is 48 characters and wraps to two rows;
        // 44 keeps the whole hook inside the top band.
        hookFontSize: 44,
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

        mainSeconds: 10.6,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t2RevealDuration(10.6, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t2RevealDuration(props.mainSeconds, props.ctaSeconds, CANVAS.fps),
      })}
    />
  </>
);
