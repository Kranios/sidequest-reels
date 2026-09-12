/**
 * Feature chips — pill labels that spring in from the left, one after another
 * with staggered timing.
 *
 * These are READABLE, so they live in a TEXT BAND (see src/layout.ts), never
 * in the phone's stage band. That is what keeps them off the screen — the old
 * arrangement shared one box with the phone and relied on offsetY nudges.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { SafeInsets } from "../safe-areas";
import { Box, boxStyle, fullSafeBox } from "../layout";

export const FeatureChips: React.FC<{
  chips: string[];
  /** Preferred: a text band from splitSafeArea(). */
  box?: Box;
  insets?: Partial<SafeInsets>;
  align?: "start" | "center" | "end";
  /** Nudge the chip column horizontally within the safe box. */
  offsetX?: number;
  /** Nudge the chip column vertically within the safe box. */
  offsetY?: number;
  fontSize?: number;
  /** Vertical gap between chips, px. */
  gap?: number;
  /** Frames between each chip's entrance. */
  stagger?: number;
  /** Frames to wait before the first chip enters. */
  startFrame?: number;
}> = ({
  chips,
  box,
  insets,
  align = "start",
  offsetX = 0,
  offsetY = 0,
  fontSize = 34,
  gap = 20,
  stagger = 7,
  startFrame = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const target = box ?? fullSafeBox(insets);

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div style={{ ...boxStyle(target, align, offsetY), alignItems: "flex-start" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap,
            transform: `translateX(${offsetX}px)`,
          }}
        >
          {chips.map((label, i) => {
            const s = spring({
              frame: frame - startFrame - i * stagger,
              fps,
              config: { damping: 200, stiffness: 120 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [-90, 0])}px)`,
                  padding: `${Math.round(fontSize * 0.42)}px ${Math.round(fontSize * 0.9)}px`,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.38)",
                  backdropFilter: "blur(6px)",
                  fontFamily: BRAND.fontFamily,
                  fontWeight: 900,
                  fontSize,
                  lineHeight: 1,
                  color: BRAND.white,
                  whiteSpace: "nowrap",
                  textShadow: "0 2px 12px rgba(0,0,0,0.45)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
