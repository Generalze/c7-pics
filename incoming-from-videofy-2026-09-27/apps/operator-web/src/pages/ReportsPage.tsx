/** @author masterzee001 */
/**
 * C7-PICS Reports page.
 *
 * Displays:
 * - Key metrics: coverage %, verification %, activity %, resolution %
 * - Campaign tally chart visualization
 * - Top LGAs leaderboard
 * - Incident breakdown by severity
 * - Evidence summary
 * - Exportable reports (LGA Coverage, Results Summary, Incident Report, Agent Activity, Evidence Inventory, System Audit)
 */
import React from 'react';
import { Panel, Button, MetricChip } from '../premium/primitives';
import { Icon } from '../premium/icons';
import { ConsolePage } from '../ConsoleShell';
import styles from './ReportsPage.module.css';

export interface ReportMetrics {
  readonly coverage: number; // percentage
  readonly verification: number; // percentage
  readonly activity: number; // percentage
  readonly resolution: number; // percentage
}

export interface CampaignTally {
  readonly campaignName: string;
  readonly total: number;
  readonly completed: number;
}

export interface LgaLeaderboardEntry {
  readonly rank: number;
  readonly lga: string;
  readonly coverage: number; // percentage
  readonly resultsReported: number;
  readonly agents: number;
}

export interface IncidentBreakdownEntry {
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly count: number;
}

export interface EvidenceSummary {
  readonly photos: number;
  readonly videos: number;
  readonly documents: number;
  readonly total: number;
}

export interface ReportsPageProps {
  readonly active: boolean;
  readonly metrics: ReportMetrics;
  readonly campaignTally: readonly CampaignTally[];
  readonly lgaLeaderboard: readonly LgaLeaderboardEntry[];
  readonly incidentBreakdown: readonly IncidentBreakdownEntry[];
  readonly evidenceSummary: EvidenceSummary;
  readonly onExportReport: (reportType: string) => void;
}

const REPORT_TYPES = ['LGA Coverage', 'Results Summary', 'Incident Report', 'Agent Activity', 'Evidence Inventory', 'System Audit'] as const;

function MetricCardComponent({
  value,
  label,
  tone = 'neutral',
  trend,
}: {
  readonly value: string | number;
  readonly label: string;
  readonly tone?: 'success' | 'warn' | 'danger' | 'info' | 'neutral' | undefined;
  readonly trend?: { readonly direction: 'up' | 'down'; readonly value: number } | undefined;
}): React.ReactElement {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricValue} data-tone={tone}>
        {value}
      </p>
      <p className={styles.metricLabel}>{label}</p>
      {trend && (
        <p className={styles.metricTrend} data-direction={trend.direction}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% vs last period
        </p>
      )}
    </div>
  );
}

