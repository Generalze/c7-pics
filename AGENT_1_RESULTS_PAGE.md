# Agent 1: Results Page & DataTable Component

**Role**: Build Results page with sortable DataTable  
**Duration**: 16 hours  
**Quality Target**: 99%+ design alignment  
**Status**: Ready to start

---

## Your Deliverables

### 1. Results Page (`apps/web/pages/results.tsx`)
A complete results listing page with:
- **Results Table**: Sortable columns, filter by status
- **Status Badges**: verified, pending, submitted, flagged (with visible colors)
- **Detail Panel**: Click row → see full details
- **Real-time Updates**: Live result count, submission rate
- **Responsive Design**: Works on mobile and desktop

### 2. Enhanced DataTable Component (`apps/web/components/ui/datatable.tsx`)
Generic, reusable table component:
- **Type-Safe**: `DataTable<T>` preserves row type `T`
- **Sortable**: Click column headers to sort
- **Filterable**: Filter by column values
- **Sticky Header**: Header stays visible when scrolling
- **Pagination**: Load more or page controls
- **Responsive**: Horizontal scroll on mobile

### 3. Component Tests (`apps/web/components/ui/__tests__/datatable.test.ts`)
- Minimum 10 test cases
- Test type safety (generic parameter)
- Test sorting, filtering, pagination
- Target >=75% coverage

---

## Design Specification

### Results Page Layout
```
┌─ Results Dashboard ────────────────────────────────┐
│                                                    │
│  Status Filter Tabs:                              │
│  [ALL] [SUBMITTED] [VERIFIED] [PENDING] [FLAGGED] │
│   123    45         67         23        12       │
│                                                    │
│  Results Table:                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ID  │ Time │ LGA  │ Ward │ PU │ A │ B │ C │  │
│  ├─────────────────────────────────────────────┤  │
│  │ 1   │ 14:32│ Ogun │ 1    │ 5  │45│32│18│  │
│  │ 2   │ 14:45│ Lagos│ 2    │ 3  │52│28│15│  │
│  │ [Click row for details] ────────────┤  │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Detail Panel (right):                            │
│  ┌─ Result #1 ──────────────────────────────┐    │
│  │ Location: Ogun / 1 / 5                   │    │
│  │ Time: 2026-09-19 14:32 UTC               │    │
│  │ Agent: Alice Smith                       │    │
│  │                                          │    │
│  │ Votes:                                   │    │
│  │  Party A: 45 (45%)                       │    │
│  │  Party B: 32 (32%)                       │    │
│  │  Party C: 18 (18%)                       │    │
│  │  Other:   5 (5%)                         │    │
│  │ Total: 100                               │    │
│  │                                          │    │
│  │ Status: ✓ VERIFIED                       │    │
│  │ Evidence: 3 images attached              │    │
│  │ Flagged Issues: None                     │    │
│  │                                          │    │
│  │ [Approve] [Flag] [Reject]               │    │
│  └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

### Status Badge Colors
- **verified**: Green (#00d084)
- **pending**: Gray (#9ca3af)
- **submitted**: Blue (#42a5f5)
- **flagged**: Red (#ff5252)

### Column Sorting
User clicks column header:
- **First click**: Sort ascending
- **Second click**: Sort descending
- **Visual indicator**: Arrow (↑ or ↓) on active column

### Status Filter Tabs
- Show count of results in each status
- Clicking a tab filters the table
- "ALL" shows everything

---

## Quality Gates (Must Pass)

### Gate 1: Build Must Compile
```bash
npm run build
# Exit code must be 0
# Zero TypeScript errors
```

**Checkpoint**: Hour 4  
**If fails**: Fix TypeScript errors, rerun  
**If passes**: Continue to hour 8

### Gate 2: Tests Must Run & Pass
```bash
npm test -- --coverage
# At least 10 tests running
# Coverage >= 75%
# All tests passing
```

**Checkpoint**: Hour 8  
**If fails**: Write/fix tests, rerun  
**If passes**: Continue to hour 12

### Gate 3: All Quality Gates Pass
```bash
npm run quality:gates
# ✓ Token compliance
# ✓ No hardcoded colors
# ✓ Import resolution
# ✓ Routing compliance
# ✓ No unwired seams
# ✓ No type duplication
```

**Checkpoint**: Hour 12  
**If any fail**: Fix and rerun  
**If all pass**: Ready for submission

### Gate 4: Pages Routable
```bash
npm run dev &
curl http://localhost:3000/results
# Page must load (200 status)
# No console errors
```

**Checkpoint**: Hour 16 (before submission)  
**If fails**: Fix routing, rerun  
**If passes**: Ready to submit

---

## Component Contract: DataTable<T>

Your DataTable must be **fully generic**.

```typescript
// This must work:
const agents: Agent[] = [...]
const agentColumns: DataTableColumn<Agent>[] = [
  { key: 'name', label: 'Name' },  // TS checks 'name' exists on Agent
]
<DataTable<Agent> data={agents} columns={agentColumns} />

