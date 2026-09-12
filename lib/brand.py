"""
SideQuest Reel Factory — Brand constants (single source of truth).

These values are locked to the real app's BrandMark component so the wordmark,
pink dot, and palette in every reel are identical to the product. Do not fork
these per-reel — a reel that diverges from the real logo violates brand rule #2.
"""

# ---- Palette (from app design tokens) ----
BG_DARK      = "#0A0908"   # reel background
INK          = "#111217"   # wordmark on light surfaces
WHITE        = "#FFFFFF"
PINK         = "#F4A7B0"    # SideQuest signature dot / accent
GRAY_SUB     = "#B4B4B4"
GRAY_HANDLE  = "#999999"
GRAY_URL     = "#777777"

# ---- Wordmark geometry (EXACT, from user's logo HTML canvas export) ----
# Canvas reference: fontSize 100, letterSpacing -5.6px, dot radius 11,
# gap text->dot 6px, dot bottom touches text baseline (cap bottom).
# We keep the canvas's own 100px scale so the reel logo == the exported PNG.
WORDMARK_TEXT      = "SideQuest"
WORDMARK_FONTSIZE  = 100         # matches canvas export
WORDMARK_TRACKING  = -5.6        # letterSpacing at 100px
DOT_RADIUS         = 11
DOT_DIAMETER       = 22
DOT_GAP            = 6           # px between last glyph and dot
DOT_COLOR          = "#F4A7B0"
WORDMARK_COLOR     = "#111111"   # ink (on light); use WHITE on dark reel bg
# On the dark reel background the wordmark is white, dot stays pink.
WORDMARK_COLOR_DARK = "#FFFFFF"

# ---- Identity ----
HANDLE   = "@sideqtravel"
URL      = "sidequesttravel.app"
APP_NAME = "SideQuest"

# ---- Canvas ----
W, H = 1080, 1920
FPS  = 30

# ---- Fonts (populated by setup; see assets/fonts/) ----
FONT_BLACK   = "assets/fonts/Raleway-Black.ttf"
FONT_BOLD    = "assets/fonts/Raleway-Bold.ttf"
FONT_REGULAR = "assets/fonts/Raleway-Regular.ttf"


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