function CampaignTallyChart({ campaigns }: { readonly campaigns: readonly CampaignTally[] }): React.ReactElement {
  const maxTotal = Math.max(...campaigns.map((c) => c.total), 1);

  return (
    <div className={styles.chartSection}>
      <h3 className={styles.chartTitle}>Campaign Tally</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {campaigns.map((campaign) => {
          const percentage = (campaign.completed / campaign.total) * 100;
          return (
            <div key={campaign.campaignName}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--op-text)', fontSize: '13px', fontWeight: '500' }}>{campaign.campaignName}</span>
                <span style={{ color: 'var(--op-text-muted)', fontSize: '12px' }}>
                  {campaign.completed}/{campaign.total}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--op-panel-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--op-violet), var(--op-teal))',
                    borderRadius: '4px',
                    transition: 'width 300ms ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--op-text-muted)', marginTop: '4px' }}>{Math.round(percentage)}% complete</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LgaLeaderboard({ entries }: { readonly entries: readonly LgaLeaderboardEntry[] }): React.ReactElement {
  const maxCoverage = Math.max(...entries.map((e) => e.coverage), 100);

  return (
    <div className={styles.chartSection}>
      <h3 className={styles.chartTitle}>Top LGAs Leaderboard</h3>
      <table className={styles.leaderboardTable} role="grid" aria-label="LGA leaderboard rankings">
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">LGA</th>
            <th scope="col">Coverage %</th>
            <th scope="col">Results Reported</th>
            <th scope="col">Agents</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.lga}>
              <td>
                <span className={styles.leaderboardRank} data-rank={entry.rank}>
                  {entry.rank}
                </span>
              </td>
              <td className={styles.leaderboardLga}>{entry.lga}</td>
              <td className={styles.leaderboardValue}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {entry.coverage}%
                  <div
                    className={styles.leaderboardBar}
                    style={{
                      width: `${(entry.coverage / maxCoverage) * 80}px`,
                      background: entry.rank === 1 ? 'var(--op-ok)' : entry.rank === 2 ? 'var(--op-violet)' : 'var(--op-teal)',
                    }}
                  />
                </div>
              </td>
              <td className={styles.leaderboardValue}>{entry.resultsReported}</td>
              <td className={styles.leaderboardValue}>{entry.agents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IncidentBreakdown({ breakdown }: { readonly breakdown: readonly IncidentBreakdownEntry[] }): React.ReactElement {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  const getTone = (severity: string): 'danger' | 'warn' | 'info' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warn';
      case 'low':
      default:
        return 'info';
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--op-text)', margin: '0 0 16px 0' }}>Incident Breakdown</h3>
      <div className={styles.incidentBreakdown}>
        {breakdown.map((item) => (
          <div key={item.severity} className={styles.breakdownItem}>
            <div className={styles.breakdownLabel}>{item.severity}</div>
            <div className={styles.breakdownValue} data-tone={getTone(item.severity)}>
              {item.count}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--op-text-muted)', marginTop: '6px' }}>
              {total > 0 ? Math.round((item.count / total) * 100) : 0}% of total
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceSummaryComponent({ summary }: { readonly summary: EvidenceSummary }): React.ReactElement {
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--op-text)', margin: '0 0 16px 0' }}>Evidence Summary</h3>
      <div className={styles.evidenceGrid}>
        <div className={styles.evidenceCard}>
          <Icon name="image" size={40} className={styles.evidenceIcon} />
          <p className={styles.evidenceValue}>{summary.photos}</p>
          <p className={styles.evidenceLabel}>Photos</p>
        </div>
        <div className={styles.evidenceCard}>
          <Icon name="video" size={40} className={styles.evidenceIcon} />
          <p className={styles.evidenceValue}>{summary.videos}</p>
          <p className={styles.evidenceLabel}>Videos</p>
        </div>
        <div className={styles.evidenceCard}>
          <Icon name="file-text" size={40} className={styles.evidenceIcon} />
          <p className={styles.evidenceValue}>{summary.documents}</p>
          <p className={styles.evidenceLabel}>Documents</p>
        </div>
        <div className={styles.evidenceCard}>
          <Icon name="package" size={40} className={styles.evidenceIcon} />
          <p className={styles.evidenceValue}>{summary.total}</p>
          <p className={styles.evidenceLabel}>Total Items</p>
        </div>
      </div>
    </div>
  );
}

export function ReportsPage({
  active,
  metrics,
  campaignTally,
  lgaLeaderboard,
  incidentBreakdown,
  evidenceSummary,
  onExportReport,
}: ReportsPageProps): React.ReactElement {
  const getTrendTone = (
    value: number,
    target: number = 80,
  ): 'success' | 'warn' | 'danger' | 'info' => {
    if (value >= target) return 'success';
    if (value >= target * 0.7) return 'info';
    if (value >= target * 0.5) return 'warn';
    return 'danger';
  };

  return (
    <ConsolePage
      id="reports"
      active={active}
      kicker="Analytics"
      title="Reports & Analytics"
      lede="View key performance metrics, campaign progress, and operational insights across all polling units."
    >
      <div className={styles.body}>
        {/* Key Metrics */}
        <div className={styles.metricsGrid}>
          <MetricCardComponent
            value={`${metrics.coverage}%`}
            label="Coverage"
            tone={getTrendTone(metrics.coverage)}
            trend={{ direction: 'up', value: 3 }}
          />
          <MetricCardComponent
            value={`${metrics.verification}%`}
            label="Verification Rate"
            tone={getTrendTone(metrics.verification, 85)}
            trend={{ direction: 'up', value: 2 }}
          />
          <MetricCardComponent
            value={`${metrics.activity}%`}
            label="Activity Rate"
            tone={getTrendTone(metrics.activity, 90)}
          />
          <MetricCardComponent
            value={`${metrics.resolution}%`}
            label="Resolution Rate"
            tone={getTrendTone(metrics.resolution, 75)}
            trend={{ direction: 'down', value: 1 }}
          />
        </div>

        {/* Campaign Tally */}
        {campaignTally.length > 0 && <CampaignTallyChart campaigns={campaignTally} />}

        {/* LGA Leaderboard */}
        {lgaLeaderboard.length > 0 && <LgaLeaderboard entries={lgaLeaderboard} />}

        {/* Incident Breakdown */}
        {incidentBreakdown.length > 0 && <IncidentBreakdown breakdown={incidentBreakdown} />}

        {/* Evidence Summary */}
        <Panel padding="md">
          <EvidenceSummaryComponent summary={evidenceSummary} />
        </Panel>

        {/* Export Reports */}
        <Panel padding="md" className={styles.exportSection}>
          <span className={styles.exportLabel}>Export operational reports for documentation and analysis:</span>
          <div className={styles.exportButtons}>
            {REPORT_TYPES.map((reportType) => (
              <Button
                key={reportType}
                variant="secondary"
                size="sm"
                className={styles.exportButton}
                onClick={() => onExportReport(reportType)}
                icon={<Icon name="download" size={16} />}
              >
                {reportType}
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </ConsolePage>
  );
}
