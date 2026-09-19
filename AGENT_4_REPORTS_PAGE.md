# Agent 4: Reports Page & Chart Components

**Role**: Build Reports page with data visualizations  
**Duration**: 16 hours  
**Quality Target**: 99%+ design alignment  
**Status**: Ready to start

---

## Your Deliverables

### 1. Reports Page (`apps/web/pages/reports.tsx`)
A comprehensive reporting dashboard with:
- **Key Metrics Cards**: 4 KPI cards (total PUs, reporting, verified, flagged)
- **Party Tally Chart**: Stacked bar or pie showing vote distribution
- **Incident Breakdown**: Pie/donut chart by severity
- **Top LGAs**: Bar chart of LGAs by reporting rate
- **Export Controls**: Download as PDF or CSV
- **Real-time Updates**: Live metrics refresh

### 2. Chart Component: Party Tally (`apps/web/components/ui/chart-party-tally.tsx`)
Bar or pie chart showing:
- **Data**: Vote counts for each political party
- **Display**: Horizontal stacked bar or pie chart
- **Legend**: Party name + vote count + percentage
- **Interactive**: Hover shows tooltip with details
- **Responsive**: Scales to container size

### 3. Chart Component: Incident Breakdown (`apps/web/components/ui/chart-incident-breakdown.tsx`)
Pie/donut chart showing:
- **Data**: Incident count by severity (critical, high, medium, low)
- **Colors**: Match severity colors (red, orange, yellow, gray)
- **Legend**: Severity + count + percentage
- **Interactive**: Hover highlights segment
- **Responsive**: Scales to container size

### 4. Component Tests (`apps/web/components/ui/__tests__/reports.test.ts`)
- Minimum 10 test cases
- Test chart rendering
- Test data aggregation
- Test KPI card values
- Target >=75% coverage

---

## Design Specification

### Reports Page Layout
```
┌─ Reports Dashboard ────────────────────────────────┐
│                                                    │
│  Key Metrics (4 KPI Cards):                       │
│  ┌──────────────┐ ┌──────────────┐                │
│  │ Total PUs    │ │ Reporting    │                │
│  │ 2,456        │ │ 1,234 (50%)  │                │
│  │ ↑ 5% vs last │ │ ↑ 3% vs last │                │
│  └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐                │
│  │ Verified     │ │ Flagged      │                │
│  │ 890 (72%)    │ │ 45 (4%)      │                │
│  │ ↑ 7% vs last │ │ ↓ 2% vs last │                │
│  └──────────────┘ └──────────────┘                │
│                                                    │
│  Party Tally (Horizontal Stacked Bar):            │
│  ┌─ Party Tally Results ─────────────────────┐   │
│  │ Party A: ████████░░░░ 450k (35%)          │   │
│  │ Party B: ██████░░░░░░░ 380k (30%)         │   │
│  │ Party C: █████░░░░░░░░ 340k (27%)         │   │
│  │ Other:   ███░░░░░░░░░░ 70k (8%)           │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Incident Breakdown (Pie Chart):                  │
│  ┌─ Incidents by Severity ──────────────┐        │
│  │         ╱╲                           │        │
│  │        ╱  ╲  Critical (🔴) 5        │        │
│  │       ╱    ╲ High (🟠) 12            │        │
│  │      ╱      ╲ Medium (🟡) 18        │        │
│  │     ╱________╲ Low (⚫) 10           │        │
│  └────────────────────────────────────────┘       │
│                                                    │
│  Top LGAs (Bar Chart):                            │
│  ┌─ Top LGAs by Reporting Rate ──────────┐       │
│  │ Ogun    ███████░░░░ 95% (450 PUs)    │       │
│  │ Lagos   ██████░░░░░░ 88% (380 PUs)   │       │
│  │ Osun    ██████░░░░░░ 87% (340 PUs)   │       │
│  │ Edo     █████░░░░░░░ 82% (210 PUs)   │       │
│  │ Kano    ████░░░░░░░░ 75% (190 PUs)   │       │
│  └──────────────────────────────────────┘        │
│                                                    │
│  Export Section:                                  │
│  [Download PDF] [Download CSV] [Print]           │
│                                                    │
│  Last Updated: 2026-09-19 15:45 UTC              │
└────────────────────────────────────────────────────┘
```

