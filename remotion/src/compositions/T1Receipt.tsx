/**
 * T1 — THE RECEIPT.  Goal: shares.  Tempo: medium.
 * Phone: arrives late, as the payoff. Capture: the cost-split screen.
 *
 * Numbers in full screen, no phone at first. The amount counts up, the names
 * land one by one, the total settles — then the phone slides in with the split
 * already solved.
 *
 * It opens on a number because specificity reads as truth: always a real, odd
 * figure. 2,847 is a receipt; 3,000 is marketing. A number on its own is a
 * weak hook, so `stakeLine` pairs it with what was at stake.
 *
 * WHY IT SCALES: every trip anyone takes is a new receipt. Vary the
 * destination, the group, the currency and which category blew up — same build.
 *
 * Beats:  total -> names -> (settle) -> phone -> cta.
 * Bands:  the running total sits in the top band, the rows own the stage, the
 *         note sits in the bottom band. The phone takes the stage when it
 *         arrives, and no text moves into it.
 *
 * DATA: if a cost split is on screen it must be real data in the app (Oskar's
 * rule 9). The figures in the props are there to MATCH the capture, not to
 * invent one.
 */
import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames, totalFrames } from "../timing";
import { textStyle } from "../type";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { CTA } from "../components/CTA";
import { KineticList } from "../components/KineticList";
import { NumberCounter, formatNumber } from "../components/NumberCounter";
import { Phone } from "../components/Phone";
import { Grade } from "../components/Grade";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { Band, CaptionText, SupportText, exitBefore } from "../components/Text";

export const t1ReceiptSchema = z.object({
  // ---- content ----
  appVideo: z.string(),
  /** Currency symbol or code, printed straight before the figure. */
  currency: z.string(),
  /** THE number. Keep it odd and specific. */
  total: z.number(),
  totalDecimals: z.number().min(0).max(2).step(1),
  thousandsSeparator: z.string(),
  /** What was at stake. A figure without one is a weak hook. */
  stakeLine: z.string(),
  /** Who owed what. Add or remove people freely. */
  rows: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      /** Pink — for the person the reel is really about. */
      flagged: z.boolean(),
    })
  ),
  /** The line under the rows, e.g. "Then Marcus forgot his card." */
  rowNote: z.string(),
  /** Over the phone beat, once the app has solved it. */
  caption: z.string(),
  launchLine: z.string(),
  /** Words to turn pink and pop when they land (Text.tsx). Optional. */
  accentWords: z.array(z.string()).optional(),
  /** Film grain opacity (Grade.tsx). Optional; 0.04 by default. */
  grain: z.number().min(0).max(0.2).optional(),
  /** Camera focus moments, in CAPTURE seconds (see PhoneFocus). Optional. */
  phoneFocus: z
    .array(
      z.object({
        at: z.number().min(0).max(60),
        u: z.number().min(0).max(1),
        v: z.number().min(0).max(1),
        zoom: z.number().min(1).max(4),
        hold: z.number().min(0.2).max(20),
      })
    )
    .optional(),

  // ---- safe area (mirrors SAFE_INSETS) ----
  showSafeArea: z.boolean(),
  safeTop: z.number().min(0).max(600).step(5),
  safeBottom: z.number().min(0).max(900).step(5),
  safeLeft: z.number().min(0).max(300).step(5),
  safeRight: z.number().min(0).max(300).step(5),

  // ---- band split ----
  topBandFrac: z.number().min(0).max(0.6).step(0.01),
  bottomBandFrac: z.number().min(0).max(0.6).step(0.01),
  bandGutter: z.number().min(0).max(120).step(4),
  phoneFill: z.number().min(0.3).max(1).step(0.01),

  // ---- background ----
  bgIntensity: z.number().min(0).max(1.5).step(0.05),
  bgSpeed: z.number().min(0).max(3).step(0.05),
  bgBlur: z.number().min(0).max(240).step(5),
  bgVignette: z.number().min(0).max(1).step(0.02),

  // ---- type ----
  totalFontSize: z.number().min(60).max(260).step(2),
  runningTotalFontSize: z.number().min(30).max(140).step(2),
  stakeFontSize: z.number().min(20).max(70).step(2),
  rowFontSize: z.number().min(24).max(90).step(2),
  rowGap: z.number().min(4).max(60).step(2),
  rowStagger: z.number().min(2).max(24).step(1),
  captionFontSize: z.number().min(20).max(90).step(2),

  // ---- phone ----
  screenRotDeg: z.number().min(0).max(270).step(90),
  screenFlipY: z.boolean(),
  phoneOffsetY: z.number().min(-400).max(400).step(5),
  swingDeg: z.number().min(0).max(45).step(1),
  dollyIn: z.number().min(0).max(3).step(0.05),
  videoStartFrom: z.number().min(0).max(600).step(1),

  // ---- cta ----
  ctaVariant: z.enum(["quiet", "standard", "urgent"]),
  ctaLogoSize: z.number().min(50).max(180).step(2),

  // ---- timing (seconds) ----
  /** The figure alone on screen, counting up. */
  totalSeconds: z.number().min(1).max(6).step(0.1),
  /** Names landing, plus the held silence after the last one. */
  rowsSeconds: z.number().min(1).max(8).step(0.1),
  /** The payoff. */
  phoneSeconds: z.number().min(1).max(8).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type T1ReceiptProps = z.infer<typeof t1ReceiptSchema>;

