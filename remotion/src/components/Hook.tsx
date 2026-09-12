/**
 * Opening hook: words land one at a time, inside a text band.
 *
 * This is what stops the scroll, so it gets the whole first beat and never
 * shares space with the phone — pass the `top` (or `stage`) band from
 * splitSafeArea(). Without a box it falls back to the whole safe area, which
 * is right for a text-only opening where nothing else is on screen.
 *
 * Styling comes from the shared hierarchy (src/type.ts). Templates choose
 * words and sizes, never fonts, colours or shadows.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { Box, fullSafeBox } from "../layout";
import { SafeInsets } from "../safe-areas";
import { Band, HookLine, HookText, SupportText } from "./Text";

export type { HookLine };

export const Hook: React.FC<{
  lines: HookLine[];
  subtext?: string;
  /** Preferred: a band from splitSafeArea(). */
  box?: Box;
  /** Fallback when no box is given — the whole safe area. */
  insets?: Partial<SafeInsets>;
  fontSize?: number;
  subFontSize?: number;
  align?: "start" | "center" | "end";
  offsetY?: number;
  wordStagger?: number;
  startFrame?: number;
}> = ({
  lines,
  subtext,
  box,
  insets,
  fontSize,
  subFontSize,
  align = "center",
  offsetY = 0,
  wordStagger = 4,
  startFrame = 0,
}) => {
  const target = box ?? fullSafeBox(insets);
  const wordCount = lines.reduce((n, l) => n + l.text.split(" ").length, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <Band box={target} align={align} offsetY={offsetY}>
        <HookText
          lines={lines}
          fontSize={fontSize}
          wordStagger={wordStagger}
          startFrame={startFrame}
        />
        {subtext ? (
          <SupportText
            text={subtext}
            fontSize={subFontSize}
            delay={startFrame + wordCount * wordStagger}
            marginTop={36}
          />
        ) : null}
      </Band>
    </AbsoluteFill>
  );
};
