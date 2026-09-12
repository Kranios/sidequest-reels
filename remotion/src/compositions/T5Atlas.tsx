/**
 * T5 — THE ATLAS.  Goal: saves.  Tempo: the slowest we build.
 * Phone: the object — barely moving. Capture: travel-tracker. Higgsfield: none.
 *
 * Near-ASMR. The globe filling in, a slow drift of the camera, two numbers,
 * almost no copy. Dark and expensive-looking, with no sell at all: built to be
 * saved and re-shared, not laughed at. That is why the sign-off is the quiet
 * CTA — wordmark and handle, no urgency line. An offer here would break it.
 *
 * WHY IT SCALES: the globe is seeded from localStorage (see capture/capture.py,
 * DEFAULT_COUNTRY_STATUS), so every combination of countries and every travel
 * identity is a new reel with no backend and no login. The numbers on screen
 * are props — set them to match the seed you recorded.
 *
 * Beats:  intro (two restrained lines) -> globe + stats -> quiet wordmark.
 */
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames, totalFrames } from "../timing";
import { textStyle } from "../type";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Hook } from "../components/Hook";
import { CTA } from "../components/CTA";
import { NumberCounter } from "../components/NumberCounter";
import { Phone } from "../components/Phone";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { Band, CaptionText } from "../components/Text";

export const t5AtlasSchema = z.object({
  // ---- content ----
  appVideo: z.string(),
  hookLine1: z.string(),
  hookLine2: z.string(),
  hookSubtext: z.string(),
  caption: z.string(),

  // ---- the two numbers. Set them to match the seed you recorded. ----
  showStats: z.boolean(),
  statAValue: z.number(),
  statADecimals: z.number().min(0).max(2).step(1),
  statASuffix: z.string(),
  statALabel: z.string(),
  statBValue: z.number(),
  statBDecimals: z.number().min(0).max(2).step(1),
  statBSuffix: z.string(),
  statBLabel: z.string(),

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

  // ---- background: near-black by default; raise intensity for a warmer one --
  bgIntensity: z.number().min(0).max(1.5).step(0.05),
  bgSpeed: z.number().min(0).max(3).step(0.05),
  bgBlur: z.number().min(0).max(240).step(5),
  bgVignette: z.number().min(0).max(1).step(0.02),

  // ---- type ----
  hookFontSize: z.number().min(30).max(140).step(2),
  statFontSize: z.number().min(30).max(140).step(2),
  statLabelFontSize: z.number().min(16).max(60).step(2),
  captionFontSize: z.number().min(20).max(90).step(2),

  // ---- phone: keep swing and dolly small. This template is meant to drift. --
  screenRotDeg: z.number().min(0).max(270).step(90),
  screenFlipY: z.boolean(),
  phoneOffsetY: z.number().min(-400).max(400).step(5),
  swingDeg: z.number().min(0).max(45).step(1),
  dollyIn: z.number().min(0).max(3).step(0.05),
  videoStartFrom: z.number().min(0).max(600).step(1),

  // ---- cta: quiet by default, and it should stay that way ----
  ctaVariant: z.enum(["quiet", "standard", "urgent"]),
  ctaLogoSize: z.number().min(50).max(180).step(2),
  launchLine: z.string(),

  // ---- timing (seconds) ----
  introSeconds: z.number().min(1).max(6).step(0.1),
  globeSeconds: z.number().min(2).max(14).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type T5AtlasProps = z.infer<typeof t5AtlasSchema>;

/** One figure with its label under it. */
const Stat: React.FC<{
  value: number;
  decimals: number;
  suffix: string;
  label: string;
  delay: number;
  fontSize: number;
  labelFontSize: number;
}> = ({ value, decimals, suffix, label, delay, fontSize, labelFontSize }) => {
  const frame = useCurrentFrame();
  const labelOpacity = interpolate(frame, [delay + 14, delay + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <NumberCounter
        value={value}
        decimals={decimals}
        suffix={suffix}
        delay={delay}
        // Slow, heavy settle — the whole template is one long exhale.
        stiffness={26}
        fontSize={fontSize}
        color={BRAND.white}
      />
      <div
        style={{
          ...textStyle("support", { fontSize: labelFontSize, color: BRAND.grayHandle }),
          letterSpacing: 4,
          opacity: labelOpacity,
        }}
      >
        {label.toUpperCase()}
      </div>
    </div>
  );
};

export const T5Atlas: React.FC<T5AtlasProps> = (p) => {
  const { fps } = useVideoConfig();
  const introDur = frames(p.introSeconds, fps);
  const globeDur = frames(p.globeSeconds, fps);
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

      <Sequence durationInFrames={introDur}>
        <Hook
          box={whole}
          fontSize={p.hookFontSize}
          // Slower than any other template: the words should arrive, not snap.
          wordStagger={7}
          lines={[
            { text: p.hookLine1, color: BRAND.white },
            { text: p.hookLine2, color: BRAND.pink },
          ]}
          subtext={p.hookSubtext}
        />
      </Sequence>

      <Sequence from={introDur} durationInFrames={globeDur}>
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
          />

          {p.showStats ? (
            <Band box={bands.top} align="center">
              <div style={{ display: "flex", gap: 96, alignItems: "flex-start" }}>
                <Stat
                  value={p.statAValue}
                  decimals={p.statADecimals}
                  suffix={p.statASuffix}
                  label={p.statALabel}
                  delay={10}
                  fontSize={p.statFontSize}
                  labelFontSize={p.statLabelFontSize}
                />
                <Stat
                  value={p.statBValue}
                  decimals={p.statBDecimals}
                  suffix={p.statBSuffix}
                  label={p.statBLabel}
                  delay={22}
                  fontSize={p.statFontSize}
                  labelFontSize={p.statLabelFontSize}
                />
              </div>
            </Band>
          ) : null}

          {p.caption ? (
            <Band box={bands.bottom} align="center">
              <CaptionText text={p.caption} fontSize={p.captionFontSize} delay={26} />
            </Band>
          ) : null}
        </AbsoluteFill>
      </Sequence>

      <Sequence from={introDur + globeDur} durationInFrames={ctaDur}>
        <CTA
          variant={p.ctaVariant}
          box={whole}
          logoSize={p.ctaLogoSize}
          launchLine={p.launchLine}
          background="transparent"
        />
      </Sequence>

      {p.showSafeArea ? <SafeAreaOverlay insets={insets} /> : null}
    </AbsoluteFill>
  );
};

export const t5AtlasDuration = (
  introSeconds: number,
  globeSeconds: number,
  ctaSeconds: number,
  fps = 30
) => totalFrames([introSeconds, globeSeconds, ctaSeconds], fps);
