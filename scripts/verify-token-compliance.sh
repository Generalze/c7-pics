#!/bin/bash
# Every CSS custom property the web app reads with var(--name) must be defined in
# a stylesheet the app actually loads.
#
# The earlier version of this gate checked only that a token was defined
# SOMEWHERE in the tree. A whole palette shipped in styles/design-tokens.css
# that no file ever imported, so the browser dropped every declaration that read
# it and the page rendered unstyled while this gate reported 100%. Presence in
# the repository is not the property worth checking; reachability is.
#
# So: the loaded set is the stylesheets reachable by an `import "...css"` from
# any .ts/.tsx file, plus the .tsx/.ts files themselves (styled-jsx and inline
# style objects). A .css file that nothing imports is dead and fails the gate.
set -euo pipefail

cd "$(dirname "$0")/../apps/web"

export LC_ALL=C
WORK="$(mktemp -d -t token-compliance.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

SOURCE_DIRS=(./app ./components ./lib)

# --- which stylesheets does the app import? -------------------------------
grep -rhoE "import[[:space:]]+[\"'][^\"']+\.css[\"']" --include='*.ts' --include='*.tsx' "${SOURCE_DIRS[@]}" 2>/dev/null \
  | grep -oE "[\"'][^\"']+\.css[\"']" | tr -d "\"'" | sed 's#.*/##' | sort -u > "$WORK/imported" || true

# CSS modules are imported by name and always reach the page that uses them.
find "${SOURCE_DIRS[@]}" -name '*.module.css' -printf '%f\n' 2>/dev/null | sort -u >> "$WORK/imported" || true
sort -u -o "$WORK/imported" "$WORK/imported"

find "${SOURCE_DIRS[@]}" -name '*.css' -printf '%p\n' 2>/dev/null | sort > "$WORK/all-css" || true

: > "$WORK/loaded-css"
: > "$WORK/dead-css"
while IFS= read -r path; do
  if grep -qxF "$(basename "$path")" "$WORK/imported"; then
    echo "$path" >> "$WORK/loaded-css"
  else
    echo "$path" >> "$WORK/dead-css"
  fi
done < "$WORK/all-css"

if [ -s "$WORK/dead-css" ]; then
  echo "GATE FAILED: stylesheets that nothing imports, so the browser never loads them:"
  cat "$WORK/dead-css"
  echo
  echo "Import the file, or delete it. A stylesheet in the tree is not a stylesheet on the page."
  exit 1
fi

# --- usages and definitions, from the loaded set only ----------------------
TSX_FILES="$(find "${SOURCE_DIRS[@]}" \( -name '*.ts' -o -name '*.tsx' \) -print 2>/dev/null)"
LOADED="$(cat "$WORK/loaded-css")"

# shellcheck disable=SC2086
grep -hoE 'var\(\s*--[A-Za-z0-9_-]+' $LOADED $TSX_FILES 2>/dev/null \
  | sed -E 's/^var\(\s*//' | sort -u > "$WORK/used" || true

# --name: value  |  '--name': value  |  "--name": value
# shellcheck disable=SC2086
grep -hoE "(^|[^A-Za-z0-9_-])--[A-Za-z0-9_-]+['\"]?[[:space:]]*:" $LOADED $TSX_FILES 2>/dev/null \
  | grep -oE -- '--[A-Za-z0-9_-]+' | sort -u > "$WORK/defined" || true

comm -23 "$WORK/used" "$WORK/defined" > "$WORK/undefined" || true

if [ -s "$WORK/undefined" ]; then
  echo "GATE FAILED: tokens read with var() but defined in no stylesheet the app loads:"
  cat "$WORK/undefined"
  exit 1
fi

USED_COUNT=$(wc -l < "$WORK/used" | tr -d ' ')
DEFINED_COUNT=$(wc -l < "$WORK/defined" | tr -d ' ')
LOADED_COUNT=$(wc -l < "$WORK/loaded-css" | tr -d ' ')
echo "✓ Token compliance: $USED_COUNT tokens read, all defined among $DEFINED_COUNT across $LOADED_COUNT loaded stylesheets"
exit 0
