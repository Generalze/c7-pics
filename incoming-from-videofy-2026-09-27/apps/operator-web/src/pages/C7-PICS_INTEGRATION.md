# C7-PICS Dashboard Integration Guide

This document describes how to integrate the Incidents and Reports pages into your application.

## Overview

The C7-PICS (Citizen Electoral Integrity and Monitoring System) dashboard provides:

1. **Incidents Page** - Incident management with severity-based filtering and detail panels
2. **Reports Page** - Analytics dashboard with key metrics, charts, and exportable reports

## File Structure

```
src/pages/
├── IncidentsPage.tsx              # Main incidents page component
├── IncidentsPage.module.css       # Incidents page styling
├── IncidentsPage.test.tsx         # Incidents page tests
├── ReportsPage.tsx                # Main reports page component
├── ReportsPage.module.css         # Reports page styling
├── ReportsPage.test.tsx           # Reports page tests
├── c7-pics.types.ts               # Comprehensive type definitions
├── c7-pics.mocks.ts               # Mock data for development
├── c7-pics.utils.ts               # Utility functions for data manipulation
└── C7-PICS_INTEGRATION.md         # This file
```

## Type Definitions

### Core Types

```typescript
// Incident severity levels
type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

// Incident statuses
type IncidentStatus = 'open' | 'escalated' | 'resolved';

// Incident data structure
interface Incident {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  timestamp: Date;
  updatedAt: Date;
  location?: string;
  pu?: string;
  agent?: string;
  assignedTo?: string;
  notes: readonly IncidentNote[];
}

// Report metrics
interface ReportMetrics {
  coverage: number;           // 0-100%
  verification: number;       // 0-100%
  activity: number;          // 0-100%
  resolution: number;        // 0-100%
}
```

See `c7-pics.types.ts` for complete type definitions.

## Component Props

### IncidentsPage Props

```typescript
interface IncidentsPageProps {
  readonly active: boolean;
  readonly incidents: readonly Incident[];
  readonly onAddNote: (incidentId: string, note: string) => void;
  readonly onMessage: (incidentId: string, message: string) => void;
  readonly onEscalate: (incidentId: string) => void;
  readonly onResolve: (incidentId: string) => void;
}
```

**Features:**
- Filter by severity (ALL, HIGH, MED, LOW)
- Filter by status (OPEN, ESCALATED, RESOLVED)
- View incident details in right-side panel
- Add notes, escalate, resolve, and message incidents
- Tab-based filtering with incident counts

### ReportsPage Props

```typescript
interface ReportsPageProps {
  readonly active: boolean;
  readonly metrics: ReportMetrics;
  readonly campaignTally: readonly CampaignTally[];
  readonly lgaLeaderboard: readonly LgaLeaderboardEntry[];
  readonly incidentBreakdown: readonly IncidentBreakdownEntry[];
  readonly evidenceSummary: EvidenceSummary;
  readonly onExportReport: (reportType: string) => void;
}
```

**Sections:**
- Key metrics cards (coverage, verification, activity, resolution)
- Campaign tally with progress bars
- LGA leaderboard ranking
- Incident breakdown by severity
- Evidence summary by type
- Exportable reports (6 report types)

## Integration Steps

### 1. Import Components

```typescript
import { IncidentsPage } from './pages/IncidentsPage';
import { ReportsPage } from './pages/ReportsPage';
import type { Incident, ReportMetrics } from './pages/c7-pics.types';
```

### 2. Add Routing

Update `src/router.ts` to include new pages:

```typescript
export const OPERATOR_PAGES = [
  // ... existing pages
  'incidents',  // Add this
  'reports',    // Add this
] as const;

export const PAGE_TITLES: Record<OperatorPage, string> = {
  // ... existing titles
  incidents: 'Incidents',
  reports: 'Reports',
};
```

### 3. Add to Navigation

Update your app's navigation to include links to the new pages:

```typescript
const navItems = [
  // ... existing items
  { page: 'incidents', label: 'Incidents', icon: 'alert-circle' },
  { page: 'reports', label: 'Reports', icon: 'bar-chart-2' },
];
```

### 4. Wire Data in App Component

