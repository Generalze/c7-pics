#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════"
echo "                   QUALITY GATES: FULL RUN"
echo "════════════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0
TIMESTAMP=$(date +%s)
RESULTS_FILE="/tmp/quality-gates-${TIMESTAMP}.txt"

# Helper: run gate and track result
run_gate() {
  local name="$1"
  local script="$2"

  echo -n "▸ $name ... "

  if bash "$script" >> "$RESULTS_FILE" 2>&1; then
    echo "✓"
    ((PASS++))
  else
    echo "❌"
    ((FAIL++))
    echo "  Output:" >> "$RESULTS_FILE"
    bash "$script" >> "$RESULTS_FILE" 2>&1 || true
  fi
}

# Run all gates
run_gate "Token Compliance" "./scripts/verify-token-compliance.sh"
run_gate "No Hardcoded Colors" "./scripts/verify-no-hardcoded-colors.sh"
run_gate "Import Resolution" "./scripts/verify-import-resolution.sh"
run_gate "Routing Compliance" "./scripts/verify-routing-compliance.sh"
run_gate "No Unwired Seams" "./scripts/verify-no-unwired-seams.sh"
run_gate "No Type Duplication" "./scripts/verify-shared-types.sh"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "                      RESULTS SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✓ PASSED: $PASS gates"
echo "❌ FAILED: $FAIL gates"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✓ All gates passed. Ready for build."
  exit 0
else
  echo "❌ $FAIL gate(s) failed. See details below:"
  echo ""
  cat "$RESULTS_FILE"
  exit 1
fi
