# Workflow Agent 4: Evidence Vault
**Status**: READY FOR EXECUTION  
**Date**: 2026-09-19  
**Agent**: (Assigned)  
**Confidence**: High  
**Pattern**: Grid layout + lightbox + status badges + filter tabs

---

## Summary

Agent 4 builds the Evidence Vault page for the C7-PICS operator dashboard. This page displays evidence items (photos, videos, documents) in a gallery grid with lightbox preview, status filtering, and metadata. Unlike Agents/Results/Incidents (which use DataTable), this page uses a **custom grid layout** with card components.

**Key Deliverable**: A fully styled, responsive Evidence Vault with gallery grid, lightbox, filter tabs, and evidence cards with status badges.

---

## Scope

### Files to Create
```
apps/operator-web/src/pages/Evidence/
├── EvidenceVault.tsx          (Main page component)
├── EvidenceVault.module.css   (Page styles + responsive grid)
├── EvidenceCard.tsx           (Card component for grid items)
├── EvidenceCard.module.css    (Card styles)
└── index.ts                   (Exports)
```

### Dependencies
- ✓ Import `StatusBadge` from `apps/operator-web/src/components/DataTable`
- ✓ Use design tokens from `packages/design-system/src/tokens.css`
- ✓ NO DataTable — custom grid layout + cards

---

## Data Model

```typescript
interface EvidenceItem {
  id: string;                  // Unique evidence ID
  type: 'photo' | 'video' | 'document'; // Media type
  agentId: string;             // Agent who submitted evidence
  agentName: string;           // Agent display name
  url: string;                 // Media URL (stub: use placeholder URL)
  thumbnail?: string;          // Thumbnail URL (if different from url)
  title: string;               // Evidence title/description
  mimeType: string;            // image/jpeg, video/mp4, application/pdf
  fileSize: number;            // Bytes (for display)
  status: 'pending' | 'verified' | 'rejected'; // Verification state
  verifiedBy?: string;         // Verifier's name (if status != pending)
  verificationDate?: string;   // ISO 8601 verification time
  incidentIds?: string[];      // Linked incident IDs (for cross-ref)
  uploadedAt: string;          // ISO 8601 upload time
}
```

### Mock Data (Minimum 12 evidence items — 4 per type)
- **Photos** (4):
  - 2 verified (green)
  - 1 pending (blue)
  - 1 rejected (red)
- **Videos** (4):
  - 2 verified
  - 1 pending
  - 1 rejected
- **Documents** (4):
  - 2 verified
  - 1 pending
  - 1 rejected

**Example**:
```typescript
{
  id: 'EV-001',
  type: 'photo',
  agentId: 'AGT-005',
  agentName: 'Alice Okonkwo',
  url: 'https://placeholder.com/image/600x400?text=EV-001',
  thumbnail: 'https://placeholder.com/image/200x150?text=EV-001',
  title: 'Polling Unit Results Board',
  mimeType: 'image/jpeg',
  fileSize: 2048000,           // 2 MB
  status: 'verified',
  verifiedBy: 'John Admin',
  verificationDate: '2026-09-18T16:30:00Z',
  incidentIds: [],
  uploadedAt: '2026-09-18T14:15:00Z'
}
```

---

## Layout & Design

### Page Structure
```
┌──────────────────────────────────────────────┐
│ Evidence Vault  [Upload] [Export]            │
├──────────────────────────────────────────────┤
│ [All] [Photos] [Videos] [Documents]          │  ← Filter tabs w/ counts
│ [All Status] [Verified] [Pending] [Rejected] │  ← Status filter tabs
├──────────────────────────────────────────────┤
│                                              │
│ [Card] [Card] [Card]                         │  ← Grid layout (3 cols)
│ [Card] [Card] [Card]  ← 2 tabs each scroll   │
│ [Card] [Card] [Card]   independently         │
│                                              │
│ (Lightbox overlay on card click)             │
│                                              │
└──────────────────────────────────────────────┘

Responsive: 3 cols (lg) → 2 cols (md) → 1 col (sm)
```

---

## Evidence Card Component

### Visual Design
```
┌──────────────────────┐
│ [Thumbnail Image]    │  ← Clickable for lightbox
│ ┌──────────────────┐ │
│ │ [Type Icon/Badge]│ │  ← photo/video/document
│ │ [Status Badge]   │ │  ← pending/verified/rejected
│ └──────────────────┘ │
├──────────────────────┤
│ Title (truncated)    │
│ Agent Name (small)   │
│ File Size (xs)       │
│ Uploaded: [date]     │
├──────────────────────┤
│ [View Details]       │  ← Stub button
└──────────────────────┘
```

