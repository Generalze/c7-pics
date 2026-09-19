'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusFilterTabs } from '@/components/ui/status-filter-tabs';
import { IncidentCard } from '@/components/ui/incident-card';
import { AdminNav } from '@/components/admin-nav';
import {
  DataTable,
  PageHead,
  Panel,
  PanelGrid,
  StateView,
  formatCount,
} from '@/components/ui';
import { fetchCurrentUser, fetchAdminSummary } from '@/lib/api';

interface CommandCentreData {
  coverage: number;
  pusReporting: number;
  totalPus: number;
  resultsVerified: number;
  resultsPending: number;
  activeIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  systemStatus: {
    activeConnections: number;
    submissionsPerMinute: number;
    serverLoadPercent: number;
    evidenceUploads: number;
  };
}

export default function CommandCentrePage() {
  const [data, setData] = useState<CommandCentreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    loadData(token);
  }, []);

  async function loadData(token: string) {
    try {
      const [user, summary] = await Promise.all([
        fetchCurrentUser(token),
        fetchAdminSummary(token),
      ]);

      // Mock data for now - will integrate with real API
      setData({
        coverage: 78,
        pusReporting: 2063,
        totalPus: 2074,
        resultsVerified: 1794,
        resultsPending: 289,
        activeIncidents: 3,
        openIncidents: 5,
        resolvedIncidents: 3,
        systemStatus: {
          activeConnections: 14,
          submissionsPerMinute: 34,
          serverLoadPercent: 42,
          evidenceUploads: 18,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

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
        <StateView kind="error" title="Unable to load dashboard" detail={error} />
      </main>
    );
  }

  return (
    <main className="console-shell">
      <PageHead
        title="Command Centre"
        lead="Ogun State · 2027 Governorship"
        actions={<span className="live-indicator">● LIVE OPS</span>}
      />

      <AdminNav role="ADMIN" />

      {/* KPI Row */}
      <section className="kpi-section">
        <KpiCard
          label="PUS Reporting"
          value={`${formatCount(data.pusReporting)}/${formatCount(data.totalPus)}`}
          percentage={data.coverage}
          percentageLabel="coverage"
          accent="success"
        />
        <KpiCard
          label="Results Verified"
          value={formatCount(data.resultsVerified)}
          percentage={Math.round((data.resultsVerified / data.totalPus) * 100)}
          percentageLabel="of all PUs"
          accent="info"
        />
        <KpiCard
          label="Pending Verification"
          value={formatCount(data.resultsPending)}
          percentageLabel={`across ${Math.ceil(data.resultsPending / 20)} LGAs`}
          accent="warning"
        />
        <KpiCard
          label="Active Incidents"
          value={data.activeIncidents}
          trend="up"
          trendPercent={0}
          accent="danger"
        />
      </section>

      {/* Main Content */}
      <div className="content-grid">
        <div className="main-column">
          {/* Campaign Tally */}
          <Panel title="Campaign Tally — Verified PUs Only">
            <div className="party-tally">
              <div className="party-bar">
                <div className="bar-segment ndc" style={{ width: '51%' }} />
                <div className="bar-segment apc" style={{ width: '39%' }} />
                <div className="bar-segment pdp" style={{ width: '10%' }} />
              </div>
              <div className="party-stats">
                <div className="stat-item">
                  <span className="stat-dot ndc" />
                  <span className="stat-label">NDC</span>
                  <span className="stat-value">9,964</span>
                  <span className="stat-pct">51%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-dot apc" />
                  <span className="stat-label">APC</span>
                  <span className="stat-value">7,591</span>
                  <span className="stat-pct">39%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-dot pdp" />
                  <span className="stat-label">PDP</span>
                  <span className="stat-value">1,878</span>
                  <span className="stat-pct">10%</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Live Results */}
          <Panel title="Live Results" subtitle="10 Most Recent">
            <StatusFilterTabs
              statuses={[
                { id: 'all', label: 'ALL', count: 10 },
                { id: 'pending', label: 'PENDING', count: 4 },
                { id: 'verified', label: 'VERIFIED', count: 5 },
                { id: 'flagged', label: 'FLAGGED', count: 1 },
              ]}
              active="all"
              onSelect={(id) => console.log('Filter:', id)}
            />
            {/* Table would go here */}
            <div style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
              Results table integration pending
            </div>
          </Panel>
        </div>

        <div className="sidebar">
          {/* System Status */}
          <Panel title="System Status">
            <div className="system-metrics">
              <div className="metric-row">
                <span className="metric-label">Active Agent Connections</span>
                <span className="metric-value">{data.systemStatus.activeConnections}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Submissions /min</span>
                <span className="metric-value">{data.systemStatus.submissionsPerMinute}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Server Load</span>
                <span className="metric-value">{data.systemStatus.serverLoadPercent}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Evidence Uploads</span>
                <span className="metric-value">{data.systemStatus.evidenceUploads}</span>
              </div>
            </div>
          </Panel>

          {/* Reporting Status */}
          <Panel title="Reporting Status">
            <div className="reporting-stats">
              <div className="reporting-stat">
                <span className="stat-number">591</span>
                <span className="stat-label">Not Reporting</span>
              </div>
              <div className="reporting-stat">
                <span className="stat-number">289</span>
                <span className="stat-label">Pending Ver</span>
              </div>
              <div className="reporting-stat">
                <span className="stat-number">1,794</span>
                <span className="stat-label">Verified</span>
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

        .main-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

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

        .bar-segment {
          display: inline-block;
          height: 24px;
          transition: opacity 0.3s;
        }

        .bar-segment.ndc {
          background-color: #00d084;
        }

        .bar-segment.apc {
          background-color: #42a5f5;
        }

        .bar-segment.pdp {
          background-color: #ffa726;
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

        .stat-dot.ndc {
          background-color: #00d084;
        }

        .stat-dot.apc {
          background-color: #42a5f5;
        }

        .stat-dot.pdp {
          background-color: #ffa726;
        }

        .stat-label {
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

        .stat-label {
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
