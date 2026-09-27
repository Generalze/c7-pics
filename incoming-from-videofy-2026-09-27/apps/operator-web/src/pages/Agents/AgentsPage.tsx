/**
 * Agents Page
 * Lists agents with filtering by status, sortable columns, and detail panel
 *
 * API Integration:
 * - GET /api/agents — list all agents with filtering and sorting
 * - GET /api/agents/:id — get agent details
 * - POST /api/agents/:id/actions — perform agent actions
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { DataTable, DataTableColumn, SortDirection, StatusBadge } from '../../components/DataTable/DataTable';
import styles from './AgentsPage.module.css';

/**
 * Agent domain model
 * Matches the API contract from the gateway
 */
export interface Agent {
  id: string;
  name: string;
  lga: string;
  ward: string;
  pu: number;
  lastSeen: string; // ISO 8601 datetime
  evidenceCount: number;
  status: 'active' | 'idle' | 'failed' | 'pending';
  registeredDate: string;
  isVerified: boolean;
}

interface AgentsPageState {
  agents: Agent[];
  selectedAgent: Agent | null;
  statusFilter: 'all' | 'active' | 'idle' | 'failed' | 'pending';
  sortBy: keyof Agent | null;
  sortDirection: SortDirection;
  isLoading: boolean;
  error: string | null;
}

/**
 * Status-specific counts for filter tabs
 */
interface StatusCounts {
  all: number;
  active: number;
  idle: number;
  failed: number;
  pending: number;
}

/**
 * Format ISO datetime as relative time
 */
function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  } catch {
    return '—';
  }
}

/**
 * Calculate status counts from agent list
 */
function getStatusCounts(agents: Agent[]): StatusCounts {
  return {
    all: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    idle: agents.filter((a) => a.status === 'idle').length,
    failed: agents.filter((a) => a.status === 'failed').length,
    pending: agents.filter((a) => a.status === 'pending').length,
  };
}

/**
 * Mock API client
 * In production, replace with actual API calls via a service module
 */
class AgentApiClient {
  private mockAgents: Agent[] = [
    {
      id: 'AGT-001',
      name: 'Chioma Okoye',
      lga: 'Somolu',
      ward: 'Ward 5',
      pu: 104,
      lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
      evidenceCount: 12,
      status: 'active',
      registeredDate: '2026-08-15',
      isVerified: true,
    },
    {
      id: 'AGT-002',
      name: 'Emeka Nwankwo',
      lga: 'Ikorodu',
      ward: 'Ward 3',
      pu: 087,
      lastSeen: new Date(Date.now() - 2 * 3600000).toISOString(),
      evidenceCount: 8,
      status: 'idle',
      registeredDate: '2026-08-10',
      isVerified: true,
    },
    {
      id: 'AGT-003',
      name: 'Zainab Abdullahi',
      lga: 'Ibadan North',
      ward: 'Ward 7',
      pu: 156,
      lastSeen: new Date(Date.now() - 24 * 3600000).toISOString(),
      evidenceCount: 0,
      status: 'failed',
      registeredDate: '2026-09-01',
      isVerified: false,
    },
    {
      id: 'AGT-004',
      name: 'Amira Hassan',
      lga: 'Abeokuta South',
      ward: 'Ward 2',
      pu: 042,
      lastSeen: new Date(Date.now() - 30 * 60000).toISOString(),
      evidenceCount: 5,
      status: 'active',
      registeredDate: '2026-08-20',
      isVerified: true,
    },
    {
      id: 'AGT-005',
      name: 'Ibrahim Musa',
      lga: 'Kano Municipal',
      ward: 'Ward 1',
      pu: 221,
      lastSeen: new Date(Date.now() - 6 * 3600000).toISOString(),
      evidenceCount: 3,
      status: 'pending',
      registeredDate: '2026-09-02',
      isVerified: false,
    },
  ];

  async fetchAgents(): Promise<Agent[]> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => resolve(this.mockAgents), 500);
    });
  }

  async getAgent(id: string): Promise<Agent | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const agent = this.mockAgents.find((a) => a.id === id);
        resolve(agent ?? null);
      }, 300);
    });
  }
}

/**
 * AgentsPage Component
 * Main page for agent management and monitoring
 */
