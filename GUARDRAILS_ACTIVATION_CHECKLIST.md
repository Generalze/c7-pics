# Quality Guardrails: Activation Checklist

**Phase**: Pre-Agent Launch  
**Target**: All gates passing before agents start  
**Status**: Ready to deploy

---

## Step 1: Verify Gate Scripts Are Executable

```bash
cd C:\Users\zoeme\Downloads\c7-pics

# Check all scripts exist
ls -la scripts/run-all-gates.sh
ls -la scripts/verify-*.sh

# Make executable
chmod +x scripts/*.sh

# Verify they're executable
file scripts/verify-token-compliance.sh
# Should show: shell script, ASCII text, executable
```

**Expected**: 7 scripts, all executable  
**Action**: If any missing or not executable, gate system is broken

---

## Step 2: Initialize Git Hooks

```bash
# Create pre-commit hook
mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running quality gates before commit..."
npm run quality:gates || exit 1
echo "✓ All gates passed"
EOF

chmod +x .git/hooks/pre-commit

# Verify hook is installed
ls -la .git/hooks/pre-commit
```

**Expected**: Hook exists and is executable  
**Action**: If hook creation fails, commits can proceed without gates

---

## Step 3: Update package.json Scripts

Add two new scripts to `apps/web/package.json` (or project root):

```json
{
  "scripts": {
    "quality:gates": "bash scripts/run-all-gates.sh",
    "build": "npm run quality:gates && tsc && vite build",
    "test": "vitest --run --coverage"
  }
}
```

**Expected**: `npm run quality:gates` runs all gates  
**Verification**: 
```bash
npm run quality:gates
# Should output: ✓ or ❌ for each gate
```

**Action**: If script doesn't run, gate system is broken

---

## Step 4: Run Baseline Gates

This establishes the starting point before agents start.

```bash
cd apps/web
npm run quality:gates
```

**Expected Output** (example):
```
════════════════════════════════════════════════════════════
                   QUALITY GATES: FULL RUN
════════════════════════════════════════════════════════════

▸ Token Compliance ... ✓
▸ No Hardcoded Colors ... ✓
▸ Import Resolution ... ✓
▸ Routing Compliance ... ✓
▸ No Unwired Seams ... ✓
▸ No Type Duplication ... ✓

════════════════════════════════════════════════════════════
                      RESULTS SUMMARY
════════════════════════════════════════════════════════════

✓ PASSED: 6 gates
❌ FAILED: 0 gates

✓ All gates passed. Ready for build.
```

**If gates fail**: Fix each failure before proceeding to agents
- Token undefined → Add to design-tokens.css
- Import unresolved → Fix import path
- Page not routed → Add to router.ts
- etc.

**Critical**: ALL baseline gates must pass before agents start

---

## Step 5: Verify Build Integration

Test that build fails if gates fail:

```bash
npm run build
```

**Expected**: Build completes and produces `dist/` directory  
**Expected structure**:
```
dist/
├── index.html
├── assets/
│   ├── main-[hash].js
│   └── style-[hash].css
└── ...
```

**If build fails**: Fix TypeScript errors before proceeding  
**Critical**: Build must complete cleanly

---

## Step 6: Run Test Suite

Verify tests are executable:

```bash
npm test -- --coverage
```

**Expected output** (example):
```
PASS  components/ui/__tests__/status-badge.contract.test.ts
PASS  components/ui/__tests__/datatable.contract.test.ts

────────────────────────────────────────────
File      | % Stmts | % Branch | % Funcs | % Lines |
────────────────────────────────────────────
All files |   75.2  |   68.5   |   82.1  |   74.8  |
────────────────────────────────────────────

Tests:       120 passed, 120 total
Coverage:    75.2% lines
```

**If coverage is <75%**: Agents must add tests  
**If tests don't run**: Fix test configuration before agents start

---

## Step 7: Create Agent Briefing Document

Create `AGENT_BRIEFING.md` from template:

