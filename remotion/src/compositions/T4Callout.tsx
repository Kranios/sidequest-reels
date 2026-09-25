/**
 * T4 — THE CALLOUT.  Goal: comments and shares.  Tempo: punchy.
 * Phone: absent. Capture: none. Higgsfield: none.
 *
 * Almost pure text: group-travel truths everyone recognises, delivered as fast
 * kinetic lines over the moving background. ~90% feeling, 10% product — the
 * cheapest template we have and the volume workhorse.
 *
 * WHY IT SCALES: every group-travel frustration, role and cliche is a reel.
 * The content lives entirely in `lines`, so a new reel is a new array.
 *
 * Beats:
 *   hook      one recognisable claim, 6-8 words          (the scroll-stopper)
 *   lines     one at a time, each replacing the last     (sustained interrupt)
 *   punch     the line that earns the comment            (optional)
 *   cta       wordmark
 *
 * Layout: no phone, so the STAGE band carries the kinetic lines and the two
 * text bands carry the counter and the kicker. Nothing can overlap because
 * nothing shares a band.
 */
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Sequence, useVideoConfig, useCurrentFrame, interpolate } from "remotion";
import { BRAND } from "../brand";
import { splitSafeArea, fullSafeBox } from "../layout";
import { frames } from "../timing";
import { textStyle } from "../type";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Hook } from "../components/Hook";
import { CTA } from "../components/CTA";
import { KineticList } from "../components/KineticList";
import { Grade } from "../components/Grade";
import { SafeAreaOverlay } from "../components/SafeAreaOverlay";
import { Band, CaptionText, exitBefore } from "../components/Text";

export const t4CalloutSchema = z.object({
  // ---- content: this is the entire reel ----
  hookLine1: z.string(),
  hookLine2: z.string(),
  hookSubtext: z.string(),
  /** The callout lines. Add or remove freely — timing follows the count. */
  lines: z.array(
    z.object({
      text: z.string(),
      /** Pink instead of white — for the one line that lands hardest. */
      accent: z.boolean(),
    })
  ),
  /** The line that earns the comment. Leave empty to skip the beat. */
  punchline: z.string(),
  /** Small line that stays under the list, e.g. "tag them". Empty = none. */
  kicker: z.string(),
  launchLine: z.string(),
  /** Words to turn pink and pop when they land (Text.tsx). Optional. */
  accentWords: z.array(z.string()).optional(),
  /** Film grain opacity (Grade.tsx). Optional; 0.04 by default. */
  grain: z.number().min(0).max(0.2).optional(),

  // ---- counter ("02 / 05") in the top band; suits list reels ----
  showCounter: z.boolean(),

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

  // ---- background (full-bleed) ----
  bgIntensity: z.number().min(0).max(1.5).step(0.05),
  bgSpeed: z.number().min(0).max(3).step(0.05),
  bgBlur: z.number().min(0).max(240).step(5),
  bgVignette: z.number().min(0).max(1).step(0.02),
  /** Background brightens on each line change — sells the tempo. */
  bgPulse: z.boolean(),

  // ---- type sizes (tier is fixed; only scale is a prop) ----
  hookFontSize: z.number().min(30).max(140).step(2),
  lineFontSize: z.number().min(30).max(140).step(2),
  punchFontSize: z.number().min(30).max(160).step(2),
  kickerFontSize: z.number().min(20).max(90).step(2),

  // ---- cta ----
  ctaVariant: z.enum(["quiet", "standard", "urgent"]),
  ctaLogoSize: z.number().min(50).max(180).step(2),

  // ---- timing (seconds) ----
  hookSeconds: z.number().min(0.8).max(6).step(0.1),
  /** Per line. Punchy = 0.9-1.3. */
  lineSeconds: z.number().min(0.4).max(3).step(0.1),
  punchSeconds: z.number().min(0).max(5).step(0.1),
  ctaSeconds: z.number().min(1.5).max(6).step(0.1),
});

export type T4CalloutProps = z.infer<typeof t4CalloutSchema>;

