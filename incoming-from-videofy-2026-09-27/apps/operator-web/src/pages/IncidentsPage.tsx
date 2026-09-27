/** @author masterzee001 */
/**
 * C7-PICS Incidents page.
 *
 * Displays incident cards with:
 * - Severity-colored left border (critical, high, medium, low)
 * - Type, severity, and status badges
 * - Title, description, and timestamp
 * - Metadata: location, PU, agent, assigned
 * - Detail panel with notes, messaging, escalation, and resolution actions
 * - Filter tabs: ALL, HIGH, MED, LOW, OPEN, ESCALATED, RESOLVED
 */
import React, { useState } from 'react';
import { Panel, Button, Chip, StatusPill } from '../premium/primitives';
import { Icon, type IconName } from '../premium/icons';
import { ConsolePage } from '../ConsoleShell';
import styles from './IncidentsPage.module.css';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'escalated' | 'resolved';

export interface IncidentNote {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly timestamp: Date;
}

export interface Incident {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly severity: IncidentSeverity;
  readonly status: IncidentStatus;
  readonly timestamp: Date;
  readonly location?: string;
  readonly pu?: string; // Polling Unit
  readonly agent?: string;
  readonly assignedTo?: string;
  readonly notes: readonly IncidentNote[];
}

export type IncidentFilter = 'ALL' | 'HIGH' | 'MED' | 'LOW' | 'OPEN' | 'ESCALATED' | 'RESOLVED';

export interface IncidentsPageProps {
  readonly active: boolean;
  readonly incidents: readonly Incident[];
  readonly onAddNote: (incidentId: string, note: string) => void;
  readonly onMessage: (incidentId: string, message: string) => void;
  readonly onEscalate: (incidentId: string) => void;
  readonly onResolve: (incidentId: string) => void;
}

const FILTER_TABS: readonly IncidentFilter[] = ['ALL', 'HIGH', 'MED', 'LOW', 'OPEN', 'ESCALATED', 'RESOLVED'];

function getSeverityTone(severity: IncidentSeverity): 'danger' | 'warn' | 'info' | 'neutral' {
  switch (severity) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'danger';
    case 'medium':
      return 'warn';
    case 'low':
      return 'info';
  }
}

function getStatusTone(status: IncidentStatus): 'danger' | 'warn' | 'success' | 'info' {
  switch (status) {
    case 'open':
      return 'danger';
    case 'escalated':
      return 'warn';
    case 'resolved':
      return 'success';
  }
}

function matchesFilter(incident: Incident, filter: IncidentFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'HIGH') return incident.severity === 'high' || incident.severity === 'critical';
  if (filter === 'MED') return incident.severity === 'medium';
  if (filter === 'LOW') return incident.severity === 'low';
  if (filter === 'OPEN') return incident.status === 'open';
  if (filter === 'ESCALATED') return incident.status === 'escalated';
  if (filter === 'RESOLVED') return incident.status === 'resolved';
  return true;
}

