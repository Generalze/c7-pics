#!/bin/bash
set -e

cd apps/web

# Find inline type definitions in pages
grep -r "^\s*type.*=\|^\s*interface" pages --include="*.tsx" 2>/dev/null > /tmp/inline-types.txt || true

# Find types in lib/c7-pics.types.ts or similar shared type file
TYPES_FILE=$(find lib -name "*.types.ts" -o -name "types.ts" 2>/dev/null | head -1)

if [ -z "$TYPES_FILE" ]; then
  echo "⚠ No shared types file found - skipping type duplication check"
  exit 0
fi

grep -r "^\s*export type\|^\s*export interface" "$TYPES_FILE" 2>/dev/null > /tmp/shared-types.txt || true

# Check for duplicates: same type name defined both inline and shared
FAILED=0
if [ -s /tmp/inline-types.txt ] && [ -s /tmp/shared-types.txt ]; then
  # Extract type names from both files
  INLINE_NAMES=$(grep -o "type\|interface\s\+[A-Za-z]*" /tmp/inline-types.txt | grep -o "[A-Za-z]*$" | sort -u)
  SHARED_NAMES=$(grep -o "[A-Za-z]*\s*[={]" /tmp/shared-types.txt | grep -o "^[A-Za-z]*" | sort -u)

  for name in $INLINE_NAMES; do
    if echo "$SHARED_NAMES" | grep -q "^$name$"; then
      echo "Duplicate type definition: $name (defined inline AND in shared contract)"
      FAILED=1
    fi
  done
fi

if [ $FAILED -eq 1 ]; then
  echo "GATE FAILED: Type duplication detected"
  echo "Move duplicate types to the shared contract file and import them"
  exit 1
fi

echo "✓ Type duplication: 0 conflicts (all types properly shared)"
exit 0
