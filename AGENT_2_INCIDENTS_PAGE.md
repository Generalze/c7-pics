# Agent 2: Incidents Page & Management

**Role**: Build Incidents page with detail panel and actions  
**Duration**: 16 hours  
**Quality Target**: 99%+ design alignment  
**Status**: Ready to start

---

## Your Deliverables

### 1. Incidents Page (`apps/web/pages/incidents.tsx`)
A complete incidents listing page with:
- **Incident Cards**: Not a table (card layout)
- **Severity Badges**: critical (red), high (orange), medium (yellow), low (gray)
- **Status Badges**: open, in_progress, escalated, resolved
- **Detail Panel**: Click card → see full details + actions
- **Filter Tabs**: Filter by status/severity
- **Real-time Updates**: Live incident count

### 2. Incident Detail Panel (`apps/web/components/ui/incident-detail-panel.tsx`)
Interactive detail view for incident:
- **Display**: Incident metadata (location, agent, time, description)
- **Actions**: Add note, Assign agent, Change status, Escalate
- **Notes Feed**: Timeline of notes/updates
- **Status Management**: Change status (open → in_progress → resolved)

### 3. Component Tests (`apps/web/components/ui/__tests__/incident-management.test.ts`)
- Minimum 10 test cases
- Test card rendering
- Test status/severity color mapping
- Test detail panel interactions
- Target >=75% coverage

---

## Design Specification

### Incidents Page Layout
```
┌─ Incidents Dashboard ──────────────────────────────┐
│                                                    │
│  Status Filter Tabs:                              │
│  [ALL] [OPEN] [IN_PROGRESS] [ESCALATED] [RESOLVED]│
│   45    23      12            5          5        │
│                                                    │
│  Severity Filter:                                 │
│  [ALL] [CRITICAL] [HIGH] [MEDIUM] [LOW]          │
│   45    5         12     18       10              │
│                                                    │
│  Incident Cards (Grid/List):                      │
│  ┌─────────────────────────────┐                 │
│  │ ███ CRITICAL (left border)  │                 │
│  │ Title: Equipment Failure     │                 │
│  │ PU: Ogun / 1 / 5            │                 │
│  │ Agent: John Smith           │                 │
│  │ Time: 14:32 UTC             │                 │
│  │                             │                 │
│  │ Status: ⚠ OPEN   Sev: 🔴   │                 │
│  │ Description: Voting machine │                 │
│  │ not responding...           │                 │
│  │             [Click for details →]│            │
│  └─────────────────────────────┘                 │
│  ┌─────────────────────────────┐                 │
│  │ 🟠 HIGH                     │                 │
│  │ Title: Voter Intimidation   │                 │
│  │ ...                         │                 │
│  └─────────────────────────────┘                 │
│                                                    │
│  Detail Panel (right):                            │
│  ┌─ Incident #15 ────────────────────────────┐   │
│  │ CRITICAL - Equipment Failure              │   │
│  │ Status: [OPEN ▼]                         │   │
│  │ Severity: [CRITICAL ▼]                   │   │
│  │                                           │   │
│  │ Location: Ogun / Ward 1 / PU 5           │   │
│  │ Assigned: John Smith [Change]            │   │
│  │ Reported: 2026-09-19 14:32 UTC           │   │
│  │                                           │   │
│  │ Description:                              │   │
│  │ Voting machine not responding. Battery    │   │
│  │ indicator shows low. Waiting for support.│   │
│  │                                           │   │
│  │ Evidence: 2 images attached              │   │
│  │                                           │   │
│  │ Activity:                                 │   │
│  │ 14:45 - John Smith: Machine restarted    │   │
│  │ 15:00 - Admin: Escalated to HQ           │   │
│  │ 15:15 - HQ Support: En route             │   │
│  │                                           │   │
│  │ Add Note: [Text input...]                │   │
│  │ [Add Note] [Assign] [Change Status] [X] │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### Severity Color-Coded Left Border
- **CRITICAL**: Red (#ff5252) - 3px left border
- **HIGH**: Orange (#ffa726) - 3px left border
- **MEDIUM**: Yellow (#ffc107) - 3px left border
- **LOW**: Gray (#9ca3af) - 3px left border

### Status Badges
- **open**: Gray background
- **in_progress**: Blue background
- **escalated**: Orange background
- **resolved**: Green background

### Detail Panel Actions
1. **Change Status**: Dropdown (open → in_progress → escalated → resolved)
2. **Assign Agent**: Search/select dropdown
3. **Add Note**: Text input + submit button
4. **Escalate**: One-click escalate to HQ

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

### Gate 4: Pages Routable + Badges Visible
```bash
npm run dev &
curl http://localhost:3000/incidents
# Page must load (200 status)
# Status badges must have visible colors
# NO transparent/invisible badges
```

**Checkpoint**: Hour 16 (before submission)  
**If fails**: Fix routing + badge colors, rerun  
**If passes**: Ready to submit

---

## Component Contract: Status Badges Must Be Visible

Your StatusBadge must render **with visible colors** for every status.

```typescript
// These must all render with visible colors:
<StatusBadge status="open" />     // → Gray background
<StatusBadge status="in_progress" /> // → Blue background
<StatusBadge status="escalated" /> // → Orange background
<StatusBadge status="resolved" />  // → Green background