### Chart Libraries
**Recommended**: Recharts (React-friendly, responsive)  
**Alternative**: Chart.js (popular, well-documented)  
**Do not use**: Multiple libraries (pick one)

### Color Scheme
- **Party Tally**: Use distinct colors for each party (navy, purple, teal, gray)
- **Incident Breakdown**: Match severity colors (red, orange, yellow, gray)
- **KPI Cards**: Use accent colors from design tokens

---

## Quality Gates (Must Pass)

### Gate 1: Build Must Compile
```bash
npm run build
# Exit code must be 0
# Zero TypeScript errors
```

**Checkpoint**: Hour 4  
**Success**: Continue to hour 8

### Gate 2: Tests Must Run & Pass
```bash
npm test -- --coverage
# At least 10 tests running
# Coverage >= 75%
# All tests passing
```

**Checkpoint**: Hour 8  
**Success**: Continue to hour 12

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
**Success**: Ready for submission

### Gate 4: Pages Routable
```bash
npm run dev &
curl http://localhost:3000/reports
# Page must load (200 status)
# Charts must render without errors
```

**Checkpoint**: Hour 16 (before submission)  
**Success**: Ready to submit

---

## Implementation Checklist

### Hour 0-4: Foundation
- [ ] Choose chart library (Recharts recommended)
- [ ] Create `pages/reports.tsx` (stub)
- [ ] Create `components/ui/chart-party-tally.tsx` (stub)
- [ ] Create `components/ui/chart-incident-breakdown.tsx` (stub)
- [ ] Add ReportsPage to router.ts
- [ ] Run: `npm run build` → must succeed
- [ ] **Checkpoint 1: Build passes**

### Hour 4-8: Implementation
- [ ] Import chart library
- [ ] Implement KPI cards (reuse from Command Centre if available)
- [ ] Implement Party Tally chart (stacked bar or pie)
- [ ] Implement Incident Breakdown chart (pie)
- [ ] Implement Top LGAs chart (bar)
- [ ] Write 10+ tests (chart rendering, data aggregation, KPI values)
- [ ] Run: `npm test -- --coverage` → >=75% coverage
- [ ] **Checkpoint 2: Tests pass**

### Hour 8-12: Polish & Integration
- [ ] Add responsive sizing (charts scale to container)
- [ ] Add legend to charts
- [ ] Add tooltip on hover
- [ ] Add export buttons (PDF/CSV — can be stubs)
- [ ] Run: `npm run quality:gates` → all pass
- [ ] **Checkpoint 3: All gates pass**

### Hour 12-16: Verification & Submission
- [ ] Test in dev server: `npm run dev`
- [ ] Verify page loads at /reports
- [ ] Verify charts render (no console errors)
- [ ] Verify charts scale responsively
- [ ] Verify KPI cards show correct values
- [ ] Verify legends are readable
- [ ] **Checkpoint 4: Pages routable**
- [ ] **Submit work with gate verification reports**

---

## Testing Requirements

**Minimum 10 test cases. Test these:**

1. ReportsPage renders with mock data
2. KPI cards render with correct values
3. Party Tally chart renders
4. Incident Breakdown chart renders
5. Top LGAs chart renders
6. Chart legend displays party names
7. Chart legend displays percentages
8. Hover tooltip appears on chart
9. Export buttons are present
10. Charts scale responsively

**Run with coverage**:
```bash
npm test -- --coverage
```

**Expected**: >=75% coverage

---

## API Integration (Hour 8-12)

Wire up to these endpoints (already exist):
- `GET /api/dashboard/metrics` → get party tally, incidents, top LGAs
- `GET /api/dashboard/system-status` → get live metrics

**Don't implement export** — buttons can be stubs. Just wire the data calls for hour 12.

---

## Files You'll Create/Modify

**Create**:
- `apps/web/pages/reports.tsx`
- `apps/web/components/ui/chart-party-tally.tsx`
- `apps/web/components/ui/chart-party-tally.module.css`
- `apps/web/components/ui/chart-incident-breakdown.tsx`
- `apps/web/components/ui/chart-incident-breakdown.module.css`
- `apps/web/components/ui/__tests__/reports.test.ts`

