/**
 * Blur -> sharp, with a lock over the top. T2's entire premise.
 *
 * The research point this implements: a pattern interrupt has to be SUSTAINED.
 * One weird frame then ten normal ones loses people faster than no interrupt
 * at all — so the blur holds for most of the shot and the reveal is the last
 * thing that happens, not the first.
 *
 * But a blur that simply sits there reads as "nothing is happening", and
 * viewers leave before it lifts. So the hold is not static: the blur EASES
 * from `maxBlur` down to `teaseBlur` across the whole hold, so the screen is
 * almost legible just before the reveal and the viewer sees it coming. Then
 * it SNAPS: an exponential ease-out over `revealFrames` (6-10 reads as a cut,
 * not a fade), a scale pop on an underdamped spring, and an optional white
 * bloom on the phone that decays over 6 frames.
 *
 * Wraps anything: the 3D phone, a flat capture, a card.
 */
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { textStyle } from "../type";

export const BlurReveal: React.FC<{
  /** Frame the blur starts lifting. */
  revealFrame: number;
  /** How long the lift takes. */
  revealFrames?: number;
  /** Blur radius at frame 0, px. */
  maxBlur?: number;
  /** Blur radius reached just before the reveal, px. = maxBlur holds flat. */
  teaseBlur?: number;
  /** White flash at the reveal, 0..1. 0 disables. */
  flash?: number;
  /** Extra darkening while hidden, 0..1. */
  dim?: number;
  /** Scale pop at the reveal (overshoots, then settles); 0 disables. */
  scalePunch?: number;
  /** Padlock + label sitting on the blur. Omit the label for just the lock. */
  showLock?: boolean;
  lockLabel?: string;
  lockOffsetY?: number;
  children: React.ReactNode;
}> = ({
  revealFrame,
  revealFrames = 8,
  maxBlur = 26,
  teaseBlur,
  flash = 0,
  dim = 0.35,
  scalePunch = 0.03,
  showLock = true,
  lockLabel,
  lockOffsetY = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tease = teaseBlur ?? maxBlur;
  // The hold: blur creeps down, faster towards the end, so tension builds.
  const holdBlur = interpolate(frame, [0, Math.max(revealFrame, 1)], [maxBlur, tease], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // The snap: most of the lift happens in the first two or three frames.
  const reveal = interpolate(frame - revealFrame, [0, Math.max(revealFrames, 1)], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Pop: underdamped, so the phone overshoots a touch and settles.
  const pop = spring({
    frame: frame - revealFrame,
    fps,
    config: { damping: 9, stiffness: 220, mass: 0.5 },
  });

  const blur = frame < revealFrame ? holdBlur : tease * (1 - reveal);
  const scale = 1 + scalePunch * (1 - pop);
  const flashOpacity =
    flash > 0 && frame >= revealFrame
      ? flash *
        interpolate(frame - revealFrame, [0, 6], [1, 0], {
          easing: Easing.out(Easing.quad),
          extrapolateRight: "clamp",
        })
      : 0;
  const lockOpacity = interpolate(reveal, [0, 0.35], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {dim > 0 ? (
        <AbsoluteFill
          style={{
            background: `rgba(10,9,8,${dim * (1 - reveal)})`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {flashOpacity > 0.001 ? (
        <AbsoluteFill
          // A bloom centred on the phone, not a full-frame wash: a flat white
          // layer over a dark reel reads as a grey fog, not a flash.
          style={{
            background: `radial-gradient(ellipse 42% 30% at 50% calc(50% + ${lockOffsetY}px), rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 72%)`,
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {showLock ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: lockOpacity,
            transform: `translateY(${lockOffsetY}px) scale(${interpolate(
              lockOpacity,
              [0, 1],
              [1.25, 1]
            )})`,
            pointerEvents: "none",
          }}
        >
          <Padlock />
          {lockLabel ? (
            <div style={{ ...textStyle("support", { color: BRAND.white }), marginTop: 22 }}>
              {lockLabel}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Inline SVG so the lock can never be a missing asset in a render. */
const Padlock: React.FC<{ size?: number }> = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M15 21v-6a9 9 0 0 1 18 0v6"
      stroke={BRAND.white}
      strokeWidth={4}
      strokeLinecap="round"
    />
    <rect x={10} y={21} width={28} height={20} rx={5} fill={BRAND.pink} />
    <circle cx={24} cy={30} r={3} fill={BRAND.bgDark} />
    <rect x={22.6} y={30} width={2.8} height={6} rx={1.4} fill={BRAND.bgDark} />
  </svg>
);
