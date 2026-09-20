'use client';

import { useEffect, useState } from 'react';
import type { AuthUserProfile } from '@pics-nigeria/shared';
import { KpiCard } from '../../../../components/ui/kpi-card';
import { StatusFilterTabs } from '../../../../components/ui/status-filter-tabs';
import { AdminNav } from '../../../../components/admin-nav';
import { PageHead, Panel, StateView, formatCount } from '../../../../components/ui';
import {
  ApiError,
  fetchCommandCentreMetrics,
  fetchCommandCentreSystemStatus,
  fetchCurrentUser,
  type CommandCentreMetrics,
  type CommandCentreSystemStatus,
} from '../../../../lib/api';
import { clearSession, readSession } from '../../../../lib/session';

/** Mirrors the API guard on /dashboard/metrics; the API stays the authority. */
const COMMAND_CENTRE_ROLES = new Set(['SUPER_ADMIN', 'STATE_OFFICER', 'ADMIN']);

const REFRESH_INTERVAL_MS = 30_000;

const AGENT_STATE_LABELS: Array<{ key: keyof CommandCentreMetrics['operationalMetrics']['agentStatus']['byState']; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'voting_underway', label: 'Voting underway' },
  { key: 'counting', label: 'Counting' },
  { key: 'result_submitted', label: 'Result submitted' },
  { key: 'verified', label: 'Verified' },
  { key: 'absent', label: 'Absent' },
  { key: 'incident', label: 'Incident' },
];

const TALLY_COLOURS = ['#00d084', '#42a5f5', '#ffa726', '#ab47bc', '#ef5350', '#26c6da', '#8d6e63', '#9e9e9e'];

type CommandCentreData = {
  user: AuthUserProfile;
  metrics: CommandCentreMetrics;
  systemStatus: CommandCentreSystemStatus;
};

async function loadCommandCentre(token: string): Promise<CommandCentreData> {
  const user = await fetchCurrentUser(token);
  if (!COMMAND_CENTRE_ROLES.has(user.role)) {
    throw new ApiError('The Command Centre is available to state command roles only.', 403);
  }

  const [metrics, systemStatus] = await Promise.all([
    fetchCommandCentreMetrics(token),
    fetchCommandCentreSystemStatus(token),
  ]);

  return { user, metrics, systemStatus };
}

function percentOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function tallyLabel(slug: string): string {
  return slug.replace(/_/g, ' ').toUpperCase();
}

