# Phase 1: 4-Agent Parallel Workflow with Quality Gates

**Objective**: Implement Results, Incidents, Evidence, and Reports pages with 99%+ design alignment  
**Team**: 4 Haiku 4.5 agents (parallel) + 1 Opus 5 (quality verification)  
**Duration**: 18 hours (4 agents × 4 hours + verification)  
**Quality Target**: All quality gates pass (measured, not claimed)

---

## Agent Assignments

### Agent 1: Results Page + DataTable
**Deliverables**:
- `apps/web/pages/results.tsx` (Results page)
- `apps/web/components/ui/datatable.tsx` (Enhanced DataTable with sorting, filtering)
- `apps/web/components/ui/__tests__/datatable.test.tsx` (Tests)
- Tests: >=10 test cases, >=75% coverage

**Quality Gates**:
- ✓ DataTable is generic: `DataTable<T>` preserves type `T`
- ✓ ResultsPage appears in router.ts
- ✓ All imports resolve
- ✓ Zero TypeScript errors
- ✓ Tests run with >=75% coverage

**Design Spec**: Results table with columns: ID, Time, LGA, Ward, PU, Party A, Party B, Party C, Total, Status  
**Status Options**: pending, submitted, verified, flagged  
**Interactions**: Click row → detail panel, Filter by status, Sort by column

---

### Agent 2: Incidents Page + IncidentManager
**Deliverables**:
- `apps/web/pages/incidents.tsx` (Incidents page)
- `apps/web/components/ui/incident-detail-panel.tsx` (Detail panel with actions)
- `apps/web/components/ui/__tests__/incident-management.test.tsx` (Tests)
- Tests: >=10 test cases, >=75% coverage

**Quality Gates**:
- ✓ IncidentsPage appears in router.ts
- ✓ All components render without errors
- ✓ All imports resolve
- ✓ Zero TypeScript errors
- ✓ Tests run with >=75% coverage

**Design Spec**: Incident cards (not table) with: Title, Description, Severity badge, Status badge, Location, Agent  
**Severity Colors**: critical (red), high (orange), medium (yellow), low (gray)  
**Status Options**: open, in_progress, escalated, resolved  
**Interactions**: Click card → detail panel, Add note, Assign agent, Change status

---

### Agent 3: Evidence Vault + Grid
**Deliverables**:
- `apps/web/pages/evidence.tsx` (Evidence Vault page)
- `apps/web/components/ui/evidence-grid.tsx` (Grid layout)
- `apps/web/components/ui/lightbox.tsx` (Image/video viewer)
- `apps/web/components/ui/__tests__/evidence-grid.test.tsx` (Tests)
- Tests: >=10 test cases, >=75% coverage

**Quality Gates**:
- ✓ EvidencePage appears in router.ts
- ✓ StatusBadge renders with visible colors for all statuses
- ✓ All imports resolve
- ✓ Zero TypeScript errors
- ✓ Tests run with >=75% coverage

**Design Spec**: 4-column grid, thumbnail display, Status badges (verified, pending, flagged, filed), Lightbox on click  
**Status Options**: verified, pending, flagged, filed  
**Interactions**: Click thumbnail → lightbox, Filter by status, Sort by date

---

### Agent 4: Reports Page + Charts
**Deliverables**:
- `apps/web/pages/reports.tsx` (Reports page)
- `apps/web/components/ui/chart-party-tally.tsx` (Party tally chart)
- `apps/web/components/ui/chart-incident-breakdown.tsx` (Incident severity chart)
- `apps/web/components/ui/__tests__/reports.test.tsx` (Tests)
- Tests: >=10 test cases, >=75% coverage

**Quality Gates**:
- ✓ ReportsPage appears in router.ts
- ✓ Charts render without errors
- ✓ All tokens defined and used
- ✓ Zero TypeScript errors
- ✓ Tests run with >=75% coverage

**Design Spec**: 
- Key metrics section (4 KPI cards)
- Party tally chart (stacked bar)
- Incident breakdown chart (pie or donut)
- Top LGAs by reporting (bar chart)
- Export buttons (PDF, CSV)

---

## Timeline & Checkpoints

### Hour 0: Agent Kickoff
- All agents receive AGENT_BRIEFING.md
- Baseline gates pass: `npm run quality:gates`
- Agents clone/branch and begin implementation

**Each agent's setup**:
```bash
npm run quality:gates  # Baseline should pass
npm run build          # Should succeed
npm test               # Should pass
```

---

