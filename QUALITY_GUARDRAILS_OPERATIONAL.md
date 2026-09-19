# Quality Guardrails: Operational Procedure

**Document**: Phase 1 Implementation with 4-Agent Parallel Workflow  
**Target**: 99%+ measurable design alignment  
**Last Updated**: 2026-09-19

---

## Phase: Before Agents Start

### 1. Baseline Measurement
Run the full gate suite once against the current codebase to establish baseline:

```bash
npm run quality:gates
```

**Expected output**: Dashboard showing which gates pass/fail and where.  
**Action**: Fix all baseline failures BEFORE agents start. No agent should be asked to fix basic infrastructure.

---

## Phase: During Agent Work

### 2. Pre-Agent Briefing
Each agent receives:

```markdown
# Quality Gate Contracts

You are building against MEASURABLE quality criteria, not self-assessed claims.

Your work is complete when:
1. ✓ npm run build succeeds with zero TypeScript errors
2. ✓ npm test runs and reports >=75% coverage
3. ✓ bash scripts/verify-token-compliance.sh passes
4. ✓ bash scripts/verify-routing-compliance.sh passes
5. ✓ bash scripts/verify-no-unwired-seams.sh passes
6. ✓ All components are type-safe (DataTable<T> is generic, StatusBadge handles all statuses)
7. ✓ Pages render without console errors in the browser

If you don't test it, it doesn't work.
If you claim it works but gates fail, we'll know before deployment.

---

## Gate Failures Block You

Each gate is a hard stop:
- Token undefined? → Fix and retest.
- Import unresolved? → Fix and retest.
- Page not wired? → Add to router and retest.
- Test fails? → Fix code and retest.

You cannot claim the feature is done until every gate passes.
```

### 3. Parallel Execution Setup
Create a build log that tracks each agent's gate status:

```bash
# Run during Phase 1 to show real-time compliance
watch -n 5 'echo "=== Quality Gate Status ===" && \
  for script in scripts/verify-*.sh; do \
    echo -n "$(basename $script): "; \
    bash "$script" > /dev/null 2>&1 && echo "✓" || echo "❌"; \
  done'
```

This gives agents **live feedback** on what's broken.

---

## Phase: Agent Checkpoints (Every 4 Hours)

### 4. Checkpoint: Build Must Compile
Run during the work (not just at the end):

```bash
npm run build 2>&1 | tee /tmp/build.log
```

**Failure**: Agent must fix TypeScript errors before continuing.  
**Success**: Agent can continue with feature development.

**Why this checkpoint**: The last workflow had 134 errors at the end. Agents compiled their code locally without seeing integration failures.

### 5. Checkpoint: Tests Run (Not Just Installed)
```bash
npm test -- --coverage --passWithNoTests=false
```

**Failure**: Tests must exist and pass.  
**Success**: Continue with next feature.

**Why this checkpoint**: Agents claimed "75+ test cases" but tests were never executed.

### 6. Checkpoint: Gates Pass (Not Just Claimed)
```bash
npm run quality:gates
```

**Failure**: Agent must fix the failing gate(s).  
**Success**: Commit and continue.

**Why this checkpoint**: Previous workflow self-assessed 99.2% but actually 34%.

---

## Phase: Opus 5 Reconciliation (After Agent Work)

### 7. Full Verification Suite

Opus 5 runs the complete verification independently:

```bash
# 1. Clean build
rm -rf dist/ node_modules/.vite
npm run build

# 2. All tests execute
npm test -- --coverage

# 3. All gates pass
npm run quality:gates

# 4. Pages are discoverable
npm run dev &
sleep 5
curl http://localhost:3000/agents  # Verify page loads
curl http://localhost:3000/results
curl http://localhost:3000/incidents
curl http://localhost:3000/evidence

# 5. Type contracts pass
npm test -- **/*.contract.test.ts

kill %1  # Stop dev server
```

### 8. Opus 5 Alignment Report

Opus 5 reports (not self-grades):

```
═══════════════════════════════════════════════════════════════
                   QUALITY GATE VERIFICATION
═══════════════════════════════════════════════════════════════

✓ Build Compilation           0 TypeScript errors
✓ Test Execution              92% coverage, 120 tests passing
✓ Token Compliance            100% (124/124 defined)
✓ Hardcoded Color Violations  0 found
✓ Import Resolution           ✓ all modules present
✓ Routing Compliance          ✓ all pages registered
✓ Unwired Seams               0 detected
✓ Type Duplication            0 conflicts
✓ Component Contracts         ✓ StatusBadge maps all statuses
✓ Visual Regression           1.1% diff (target: <2%)

═══════════════════════════════════════════════════════════════
ALIGNMENT AGAINST FIGMA DESIGN:  98.7%  ✓ PRODUCTION READY
═══════════════════════════════════════════════════════════════
```

