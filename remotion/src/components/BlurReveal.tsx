/**
 * Blur -> sharp, with a lock over the top. T2's entire premise.
 *
 * The research point this implements: a pattern interrupt has to be SUSTAINED.
 * One weird frame then ten normal ones loses people faster than no interrupt
 * at all — so the blur holds for most of the shot and the reveal is the last
 * thing that happens, not the first.
 *
 * Wraps anything: the 3D phone, a flat capture, a card.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { textStyle } from "../type";

export const BlurReveal: React.FC<{
  /** Frame the blur starts lifting. */
  revealFrame: number;
  /** How long the lift takes. */
  revealFrames?: number;
  /** Blur radius while hidden, px. */
  maxBlur?: number;
  /** Extra darkening while hidden, 0..1. */
  dim?: number;
  /** Slight push-in as it sharpens; 0 disables. */
  scalePunch?: number;
  /** Padlock + label sitting on the blur. Omit the label for just the lock. */
  showLock?: boolean;
  lockLabel?: string;
  lockOffsetY?: number;
  children: React.ReactNode;
}> = ({
  revealFrame,
  revealFrames = 18,
  maxBlur = 26,
  dim = 0.35,
  scalePunch = 0.03,
  showLock = true,
  lockLabel,
  lockOffsetY = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring so it snaps clear rather than easing politely into focus.
  const reveal = spring({
    frame: frame - revealFrame,
    fps,
    durationInFrames: revealFrames,
    config: { damping: 200, stiffness: 90 },
  });

  const blur = interpolate(reveal, [0, 1], [maxBlur, 0]);
  const scale = 1 + scalePunch * (1 - reveal);
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