### Hour 4: First Checkpoint
**Gate Check**: Build must compile

**Opus 5 verifies**:
```bash
npm run build
```

**For each agent**:
- ✓ Pages created (result files exist)
- ✓ Build succeeds (zero TypeScript errors)
- ✓ No unresolved imports

**If build fails**: Agent must fix TypeScript errors before proceeding  
**If build passes**: Continue to feature development

**Reporting**: Each agent submits:
```
Agent 1 - Results Page: Build passes, DataTable interface defined, tests stubbed
Agent 2 - Incidents Page: Build passes, components stubbed, routing configured
Agent 3 - Evidence Vault: Build passes, grid layout drafted, lightbox stubbed
Agent 4 - Reports Page: Build passes, chart components stubbed, chart library selected
```

---

### Hour 8: Second Checkpoint
**Gate Check**: Tests must run and pass

**Opus 5 verifies**:
```bash
npm test -- --coverage
```

**For each agent**:
- ✓ Tests are executable (not just created)
- ✓ Coverage >=75%
- ✓ No test syntax errors

**If tests fail**: Agent must fix test issues and rerun  
**If tests pass**: Continue to integration

**Reporting**: Each agent submits:
```
Agent 1 - Results Page: 12 tests passing, 78% coverage
Agent 2 - Incidents Page: 10 tests passing, 76% coverage
Agent 3 - Evidence Vault: 14 tests passing, 82% coverage
Agent 4 - Reports Page: 11 tests passing, 77% coverage
```

---

### Hour 12: Third Checkpoint
**Gate Check**: All quality gates must pass

**Opus 5 verifies**:
```bash
npm run quality:gates
```

**Gates checked**:
- ✓ Token compliance (no undefined tokens)
- ✓ No hardcoded colors
- ✓ Import resolution (all modules found)
- ✓ Routing compliance (all pages in router)
- ✓ No unwired seams (all pages imported)
- ✓ No type duplication

**If gates fail**: Agent must fix specific failures and rerun gates  
**If gates pass**: Ready for submission

**Failure example**:
```
❌ GATE FAILED: Routing Compliance
ResultsPage defined in pages/results.tsx
NOT imported in app/router.ts

Action: Add to router.ts
import ResultsPage from './pages/results'
export const OPERATOR_PAGES = {
  results: ResultsPage,
  ...
}
```

**Reporting**: Each agent submits gate status:
```
Agent 1 - Results Page:
  ✓ Token compliance
  ✓ Import resolution
  ✓ Routing compliance
  ✓ No unwired seams
  ✓ Build passes
  ✓ Tests: 78% coverage
```

---

### Hour 16: Agent Submission
**Each agent submits**:
1. Code (pages, components, tests)
2. Gate verification report (all gates passing)
3. Test coverage report (>=75%)
4. Build log (zero TypeScript errors)

**Submission format**:
```markdown
## Agent 1: Results Page Submission

### Deliverables
- [x] pages/results.tsx
- [x] components/ui/datatable.tsx
- [x] components/ui/__tests__/datatable.test.tsx

### Quality Gates (All Passing)
- [x] Token compliance: ✓
- [x] Import resolution: ✓
- [x] Routing compliance: ✓
- [x] No unwired seams: ✓
- [x] Build succeeds: ✓
- [x] Tests: 12 passing, 78% coverage

### Implementation Notes
- DataTable is fully generic: DataTable<T> preserves row type
- Supports sorting by any column
- Click handler for detail view
- Responsive mobile layout
```

---

## Hour 17-18: Opus 5 Verification (Independent)

Opus 5 runs **complete, independent verification** (not reviewing agent claims):

### Build Verification
```bash
rm -rf dist/ node_modules/.vite
npm run build
# Exit code must be 0
# dist/ directory must contain valid assets
```

### Test Verification
```bash
npm test -- --coverage --passWithNoTests=false
# Tests must actually run (not just exist)
# Coverage must be >=75%
# All tests must pass
```

### Gate Verification
```bash
npm run quality:gates
# All 6 gates must pass:
# ✓ Token compliance
# ✓ No hardcoded colors
# ✓ Import resolution
# ✓ Routing compliance
# ✓ No unwired seams
# ✓ No type duplication
```

### Routing Verification
```bash
npm run dev &
sleep 5
curl http://localhost:3000/results
curl http://localhost:3000/incidents
curl http://localhost:3000/evidence
curl http://localhost:3000/reports
# All pages must load (200 status, no 404s)
kill %1
```

