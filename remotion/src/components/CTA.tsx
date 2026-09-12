/**
 * Closing CTA — the wordmark, and how loudly we ask.
 *
 * The wordmark itself is IDENTICAL in every template: same <Wordmark/>, same
 * geometry, same pink dot. Only the surrounding volume changes, and only via
 * `variant`, so no template can invent its own sign-off:
 *
 *   quiet     logo + handle. T2 and T5 — let the reveal / the globe be the
 *             last thing felt; an urgency line would break the spell.
 *   standard  logo + handle + url + launch line. The default.
 *   urgent    same, larger launch line in pink. T3, where the tempo earns it.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BRAND } from "../brand";
import { SafeInsets } from "../safe-areas";
import { Box, fullSafeBox } from "../layout";
import { textStyle } from "../type";
import { Band } from "./Text";
import { Wordmark } from "./Wordmark";

export type CTAVariant = "quiet" | "standard" | "urgent";

export const CTA: React.FC<{
  variant?: CTAVariant;
  launchLine?: string;
  /** Preferred: a band from splitSafeArea(). */
  box?: Box;
  insets?: Partial<SafeInsets>;
  logoSize?: number;
  metaFontSize?: number;
  launchFontSize?: number;
  align?: "start" | "center" | "end";
  offsetY?: number;
  /**
   * Card background. Defaults to the brand dark so the CTA works standalone;
   * pass "transparent" to drop it onto a composition's own animated background.
   */
  background?: string;
}> = ({
  variant = "standard",
  launchLine = BRAND.launchLine,
  box,
  insets,
  logoSize = 104,
  metaFontSize = 36,
  launchFontSize,
  align = "center",
  offsetY = 0,
  background = BRAND.bgDark,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 200 } });
  const meta = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const urgency = spring({ frame: frame - 18, fps, config: { damping: 200 } });

  const showUrl = variant !== "quiet";
  const showLaunch = variant !== "quiet";
  const launchSize = launchFontSize ?? (variant === "urgent" ? 40 : 32);
  const target = box ?? fullSafeBox(insets);

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <Band box={target} align={align} offsetY={offsetY}>
        <div
          style={{
            opacity: logo,
            transform: `scale(${interpolate(logo, [0, 1], [0.9, 1])})`,
          }}
        >
          <Wordmark size={logoSize} />
        </div>
        <div style={{ marginTop: 44, opacity: meta, textAlign: "center" }}>
          <div style={textStyle("support", { fontSize: metaFontSize, color: BRAND.grayHandle })}>
            {BRAND.handle}
          </div>
          {showUrl ? (
            <div
              style={{
                ...textStyle("support", {
                  fontSize: metaFontSize * 0.78,
                  color: BRAND.grayUrl,
                }),
                marginTop: 8,
              }}
            >
              {BRAND.url}
            </div>
          ) : null}
        </div>
        {showLaunch && launchLine ? (
          <div
            style={{
              ...textStyle("caption", { fontSize: launchSize }),
              marginTop: 52,
              opacity: urgency,
              transform: `translateY(${interpolate(urgency, [0, 1], [16, 0])}px)`,
            }}
          >
            {launchLine}
          </div>
        ) : null}
      </Band>
    </AbsoluteFill>
  );
};
