/**
 * ShowcaseReel — "One app. The whole trip."
 *
 * Deliberately the busiest reel we build: Remotion springs + the 3D phone +
 * live app scroll + a full-bleed animated background, all in one clip.
 *
 * OVERLAP FIX (was a known open item): the chips and the caption used to share
 * the phone's box and were held off it by hand-tuned offsets. They now live in
 * the TOP and BOTTOM text bands from splitSafeArea(), and the phone is centred
 * in — and sized from — the STAGE band between them. Text on the phone is now
 * geometrically impossible rather than merely tuned away.
 *
 * Framing tiers (from Phone.tsx), enforced here:
 *   full-bleed   AnimatedBackground            -> runs off every edge on purpose
 *   safe-framed  the phone (stage band)        -> fully visible
 *   safe-text    hook / chips / caption / CTA  -> strictly inside a text band
 */
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames, totalFrames } from "../timing";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { FeatureChips } from "../components/FeatureChips";
import { Hook } from "../components/Hook";
import { CTA } from "../components/CTA";
import { Phone } from "../components/Phone";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { Band, CaptionText } from "../components/Text";

/**
 * Zod schema = the interactive controls in Remotion Studio's "Props" panel.
 * Every string, size, band split and section length is here so the whole reel
 * can be tuned live without touching code.
 */
export const showcaseReelSchema = z.object({
  // content
  appVideo: z.string(),
  hookLine1: z.string(),
  hookLine2: z.string(),
  hookSubtext: z.string(),
  chip1: z.string(),
  chip2: z.string(),
  chip3: z.string(),
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

  // band split — fractions of the SAFE height given to text above / below the
  // phone. This is what keeps copy off the screen; the phone gets the rest.
  topBandFrac: z.number().min(0).max(0.6).step(0.01),
  bottomBandFrac: z.number().min(0).max(0.6).step(0.01),
  bandGutter: z.number().min(0).max(120).step(4),
  /** Share of the stage band the phone body fills. */
  phoneFill: z.number().min(0.3).max(1).step(0.01),

  // animated background — full-bleed, ignores the safe area on purpose
  bgIntensity: z.number().min(0).max(1.5).step(0.05),
  bgSpeed: z.number().min(0).max(3).step(0.05),
  bgBlur: z.number().min(0).max(240).step(5),
  bgVignette: z.number().min(0).max(1).step(0.02),

  // hook text
  hookFontSize: z.number().min(30).max(140).step(2),
  hookOffsetY: z.number().min(-600).max(600).step(5),

  // feature chips (top text band)
  chipsFontSize: z.number().min(20).max(70).step(2),
  chipsOffsetX: z.number().min(-300).max(300).step(5),
  chipsGap: z.number().min(0).max(80).step(2),
  chipsStagger: z.number().min(0).max(20).step(1),

  // caption (bottom text band)
  captionFontSize: z.number().min(20).max(90).step(2),

  // phone
  screenRotDeg: z.number().min(0).max(270).step(90),
  screenFlipY: z.boolean(),
  phoneOffsetY: z.number().min(-400).max(400).step(5),
  swingDeg: z.number().min(0).max(45).step(1),
  videoStartFrom: z.number().min(0).max(120).step(1),

  // cta
  ctaVariant: z.enum(["quiet", "standard", "urgent"]),
  ctaLogoSize: z.number().min(50).max(180).step(2),
  ctaOffsetY: z.number().min(-600).max(600).step(5),

  // timing (seconds)
  hookSeconds: z.number().min(1).max(6).step(0.1),
  phoneSeconds: z.number().min(1).max(10).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type ShowcaseReelProps = z.infer<typeof showcaseReelSchema>;

export const ShowcaseReel: React.FC<ShowcaseReelProps> = (p) => {
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
      {/* Full-bleed and runs the whole reel, so the CTA sits on it too. */}
      <AnimatedBackground
        intensity={p.bgIntensity}
        speed={p.bgSpeed}
        blur={p.bgBlur}
        vignette={p.bgVignette}
      />

      {/* Nothing else is on screen in the hook beat, so it gets the whole
          safe area rather than just the top band. */}
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
          <FeatureChips
            chips={[p.chip1, p.chip2, p.chip3]}
            box={bands.top}
            align="center"
            offsetX={p.chipsOffsetX}
            fontSize={p.chipsFontSize}
            gap={p.chipsGap}
            stagger={p.chipsStagger}
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
          background="transparent"
        />
      </Sequence>

      {p.showSafeArea ? <SafeAreaOverlay insets={insets} /> : null}
    </AbsoluteFill>
  );
};

/** Duration must match the timing props; Root recomputes via calculateMetadata. */
export const showcaseReelDuration = (
  hookSeconds: number,
  phoneSeconds: number,
  ctaSeconds: number,
  fps = 30
) => totalFrames([hookSeconds, phoneSeconds, ctaSeconds], fps);