### Component Contract Verification
```bash
npm test -- **/*.contract.test.ts
# StatusBadge contract: maps all statuses to visible colors
# DataTable contract: preserves generic type parameter
```

### Opus 5 Alignment Report

```
═══════════════════════════════════════════════════════════════
                   PHASE 1 QUALITY VERIFICATION
═══════════════════════════════════════════════════════════════

BUILD INTEGRITY
✓ TypeScript: 0 errors
✓ Vite build: dist/ valid, 4 chunks
✓ All imports resolve

TESTS
✓ Test execution: 47 tests running (not stubbed)
✓ Coverage: 78% lines (target: >=75%)
✓ Contract tests: StatusBadge, DataTable verified

QUALITY GATES
✓ Token compliance: 124/124 defined
✓ No hardcoded colors: 0 violations
✓ Import resolution: ✓ all modules exist
✓ Routing compliance: ✓ all pages in router
✓ Unwired seams: 0 detected
✓ Type duplication: 0 conflicts

ROUTING VERIFICATION
✓ /results → ResultsPage loads
✓ /incidents → IncidentsPage loads
✓ /evidence → EvidencePage loads
✓ /reports → ReportsPage loads

DESIGN ALIGNMENT
✓ Results page: matches Figma spec
✓ Incidents page: matches Figma spec
✓ Evidence vault: matches Figma spec
✓ Reports page: matches Figma spec

COMPONENT STATUS
✓ DataTable: fully generic, type-safe
✓ StatusBadge: all statuses render with visible colors
✓ IncidentCard: severity colors correct
✓ Charts: rendering without errors

═══════════════════════════════════════════════════════════════
ALIGNMENT: 98.7%  ✓ PRODUCTION READY
═══════════════════════════════════════════════════════════════

Recommendation: APPROVED FOR DEPLOYMENT
```

---

## Approval Decision

### If All Gates Pass
```
✓ DEPLOYMENT APPROVED

All gates verified independently:
- Build compiles: ✓
- Tests pass: ✓
- Routing works: ✓
- Design alignment: 98.7%
- No silent feature drops detected

Ready to merge and deploy.
```

### If Any Gate Fails
```
❌ DEPLOYMENT BLOCKED

Gate failure: Routing Compliance
Evidence page not in router.ts

Action required:
1. Agent 3 fixes: Add EvidencePage to router.ts
2. Agent 3 verifies: npm run quality:gates passes
3. Agents resubmit code
4. Opus 5 re-verifies independently
5. If all pass → Approved
```

---

## Key Differences from 34% Workflow

| Aspect | Before | After |
|--------|--------|-------|
| **Agent work** | 4 parallel agents, no checkpoints | 4 parallel + checkpoints at hour 4, 8, 12 |
| **Build status** | Unknown until merge | Tested every 4 hours |
| **Gates during work** | None | Run at each checkpoint; failures visible |
| **Agent claims** | "99.2% token compliance" | "Gates all passing" (verified by scripts) |
| **Verification** | Opus 5 reviews claims | Opus 5 runs gates independently |
| **Deployment decision** | "Looks good" | All gates pass twice OR blocked |

---

## Success Looks Like

**Hour 16 Agent Reports**:
- Agent 1: "Results page complete, all gates passing"
- Agent 2: "Incidents page complete, all gates passing"
- Agent 3: "Evidence vault complete, all gates passing"
- Agent 4: "Reports page complete, all gates passing"

**Hour 18 Opus 5 Report**:
- ✓ Build verified: zero TypeScript errors
- ✓ Tests verified: 47 passing, 78% coverage
- ✓ Gates verified: all 6 passing
- ✓ Pages verified: all 4 routable
- ✓ Alignment: 98.7% to Figma design
- **Recommendation**: Deploy

**Actual Result**: Pages ship with 99% design alignment, zero silent feature drops

---

## Reference Documentation

- [Quality Guardrails Framework](./QUALITY_GUARDRAILS.md) — Gate definitions
- [Quality System Overview](./QUALITY_SYSTEM_OVERVIEW.md) — Executive summary
- [Operational Procedure](./QUALITY_GUARDRAILS_OPERATIONAL.md) — How agents use gates
- [Activation Checklist](./GUARDRAILS_ACTIVATION_CHECKLIST.md) — Pre-launch setup
- [Agent Briefing](./AGENT_BRIEFING.md) — What agents receive

---

**Phase 1 workflow with measured quality gates is ready to launch.**
