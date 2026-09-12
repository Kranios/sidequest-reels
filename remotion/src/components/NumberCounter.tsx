/**
 * A number that counts up and settles. T1's whole opening depends on this.
 *
 * Research note baked in: specific figures read as receipts, round ones read
 * as marketing. So the formatter keeps every digit you give it — 2847 stays
 * 2,847 and never gets prettied into 3k.
 *
 * Formatting is done by hand rather than with Intl, so the same frame renders
 * the same string in Studio, in `remotion render`, and on any machine.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { textStyle, TextTier } from "../type";

export const formatNumber = (
  n: number,
  decimals = 0,
  thousands = ",",
  decimalMark = "."
) => {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  return `${neg ? "-" : ""}${grouped}${frac ? decimalMark + frac : ""}`;
};

export const NumberCounter: React.FC<{
  /** The figure it lands on. */
  value: number;
  /** Where the count starts. */
  from?: number;
  /** Frames to wait before counting. */
  delay?: number;
  /** Higher = slower, heavier settle. */
  damping?: number;
  stiffness?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  thousandsSeparator?: string;
  decimalMark?: string;
  tier?: TextTier;
  fontSize?: number;
  color?: string;
  /** Fade/rise the whole figure in with the count. */
  rise?: boolean;
  style?: React.CSSProperties;
}> = ({
  value,
  from = 0,
  delay = 0,
  damping = 200,
  stiffness = 60,
  prefix = "",
  suffix = "",
  decimals = 0,
  thousandsSeparator = ",",
  decimalMark = ".",
  tier = "hook",
  fontSize,
  color,
  rise = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness } });
  const current = from + (value - from) * s;

  return (
    <div
      style={{
        ...textStyle(tier, { fontSize, color }),
        // Digits change every frame; a proportional font would make the whole
        // figure shuffle sideways as it counts.
        fontVariantNumeric: "tabular-nums",
        opacity: rise ? Math.min(1, s * 3) : 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {prefix}
      {formatNumber(current, decimals, thousandsSeparator, decimalMark)}
      {suffix}
    </div>
  );
};