/** The phone arrives — it does not cut in. This is the payoff beat. */
const SlideUp: React.FC<{ delay?: number; from?: number; children: React.ReactNode }> = ({
  delay = 0,
  from = 260,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 70 } });
  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${interpolate(s, [0, 1], [from, 0])}px)`,
        opacity: Math.min(1, s * 2),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const T1Receipt: React.FC<T1ReceiptProps> = (p) => {
  const { fps } = useVideoConfig();
  const totalDur = frames(p.totalSeconds, fps);
  const rowsDur = frames(p.rowsSeconds, fps);
  const phoneDur = frames(p.phoneSeconds, fps);
  const ctaDur = frames(p.ctaSeconds, fps);

  const insets = { top: p.safeTop, bottom: p.safeBottom, left: p.safeLeft, right: p.safeRight };
  const bands = splitSafeArea(insets, p.topBandFrac, p.bottomBandFrac, p.bandGutter);
  const whole = fullSafeBox(insets);

  const settled = `${p.currency}${formatNumber(
    p.total,
    p.totalDecimals,
    p.thousandsSeparator
  )}`;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDark }}>
      <AnimatedBackground
        intensity={p.bgIntensity}
        speed={p.bgSpeed}
        blur={p.bgBlur}
        vignette={p.bgVignette}
      />

      {/* 1. The figure, alone, counting up. */}
      <Sequence durationInFrames={totalDur}>
        <Band box={whole} align="center">
          <NumberCounter
            value={p.total}
            prefix={p.currency}
            decimals={p.totalDecimals}
            thousandsSeparator={p.thousandsSeparator}
            delay={4}
            stiffness={38}
            fontSize={p.totalFontSize}
          />
          <SupportText
            text={p.stakeLine}
            fontSize={p.stakeFontSize}
            delay={26}
            marginTop={28}
            accentWords={p.accentWords}
            exitAt={exitBefore(totalDur, p.stakeLine)}
          />
        </Band>
      </Sequence>

      {/* 2. Who owed what. The total shrinks to the top band and holds there,
             so the eye keeps the figure while the names land. */}
      <Sequence from={totalDur} durationInFrames={rowsDur}>
        <Band box={bands.top} align="center">
          <div style={textStyle("hook", { fontSize: p.runningTotalFontSize })}>{settled}</div>
        </Band>

        <Band box={bands.stage} align="center">
          <KineticList
            items={p.rows.map((r) => ({
              text: r.name,
              value: `${p.currency}${formatNumber(r.amount, p.totalDecimals, p.thousandsSeparator)}`,
              color: r.flagged ? BRAND.pink : BRAND.white,
              valueColor: r.flagged ? BRAND.pink : BRAND.white,
            }))}
            mode="stack"
            tier="hook"
            fontSize={p.rowFontSize}
            rowGap={p.rowGap}
            stagger={p.rowStagger}
            startFrame={4}
          />
        </Band>

        {p.rowNote ? (
          <Band box={bands.bottom} align="start">
            <CaptionText
              text={p.rowNote}
              fontSize={p.captionFontSize}
              delay={4 + p.rowStagger * p.rows.length}
              exitAt={exitBefore(rowsDur, p.rowNote)}
            />
          </Band>
        ) : null}
      </Sequence>

      {/* 3. The payoff: the app has already solved it. */}
      <Sequence from={totalDur + rowsDur} durationInFrames={phoneDur}>
        <SlideUp>
          <Phone
            videoSrc={staticFile(p.appVideo)}
            swingDeg={p.swingDeg}
            dollyIn={p.dollyIn}
            band={bands.stage}
            bandFill={p.phoneFill}
            videoStartFrom={p.videoStartFrom}
            screenRotDeg={p.screenRotDeg}
            screenFlipY={p.screenFlipY}
            insets={insets}
            offsetY={p.phoneOffsetY}
            focus={p.phoneFocus}
          />
        </SlideUp>
        <Band box={bands.top} align="center">
          <div style={textStyle("hook", { fontSize: p.runningTotalFontSize })}>{settled}</div>
        </Band>
        <Band box={bands.bottom} align="start">
          <CaptionText
            text={p.caption}
            fontSize={p.captionFontSize}
            delay={14}
            exitAt={exitBefore(phoneDur, p.caption)}
          />
        </Band>
      </Sequence>

      <Sequence from={totalDur + rowsDur + phoneDur} durationInFrames={ctaDur}>
        <CTA
          variant={p.ctaVariant}
          box={whole}
          logoSize={p.ctaLogoSize}
          launchLine={p.launchLine}
          background="transparent"
        />
      </Sequence>

      <Grade grain={p.grain} />

      {p.showSafeArea ? <SafeAreaOverlay insets={insets} /> : null}
    </AbsoluteFill>
  );
};

export const t1ReceiptDuration = (
  totalSeconds: number,
  rowsSeconds: number,
  phoneSeconds: number,
  ctaSeconds: number,
  fps = 30
) => totalFrames([totalSeconds, rowsSeconds, phoneSeconds, ctaSeconds], fps);
