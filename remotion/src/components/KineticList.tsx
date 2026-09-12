/**
 * Staggered lines. Two templates, two modes, one component.
 *
 *   stack  rows accumulate, one springing in after the other.
 *          T1: "Marcus  EUR 712" ... the receipt building up.
 *   swap   one line at a time, each replacing the last.
 *          T4: punchy kinetic callout lines over the moving background.
 *
 * Rows carry an optional value on the right. When any row has one, the rows
 * become a two-column layout with a dotted leader so the eye tracks across —
 * that is what makes it read as a receipt rather than a bullet list.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { textStyle, TextTier } from "../type";

/** Frames an outgoing swap line overlaps the incoming one. */
const SWAP_OVERLAP = 5;

export type KineticItem = {
  text: string;
  /** Right-hand column (a figure, a name, a tag). Optional. */
  value?: string;
  /** Emphasis colour for this row only. */
  color?: string;
  /** Emphasis colour for this row's value only. */
  valueColor?: string;
};

export const KineticList: React.FC<{
  items: KineticItem[];
  mode?: "stack" | "swap";
  tier?: TextTier;
  fontSize?: number;
  /** stack: frames between rows. */
  stagger?: number;
  /** swap: frames each line holds before the next one takes over. */
  holdFrames?: number;
  startFrame?: number;
  rowGap?: number;
  /** stack: slide rows in from the left instead of from below. */
  fromLeft?: boolean;
  /** Width of the row block; defaults to the full band width. */
  width?: number | string;
  /** Dotted leader between text and value in stack mode. */
  leader?: boolean;
}> = ({
  items,
  mode = "stack",
  tier = "support",
  fontSize,
  stagger = 8,
  holdFrames = 30,
  startFrame = 0,
  rowGap = 18,
  fromLeft = false,
  width = "100%",
  leader = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hasValues = items.some((i) => i.value !== undefined);

  if (mode === "swap") {
    return (
      <div
        style={{
          width,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {items.map((item, i) => {
          const in0 = startFrame + i * holdFrames;
          const out0 = in0 + holdFrames;
          // The outgoing line leaves while the incoming one is already on its
          // way in. Without that overlap there is a frame or two of empty
          // screen at every swap, which reads as a stutter rather than a cut.
          const lead = Math.min(SWAP_OVERLAP, Math.max(1, holdFrames - 1));
          if (frame < in0 - lead || frame >= out0) return null;

          const enter = spring({
            frame: frame - (in0 - lead),
            fps,
            config: { damping: 200, stiffness: 170 },
          });
          const exit = interpolate(frame, [out0 - lead, out0], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          // Incoming rises from below, outgoing continues up and out, so the
          // brief overlap reads as one line rolling into the next.
          const y = interpolate(enter, [0, 1], [54, 0]) - interpolate(exit, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                ...textStyle(tier, { fontSize, color: item.color }),
                position: "absolute",
                opacity: enter * exit,
                transform: `translateY(${y}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
              }}
            >
              {item.text}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: rowGap }}>
      {items.map((item, i) => {
        const s = spring({
          frame: frame - startFrame - i * stagger,
          fps,
          config: { damping: 200, stiffness: 120 },
        });
        const shift = interpolate(s, [0, 1], [fromLeft ? -70 : 34, 0]);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: hasValues ? "space-between" : "center",
              gap: 20,
              opacity: s,
              transform: fromLeft ? `translateX(${shift}px)` : `translateY(${shift}px)`,
            }}
          >
            <div
              style={{
                ...textStyle(tier, { fontSize, color: item.color, align: "left" }),
                whiteSpace: "nowrap",
              }}
            >
              {item.text}
            </div>
            {hasValues ? (
              <>
                {leader ? (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      alignSelf: "center",
                      background:
                        "repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0 6px, transparent 6px 14px)",
                    }}
                  />
                ) : null}
                <div
                  style={{
                    ...textStyle(tier, {
                      fontSize,
                      color: item.valueColor ?? BRAND.white,
                      align: "right",
                    }),
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.value}
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
