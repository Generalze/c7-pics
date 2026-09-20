"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AgentActivitySummary,
  CoverageInsights,
  ElectionDayReportItem,
  IncidentListItem,
} from "@pics-nigeria/shared";
import {
  fetchAdminAgentActivitySummaries,
  fetchAdminElectionDayReports,
  fetchAdminIncidents,
  fetchCommandCentreMetrics,
  fetchCommandCentreSystemStatus,
  type CommandCentreMetrics,
  type CommandCentreSystemStatus,
} from "../../lib/api";
import { useCommandSession } from "../../components/command/session";
import { loadLgaNames, loadPollingUnitNames, loadWardNames, nameOf } from "../../components/command/territory";
import {
  Badge,
  Banner,
  Empty,
  Kpi,
  Loading,
  MetricRow,
  PARTY_COLOURS,
  Panel,
  Tabs,
  Tile,
  clockTime,
  count,
  percent,
  reportStatusTone,
  severityTone,
  words,
} from "../../components/command/ui";

const REFRESH_MS = 30_000;

type CoverageMode = "coverage" | "verified" | "total";
type FeedTab = "results" | "incidents";

type LgaCoverageRow = {
  lgaId: string;
  lgaName: string;
  pollingUnits: number;
  withAgents: number;
  withoutRecentActivity: number;
  openIncidents: number;
};

/** Coverage insights come per ward; the console reads per LGA. */
function rollUpByLga(insights: CoverageInsights | null): LgaCoverageRow[] {
  if (!insights) return [];
  const rows = new Map<string, LgaCoverageRow>();
  for (const ward of insights.wards) {
    const row = rows.get(ward.lgaId) ?? {
      lgaId: ward.lgaId,
      lgaName: ward.lgaName,
      pollingUnits: 0,
      withAgents: 0,
      withoutRecentActivity: 0,
      openIncidents: 0,
    };
    row.pollingUnits += ward.pollingUnitCount;
    row.withAgents += ward.pollingUnitCount - ward.pollingUnitsWithoutAgents;
    row.withoutRecentActivity += ward.pollingUnitsWithoutRecentActivity;
    row.openIncidents += ward.openIncidentCount;
    rows.set(ward.lgaId, row);
  }
  return Array.from(rows.values()).sort((left, right) => left.lgaName.localeCompare(right.lgaName));
}

