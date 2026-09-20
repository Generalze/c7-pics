/**
 * Wire types for the endpoints this app uses. They mirror the contracts in
 * packages/shared; they are copied rather than imported so Metro never has to
 * resolve a workspace package at runtime. Keep them in step with the API.
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "STATE_OFFICER"
  | "COORDINATOR"
  | "VALIDATOR"
  | "PAYOUT_OFFICER"
  | "MEMBER"
  | "ADMIN"
  | "CANDIDATE"
  | "AGENT"
  | "VOTER";

export type TerritorySummary = {
  geoPoliticalZoneId: string | null;
  stateId: string | null;
  senatorialDistrictId: string | null;
  federalConstituencyId: string | null;
  lgaId: string | null;
  wardId: string | null;
  stateConstituencyId: string | null;
  pollingUnitId: string | null;
};

export type AuthUserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  accountStatus: string;
  coordinatorProfile: ({ level: string } & TerritorySummary) | null;
  agentProfile: ({ politicalPartyId: string | null; gpsTrackingConsentAt: string | null } & TerritorySummary) | null;
};

export const INCIDENT_TYPES = [
  "VIOLENCE",
  "INTIMIDATION",
  "VOTE_BUYING",
  "MATERIAL_SHORTAGE",
  "LOGISTICS_DELAY",
  "MALFUNCTION",
  "SECURITY_CONCERN",
  "OTHER",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type IncidentListItem = {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  pollingUnitId: string | null;
  createdAt: string;
};

export const FIELD_TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type FieldTaskStatus = (typeof FIELD_TASK_STATUSES)[number];
export type FieldTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FieldTaskItem = {
  id: string;
  title: string;
  description: string;
  status: FieldTaskStatus;
  priority: FieldTaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  creatorName: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type AgentActivityType =
  | "CHECK_IN"
  | "CHECK_OUT"
  | "LOCATION_PING"
  | "INCIDENT_RESPONSE"
  | "VOTER_OUTREACH"
  | "MATERIAL_DISTRIBUTION"
  | "OBSERVATION";

export type AgentActivity = {
  id: string;
  type: AgentActivityType;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  note: string | null;
  pollingUnitId: string | null;
  createdAt: string;
};

export const ELECTION_DAY_OPENING_STATUSES = ["OPENED_ON_TIME", "OPENED_LATE", "NOT_OPEN"] as const;
export type ElectionDayOpeningStatus = (typeof ELECTION_DAY_OPENING_STATUSES)[number];
export type ElectionDayReportStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type ElectionDayVoteEntry = {
  politicalPartyId: string;
  politicalPartyName: string | null;
  votes: number;
};

export type ElectionDayReportItem = {
  id: string;
  reportDate: string;
  status: ElectionDayReportStatus;
  openingStatus: ElectionDayOpeningStatus;
  arrivalConfirmedAt: string;
  turnoutObservation: string;
  incidentNotes: string | null;
  remarks: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  voteEntries: ElectionDayVoteEntry[];
  createdAt: string;
};

export type ElectionDayReportAssetItem = {
  id: string;
  fileName: string;
  fileUrl: string;
};

export type ElectionDayPollingUnitStatus = {
  pollingUnitId: string;
  pollingUnitName: string | null;
  operationalStatus: string;
  checkedInAt: string | null;
  lastSeenAt: string | null;
  lastLocation: { latitude: number; longitude: number; accuracyMeters: number | null; capturedAt: string } | null;
  openIncidentCount: number;
  reportStatus: "NOT_SUBMITTED" | ElectionDayReportStatus;
  resultSubmitted: boolean;
  evidenceReceived: boolean;
};

export type MyStatusResponse = {
  status: ElectionDayPollingUnitStatus | null;
  realtime: { runtimeStatus: string; restFallbackAvailable: boolean };
};

export type PoliticalPartyItem = {
  id: string;
  name: string;
  code: string;
  isApprovedByInec: boolean;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};
