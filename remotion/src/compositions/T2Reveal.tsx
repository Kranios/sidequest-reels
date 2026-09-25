/**
 * T2 — THE REVEAL.  Goal: comments.  Tempo: slow, held.
 * Phone: centre stage the whole time. Capture: the hidden sidequest screen.
 *
 * THE MACRO-DROP. The reel opens locked in at ~4x on one detail of the live
 * UI, a crop so tight the viewer can't tell what they are looking at yet.
 * Then the camera whips out to the whole phone. The entire hold is ONE
 * sustained pattern interrupt, which is what actually holds viewers; a single
 * strange frame followed by ten normal ones loses them faster than no
 * interrupt at all. So the macro owns most of the runtime and the reveal is
 * the last thing that happens.
 *
 * This is our only true category exclusive: nobody else markets the surprise.
 *
 * WHY IT SCALES: every destination and every occasion is a new secret.
 * Birthdays, anniversaries, detours, a friend's bucket-list item.
 *
 * The sign-off is deliberately QUIET. An urgency line after a reveal breaks
 * the spell and costs the comment.
 *
 * Bands: countdown on top, phone on the stage, copy underneath. The copy
 * switches from the hook to the caption at the reveal.
 *
 * No blur and no dimming (both removed 2026-09-25): the app UI is sharp and at
 * full brightness from frame one. The whip is in the 3D camera (Phone.tsx
 * `macro`), so a 4x crop stays crisp; PopReveal only adds a small pop, a
 * subtle bloom and the lock.
 */
import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames, totalFrames } from "../timing";
import { textStyle } from "../type";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { PopReveal } from "../components/PopReveal";
import { CTA } from "../components/CTA";
import { Phone } from "../components/Phone";
import { Grade } from "../components/Grade";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { Timer } from "../components/Timer";
import { Band, CaptionText, HookText, exitBefore } from "../components/Text";

