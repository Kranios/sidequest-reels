/**
 * THE FINISH — the last layer of every template.
 *
 *   grade  a gentle contrast + saturation lift, `GRADE_FILTER`. It is applied
 *          to the BACKGROUND (AnimatedBackground), not to the whole frame:
 *          rule 3 says the app's screens must look exactly like the app, and
 *          a frame-wide grade would shift the UI's colours on the phone.
 *   grain  animated film grain over everything: feTurbulence with a new seed
 *          every frame, grey, at ~4 % (`grain`). It removes the sterile
 *          "rendered" look of flat gradients, and the noise also raises the
 *          encoded bitrate of dark, still reels (see qa.py's 4.0 Mbps floor).
 *   sweep  optional: one diagonal light glint across the phone's glass,
 *          clipped to the phone's outline in the stage band. T2 fires it on
 *          the reveal.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Box } from "../layout";

export const GRADE_FILTER = "contrast(1.06) saturate(1.08)";

/** The phone body's width / height, and its corner radius as a share of width. */
const BODY_ASPECT = 0.485;
const BODY_RADIUS = 0.13;
const SWEEP_FRAMES = 16;

export const Grade: React.FC<{
  /** Grain opacity, 0..1. ~0.04 reads as film, 0.1 as noise. */
  grain?: number;
  /** Frame the glint starts crossing the phone; omit for none. */
  sweepAt?: number;
  /** The stage band and fill the phone was framed with. */
  sweepBand?: Box;
  sweepFill?: number;
  sweepStrength?: number;
}> = ({ grain = 0.04, sweepAt, sweepBand, sweepFill = 0.95, sweepStrength = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  let sweep: React.ReactNode = null;
  if (sweepAt !== undefined && sweepBand && frame >= sweepAt && frame <= sweepAt + SWEEP_FRAMES) {
    const t = interpolate(frame, [sweepAt, sweepAt + SWEEP_FRAMES], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
    });
    const h = sweepBand.height * sweepFill;
    const w = h * BODY_ASPECT;
    const left = sweepBand.left + (sweepBand.width - w) / 2;
    const top = sweepBand.top + (sweepBand.height - h) / 2;
    // The band travels from off the left edge to off the right edge.
    const x = interpolate(t, [0, 1], [-60, 160]);
    const fade = Math.sin(t * Math.PI);
    sweep = (
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: h,
          borderRadius: w * BODY_RADIUS,
          overflow: "hidden",
          mixBlendMode: "screen",
          opacity: sweepStrength * fade,
          background: `linear-gradient(115deg, rgba(255,255,255,0) ${x - 18}%, rgba(255,255,255,0.9) ${x}%, rgba(255,255,255,0) ${x + 18}%)`,
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {sweep}
      {grain > 0 ? (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "overlay" }}
        >
          <filter id={`grain-${frame}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              seed={frame + 1}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain-${frame})`} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