// Test verification:
const color = window.getComputedStyle(badge).backgroundColor
expect(color).not.toBe('rgba(0, 0, 0, 0)')  // NOT transparent
expect(color).not.toBe('transparent')       // NOT invisible
```

**Previous failure**: StatusBadge received domain statuses but only handled tones → badges rendered invisible  
**Your solution**: Map statuses to tones AND verify visible in tests

---

## Implementation Checklist

### Hour 0-4: Foundation
- [ ] Create `pages/incidents.tsx` (stub)
- [ ] Create `components/ui/incident-detail-panel.tsx` (stub)
- [ ] Create `components/ui/incident-card.tsx` (stub)
- [ ] Add IncidentsPage to router.ts
- [ ] Run: `npm run build` → must succeed
- [ ] **Checkpoint 1: Build passes**

### Hour 4-8: Implementation
- [ ] Implement IncidentCard with severity border
- [ ] Implement status badges with colors
- [ ] Implement detail panel (click handler)
- [ ] Implement status/severity filter tabs
- [ ] Write 10+ tests (card rendering, badge colors, filtering)
- [ ] Run: `npm test -- --coverage` → >=75% coverage
- [ ] **Checkpoint 2: Tests pass**

### Hour 8-12: Polish & Integration
- [ ] Add note input to detail panel
- [ ] Add status change dropdown
- [ ] Add agent assignment
- [ ] Verify all badges render with visible colors
- [ ] Run: `npm run quality:gates` → all pass
- [ ] **Checkpoint 3: All gates pass**

### Hour 12-16: Verification & Submission
- [ ] Test in dev server: `npm run dev`
- [ ] Verify page loads at /incidents
- [ ] Verify status badges have visible colors
- [ ] Verify severity border colors match spec
- [ ] Verify detail panel opens/closes
- [ ] Verify filter tabs work
- [ ] **Checkpoint 4: Pages routable**
- [ ] **Submit work with gate verification reports**

---

## Testing Requirements

**Minimum 10 test cases. Test these:**

1. IncidentCard renders with data
2. Severity border color is correct (critical = red, etc.)
3. Status badge renders with visible color
4. Filter tab shows correct incident count
5. Click filter tab filters card list
6. Click card opens detail panel
7. Detail panel shows incident data
8. Status change dropdown works
9. Add note input appears when needed
10. Escalate button changes status

**Run with coverage**:
```bash
npm test -- --coverage
```

**Expected**: >=75% coverage

---

## API Integration (Hour 8-12)

Wire up to these endpoints (already exist):
- `GET /api/dashboard/metrics` → get incidents summary
- `GET /api/incidents` → list incidents

**Don't implement full API** — just wire the calls. Mock data is fine for hour 12 checkpoint.

---

## Files You'll Create/Modify

**Create**:
- `apps/web/pages/incidents.tsx`
- `apps/web/components/ui/incident-card.tsx`
- `apps/web/components/ui/incident-card.module.css`
- `apps/web/components/ui/incident-detail-panel.tsx`
- `apps/web/components/ui/incident-detail-panel.module.css`
- `apps/web/components/ui/__tests__/incident-management.test.ts`

**Modify**:
- `apps/web/app/router.ts` → Add IncidentsPage import + route

---

## Design Token Usage

Same as Agent 1 — use these tokens only:

```css
var(--vf-color-danger)         /* #ff5252 - critical */
var(--vf-color-warn)           /* #ffa726 - high */
var(--vf-color-info)           /* #42a5f5 - in_progress */
var(--vf-color-success)        /* #00d084 - resolved */
var(--vf-color-neutral)        /* #9ca3af - open/low */
```

**NO hardcoded colors like `#ff0000`. Use tokens only.**

