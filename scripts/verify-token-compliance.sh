#!/bin/bash
set -e

cd apps/web

# Extract all var(--token-name) references from components and pages
grep -r "var(--" --include="*.css" --include="*.module.css" components/ pages/ app/ 2>/dev/null | \
  sed 's/.*var(\(--[^)]*\)).*/\1/' | sort -u > /tmp/used-tokens.txt || true

# Extract all defined tokens from design-tokens.css
grep "^\s*--" styles/design-tokens.css 2>/dev/null | \
  sed 's/.*\(--[^:]*\).*/\1/' | sort -u > /tmp/defined-tokens.txt || true

# Find undefined tokens (used but not defined)
comm -23 /tmp/used-tokens.txt /tmp/defined-tokens.txt > /tmp/undefined-tokens.txt || true

if [ -s /tmp/undefined-tokens.txt ]; then
  echo "GATE FAILED: Undefined tokens used:"
  cat /tmp/undefined-tokens.txt
  exit 1
fi

DEFINED_COUNT=$(wc -l < /tmp/defined-tokens.txt)
echo "✓ Token compliance: 100% ($DEFINED_COUNT tokens defined, all used tokens exist)"
exit 0
