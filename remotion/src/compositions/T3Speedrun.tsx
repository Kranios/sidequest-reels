/**
 * T3 — THE SPEEDRUN.  Goal: saves.  Tempo: fast.
 * Phone: the tool, constantly moving. Capture: one per step.
 *
 * Hard cuts through a real flow — create trip, add activities, invite friends,
 * split costs — with a timer running. Competence porn: satisfying, save-worthy,
 * and it demos the product without feeling like a demo. This is the one
 * template where an urgent sign-off fits the tempo.
 *
 * WHY IT SCALES: every feature combination is a new run, and the timer makes
 * it a format people expect variations of. A new reel is a new `steps` array.
 *
 * Each step is its own <Sequence> inside ScreenSwapper, so each gets a fresh
 * phone with its own capture — the cuts are real cuts, not crossfades. The
 * step label rides inside the same sequence, so it can never fall out of sync
 * with the screen it names, and it lives in the bottom text band, so it can
 * never land on the phone.
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
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { ScreenSwapper } from "../components/ScreenSwapper";
import { Timer } from "../components/Timer";
import { Band, CaptionText } from "../components/Text";

export const t3SpeedrunSchema = z.object({
  // ---- content ----
  hookLine1: z.string(),
  hookLine2: z.string(),
  hookSubtext: z.string(),
  /**
   * The run. One entry per screen: which capture, what to call the step, and
   * how long to hold it. Add a step and the reel and the clock both grow.
   */
  steps: z.array(
    z.object({
      video: z.string(),
      label: z.string(),
      holdSeconds: z.number(),
    })
  ),
  caption: z.string(),
  launchLine: z.string(),

  // ---- timer ----
  showTimer: z.boolean(),
  timerLabel: z.string(),
  timerFormat: z.enum(["mm:ss", "s.t", "s"]),
  /**
   * Clock seconds per real second. 1 = a real stopwatch; higher compresses a
   * long job ("a 5-day trip in 30 seconds") into the run.
   */
  timerRate: z.number().min(0.1).max(60).step(0.1),
  timerAlign: z.enum(["start", "center", "end"]),

  // ---- transitions ----
  transition: z.enum(["cut", "whip", "slide", "punch"]),
  transitionFrames: z.number().min(0).max(20).step(1),

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
  stepFontSize: z.number().min(20).max(90).step(2),
  timerFontSize: z.number().min(24).max(120).step(2),
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

  // ---- timing (seconds); the run's length comes from the steps ----
  hookSeconds: z.number().min(0.8).max(5).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type T3SpeedrunProps = z.infer<typeof t3SpeedrunSchema>;

export const T3Speedrun: React.FC<T3SpeedrunProps> = (p) => {
  const { fps } = useVideoConfig();
  const hookDur = frames(p.hookSeconds, fps);
  const holds = p.steps.map((s) => frames(s.holdSeconds, fps));
  const runDur = holds.reduce((n, h) => n + h, 0);
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

      <Sequence durationInFrames={hookDur}>
        <Hook
          box={whole}
          fontSize={p.hookFontSize}
          wordStagger={3}
          lines={[
            { text: p.hookLine1, color: BRAND.white },
            { text: p.hookLine2, color: BRAND.pink },
          ]}
          subtext={p.hookSubtext}
        />
      </Sequence>

      <Sequence from={hookDur} durationInFrames={runDur}>
        <ScreenSwapper
          sources={p.steps.map((s) => s.video)}
          holdFrames={holds}
          transition={p.transition}
          transitionFrames={p.transitionFrames}
        >
          {(src, i) => (
            <AbsoluteFill>
              <Phone
                videoSrc={staticFile(src)}
                // Only the first screen makes an entrance; every later step
                // cuts in hard, which is the whole tempo of this template.
                entry={i === 0}
                swingDeg={p.swingDeg}
                dollyIn={p.dollyIn}
                band={bands.stage}
                bandFill={p.phoneFill}
                videoStartFrom={p.videoStartFrom}
                screenRotDeg={p.screenRotDeg}
                screenFlipY={p.screenFlipY}
                insets={insets}
                offsetY={p.phoneOffsetY}
              />
              <Band box={bands.bottom} align="start">
                <CaptionText
                  text={`${i + 1}. ${p.steps[i]?.label ?? ""}`}
                  fontSize={p.stepFontSize}
                  delay={2}
                />
              </Band>
            </AbsoluteFill>
          )}
        </ScreenSwapper>

        {/* One clock across the whole run — outside the swapper so it does not
            restart on every cut. */}
        {p.showTimer ? (
          <Band box={bands.top} align="end">
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent:
                  p.timerAlign === "start"
                    ? "flex-start"
                    : p.timerAlign === "end"
                    ? "flex-end"
                    : "center",
              }}
            >
              <Timer
                direction="up"
                startSeconds={0}
                rate={p.timerRate}
                format={p.timerFormat}
                fontSize={p.timerFontSize}
                label={p.timerLabel}
                tick
              />
            </div>
          </Band>
        ) : null}
      </Sequence>

      <Sequence from={hookDur + runDur} durationInFrames={ctaDur}>
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

      {p.showSafeArea ? <SafeAreaOverlay insets={insets} /> : null}
    </AbsoluteFill>
  );
};

/** The run's length comes from the steps, so adding one extends the reel. */
export const t3SpeedrunDuration = (
  p: Pick<T3SpeedrunProps, "hookSeconds" | "ctaSeconds" | "steps">,
  fps = 30
) =>
  totalFrames([p.hookSeconds, p.ctaSeconds], fps) +
  p.steps.reduce((n, s) => n + frames(s.holdSeconds, fps), 0);
