/**
 * Hard cuts through a series of screens. T3's engine.
 *
 * It doesn't know what a screen IS — it hands you a source and a index and you
 * render whatever you like (the 3D phone with that capture on it, a flat
 * still, a card). That keeps it usable for a phone-led speedrun and for a
 * flat-capture montage without branching.
 *
 * Each screen is its own <Sequence>, so a phone rendered inside gets a fresh
 * mount and its own video — which is exactly why the cuts are real cuts.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export type SwapTransition = "cut" | "whip" | "slide" | "punch";

const Enter: React.FC<{
  transition: SwapTransition;
  frames: number;
  children: React.ReactNode;
}> = ({ transition, frames, children }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  if (transition === "cut" || frames <= 0) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const t = interpolate(frame, [0, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Ease-out: fast off the mark, settled well before the screen is read.
  const e = 1 - Math.pow(1 - t, 3);

  let transform = "";
  let filter: string | undefined;

  if (transition === "whip") {
    transform = `translateX(${interpolate(e, [0, 1], [width * 0.55, 0])}px)`;
    const b = interpolate(e, [0, 0.6, 1], [26, 4, 0]);
    filter = b > 0.2 ? `blur(${b}px)` : undefined;
  } else if (transition === "slide") {
    transform = `translateX(${interpolate(e, [0, 1], [width, 0])}px)`;
  } else {
    transform = `scale(${interpolate(e, [0, 1], [1.14, 1])})`;
  }

  return <AbsoluteFill style={{ transform, filter }}>{children}</AbsoluteFill>;
};

export const ScreenSwapper: React.FC<{
  sources: string[];
  /** Frames per screen — one number for all, or one per source. */
  holdFrames: number | number[];
  transition?: SwapTransition;
  transitionFrames?: number;
  startFrame?: number;
  children: (src: string, index: number) => React.ReactNode;
}> = ({
  sources,
  holdFrames,
  transition = "whip",
  transitionFrames = 7,
  startFrame = 0,
  children,
}) => {
  const holds = sources.map((_, i) =>
    Array.isArray(holdFrames) ? holdFrames[i] ?? holdFrames[holdFrames.length - 1] : holdFrames
  );

  let cursor = startFrame;
  return (
    <AbsoluteFill>
      {sources.map((src, i) => {
        const from = cursor;
        cursor += holds[i];
        return (
          <Sequence key={`${src}-${i}`} from={from} durationInFrames={holds[i]}>
            <Enter transition={i === 0 ? "cut" : transition} frames={transitionFrames}>
              {children(src, i)}
            </Enter>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
