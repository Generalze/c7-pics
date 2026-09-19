# Phase 1-2: 4-Agent Parallel Workflow Master Coordination

**Status**: All agents briefed and ready to begin  
**Timeline**: 18 hours (16 hours agent work + 2 hours Opus 5 verification)  
**Quality Target**: 99%+ design alignment (measured)  
**Start Time**: NOW

---

## Agent Assignments (Parallel Work)

### Agent 1: Results Page & DataTable
**Deliverable**: Results listing page with sortable, generic DataTable  
**Briefing**: AGENT_1_RESULTS_PAGE.md  
**Checkpoints**: Hour 4 (build), Hour 8 (tests), Hour 12 (gates), Hour 16 (submit)  
**Success Metric**: DataTable is type-safe, Results page routable, all gates pass

### Agent 2: Incidents Page & Management
**Deliverable**: Incidents page with status badges + detail panel  
**Briefing**: AGENT_2_INCIDENTS_PAGE.md  
**Checkpoints**: Hour 4 (build), Hour 8 (tests), Hour 12 (gates), Hour 16 (submit)  
**Success Metric**: Badges visible, detail panel interactive, all gates pass

### Agent 3: Evidence Vault & Grid
**Deliverable**: Evidence gallery with 4-column grid + lightbox viewer  
**Briefing**: AGENT_3_EVIDENCE_VAULT.md  
**Checkpoints**: Hour 4 (build), Hour 8 (tests), Hour 12 (gates), Hour 16 (submit)  
**Success Metric**: Grid responsive, lightbox works, all gates pass

### Agent 4: Reports Page & Charts
**Deliverable**: Reports dashboard with data visualizations  
**Briefing**: AGENT_4_REPORTS_PAGE.md  
**Checkpoints**: Hour 4 (build), Hour 8 (tests), Hour 12 (gates), Hour 16 (submit)  
**Success Metric**: Charts render, KPIs correct, all gates pass

---

## Hour-by-Hour Timeline

### Hour 0: Kickoff
**Action**: All agents start implementation  
**Each agent**:
- Read their briefing document
- Create stub pages and components
- Add imports to router
- Run baseline: `npm run build`

**Status Check**: All builds should pass (0 errors)

---

### Hour 4: Checkpoint 1 — Build Must Compile
**Gate**: `npm run build` must exit with code 0

**For each agent**:
- ✓ TypeScript errors fixed
- ✓ Imports resolved
- ✓ Pages created and routed
- ✓ Build succeeds

**Reporting**:
```
Agent 1: ✓ Build passes (0 errors)
Agent 2: ✓ Build passes (0 errors)
Agent 3: ✓ Build passes (0 errors)
Agent 4: ✓ Build passes (0 errors)
```

**If build fails**: Agent fixes errors, reruns, continues to implementation

**Next**: Feature development (hours 4-8)

---

### Hour 8: Checkpoint 2 — Tests Must Run & Pass
**Gate**: `npm test -- --coverage` must show >=75% coverage

**For each agent**:
- ✓ 10+ test cases written
- ✓ Tests actually running (not just stubbed)
- ✓ All tests passing
- ✓ Coverage >=75%

**Reporting**:
```
Agent 1: ✓ 12 tests passing, 78% coverage
Agent 2: ✓ 12 tests passing, 76% coverage
Agent 3: ✓ 12 tests passing, 77% coverage
Agent 4: ✓ 11 tests passing, 76% coverage
```

**If tests fail**: Agent writes/fixes tests, reruns, continues to integration

**Next**: Polish and integration (hours 8-12)

---

### Hour 12: Checkpoint 3 — All Quality Gates Must Pass
**Gate**: `npm run quality:gates` must pass all 6 gates

**Gates checked**:
- ✓ Token compliance (no undefined CSS variables)
- ✓ No hardcoded colors (all colors use tokens)
- ✓ Import resolution (all modules exist)
- ✓ Routing compliance (all pages in router)
- ✓ No unwired seams (all pages imported)
- ✓ No type duplication (shared contracts enforced)

**Reporting**:
```
Agent 1 - Results Page:
  ✓ Token compliance
  ✓ No hardcoded colors
  ✓ Import resolution
  ✓ Routing compliance
  ✓ No unwired seams
  ✓ No type duplication
  STATUS: ALL GATES PASS ✓

Agent 2 - Incidents Page:
  [same format]

Agent 3 - Evidence Vault:
  [same format]

Agent 4 - Reports Page:
  [same format]
```

**If gate fails**: Agent fixes specific issue and reruns

**Critical gates for this workflow**:
- **Agent 2 & 3**: StatusBadge must render with visible colors (not transparent)
- **All agents**: Pages must be in router (not unwired seams)

