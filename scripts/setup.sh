#!/usr/bin/env bash
# SideQuest Reel Factory v2 — one-shot setup + environment check.
# Run from project root:  bash scripts/setup.sh /path/to/mobile-master
#
# 1. Python deps (Pillow, playwright, fonttools) + chromium
# 2. Confirms Raleway fonts are present (bundled) or fetches them
# 3. Blender + HDRI (delegates to setup_blender.sh)
# 4. Prints how to run the app and produce batch 1

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
APP_DIR="${1:-}"

echo "── 1. Python deps ─────────────────────────────"
pip install --break-system-packages -q Pillow playwright fonttools
python -m playwright install chromium || echo "⚠ chromium install needs network; retry on your machine"

echo "── 2. Fonts ───────────────────────────────────"
if [ -f assets/fonts/Raleway-Black.ttf ]; then
  echo "✓ Raleway fonts bundled"
else
  echo "→ fetching Raleway…"
  curl -sL -o /tmp/ral.ttf "https://github.com/google/fonts/raw/main/ofl/raleway/Raleway%5Bwght%5D.ttf"
  python - <<'PY'
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
for name,w in {'Black':900,'Bold':700,'Regular':400}.items():
    f=TTFont('/tmp/ral.ttf'); instantiateVariableFont(f,{'wght':w},inplace=True)
    f.save(f'assets/fonts/Raleway-{name}.ttf')
PY
  echo "✓ Raleway installed"
fi

echo "── 3. Blender + HDRI ──────────────────────────"
bash scripts/setup_blender.sh || echo "⚠ blender/HDRI step needs general internet; run on your box"

echo "── 4. Next steps ──────────────────────────────"
cat <<NEXT
Run the app (real UI for capture):
  bash scripts/run_app.sh ${APP_DIR:-<path-to-mobile-master>} build
  # serves http://localhost:8124 ; then in another shell:
  export SQ_APP_URL=http://localhost:8124

Capture real screens (uses your fixtures — rule #9):
  python capture/capture.py batch

(optional) Hero phone render with motion:
  source assets/env.sh
  \$SQ_BLENDER -b -P render/render_phone.py -- cache/captures/trip_detail.png cache/renders/trip_detail 45

Compose + QA a reel:
  python compose/compose.py configs/theme01_reveal.json
  python qa/qa.py output/theme01_reveal.mp4
NEXT
echo "Done."
