#!/bin/bash
set -euo pipefail

echo "════════════════════════════════════════════════════════════"
echo "                   QUALITY GATES: FULL RUN"
echo "════════════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0
RESULTS_FILE="$(mktemp -t quality-gates.XXXXXX)"
trap 'rm -f "$RESULTS_FILE"' EXIT

# Helper: run gate and track result.
# Counters use plain assignment: under `set -e`, `((PASS++))` exits the script
# when PASS is 0, because a post-increment from zero evaluates to 0 (false).
# That bug made the previous runner die on the very first gate, pass or fail.
run_gate() {
  local name="$1"
  local script="$2"

  echo -n "▸ $name ... "

  if [ ! -f "$script" ]; then
    echo "❌ (missing: $script)"
    FAIL=$((FAIL + 1))
    echo "--- $name: gate script $script does not exist" >> "$RESULTS_FILE"
    return
  fi

  if bash "$script" >> "$RESULTS_FILE" 2>&1; then
    echo "✓"
    PASS=$((PASS + 1))
  else
    echo "❌"
    FAIL=$((FAIL + 1))
  fi
}

# Only gates that exist are listed. The original list also named
# verify-no-hardcoded-colors, verify-import-resolution, verify-no-unwired-seams
# and verify-shared-types; none of those scripts were ever written, so they
# could never have run. Add a gate here only together with its script.
run_gate "Token Compliance" "./scripts/verify-token-compliance.sh"
run_gate "Routing Compliance" "./scripts/verify-routing-compliance.sh"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "                      RESULTS SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✓ PASSED: $PASS gates"
echo "❌ FAILED: $FAIL gates"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "✓ All gates passed. Ready for build."
  exit 0
else
  echo "❌ $FAIL gate(s) failed. See details below:"
  echo ""
  cat "$RESULTS_FILE"
  exit 1
fi
