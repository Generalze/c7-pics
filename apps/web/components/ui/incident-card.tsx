import React from 'react';
import StatusBadge from './status-badge';
import styles from './incident-card.module.css';

export type IncidentType = 'disruption' | 'late_opening' | 'agent_absent' | 'result_dispute' | 'intimidation' | 'technical' | 'violence' | 'vote_buying' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'escalated' | 'resolved';

interface IncidentCardProps {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  reportedAt: string;
  status: IncidentStatus;
  location: string;
  pollingUnit: string;
  reportingAgent?: string;
  lgaCoord?: string;
  onClick?: () => void;
  className?: string;
}

const typeLabels: Record<IncidentType, string> = {
  disruption: 'DISRUPTION',
  late_opening: 'LATE OPENING',
  agent_absent: 'AGENT ABSENT',
  result_dispute: 'RESULT DISPUTE',
  intimidation: 'INTIMIDATION',
  technical: 'TECHNICAL',
  violence: 'VIOLENCE',
  vote_buying: 'VOTE BUYING',
  other: 'OTHER',
};

const severityColors: Record<IncidentSeverity, string> = {
  low: '#42a5f5',
  medium: '#ffa726',
  high: '#ff5252',
  critical: '#ff5252',
};

export function IncidentCard({
  id,
  type,
  severity,
  title,
  description,
  reportedAt,
  status,
  location,
  pollingUnit,
  reportingAgent,
  lgaCoord,
  onClick,
  className = '',
}: IncidentCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[`severity-${severity}`]} ${className}`}
      onClick={onClick}
      style={{
        '--severity-color': severityColors[severity],
      } as React.CSSProperties}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.bullet}>●</span>
          <h3 className={styles.title}>{typeLabels[type]}</h3>
          <span className={styles.severityBadge}>{severity.toUpperCase()}</span>
        </div>
        <div className={styles.timeAndStatus}>
          <time className={styles.time}>{reportedAt}</time>
          <StatusBadge
            status={status === 'resolved' ? 'verified' : 'pending'}
            size="sm"
            variant="outline"
          />
        </div>
      </div>

      <p className={styles.description}>{description}</p>

      <div className={styles.metadata}>
        <span className={styles.metaItem}>{id}</span>
        <span className={styles.separator}>·</span>
        <span className={styles.metaItem}>{location}</span>
        <span className={styles.separator}>·</span>
        <span className={styles.metaItem}>{pollingUnit}</span>
        {reportingAgent && (
          <>
            <span className={styles.separator}>·</span>
            <span className={styles.metaItem}>{reportingAgent}</span>
          </>
        )}
        {lgaCoord && (
          <>
            <span className={styles.separator}>·</span>
            <span className={styles.metaItem}>
              <a href="#" className={styles.link}>
                {lgaCoord}
              </a>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default IncidentCard;