export default function CommandCentrePage() {
  const [data, setData] = useState<CommandCentreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultFilter, setResultFilter] = useState('all');

  useEffect(() => {
    const token = readSession();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    let cancelled = false;

    async function refresh(initial: boolean) {
      try {
        const next = await loadCommandCentre(token!);
        if (!cancelled) {
          setData(next);
          setError('');
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          window.location.href = '/login';
          return;
        }
        // Keep the last good figures on a failed refresh; only a first load shows the error view.
        if (initial) {
          setError(err instanceof Error ? err.message : 'Failed to load the Command Centre');
        }
      } finally {
        if (initial && !cancelled) {
          setLoading(false);
        }
      }
    }

    void refresh(true);
    const timer = window.setInterval(() => void refresh(false), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) {
    return (
      <main className="console-shell">
        <PageHead title="Command Centre" />
        <StateView kind="loading" title="Loading operational dashboard…" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="console-shell">
        <PageHead title="Command Centre" />
        <StateView kind="error" title="Unable to load the Command Centre" detail={error} />
      </main>
    );
  }

  const { pusReporting, resultsVerification, incidentTracking, agentStatus, evidence } =
    data.metrics.operationalMetrics;
  const { systemStatus } = data;
  const notReporting = Math.max(pusReporting.total - pusReporting.reporting, 0);
  const activeIncidents = Math.max(incidentTracking.total - incidentTracking.resolved, 0);

  const tallyEntries = Object.entries(data.metrics.partyTally).sort((left, right) => right[1].votes - left[1].votes);
  const tallyTotal = tallyEntries.reduce((sum, [, entry]) => sum + entry.votes, 0);

  const resultCounts: Record<string, number> = {
    all: resultsVerification.total,
    pending: resultsVerification.pending,
    verified: resultsVerification.verified,
    flagged: resultsVerification.flagged,
  };

  return (
    <main className="console-shell">
      <PageHead
        title="Command Centre"
        lead="Ogun State · state-wide operational picture"
        actions={
          <span className="live-indicator">
            ● LIVE · updated {new Date(data.metrics.lastUpdated).toLocaleTimeString()}
          </span>
        }
      />

      <AdminNav role={data.user.role} />

      <section className="kpi-section">
        <KpiCard
          label="PUs Reporting"
          value={`${formatCount(pusReporting.reporting)}/${formatCount(pusReporting.total)}`}
          percentage={pusReporting.percentageCompleted}
          percentageLabel="coverage"
          accent="success"
        />
        <KpiCard
          label="Results Verified"
          value={formatCount(resultsVerification.verified)}
          percentage={percentOf(resultsVerification.verified, pusReporting.total)}
          percentageLabel="of all PUs"
          accent="info"
        />
        <KpiCard
          label="Pending Verification"
          value={formatCount(resultsVerification.pending)}
          percentage={resultsVerification.total > 0 ? percentOf(resultsVerification.pending, resultsVerification.total) : undefined}
          percentageLabel={resultsVerification.total > 0 ? 'of submitted reports' : 'no reports submitted yet'}
          accent="warning"
        />
        <KpiCard
          label="Active Incidents"
          value={formatCount(activeIncidents)}
          percentageLabel={`${formatCount(incidentTracking.openHigh)} high or critical · ${formatCount(incidentTracking.escalated)} escalated`}
          accent="danger"
        />
      </section>

      <div className="content-grid">
        <div className="main-column">
          <Panel title="Campaign Tally" meta="Approved reports only">
            {tallyEntries.length === 0 ? (
              <p className="muted">No approved election day reports carry vote entries yet.</p>
            ) : (
              <div className="party-tally">
                <div className="party-bar">
                  {tallyEntries.map(([slug, entry], index) => (
                    <div
                      key={slug}
                      className="bar-segment"
                      title={`${tallyLabel(slug)} ${entry.percent}%`}
                      style={{ width: `${entry.percent}%`, backgroundColor: TALLY_COLOURS[index % TALLY_COLOURS.length] }}
                    />
                  ))}
                </div>
                <div className="party-stats">
                  {tallyEntries.map(([slug, entry], index) => (
                    <div className="stat-item" key={slug}>
                      <span className="stat-dot" style={{ backgroundColor: TALLY_COLOURS[index % TALLY_COLOURS.length] }} />
                      <span className="stat-label">{tallyLabel(slug)}</span>
                      <span className="stat-value">{formatCount(entry.votes)}</span>
                      <span className="stat-pct">{entry.percent}%</span>
                    </div>
                  ))}
                  <div className="stat-item">
                    <span className="stat-dot" style={{ backgroundColor: 'transparent' }} />
                    <span className="stat-label">Total votes</span>
                    <span className="stat-value">{formatCount(tallyTotal)}</span>
                    <span className="stat-pct">100%</span>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Election Day Reports" meta={`${formatCount(resultsVerification.total)} submitted`}>
            <StatusFilterTabs
              statuses={[
                { id: 'all', label: 'ALL', count: resultCounts.all },
                { id: 'pending', label: 'PENDING', count: resultCounts.pending, accent: 'warning' },
                { id: 'verified', label: 'VERIFIED', count: resultCounts.verified, accent: 'success' },
                { id: 'flagged', label: 'REJECTED', count: resultCounts.flagged, accent: 'danger' },
              ]}
              active={resultFilter}
              onSelect={setResultFilter}
            />
            <p className="muted">
              {formatCount(resultCounts[resultFilter] ?? 0)} report{resultCounts[resultFilter] === 1 ? '' : 's'} in this
              state. Open <a href="/admin/election-reports">Election Reports</a> to review them.
            </p>
          </Panel>

          <Panel title="Agent Status" meta={`${formatCount(agentStatus.total)} agents`}>
            <div className="agent-states">
              {AGENT_STATE_LABELS.map(({ key, label }) => (
                <div className="reporting-stat" key={key}>
                  <span className="stat-number">{formatCount(agentStatus.byState[key] ?? 0)}</span>
                  <span className="stat-label">{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="sidebar">
          <Panel title="System Status">
            <div className="system-metrics">
              <div className="metric-row">
                <span className="metric-label">Active agent accounts</span>
                <span className="metric-value">{formatCount(systemStatus.activeAgentConnections)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Submissions in the last minute</span>
                <span className="metric-value">{formatCount(systemStatus.submissionsPerMinute)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Server load</span>
                <span className="metric-value">
                  {systemStatus.serverLoadPercent === null ? 'not measured' : `${systemStatus.serverLoadPercent}%`}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Evidence uploads</span>
                <span className="metric-value">{formatCount(systemStatus.evidenceUploads)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Reporting Status">
            <div className="reporting-stats">
              <div className="reporting-stat">
                <span className="stat-number">{formatCount(notReporting)}</span>
                <span className="stat-label">Not reporting</span>
              </div>
              <div className="reporting-stat">
                <span className="stat-number">{formatCount(resultsVerification.pending)}</span>
                <span className="stat-label">Pending verification</span>
              </div>
              <div className="reporting-stat">
                <span className="stat-number">{formatCount(resultsVerification.verified)}</span>
                <span className="stat-label">Verified</span>
              </div>
            </div>
          </Panel>

          <Panel title="Evidence">
            <div className="system-metrics">
              <div className="metric-row">
                <span className="metric-label">Result sheets</span>
                <span className="metric-value">{formatCount(evidence.resultSheets)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Incident photos</span>
                <span className="metric-value">{formatCount(evidence.incidentImages)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Verified</span>
                <span className="metric-value">{formatCount(evidence.verified)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Awaiting review</span>
                <span className="metric-value">{formatCount(evidence.pending)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Disputed or needs clarification</span>
                <span className="metric-value">{formatCount(evidence.flagged)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <style jsx>{`
        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #00d084;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .muted {
          margin: 12px 0 0;
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .kpi-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .main-column,
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .party-tally {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .party-bar {
          display: flex;
          width: 100%;
          height: 24px;
          overflow: hidden;
          border-radius: 4px;
          background-color: var(--color-bg-tertiary);
        }

        .bar-segment {
          display: inline-block;
          height: 24px;
          transition: width 0.3s;
        }

        .party-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .stat-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .stat-item .stat-label {
          flex: 1;
          color: var(--color-text-primary);
        }

        .stat-value {
          font-weight: 600;
          color: var(--color-text-primary);
          min-width: 80px;
          text-align: right;
        }

        .stat-pct {
          color: var(--color-text-secondary);
          font-size: 12px;
          min-width: 40px;
          text-align: right;
        }

        .system-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--color-border-default);
        }

        .metric-row:last-child {
          border-bottom: none;
        }

        .metric-label {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .metric-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .reporting-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .agent-states {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .reporting-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background-color: var(--color-bg-tertiary);
          border-radius: 8px;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .reporting-stat .stat-label {
          font-size: 12px;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .kpi-section {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .kpi-section {
            grid-template-columns: 1fr;
          }

          .stat-item {
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}
