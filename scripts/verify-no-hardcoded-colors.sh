#!/bin/bash
set -e

cd apps/web

# Search for hex colors (#RRGGBB) in CSS files outside of design-tokens.css
grep -r "#[0-9a-fA-F]\{6\}" --include="*.module.css" --include="*.css" \
  components/ pages/ app/ 2>/dev/null | \
  grep -v "design-tokens.css" | \
  grep -v "fallback" | \
  grep -v "// hardcoded:" > /tmp/hardcoded.txt || true

if [ -s /tmp/hardcoded.txt ]; then
  echo "GATE FAILED: Hardcoded colors found (use design tokens instead):"
  cat /tmp/hardcoded.txt
  exit 1
fi

echo "✓ Hardcoded color compliance: 0 violations (all colors use tokens)"
exit 0