---

## Critical: StatusBadge Visibility

This is where the last workflow failed. Your badges must:

1. ✓ Receive status (open, in_progress, escalated, resolved)
2. ✓ Map to a tone that has a visible color
3. ✓ Render with that color (not transparent)
4. ✓ Test verifies the color is not transparent

**Test example**:
```typescript
const badge = render(<StatusBadge status="open" />)
const color = window.getComputedStyle(badge).backgroundColor
expect(color).not.toBe('rgba(0, 0, 0, 0)')  // ✓ visible
```

---

## Checkpoint Reporting

### Hour 4 Report
```markdown
## Agent 2: Hour 4 Checkpoint

**Status**: Build passes ✓

- IncidentsPage created
- IncidentCard stub created
- DetailPanel stub created
- Router updated
- Build: npm run build → SUCCESS (0 errors)
```

### Hour 8 Report
```markdown
## Agent 2: Hour 8 Checkpoint

**Status**: Tests pass ✓

- IncidentCard with severity border implemented
- Status badges with colors implemented
- Detail panel with click handler implemented
- Filter tabs implemented
- 12 tests passing, 76% coverage
```

### Hour 12 Report
```markdown
## Agent 2: Hour 12 Checkpoint

**Status**: All quality gates pass ✓

- Status badges visible for all statuses ✓
- Severity borders correct colors ✓
- All imports resolve ✓
- All pages routed ✓
- npm run quality:gates → ALL PASS
```

### Hour 16 Submission Report
```markdown
## Agent 2: SUBMISSION (Hour 16)

**Status**: READY FOR OPUS 5 VERIFICATION

### Deliverables
- [x] apps/web/pages/incidents.tsx
- [x] apps/web/components/ui/incident-card.tsx
- [x] apps/web/components/ui/incident-detail-panel.tsx
- [x] 12 tests, 76% coverage

### Quality Gates (All Passing)
- [x] Build: 0 TypeScript errors
- [x] Tests: 12 passing, 76% coverage
- [x] Token compliance: ✓
- [x] Routing compliance: ✓
- [x] StatusBadge: ALL colors visible ✓

### Verification
- [x] Page loads at http://localhost:3000/incidents
- [x] Status badges render with visible colors
- [x] Severity borders display correctly
- [x] Detail panel opens on card click
- [x] Filter tabs work
```

---

## Success Looks Like

At hour 16:
- ✓ Incidents page built and routable
- ✓ Status badges visible (NOT transparent)
- ✓ Severity left borders with correct colors
- ✓ All 12 tests passing
- ✓ 76% code coverage
- ✓ Build passes with zero TypeScript errors
- ✓ All quality gates passing

At hour 18 (Opus 5):
- ✓ Build verified
- ✓ Tests verified
- ✓ Pages verified routable
- ✓ StatusBadge colors verified (independent check)
- ✓ Design alignment: 98%+

**Then**: Deploy with confidence

---

## Reference Docs

- `QUALITY_GUARDRAILS_OPERATIONAL.md` — Quality gate procedures
- `QUALITY_GUARDRAILS.md` — Gate definitions
- `PHASE1_PROGRESS.md` — What's already built

---

**Agent 2: Incidents Page & Management — Ready to begin.**

Hour 0: Start now  
Hour 4: Checkpoint 1 (build passes)  
Hour 8: Checkpoint 2 (tests pass)  
Hour 12: Checkpoint 3 (gates pass)  
Hour 16: Submit  
Hour 18: Opus 5 verifies

**Go.**
