#!/bin/bash
set -e

cd apps/web

# Extract all import paths
grep -r "^import\|^export.*from" --include="*.tsx" --include="*.ts" \
  components/ pages/ lib/ app/ 2>/dev/null | \
  sed "s/.*from ['\"]\\([^'\"]*\\)['\"].*/\\1/" | \
  sort -u > /tmp/imports.txt || true

# Check each import
FAILED=0
while IFS= read -r module; do
  # Skip node_modules, external packages
  if [[ "$module" =~ ^(@|\./) ]]; then
    # Resolve relative/local imports
    if [[ "$module" =~ ^\. ]]; then
      # Relative import: check if file exists
      # Simple check: if it starts with ./ or ../, it must exist
      if [[ ! "$module" =~ \.(ts|tsx|js|jsx|css|json)$ ]]; then
        # No extension, check for .ts, .tsx, .js, .jsx
        if [ ! -f "${module}.ts" ] && [ ! -f "${module}.tsx" ] && \
           [ ! -f "${module}.js" ] && [ ! -f "${module}.jsx" ] && \
           [ ! -d "$module" ]; then
          echo "Unresolved import: $module"
          FAILED=1
        fi
      fi
    fi
  fi
done < /tmp/imports.txt

if [ $FAILED -eq 1 ]; then
  exit 1
fi

echo "✓ Import resolution: all modules found"
exit 0