**Next**: Final verification (hours 12-16)

---

### Hour 16: Agent Submission
**Each agent submits**:
1. Code (pages, components, tests)
2. Verification report:
```markdown
## Agent [X] Submission (Hour 16)

### Deliverables
- [x] apps/web/pages/[page].tsx
- [x] apps/web/components/ui/[components].tsx
- [x] apps/web/components/ui/__tests__/[tests].ts

### Quality Gates (All Passing)
- [x] Token compliance: ✓
- [x] No hardcoded colors: ✓
- [x] Import resolution: ✓
- [x] Routing compliance: ✓
- [x] No unwired seams: ✓
- [x] No type duplication: ✓

### Testing
- [x] Build: npm run build → SUCCESS (0 errors)
- [x] Tests: npm test -- --coverage → [X]% coverage, [X] tests passing
- [x] Gates: npm run quality:gates → ALL PASS

### Verification
- [x] Page loads at http://localhost:3000/[route]
- [x] No console errors
- [x] [Component-specific verification]
```

**Status**: All 4 agents have submitted work with green checkpoints

---

### Hour 17-18: Opus 5 Independent Verification

Opus 5 runs complete, independent verification (not reviewing agent claims).

**Step 1: Clean Build** (Hour 17:00)
```bash
rm -rf dist/ node_modules/.vite
npm run build
```
**Expected**: Build succeeds, zero TypeScript errors, dist/ contains valid assets

**Step 2: Test Execution** (Hour 17:15)
```bash
npm test -- --coverage --passWithNoTests=false
```
**Expected**: 47+ tests running (not stubbed), all passing, >=75% coverage

**Step 3: Quality Gates** (Hour 17:30)
```bash
npm run quality:gates
```
**Expected**: All 6 gates pass:
- ✓ Token compliance
- ✓ No hardcoded colors
- ✓ Import resolution
- ✓ Routing compliance
- ✓ No unwired seams
- ✓ No type duplication

**Step 4: Routing Verification** (Hour 17:45)
```bash
npm run dev &
sleep 5
curl http://localhost:3000/results    # Agent 1
curl http://localhost:3000/incidents  # Agent 2
curl http://localhost:3000/evidence   # Agent 3
curl http://localhost:3000/reports    # Agent 4
```
**Expected**: All pages load (200 status), no 404s

**Step 5: Component Contracts** (Hour 18:00)
```bash
npm test -- **/*.contract.test.ts
```
**Expected**: 
- StatusBadge contract passes (all statuses render with visible colors)
- DataTable contract passes (generic type parameter preserved)

**Step 6: Design Alignment Measurement** (Hour 18:15)
- Compare against Figma design specification
- Measure visual alignment percentage
- Identify any gaps

---

### Hour 18: Final Decision

#### ✓ If All Verifications Pass
```
═════════════════════════════════════════════════
           DEPLOYMENT APPROVED ✓
═════════════════════════════════════════════════

Build:                 0 TypeScript errors ✓
Tests:                 47 tests passing, 77% coverage ✓
Quality Gates:         All 6 gates passing ✓
Routing:               All 4 pages routable ✓
Component Contracts:   StatusBadge, DataTable verified ✓
Design Alignment:      98.7% (vs Figma target) ✓

STATUS: READY FOR PRODUCTION DEPLOYMENT

Recommendation: Merge to main and deploy
═════════════════════════════════════════════════
```

**Action**: Merge to main, deploy to production

#### ❌ If Any Verification Fails
```
═════════════════════════════════════════════════
           DEPLOYMENT BLOCKED ❌
═════════════════════════════════════════════════

Failed Gate: [Gate Name]

Failure Details:
[Specific error message and context]

Affected Component: [Agent X - Page/Component]

Action Required:
1. Agent [X] fixes the specific failure
2. Agent [X] verifies: npm run quality:gates passes
3. Agent [X] resubmits code
4. Opus 5 re-verifies the fixed gate
5. If all gates pass → Approval

Estimated Resolution Time: 1-2 hours

═════════════════════════════════════════════════
```

**Action**: Return to agents with specific failure details, resubmit after fix

---

## Shared Resources & Reusability

### Components Agents Can Reuse

**Agent 1 Creates**:
- DataTable\<T\> (fully generic)
- Status filter tabs (reusable)

**Agent 2 Can Use**:
- DataTable from Agent 1 (if needed)
- Status filter tabs from Agent 1

**Agent 3 Can Use**:
- DataTable from Agent 1 (for detail panel if needed)
- Status badges (from existing system)

**Agent 4 Can Use**:
- KPI card styling from Command Centre
- DataTable from Agent 1 (if needed for detailed tables)

### Design Tokens (All Agents Use)
All agents use the same design token set — no variations, no duplication.