```markdown
# Phase 1 Implementation: Agent Briefing

Welcome! You're building C7-PICS Phase 1 components with **measurable quality gates**.

## Your Assignment
[Agent-specific pages/components]

## Quality Requirements (Non-Negotiable)
1. ✓ npm run build succeeds (zero TypeScript errors)
2. ✓ npm test passes (>=75% coverage)
3. ✓ npm run quality:gates passes (all gates)
4. ✓ All pages are wired in router.ts
5. ✓ All components render without console errors

## Checkpoints
- Hour 4: npm run build must succeed
- Hour 8: npm test must pass with >=75% coverage
- Hour 12: npm run quality:gates must pass
- Hour 16: Submit your work

## If a Gate Fails
Don't skip it. Fix the code:
- Token undefined? → Add to design-tokens.css
- Import unresolved? → Fix the import path
- Page not routed? → Add to router.ts
- Type duplicated? → Move to shared contract
- Test missing? → Write the test
- Component broken? → Fix the component

Then re-run the gate. When it passes, you can commit.

## Questions?
See QUALITY_GUARDRAILS_OPERATIONAL.md for detailed gate documentation.
```

**Save as**: `AGENT_BRIEFING.md`

---

## Step 8: Verify Pre-Commit Hook Works

Test that the hook blocks broken commits:

```bash
# Create a test file that violates a gate
echo "body { color: #ff0000; }" > apps/web/components/test-bad.module.css

# Try to commit
git add apps/web/components/test-bad.module.css
git commit -m "test: hardcoded color (should fail)"

# Expected: Hook runs, finds hardcoded color, blocks commit
# ❌ GATE FAILED: Hardcoded colors found
# (commit aborted)
```

**Verification**: Commit is rejected  
**If commit succeeds**: Hook is broken; gates won't prevent bad commits

Clean up test file:
```bash
git reset HEAD apps/web/components/test-bad.module.css
rm apps/web/components/test-bad.module.css
```

---

## Step 9: Create Checkpoint Monitoring Script

Create `scripts/checkpoint-monitor.sh` for real-time gate status:

```bash
#!/bin/bash
watch -n 300 'echo "=== Quality Gate Checkpoint ===" && \
  npm run quality:gates && echo "" && \
  npm run build >/dev/null 2>&1 && echo "✓ Build OK" || echo "❌ Build FAILED" && echo "" && \
  npm test -- --coverage 2>&1 | grep -E "Tests:|Coverage:" && \
  echo "Last checked: $(date)"'
```

Make executable:
```bash
chmod +x scripts/checkpoint-monitor.sh
```

**Usage during agent work**:
```bash
./scripts/checkpoint-monitor.sh
```

Shows gate status every 5 minutes.

---

## Step 10: Documentation Checklist

Verify all documents are in place:

```bash
# Framework & Strategy
ls QUALITY_GUARDRAILS.md
ls GUARDRAILS_STRATEGY.md
ls QUALITY_GUARDRAILS_OPERATIONAL.md
ls QUALITY_SYSTEM_OVERVIEW.md

# Activation & Checklists
ls GUARDRAILS_ACTIVATION_CHECKLIST.md (this file)

# Scripts
ls scripts/run-all-gates.sh
ls scripts/verify-token-compliance.sh
ls scripts/verify-no-hardcoded-colors.sh
ls scripts/verify-import-resolution.sh
ls scripts/verify-routing-compliance.sh
ls scripts/verify-no-unwired-seams.sh
ls scripts/verify-shared-types.sh

# Contract Tests
ls apps/web/components/ui/__tests__/status-badge.contract.test.ts
ls apps/web/components/ui/__tests__/datatable.contract.test.ts

# Agent Briefing
ls AGENT_BRIEFING.md
```

**Expected**: All files present  
**Action**: If any missing, gate system is incomplete

---

## Pre-Launch Verification (Run Now)

