/**
 * THE TEXT HIERARCHY — three styles, one definition, all five templates.
 *
 * The research constraint this encodes: consistency is what makes a set of
 * reels look designed rather than assembled. So a template never invents its
 * own typography. It picks a TIER and may scale it; it may not restyle it.
 *
 *   hook     the scroll-stopper. 6-8 words max, white, huge, tight tracking.
 *   support  the second line under a hook, or a row label. Grey, calm.
 *   caption  the one pink line that names the payoff. Never competes with the
 *            hook — they are never on screen at full strength together.
 *
 * Every tier is Raleway Black (900) on purpose: the brand has one weight.
 */
import { BRAND } from "./brand";

export type TextTier = "hook" | "support" | "caption";

type TierSpec = {
  /** Design size at 1080x1920. Templates scale this, they don't replace it. */
  fontSize: number;
  color: string;
  lineHeight: number;
  /** px at the tier's design size; scaled with fontSize by textStyle(). */
  letterSpacing: number;
  textShadow: string;
};

export const TEXT: Record<TextTier, TierSpec> = {
  hook: {
    fontSize: 82,
    color: BRAND.white,
    lineHeight: 1.08,
    letterSpacing: -2.4,
    textShadow: "0 4px 28px rgba(0,0,0,0.6)",
  },
  support: {
    fontSize: 34,
    color: BRAND.graySub,
    lineHeight: 1.34,
    letterSpacing: 0,
    textShadow: "0 2px 14px rgba(0,0,0,0.5)",
  },
  caption: {
    fontSize: 44,
    color: BRAND.pink,
    lineHeight: 1.2,
    letterSpacing: -0.8,
    textShadow: "0 4px 20px rgba(0,0,0,0.6)",
  },
};

/**
 * A tier as CSS. `fontSize` overrides the design size and letter-spacing
 * follows it proportionally, so a scaled hook still looks like the hook rather
 * than a differently-tracked cousin. `color` is the one other legal override —
 * templates use it for a single emphasised word, not for a new palette.
 */
export const textStyle = (
  tier: TextTier,
  overrides?: { fontSize?: number; color?: string; align?: React.CSSProperties["textAlign"] }
): React.CSSProperties => {
  const t = TEXT[tier];
  const fontSize = overrides?.fontSize ?? t.fontSize;
  return {
    fontFamily: BRAND.fontFamily,
    fontWeight: 900,
    fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing * (fontSize / t.fontSize),
    color: overrides?.color ?? t.color,
    textShadow: t.textShadow,
    textAlign: overrides?.align ?? "center",
    margin: 0,
  };
};
