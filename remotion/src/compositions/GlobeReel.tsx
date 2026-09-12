/**
 * Theme 7 — "Countries visited vs planned".
 * Hook -> phone with the live scrolling travel-tracker -> CTA.
 *
 * SUPERSEDED by T5 Atlas (src/compositions/T5Atlas.tsx), which is the same
 * idea built as a template: slower camera, restrained copy, quiet sign-off and
 * everything driven by props. This one is kept because it is already rendered
 * and registered; build new globe reels from T5Atlas.
 *
 * Migrated to the band layout so it shares the overlap guarantee: the caption
 * sits in the bottom text band, the phone is centred in the stage band.
 */
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames, totalFrames } from "../timing";
import { Band, CaptionText } from "../components/Text";
import { Hook } from "../components/Hook";
import { CTA } from "../components/CTA";
import { Phone } from "../components/Phone";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";

/**
 * Zod schema = interactive controls in the Remotion Studio "Props" panel.
 * Tick showSafeArea there to see exactly where Instagram's UI will cover the
 * frame, and tune the screen orientation live instead of re-rendering.
 */
export const globeReelSchema = z.object({
  // content
  appVideo: z.string(),
  hookLine1: z.string(),
  hookLine2: z.string(),
  hookSubtext: z.string(),
  caption: z.string(),
  launchLine: z.string(),

  // safe area — these four ALWAYS apply, live. Turn on showSafeArea and drag.
  // Starting points: loose 150/320/50/100 · standard 220/450/65/120
  //                  strict 269/672/65/65 (Meta ad spec, very cautious)
  showSafeArea: z.boolean(),
  safeTop: z.number().min(0).max(600).step(5),
  safeBottom: z.number().min(0).max(900).step(5),
  safeLeft: z.number().min(0).max(300).step(5),
  safeRight: z.number().min(0).max(300).step(5),

  // band split — text above / below the phone, as fractions of the SAFE
  // height. This is what keeps the caption off the screen.
  topBandFrac: z.number().min(0).max(0.6).step(0.01),
  bottomBandFrac: z.number().min(0).max(0.6).step(0.01),
  bandGutter: z.number().min(0).max(120).step(4),
  phoneFill: z.number().min(0.3).max(1).step(0.01),

  // text layout
  hookFontSize: z.number().min(30).max(140).step(2),
  hookOffsetY: z.number().min(-600).max(600).step(5),
  captionFontSize: z.number().min(20).max(90).step(2),
  ctaVariant: z.enum(["quiet", "standard", "urgent"]),
  ctaLogoSize: z.number().min(50).max(180).step(2),
  ctaOffsetY: z.number().min(-600).max(600).step(5),

  // phone
  screenRotDeg: z.number().min(0).max(270).step(90),
  screenFlipY: z.boolean(),
  phoneOffsetY: z.number().min(-400).max(400).step(5),
  swingDeg: z.number().min(0).max(45).step(1),
  videoStartFrom: z.number().min(0).max(120).step(1),

  // timing (seconds)
  hookSeconds: z.number().min(1).max(6).step(0.1),
  phoneSeconds: z.number().min(1).max(10).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type GlobeReelProps = z.infer<typeof globeReelSchema>;

export const GlobeReel: React.FC<GlobeReelProps> = (p) => {
  const { fps } = useVideoConfig();
  const hookDur = frames(p.hookSeconds, fps);
  const phoneDur = frames(p.phoneSeconds, fps);
  const ctaDur = frames(p.ctaSeconds, fps);

  const insets = {
    top: p.safeTop,
    bottom: p.safeBottom,
    left: p.safeLeft,
    right: p.safeRight,
  };
  const bands = splitSafeArea(insets, p.topBandFrac, p.bottomBandFrac, p.bandGutter);
  const whole = fullSafeBox(insets);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDark }}>
      <Sequence durationInFrames={hookDur}>
        <Hook
          box={whole}
          fontSize={p.hookFontSize}
          offsetY={p.hookOffsetY}
          lines={[
            { text: p.hookLine1, color: BRAND.white },
            { text: p.hookLine2, color: BRAND.pink },
          ]}
          subtext={p.hookSubtext}
        />
      </Sequence>

      <Sequence from={hookDur} durationInFrames={phoneDur}>
        <AbsoluteFill>
          <Phone
            videoSrc={staticFile(p.appVideo)}
            swingDeg={p.swingDeg}
            dollyIn={0.8}
            band={bands.stage}
            bandFill={p.phoneFill}
            videoStartFrom={p.videoStartFrom}
            screenRotDeg={p.screenRotDeg}
            screenFlipY={p.screenFlipY}
            insets={insets}
            offsetY={p.phoneOffsetY}
          />
          <Band box={bands.bottom} align="center">
            <CaptionText text={p.caption} fontSize={p.captionFontSize} />
          </Band>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={hookDur + phoneDur} durationInFrames={ctaDur}>
        <CTA
          variant={p.ctaVariant}
          box={whole}
          logoSize={p.ctaLogoSize}
          offsetY={p.ctaOffsetY}
          launchLine={p.launchLine}
        />
      </Sequence>

      {p.showSafeArea ? (
        <SafeAreaOverlay insets={insets} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Duration must match the timing props; Root recomputes via calculateMetadata. */
export const globeReelDuration = (
  hookSeconds: number,
  phoneSeconds: number,
  ctaSeconds: number,
  fps = 30
) => totalFrames([hookSeconds, phoneSeconds, ctaSeconds], fps);
