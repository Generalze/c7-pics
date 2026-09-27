/** @author masterzee001 */
/**
 * C7-PICS utility functions for data manipulation and formatting.
 */
import type { Incident, IncidentFilter as IncidentFilterType, IncidentSeverity, IncidentStatus, IncidentFilter as FilterEnum } from './c7-pics.types';

/**
 * Filter incidents by the given filter criteria.
 */
export function filterIncidents(incidents: readonly Incident[], filter: FilterEnum): readonly Incident[] {
  return incidents.filter((incident) => {
    switch (filter) {
      case 'ALL':
        return true;
      case 'HIGH':
        return incident.severity === 'high' || incident.severity === 'critical';
      case 'MED':
        return incident.severity === 'medium';
      case 'LOW':
        return incident.severity === 'low';
      case 'OPEN':
        return incident.status === 'open';
      case 'ESCALATED':
        return incident.status === 'escalated';
      case 'RESOLVED':
        return incident.status === 'resolved';
    }
  });
}

/**
 * Sort incidents by a given field.
 */
export function sortIncidents(incidents: readonly Incident[], sortBy: 'severity' | 'date' | 'status'): readonly Incident[] {
  const sorted = [...incidents];

  switch (sortBy) {
    case 'severity': {
      const severityOrder: Record<IncidentSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return sorted.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }
    case 'date':
      return sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    case 'status': {
      const statusOrder: Record<IncidentStatus, number> = {
        open: 0,
        escalated: 1,
        resolved: 2,
      };
      return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
  }
}

/**
 * Count incidents by severity.
 */
export function countBySeverity(incidents: readonly Incident[]): Record<IncidentSeverity, number> {
  return incidents.reduce(
    (acc, incident) => {
      acc[incident.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

/**
 * Count incidents by status.
 */
export function countByStatus(incidents: readonly Incident[]): Record<IncidentStatus, number> {
  return incidents.reduce(
    (acc, incident) => {
      acc[incident.status] += 1;
      return acc;
    },
    { open: 0, escalated: 0, resolved: 0 },
  );
}

/**
 * Format a number as a percentage string.
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)}%`;
}

/**
 * Format bytes as human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format a date as a relative string (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return 'just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Group incidents by a given field.
 */
export function groupIncidents(
  incidents: readonly Incident[],
  groupBy: 'severity' | 'status' | 'location' | 'agent',
): Record<string, readonly Incident[]> {
  return incidents.reduce(
    (acc, incident) => {
      let key: string;

      switch (groupBy) {
        case 'severity':
          key = incident.severity;
          break;
        case 'status':
          key = incident.status;
          break;
        case 'location':
          key = incident.location ?? 'Unspecified';
          break;
        case 'agent':
          key = incident.agent ?? 'Unassigned';
          break;
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      (acc[key] as unknown[]).push(incident);

      return acc;
    },
    {} as Record<string, readonly Incident[]>,
  );
}

/**
 * Calculate statistics about incidents.
 */
export function calculateIncidentStats(incidents: readonly Incident[]): {
  readonly total: number;
  readonly open: number;
  readonly escalated: number;
  readonly resolved: number;
  readonly avgResponseTime?: number; // minutes
  readonly avgResolutionTime?: number; // minutes
  readonly resolutionRate: number; // percentage
  readonly escalationRate: number; // percentage
} {
  const byStatus = countByStatus(incidents);
  const total = incidents.length;

  return {
    total,
    open: byStatus.open,
    escalated: byStatus.escalated,
    resolved: byStatus.resolved,
    resolutionRate: total > 0 ? (byStatus.resolved / total) * 100 : 0,
    escalationRate: total > 0 ? (byStatus.escalated / total) * 100 : 0,
  };
}

/**
 * Search incidents by text.
 */
export function searchIncidents(incidents: readonly Incident[], query: string): readonly Incident[] {
  const lowerQuery = query.toLowerCase();

  return incidents.filter((incident) => {
    return (
      incident.title.toLowerCase().includes(lowerQuery) ||
      incident.description.toLowerCase().includes(lowerQuery) ||
      incident.location?.toLowerCase().includes(lowerQuery) ||
      incident.agent?.toLowerCase().includes(lowerQuery) ||
      incident.pu?.toLowerCase().includes(lowerQuery) ||
      incident.type.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Export incidents as CSV.
 */
export function exportIncidentsAsCSV(incidents: readonly Incident[]): string {
  const headers = ['ID', 'Type', 'Title', 'Severity', 'Status', 'Location', 'Agent', 'Assigned To', 'Created', 'Updated', 'Notes Count'];

  const rows = incidents.map((incident) => [
    incident.id,
    incident.type,
    `"${incident.title}"`,
    incident.severity,
    incident.status,
    incident.location ?? '',
    incident.agent ?? '',
    incident.assignedTo ?? '',
    incident.timestamp.toISOString(),
    incident.updatedAt.toISOString(),
    incident.notes.length,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csv;
}

/**
 * Download CSV file.
 */
export function downloadCSV(csv: string, fileName: string = 'incidents.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Check if an incident requires immediate attention.
 */
export function requiresImmediateAttention(incident: Incident): boolean {
  if (incident.severity === 'critical') return true;
  if (incident.severity === 'high' && incident.status === 'open') return true;
  if (incident.status === 'escalated') return true;

  // Check if incident is older than threshold without action
  const ageInHours = (new Date().getTime() - incident.timestamp.getTime()) / (1000 * 60 * 60);
  if (ageInHours > 2 && incident.status === 'open') return true;

  return false;
}