**Modify**:
- `apps/web/app/router.ts` → Add ReportsPage import + route
- `apps/web/package.json` → Add chart library (recharts or chart.js)

---

## Design Token Usage

Use design tokens for KPI card colors:

```css
var(--vf-color-navy)           /* background */
var(--vf-color-success)        /* KPI 1 accent */
var(--vf-color-warn)           /* KPI 2 accent */
var(--vf-color-danger)         /* KPI 3 accent */
var(--vf-color-info)           /* KPI 4 accent */
```

**Charts**: Can use chart library defaults, but ensure readability and match design system colors where possible.

---

## Chart Library Selection

**Option A: Recharts** (Recommended)
- React-native (zero conversion)
- Responsive by default
- Good TypeScript support
- Simple API

```bash
npm install recharts
```

**Option B: Chart.js**
- Popular, well-documented
- Requires react-chartjs-2 wrapper
- Good performance

```bash
npm install chart.js react-chartjs-2
```

**Pick one. Do not mix libraries.**

---

## Checkpoint Reporting

### Hour 4 Report
```markdown
## Agent 4: Hour 4 Checkpoint

**Status**: Build passes ✓

- Chart library selected: [Recharts/Chart.js]
- ReportsPage created
- Chart components stubbed
- Router updated
- Build: npm run build → SUCCESS (0 errors)
```

### Hour 8 Report
```markdown
## Agent 4: Hour 8 Checkpoint

**Status**: Tests pass ✓

- KPI cards implemented
- Party Tally chart implemented
- Incident Breakdown chart implemented
- Top LGAs chart implemented
- 12 tests passing, 76% coverage
```

### Hour 12 Report
```markdown
## Agent 4: Hour 12 Checkpoint

**Status**: All quality gates pass ✓

- All charts render without errors ✓
- Legends and tooltips working ✓
- All imports resolve ✓
- All pages routed ✓
- npm run quality:gates → ALL PASS
```

### Hour 16 Submission Report
```markdown
## Agent 4: SUBMISSION (Hour 16)

**Status**: READY FOR OPUS 5 VERIFICATION

### Deliverables
- [x] apps/web/pages/reports.tsx
- [x] apps/web/components/ui/chart-party-tally.tsx
- [x] apps/web/components/ui/chart-incident-breakdown.tsx
- [x] 12 tests, 76% coverage

### Quality Gates (All Passing)
- [x] Build: 0 TypeScript errors
- [x] Tests: 12 passing, 76% coverage
- [x] Token compliance: ✓
- [x] Routing compliance: ✓
- [x] No hardcoded colors: ✓

### Verification
- [x] Page loads at http://localhost:3000/reports
- [x] KPI cards render with correct values
- [x] All charts render without console errors
- [x] Charts are responsive
- [x] Legends and tooltips work
- [x] Export buttons present
```

---

## Success Looks Like

At hour 16:
- ✓ Reports page built and routable
- ✓ All 4 charts rendering
- ✓ KPI cards showing correct metrics
- ✓ Charts responsive and interactive
- ✓ All 12 tests passing
- ✓ 76% code coverage
- ✓ Build passes with zero TypeScript errors
- ✓ All quality gates passing

At hour 18 (Opus 5):
- ✓ Build verified
- ✓ Tests verified
- ✓ Pages verified routable
- ✓ Charts verified rendering
- ✓ Design alignment: 98%+

**Then**: Deploy with confidence

---

## Reference Docs

- `QUALITY_GUARDRAILS_OPERATIONAL.md` — Quality procedures
- `QUALITY_GUARDRAILS.md` — Gate definitions
- `PHASE1_PROGRESS.md` — What's already built (KPI cards exist in Command Centre)

---

## Reusing Existing Components

Agent 1 has a fully generic DataTable — you can use it if you want a tabular view of any data.

Command Centre already has KPI cards implemented — check if you can reuse or adapt them.

---

**Agent 4: Reports Page & Charts — Ready to begin.**

Hour 0: Start now  
Hour 4: Checkpoint 1 (build passes)  
Hour 8: Checkpoint 2 (tests pass)  
Hour 12: Checkpoint 3 (gates pass)  
Hour 16: Submit  
Hour 18: Opus 5 verifies

**Go.**
