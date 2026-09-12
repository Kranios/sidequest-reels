/**
 * Instagram / Meta 9:16 safe zones.
 *
 * The four inset values ARE the truth — they always apply, live. There is no
 * preset/custom mode to get stuck in (an earlier version had one and it meant
 * dragging a slider silently did nothing).
 *
 * Published numbers disagree a lot, and the biggest ones come from Meta's
 * *advertising* guidance which is deliberately over-cautious. Starting points
 * you can type into the sliders:
 *
 *   loose     150 / 320 /  50 / 100   minimal — only the real UI hotspots
 *   standard  220 / 450 /  65 / 120   commonly published Reels numbers
 *   strict    269 / 672 /  65 /  65   Meta's unified ad spec; eats 1/3 of frame
 *
 * Turn on the overlay, drag until it looks right, then post one test reel and
 * check it on your phone. That beats any guide.
 */
import { CANVAS } from "./brand";

export type SafeInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/**
 * ▼▼▼ THE ONE PLACE TO SET YOUR SAFE AREA ▼▼▼
 *
 * Instagram's UI is the same on every reel, so this is a constant — not a
 * per-reel setting. Tune it once with the Studio sliders + overlay, write the
 * numbers here, and every reel you ever build (this theme and all future ones)
 * inherits them automatically.
 *
 * The sliders in Studio start from these values and are for experimenting.
 * They do NOT persist — this file is what persists.
 */
export const SAFE_INSETS: SafeInsets = {
  top: 220,
  bottom: 450,
  left: 65,
  right: 120,
};

/** Alias kept so components can default cleanly. */
export const DEFAULT_INSETS: SafeInsets = SAFE_INSETS;

export const getSafeArea = (insets?: Partial<SafeInsets>) => {
  const p = { ...DEFAULT_INSETS, ...insets };
  return {
    ...p,
    width: CANVAS.width - p.left - p.right,
    height: CANVAS.height - p.top - p.bottom,
  };
};

/**
 * SUPERSEDED by boxStyle() + splitSafeArea() in src/layout.ts, which put text
 * in a band ABOVE or BELOW the phone instead of sharing one box with it. Kept
 * for anything that wants the whole safe area as a single box.
 *
 * A box covering exactly the safe area. Put readable layers inside one and they
 * cannot collide with Instagram's UI.
 *
 * `align` places content within the box; `offsetY` nudges it further
 * (positive = down) so you can position text by eye.
 */
export const safeBoxStyle = (
  insets?: Partial<SafeInsets>,
  align: "start" | "center" | "end" = "center",
  offsetY = 0
): React.CSSProperties => {
  const s = getSafeArea(insets);
  return {
    position: "absolute",
    top: s.top,
    left: s.left,
    width: s.width,
    height: s.height,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent:
      align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
    transform: `translateY(${offsetY}px)`,
  };
};