### Card Layout (CSS Grid / Flexbox)
```typescript
// EvidenceCard.tsx
interface EvidenceCardProps {
  item: EvidenceItem;
  onViewDetails?: (item: EvidenceItem) => void;
  onPreview?: (item: EvidenceItem) => void;  // Trigger lightbox
}

export function EvidenceCard({ item, onViewDetails, onPreview }: EvidenceCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} onClick={() => onPreview?.(item)}>
        <img src={item.thumbnail || item.url} alt={item.title} />
        <div className={styles.badges}>
          <span className={styles.typeBadge}>{item.type.toUpperCase()}</span>
          <StatusBadge 
            status={item.status === 'verified' ? 'success' : 
                   item.status === 'pending' ? 'info' : 'danger'}
            label={item.status}
            showDot={true}
          />
        </div>
      </div>
      <div className={styles.metadata}>
        <h4 className={styles.title}>{item.title}</h4>
        <p className={styles.agent}>{item.agentName}</p>
        <p className={styles.fileSize}>{formatBytes(item.fileSize)}</p>
        <p className={styles.date}>Uploaded: {formatDate(item.uploadedAt)}</p>
      </div>
      <button onClick={() => onViewDetails?.(item)}>View Details</button>
    </div>
  );
}
```

---

## Grid Layout (EvidenceVault.tsx)

### Responsive Grid
```css
/* EvidenceVault.module.css */

.grid {
  display: grid;
  gap: var(--vf-space-4);  /* 16px between cards */
  grid-template-columns: repeat(3, 1fr);  /* 3 cols (lg) */
}

@media (max-width: 1023px) {
  .grid { grid-template-columns: repeat(2, 1fr); }  /* 2 cols (md) */
}

@media (max-width: 767px) {
  .grid { grid-template-columns: 1fr; }  /* 1 col (sm) */
}
```

---

## Filter Tabs

### Tab Group 1: Media Type (4 tabs)
```typescript
const typeFilters = [
  { label: 'All', key: 'all', count: items.length },
  { label: 'Photos', key: 'photo', count: items.filter(i => i.type === 'photo').length },
  { label: 'Videos', key: 'video', count: items.filter(i => i.type === 'video').length },
  { label: 'Documents', key: 'document', count: items.filter(i => i.type === 'document').length },
];
```

### Tab Group 2: Verification Status (4 tabs)
```typescript
const statusFilters = [
  { label: 'All Status', key: 'allStatus', count: items.length },
  { label: 'Verified', key: 'verified', count: items.filter(i => i.status === 'verified').length },
  { label: 'Pending', key: 'pending', count: items.filter(i => i.status === 'pending').length },
  { label: 'Rejected', key: 'rejected', count: items.filter(i => i.status === 'rejected').length },
];
```

**Behavior**:
- Type and Status filters are **independent** (can combine)
- E.g., "Photos + Verified" shows only verified photos
- Counts update dynamically
- Tab change resets detail/lightbox state

---

## Lightbox Component (Simple Implementation)

### Lightbox (Modal Overlay)
```typescript
// Simple modal on card click
function LightboxModal({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        {item.type === 'photo' && (
          <img src={item.url} alt={item.title} />
        )}
        {item.type === 'video' && (
          <video controls src={item.url} />
        )}
        {item.type === 'document' && (
          <div className={styles.documentStub}>
            <p>[Document Preview Stub]</p>
            <a href={item.url} target="_blank" rel="noopener">Download PDF</a>
          </div>
        )}
        
        <div className={styles.lightboxMetadata}>
          <h3>{item.title}</h3>
          <p>Agent: {item.agentName}</p>
          <p>Status: <StatusBadge status={statusToSemantic(item.status)} label={item.status} /></p>
          <p>Uploaded: {formatDate(item.uploadedAt)}</p>
        </div>
      </div>
    </div>
  );
}
```

**Behavior**:
- Click card thumbnail → open lightbox
- Click overlay or close button → close
- Keyboard: Escape key closes
- Video: native controls (play/pause)
- Document: link to download (stub ok)

---

## Styling Requirements

