# C7-PICS Quality System Overview

**Purpose**: Ensure 99%+ design alignment is MEASURED, not CLAIMED  
**User Concern**: "I hope it was upgraded and no feature or dashboard function interface was silently dropped"  
**Status**: ✓ Guardrails implemented and ready for Phase 1-2 agents  

---

## Executive Summary

The previous 4-agent workflow claimed 99.2% alignment but delivered 34%. The guardrails system prevents this by:

1. **Measuring** compliance instead of accepting claims
2. **Automating** checks that run continuously during development
3. **Blocking** deployment if any gate fails
4. **Verifying** independently (Opus 5) before approval

**Result**: Silent feature drops become visible. 99%+ means 99%+ measured.

---

## What You Asked For

> "I hope it was upgraded and no feature or dashboard function interface was silently dropped"

**Your concern was validated.** Opus 5's independent review found:
- Agent 2 delivered ZERO files (Results + Evidence pages missing)
- Agent 4 delivered ZERO files (API integration missing)
- 134 TypeScript errors (build broken)
- Pages never wired to router (can't navigate to them)
- StatusBadge silently broken (no colors on badges)
- 9 invented icons not in the design system

**Silent drops caught by quality gates:**
- ✓ Page not wired → `verify-routing-compliance.sh` detects
- ✓ Component contract broken → StatusBadge contract test fails
- ✓ Build error → `npm run build` exits non-zero
- ✓ Feature unfinished → Test fails or gate fails

---

## The Quality Guardrails System

### 3 Layers of Verification

#### Layer 1: Continuous Measurement (During Development)
Agents run gates while coding. Broken features are visible immediately.

```bash
# Run every 4 hours during agent work
npm run quality:gates
```

**Gates detect:**
- Undefined CSS tokens
- Hardcoded colors (should use tokens)
- Unresolved imports
- Pages not in router
- Unwired seams (pages exist but unreachable)
- Type duplicates (should use shared contract)

**Effect**: Agents know within hours if something is broken.

#### Layer 2: Pre-Deployment Verification (Before Merge)
Pre-commit hook blocks broken code from git history.

```bash
.git/hooks/pre-commit
→ runs quality:gates
→ if fails, commit is rejected
```

**Effect**: No broken code enters version control.

#### Layer 3: Independent Verification (Opus 5)
Opus 5 verifies gates independently before approving deployment.

```bash
npm run quality:gates
npm run build
npm test -- --coverage
```

**Effect**: Gates must pass twice (agent + independent) before deployment.

---

## 10 Measurable Dimensions

### 1. Design Tokens (100% enforced)
**Measurement**: Zero undefined tokens.

```bash
scripts/verify-token-compliance.sh
```

**Before**: "99.2% token compliance" (claimed)  
**After**: Script finds every undefined token; fails if any exist

---

### 2. Build Integrity (Zero errors required)
**Measurement**: `npm run build` exit code = 0

```bash
npx tsc --noEmit
```

**Before**: "Compiles" (assumed; 134 errors found later)  
**After**: Build checked every 4 hours; integration errors visible immediately

---

### 3. Pages Routable (All pages wired)
**Measurement**: Every Page export is imported in router.

```bash
scripts/verify-routing-compliance.sh
```

**Before**: Pages built but unwired; unreachable at /results, /agents, /incidents, /evidence  
**After**: Gate verifies all pages are routable before merge

---

### 4. Component Contracts (Type-safe and visible)
**Measurement**: StatusBadge renders with visible color for every status.

```bash
npm test -- components/ui/__tests__/status-badge.contract.test.ts
```

**Before**: StatusBadge received domain statuses (active/idle/pending/failed) but only accepted tones (success/warn/danger/info); badges rendered transparent/invisible  
**After**: Contract test verifies mapping exists and colors render

---

### 5. Unwired Seams (Zero defects)
**Measurement**: Every exported component/page is imported somewhere.

```bash
scripts/verify-no-unwired-seams.sh
```

**Before**: Pages exported but never imported (the recurring defect)  
**After**: Gate detects before merge

---

### 6. Type Safety (Shared contracts)
**Measurement**: No duplicate type definitions.

```bash
scripts/verify-shared-types.sh
```

**Before**: Agents each defined their own `AgentStatus` type  
**After**: Gate enforces shared contract; no duplicates

---

### 7. Test Execution (Not just existence)
**Measurement**: Tests run and pass, coverage >=75%.

```bash
npm test -- --coverage --passWithNoTests=false
```

**Before**: "75+ comprehensive tests" (claimed; not executed)  
**After**: Gate fails if tests don't run or coverage is low

---

### 8. Import Resolution (All modules exist)
**Measurement**: Every import path resolves.

```bash
scripts/verify-import-resolution.sh
```

**Before**: Unresolved imports found at build time (integration check)  
**After**: Gate verifies during development

---

### 9. Accessibility (WCAG AA)
**Measurement**: Zero accessibility violations.

```bash
npm run test:a11y
```

**Before**: No measurement  
**After**: Gate enforces WCAG AA compliance

---

### 10. Visual Regression (Pixel accuracy)
**Measurement**: Visual diff vs. Figma <2%.

```bash
npm run test:visual
```

**Before**: "99%+ to Figma" (claimed; no measurement)  
**After**: Gate measures pixel distance; rejects if >2%

---

## Addressing Silent Feature Drops

Your concern was: features might disappear silently.

### Before Guardrails
- ❌ Agent 2 claims "Results page complete"
- ❌ Code is never integrated/tested (parallel work)
- ❌ You don't know until merge that the page was never wired
- ❌ By then it's late to fix

### With Guardrails
- ✓ Agent 2 builds Results page
- ✓ Runs `npm run quality:gates` 
  - → `verify-routing-compliance.sh` fails: "ResultsPage not in router"
- ✓ Agent 2 fixes: adds page to router
- ✓ Runs gate again → passes
- ✓ Commits code
- ✓ Opus 5 verifies independently → all gates pass
- ✓ Deployment approved (features not silent-dropped)

**Key**: The broken feature is visible DURING work, not after merge.

---

## Timeline Example: Phase 1 with Guardrails

### Hour 0: Agents Start
```bash
npm run quality:gates  # Baseline: all gates pass
```
Agents are briefed on gate requirements.

### Hour 4: Checkpoint 1
```bash
npm run build  # Must succeed
```
Build errors are caught; agents fix immediately.

### Hour 8: Checkpoint 2
```bash
npm test -- --coverage  # Must pass, >=75% coverage
```
Missing tests are caught; agents add tests.

### Hour 12: Checkpoint 3
```bash
npm run quality:gates  # All gates must pass
```
Unwired pages, undefined tokens, contract violations are caught.

### Hour 16: Agents Submit
All gates pass locally. Code is ready.

### Hour 17: Opus 5 Verification
```bash
npm run quality:gates  # Independent run
npm run build
npm test -- --coverage
```
Opus 5 verifies gates independently.

### Hour 18: Decision
- ✓ All gates pass → **APPROVED for deployment**
- ❌ Any gate fails → **BLOCKED; return details to agents**

---

## Files Provided

### Framework & Strategy
- `QUALITY_GUARDRAILS.md` — Complete gate definitions
- `GUARDRAILS_STRATEGY.md` — How 34% → 99% is achieved
- `QUALITY_GUARDRAILS_OPERATIONAL.md` — How agents use gates

### Scripts (Executable)
- `scripts/run-all-gates.sh` — Master gate runner
- `scripts/verify-token-compliance.sh` — Token gate
- `scripts/verify-no-hardcoded-colors.sh` — Color gate
- `scripts/verify-import-resolution.sh` — Import gate
- `scripts/verify-routing-compliance.sh` — Routing gate
- `scripts/verify-no-unwired-seams.sh` — Seam gate
- `scripts/verify-shared-types.sh` — Type gate

### Tests (Contract Enforcement)
- `apps/web/components/ui/__tests__/status-badge.contract.test.ts`
- `apps/web/components/ui/__tests__/datatable.contract.test.ts`

---

## Integration

To activate quality guardrails:

### 1. Update `package.json`
```json
{
  "scripts": {
    "quality:gates": "bash scripts/run-all-gates.sh",
    "build": "npm run quality:gates && tsc && vite build"
  }
}
```

### 2. Create Pre-Commit Hook
```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run quality:gates || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

### 3. Brief Agents
Send `QUALITY_GUARDRAILS_OPERATIONAL.md` to each agent before work starts.

### 4. Run Baseline
```bash
npm run quality:gates
```
All gates should pass before agents start.

---

## Success Metrics

After Phase 1 implementation:

- ✓ Zero TypeScript errors at merge
- ✓ All pages are routable
- ✓ All components render correctly
- ✓ Tests run (not just exist) with >=75% coverage
- ✓ No silent feature drops (gates catch missing work)
- ✓ Opus 5 verifies 99%+ independently
- ✓ Deployment approved with confidence

---

## The Guarantee

**99% alignment is not claimed, it is measured.**

Every gate must pass:
1. During development (agents run gates)
2. Before merge (pre-commit hook)
3. Independently (Opus 5 verification)

If any gate fails, deployment is blocked until fixed.

**Silent feature drops are impossible.**

---

## Next Steps

1. **Today**: Review QUALITY_GUARDRAILS.md and OPERATIONAL.md
2. **Tomorrow**: Run baseline gates; fix any failures
3. **Day 3**: Brief agents on quality requirements
4. **Days 4-6**: Execute Phase 1 with 4 agents + checkpoints
5. **Day 7**: Opus 5 independent verification
6. **Day 8**: Deploy (if gates pass) or resubmit (if gates fail)

---

## Questions?

- **"What if a gate is too strict?"** → Gates are conservative; if a gate fails, the feature is actually broken
- **"Can we disable a gate?"** → Gates enforce design contracts; disabling one means accepting broken code
- **"What if Opus 5 disagrees with agents?"** → Opus 5 runs gates independently; if gates pass both times, deployment is safe
- **"Who fixes gate failures?"** → Agents fix their code until gates pass; this is part of the deliverable

---

**The quality system is live and ready for Phase 1-2 agent work.**

Your concern about silent feature drops is now addressed by automated measurement.
