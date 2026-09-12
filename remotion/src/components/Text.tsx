/**
 * The only place text is drawn.
 *
 * Every template renders copy through <HookText>, <SupportText> or
 * <CaptionText>, and every one of those is positioned by a <Band> from
 * layout.ts. Two rules fall out of that and hold across all five templates:
 *   1. the hierarchy can't drift — the styles come from type.ts;
 *   2. text can't land on the phone — it is confined to a text band.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Box, boxStyle } from "../layout";
import { textStyle } from "../type";

/** A positioned text band. Children are laid out as a centred column. */
export const Band: React.FC<{
  box: Box;
  align?: "start" | "center" | "end";
  offsetY?: number;
  gap?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ box, align = "center", offsetY = 0, gap = 0, style, children }) => (
  <div style={{ ...boxStyle(box, align, offsetY), gap, ...style }}>{children}</div>
);

export type HookLine = { text: string; color?: string };

/**
 * The scroll-stopper. Words land one at a time, in reading order across all
 * lines, so the eye is pulled through the sentence instead of at it.
 */
export const HookText: React.FC<{
  lines: HookLine[];
  fontSize?: number;
  wordStagger?: number;
  startFrame?: number;
  wordGap?: number;
}> = ({ lines, fontSize, wordStagger = 4, startFrame = 0, wordGap = 16 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let order = 0;
  return (
    <>
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: wordGap,
          }}
        >
          {line.text.split(" ").map((word) => {
            const i = order++;
            const s = spring({
              frame: frame - startFrame - i * wordStagger,
              fps,
              config: { damping: 200, stiffness: 120 },
            });
            return (
              <span
                key={i}
                style={{
                  ...textStyle("hook", { fontSize, color: line.color }),
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};

/** The calm second line. Fades in after the hook has landed. */
export const SupportText: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
  marginTop?: number;
}> = ({ text, fontSize, color, delay = 0, marginTop = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ ...textStyle("support", { fontSize, color }), opacity, marginTop }}>
      {text}
    </div>
  );
};

/** The one pink line that names the payoff. */
export const CaptionText: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
}> = ({ text, fontSize, color, delay = 4 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ ...textStyle("caption", { fontSize, color }), opacity }}>{text}</div>;
};
