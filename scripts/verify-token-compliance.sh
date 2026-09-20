#!/bin/bash
# Every CSS custom property the web app reads with var(--name) must be defined
# somewhere in the web app. Definitions live in two places: the app's own
# token sheet (app/tokens.css, --surface, --sp-*, ...) and the Phase 1-2 sheet
# (styles/design-tokens.css, --color-*). Components also set ad-hoc properties
# inline ('--tab-color': ...) and read them back in their module CSS, so
# definitions are collected from .css, .tsx and .ts alike.
#
# Usages are collected from the same file set, because pages style themselves
# with styled-jsx inside .tsx as well as with module CSS.
set -euo pipefail

cd "$(dirname "$0")/../apps/web"

export LC_ALL=C
WORK="$(mktemp -d -t token-compliance.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

SOURCE_DIRS=(app components styles)
SOURCE_DIRS=("${SOURCE_DIRS[@]/#/./}")

# var(--name) and var(--name, fallback)
grep -rhoE 'var\(\s*--[A-Za-z0-9_-]+' --include='*.css' --include='*.tsx' --include='*.ts' "${SOURCE_DIRS[@]}" 2>/dev/null \
  | sed -E 's/^var\(\s*//' | sort -u > "$WORK/used" || true

# --name: value  |  '--name': value  |  "--name": value
grep -rhoE "(^|[^A-Za-z0-9_-])--[A-Za-z0-9_-]+['\"]?\s*:" --include='*.css' --include='*.tsx' --include='*.ts' "${SOURCE_DIRS[@]}" 2>/dev/null \
  | grep -oE -- '--[A-Za-z0-9_-]+' | sort -u > "$WORK/defined" || true

comm -23 "$WORK/used" "$WORK/defined" > "$WORK/undefined" || true

if [ -s "$WORK/undefined" ]; then
  echo "GATE FAILED: CSS custom properties read with var() but never defined:"
  cat "$WORK/undefined"
  exit 1
fi

USED_COUNT=$(wc -l < "$WORK/used" | tr -d ' ')
DEFINED_COUNT=$(wc -l < "$WORK/defined" | tr -d ' ')
echo "✓ Token compliance: every one of the $USED_COUNT tokens read via var() is among the $DEFINED_COUNT defined"
exit 0