export const t2RevealSchema = z.object({
  // ---- content ----
  appVideo: z.string(),
  /** Two short lines, held under the macro shot from frame one. */
  hookLine1: z.string(),
  hookLine2: z.string(),
  /** Word on the lock, e.g. "Hidden until Friday". Empty = lock with no label. */
  lockLabel: z.string(),
  /** Replaces the hook at the reveal. */
  caption: z.string(),
  /** Small line above the phone after the reveal, e.g. "UNLOCKED". */
  revealedLabel: z.string(),
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

  // ---- countdown ----
  showCountdown: z.boolean(),
  /** Seconds on the clock at frame 0. It reaches 0 at the reveal. */
  countdownFrom: z.number().min(1).max(600).step(1),
  countdownLabel: z.string(),
  countdownFormat: z.enum(["mm:ss", "s.t", "s"]),

  // ---- the reveal itself ----
  /** Seconds into the reel when the camera whips out. */
  revealAtSeconds: z.number().min(0.5).max(12).step(0.1),
  /** Frames the whip-out takes: 10-15 reads as a whip, 20+ as a glide. */
  revealFrames: z.number().min(4).max(60).step(1),
  /** White flash at the reveal, 0..1. */
  revealFlash: z.number().min(0).max(1).step(0.05),
  /** Scale pop at the reveal (underdamped spring). 0 = none. */
  revealPunch: z.number().min(0).max(0.2).step(0.01),
  /** Where the macro-drop starts: a point on the displayed UI, 0,0 top-left. */
  macroFocus: z.object({ u: z.number().min(0).max(1), v: z.number().min(0).max(1) }),
  /** How far in the macro starts: 3.5-4 fills the frame with UI. */
  macroZoom: z.number().min(1).max(5).step(0.05),
  showLock: z.boolean(),

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
  hookFontSize: z.number().min(30).max(140).step(2),
  captionFontSize: z.number().min(20).max(90).step(2),
  timerFontSize: z.number().min(24).max(120).step(2),

  // ---- phone: minimal movement. The reveal is the event, not the camera. ----
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
  /** Whole held section: macro, countdown, reveal and the beat after it. */
  mainSeconds: z.number().min(3).max(16).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type T2RevealProps = z.infer<typeof t2RevealSchema>;

export const T2Reveal: React.FC<T2RevealProps> = (p) => {
  const { fps, height } = useVideoConfig();
  const mainDur = frames(p.mainSeconds, fps);
  const ctaDur = frames(p.ctaSeconds, fps);
  const revealFrame = Math.min(frames(p.revealAtSeconds, fps), mainDur - 1);

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

      <Sequence durationInFrames={mainDur}>
        {/* THE MACRO-DROP. The shot opens locked in at macroZoom on one
            detail of the live UI (sharp, full brightness) and whips out to
            the whole phone at the reveal. */}
        <PopReveal
          revealFrame={revealFrame}
          revealFrames={p.revealFrames}
          flash={p.revealFlash}
          scalePunch={p.revealPunch}
          showLock={p.showLock}
          lockLabel={p.lockLabel}
          // Sit the lock on the phone, not in the middle of the frame.
          lockOffsetY={bands.stage.top + bands.stage.height / 2 - height / 2}
        >
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
            entry={false}
            macro={{
              u: p.macroFocus.u,
              v: p.macroFocus.v,
              zoom: p.macroZoom,
              releaseAt: revealFrame,
              releaseFrames: p.revealFrames,
            }}
          />
        </PopReveal>

        {/* Countdown, then the unlocked label in the same place. */}
        {p.showCountdown ? (
          <Sequence durationInFrames={revealFrame}>
            <Band box={bands.top} align="end">
              <Timer
                direction="down"
                startSeconds={p.countdownFrom}
                endSeconds={0}
                rate={p.countdownFrom / Math.max(p.revealAtSeconds, 0.1)}
                format={p.countdownFormat}
                fontSize={p.timerFontSize}
                label={p.countdownLabel}
                tick
              />
            </Band>
          </Sequence>
        ) : null}

        {p.revealedLabel ? (
          <Sequence from={revealFrame}>
            <Band box={bands.top} align="end">
              <div
                style={{
                  ...textStyle("support", { fontSize: p.timerFontSize * 0.5, color: BRAND.pink }),
                  letterSpacing: 8,
                }}
              >
                {p.revealedLabel.toUpperCase()}
              </div>
            </Band>
          </Sequence>
        ) : null}

        {/* Text plate for the hold. In the macro the frame is full of the
            app's white UI and the white hook would vanish on it, so a dark
            gradient sits behind the bottom band only, and goes with the
            whip-out. The UI itself is never dimmed. */}
        <Sequence durationInFrames={revealFrame + p.revealFrames}>
          <TextPlate
            top={bands.bottom.top - 140}
            fadeFrom={revealFrame}
            fadeFrames={p.revealFrames}
          />
        </Sequence>

        {/* The copy under the phone swaps at the reveal. */}
        <Sequence durationInFrames={revealFrame}>
          <Band box={bands.bottom} align="start">
            <HookText
              lines={[
                { text: p.hookLine1, color: BRAND.white },
                { text: p.hookLine2, color: BRAND.white },
              ]}
              fontSize={p.hookFontSize}
              wordStagger={6}
              accentWords={p.accentWords}
              exitAt={exitBefore(revealFrame, p.hookLine1, p.hookLine2)}
            />
          </Band>
        </Sequence>

        <Sequence from={revealFrame}>
          <Band box={bands.bottom} align="start">
            <CaptionText
              text={p.caption}
              fontSize={p.captionFontSize}
              delay={6}
              exitAt={exitBefore(mainDur - revealFrame, p.caption)}
            />
          </Band>
        </Sequence>
      </Sequence>

      <Sequence from={mainDur} durationInFrames={ctaDur}>
        <CTA
          variant={p.ctaVariant}
          box={whole}
          logoSize={p.ctaLogoSize}
          launchLine={p.launchLine}
          background="transparent"
        />
      </Sequence>

      {/* Grain throughout, and one glint across the glass at the reveal. */}
      <Grade
        grain={p.grain}
        sweepAt={revealFrame + 2}
        sweepBand={bands.stage}
        sweepFill={p.phoneFill}
      />

      {p.showSafeArea ? <SafeAreaOverlay insets={insets} /> : null}
    </AbsoluteFill>
  );
};

/** Dark gradient from `top` to the bottom of the frame, fading out at the reveal. */
const TextPlate: React.FC<{ top: number; fadeFrom: number; fadeFrames: number }> = ({
  top,
  fadeFrom,
  fadeFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [fadeFrom, fadeFrom + Math.max(fadeFrames, 1)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        top,
        height: "auto",
        opacity,
        background:
          "linear-gradient(180deg, rgba(10,9,8,0) 0%, rgba(10,9,8,0.72) 32%, rgba(10,9,8,0.88) 100%)",
        pointerEvents: "none",
      }}
    />
  );
};

export const t2RevealDuration = (mainSeconds: number, ctaSeconds: number, fps = 30) =>
  totalFrames([mainSeconds, ctaSeconds], fps);
