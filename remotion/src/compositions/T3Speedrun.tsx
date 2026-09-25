/**
 * T3 — THE SPEEDRUN.  Goal: saves.  Tempo: fast.
 * Phone: the tool, in one unbroken take. Capture: one scripted user journey.
 *
 * A real job done start to finish on the phone — here,
 * logging an expense and splitting it. Competence porn: satisfying,
 * save-worthy, and it demos the product without feeling like a demo.
 *
 * ONE TAKE, NO CUTS. The capture is a journey recorded with
 * `record_video.py --scenario <name>`: a phantom-touch dot taps, types and
 * saves, so the finger itself carries the viewer from screen to screen. Hard
 * cuts between separate captures (the old ScreenSwapper version) would break
 * exactly the continuity that sells it.
 *
 * TIMING. A journey runs 15-20 s and qa.py caps a reel at 20 s, so the hook
 * does not get a beat of its own: it sits in the top band while the capture's
 * opening beat plays and the phone makes its entrance. Then the run caption
 * takes the bottom band and the top one stays empty: a corner stopwatch was
 * tried and removed (2026-09-25) because it cluttered the frame. `videoSeconds` is how much of the capture
 * plays: trim the idle hold at the end of a journey, never the journey.
 *
 * WHY IT SCALES: every journey is a new run — a new scenario, a new capture,
 * new props.
 */
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames, totalFrames } from "../timing";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { CTA } from "../components/CTA";
import { Hook } from "../components/Hook";
import { Phone } from "../components/Phone";
import { Grade } from "../components/Grade";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { Band, CaptionText, SupportText, exitBefore } from "../components/Text";

export const t3SpeedrunSchema = z.object({
  // ---- content ----
  /** One continuous user-journey capture (record_video.py --scenario). */
  appVideo: z.string(),
  hookLine1: z.string(),
  hookLine2: z.string(),
  /** Under the phone while the hook is up. Empty = none. */
  hookSubtext: z.string(),
  /** Under the phone for the rest of the take. Empty = none. */
  runCaption: z.string(),
  /** Under the sign-off. */
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
  /** The hook lives in the top band, so it is sized for it. */
  hookFontSize: z.number().min(30).max(140).step(2),
  runCaptionFontSize: z.number().min(20).max(90).step(2),
  captionFontSize: z.number().min(20).max(90).step(2),

  // ---- phone ----
  screenRotDeg: z.number().min(0).max(270).step(90),
  screenFlipY: z.boolean(),
  phoneOffsetY: z.number().min(-400).max(400).step(5),
  swingDeg: z.number().min(0).max(45).step(1),
  dollyIn: z.number().min(0).max(3).step(0.05),
  videoStartFrom: z.number().min(0).max(120).step(1),

  // ---- cta: urgent suits this one ----
  ctaVariant: z.enum(["quiet", "standard", "urgent"]),
  ctaLogoSize: z.number().min(50).max(180).step(2),

  // ---- timing (seconds) ----
  /** How long the hook stays up, OVER the start of the take. */
  hookSeconds: z.number().min(0.8).max(6).step(0.1),
  /** How much of the capture plays — the take's length on screen. */
  videoSeconds: z.number().min(2).max(30).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type T3SpeedrunProps = z.infer<typeof t3SpeedrunSchema>;

export const T3Speedrun: React.FC<T3SpeedrunProps> = (p) => {
  const { fps } = useVideoConfig();
  const runDur = frames(p.videoSeconds, fps);
  const hookDur = Math.min(frames(p.hookSeconds, fps), runDur);
  const ctaDur = frames(p.ctaSeconds, fps);

  const insets = { top: p.safeTop, bottom: p.safeBottom, left: p.safeLeft, right: p.safeRight };
  const bands = splitSafeArea(insets, p.topBandFrac, p.bottomBandFrac, p.bandGutter);
  const whole = fullSafeBox(insets);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDark }}>
      <AnimatedBackground
        intensity={p.bgIntensity}
        speed={p.bgSpeed}
        blur={p.bgBlur}
        vignette={p.bgVignette}
      />

      {/* The take: one phone, one capture, start to finish. */}
      <Sequence durationInFrames={runDur}>
        <AbsoluteFill>
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
        </AbsoluteFill>
      </Sequence>

      {/* The hook, over the take's opening beat. */}
      <Sequence durationInFrames={hookDur}>
        <Hook
          box={bands.top}
          fontSize={p.hookFontSize}
          wordStagger={3}
          accentWords={p.accentWords}
          exitAt={exitBefore(hookDur, p.hookLine1, p.hookLine2)}
          lines={[
            { text: p.hookLine1, color: BRAND.white },
            { text: p.hookLine2, color: BRAND.pink },
          ]}
        />
        {p.hookSubtext ? (
          <Band box={bands.bottom} align="start">
            <SupportText
              text={p.hookSubtext}
              delay={12}
              exitAt={exitBefore(hookDur, p.hookSubtext)}
            />
          </Band>
        ) : null}
      </Sequence>

      {/* The rest of the take: what is being done. */}
      <Sequence from={hookDur} durationInFrames={runDur - hookDur}>
        {p.runCaption ? (
          <Band box={bands.bottom} align="start">
            <CaptionText
              text={p.runCaption}
              fontSize={p.runCaptionFontSize}
              delay={4}
              exitAt={exitBefore(runDur - hookDur, p.runCaption)}
            />
          </Band>
        ) : null}
      </Sequence>

      <Sequence from={runDur} durationInFrames={ctaDur}>
        <CTA
          variant={p.ctaVariant}
          box={whole}
          logoSize={p.ctaLogoSize}
          launchLine={p.launchLine}
          background="transparent"
        />
        <Band box={bands.bottom} align="start">
          <CaptionText text={p.caption} fontSize={p.captionFontSize} delay={10} />
        </Band>
      </Sequence>

      <Grade grain={p.grain} />

      {p.showSafeArea ? <SafeAreaOverlay insets={insets} /> : null}
    </AbsoluteFill>
  );
};

/** The take plus the sign-off; the hook overlaps the take, so it adds nothing. */
export const t3SpeedrunDuration = (
  p: Pick<T3SpeedrunProps, "videoSeconds" | "ctaSeconds">,
  fps = 30
) => totalFrames([p.videoSeconds, p.ctaSeconds], fps);
