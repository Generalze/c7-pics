# Workflow Agent 2: Results Page
**Status**: READY FOR EXECUTION  
**Date**: 2026-09-19  
**Agent**: (Assigned)  
**Confidence**: High  
**Pattern**: DataTable + Agents page layout

---

## Summary

Agent 2 builds the Results page for the C7-PICS operator dashboard. This page displays election results with verification checkpoints, inheriting the DataTable component and layout pattern from Agent 1.

**Key Deliverable**: A fully styled, responsive Results page with table view, filter tabs, detail panel, and verification controls.

---

## Scope

### Files to Create
```
apps/operator-web/src/pages/Results/
├── ResultsPage.tsx           (Main page component)
├── ResultsPage.module.css    (Page styles + responsive)
└── index.ts                  (Exports)
```

### Dependencies
- ✓ Import `DataTable`, `StatusBadge` from `apps/operator-web/src/components/DataTable`
- ✓ Use design tokens from `packages/design-system/src/tokens.css`
- ✓ Follow Agents page layout pattern exactly (header → filters → table → detail panel)

---

## Data Model

```typescript
interface Result {
  id: string;                  // Unique result ID
  agentId: string;             // Agent who submitted result
  agentName: string;           // Agent display name
  pu: number;                  // Polling Unit number
  itemCount: number;           // Total items verified
  verified: number;            // Items verified (for progress)
  timestamp: string;           // ISO 8601 submission time
  status: 'pending' | 'verified' | 'rejected' | 'duplicate'; // Verification state
  verifiedBy?: string;         // Verifier's name (if status != pending)
  verificationDate?: string;   // ISO 8601 verification time
}
```

### Mock Data (Minimum 5 results)
- 2–3 in "verified" status
- 1 in "pending" status
- 1 in "rejected" or "duplicate" status

**Example**:
```typescript
{
  id: 'RES-001',
  agentId: 'AGT-005',
  agentName: 'Alice Okonkwo',
  pu: 42,
  itemCount: 450,
  verified: 450,
  timestamp: '2026-09-18T14:32:00Z',
  status: 'verified',
  verifiedBy: 'John Admin',
  verificationDate: '2026-09-18T15:45:00Z'
}
```

---

## Layout & Design

### Page Structure
```
┌─────────────────────────────────────────────┐
│ Results  [Add Result] [Export]              │
├─────────────────────────────────────────────┤
│ [All] [Verified] [Pending] [Rejected] [Dup] │  ← Filter tabs w/ counts
├─────────────────────────────────────────────┤
│ ┌───────────────────────┬───────────────────┐│
│ │ Results Table         │ Detail Panel      ││
│ │ (DataTable)           │ (Sticky, lg+)     ││
│ │ · Sort on headers     │ · Result info     ││
│ │ · 10 per page         │ · Agent details   ││
│ │ · Page nav at bottom  │ · Verify button   ││
│ └───────────────────────┴───────────────────┘│
└─────────────────────────────────────────────┘

Mobile: Detail panel moves below table (flex-col)
```

---

## DataTable Columns

| Column | Type | Sortable | Width | Notes |
|--------|------|----------|-------|-------|
| Result ID | text | yes | 100px | Monospace (code) |
| Agent | link | yes | — | agentName, link to Agents page (stub ok) |
| PU | number | yes | 60px | Polling Unit |
| Items | number | yes | 80px | Total count |
| Verified | number | yes | 80px | Verified count or progress bar |
| Submitted | date | yes | 140px | timestamp, formatted |
| Status | badge | no | 120px | pending=info, verified=success, rejected=danger, duplicate=warn |

---

## Filter Tabs

**5 tabs with live counts** (recalculate on data change):

```typescript
const filters = [
  { label: 'All', key: 'all', count: results.length },
  { label: 'Verified', key: 'verified', count: results.filter(r => r.status === 'verified').length },
  { label: 'Pending', key: 'pending', count: results.filter(r => r.status === 'pending').length },
  { label: 'Rejected', key: 'rejected', count: results.filter(r => r.status === 'rejected').length },
  { label: 'Duplicate', key: 'duplicate', count: results.filter(r => r.status === 'duplicate').length },
];
```

Clicking a tab filters the table and clears the detail panel selection.

---

## Detail Panel

**Sticky aside (right, lg+ breakpoint)** — appears when a result row is clicked:

```
┌─────────────────────────┐
│ Result Details          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ Result ID (mono)        │
│ Status badge            │
│                         │
│ Agent Details           │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ Name: [agentName]       │
│ Location: [LGA/Ward]    │
│                         │
│ Verification            │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ Items: [verified]/[total]│
│ Verified by: [name]     │
│ Date: [ISO formatted]   │
│                         │
│ [View Agent] [Verify]   │ ← Buttons (stubs ok)
└─────────────────────────┘
```

