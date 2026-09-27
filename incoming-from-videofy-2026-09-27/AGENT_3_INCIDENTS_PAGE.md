# Workflow Agent 3: Incidents Page
**Status**: READY FOR EXECUTION  
**Date**: 2026-09-19  
**Agent**: (Assigned)  
**Confidence**: High  
**Pattern**: DataTable + filter tabs + detail panel + severity levels

---

## Summary

Agent 3 builds the Incidents page for the C7-PICS operator dashboard. This page displays security/process incidents with severity levels, status tracking, and evidence linking. It inherits DataTable and filter patterns from Agent 1, and layout from Agents page.

**Key Deliverable**: A fully styled, responsive Incidents page with severity-based filtering, detail panel with evidence links, and action buttons.

---

## Scope

### Files to Create
```
apps/operator-web/src/pages/Incidents/
├── IncidentsPage.tsx          (Main page component)
├── IncidentsPage.module.css   (Page styles + responsive)
└── index.ts                   (Exports)
```

### Dependencies
- ✓ Import `DataTable`, `StatusBadge` from `apps/operator-web/src/components/DataTable`
- ✓ Use design tokens from `packages/design-system/src/tokens.css`
- ✓ Follow Agents page layout (header → filters → table → detail panel)

---

## Data Model

```typescript
interface Incident {
  id: string;                  // Unique incident ID
  type: 'security' | 'process' | 'data' | 'communication'; // Incident category
  severity: 'critical' | 'high' | 'medium' | 'low'; // Level (color-coded)
  status: 'open' | 'investigating' | 'resolved' | 'closed'; // Resolution state
  title: string;               // Short description
  description?: string;        // Long description (in detail panel)
  agent?: { id: string; name: string; }; // Reporting agent
  createdAt: string;           // ISO 8601 creation time
  resolvedAt?: string;         // ISO 8601 resolution time (if status = resolved/closed)
  evidenceIds?: string[];      // Linked evidence item IDs (for vault)
}
```

### Mock Data (Minimum 8 incidents — 2 per severity)
- **Critical** (2): security incident, data breach (OPEN)
- **High** (2): tampering, communication breakdown (1 OPEN, 1 INVESTIGATING)
- **Medium** (2): minor discrepancy, process deviation (INVESTIGATING, RESOLVED)
- **Low** (2): late report, format issue (RESOLVED, CLOSED)

**Example**:
```typescript
{
  id: 'INC-001',
  type: 'security',
  severity: 'critical',
  status: 'open',
  title: 'Unauthorized device detected at PU-042',
  description: 'Phone with suspicious app activity recorded at polling unit.',
  agent: { id: 'AGT-005', name: 'Alice Okonkwo' },
  createdAt: '2026-09-18T09:15:00Z',
  evidenceIds: ['EV-001', 'EV-002']
}
```

---

## Layout & Design

### Page Structure
```
┌──────────────────────────────────────────────┐
│ Incidents  [Create] [Export] [Resolve]       │
├──────────────────────────────────────────────┤
│ [All] [Critical] [High] [Medium] [Low] [Open]│  ← Filter tabs w/ counts
├──────────────────────────────────────────────┤
│ ┌────────────────────────┬──────────────────┐│
│ │ Incidents Table        │ Detail Panel     ││
│ │ (DataTable)            │ (Sticky, lg+)    ││
│ │ · Severity color dots  │ · Incident info  ││
│ │ · 10 per page          │ · Evidence list  ││
│ │ · Page nav at bottom   │ · Actions        ││
│ └────────────────────────┴──────────────────┘│
└──────────────────────────────────────────────┘

Mobile: Detail panel moves below table (flex-col)
```

---

## DataTable Columns

| Column | Type | Sortable | Width | Notes |
|--------|------|----------|-------|-------|
| ID | text | yes | 100px | Monospace (code) |
| Type | text | no | 100px | security/process/data/communication |
| Title | text | yes | — | Incident description |
| Severity | badge | no | 100px | Color-coded dot + label; no custom render needed |
| Status | badge | no | 100px | open/investigating/resolved/closed |
| Created | date | yes | 140px | createdAt, formatted |
| Agent | link | yes | — | agent.name, link to Agents page (stub ok) |

---

## Severity & Status Colors

### Severity (color-coded badges with dots)
```typescript
const severityMap = {
  critical: { color: '--vf-status-danger-text', label: 'Critical' },   // #f87171
  high: { color: '--vf-status-warn-text', label: 'High' },             // #facc15
  medium: { color: '--vf-status-info-text', label: 'Medium' },         // #38bdf8
  low: { color: '--vf-status-neutral-text', label: 'Low' },            // #9a9ab5
};
```

### Status (semantic badges)
```typescript
const statusMap = {
  open: 'danger',       // Red (#f87171)
  investigating: 'warn', // Yellow (#facc15)
  resolved: 'info',     // Blue (#38bdf8)
  closed: 'success',    // Green (#4ade80)
};
```

---

## Filter Tabs

**6 tabs with live counts**:

```typescript
const filters = [
  { label: 'All', key: 'all', count: incidents.length },
  { label: 'Critical', key: 'critical', count: incidents.filter(i => i.severity === 'critical').length },
  { label: 'High', key: 'high', count: incidents.filter(i => i.severity === 'high').length },
  { label: 'Medium', key: 'medium', count: incidents.filter(i => i.severity === 'medium').length },
  { label: 'Low', key: 'low', count: incidents.filter(i => i.severity === 'low').length },
  { label: 'Open', key: 'open', count: incidents.filter(i => i.status === 'open').length },
];
```

