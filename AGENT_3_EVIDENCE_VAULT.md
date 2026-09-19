# Agent 3: Evidence Vault & Grid Component

**Role**: Build Evidence Vault page with image grid and lightbox viewer  
**Duration**: 16 hours  
**Quality Target**: 99%+ design alignment  
**Status**: Ready to start

---

## Your Deliverables

### 1. Evidence Vault Page (`apps/web/pages/evidence.tsx`)
A complete evidence gallery page with:
- **Evidence Grid**: 4-column layout, thumbnail display
- **Status Badges**: verified, pending, flagged, filed (with visible colors)
- **Filter Tabs**: Filter by verification status
- **Lightbox Viewer**: Click thumbnail → see full image/video
- **Verification Controls**: Mark verified/flagged/filed
- **Real-time Updates**: Live evidence count

### 2. Evidence Grid Component (`apps/web/components/ui/evidence-grid.tsx`)
Reusable 4-column grid:
- **Responsive**: 4 columns on desktop, 2 on tablet, 1 on mobile
- **Thumbnails**: Preview images with status overlays
- **Hover Effects**: Zoom effect, play button for videos
- **Click Handler**: Click thumbnail → open lightbox

### 3. Lightbox Viewer (`apps/web/components/ui/lightbox.tsx`)
Full-screen image/video viewer:
- **Display**: Show full-size image or video
- **Navigation**: Previous/Next buttons
- **Close**: Escape key or click outside
- **Actions**: Verify/Flag/File buttons (update status)
- **Metadata**: Show timestamp, agent name, location

### 4. Component Tests (`apps/web/components/ui/__tests__/evidence-grid.test.ts`)
- Minimum 10 test cases
- Test grid rendering
- Test status badge colors
- Test lightbox open/close
- Target >=75% coverage

---

## Design Specification

### Evidence Vault Page Layout
```
┌─ Evidence Vault ──────────────────────────────────┐
│                                                   │
│  Filter Tabs:                                    │
│  [ALL] [VERIFIED] [PENDING] [FLAGGED] [FILED]   │
│   234    98       67       45       24           │
│                                                   │
│  Evidence Grid (4 columns):                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────┐│
│  │ █ █     │  │ █ █     │  │ █ █     │  │ █ █ ││
│  │ █ █     │  │ █ █     │  │ █ █     │  │ █ █ ││
│  │ █ █     │  │ █ █     │  │ █ █     │  │ █ █ ││
│  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │┌──┐ ││
│  │ │Ver. │ │  │ │Pend.│ │  │ │Flag.│ │  ││..│ ││
│  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │└──┘ ││
│  │ [Click] │  │ [Click] │  │ [Click] │  │[..] ││
│  └─────────┘  └─────────┘  └─────────┘  └─────┘│
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────┐│
│  │ ... more grid items ...                   │
│  └─────────────────────────────────────────────┘│
│                                                   │
│  [Load More] or Pagination                      │
└───────────────────────────────────────────────────┘

Full-Screen Lightbox (click thumbnail):
╔════════════════════════════════════════════════╗
║                                                ║
║  < [Image Preview]  [Verify] [Flag] [File] X  ║
║                                                ║
║  Evidence #456                                 ║
║  Result Sheet - Ogun / Ward 1 / PU 5          ║
║  Agent: John Smith | Time: 14:32 UTC          ║
║  Status: PENDING [Change ▼]                   ║
║                                                ║
║  [Previous] [Next]                             ║
╚════════════════════════════════════════════════╝
```

