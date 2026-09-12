#!/usr/bin/env bash
# SideQuest Reel Factory v2 — run the app locally for capture
#
# Serves the real SideQuest app as Expo web so Playwright can screenshot the
# REAL UI (brand rule #1). API calls are intercepted by the capture harness and
# answered from your fixtures (rule #9) — so NO backend or login is needed, and
# on-screen data is exactly what you put in configs/fixtures/.
#
# Usage:
#   bash scripts/run_app.sh /path/to/mobile-master        # dev server (hot)
#   bash scripts/run_app.sh /path/to/mobile-master build  # static export (stable)
#
# The app is served at http://localhost:8124  (set SQ_APP_URL to match).
#
# Requirements: Node 18+ and npm. First run installs deps (can take a while).
# Network note: needs npm registry access (allowed) for the first install.

set -euo pipefail
APP_DIR="${1:?Usage: run_app.sh <path-to-mobile-master> [build]}"
MODE="${2:-dev}"
PORT="${SQ_APP_PORT:-8124}"

cd "$APP_DIR"

# Point the app at a dummy API base so nothing hits production during capture;
# Playwright intercepts every /api/** call anyway. A real value is fine too —
# interception wins — but this makes accidental un-mocked calls fail fast/local.
export EXPO_PUBLIC_API_URL="http://localhost:5079"
export EXPO_PUBLIC_WEB_URL="http://localhost:${PORT}"
# Supabase anon values can be placeholders for capture; auth is bypassed by
# serving fixtures for the screens we shoot. If a screen needs a logged-in
# state, capture.py seeds it (see setup_mocks / seed_auth).
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-placeholder}"

if [ ! -d node_modules ]; then
  echo "→ installing deps (first run)…"
  npm install --no-audit --no-fund
fi

if [ "$MODE" = "build" ]; then
  echo "→ exporting static web build…"
  npx expo export --platform web --output-dir dist-web
  echo "→ serving dist-web at http://localhost:${PORT}"
  npx serve dist-web -l "$PORT"
else
  echo "→ starting Expo web (dev) at http://localhost:${PORT}"
  npx expo start --web --port "$PORT"
fi