export default function CommandCentrePage() {
  const { token } = useCommandSession();
  const [metrics, setMetrics] = useState<CommandCentreMetrics | null>(null);
  const [system, setSystem] = useState<CommandCentreSystemStatus | null>(null);
  const [insights, setInsights] = useState<CoverageInsights | null>(null);
  const [reports, setReports] = useState<ElectionDayReportItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [activity, setActivity] = useState<AgentActivitySummary[]>([]);
  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());
  const [puNames, setPuNames] = useState<Map<string, string>>(new Map());
  const [coverageMode, setCoverageMode] = useState<CoverageMode>("coverage");
  const [feedTab, setFeedTab] = useState<FeedTab>("results");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextMetrics, nextSystem, nextReports, nextIncidents, nextActivity] = await Promise.all([
        fetchCommandCentreMetrics(token),
        fetchCommandCentreSystemStatus(token),
        fetchAdminElectionDayReports(token),
        fetchAdminIncidents(token),
        fetchAdminAgentActivitySummaries(token),
      ]);
      setMetrics(nextMetrics);
      setSystem(nextSystem);
      setReports(nextReports);
      setIncidents(nextIncidents);
      setActivity(nextActivity);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the command centre.");
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Reference names and coverage are slow-moving; they load once, beside the
  // fast-refreshing operational figures.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [lgas, wards] = await Promise.all([
        loadLgaNames(token).catch(() => new Map<string, string>()),
        loadWardNames(token).catch(() => new Map<string, string>()),
      ]);
      if (cancelled) return;
      setLgaNames(lgas);
      setWardNames(wards);
      try {
        const { fetchAdminCoverageInsights } = await import("../../lib/api");
        const nextInsights = await fetchAdminCoverageInsights(token);
        if (!cancelled) setInsights(nextInsights);
      } catch {
        // Coverage is one panel; the rest of the console stands without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Polling unit names only for the rows actually on screen.
  useEffect(() => {
    const wardIds = [
      ...reports.slice(0, 10).map((report) => report.territory.wardId),
      ...incidents.slice(0, 10).map((incident) => incident.wardId),
    ];
    if (wardIds.filter(Boolean).length === 0 || wardNames.size === 0) return;
    let cancelled = false;
    void loadPollingUnitNames(token, wardIds).then((map) => {
      if (!cancelled) setPuNames(new Map(map));
    });
    return () => {
      cancelled = true;
    };
  }, [incidents, reports, token, wardNames]);

  const lgaRows = useMemo(() => rollUpByLga(insights), [insights]);
  const tally = useMemo(
    () => Object.entries(metrics?.partyTally ?? {}).sort((left, right) => right[1].votes - left[1].votes),
    [metrics],
  );
  const totalVotes = tally.reduce((sum, [, entry]) => sum + entry.votes, 0);

  if (!loaded) {
    return <Loading label="Reading the field" />;
  }

  const ops = metrics?.operationalMetrics;
  const pus = ops?.pusReporting;
  const results = ops?.resultsVerification;
  const incidentStats = ops?.incidentTracking;
  const notReporting = pus ? Math.max(pus.total - pus.reporting, 0) : 0;
  const activeIncidents = incidentStats ? Math.max(incidentStats.total - incidentStats.resolved, 0) : 0;

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-kpis">
        <Kpi
          icon="✓"
          tone="success"
          label="PUs reporting"
          value={pus ? `${count(pus.reporting)}/${count(pus.total)}` : "—"}
          note={pus ? `${pus.percentageCompleted}% coverage` : null}
        />
        <Kpi
          icon="▤"
          tone="info"
          label="Results verified"
          value={count(results?.verified)}
          note={pus && results ? `${percent(results.verified, pus.total)}% of all PUs` : null}
        />
        <Kpi
          icon="◷"
          tone="warning"
          label="Pending verification"
          value={count(results?.pending)}
          note={lgaRows.length > 0 ? `across ${lgaRows.length} LGAs` : null}
        />
        <Kpi
          icon="⚠"
          tone="danger"
          label="Active incidents"
          value={count(activeIncidents)}
          note={
            incidentStats
              ? `${count(incidentStats.openHigh)} high or critical · ${count(incidentStats.resolved)} resolved`
              : null
          }
        />
      </div>

      <Panel
        title="Campaign tally — verified PUs only"
        meta={<span className="ec-stamp">Unofficial · internal use</span>}
      >
        {tally.length === 0 ? (
          <Empty>No approved election-day report carries vote entries yet.</Empty>
        ) : (
          <>
            <div className="ec-tally">
              {tally.map(([slug, entry], index) => (
                <span
                  key={slug}
                  className="ec-tally-seg"
                  style={{ width: `${entry.percent}%`, background: PARTY_COLOURS[index % PARTY_COLOURS.length] }}
                  title={`${words(slug).toUpperCase()} ${entry.percent}%`}
                />
              ))}
            </div>
            <div className="ec-legend">
              {tally.map(([slug, entry], index) => (
                <span className="ec-legend-item" key={slug}>
                  <span
                    className="ec-legend-dot"
                    style={{ background: PARTY_COLOURS[index % PARTY_COLOURS.length] }}
                  />
                  <span className="ec-legend-name">{words(slug).toUpperCase()}</span>
                  <span className="ec-legend-value">{count(entry.votes)}</span>
                  <span className="ec-legend-pct">{entry.percent}%</span>
                </span>
              ))}
              <span className="ec-legend-item">
                <span className="ec-legend-name">TOTAL</span>
                <span className="ec-legend-value">{count(totalVotes)}</span>
              </span>
            </div>
          </>
        )}
      </Panel>

      <div className="ec-cols">
        <Panel title="LGA coverage" meta={lgaRows.length > 0 ? `${lgaRows.length} LGAs` : undefined}>
          <div style={{ marginBottom: 14 }}>
            <div className="ec-chips" role="group" aria-label="Coverage measure">
              {(
                [
                  ["coverage", "Coverage"],
                  ["verified", "Staffed"],
                  ["total", "Total"],
                ] as Array<[CoverageMode, string]>
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className="ec-chip"
                  aria-pressed={coverageMode === mode}
                  onClick={() => setCoverageMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {lgaRows.length === 0 ? (
            <Empty>Coverage figures are not available.</Empty>
          ) : (
            <div className="ec-rows">
              {lgaRows.map((row) => {
                const staffed = percent(row.withAgents, row.pollingUnits);
                const active = percent(row.pollingUnits - row.withoutRecentActivity, row.pollingUnits);
                const value = coverageMode === "total" ? row.pollingUnits : coverageMode === "verified" ? staffed : active;
                const meter = coverageMode === "total" ? 100 : value;
                return (
                  <div className="ec-row" key={row.lgaId}>
                    <div className="ec-row-head">
                      <span className="ec-row-name">{row.lgaName}</span>
                      <span className="ec-row-stat">
                        {coverageMode === "total"
                          ? `${count(row.pollingUnits)} PUs`
                          : `${count(coverageMode === "verified" ? row.withAgents : row.pollingUnits - row.withoutRecentActivity)}/${count(row.pollingUnits)}`}
                        {coverageMode === "total" ? "" : ` · ${value}%`}
                      </span>
                    </div>
                    <div className="ec-meter">
                      <div
                        className={`ec-meter-fill${meter < 50 ? " ec-meter-fill--danger" : meter < 80 ? " ec-meter-fill--warning" : ""}`}
                        style={{ width: `${meter}%` }}
                      />
                    </div>
                    <div className="ec-row-foot">
                      <span>Staffed {staffed}%</span>
                      <span>{count(row.openIncidents)} open incidents</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          flush
          actions={
            <Tabs
              label="Live feed"
              value={feedTab}
              onChange={setFeedTab}
              options={[
                { value: "results", label: "Live results" },
                { value: "incidents", label: "Incidents", badge: activeIncidents || undefined },
              ]}
            />
          }
        >
          {feedTab === "results" ? (
            reports.length === 0 ? (
              <Empty>No election-day report has been submitted yet.</Empty>
            ) : (
              <div className="ec-tableWrap">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>LGA</th>
                      <th>Ward</th>
                      <th>PU</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(0, 10).map((report) => {
                      const votes = report.voteEntries.reduce((sum, entry) => sum + entry.votes, 0);
                      return (
                        <tr key={report.id}>
                          <td className="ec-num ec-dim">{clockTime(report.createdAt)}</td>
                          <td>{nameOf(lgaNames, report.territory.lgaId)}</td>
                          <td className="ec-muted">{nameOf(wardNames, report.territory.wardId)}</td>
                          <td className="ec-mono ec-muted">{nameOf(puNames, report.territory.pollingUnitId)}</td>
                          <td className="ec-num ec-num--lead">{count(votes)}</td>
                          <td>
                            <Badge tone={reportStatusTone(report.status)}>{words(report.status)}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : incidents.length === 0 ? (
            <Empty>No incident has been reported.</Empty>
          ) : (
            <div className="ec-tableWrap">
              <table className="ec-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>LGA</th>
                    <th>PU</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 10).map((incident) => (
                    <tr key={incident.id}>
                      <td className="ec-num ec-dim">{clockTime(incident.createdAt)}</td>
                      <td>{words(incident.type)}</td>
                      <td className="ec-muted">{nameOf(lgaNames, incident.lgaId)}</td>
                      <td className="ec-mono ec-muted">{nameOf(puNames, incident.pollingUnitId)}</td>
                      <td>
                        <Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
                      </td>
                      <td>
                        <Badge tone={incident.status === "OPEN" ? "danger" : "neutral"}>{words(incident.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="ec-stack">
          <Panel title="System status">
            <MetricRow
              label="Active agent accounts"
              value={count(system?.activeAgentConnections)}
              meter={system && ops ? percent(system.activeAgentConnections, Math.max(ops.agentStatus.total, 1)) : 0}
            />
            <MetricRow label="Submissions / min" value={count(system?.submissionsPerMinute)} />
            <MetricRow
              label="Server load"
              value={system?.serverLoadPercent === null || system === null ? "not measured" : `${system.serverLoadPercent}%`}
            />
            <MetricRow label="Evidence uploads" value={count(system?.evidenceUploads)} />
          </Panel>

          <Panel title="Reporting status">
            <div className="ec-tiles">
              <Tile value={count(notReporting)} label="Not reporting" />
              <Tile value={count(pus?.reporting)} label="Reporting" tone="info" />
              <Tile value={count(results?.pending)} label="Pending ver" tone="warning" />
              <Tile value={count(results?.verified)} label="Verified" tone="success" />
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Agent activity feed"
        meta={`Real-time · ${count(ops?.agentStatus.total)} agents`}
      >
        {activity.length === 0 ? (
          <Empty>No agent activity has been recorded.</Empty>
        ) : (
          <div className="ec-feed">
            {activity.slice(0, 20).map((entry) => (
              <div className="ec-feedCard" key={entry.agentUserId}>
                <div className="ec-feedCard-head">
                  <span className="ec-feedCard-time">{clockTime(entry.latestActivityAt)}</span>
                  <Badge tone={entry.latestActivityType === "CHECK_OUT" ? "neutral" : "info"}>
                    {entry.latestActivityType ? words(entry.latestActivityType) : "No activity"}
                  </Badge>
                </div>
                <div className="ec-feedCard-name">{entry.name}</div>
                <div className="ec-feedCard-meta">
                  {nameOf(puNames, entry.pollingUnitId)} · {nameOf(lgaNames, entry.territory.lgaId)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