```css
/* Colors - use ONLY these tokens, never hardcode */
var(--vf-color-navy)
var(--vf-color-card-bg)
var(--vf-color-success)
var(--vf-color-warn)
var(--vf-color-danger)
var(--vf-color-info)
var(--vf-color-neutral)

/* Spacing */
var(--vf-spacing-xs)
var(--vf-spacing-sm)
var(--vf-spacing-md)
var(--vf-spacing-lg)

/* Typography */
var(--vf-font-size-sm)
var(--vf-font-size-base)
var(--vf-font-size-lg)
```

---

## Communication & Status Updates

### Every 4 Hours, Agents Report:
```
Hour 4:  Build status (pass/fail)
Hour 8:  Test status (count, coverage %)
Hour 12: Gate status (pass/fail for each gate)
Hour 16: Submission status (ready, issue?)
```

### If Any Agent Gets Stuck:
1. **Identify the issue**: Which gate is failing?
2. **Fix the root cause**: Code issue, import issue, routing issue?
3. **Rerun that gate**: `npm run quality:gates` or specific gate script
4. **Verify fix**: Gate passes
5. **Continue to next phase**

### No Skipping Gates
Gates are not negotiable. An agent cannot claim "component is done" if a gate fails. The gate must pass.

---

## Opus 5 Role (Independent Verification)

Opus 5 is the **independent auditor**. Opus 5:
- ✓ Does NOT read agent claims
- ✓ Does NOT trust self-assessments
- ✓ Runs all gates independently
- ✓ Measures alignment vs. Figma
- ✓ Approves deployment OR blocks with specific failure details
- ✓ Never passes a blocked gate

**Opus 5's job**: Prevent the 34% alignment disaster from happening again

---

## Success Looks Like (Hour 18)

### All Agents Report
- "Build passes: 0 TypeScript errors"
- "Tests pass: [X]+ tests, >=75% coverage"
- "Quality gates: ALL PASS"
- "Ready for deployment"

### Opus 5 Reports
- "Build verified: clean, zero errors"
- "Tests verified: 47+ running, all passing"
- "Gates verified: all 6 passing independently"
- "Pages verified: all 4 routable, no 404s"
- "Component contracts verified: StatusBadge visible, DataTable generic"
- "Design alignment: 98.7% to Figma spec"
- **RECOMMENDATION: Deploy**

### Result
- ✓ 4 new pages shipped (Results, Incidents, Evidence, Reports)
- ✓ Reusable components (DataTable, StatusBadge, charts)
- ✓ 99%+ measured alignment (not claimed)
- ✓ Zero silent feature drops
- ✓ All gates passed twice (agents + Opus 5)

---

## Key Reminders for Agents

1. **If a gate fails**: Fix your code, don't skip the gate
2. **Test everything**: Don't just build locally, run `npm test -- --coverage`
3. **Use design tokens**: Zero hardcoded colors
4. **Wire pages in router**: Don't leave unwired seams
5. **StatusBadge must be visible**: Not transparent, not gray, VISIBLE
6. **Report checkpoint status**: Every 4 hours
7. **Test your type safety**: DataTable must be generic, contracts must pass

---

## Reference Documentation

**Quality System**:
- QUALITY_GUARDRAILS.md — Gate definitions
- QUALITY_GUARDRAILS_OPERATIONAL.md — How to use gates
- QUALITY_SYSTEM_OVERVIEW.md — Why 99% is measured

**Agent Briefings**:
- AGENT_1_RESULTS_PAGE.md
- AGENT_2_INCIDENTS_PAGE.md
- AGENT_3_EVIDENCE_VAULT.md
- AGENT_4_REPORTS_PAGE.md

**Previous Work**:
- PHASE1_PROGRESS.md — What's already built
- PHASE1_AGENT_WORKFLOW.md — Full workflow details

---

## Timeline At A Glance

```
Hour 0:  Agents start (briefed + ready)
Hour 4:  Checkpoint 1: Build passes
Hour 8:  Checkpoint 2: Tests pass
Hour 12: Checkpoint 3: Gates pass
Hour 16: Agents submit work
Hour 17: Opus 5 verification begins
Hour 18: Decision: Deploy ✓ or Block ❌
```

---

## Launch Command

**For Coordinator**: Launch all 4 agents with their briefing documents

**For Agents**: Read your briefing, follow the checkpoints, report status every 4 hours

**For Opus 5**: At hour 17, run complete independent verification

---

**4-Agent Phase 1-2 Workflow is LIVE.**

All agents are briefed. All gates are in place. All checkpoints are defined.

**Time: Start now. Target: Done in 18 hours. Quality: 99%+ measured.**

**Go.**
