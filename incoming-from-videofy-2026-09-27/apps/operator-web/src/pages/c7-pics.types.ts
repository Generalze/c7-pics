/** @author masterzee001 */
/**
 * C7-PICS dashboard types and data structures.
 * Comprehensive type definitions for the incident management and reporting system.
 */

/* ================================================================ Incidents */

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'escalated' | 'resolved';
export type IncidentType = 'verification' | 'reporting' | 'equipment' | 'security' | 'other';
export type IncidentFilter = 'ALL' | 'HIGH' | 'MED' | 'LOW' | 'OPEN' | 'ESCALATED' | 'RESOLVED';

export interface IncidentNote {
  readonly id: string;
  readonly author: string;
  readonly authorId?: string;
  readonly text: string;
  readonly timestamp: Date;
}

export interface Incident {
  readonly id: string;
  readonly type: IncidentType;
  readonly title: string;
  readonly description: string;
  readonly severity: IncidentSeverity;
  readonly status: IncidentStatus;
  readonly timestamp: Date;
  readonly updatedAt: Date;
  readonly location?: string; // e.g., "Lagos State"
  readonly pu?: string; // Polling Unit code
  readonly agent?: string; // Agent name or ID
  readonly assignedTo?: string; // Assigned operator
  readonly notes: readonly IncidentNote[];
}

export interface IncidentFilter {
  readonly status?: IncidentStatus | readonly IncidentStatus[];
  readonly severity?: IncidentSeverity | readonly IncidentSeverity[];
  readonly type?: IncidentType | readonly IncidentType[];
  readonly location?: string;
  readonly assignedTo?: string;
  readonly dateRange?: {
    readonly from: Date;
    readonly to: Date;
  };
}

/* ================================================================ Reports */

export interface ReportMetrics {
  readonly coverage: number; // percentage 0-100
  readonly verification: number; // percentage 0-100
  readonly activity: number; // percentage 0-100
  readonly resolution: number; // percentage 0-100
}

export interface MetricTrend {
  readonly direction: 'up' | 'down';
  readonly value: number; // percentage change
  readonly period: string; // e.g., "vs last period", "vs last month"
}

export interface CampaignTally {
  readonly id: string;
  readonly campaignName: string;
  readonly total: number;
  readonly completed: number;
  readonly inProgress: number;
  readonly pending: number;
  readonly startDate: Date;
  readonly endDate?: Date;
}

export interface LgaLeaderboardEntry {
  readonly rank: number;
  readonly lga: string; // Local Government Area
  readonly coverage: number; // percentage
  readonly resultsReported: number;
  readonly agents: number;
  readonly pollingUnits: number;
  readonly averageCompletionTime?: number; // minutes
}

export type IncidentBreakdownSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IncidentBreakdownEntry {
  readonly severity: IncidentBreakdownSeverity;
  readonly count: number;
  readonly trend?: MetricTrend;
}

export interface IncidentBreakdownByStatus {
  readonly status: IncidentStatus;
  readonly count: number;
}

export interface EvidenceSummary {
  readonly photos: number;
  readonly videos: number;
  readonly documents: number;
  readonly audio: number;
  readonly total: number;
  readonly size?: number; // bytes
}

export type ExportReportType =
  | 'LGA Coverage'
  | 'Results Summary'
  | 'Incident Report'
  | 'Agent Activity'
  | 'Evidence Inventory'
  | 'System Audit';

export interface ExportReport {
  readonly type: ExportReportType;
  readonly generatedAt: Date;
  readonly fileName: string;
  readonly format: 'csv' | 'pdf' | 'xlsx';
  readonly filters?: {
    readonly dateRange?: {
      readonly from: Date;
      readonly to: Date;
    };
    readonly location?: string;
    readonly status?: IncidentStatus;
  };
}

/* ================================================================ Dashboard */

export interface DashboardState {
  readonly incidents: {
    readonly list: readonly Incident[];
    readonly selectedId?: string;
    readonly filter: IncidentFilter;
    readonly isLoading: boolean;
    readonly error?: string;
  };
  readonly reports: {
    readonly metrics: ReportMetrics;
    readonly campaignTally: readonly CampaignTally[];
    readonly lgaLeaderboard: readonly LgaLeaderboardEntry[];
    readonly incidentBreakdown: readonly IncidentBreakdownEntry[];
    readonly evidenceSummary: EvidenceSummary;
    readonly isLoading: boolean;
    readonly error?: string;
  };
  readonly lastUpdated: Date;
}

/* ================================================================ API Responses */

export interface ApiIncident extends Omit<Incident, 'timestamp' | 'updatedAt'> {
  readonly timestamp: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
  readonly notes: ReadonlyArray<Omit<IncidentNote, 'timestamp'> & { readonly timestamp: string }>;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
}
