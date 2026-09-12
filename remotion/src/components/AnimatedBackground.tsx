/**
 * Full-bleed animated background — DELIBERATELY ignores the safe area.
 *
 * Three soft radial light blobs (two pink, one teal) drift slowly under heavy
 * blur, with a vignette on top so anything readable layered above stays legible.
 *
 * This is a FULL-BLEED layer (see the three framing tiers in Phone.tsx): it
 * runs off every edge on purpose. Never put readable text in here.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";

const TEAL = "#7FD8D0";

/** `#RRGGBB` + alpha -> `rgba(...)`, so the gradients can fade to clear. */
const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

type Blob = {
  color: string;
  size: number; // diameter, fraction of canvas width
  x: number; // base centre X, fraction of width
  y: number; // base centre Y, fraction of height
  ax: number; // drift amplitude X, fraction of width
  ay: number; // drift amplitude Y, fraction of height
  phase: number; // radians, so the blobs don't move in lockstep
  rate: number; // relative drift rate
};

const BLOBS: Blob[] = [
  { color: BRAND.pink, size: 1.15, x: 0.26, y: 0.3, ax: 0.1, ay: 0.08, phase: 0.0, rate: 1.0 },
  { color: BRAND.pink, size: 0.95, x: 0.8, y: 0.74, ax: 0.12, ay: 0.1, phase: 2.1, rate: 0.78 },
  { color: TEAL, size: 1.05, x: 0.62, y: 0.16, ax: 0.09, ay: 0.12, phase: 4.0, rate: 1.24 },
];

export const AnimatedBackground: React.FC<{
  /** Blob opacity multiplier. 0 = flat dark, 1 = designed, >1 = loud. */
  intensity?: number;
  /** Drift speed multiplier. 0 freezes the blobs, 1 is the design pace. */
  speed?: number;
  /** Blur radius in px applied to the whole blob layer. */
  blur?: number;
  /** Vignette strength, 0..1 — how hard the edges darken for text contrast. */
  vignette?: number;
}> = ({ intensity = 1, speed = 1, blur = 130, vignette = 0.78 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * speed;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDark, overflow: "hidden" }}>
      {/* saturate() is what stops heavy blur turning pink + teal into grey
          mud — without it the blobs read as dirty shadow on a dark ground. */}
      <AbsoluteFill style={{ filter: `blur(${blur}px) saturate(1.35)` }}>
        {BLOBS.map((b, i) => {
          const d = b.size * width;
          const cx = b.x * width + Math.sin(t * b.rate + b.phase) * b.ax * width;
          const cy = b.y * height + Math.cos(t * b.rate * 0.9 + b.phase) * b.ay * height;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: d,
                height: d,
                left: cx - d / 2,
                top: cy - d / 2,
                borderRadius: "50%",
                background: `radial-gradient(circle at 50% 50%, ${b.color} 0%, ${hexA(
                  b.color,
                  0.32
                )} 42%, ${hexA(b.color, 0)} 70%)`,
                opacity: Math.min(1, 0.62 * intensity),
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* Vignette — keeps hook / caption / CTA readable over the blobs. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(10,9,8,0) 30%, rgba(10,9,8,${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