**Behavior**:
- Clicking a tab filters the table by that criterion
- "All" shows all incidents (no filter)
- "Open" filters by status only (combines all severities)
- Detail panel clears on tab click

---

## Detail Panel

**Sticky aside (right, lg+ breakpoint)** — appears when an incident row is clicked:

```
┌──────────────────────────┐
│ Incident Details         │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ ID (mono)                │
│ Type: [security/process] │
│ Severity badge           │
│ Status badge             │
│                          │
│ Description              │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ [Full description text]  │
│                          │
│ Agent                    │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ Name: [agent.name]       │
│ Agent ID: [agent.id]     │
│                          │
│ Evidence Linked          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ · [Evidence ID] (photo)  │
│ · [Evidence ID] (video)  │
│ · View All (link/stub)   │
│                          │
│ Timeline                 │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ Created: [ISO date]      │
│ Resolved: [ISO date] (if applicable) │
│                          │
│ [Update Status] [Close]  │ ← Action buttons
└──────────────────────────┘
```

**Actions** (buttons, stubs are fine):
- "View Agent" — navigate to Agents page
- "Update Status" — cycle through statuses (open → investigating → resolved → closed)
- "Close" — set status to closed

---

## Styling Requirements

### Design Tokens (Same as Agent 1 & 2)
- **Status/severity colors**: `--vf-status-*-text` tokens
- **Text colors**: `--vf-text-primary`, `--vf-text-secondary`
- **Spacing**: All gaps from `--vf-space-*` (2, 3, 4, 5, 6)
- **Typography**: Match Agents/Results page font-size scale

### CSS Module Classes
```css
/* IncidentsPage.module.css */

.root { /* Page container */ }
.header { /* Title + action buttons */ }
.filterTabs { /* Filter tab row */ }
.filterTab { /* Inactive tab */ }
.filterTabActive { /* Active tab highlight */ }
.filterCount { /* Count badge on tabs */ }
.content { /* Grid: table + panel */ }
.tableContainer { /* Scrollable table wrapper */ }
.detailPanel { /* Right sidebar */ }
.detailSection { /* Subsection in detail panel (Description, Agent, etc.) */ }
.detailSectionTitle { /* "Description", "Evidence Linked", etc. */ }
.evidenceList { /* List of linked evidence items */ }
.evidenceItem { /* Individual evidence link */ }
.timeline { /* Created/resolved dates */ }
.actions { /* Button group */ }
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
| **md (768–1023px)** | Detail panel below table (1 column) |
| **sm (<768px)** | Full width, all elements stacked |

**Test at**: 320px, 480px, 768px, 1024px, 1440px

---

## Implementation Checklist

- [ ] Create `IncidentsPage.tsx` with page component
- [ ] Create `IncidentsPage.module.css` with all styles
- [ ] Create `index.ts` export file
- [ ] Define `Incident` interface
- [ ] Add mock data (8+ incidents, 2 per severity + status variety)
- [ ] Import `DataTable` and `StatusBadge` from Agent 1
- [ ] Implement severity + status filter tabs with counts
- [ ] Render severity as color-coded badge with dot (no custom render, use StatusBadge)
- [ ] Implement sort/pagination (via DataTable props)
- [ ] Add detail panel with incident info
- [ ] List linked evidence items in detail panel (with stubs)
- [ ] Add action buttons (View Agent, Update Status, Close — stubs ok)
- [ ] Test responsive at 4+ breakpoints
- [ ] Verify all colors use design tokens
- [ ] Check focus rings on all buttons
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Verify WCAG AAA contrast
- [ ] Add empty state (if no incidents match filter)

---

## Design Compliance Target

✓ 99%+ match to Agents/Results page layout  
✓ All colors from design tokens  
✓ Severity badges color-coded by severity  
✓ Status badges semantic (open/investigating/resolved/closed)  
✓ Responsive at all breakpoints  
✓ Focus rings on all interactive elements  
✓ Empty and loading states  
✓ Zero hardcoded colors  

---

## Integration Points

1. **Routing** (Opus 5 will handle):
   - Mount at `/incidents`
   - Add nav link in sidebar/header

2. **API Service** (Opus 5 will handle):
   - Replace mock data with real `/api/incidents` calls
   - Bind action handlers (Update Status, Close)

3. **Cross-page Links** (stubs ok):
   - "View Agent" button → navigate to Agents page
   - Evidence items → navigate to Evidence Vault page (Agent 4)

---

## Time Estimate

- **Component structure & layout**: 2 hrs
- **DataTable integration + severity colors**: 1.5 hrs
- **Filter tabs (6 total) + detail panel**: 2 hrs
- **Styling (CSS modules, responsive)**: 1.5 hrs
- **Evidence list + timeline in detail**: 1 hr
- **Testing & refinements**: 1 hr
- **Total**: ~9 hrs

---

## Success Criteria

✓ Page loads without console errors  
✓ DataTable renders 10 incidents per page  
✓ Filter tabs show correct counts (severity + status)  
✓ Clicking tab updates table  
✓ Clicking row populates detail panel  
✓ Severity badges render with correct colors  
✓ Status badges render with semantic colors  
✓ Sort works on all sortable columns  
✓ Pagination controls functional  
✓ Layout responsive (desktop/tablet/mobile)  
✓ All colors from design tokens  
✓ Detail panel shows evidence list (stubs ok)  
✓ Action buttons present (stubs ok)  
✓ No accessibility violations  
✓ Design compliance ≥ 99%  

---

**Ready for handoff**: Yes — All requirements documented, mock data provided, severity/status colors specified, integration clear.