/** "02 / 05" — only drawn while the list is running. */
const Counter: React.FC<{ total: number; holdFrames: number; fontSize: number }> = ({
  total,
  holdFrames,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const i = Math.min(total, Math.floor(frame / Math.max(holdFrames, 1)) + 1);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div
      style={{
        ...textStyle("support", { fontSize, color: BRAND.grayHandle }),
        letterSpacing: 6,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {pad(i)} / {pad(total)}
    </div>
  );
};

/** A brightness lift on every line change; off for the calmer variants. */
const usePulse = (holdFrames: number, enabled: boolean) => {
  const frame = useCurrentFrame();
  if (!enabled || holdFrames <= 0) return 1;
  const phase = (frame % holdFrames) / holdFrames;
  return interpolate(phase, [0, 0.12, 1], [1.28, 1, 1], { extrapolateRight: "clamp" });
};

const Lines: React.FC<{ p: T4CalloutProps; holdFrames: number }> = ({ p, holdFrames }) => {
  const insets = { top: p.safeTop, bottom: p.safeBottom, left: p.safeLeft, right: p.safeRight };
  const bands = splitSafeArea(insets, p.topBandFrac, p.bottomBandFrac, p.bandGutter);
  const pulse = usePulse(holdFrames, p.bgPulse);

  return (
    <AbsoluteFill>
      {/* The pulse rides a transparent pink wash, so it lifts the background
          without touching the text's contrast. */}
      {p.bgPulse ? (
        <AbsoluteFill
          style={{
            background: `rgba(244,167,176,${(pulse - 1) * 0.14})`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {p.showCounter ? (
        <Band box={bands.top} align="end">
          <Counter total={p.lines.length} holdFrames={holdFrames} fontSize={p.kickerFontSize} />
        </Band>
      ) : null}

      <Band box={bands.stage} align="center">
        <KineticList
          items={p.lines.map((l) => ({
            text: l.text,
            color: l.accent ? BRAND.pink : BRAND.white,
          }))}
          mode="swap"
          tier="hook"
          fontSize={p.lineFontSize}
          holdFrames={holdFrames}
        />
      </Band>

      {p.kicker ? (
        <Band box={bands.bottom} align="start">
          <CaptionText text={p.kicker} fontSize={p.kickerFontSize} delay={6} />
        </Band>
      ) : null}
    </AbsoluteFill>
  );
};

export const T4Callout: React.FC<T4CalloutProps> = (p) => {
  const { fps } = useVideoConfig();
  const insets = { top: p.safeTop, bottom: p.safeBottom, left: p.safeLeft, right: p.safeRight };
  const whole = fullSafeBox(insets);

  const hookDur = frames(p.hookSeconds, fps);
  const holdFrames = frames(p.lineSeconds, fps);
  const linesDur = holdFrames * p.lines.length;
  const punchDur = p.punchline ? frames(p.punchSeconds, fps) : 0;
  const ctaDur = frames(p.ctaSeconds, fps);

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
          lines={[
            { text: p.hookLine1, color: BRAND.white },
            { text: p.hookLine2, color: BRAND.pink },
          ]}
          subtext={p.hookSubtext}
          accentWords={p.accentWords}
          exitAt={exitBefore(hookDur, p.hookLine1, p.hookLine2, p.hookSubtext)}
        />
      </Sequence>

      <Sequence from={hookDur} durationInFrames={linesDur}>
        <Lines p={p} holdFrames={holdFrames} />
      </Sequence>

      {punchDur > 0 ? (
        <Sequence from={hookDur + linesDur} durationInFrames={punchDur}>
          <Hook
            box={whole}
            fontSize={p.punchFontSize}
            lines={[{ text: p.punchline, color: BRAND.white }]}
            accentWords={p.accentWords}
            exitAt={exitBefore(punchDur, p.punchline)}
          />
        </Sequence>
      ) : null}

      <Sequence from={hookDur + linesDur + punchDur} durationInFrames={ctaDur}>
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

/**
 * Length follows the CONTENT: add a line and the reel gets longer on its own.
 * That is the whole point — reel #12 is a different array, not a re-timed edit.
 */
export const t4CalloutDuration = (
  p: Pick<
    T4CalloutProps,
    "hookSeconds" | "lineSeconds" | "punchSeconds" | "ctaSeconds" | "lines" | "punchline"
  >,
  fps = 30
) =>
  frames(p.hookSeconds, fps) +
  frames(p.lineSeconds, fps) * p.lines.length +
  (p.punchline ? frames(p.punchSeconds, fps) : 0) +
  frames(p.ctaSeconds, fps);
