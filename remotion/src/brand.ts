/**
 * SideQuest brand constants — single source of truth.
 * Mirrors lib/brand.py so Python and Remotion can never drift apart.
 * Values taken from the real logo canvas export (fontSize 100, tracking -5.6,
 * dot radius 11 sitting on the text baseline).
 */
export const BRAND = {
  bgDark: "#0A0908",
  ink: "#111111",
  white: "#FFFFFF",
  pink: "#F4A7B0",
  graySub: "#B4B4B4",
  grayHandle: "#999999",
  grayUrl: "#777777",

  wordmark: "SideQuest",
  handle: "@sideqtravel",
  url: "sidequesttravel.app",
  launchLine: "Plan together. Travel better.",

  // Logo geometry at a 100px font size; scale proportionally.
  logoFontSize: 100,
  logoTracking: -5.6,
  dotRadius: 11,
  dotGap: 6,

  fontFamily: "'Raleway', sans-serif",
} as const;

export const CANVAS = { width: 1080, height: 1920, fps: 30 } as const;