export const AgentsPage: React.FC = () => {
  const [state, setState] = useState<AgentsPageState>({
    agents: [],
    selectedAgent: null,
    statusFilter: 'all',
    sortBy: null,
    sortDirection: null,
    isLoading: true,
    error: null,
  });

  const apiClient = useMemo(() => new AgentApiClient(), []);

  // Fetch agents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const agents = await apiClient.fetchAgents();
        setState((prev) => ({
          ...prev,
          agents,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to fetch agents',
          isLoading: false,
        }));
      }
    };

    fetchData();
  }, [apiClient]);

  // Filter agents by status
  const filteredAgents = useMemo(() => {
    if (state.statusFilter === 'all') {
      return state.agents;
    }
    return state.agents.filter((a) => a.status === state.statusFilter);
  }, [state.agents, state.statusFilter]);

  // Calculate status counts
  const statusCounts = useMemo(() => getStatusCounts(state.agents), [state.agents]);

  // DataTable columns
  const columns: DataTableColumn<Agent>[] = [
    {
      key: 'id',
      label: 'Agent ID',
      width: '100px',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (agent) => (
        <button
          onClick={() =>
            setState((prev) => ({ ...prev, selectedAgent: agent }))
          }
          style={{
            all: 'unset',
            color: 'var(--vf-text-accent)',
            cursor: 'pointer',
            fontWeight: '500',
            textDecoration: 'underline',
          }}
        >
          {agent.name}
        </button>
      ),
    },
    {
      key: 'lga',
      label: 'LGA',
      sortable: true,
    },
    {
      key: 'ward',
      label: 'Ward',
      sortable: false,
    },
    {
      key: 'pu',
      label: 'PU',
      width: '60px',
      sortable: true,
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      sortable: true,
      render: (agent) => formatRelativeTime(agent.lastSeen),
    },
    {
      key: 'evidenceCount',
      label: 'Evidence',
      width: '80px',
      sortable: true,
      align: 'right',
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (agent) => (
        <StatusBadge
          status={agent.status}
          label={agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        />
      ),
    },
  ];

  // Handle sort
  const handleSort = useCallback(
    (key: keyof Agent, direction: SortDirection) => {
      setState((prev) => ({
        ...prev,
        sortBy: direction ? key : null,
        sortDirection: direction,
      }));
    },
    []
  );

  // Handle status filter
  const handleStatusFilter = useCallback(
    (status: typeof state.statusFilter) => {
      setState((prev) => ({
        ...prev,
        statusFilter: status,
        selectedAgent: null,
      }));
    },
    []
  );

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Agents</h1>
            <p className={styles.subtitle}>
              Monitor and manage reporting agents across regions
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.actionButton}>
              ↓ Export
            </button>
            <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
              + Add Agent
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Filter by Status</span>
          <div className={styles.filterTabs}>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'idle', label: 'Idle' },
                { id: 'pending', label: 'Pending' },
                { id: 'failed', label: 'Failed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                className={`${styles.filterTab} ${
                  state.statusFilter === tab.id ? styles.filterTabActive : ''
                }`}
                onClick={() => handleStatusFilter(tab.id)}
              >
                {tab.label}
                <span className={styles.filterCount}>
                  {statusCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Table */}
        <div className={styles.tableWrapper}>
          {state.error && (
            <div
              style={{
                padding: 'var(--vf-space-4)',
                background: 'var(--vf-status-danger-surface)',
                color: 'var(--vf-status-danger-text)',
                borderRadius: 'var(--vf-radius-md)',
                marginBottom: 'var(--vf-space-4)',
              }}
            >
              {state.error}
            </div>
          )}
          <DataTable<Agent>
            data={filteredAgents}
            columns={columns}
            isLoading={state.isLoading}
            pageSize={10}
            sortBy={state.sortBy}
            sortDirection={state.sortDirection}
            onSort={handleSort}
            getRowKey={(agent) => agent.id}
            emptyState={
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--vf-space-8)',
                  color: 'var(--vf-text-muted)',
                }}
              >
                <p>No agents found</p>
                <p style={{ fontSize: 'var(--vf-font-size-xs)' }}>
                  Try adjusting your filters
                </p>
              </div>
            }
          />
        </div>

        {/* Detail Panel */}
        <aside className={styles.detailPanel}>
          <h2 className={styles.detailPanelTitle}>Selected Agent</h2>
          {!state.selectedAgent ? (
            <div className={styles.detailPanelEmpty}>
              Click an agent name to view details
            </div>
          ) : (
            <>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Agent ID</span>
                <code className={styles.detailValueMono}>
                  {state.selectedAgent.id}
                </code>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Full Name</span>
                <div className={styles.detailValue}>{state.selectedAgent.name}</div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Location</span>
                <div className={styles.detailValue}>
                  {state.selectedAgent.lga}, {state.selectedAgent.ward}
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Polling Unit</span>
                <div className={styles.detailValue}>PU {state.selectedAgent.pu}</div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Evidence Submitted</span>
                <div className={styles.detailValue}>
                  {state.selectedAgent.evidenceCount} item{
                    state.selectedAgent.evidenceCount !== 1 ? 's' : ''
                  }
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Verification</span>
                <div className={styles.detailValue}>
                  {state.selectedAgent.isVerified ? (
                    <StatusBadge status="success" label="Verified" />
                  ) : (
                    <StatusBadge status="pending" label="Pending" />
                  )}
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Registered</span>
                <div className={styles.detailValue}>
                  {new Date(state.selectedAgent.registeredDate).toLocaleDateString()}
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <div className={styles.detailValue}>
                  <StatusBadge
                    status={state.selectedAgent.status}
                    label={
                      state.selectedAgent.status.charAt(0).toUpperCase() +
                      state.selectedAgent.status.slice(1)
                    }
                  />
                </div>
              </div>

              <div className={styles.detailActions}>
                <button className={styles.detailActionButton}>
                  View Evidence
                </button>
                <button className={styles.detailActionButton}>
                  View Reports
                </button>
                <button
                  className={`${styles.detailActionButton} ${styles.detailActionButtonDanger}`}
                >
                  Deactivate
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

AgentsPage.displayName = 'AgentsPage';
