/**
 * The accents on T2's reveal: a small scale pop, a subtle bloom, and the lock
 * fading out. The reveal itself is the MACRO-DROP in the camera (Phone.tsx
 * `macro`): the shot opens locked in at ~4x on one detail of the UI and
 * whips out to the full phone. So this layer stays quiet.
 *
 * No blur and no dimming, ever: the app's UI is sharp and at full brightness
 * from the first frame (blur removed 2026-09-25 for mushing the UI; the dark
 * veil went with the macro-drop the same day).
 *
 * Wraps anything: the 3D phone, a flat capture, a card.
 */
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { textStyle } from "../type";

export const PopReveal: React.FC<{
  /** Frame of the reveal (the camera whip starts here). */
  revealFrame: number;
  /** How long the lock takes to go. */
  revealFrames?: number;
  /** White flash at the reveal, 0..1. 0 disables. */
  flash?: number;
  /** Scale pop at the reveal (overshoots, then settles); 0 disables. */
  scalePunch?: number;
  /** Padlock + label on the phone until the reveal. Omit the label for just the lock. */
  showLock?: boolean;
  lockLabel?: string;
  lockOffsetY?: number;
  children: React.ReactNode;
}> = ({
  revealFrame,
  revealFrames = 8,
  flash = 0,
  scalePunch = 0.03,
  showLock = true,
  lockLabel,
  lockOffsetY = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </AbsoluteFill>

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
