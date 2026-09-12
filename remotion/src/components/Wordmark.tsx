/**
 * The SideQuest wordmark. Geometry is locked to the real logo export — the dot
 * sits ON the text baseline, not floating. Never restyle this per reel.
 */
import React from "react";
import { BRAND } from "../brand";

export const Wordmark: React.FC<{ size?: number; color?: string }> = ({
  size = 100,
  color = BRAND.white,
}) => {
  const scale = size / BRAND.logoFontSize;
  const dot = BRAND.dotRadius * 2 * scale;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1 }}>
      <span
        style={{
          fontFamily: BRAND.fontFamily,
          fontWeight: 900,
          fontSize: size,
          letterSpacing: BRAND.logoTracking * scale,
          color,
        }}
      >
        {BRAND.wordmark}
      </span>
      <span
        style={{
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: BRAND.pink,
          marginLeft: BRAND.dotGap * scale,
          marginBottom: 0,
        }}
      />
    </div>
  );
};
