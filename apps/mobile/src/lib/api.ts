import { API_BASE_URL } from "./config";
import type {
  AgentActivity,
  AuthUserProfile,
  Coordinates,
  ElectionDayOpeningStatus,
  ElectionDayReportAssetItem,
  ElectionDayReportItem,
  FieldTaskItem,
  FieldTaskStatus,
  IncidentListItem,
  IncidentSeverity,
  IncidentType,
  MyStatusResponse,
  NotificationItem,
  PoliticalPartyItem,
} from "./types";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/** Thrown when the device cannot reach the API at all (no network, DNS, TLS). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("The PICS server could not be reached. Check your connection and try again.");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
  /** Raw binary upload: body is sent as-is with this content type. */
  rawContentType?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  const headers: Record<string, string> = { Accept: "application/json", ...(options.headers ?? {}) };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: BodyInit | undefined;
  if (options.rawContentType) {
    headers["Content-Type"] = options.rawContentType;
    body = options.body as BodyInit;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    throw new NetworkError(error);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

// ---------------------------------------------------------------- auth

export async function login(
  email: string,
  password: string,
  agentGpsConsent: boolean,
): Promise<{ token: string; user: AuthUserProfile }> {
  return request("/auth/login", { method: "POST", body: { email, password, agentGpsConsent } });
}

export async function fetchMe(token: string): Promise<AuthUserProfile> {
  const payload = await request<{ user: AuthUserProfile }>("/auth/me", { token });
  return payload.user;
}

export async function logout(token: string): Promise<void> {
  await request("/auth/logout", { method: "POST", token });
}

// ---------------------------------------------------------------- election day operations

type OperationPayload = Partial<Coordinates> & { note?: string; idempotencyKey?: string };

export async function checkIn(token: string, payload: OperationPayload) {
  return request<{ message: string; alreadyRecorded: boolean; activity: AgentActivity }>("/election-day/check-in", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function checkOut(token: string, payload: OperationPayload) {
  return request<{ message: string; activity: AgentActivity }>("/election-day/check-out", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function sendLocationPing(token: string, payload: OperationPayload) {
  return request<{ message: string; activity: AgentActivity }>("/election-day/location-pings", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function fetchMyStatus(token: string): Promise<MyStatusResponse> {
  return request("/election-day/my-status", { token });
}

export async function reportIncident(
  token: string,
  body: {
    type: IncidentType;
    title: string;
    description: string;
    severity: IncidentSeverity;
    latitude?: number;
    longitude?: number;
  },
): Promise<IncidentListItem> {
  const payload = await request<{ incident: IncidentListItem }>("/election-day/incidents", {
    method: "POST",
    token,
    body,
  });
  return payload.incident;
}

// ---------------------------------------------------------------- agent

export async function fetchActivities(token: string, pageSize = 20): Promise<AgentActivity[]> {
  const payload = await request<{ activities: AgentActivity[] }>(`/agent/activities?pageSize=${pageSize}`, { token });
  return payload.activities;
}

export async function fetchTasks(token: string): Promise<FieldTaskItem[]> {
  const payload = await request<{ tasks: FieldTaskItem[] }>("/agent/tasks", { token });
  return payload.tasks;
}

export async function updateTask(
  token: string,
  taskId: string,
  body: { status: FieldTaskStatus; resolutionNote?: string },
): Promise<FieldTaskItem> {
  const payload = await request<{ task: FieldTaskItem }>(`/agent/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    token,
    body,
  });
  return payload.task;
}

export type ReportPhotoKind = "arrival-photo" | "post-counting-photo";

/**
 * The API takes the raw image bytes as the request body (JPEG, PNG or WebP,
 * up to 2 MB) and returns the stored asset id the report then references.
 */
export async function uploadReportPhoto(
  token: string,
  kind: ReportPhotoKind,
  file: { uri: string; mimeType: string; fileName: string },
): Promise<ElectionDayReportAssetItem> {
  let blob: Blob;
  try {
    blob = await (await fetch(file.uri)).blob();
  } catch (error) {
    throw new NetworkError(error);
  }
  const payload = await request<{ asset: ElectionDayReportAssetItem }>(`/agent/election-report-assets/${kind}`, {
    method: "POST",
    token,
    body: blob,
    rawContentType: file.mimeType,
    headers: { "X-File-Name": file.fileName },
    timeoutMs: 60_000,
  });
  return payload.asset;
}

export async function fetchMyReports(token: string): Promise<ElectionDayReportItem[]> {
  const payload = await request<{ reports: ElectionDayReportItem[] }>("/agent/election-reports", { token });
  return payload.reports;
}

export async function submitElectionReport(
  token: string,
  body: {
    reportDate: string;
    openingStatus: ElectionDayOpeningStatus;
    arrivalConfirmedAt: string;
    turnoutObservation: string;
    incidentNotes?: string;
    remarks?: string;
    arrivalPhotoAssetId: string;
    postCountingPhotoAssetId: string;
    voteEntries: Array<{ politicalPartyId: string; votes: number }>;
  },
): Promise<ElectionDayReportItem> {
  const payload = await request<{ report: ElectionDayReportItem }>("/agent/election-reports", {
    method: "POST",
    token,
    body,
  });
  return payload.report;
}

// ---------------------------------------------------------------- notifications and reference

export async function fetchNotifications(token: string): Promise<NotificationItem[]> {
  const payload = await request<{ notifications: NotificationItem[] }>("/notifications", { token });
  return payload.notifications;
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await request("/notifications/read-all", { method: "PATCH", token });
}

export async function fetchParties(): Promise<PoliticalPartyItem[]> {
  const payload = await request<{ parties: PoliticalPartyItem[] }>("/candidate/public/parties");
  return payload.parties;
}