```typescript
import { IncidentsPage } from './pages/IncidentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { MOCK_INCIDENTS, MOCK_METRICS } from './pages/c7-pics.mocks';

function App() {
  const currentPage = pageFromHash(window.location.hash);

  // For incidents page
  const handleIncidentAction = (type: 'note' | 'message' | 'escalate' | 'resolve', incidentId: string, data?: string) => {
    // Handle the action - typically via API call
    console.log(`${type} incident ${incidentId}:`, data);
  };

  // For reports page
  const handleExportReport = (reportType: string) => {
    // Trigger report download
    console.log('Export report:', reportType);
  };

  return (
    <>
      {currentPage === 'incidents' && (
        <IncidentsPage
          active={true}
          incidents={MOCK_INCIDENTS}
          onAddNote={(id, note) => handleIncidentAction('note', id, note)}
          onMessage={(id, msg) => handleIncidentAction('message', id, msg)}
          onEscalate={(id) => handleIncidentAction('escalate', id)}
          onResolve={(id) => handleIncidentAction('resolve', id)}
        />
      )}
      {currentPage === 'reports' && (
        <ReportsPage
          active={true}
          metrics={MOCK_METRICS}
          campaignTally={MOCK_CAMPAIGNS}
          lgaLeaderboard={MOCK_LGA_LEADERBOARD}
          incidentBreakdown={MOCK_INCIDENT_BREAKDOWN}
          evidenceSummary={MOCK_EVIDENCE_SUMMARY}
          onExportReport={handleExportReport}
        />
      )}
    </>
  );
}
```

## Styling

The pages use CSS Modules and integrate with the existing design token system:

**Color Tokens:**
- `--op-danger` - Critical/High severity
- `--op-warn` - Medium severity
- `--op-info` - Low severity
- `--op-text`, `--op-text-secondary`, `--op-text-muted` - Text colors
- `--op-panel`, `--op-panel-raised`, `--op-panel-sunken` - Surface colors
- `--op-violet`, `--op-teal` - Accent colors

**Spacing Tokens:**
- `--op-radius-sm`, `--op-radius-md`, `--op-radius-lg` - Border radius
- Standard 8px grid system

The CSS uses CSS Grid and Flexbox for responsive layouts that work from mobile to desktop.

## Utility Functions

The `c7-pics.utils.ts` file provides helpers:

```typescript
// Filtering
filterIncidents(incidents, 'HIGH');  // Filter by severity
searchIncidents(incidents, 'query'); // Search by text

// Sorting
sortIncidents(incidents, 'severity');
sortIncidents(incidents, 'date');

// Statistics
calculateIncidentStats(incidents);
countBySeverity(incidents);
countByStatus(incidents);

// Formatting
formatPercentage(78);        // "78%"
formatBytes(1024);           // "1 KB"
formatRelativeTime(date);    // "2 hours ago"

// Export
exportIncidentsAsCSV(incidents);
downloadCSV(csv, 'incidents.csv');
```

## Mock Data

For development and testing, use the provided mock data:

```typescript
import {
  MOCK_INCIDENTS,
  MOCK_CAMPAIGNS,
  MOCK_LGA_LEADERBOARD,
  MOCK_INCIDENT_BREAKDOWN,
  MOCK_EVIDENCE_SUMMARY,
  MOCK_METRICS,
} from './pages/c7-pics.mocks';
```

## Accessibility

Both pages follow WCAG 2.1 AA standards:

- ✓ Proper heading hierarchy (h2, h3, h4)
- ✓ ARIA labels and roles
- ✓ Keyboard navigation support
- ✓ Color contrast compliance
- ✓ Screen reader friendly
- ✓ Focus indicators
- ✓ Status messages

## Testing

Run tests with:

```bash
npm test IncidentsPage.test.tsx
npm test ReportsPage.test.tsx
```

Tests cover:
- Component rendering
- User interactions
- Filtering and sorting
- Action handlers
- Empty states
- Accessibility compliance

## Performance Considerations

1. **Memoization**: Components don't memoize by default; add if rendering large lists
2. **Virtual Scrolling**: For 1000+ incidents, consider virtualization
3. **Lazy Loading**: Charts and tables render instantly; data updates are fast
4. **Export**: CSV export is memory-efficient for large datasets

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers: iOS Safari 14+, Chrome for Android

## Future Enhancements

- [ ] Real-time incident updates via WebSocket
- [ ] Advanced filtering with date ranges and custom queries
- [ ] Incident analytics and trend visualization
- [ ] Agent performance metrics
- [ ] Multi-language support
- [ ] Print-friendly reports
- [ ] Email report delivery
- [ ] Alert notifications for critical incidents

## Support

For questions or issues:
1. Check the type definitions in `c7-pics.types.ts`
2. Review mock data patterns in `c7-pics.mocks.ts`
3. Examine existing pages (e.g., `OverviewPage.tsx`) for integration patterns
4. Run tests to verify behavior