function IncidentCardComponent({
  incident,
  onSelect,
}: {
  readonly incident: Incident;
  readonly onSelect: (incidentId: string) => void;
}): React.ReactElement {
  return (
    <button
      className={styles.incidentCard}
      data-severity={incident.severity}
      onClick={() => onSelect(incident.id)}
      type="button"
      aria-label={`${incident.title} - ${incident.severity} severity, ${incident.status} status`}
    >
      <div className={styles.incidentCardHeader}>
        <div>
          <h3 className={styles.incidentCardTitle}>{incident.title}</h3>
          <div className={styles.incidentCardBadges}>
            <Chip tone="neutral" size="sm" caps>
              {incident.type}
            </Chip>
            <Chip tone={getSeverityTone(incident.severity)} size="sm" caps>
              {incident.severity}
            </Chip>
            <StatusPill label={incident.status} tone={getStatusTone(incident.status)} size="sm" caps />
          </div>
        </div>
      </div>

      <p className={styles.incidentCardDescription}>{incident.description}</p>

      {(incident.location || incident.pu || incident.agent || incident.assignedTo) && (
        <div className={styles.incidentCardMeta}>
          {incident.location && (
            <div className={styles.incidentCardMetaItem}>
              <span className={styles.incidentCardMetaLabel}>Location</span>
              <span className={styles.incidentCardMetaValue}>{incident.location}</span>
            </div>
          )}
          {incident.pu && (
            <div className={styles.incidentCardMetaItem}>
              <span className={styles.incidentCardMetaLabel}>Polling Unit</span>
              <span className={styles.incidentCardMetaValue}>{incident.pu}</span>
            </div>
          )}
          {incident.agent && (
            <div className={styles.incidentCardMetaItem}>
              <span className={styles.incidentCardMetaLabel}>Agent</span>
              <span className={styles.incidentCardMetaValue}>{incident.agent}</span>
            </div>
          )}
          {incident.assignedTo && (
            <div className={styles.incidentCardMetaItem}>
              <span className={styles.incidentCardMetaLabel}>Assigned</span>
              <span className={styles.incidentCardMetaValue}>{incident.assignedTo}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.incidentCardTimestamp}>
        {incident.timestamp.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

      <div className={styles.incidentCardActions}>
        <Button variant="secondary" size="sm" className={styles.incidentCardAction} icon={<Icon name="chevron-right" size={16} />}>
          View Details
        </Button>
      </div>
    </button>
  );
}

function DetailPanel({
  incident,
  onClose,
  onAddNote,
  onMessage,
  onEscalate,
  onResolve,
}: {
  readonly incident: Incident;
  readonly onClose: () => void;
  readonly onAddNote: (note: string) => void;
  readonly onMessage: (message: string) => void;
  readonly onEscalate: () => void;
  readonly onResolve: () => void;
}): React.ReactElement {
  const [noteText, setNoteText] = useState('');

  const handleAddNote = (): void => {
    if (noteText.trim()) {
      onAddNote(noteText);
      setNoteText('');
    }
  };

  return (
    <>
      <div className={styles.detailPanelOverlay} onClick={onClose} role="presentation" />
      <div className={styles.detailPanel} role="complementary" aria-label="Incident details">
        <div className={styles.detailPanelHeader}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--op-text)' }}>{incident.title}</h3>
            <StatusPill label={incident.status} tone={getStatusTone(incident.status)} caps />
          </div>
          <button className={styles.detailPanelCloseButton} onClick={onClose} aria-label="Close details" type="button">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className={styles.detailPanelBody}>
          <div className={styles.detailPanelSection}>
            <h4 className={styles.detailPanelSectionTitle}>Description</h4>
            <p style={{ color: 'var(--op-text)', margin: 0, lineHeight: 1.6, fontSize: '13px' }}>{incident.description}</p>
          </div>

          <div className={styles.detailPanelSection}>
            <h4 className={styles.detailPanelSectionTitle}>Details</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--op-text-muted)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Type</span>
                <span style={{ color: 'var(--op-text)' }}>{incident.type}</span>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--op-text-muted)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Severity</span>
                <Chip tone={getSeverityTone(incident.severity)} caps>
                  {incident.severity}
                </Chip>
              </div>
              {incident.location && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--op-text-muted)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Location</span>
                  <span style={{ color: 'var(--op-text)' }}>{incident.location}</span>
                </div>
              )}
              {incident.pu && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--op-text-muted)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Polling Unit</span>
                  <span style={{ color: 'var(--op-text)' }}>{incident.pu}</span>
                </div>
              )}
              {incident.agent && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--op-text-muted)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Agent</span>
                  <span style={{ color: 'var(--op-text)' }}>{incident.agent}</span>
                </div>
              )}
            </div>
          </div>

          {incident.notes.length > 0 && (
            <div className={styles.detailPanelSection}>
              <h4 className={styles.detailPanelSectionTitle}>Notes ({incident.notes.length})</h4>
              <div className={styles.detailPanelNotes}>
                {incident.notes.map((note) => (
                  <div key={note.id} className={styles.detailPanelNote}>
                    <div className={styles.detailPanelNoteAuthor}>
                      {note.author} — {note.timestamp.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={styles.detailPanelNoteText}>{note.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.detailPanelSection}>
            <h4 className={styles.detailPanelSectionTitle}>Add Note</h4>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid var(--op-panel-border)`,
                borderRadius: `var(--op-radius-sm)`,
                background: `var(--op-panel-sunken)`,
                color: `var(--op-text)`,
                fontFamily: 'inherit',
                fontSize: '13px',
                minHeight: '80px',
                resize: 'vertical',
              }}
              aria-label="Note text"
            />
            <Button variant="primary" size="sm" onClick={handleAddNote} style={{ marginTop: '8px', width: '100%' }}>
              Save Note
            </Button>
          </div>
        </div>

        <div className={styles.detailPanelFooter}>
          <Button variant="secondary" size="sm" className={styles.detailPanelActionButton} onClick={() => onMessage('')} icon={<Icon name="message-square" size={16} />}>
            Message
          </Button>
          {incident.status === 'open' && (
            <Button variant="warn" size="sm" className={styles.detailPanelActionButton} onClick={onEscalate} icon={<Icon name="alert-triangle" size={16} />}>
              Escalate
            </Button>
          )}
          {incident.status !== 'resolved' && (
            <Button variant="primary" size="sm" className={styles.detailPanelActionButton} onClick={onResolve} icon={<Icon name="check-circle" size={16} />}>
              Resolve
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function IncidentsPage({ active, incidents, onAddNote, onMessage, onEscalate, onResolve }: IncidentsPageProps): React.ReactElement {
  const [selectedFilter, setSelectedFilter] = useState<IncidentFilter>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const filteredIncidents = incidents.filter((incident) => matchesFilter(incident, selectedFilter));
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  const getTabCount = (filter: IncidentFilter): number => {
    if (filter === 'ALL') return incidents.length;
    return incidents.filter((i) => matchesFilter(i, filter)).length;
  };

  return (
    <ConsolePage
      id="incidents"
      active={active}
      kicker="Operations"
      title="Incident Management"
      lede="Monitor and manage incidents across polling units. Track severity, status, and resolution."
    >
      <div className={styles.body}>
        <Panel padding="md">
          <div className={styles.filterTabs} role="tablist">
            {FILTER_TABS.map((filter) => (
              <button
                key={filter}
                className={styles.filterTab}
                data-active={selectedFilter === filter}
                onClick={() => setSelectedFilter(filter)}
                role="tab"
                aria-selected={selectedFilter === filter}
                aria-label={`Filter by ${filter}`}
              >
                {filter}
                <span className={styles.filterTabCount}>({getTabCount(filter)})</span>
              </button>
            ))}
          </div>
        </Panel>

        {filteredIncidents.length > 0 ? (
          <div className={styles.incidentsList}>
            {filteredIncidents.map((incident) => (
              <IncidentCardComponent key={incident.id} incident={incident} onSelect={setSelectedIncidentId} />
            ))}
          </div>
        ) : (
          <Panel padding="lg" className={styles.emptyState}>
            <Icon name="inbox" size={48} className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Incidents</h3>
            <p className={styles.emptyStateText}>No incidents matching the selected filter.</p>
          </Panel>
        )}
      </div>

      {selectedIncident && (
        <DetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncidentId(null)}
          onAddNote={(note) => {
            onAddNote(selectedIncident.id, note);
          }}
          onMessage={(message) => {
            onMessage(selectedIncident.id, message);
          }}
          onEscalate={() => {
            onEscalate(selectedIncident.id);
          }}
          onResolve={() => {
            onResolve(selectedIncident.id);
          }}
        />
      )}
    </ConsolePage>
  );
}
