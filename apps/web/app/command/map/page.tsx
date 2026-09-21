"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminMapSummary, AgentActivitySummary } from "@pics-nigeria/shared";
import { fetchAdminAgentActivitySummaries, fetchAdminMapSummary } from "../../../lib/api";
import { GoogleLiveMap } from "../../../components/google-live-map";
import { RasterLiveMap } from "../../../components/raster-live-map";
import { useCommandSession } from "../../../components/command/session";
import { loadLgaNames, loadPollingUnitNames, loadWardNames, nameOf } from "../../../components/command/territory";
import {
  Badge,
  Banner,
  Empty,
  Kpi,
  Loading,
  Panel,
  clockTime,
  count,
  dayAndTime,
  words,
} from "../../../components/command/ui";

const REFRESH_MS = 20_000;

/** A position older than this is a trail, not a location. */
const STALE_AFTER_MS = 15 * 60 * 1000;

type Layer = "all" | "agents" | "incidents";

type MapPoint = {
  id: string;
  kind: "agent" | "incident";
  label: string;
  detail: string;
  timestamp: string | null;
  latitude: number;
  longitude: number;
};

function ageMs(timestamp: string | null): number | null {
  if (!timestamp) return null;
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return null;
  return Date.now() - then;
}

function ageLabel(timestamp: string | null): string {
  const age = ageMs(timestamp);
  if (age === null) return "never";
  const minutes = Math.floor(age / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export default function LiveMapPage() {
  const { token } = useCommandSession();
  const [summary, setSummary] = useState<AdminMapSummary | null>(null);
  const [activity, setActivity] = useState<AgentActivitySummary[]>([]);
  const [layer, setLayer] = useState<Layer>("all");
  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());
  const [puNames, setPuNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextSummary, nextActivity] = await Promise.all([
        fetchAdminMapSummary(token),
        fetchAdminAgentActivitySummaries(token),
      ]);
      setSummary(nextSummary);
      setActivity(nextActivity);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load live positions.");
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
    if (activity.length === 0 || wardNames.size === 0) return;
    let cancelled = false;
    void loadPollingUnitNames(
      token,
      activity.map((entry) => entry.territory.wardId),
    ).then((map) => {
      if (!cancelled) setPuNames(new Map(map));
    });
    return () => {
      cancelled = true;
    };
  }, [activity, token, wardNames]);

  const agentPoints = useMemo<MapPoint[]>(() => {
    if (!summary) return [];
    return summary.activeAgents
      .filter((agent) => agent.latestLatitude !== null && agent.latestLongitude !== null)
      .map((agent) => ({
        id: `agent:${agent.agentUserId}`,
        kind: "agent" as const,
        label: agent.name,
        detail: `${nameOf(puNames, agent.pollingUnitId)} · ${nameOf(lgaNames, agent.territory.lgaId)}`,
        timestamp: agent.latestActivityAt,
        latitude: agent.latestLatitude as number,
        longitude: agent.latestLongitude as number,
      }));
  }, [lgaNames, puNames, summary]);

  const incidentPoints = useMemo<MapPoint[]>(() => {
    if (!summary) return [];
    return summary.incidents
      .filter((incident) => incident.latitude !== null && incident.longitude !== null)
      .map((incident) => ({
        id: `incident:${incident.id}`,
        kind: "incident" as const,
        label: `${words(incident.type)} · ${incident.severity}`,
        detail: `${nameOf(lgaNames, incident.lgaId)} · ${words(incident.status)}`,
        timestamp: incident.createdAt,
        latitude: incident.latitude as number,
        longitude: incident.longitude as number,
      }));
  }, [lgaNames, summary]);

  const points = layer === "agents" ? agentPoints : layer === "incidents" ? incidentPoints : [...agentPoints, ...incidentPoints];

  /** Everyone with a profile, newest fix first, staleness made explicit. */
  const tracked = useMemo(() => {
    return [...activity].sort((left, right) => {
      const leftAge = ageMs(left.latestActivityAt) ?? Number.MAX_SAFE_INTEGER;
      const rightAge = ageMs(right.latestActivityAt) ?? Number.MAX_SAFE_INTEGER;
      return leftAge - rightAge;
    });
  }, [activity]);

  if (!loaded) {
    return <Loading label="Locating the field" />;
  }

  const withFix = agentPoints.length;
  const fresh = activity.filter((entry) => {
    const age = ageMs(entry.latestActivityAt);
    return age !== null && age <= STALE_AFTER_MS;
  }).length;

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-pageHead">
        <div>
          <h2>Live map</h2>
          <p>Agent positions and located incidents, from the pings the field app sends while agents are on duty.</p>
        </div>
      </div>

      <div className="ec-kpis">
        <Kpi icon="◉" tone="success" label="Agents with a fix" value={count(withFix)} />
        <Kpi
          icon="⏱"
          tone="info"
          label="Reporting in the last 15 min"
          value={count(fresh)}
          note={`${count(activity.length)} agents tracked`}
        />
        <Kpi icon="⚠" tone="danger" label="Located incidents" value={count(incidentPoints.length)} />
        <Kpi
          icon="▦"
          tone="warning"
          label="Polling units in scope"
          value={count(summary?.pollingUnits.length)}
        />
      </div>

      <div className="ec-chips" role="group" aria-label="Map layers">
        {(
          [
            ["all", `All (${agentPoints.length + incidentPoints.length})`],
            ["agents", `Agents (${agentPoints.length})`],
            ["incidents", `Incidents (${incidentPoints.length})`],
          ] as Array<[Layer, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="ec-chip"
            aria-pressed={layer === value}
            onClick={() => setLayer(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <Panel title="Positions" meta={`Refreshes every ${REFRESH_MS / 1000}s`}>
        <GoogleLiveMap
          points={points}
          emptyMessage="No live coordinates yet. Positions appear here once agents check in and send location pings."
          fallback={
            <RasterLiveMap
              points={points}
              emptyMessage="No live coordinates yet. Positions appear here once agents check in and send location pings."
            />
          }
        />
        <div className="ec-legend" style={{ marginTop: 12 }}>
          <span className="ec-legend-item">
            <span className="ec-legend-dot" style={{ background: "var(--ec-green)" }} />
            <span className="ec-legend-name">Agents</span>
          </span>
          <span className="ec-legend-item">
            <span className="ec-legend-dot" style={{ background: "var(--ec-red)" }} />
            <span className="ec-legend-name">Incidents</span>
          </span>
        </div>
      </Panel>

      <Panel flush title="Agent tracking" meta={`${count(tracked.length)} agents · freshest first`}>
        {tracked.length === 0 ? (
          <Empty>No agent has reported a position. Tracking begins at the first check-in.</Empty>
        ) : (
          <div className="ec-tableWrap">
            <table className="ec-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>LGA</th>
                  <th>Ward</th>
                  <th>PU</th>
                  <th>Last activity</th>
                  <th>Last seen</th>
                  <th>Age</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {tracked.map((entry) => {
                  const age = ageMs(entry.latestActivityAt);
                  const stale = age === null || age > STALE_AFTER_MS;
                  const hasFix = entry.latestLatitude !== null && entry.latestLongitude !== null;
                  return (
                    <tr key={entry.agentUserId}>
                      <td>{entry.name}</td>
                      <td className="ec-muted">{nameOf(lgaNames, entry.territory.lgaId)}</td>
                      <td className="ec-muted">{nameOf(wardNames, entry.territory.wardId)}</td>
                      <td className="ec-mono ec-muted">{nameOf(puNames, entry.pollingUnitId)}</td>
                      <td>{entry.latestActivityType ? words(entry.latestActivityType) : "—"}</td>
                      <td className="ec-num ec-dim" title={dayAndTime(entry.latestActivityAt)}>
                        {clockTime(entry.latestActivityAt)}
                      </td>
                      <td>
                        <Badge tone={stale ? "warning" : "success"}>{ageLabel(entry.latestActivityAt)}</Badge>
                      </td>
                      <td className="ec-mono ec-muted">
                        {hasFix
                          ? `${(entry.latestLatitude as number).toFixed(4)}, ${(entry.latestLongitude as number).toFixed(4)}`
                          : "no fix"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="ec-dim" style={{ fontSize: 13 }}>
        Positions come from the agent&apos;s own device while the field app is open and on duty, so a stale fix means the
        app is closed or the phone is offline, not that the agent has moved. Polling unit coordinates are not part of the
        loaded INEC reference data, so units themselves are not plotted.
      </p>
    </>
  );
}
