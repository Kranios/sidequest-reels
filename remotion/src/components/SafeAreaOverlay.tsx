/**
 * Dev-only guide showing exactly where Instagram's UI will cover the frame.
 * Toggle it in Remotion Studio while composing, keep it OFF when rendering.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { getSafeArea, SafeInsets } from "../safe-areas";

export const SafeAreaOverlay: React.FC<{
  insets?: Partial<SafeInsets>;
}> = ({ insets }) => {
  const s = getSafeArea(insets);
  const band: React.CSSProperties = {
    position: "absolute",
    background: "rgba(255,0,80,0.22)",
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...band, top: 0, left: 0, right: 0, height: s.top }} />
      <div style={{ ...band, bottom: 0, left: 0, right: 0, height: s.bottom }} />
      <div style={{ ...band, top: s.top, bottom: s.bottom, left: 0, width: s.left }} />
      <div style={{ ...band, top: s.top, bottom: s.bottom, right: 0, width: s.right }} />
      <div
        style={{
          position: "absolute",
          top: s.top,
          left: s.left,
          width: s.width,
          height: s.height,
          border: "2px dashed rgba(255,255,255,0.6)",
        }}
      />
    </AbsoluteFill>
  );
};