### Design Tokens
- **Status badge colors**: Same as Agent 1/2/3
  - verified: `--vf-status-success-text` (#4ade80)
  - pending: `--vf-status-info-text` (#38bdf8)
  - rejected: `--vf-status-danger-text` (#f87171)
- **Text colors**: `--vf-text-primary`, `--vf-text-secondary`
- **Spacing**: All gaps from `--vf-space-*` (2, 3, 4, 5, 6)
- **Typography**: Match other pages font-size scale

### CSS Module Classes
```css
/* EvidenceVault.module.css */

.root { /* Page container */ }
.header { /* Title + action buttons */ }
.filterContainer { /* Both filter tab groups */ }
.filterGroup { /* One tab group (type or status) */ }
.filterLabel { /* "Media Type:" or "Status:" */ }
.filterTabs { /* Tab row */ }
.filterTab { /* Inactive tab */ }
.filterTabActive { /* Active tab highlight */ }
.filterCount { /* Count badge on tabs */ }
.grid { /* CSS Grid container */ }
.emptyState { /* If no items match filters */ }
.lightboxOverlay { /* Full-screen overlay */ }
.lightboxContent { /* Modal box */ }
.lightboxMetadata { /* Info below media */ }
.closeButton { /* × button */ }

/* EvidenceCard.module.css */

.card { /* Card container */ }
.thumbnail { /* Image/thumbnail area */ }
.badges { /* Type + status badges */ }
.metadata { /* Title, agent, date */ }
.title { /* Card title */ }
.agent { /* Agent name */ }
.fileSize { /* File size (xs text) */ }
.date { /* Upload date (xs text) */ }
```

---

## Responsive Breakpoints

| Breakpoint | Change |
|-----------|--------|
| **lg (1024px+)** | 3-column grid |
| **md (768–1023px)** | 2-column grid |
| **sm (<768px)** | 1-column grid, full-width cards |

**Test at**: 320px, 480px, 768px, 1024px, 1440px

---

## Implementation Checklist

- [ ] Create `EvidenceVault.tsx` with page component
- [ ] Create `EvidenceVault.module.css` with grid and page styles
- [ ] Create `EvidenceCard.tsx` with card component
- [ ] Create `EvidenceCard.module.css` with card styles
- [ ] Create `index.ts` export file
- [ ] Define `EvidenceItem` interface
- [ ] Add mock data (12+ items, 4 per type, mixed status)
- [ ] Import `StatusBadge` from Agent 1
- [ ] Implement media type filter tabs (4 tabs + counts)
- [ ] Implement status filter tabs (4 tabs + counts)
- [ ] Combine filters (independent, multiplicative)
- [ ] Render grid of EvidenceCard components
- [ ] Implement lightbox modal on card click
- [ ] Add close button and Escape key handling
- [ ] Add file size formatting utility (formatBytes)
- [ ] Add date formatting utility (formatDate)
- [ ] Test responsive at 4+ breakpoints
- [ ] Verify all colors use design tokens
- [ ] Check focus rings on cards and buttons
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Verify WCAG AAA contrast
- [ ] Add empty state (if no items match filters)

---

## Design Compliance Target

✓ 99%+ match to Agents/Results/Incidents page design tokens  
✓ Grid layout responsive (3/2/1 columns)  
✓ Status badges color-coded (verified/pending/rejected)  
✓ All colors from design tokens  
✓ Lightbox modal functional  
✓ Filter tabs with live counts  
✓ Focus rings on all interactive elements  
✓ Empty and loading states  
✓ Zero hardcoded colors  

---

## Integration Points

1. **Routing** (Opus 5 will handle):
   - Mount at `/evidence`
   - Add nav link in sidebar/header

2. **API Service** (Opus 5 will handle):
   - Replace mock data with real `/api/evidence` calls
   - Bind action handlers (View Details)

3. **Cross-page Links** (stubs ok):
   - "View Details" button → detail modal or Incidents page
   - Agent name → navigate to Agents page (Agent 1)

---

## Time Estimate

- **Component structure + EvidenceCard**: 2 hrs
- **Grid layout + responsive**: 1.5 hrs
- **Filter tabs (2 groups, independent)**: 1.5 hrs
- **Lightbox modal**: 1.5 hrs
- **Styling (CSS modules, tokens)**: 1.5 hrs
- **Testing & refinements**: 1 hr
- **Total**: ~9 hrs

---

## Success Criteria

✓ Page loads without console errors  
✓ Grid renders 12+ evidence items  
✓ Filter tabs show correct counts (type + status)  
✓ Filters combine independently  
✓ Clicking card opens lightbox  
✓ Lightbox displays media (image/video/document stub)  
✓ Escape key closes lightbox  
✓ Grid responsive (3/2/1 cols)  
✓ Status badges render with correct colors  
✓ All colors from design tokens  
✓ Empty state renders if no items match  
✓ File sizes formatted (KB/MB)  
✓ Dates formatted consistently  
✓ No accessibility violations  
✓ Design compliance ≥ 99%  

---

**Ready for handoff**: Yes — All requirements documented, mock data provided, filter logic specified, lightbox behavior defined, integration clear.
