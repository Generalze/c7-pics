#!/bin/bash
set -e

cd apps/web

# Check if pages are registered in the router
# This assumes there's an OPERATOR_PAGES union or similar in app/router.ts

ROUTER_FILE="app/router.ts"

if [ ! -f "$ROUTER_FILE" ]; then
  echo "⚠ Router file not found at $ROUTER_FILE - skipping routing check"
  exit 0
fi

# Get all Page exports
PAGES=$(grep -h "export.*Page" pages/*.tsx 2>/dev/null | \
  sed 's/.*export.*\([A-Z][a-zA-Z]*Page\).*/\1/' | sort -u || true)

FAILED=0
for PAGE in $PAGES; do
  if ! grep -q "$PAGE" "$ROUTER_FILE"; then
    echo "Page not registered in router: $PAGE"
    FAILED=1
  fi
done

if [ $FAILED -eq 1 ]; then
  echo "GATE FAILED: Some pages not registered in router"
  echo "Add missing pages to $ROUTER_FILE"
  exit 1
fi

echo "✓ Routing compliance: all pages registered"
exit 0
