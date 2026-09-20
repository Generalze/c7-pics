"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IncidentListItem } from "@pics-nigeria/shared";
import { escalateAdminIncident, fetchAdminIncidents, updateAdminIncidentStatus } from "../../../lib/api";
import { useCommandSession } from "../../../components/command/session";
import { loadLgaNames, loadPollingUnitNames, loadWardNames, nameOf } from "../../../components/command/territory";
import {
  Badge,
  Banner,
  Btn,
  Def,
  DetailEmpty,
  Empty,
  Kpi,
  Loading,
  Panel,
  clockTime,
  count,
  dayAndTime,
  incidentStatusTone,
  severityTone,
  words,
} from "../../../components/command/ui";

const REFRESH_MS = 30_000;

type SeverityFilter = "all" | "HIGH" | "MEDIUM" | "LOW";
type StatusFilter = "all" | "OPEN" | "ESCALATED" | "RESOLVED";

function isEscalated(incident: IncidentListItem): boolean {
  return incident.governance?.escalationStatus === "ESCALATED";
}

export default function IncidentsPage() {
  const { token } = useCommandSession();
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());
  const [puNames, setPuNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setIncidents(await fetchAdminIncidents(token));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load incidents.");
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadLgaNames(token).catch(() => new Map<string, string>()),
      loadWardNames(token).catch(() => new Map<string, string>()),
    ]).then(([lgas, wards]) => {
      if (cancelled) return;
      setLgaNames(lgas);
      setWardNames(wards);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (incidents.length === 0 || wardNames.size === 0) return;
    let cancelled = false;
    void loadPollingUnitNames(
      token,
      incidents.map((incident) => incident.wardId),
    ).then((map) => {
      if (!cancelled) setPuNames(new Map(map));
    });
    return () => {
      cancelled = true;
    };
  }, [incidents, token, wardNames]);

  const stats = useMemo(
    () => ({
      total: incidents.length,
      high: incidents.filter((item) => item.severity === "HIGH" || item.severity === "CRITICAL").length,
      escalated: incidents.filter(isEscalated).length,
      resolved: incidents.filter((item) => item.status === "RESOLVED" || item.status === "CLOSED").length,
    }),
    [incidents],
  );

  const visible = incidents.filter((incident) => {
    const severityOk =
      severity === "all" ||
      (severity === "HIGH" ? incident.severity === "HIGH" || incident.severity === "CRITICAL" : incident.severity === severity);
    const statusOk =
      status === "all" ||
      (status === "OPEN"
        ? incident.status === "OPEN" || incident.status === "IN_PROGRESS"
        : status === "ESCALATED"
          ? isEscalated(incident)
          : incident.status === "RESOLVED" || incident.status === "CLOSED");
    return severityOk && statusOk;
  });

  const selected = incidents.find((incident) => incident.id === selectedId) ?? null;

  async function act(action: "resolve" | "progress" | "escalate") {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const updated =
        action === "escalate"
          ? await escalateAdminIncident(token, selected.id, note.trim())
          : await updateAdminIncidentStatus(token, selected.id, action === "resolve" ? "RESOLVED" : "IN_PROGRESS");
      setIncidents((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The incident could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return <Loading label="Loading incidents" />;
  }

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-pageHead">
        <div>
          <h2>Incident management</h2>
          <p>
            {count(stats.high)} high or critical · {count(stats.escalated)} escalated · {count(stats.resolved)} resolved
          </p>
        </div>
        {stats.high > 0 ? (
          <span className="ec-pageHead-aside">
            <span className="ec-alarm">{count(stats.high)} active high-severity</span>
          </span>
        ) : null}
      </div>

      <div className="ec-kpis">
        <Kpi icon="▦" label="Total incidents" value={count(stats.total)} />
        <Kpi icon="⚠" tone="danger" label="High severity" value={count(stats.high)} />
        <Kpi icon="↑" tone="warning" label="Escalated" value={count(stats.escalated)} />
        <Kpi icon="✓" tone="success" label="Resolved" value={count(stats.resolved)} />
      </div>

      <div className="ec-btnRow">
        <div className="ec-chips" role="group" aria-label="Filter by severity">
          {(
            [
              ["all", "All"],
              ["HIGH", "High"],
              ["MEDIUM", "Med"],
              ["LOW", "Low"],
            ] as Array<[SeverityFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="ec-chip"
              aria-pressed={severity === value}
              onClick={() => setSeverity(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ec-chips" role="group" aria-label="Filter by status">
          {(
            [
              ["all", "All"],
              ["OPEN", "Open"],
              ["ESCALATED", "Escalated"],
              ["RESOLVED", "Resolved"],
            ] as Array<[StatusFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="ec-chip"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ec-cols ec-cols--two" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 360px)" }}>
        <Panel title={`${visible.length} incidents`}>
          {visible.length === 0 ? (
            <Empty>
              {incidents.length === 0 ? "No incident has been reported." : "No incident matches these filters."}
            </Empty>
          ) : (
            <div className="ec-rows" style={{ maxHeight: "none" }}>
              {visible.map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  className={`ec-incident ec-incident--${incident.severity}`}
                  aria-selected={incident.id === selectedId}
                  onClick={() => setSelectedId(incident.id)}
                >
                  <span className="ec-incident-head">
                    <span className="ec-incident-type">{words(incident.type)}</span>
                    <Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
                    <span className="ec-incident-right">
                      <span>{clockTime(incident.createdAt)}</span>
                      <Badge tone={isEscalated(incident) ? "warning" : incidentStatusTone(incident.status)}>
                        {isEscalated(incident) ? "Escalated" : words(incident.status)}
                      </Badge>
                    </span>
                  </span>
                  <p className="ec-incident-text">{incident.description}</p>
                  <span className="ec-incident-foot">
                    <span>{nameOf(lgaNames, incident.lgaId)}</span>
                    <span>/ {nameOf(wardNames, incident.wardId)}</span>
                    <span>/ {nameOf(puNames, incident.pollingUnitId)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <div className="ec-detail">
          <Panel title="Incident detail">
            {!selected ? (
              <DetailEmpty icon="⚠">Select an incident to view details and actions.</DetailEmpty>
            ) : (
              <>
                <div className="ec-defs">
                  <Def label="Title">{selected.title}</Def>
                  <Def label="Type">{words(selected.type)}</Def>
                  <Def label="Severity">
                    <Badge tone={severityTone(selected.severity)}>{selected.severity}</Badge>
                  </Def>
                  <Def label="Status">
                    <Badge tone={incidentStatusTone(selected.status)}>{words(selected.status)}</Badge>
                  </Def>
                  <Def label="Reported at">{dayAndTime(selected.createdAt)}</Def>
                  <Def label="LGA">{nameOf(lgaNames, selected.lgaId)}</Def>
                  <Def label="Ward">{nameOf(wardNames, selected.wardId)}</Def>
                  <Def label="Polling unit">{nameOf(puNames, selected.pollingUnitId)}</Def>
                  <Def label="Assigned">{selected.assignedAdminUserId ? "Yes" : "Unassigned"}</Def>
                  {selected.governance ? (
                    <Def label="Review priority">{words(selected.governance.reviewPriority)}</Def>
                  ) : null}
                </div>

                {selected.governance && selected.governance.flags.length > 0 ? (
                  <div className="ec-note" style={{ marginTop: 14 }}>
                    <div className="ec-note-label">Governance flags</div>
                    {selected.governance.flags.map((flag) => (
                      <div key={flag.code} style={{ fontSize: 13 }}>
                        {flag.message}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div style={{ marginTop: 16 }}>
                  <label className="ec-def-key" htmlFor="escalation-note">
                    Escalation note
                  </label>
                  <textarea
                    id="escalation-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Why this needs to go up, in a sentence"
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid var(--ec-line)",
                      background: "var(--ec-surface-2)",
                      color: "var(--ec-text)",
                      fontFamily: "inherit",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div className="ec-btnRow" style={{ marginTop: 12 }}>
                  <Btn
                    variant="danger"
                    disabled={busy || note.trim().length < 3 || isEscalated(selected)}
                    onClick={() => void act("escalate")}
                  >
                    Escalate
                  </Btn>
                  {selected.status === "OPEN" ? (
                    <Btn disabled={busy} onClick={() => void act("progress")}>
                      Mark in progress
                    </Btn>
                  ) : null}
                  {selected.status === "RESOLVED" || selected.status === "CLOSED" ? null : (
                    <Btn variant="primary" disabled={busy} onClick={() => void act("resolve")}>
                      Resolve
                    </Btn>
                  )}
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