// This must FAIL at compile time:
const agentColumns: DataTableColumn<Agent>[] = [
  { key: 'invalidField', label: 'Nope' },  // TS error: invalidField not on Agent
]
```

**Test**: `npm test -- datatable.contract.test.ts` must pass

---

## Implementation Checklist

### Hour 0-4: Foundation
- [ ] Create `pages/results.tsx` (stub page)
- [ ] Create `components/ui/datatable.tsx` (interface + stubs)
- [ ] Add ResultsPage to router.ts
- [ ] Run: `npm run build` → must succeed
- [ ] **Checkpoint 1: Build passes**

### Hour 4-8: Implementation
- [ ] Implement DataTable generics
- [ ] Implement Results table with real columns
- [ ] Implement status filter tabs
- [ ] Implement detail panel (click handler)
- [ ] Write 10+ tests for DataTable
- [ ] Run: `npm test -- --coverage` → >=75% coverage
- [ ] **Checkpoint 2: Tests pass**

### Hour 8-12: Polish & Integration
- [ ] Add sorting to DataTable
- [ ] Add responsive design (mobile scroll)
- [ ] Add status badge colors (verify visible)
- [ ] Hook up real-time updates (wire API)
- [ ] Run: `npm run quality:gates` → all pass
- [ ] **Checkpoint 3: All gates pass**

### Hour 12-16: Verification & Submission
- [ ] Test in dev server: `npm run dev`
- [ ] Verify page loads at /results
- [ ] Verify status badges have colors
- [ ] Verify DataTable is type-safe
- [ ] Verify sorting works
- [ ] Verify responsive layout
- [ ] **Checkpoint 4: Pages routable**
- [ ] **Submit work with gate verification reports**

---

## Testing Requirements

**Minimum 10 test cases. Test these:**

1. DataTable renders with data
2. DataTable is generic (type parameter preserved)
3. Click column header sorts ascending
4. Click column header again sorts descending
5. Status filter tabs show correct counts
6. Click filter tab shows only that status
7. Click table row triggers detail panel
8. Detail panel shows full result data
9. StatusBadge renders with visible color for each status
10. Pagination works (if implemented)

**Run with coverage**:
```bash
npm test -- --coverage
```

**Expected**: >=75% coverage

---

## API Integration (Hour 8-12)

Wire up to these endpoints (already exist):
- `GET /api/dashboard/metrics` → get results summary
- `GET /api/dashboard/system-status` → get real-time stats

**Don't implement API** — just wire the calls. Mock data is fine for hour 12 checkpoint.

---

## Files You'll Create/Modify

**Create**:
- `apps/web/pages/results.tsx`
- `apps/web/components/ui/datatable.tsx`
- `apps/web/components/ui/datatable.module.css`
- `apps/web/components/ui/__tests__/datatable.test.ts`

**Modify**:
- `apps/web/app/router.ts` → Add ResultsPage import + route

---

## Design Token Usage

**Use these tokens (no hardcoded colors)**:

```css
/* Colors */
var(--vf-color-navy)           /* #0a0e27 */
var(--vf-color-card-bg)        /* #1a1f3a */
var(--vf-color-success)        /* #00d084 */
var(--vf-color-warn)           /* #ffa726 */
var(--vf-color-danger)         /* #ff5252 */
var(--vf-color-info)           /* #42a5f5 */
var(--vf-color-neutral)        /* #9ca3af */

