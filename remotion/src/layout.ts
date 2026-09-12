/**
 * BANDS — the fix for "text ends up on top of the phone".
 *
 * The old arrangement had the phone and every readable layer share ONE box:
 * the safe area, each centred in it. Nothing kept them apart except manual
 * nudges (chipsOffsetY: 60 and friends). That is a coincidence, not a rule —
 * change `radius` or the insets and the text lands on the screen again.
 *
 * Here the safe area is split into three stacked bands:
 *
 *   +-----------------------+  <- SAFE_INSETS.top
 *   |   top      (text)     |
 *   +-----------------------+  } gutter
 *   |                       |
 *   |   stage    (phone,    |
 *   |             media)    |
 *   |                       |
 *   +-----------------------+  } gutter
 *   |   bottom   (text)     |
 *   +-----------------------+  <- canvas height - SAFE_INSETS.bottom
 *
 * Text renders into `top` or `bottom`. The phone is centred in `stage` and
 * sized from `stage.height`. Overlap is then geometrically impossible instead
 * of merely unlikely, and it stays impossible when the numbers change.
 *
 * A template with no phone (T4) can hand the whole safe area to text by
 * asking for one band — see fullSafeBox().
 */
import { CANVAS } from "./brand";
import { getSafeArea, SafeInsets } from "./safe-areas";

export type Box = { top: number; left: number; width: number; height: number };

export type Bands = { top: Box; stage: Box; bottom: Box };

/**
 * Split the safe area into text / stage / text.
 *
 * `topFrac` and `bottomFrac` are fractions of the SAFE height (not the canvas),
 * so the bands follow the insets automatically. `gutter` is the dead space
 * kept between a text band and the stage.
 */
export const splitSafeArea = (
  insets?: Partial<SafeInsets>,
  topFrac = 0.26,
  bottomFrac = 0.2,
  gutter = 28
): Bands => {
  const s = getSafeArea(insets);
  const clampedTop = Math.max(0, Math.min(0.8, topFrac));
  const clampedBottom = Math.max(0, Math.min(0.8, bottomFrac));
  const scale = Math.min(1, 0.95 / Math.max(clampedTop + clampedBottom, 0.0001));

  const topH = Math.round(s.height * clampedTop * scale);
  const bottomH = Math.round(s.height * clampedBottom * scale);
  const stageH = Math.max(0, s.height - topH - bottomH);
  const half = Math.round(gutter / 2);

  return {
    top: {
      top: s.top,
      left: s.left,
      width: s.width,
      height: Math.max(0, topH - half),
    },
    stage: {
      top: s.top + topH,
      left: s.left,
      width: s.width,
      height: stageH,
    },
    bottom: {
      top: s.top + topH + stageH + half,
      left: s.left,
      width: s.width,
      height: Math.max(0, bottomH - half),
    },
  };
};

/** The whole safe area as a single box — for templates with no stage. */
export const fullSafeBox = (insets?: Partial<SafeInsets>): Box => {
  const s = getSafeArea(insets);
  return { top: s.top, left: s.left, width: s.width, height: s.height };
};

/**
 * A box as an absolutely positioned flex column. `align` places content
 * vertically inside the band; `offsetY` nudges it (positive = down) and is for
 * fine-tuning only — it is no longer load-bearing for overlap.
 */
export const boxStyle = (
  box: Box,
  align: "start" | "center" | "end" = "center",
  offsetY = 0
): React.CSSProperties => ({
  position: "absolute",
  top: box.top,
  left: box.left,
  width: box.width,
  height: box.height,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent:
    align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
  transform: offsetY ? `translateY(${offsetY}px)` : undefined,
});

/* ------------------------------------------------------------------ *
 * PHONE FIT MATHS
 *
 * Measured, not guessed — `node docs/archive/inspect-glb.mjs` from the repo root:
 *   body height (world Y, metalframe/basecolor)  1.6838
 *   body centre (world Y)                        0.0226
 * The camera in Phone.tsx is a 30 deg vertical-FOV perspective aimed at the
 * origin, so apparent size is a pure function of `radius` and these two
 * numbers. That means a template can ask for "fill this band" instead of
 * hunting for a radius by eye.
 * ------------------------------------------------------------------ */

export const PHONE_WORLD_HEIGHT = 1.6838;
/**
 * Zero because Phone.tsx recentres the model's bounding box on the origin at
 * load. It is kept as a named constant so the placement maths below stays
 * readable — and so a re-export that is centred differently only needs this
 * one number if the recentring is ever removed.
 */
export const PHONE_WORLD_CENTER_Y = 0;
export const PHONE_CAMERA_FOV_DEG = 30;

const halfFovTan = Math.tan((PHONE_CAMERA_FOV_DEG / 2) * (Math.PI / 180));

/** Pixels per world unit at a given camera distance. */
export const pxPerWorldUnit = (radius: number, frameHeight: number = CANVAS.height) =>
  frameHeight / (2 * radius * halfFovTan);

/** Camera distance that renders the phone body exactly `px` tall. */
export const radiusForPhoneHeight = (px: number, frameHeight: number = CANVAS.height) =>
  (PHONE_WORLD_HEIGHT * frameHeight) / (2 * Math.max(px, 1) * halfFovTan);

/**
 * How far to shift the full-frame 3D canvas so the phone sits centred in
 * `box`. Horizontal centring needs no shift: the model is recentred on the
 * origin and the camera aims there.
 */
export const phoneShiftForBox = (
  box: Box,
  radius: number,
  frameHeight: number = CANVAS.height
) => {
  const ppu = pxPerWorldUnit(radius, frameHeight);
  const phoneCentreY = frameHeight / 2 - PHONE_WORLD_CENTER_Y * ppu;
  return box.top + box.height / 2 - phoneCentreY;
};