**Actions** (buttons, stubs are fine):
- "View Agent" — navigate to Agents page with agent filter
- "Mark Verified" — (pending only) dummy handler, toggle status
- "Reject" — (pending only) set status to rejected

---

## Styling Requirements

### Design Tokens
- **Status badge colors**:
  - pending: `--vf-status-info-text` (#38bdf8)
  - verified: `--vf-status-success-text` (#4ade80)
  - rejected: `--vf-status-danger-text` (#f87171)
  - duplicate: `--vf-status-warn-text` (#facc15)

- **Text colors**: Use `--vf-text-primary`, `--vf-text-secondary`
- **Spacing**: All gaps from `--vf-space-*` (2, 3, 4, 5, 6)
- **Typography**: Match Agents page font-size scale

### CSS Module Classes
```css
/* ResultsPage.module.css */

.root { /* Page container */ }
.header { /* Title + action buttons */ }
.filterTabs { /* Filter tab row */ }
.filterTab { /* Inactive tab */ }
.filterTabActive { /* Active tab highlight */ }
.filterCount { /* Count badge on tabs */ }
.content { /* Grid: table + panel */ }
.tableContainer { /* Scrollable table wrapper */ }
.detailPanel { /* Right sidebar */ }
.actions { /* Button group in header or panel */ }
.pagination { /* Inherited from DataTable */ }

/* Responsive breakpoints */
@media (max-width: 1023px) { /* Detail panel below table */ }
@media (max-width: 767px) { /* Mobile: smaller fonts, stacked */ }
```

---

## Responsive Breakpoints

| Breakpoint | Change |
|-----------|--------|
| **lg (1024px+)** | Detail panel sticky right (2-column grid) |
| **md (768–1023px)** | Detail panel below table (1 column), side-by-side on wide tablets |
| **sm (<768px)** | Full width, no detail panel sticky; all elements stacked |

**Test at**: 320px, 480px, 768px, 1024px, 1440px

---

## Implementation Checklist

- [ ] Create `ResultsPage.tsx` with page component
- [ ] Create `ResultsPage.module.css` with all styles
- [ ] Create `index.ts` export file
- [ ] Define `Result` interface
- [ ] Add mock data (5+ results)
- [ ] Import `DataTable` and `StatusBadge` from Agent 1
- [ ] Implement filter tabs with live counts
- [ ] Implement sort/pagination (via DataTable props)
- [ ] Add detail panel (click row → populate)
- [ ] Add action buttons (View Agent, Mark Verified, Reject — stubs ok)
- [ ] Test responsive at 4+ breakpoints
- [ ] Verify all colors use design tokens (no hardcoded hex)
- [ ] Check focus rings on all buttons
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Verify WCAG AAA contrast
- [ ] Add empty state (if no results match filter)
- [ ] Add loading skeleton (optional, can reuse DataTable's isLoading)

---

## Design Compliance Target

✓ 99%+ match to Agents page layout  
✓ All colors from design tokens  
✓ Responsive at all breakpoints  
✓ Focus rings on all interactive elements  
✓ Empty and loading states  
✓ Zero hardcoded colors  
✓ Status badges match Agents page pattern  
✓ Detail panel same width/position as Agents page  

---

## Integration Points

1. **Routing** (Opus 5 will handle):
   - Mount at `/results`
   - Add nav link in sidebar/header

2. **API Service** (Opus 5 will handle):
   - Replace mock data with real `/api/results` calls
   - Bind action handlers (Mark Verified, Reject)

3. **Cross-page Links** (stubs ok):
   - "View Agent" button → navigate to Agents page
   - Agent name in table → navigate to Agents page (or open Agent detail)

---

## Time Estimate

- **Component structure & layout**: 2 hrs
- **DataTable integration & columns**: 1.5 hrs
- **Filter tabs + detail panel**: 1.5 hrs
- **Styling (CSS modules, responsive)**: 1.5 hrs
- **Testing & refinements**: 1 hr
- **Total**: ~7.5 hrs

---

## Success Criteria

✓ Page loads without console errors  
✓ DataTable renders 10 results per page  
✓ Filter tabs show correct counts  
✓ Clicking tab updates table  
✓ Clicking row populates detail panel  
✓ Sort works on all sortable columns  
✓ Pagination controls functional  
✓ Layout responsive (desktop/tablet/mobile)  
✓ All colors from design tokens  
✓ Detail panel actions present (stubs ok)  
✓ No accessibility violations  
✓ Design compliance ≥ 99%  

---

**Ready for handoff**: Yes — All requirements documented, mock data provided, integration clear.
