/**
 * The only place text is drawn.
 *
 * Every template renders copy through <HookText>, <SupportText> or
 * <CaptionText>, and every one of those is positioned by a <Band> from
 * layout.ts. Two rules fall out of that and hold across all five templates:
 *   1. the hierarchy can't drift — the styles come from type.ts;
 *   2. text can't land on the phone — it is confined to a text band.
 *
 * MOTION. All three tiers share one kinetic word (<MaskedWord>). Each word
 * rises into place from behind its own mask (overflow: hidden, translateY
 * 110% -> 0) on an UNDERDAMPED spring. It overshoots a hair and settles, so
 * it has weight; the old version faded in with damping 200 and felt polite.
 * Two options on top:
 *   - accentWords: those words turn pink and pop in scale once they land.
 *     Use it for the one figure or noun the line is about, not for decoration.
 *   - exitAt: the frame (in the enclosing Sequence) where the words start to
 *     drop back behind their masks, in reading order. Set it ~12 frames
 *     before the Sequence ends, and the copy leaves instead of being cut.
 */
import React from "react";
import { Easing, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { Box, boxStyle } from "../layout";
import { TextTier, textStyle } from "../type";

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

// Entrance: quick off the mark, a small overshoot, settled in ~0.5 s.
const ENTER_SPRING = { damping: 14, stiffness: 160, mass: 0.6 };
// Support and caption lines are the calm tiers: same move, less bounce.
const CALM_SPRING = { damping: 20, stiffness: 150, mass: 0.6 };
const EXIT_FRAMES = 9;
const EXIT_STAGGER = 2;
const POP_FRAMES = 10;
const POP_SCALE = 0.14;

/**
 * exitAt for copy that must be gone by frame `end` (usually the enclosing
 * Sequence's duration): late enough to read, early enough that the LAST word
 * has dropped out before the cut. Pass every string the exit covers.
 */
export const exitBefore = (end: number, ...texts: string[]) => {
  const words = texts.join(" ").split(" ").filter(Boolean).length;
  return Math.max(0, end - EXIT_FRAMES - Math.max(words - 1, 0) * EXIT_STAGGER - 1);
};

/** Lower-case, trailing punctuation off: "cost." matches accent "Cost". */
const norm = (w: string) => w.toLowerCase().replace(/^["'“]+|[.,!?:;"'”]+$/g, "");

const MaskedWord: React.FC<{
  word: string;
  style: React.CSSProperties;
  /** Frame (in the enclosing Sequence) the word starts rising. */
  start: number;
  /** Frame it starts dropping out; undefined = it stays. */
  exitStart?: number;
  accent?: boolean;
  config: typeof ENTER_SPRING;
}> = ({ word, style, start, exitStart, accent, config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - start, fps, config });
  const exit =
    exitStart === undefined
      ? 0
      : interpolate(frame, [exitStart, exitStart + EXIT_FRAMES], [0, 1], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const y = (1 - enter) * 110 + exit * 110;

  // The pop starts once the word has mostly landed.
  const popT = interpolate(frame - start - 6, [0, POP_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = accent ? 1 + POP_SCALE * Math.sin(popT * Math.PI) : 1;

  return (
    // The mask is padded (and pulled back with negative margins) so it clips
    // the travelling word, not the glyphs' descenders or their text shadow.
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        padding: "0.08em 0.12em 0.1em",
        margin: "-0.08em -0.12em -0.1em",
        verticalAlign: "top",
      }}
    >
      <span
        style={{
          ...style,
          ...(accent ? { color: BRAND.pink } : null),
          display: "inline-block",
          opacity: frame < start ? 0 : 1,
          transform: `translateY(${y}%) scale(${scale})`,
          transformOrigin: "50% 80%",
        }}
      >
        {word}
      </span>
    </span>
  );
};

/** One line of words for the calm tiers, wrapping like ordinary text. */
const KineticLine: React.FC<{
  tier: TextTier;
  text: string;
  fontSize?: number;
  color?: string;
  delay: number;
  wordStagger: number;
  exitAt?: number;
  accentWords?: string[];
  style?: React.CSSProperties;
}> = ({ tier, text, fontSize, color, delay, wordStagger, exitAt, accentWords, style }) => {
  const accents = new Set((accentWords ?? []).map(norm));
  const base = textStyle(tier, { fontSize, color });
  const words = text.split(" ");
  return (
    <div style={{ ...base, ...style }}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <MaskedWord
            word={word}
            style={base}
            start={delay + i * wordStagger}
            exitStart={exitAt === undefined ? undefined : exitAt + i * EXIT_STAGGER}
            accent={accents.has(norm(word))}
            config={CALM_SPRING}
          />
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </div>
  );
};

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
  accentWords?: string[];
  exitAt?: number;
}> = ({ lines, fontSize, wordStagger = 4, startFrame = 0, wordGap = 16, accentWords, exitAt }) => {
  const accents = new Set((accentWords ?? []).map(norm));

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
            return (
              <MaskedWord
                key={i}
                word={word}
                style={textStyle("hook", { fontSize, color: line.color })}
                start={startFrame + i * wordStagger}
                exitStart={exitAt === undefined ? undefined : exitAt + i * EXIT_STAGGER}
                accent={accents.has(norm(word))}
                config={ENTER_SPRING}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};

/** The calm second line. Rises in after the hook has landed. */
export const SupportText: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
  marginTop?: number;
  accentWords?: string[];
  exitAt?: number;
}> = ({ text, fontSize, color, delay = 0, marginTop = 0, accentWords, exitAt }) => (
  <KineticLine
    tier="support"
    text={text}
    fontSize={fontSize}
    color={color}
    delay={delay}
    wordStagger={1.5}
    exitAt={exitAt}
    accentWords={accentWords}
    style={{ marginTop }}
  />
);

/** The one pink line that names the payoff. */
export const CaptionText: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
  exitAt?: number;
}> = ({ text, fontSize, color, delay = 4, exitAt }) => (
  <KineticLine
    tier="caption"
    text={text}
    fontSize={fontSize}
    color={color}
    delay={delay}
    wordStagger={1.5}
    exitAt={exitAt}
  />
);
