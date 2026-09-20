"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CoverageInsights, EvidenceExplorerSummary, IncidentListItem } from "@pics-nigeria/shared";
import {
  fetchAdminCoverageInsights,
  fetchAdminIncidents,
  fetchCommandCentreMetrics,
  fetchEvidenceExplorer,
  type CommandCentreMetrics,
} from "../../../lib/api";
import { useCommandSession } from "../../../components/command/session";
import { loadLgaNames } from "../../../components/command/territory";
import {
  Badge,
  Banner,
  Empty,
  Kpi,
  Loading,
  Meter,
  PARTY_COLOURS,
  Panel,
  Tile,
  count,
  percent,
  words,
} from "../../../components/command/ui";

type LgaRow = { lgaId: string; lgaName: string; staffed: number; pollingUnits: number };

export default function ReportsPage() {
  const { token } = useCommandSession();
  const [metrics, setMetrics] = useState<CommandCentreMetrics | null>(null);
  const [insights, setInsights] = useState<CoverageInsights | null>(null);
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceExplorerSummary | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const [nextMetrics, nextIncidents, nextEvidence] = await Promise.all([
        fetchCommandCentreMetrics(token),
        fetchAdminIncidents(token),
        fetchEvidenceExplorer(token, { limit: 1 }).then((result) => result.summary),
      ]);
      setMetrics(nextMetrics);
      setIncidents(nextIncidents);
      setEvidence(nextEvidence);
      setGeneratedAt(new Date(nextMetrics.lastUpdated).toLocaleString("en-GB"));
      setError("");
      void fetchAdminCoverageInsights(token)
        .then(setInsights)
        .catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the report.");
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    void loadLgaNames(token)
      .then(setLgaNames)
      .catch(() => undefined);
  }, [token]);

  const topLgas = useMemo<LgaRow[]>(() => {
    if (!insights) return [];
    const rows = new Map<string, LgaRow>();
    for (const ward of insights.wards) {
      const row = rows.get(ward.lgaId) ?? {
        lgaId: ward.lgaId,
        lgaName: ward.lgaName || lgaNames.get(ward.lgaId) || ward.lgaId,
        staffed: 0,
        pollingUnits: 0,
      };
      row.pollingUnits += ward.pollingUnitCount;
      row.staffed += ward.pollingUnitCount - ward.pollingUnitsWithoutAgents;
      rows.set(ward.lgaId, row);
    }
    return Array.from(rows.values())
      .sort((left, right) => percent(right.staffed, right.pollingUnits) - percent(left.staffed, left.pollingUnits))
      .slice(0, 5);
  }, [insights, lgaNames]);

  const incidentsByType = useMemo(() => {
    const tally = new Map<string, number>();
    for (const incident of incidents) {
      tally.set(incident.type, (tally.get(incident.type) ?? 0) + 1);
    }
    return Array.from(tally.entries()).sort((left, right) => right[1] - left[1]);
  }, [incidents]);

  if (!loaded) {
    return <Loading label="Assembling the report" />;
  }

  const ops = metrics?.operationalMetrics;
  const pus = ops?.pusReporting;
  const results = ops?.resultsVerification;
  const agents = ops?.agentStatus;
  const incidentStats = ops?.incidentTracking;
  const activeAgents = agents ? agents.total - (agents.byState.absent ?? 0) : 0;
  const maxIncidentType = incidentsByType[0]?.[1] ?? 1;
  const tally = Object.entries(metrics?.partyTally ?? {}).sort((left, right) => right[1].votes - left[1].votes);
  const totalVotes = tally.reduce((sum, [, entry]) => sum + entry.votes, 0);

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-pageHead">
        <div>
          <h2>Reports &amp; analytics</h2>
          <p>Operational summary{generatedAt ? ` as of ${generatedAt}` : ""}. Unofficial, for internal use only.</p>
        </div>
        <span className="ec-pageHead-aside">
          <span className="ec-stamp">Unofficial · not for publication</span>
        </span>
      </div>

      <div className="ec-kpis">
        <Kpi
          icon="◎"
          tone="success"
          label="Field coverage"
          value={`${pus?.percentageCompleted ?? 0}%`}
          note={pus ? `${count(pus.reporting)} of ${count(pus.total)} PUs reporting` : null}
        />
        <Kpi
          icon="✓"
          tone="info"
          label="Verification rate"
          value={`${results?.percentageVerified ?? 0}%`}
          note={results ? `${count(results.verified)} results verified` : null}
        />
        <Kpi
          icon="☖"
          tone="warning"
          label="Agent activity rate"
          value={`${agents && agents.total > 0 ? percent(activeAgents, agents.total) : 0}%`}
          note={agents ? `${count(agents.byState.absent ?? 0)} absent or unreachable` : null}
        />
        <Kpi
          icon="⚠"
          tone="violet"
          label="Incident resolve rate"
          value={`${incidentStats && incidentStats.total > 0 ? percent(incidentStats.resolved, incidentStats.total) : 0}%`}
          note={
            incidentStats ? `${count(Math.max(incidentStats.total - incidentStats.resolved, 0))} still open` : null
          }
        />
      </div>

      <div className="ec-cols ec-cols--two">
        <Panel title="Campaign tally — verified PUs">
          {tally.length === 0 ? (
            <Empty>No approved report carries vote entries yet.</Empty>
          ) : (
            <>
              {tally.map(([slug, entry], index) => (
                <div key={slug} style={{ marginBottom: 14 }}>
                  <div className="ec-metricRow" style={{ borderBottom: 0, paddingBottom: 4 }}>
                    <span className="ec-legend-dot" style={{ background: PARTY_COLOURS[index % PARTY_COLOURS.length] }} />
                    <span className="ec-metricRow-label">{words(slug).toUpperCase()}</span>
                    <span className="ec-metricRow-value">{count(entry.votes)}</span>
                    <span className="ec-legend-pct" style={{ marginLeft: 10 }}>
                      {entry.percent}%
                    </span>
                  </div>
                  <div className="ec-meter">
                    <div
                      className="ec-meter-fill"
                      style={{
                        width: `${entry.percent}%`,
                        background: PARTY_COLOURS[index % PARTY_COLOURS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="ec-metricRow">
                <span className="ec-metricRow-label">Total counted votes</span>
                <span className="ec-metricRow-value">{count(totalVotes)}</span>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Top LGAs by staffing">
          {topLgas.length === 0 ? (
            <Empty>Coverage figures are not available.</Empty>
          ) : (
            topLgas.map((row, index) => (
              <div key={row.lgaId} style={{ marginBottom: 14 }}>
                <div className="ec-metricRow" style={{ borderBottom: 0, paddingBottom: 4 }}>
                  <span className="ec-dim ec-mono">#{index + 1}</span>
                  <span className="ec-metricRow-label" style={{ marginLeft: 10 }}>
                    {row.lgaName}
                  </span>
                  <span className="ec-metricRow-value">
                    {count(row.staffed)}/{count(row.pollingUnits)}
                  </span>
                  <span className="ec-legend-pct" style={{ marginLeft: 10 }}>
                    {percent(row.staffed, row.pollingUnits)}%
                  </span>
                </div>
                <Meter value={percent(row.staffed, row.pollingUnits)} />
              </div>
            ))
          )}
        </Panel>
      </div>

      <div className="ec-cols ec-cols--two">
        <Panel title="Incident breakdown">
          {incidentsByType.length === 0 ? (
            <Empty>No incident has been reported.</Empty>
          ) : (
            incidentsByType.map(([type, total]) => (
              <div key={type} style={{ marginBottom: 12 }}>
                <div className="ec-metricRow" style={{ borderBottom: 0, paddingBottom: 4 }}>
                  <span className="ec-metricRow-label">{words(type)}</span>
                  <span className="ec-metricRow-value">{count(total)}</span>
                </div>
                <Meter value={percent(total, maxIncidentType)} tone="danger" />
              </div>
            ))
          )}
        </Panel>

        <Panel title="Evidence vault summary">
          <div className="ec-tiles">
            <Tile value={count(evidence?.total)} label="Total documents" />
            <Tile
              value={count(evidence?.byClassification?.RESULT_SHEET ?? 0)}
              label="Result sheets"
              tone="info"
            />
            <Tile value={count(evidence?.byReviewStatus?.VERIFIED ?? 0)} label="Verified docs" tone="success" />
            <Tile
              value={count((evidence?.byReviewStatus?.SUBMITTED ?? 0) + (evidence?.byReviewStatus?.UNDER_REVIEW ?? 0))}
              label="Pending review"
              tone="warning"
            />
          </div>
          <div className="ec-note" style={{ marginTop: 14 }}>
            <div className="ec-note-label">Custody</div>
            <div style={{ fontSize: 13 }}>
              Originals are immutable and held in private object storage. Every access is signed and audited.
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Exports" meta="What the platform can produce today">
        <div className="ec-exportGrid">
          <article className="ec-export">
            <div className="ec-export-head">
              <span className="ec-export-title">Evidence manifest</span>
              <Badge tone="success">Available</Badge>
            </div>
            <p className="ec-export-desc">
              A controlled, hashed manifest of selected evidence, produced and audited from the Evidence page of the
              admin console.
            </p>
          </article>
          <article className="ec-export">
            <div className="ec-export-head">
              <span className="ec-export-title">Member contact export</span>
              <Badge tone="success">Available</Badge>
            </div>
            <p className="ec-export-desc">
              A CSV of member contacts, restricted to the super admin and written to the audit log on every download.
            </p>
          </article>
          <article className="ec-export">
            <div className="ec-export-head">
              <span className="ec-export-title">Coverage, results and incident reports</span>
              <Badge tone="warning">Not built</Badge>
            </div>
            <p className="ec-export-desc">
              The reference design shows PDF and CSV exports for coverage, results, agents, incidents and the audit log.
              No endpoint produces these yet, so no button is offered that would do nothing.
            </p>
          </article>
        </div>
      </Panel>
    </>
  );
}