/* Spacing */
var(--vf-spacing-xs)           /* 4px */
var(--vf-spacing-sm)           /* 8px */
var(--vf-spacing-md)           /* 16px */
var(--vf-spacing-lg)           /* 24px */

/* Typography */
var(--vf-font-size-sm)         /* 12px */
var(--vf-font-size-base)       /* 14px */
var(--vf-font-size-lg)         /* 16px */
```

---

## Checkpoint Reporting

### Hour 4 Report
```markdown
## Agent 1: Hour 4 Checkpoint

**Status**: Build passes ✓

- ResultsPage created: apps/web/pages/results.tsx
- DataTable stub created: apps/web/components/ui/datatable.tsx
- Router updated: ResultsPage imported + route added
- Build: npm run build → SUCCESS (0 errors)

**Next**: Implement DataTable generics and Results table
```

### Hour 8 Report
```markdown
## Agent 1: Hour 8 Checkpoint

**Status**: Tests pass ✓

- DataTable generics implemented
- Results table with 8 columns implemented
- Status filter tabs implemented
- 12 tests written, all passing
- Coverage: 78%

**Next**: Polish, integration, final gates
```

### Hour 12 Report
```markdown
## Agent 1: Hour 12 Checkpoint

**Status**: All quality gates pass ✓

- Sorting implemented (working)
- Responsive design (mobile scroll)
- Status badges (all colors visible)
- All imports resolve ✓
- All pages routed ✓
- No unwired seams ✓
- npm run quality:gates → ALL PASS

**Next**: Verification and submission
```

### Hour 16 Submission Report
```markdown
## Agent 1: SUBMISSION (Hour 16)

**Status**: READY FOR OPUS 5 VERIFICATION

### Deliverables
- [x] apps/web/pages/results.tsx (complete)
- [x] apps/web/components/ui/datatable.tsx (complete)
- [x] apps/web/components/ui/__tests__/datatable.test.ts (12 tests, 78% coverage)

### Quality Gates (All Passing)
- [x] Build: 0 TypeScript errors
- [x] Tests: 12 passing, 78% coverage
- [x] Token compliance: ✓
- [x] Import resolution: ✓
- [x] Routing compliance: ✓
- [x] No unwired seams: ✓
- [x] No type duplication: ✓

### Verification
- [x] Page loads at http://localhost:3000/results
- [x] DataTable is fully generic (type-safe)
- [x] Status badges render with visible colors
- [x] Sorting works
- [x] Responsive design works
- [x] All tests pass

### Notes
- DataTable is reusable; Agents 2, 3, 4 can use it
- No API integration yet (Hour 8-12 scope was wire-up only)
- Ready for Opus 5 independent verification
```

---

## Success Looks Like

At hour 16 submission:
- ✓ Results page built and routable
- ✓ DataTable is fully generic (type-safe)
- ✓ All 12 tests passing
- ✓ 78% code coverage
- ✓ Status badges visible and colored correctly
- ✓ Build passes with zero TypeScript errors
- ✓ All quality gates passing

At hour 18 (Opus 5 verification):
- ✓ Opus 5 runs independent verification
- ✓ Build verified
- ✓ Tests verified
- ✓ Gates verified
- ✓ Design alignment: 98%+

**Then**: Deploy to production with confidence

---

## Reference Docs

- `QUALITY_GUARDRAILS_OPERATIONAL.md` — How quality gates work
- `QUALITY_GUARDRAILS.md` — Gate definitions
- `PHASE1_PROGRESS.md` — What's already built (Command Centre, KPI cards, etc.)
- `PHASE1_AGENT_WORKFLOW.md` — Full 4-agent coordination

---

## Questions?

All answers are in QUALITY_GUARDRAILS_OPERATIONAL.md. 

**Key rule**: If a gate fails, don't skip it. Fix the code and rerun the gate. Gates are not negotiable.

---

**Agent 1: Results Page & DataTable — Ready to begin.**

Hour 0: Start now  
Hour 4: Checkpoint 1 (build passes)  
Hour 8: Checkpoint 2 (tests pass)  
Hour 12: Checkpoint 3 (gates pass)  
Hour 16: Submit for Opus 5 verification  
Hour 18: Opus 5 approves or requests fixes

**Go.**
