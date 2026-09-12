/**
 * A running clock. Counts up for T3's speedrun, down for T2's unlock.
 *
 * Digits are laid out in fixed-width cells rather than trusting the font's
 * figures: Raleway Black is proportional, and a "1" narrower than an "8" makes
 * the whole clock twitch sideways every tick — exactly the kind of restless
 * detail the research says pulls attention off the product.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BRAND } from "../brand";
import { textStyle } from "../type";

export type TimerFormat = "mm:ss" | "s.t" | "s";

const pad = (n: number, w = 2) => Math.floor(n).toString().padStart(w, "0");

export const formatClock = (seconds: number, format: TimerFormat) => {
  const t = Math.max(0, seconds);
  if (format === "mm:ss") return `${pad(t / 60)}:${pad(t % 60)}`;
  if (format === "s.t") return `${Math.floor(t)}.${Math.floor((t % 1) * 10)}`;
  return `${Math.floor(t)}`;
};

export const Timer: React.FC<{
  direction?: "up" | "down";
  /** Seconds on the clock when it starts. */
  startSeconds?: number;
  /** Clamp: counting up stops here, counting down stops here (default 0). */
  endSeconds?: number;
  /** Frame the clock starts moving. */
  startFrame?: number;
  /** Clock seconds per real second — >1 for a compressed "5-day trip" run. */
  rate?: number;
  format?: TimerFormat;
  fontSize?: number;
  color?: string;
  /** Small word above the clock, e.g. "UNLOCKS IN" or "ELAPSED". */
  label?: string;
  /** Draw it as a pill so it reads as HUD, not as copy. */
  pill?: boolean;
  /** Pulse the pill each whole second. Off for the calm templates. */
  tick?: boolean;
}> = ({
  direction = "up",
  startSeconds = 0,
  endSeconds,
  startFrame = 0,
  rate = 1,
  format = "mm:ss",
  fontSize = 46,
  color = BRAND.white,
  label,
  pill = true,
  tick = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, (frame - startFrame) / fps) * rate;
  const raw = direction === "up" ? startSeconds + elapsed : startSeconds - elapsed;
  const limit = endSeconds ?? (direction === "up" ? Infinity : 0);
  const value = direction === "up" ? Math.min(raw, limit) : Math.max(raw, limit);
  const text = formatClock(value, format);

  const secondPhase = value - Math.floor(value);
  const pulse = tick
    ? interpolate(secondPhase, [0, 0.12, 1], [1.06, 1, 1], { extrapolateRight: "clamp" })
    : 1;

  const digit = fontSize * 0.62;
  const sep = fontSize * 0.3;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        transform: `scale(${pulse})`,
        padding: pill ? `${Math.round(fontSize * 0.28)}px ${Math.round(fontSize * 0.5)}px` : 0,
        borderRadius: 999,
        background: pill ? "rgba(255,255,255,0.10)" : undefined,
        border: pill ? "1px solid rgba(255,255,255,0.34)" : undefined,
      }}
    >
      {label ? (
        <div
          style={{
            ...textStyle("support", { fontSize: Math.round(fontSize * 0.36), color: BRAND.graySub }),
            letterSpacing: 3,
          }}
        >
          {label.toUpperCase()}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center" }}>
        {text.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              ...textStyle("hook", { fontSize, color }),
              width: /\d/.test(ch) ? digit : sep,
              textAlign: "center",
              display: "inline-block",
              letterSpacing: 0,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
};