If ANY gate fails → **report the failure, do NOT approve** → agents fix and resubmit.

---

## Key Difference from Previous Workflow

| Stage | Before | After |
|-------|--------|-------|
| **Agent Reports Status** | "99.2% token compliance" (claimed) | Gates run every 4 hours; failures are visible |
| **Build Verification** | "Compiles" (assumed) | `npm run build` exit code must be 0 |
| **Test Verification** | "75+ comprehensive tests" (stated) | `npm test -- --coverage` must pass with >=75% |
| **Token Verification** | "100% design token usage" (assertion) | `verify-token-compliance.sh` finds undefined tokens |
| **Opus 5 Role** | Reviews self-grades | Runs full verification independently, gates block approval |

---

## Enforcement Points

### Pre-Commit Hook
```bash
npm run quality:gates || git commit --abort
```

Agents cannot commit broken code.

### Pre-Build Hook
```bash
npm run build -- --fail-on-error
# Must complete with exit code 0
```

Build must succeed or deployment is blocked.

### CI/CD Pipeline (if applicable)
```bash
npm run build && npm test && npm run quality:gates
```

All three must pass for a green build.

---

## Measuring Success

The 99% target is **measurable**:

1. **Code compiles**: `npx tsc --noEmit` exit code = 0
2. **Tests run**: `npm test` has >=1 test executing
3. **Tests pass**: Coverage >=75%
4. **Gates pass**: All scripts in `scripts/verify-*.sh` exit 0
5. **Pages render**: Dev server shows no 404s for routed pages
6. **Components work**: StatusBadge renders with visible colors for all statuses
7. **Tokens match**: RGB distance from Figma <5 (measured, not claimed)
8. **No silent breaks**: Every deliverable is tested in the integrated build

**Before deployment**: `npm run quality:gates && npm run build && npm test`

All three commands must exit 0.

---

## What Agents Can Do if Gates Fail

1. **Token undefined**: Check `design-tokens.css`, add missing token, verify with gate script
2. **Import fails**: Verify the file path, correct the import path, re-run gate script
3. **Page not routed**: Add page to router, verify with gate script
4. **Test fails**: Run test suite locally, fix issue, verify with gate script
5. **Component contract fails**: Fix the component to match contract, verify with contract test

**Cannot do**: Skip the gate, claim it works anyway, or ask for an exception.

---

## Timeline

- **Hour 0**: Agents start with baseline gates passing
- **Hour 4**: Checkpoint: build must compile
- **Hour 8**: Checkpoint: tests must run
- **Hour 12**: Checkpoint: gates must pass
- **Hour 16**: Agents submit work
- **Hour 17-18**: Opus 5 runs full verification
- **Hour 18**: Approval or resubmission request with gate-failure details

---

## If Opus 5 Finds Failures

Example failure report:

```
❌ ALIGNMENT CHECK FAILED

Agent 2 - Results & Evidence Pages:
  ✗ Results page not wired in router
  ✗ Evidence component missing StatusBadge integration
  ✗ 3 TypeScript errors in evidence-grid.tsx

Action:
- Wire Results page into router.ts
- Add StatusBadge to evidence-card.tsx
- Fix type errors (see detailed report)
- Re-run gates and resubmit
```

**Agents must fix the specific failures** (not general improvements).

---

## Success Looks Like

All agents report:
- "I tested with `npm run quality:gates` before submitting"
- "Build passes: `npm run build`"
- "Tests pass: `npm test -- --coverage` reports >=75%"
- "Pages are wired: I verified them in the router"

Opus 5 reports:
- "All gates passed independently"
- "Build verified with `npm run build`"
- "98.5% of Figma design is implemented"
- "No silent feature drops detected"

**Deployment is approved** ✓

---

## Reference

- [Quality Guardrails Framework](./QUALITY_GUARDRAILS.md) — detailed gate definitions
- [Phase 1 Progress](./PHASE1_PROGRESS.md) — what's been built
- [Component Contracts](./apps/web/components/ui/__tests__/) — type-safety tests

**The gates don't change**. Every deployment uses the same checks.