```bash
#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════"
echo "            PRE-LAUNCH VERIFICATION CHECKLIST"
echo "════════════════════════════════════════════════════════════"
echo ""

# 1. Check scripts
echo "✓ Checking scripts..."
for script in run-all-gates verify-token-compliance verify-no-hardcoded-colors \
              verify-import-resolution verify-routing-compliance verify-no-unwired-seams \
              verify-shared-types; do
  [ -x "scripts/$script.sh" ] || { echo "❌ Missing: scripts/$script.sh"; exit 1; }
done
echo "  ✓ All 7 scripts present and executable"
echo ""

# 2. Check hook
echo "✓ Checking git hook..."
[ -x ".git/hooks/pre-commit" ] || { echo "❌ Pre-commit hook not installed"; exit 1; }
echo "  ✓ Pre-commit hook installed"
echo ""

# 3. Check package.json scripts
echo "✓ Checking package.json scripts..."
grep -q "quality:gates" package.json || { echo "❌ Missing: npm run quality:gates"; exit 1; }
echo "  ✓ npm run quality:gates configured"
echo ""

# 4. Run baseline gates
echo "✓ Running baseline gates..."
npm run quality:gates > /tmp/baseline-gates.txt 2>&1 || {
  echo "❌ GATES FAILED. Fix baseline failures before launching agents:"
  cat /tmp/baseline-gates.txt
  exit 1
}
echo "  ✓ All baseline gates pass"
echo ""

# 5. Build
echo "✓ Building..."
npm run build > /tmp/baseline-build.txt 2>&1 || {
  echo "❌ BUILD FAILED. Fix TypeScript errors before launching agents:"
  cat /tmp/baseline-build.txt
  exit 1
}
echo "  ✓ Build succeeds"
echo ""

# 6. Tests
echo "✓ Running tests..."
npm test -- --coverage > /tmp/baseline-tests.txt 2>&1 || {
  echo "❌ TESTS FAILED. Fix tests before launching agents:"
  cat /tmp/baseline-tests.txt
  exit 1
}
echo "  ✓ Tests pass with >=75% coverage"
echo ""

# 7. Documentation
echo "✓ Checking documentation..."
[ -f "QUALITY_GUARDRAILS.md" ] || { echo "❌ Missing: QUALITY_GUARDRAILS.md"; exit 1; }
[ -f "AGENT_BRIEFING.md" ] || { echo "❌ Missing: AGENT_BRIEFING.md"; exit 1; }
echo "  ✓ All documentation present"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✓✓✓ READY FOR AGENT LAUNCH ✓✓✓"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next: Send agents AGENT_BRIEFING.md and QUALITY_GUARDRAILS_OPERATIONAL.md"
echo "Then: Launch Phase 1-2 implementation with 4-agent workflow"
echo ""
```

Save as `scripts/pre-launch-verification.sh` and run:

```bash
chmod +x scripts/pre-launch-verification.sh
./scripts/pre-launch-verification.sh
```

---

## Activation Status Checklist

- [ ] Step 1: Gate scripts verified executable
- [ ] Step 2: Pre-commit hook installed
- [ ] Step 3: package.json scripts updated
- [ ] Step 4: Baseline gates all pass
- [ ] Step 5: Build completes cleanly
- [ ] Step 6: Test suite passes with >=75% coverage
- [ ] Step 7: Agent briefing document created
- [ ] Step 8: Pre-commit hook tested and working
- [ ] Step 9: Checkpoint monitoring script created
- [ ] Step 10: All documentation in place
- [ ] Pre-Launch Verification: All checks pass

---

## Ready to Launch

When all checkboxes are complete:

✓ **Quality guardrails are ACTIVE**
✓ **Build gates are ENFORCED**
✓ **Pre-commit hooks are WORKING**
✓ **Baseline is CLEAN**
✓ **Agents can begin Phase 1-2**

**Next**: Run 4-agent parallel workflow with embedded checkpoints every 4 hours.

---

## Troubleshooting

### Gates fail at baseline
- **Token undefined**: Add missing CSS variable to `apps/web/styles/design-tokens.css`
- **Import unresolved**: Fix import paths in components
- **Page not routed**: Add missing pages to router.ts
- **Build error**: Fix TypeScript errors before proceeding
- **Test fails**: Write/fix tests before proceeding

### Pre-commit hook not running
```bash
# Reinstall hook
rm .git/hooks/pre-commit
chmod +x scripts/run-all-gates.sh
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run quality:gates || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

### npm scripts not found
Update `package.json`:
```json
{
  "scripts": {
    "quality:gates": "bash scripts/run-all-gates.sh",
    "build": "npm run quality:gates && tsc && vite build"
  }
}
```

---

## Timeline

1. **Now**: Run pre-launch verification (20 minutes)
2. **In 30 min**: All gates pass, ready to launch
3. **Today**: Brief agents on quality requirements
4. **Tomorrow**: 4-agent workflow begins with hour-4 checkpoint
5. **Day 3**: Hour-8 and hour-12 checkpoints
6. **Day 3 afternoon**: Agents submit work for Opus 5 verification
7. **Day 4**: Opus 5 verifies independently; deployment approved or blocked

---

**Quality guardrails are LIVE. Ready to launch Phase 1-2 with measured compliance.**
