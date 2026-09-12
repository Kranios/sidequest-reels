/**
 * REELS BUILT FROM T1 — THE RECEIPT.
 *
 * Three trips, three currencies, three villains. Only props differ.
 *
 * CAPTURE NEEDED: all three point at app/travel_tracker.mp4 as a placeholder.
 * The real payoff shot is the cost-split screen with real data in it — record
 * it, drop it in public/app/, and change `appVideo`. Nothing else changes.
 */
import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "../brand";
import { T1Receipt, t1ReceiptSchema, t1ReceiptDuration } from "../compositions/T1Receipt";

export const T1Reels: React.FC = () => (
  <>
    {/* 1. THE VILLA — the flagship. One villa, four people, an odd total. */}
    <Composition
      id="T1-Receipt-Villa"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",
        currency: "€",
        total: 2847,
        totalDecimals: 0,
        thousandsSeparator: ",",
        stakeLine: "Nine days. One villa. Four people.",
        rows: [
          { name: "Ana", amount: 712, flagged: false },
          { name: "Jo", amount: 712, flagged: false },
          { name: "Sam", amount: 712, flagged: false },
          { name: "Marcus", amount: 711, flagged: true },
        ],
        rowNote: "Nobody wanted to do the maths.",
        caption: "Split in four taps.",
        launchLine: "First 50 get lifetime access — free.",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.16,
        bottomBandFrac: 0.16,
        bandGutter: 44,
        phoneFill: 0.95,

        bgIntensity: 0.55,
        bgSpeed: 0.5,
        bgBlur: 170,
        bgVignette: 0.82,

        totalFontSize: 170,
        runningTotalFontSize: 62,
        stakeFontSize: 36,
        rowFontSize: 56,
        rowGap: 24,
        rowStagger: 9,
        captionFontSize: 42,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 14,
        dollyIn: 0.5,
        videoStartFrom: 10,

        ctaVariant: "standard",
        ctaLogoSize: 104,

        totalSeconds: 2.4,
        rowsSeconds: 3.6,
        phoneSeconds: 3.4,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.4, 3.6, 3.4, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* 2. THE FLIGHTS — identical amounts, one person who did not pay.
           Tighter, angrier, faster rows. */}
    <Composition
      id="T1-Receipt-Flights"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",
        currency: "€",
        total: 2448,
        totalDecimals: 0,
        thousandsSeparator: ",",
        stakeLine: "The flights were €612 each.",
        rows: [
          { name: "Leo", amount: 612, flagged: false },
          { name: "Ines", amount: 612, flagged: false },
          { name: "Tom", amount: 612, flagged: false },
          { name: "Marcus", amount: 0, flagged: true },
        ],
        rowNote: "Then Marcus forgot his card.",
        caption: "The app remembers. You don't have to.",
        launchLine: "First 50 get lifetime access — free.",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.14,
        bottomBandFrac: 0.18,
        bandGutter: 44,
        phoneFill: 0.95,

        bgIntensity: 1.1,
        bgSpeed: 0.9,
        bgBlur: 140,
        bgVignette: 0.7,

        totalFontSize: 150,
        runningTotalFontSize: 56,
        stakeFontSize: 34,
        rowFontSize: 60,
        rowGap: 22,
        rowStagger: 7,
        captionFontSize: 40,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 18,
        dollyIn: 0.7,
        videoStartFrom: 10,

        ctaVariant: "urgent",
        ctaLogoSize: 104,

        totalSeconds: 2.0,
        rowsSeconds: 3.2,
        phoneSeconds: 3.0,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.0, 3.2, 3.0, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />

    {/* 3. TOKYO — bigger group, different currency, calmer frame. Six rows, so
           the type comes down and the rows beat runs longer. */}
    <Composition
      id="T1-Receipt-Tokyo"
      component={T1Receipt}
      schema={t1ReceiptSchema}
      defaultProps={{
        appVideo: "app/travel_tracker.mp4",
        currency: "$",
        total: 4193,
        totalDecimals: 0,
        thousandsSeparator: ",",
        stakeLine: "Six people. Ten days. Tokyo.",
        rows: [
          { name: "Mia", amount: 731, flagged: false },
          { name: "Ravi", amount: 698, flagged: false },
          { name: "Ella", amount: 702, flagged: false },
          { name: "Nils", amount: 688, flagged: false },
          { name: "Yuki", amount: 690, flagged: false },
          { name: "Chris", amount: 684, flagged: true },
        ],
        rowNote: "Nobody paid the same. That is the point.",
        caption: "Every yen accounted for.",
        launchLine: "",

        showSafeArea: false,
        safeTop: 220,
        safeBottom: 450,
        safeLeft: 65,
        safeRight: 120,

        topBandFrac: 0.13,
        bottomBandFrac: 0.14,
        bandGutter: 40,
        phoneFill: 0.95,

        bgIntensity: 0.35,
        bgSpeed: 0.3,
        bgBlur: 190,
        bgVignette: 0.88,

        totalFontSize: 150,
        runningTotalFontSize: 54,
        stakeFontSize: 34,
        rowFontSize: 46,
        rowGap: 16,
        rowStagger: 7,
        captionFontSize: 38,

        screenRotDeg: 0,
        screenFlipY: false,
        phoneOffsetY: 0,
        swingDeg: 10,
        dollyIn: 0.4,
        videoStartFrom: 10,

        ctaVariant: "quiet",
        ctaLogoSize: 112,

        totalSeconds: 2.6,
        rowsSeconds: 4.4,
        phoneSeconds: 3.2,
        ctaSeconds: 2.4,
      }}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={t1ReceiptDuration(2.6, 4.4, 3.2, 2.4, CANVAS.fps)}
      calculateMetadata={({ props }) => ({
        durationInFrames: t1ReceiptDuration(
          props.totalSeconds,
          props.rowsSeconds,
          props.phoneSeconds,
          props.ctaSeconds,
          CANVAS.fps
        ),
      })}
    />
  </>
);
