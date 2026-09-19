#!/bin/bash
set -e

cd apps/web

ROUTER_FILE="app/router.ts"

if [ ! -f "$ROUTER_FILE" ]; then
  echo "⚠ Router file not found at $ROUTER_FILE - skipping seam check"
  exit 0
fi

# Get all Page exports from pages/*.tsx
PAGES=$(grep -h "export.*Page" pages/*.tsx 2>/dev/null | \
  sed 's/.*export.*\([A-Z][a-zA-Z]*Page\).*/\1/' | sort -u || true)

FAILED=0
for PAGE in $PAGES; do
  # Check if the page is imported somewhere (router.ts or anywhere)
  if ! grep -r "import.*$PAGE" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -q "$PAGE"; then
    echo "Unwired seam: $PAGE exported but never imported"
    FAILED=1
  fi
done

if [ $FAILED -eq 1 ]; then
  echo "GATE FAILED: Unwired seams detected"
  echo "Pages must be imported into the router or another module"
  exit 1
fi

echo "✓ Seam integrity: all pages are wired"
exit 0
