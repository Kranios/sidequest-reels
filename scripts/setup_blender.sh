#!/usr/bin/env bash
# SideQuest Reel Factory v2 — Blender asset setup
#
# Fetches everything render/render_phone.py needs and wires the paths.
# Run once from the project root:  bash scripts/setup_blender.sh
#
# What it does:
#   1. Installs Blender 4.2 LTS (portable, no root) if not on PATH
#   2. Downloads a studio HDRI (Poly Haven, CC0)
#   3. Reminds you where to drop the iPhone GLB (licensing: you supply it)
#   4. Writes assets/env.sh with the resolved paths (source it before rendering)
#
# Network note: this needs general internet access (Poly Haven, blender.org).
# In a locked-down sandbox it will fail those downloads — run it on your own
# machine / build box where those hosts are reachable.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p assets vendor

BLENDER_VER="4.2.3"
BLENDER_DIR="vendor/blender-${BLENDER_VER}-linux-x64"
BLENDER_BIN="${BLENDER_DIR}/blender"

# ---- 1. Blender ----
if command -v blender >/dev/null 2>&1; then
  BLENDER_BIN="$(command -v blender)"
  echo "✓ Blender already on PATH: $BLENDER_BIN"
elif [ -x "$BLENDER_BIN" ]; then
  echo "✓ Blender already downloaded: $BLENDER_BIN"
else
  echo "→ Downloading Blender ${BLENDER_VER} (portable)…"
  URL="https://download.blender.org/release/Blender4.2/blender-${BLENDER_VER}-linux-x64.tar.xz"
  curl -L "$URL" -o /tmp/blender.tar.xz
  tar -xf /tmp/blender.tar.xz -C vendor/
  echo "✓ Blender at $BLENDER_BIN"
fi

# ---- 2. HDRI (Poly Haven, CC0) ----
HDRI="assets/studio_hdri.hdr"
if [ -f "$HDRI" ]; then
  echo "✓ HDRI present: $HDRI"
else
  echo "→ Downloading studio HDRI (CC0)…"
  # 'studio_small_09' — neutral product-studio lighting, 2k is plenty
  curl -L "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr" -o "$HDRI"
  echo "✓ HDRI at $HDRI"
fi

# ---- 3. iPhone GLB (you supply — licensing) ----
GLB="assets/iphone17pro.glb"
if [ -f "$GLB" ]; then
  echo "✓ GLB present: $GLB"
else
  cat <<MSG
⚠ iPhone GLB not found at $GLB
  Drop your iPhone model there (the one you already rendered with works).
  We don't auto-download phone models — licensing varies. Any GLB with a flat
  display mesh works; render_phone.py maps the screen capture onto it.
MSG
fi

# ---- 4. Write env ----
cat > assets/env.sh <<ENV
# Source this before rendering:  source assets/env.sh
export SQ_BLENDER="${BLENDER_BIN}"
export SQ_GLB="${ROOT}/${GLB}"
export SQ_HDRI="${ROOT}/${HDRI}"
ENV
echo "✓ wrote assets/env.sh"
echo ""
echo "Next:  source assets/env.sh"
echo "Then:  \$SQ_BLENDER -b -P render/render_phone.py -- cache/captures/<screen>.png cache/renders/<screen> 45"
