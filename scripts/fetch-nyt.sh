#!/usr/bin/env bash
#
# Download the latest New York Times crossword(s) as .puz files using xword-dl.
#
# The NYT subscriber token is read from an xword-dl YAML config that is NOT
# committed to this repository (it is a secret). See
# backend/config/xword-dl.yaml.example for the format.
#
# Usage:
#   scripts/fetch-nyt.sh              # download the daily NYT puzzle (nyt)
#   scripts/fetch-nyt.sh nyt nytm     # daily + mini
#
# Credentials (first match wins):
#   $NYT_S_TOKEN                      # NYT-S token as an env var / CI secret
#   $XWORD_DL_CONFIG                  # explicit path to an xword-dl YAML config
#   backend/config/xword-dl.yaml      # repo-local default (gitignored)
#
# Output directory (default: backend/samples):
#   $XWORD_DL_OUTPUT_DIR

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CONFIG_FILE="${XWORD_DL_CONFIG:-$REPO_ROOT/backend/config/xword-dl.yaml}"
OUTPUT_DIR="${XWORD_DL_OUTPUT_DIR:-$REPO_ROOT/backend/samples}"

# Outlet keywords to download. Defaults to the daily NYT puzzle.
outlets=("$@")
if [ ${#outlets[@]} -eq 0 ]; then
  outlets=(nyt)
fi

# xword-dl reads its config from $XDG_CONFIG_HOME/xword-dl/xword-dl.yaml.
# Point it at an isolated, throwaway home so we never read from or write to the
# developer's global ~/.config.
XDG_DIR="$(mktemp -d)"
trap 'rm -rf "$XDG_DIR"' EXIT
mkdir -p "$XDG_DIR/xword-dl"
export XDG_CONFIG_HOME="$XDG_DIR"
CONFIG_TARGET="$XDG_DIR/xword-dl/xword-dl.yaml"

# Resolve the token: prefer NYT_S_TOKEN (CI secret / Vercel env var), otherwise
# fall back to a YAML config file on disk.
if [ -n "${NYT_S_TOKEN:-}" ]; then
  # Generate the config from the env var (nothing secret is written to the repo).
  printf 'nyt:\n  NYT-S: %s\n' "$NYT_S_TOKEN" > "$CONFIG_TARGET"
elif [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_TARGET"
else
  cat >&2 <<EOF
error: no NYT credentials found.

Provide one of the following:
  - Set the NYT_S_TOKEN environment variable (recommended for CI / Vercel), or
  - Create a config file at:
      $CONFIG_FILE
    from the template:
      cp backend/config/xword-dl.yaml.example backend/config/xword-dl.yaml
      # then paste your NYT-S token into it
  - Or point XWORD_DL_CONFIG at an existing xword-dl config file.
EOF
  exit 1
fi

# Pick a runner: prefer 'uvx' (no install needed), then a 'xword-dl' on PATH.
if command -v uvx >/dev/null 2>&1; then
  runner=(uvx xword-dl)
elif command -v xword-dl >/dev/null 2>&1; then
  runner=(xword-dl)
else
  echo "error: neither 'uvx' nor 'xword-dl' found on PATH." >&2
  echo "Install uv (https://docs.astral.sh/uv/) or run: pip install xword-dl" >&2
  exit 1
fi

# xword-dl reads its config from \$XDG_CONFIG_HOME/xword-dl/xword-dl.yaml, which
# we populated above from either $NYT_S_TOKEN or the config file.
mkdir -p "$OUTPUT_DIR"

for outlet in "${outlets[@]}"; do
  echo "Downloading '$outlet' -> $OUTPUT_DIR"
  # xword-dl writes to the current directory by default.
  ( cd "$OUTPUT_DIR" && "${runner[@]}" "$outlet" )
done

echo "Done."