### Status Badge Colors
- **verified**: Green (#00d084)
- **pending**: Gray (#9ca3af)
- **flagged**: Red (#ff5252)
- **filed**: Blue (#42a5f5)

### Grid Columns
- **Desktop** (>1024px): 4 columns
- **Tablet** (768-1024px): 2 columns
- **Mobile** (<768px): 1 column

### Evidence Types
- Result sheets (documents)
- Incident images
- Incident videos
- Agent photos

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

### Gate 4: Pages Routable + Badges Visible
```bash
npm run dev &
curl http://localhost:3000/evidence
# Page must load (200 status)
# Status badges must have visible colors
```

**Checkpoint**: Hour 16 (before submission)  
**Success**: Ready to submit

---

## Component Contract: Status Badges Must Be Visible

Your StatusBadge must render **with visible colors** for every evidence status.

```typescript
// These must all render with visible colors:
<StatusBadge status="verified" />   // → Green
<StatusBadge status="pending" />    // → Gray
<StatusBadge status="flagged" />    // → Red
<StatusBadge status="filed" />      // → Blue

// Test verification:
const color = window.getComputedStyle(badge).backgroundColor
expect(color).not.toBe('rgba(0, 0, 0, 0)')  // NOT transparent
```

**Rule**: Same as Agent 2 — status badges must be visible. Not transparent, not gray, not invisible.

---

## Implementation Checklist

### Hour 0-4: Foundation
- [ ] Create `pages/evidence.tsx` (stub)
- [ ] Create `components/ui/evidence-grid.tsx` (stub)
- [ ] Create `components/ui/lightbox.tsx` (stub)
- [ ] Add EvidencePage to router.ts
- [ ] Run: `npm run build` → must succeed
- [ ] **Checkpoint 1: Build passes**

### Hour 4-8: Implementation
- [ ] Implement 4-column grid layout
- [ ] Implement responsive breakpoints (4/2/1 cols)
- [ ] Implement thumbnail display with status overlay
- [ ] Implement lightbox component (full-screen viewer)
- [ ] Implement filter tabs by status
- [ ] Write 10+ tests (grid, lightbox, filter, badge colors)
- [ ] Run: `npm test -- --coverage` → >=75% coverage
- [ ] **Checkpoint 2: Tests pass**

### Hour 8-12: Polish & Integration
- [ ] Add hover zoom effect to thumbnails
- [ ] Add status change in lightbox
- [ ] Verify all badges render with visible colors
- [ ] Add keyboard shortcuts (arrow keys, escape)
- [ ] Run: `npm run quality:gates` → all pass
- [ ] **Checkpoint 3: All gates pass**

### Hour 12-16: Verification & Submission
- [ ] Test in dev server: `npm run dev`
- [ ] Verify page loads at /evidence
- [ ] Verify status badges have visible colors
- [ ] Verify grid is 4 columns (desktop)
- [ ] Verify lightbox opens/closes
- [ ] Verify filter tabs work
- [ ] Test responsive layout (tablet/mobile view)
- [ ] **Checkpoint 4: Pages routable**
- [ ] **Submit work with gate verification reports**

---

## Testing Requirements

**Minimum 10 test cases. Test these:**

1. EvidenceGrid renders with mock data
2. Grid shows 4 columns on desktop
3. Grid shows 2 columns on tablet
4. Thumbnail status badge renders with visible color
5. Click thumbnail opens lightbox
6. Lightbox shows full image
7. Lightbox shows evidence metadata
8. Filter tab shows correct count
9. Click filter tab filters grid
10. Lightbox close button works

**Run with coverage**:
```bash
npm test -- --coverage
```

**Expected**: >=75% coverage

---

## API Integration (Hour 8-12)

Wire up to these endpoints (already exist):
- `GET /api/dashboard/metrics` → get evidence stats
- `GET /api/evidence` → list evidence items

**Don't implement full CRUD** — just wire the read/list calls. Mock data is fine for hour 12.

---

## Files You'll Create/Modify

**Create**:
- `apps/web/pages/evidence.tsx`
- `apps/web/components/ui/evidence-grid.tsx`
- `apps/web/components/ui/evidence-grid.module.css`
- `apps/web/components/ui/lightbox.tsx`
- `apps/web/components/ui/lightbox.module.css`
- `apps/web/components/ui/__tests__/evidence-grid.test.ts`

**Modify**:
- `apps/web/app/router.ts` → Add EvidencePage import + route

---

## Reuse Agent 1's DataTable

If you need a table view in the lightbox details (optional), you can import Agent 1's DataTable component.

---

## Design Token Usage

Same tokens as Agents 1 & 2:

```css
var(--vf-color-success)        /* #00d084 verified */
var(--vf-color-neutral)        /* #9ca3af pending */
var(--vf-color-danger)         /* #ff5252 flagged */
var(--vf-color-info)           /* #42a5f5 filed */
```

**NO hardcoded colors.**

---

## Checkpoint Reporting

### Hour 4 Report
```markdown
## Agent 3: Hour 4 Checkpoint

**Status**: Build passes ✓

- EvidencePage created
- EvidenceGrid stub created
- Lightbox stub created
- Router updated
- Build: npm run build → SUCCESS (0 errors)
```

### Hour 8 Report
```markdown
## Agent 3: Hour 8 Checkpoint

**Status**: Tests pass ✓

- 4-column grid layout implemented
- Responsive breakpoints (4/2/1) implemented
- Lightbox viewer implemented
- Filter tabs implemented
- 12 tests passing, 77% coverage
```

### Hour 12 Report
```markdown
## Agent 3: Hour 12 Checkpoint

**Status**: All quality gates pass ✓

- Status badges visible for all statuses ✓
- Responsive layout verified ✓
- All imports resolve ✓
- All pages routed ✓
- npm run quality:gates → ALL PASS
```

### Hour 16 Submission Report
```markdown
## Agent 3: SUBMISSION (Hour 16)

**Status**: READY FOR OPUS 5 VERIFICATION

### Deliverables
- [x] apps/web/pages/evidence.tsx
- [x] apps/web/components/ui/evidence-grid.tsx
- [x] apps/web/components/ui/lightbox.tsx
- [x] 12 tests, 77% coverage

### Quality Gates (All Passing)
- [x] Build: 0 TypeScript errors
- [x] Tests: 12 passing, 77% coverage
- [x] Token compliance: ✓
- [x] Routing compliance: ✓
- [x] StatusBadge: ALL colors visible ✓

### Verification
- [x] Page loads at http://localhost:3000/evidence
- [x] Grid displays 4 columns (desktop)
- [x] Grid displays 2 columns (tablet)
- [x] Status badges visible
- [x] Lightbox opens/closes
- [x] Filter tabs work
```

---

## Success Looks Like

At hour 16:
- ✓ Evidence Vault page built and routable
- ✓ Status badges visible (all colors)
- ✓ 4-column grid on desktop
- ✓ Responsive layout (2/1 cols on smaller screens)
- ✓ Lightbox viewer working
- ✓ All 12 tests passing
- ✓ 77% code coverage
- ✓ Build passes with zero TypeScript errors
- ✓ All quality gates passing

At hour 18 (Opus 5):
- ✓ Build verified
- ✓ Tests verified
- ✓ Pages verified routable
- ✓ StatusBadge colors verified
- ✓ Design alignment: 98%+

**Then**: Deploy with confidence

---

## Reference Docs

- `QUALITY_GUARDRAILS_OPERATIONAL.md` — Quality procedures
- `QUALITY_GUARDRAILS.md` — Gate definitions

---

**Agent 3: Evidence Vault & Grid — Ready to begin.**

Hour 0: Start now  
Hour 4: Checkpoint 1 (build passes)  
Hour 8: Checkpoint 2 (tests pass)  
Hour 12: Checkpoint 3 (gates pass)  
Hour 16: Submit  
Hour 18: Opus 5 verifies

**Go.**
