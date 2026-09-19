import React from 'react';
import styles from './status-badge.module.css';

export type StatusType =
  | 'verified'
  | 'result_submitted'
  | 'pending'
  | 'voting_underway'
  | 'counting'
  | 'arrived'
  | 'absent'
  | 'incident'
  | 'technical'
  | 'flagged';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'solid' | 'outline' | 'pill';

interface StatusBadgeProps {
  status: StatusType;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; color: string }> = {
  verified: { label: 'VERIFIED', color: '#00d084' },
  result_submitted: { label: 'RESULT SUBMITTED', color: '#00d084' },
  pending: { label: 'PENDING', color: '#ffa726' },
  voting_underway: { label: 'VOTING UNDERWAY', color: '#42a5f5' },
  counting: { label: 'COUNTING', color: '#ffa726' },
  arrived: { label: 'ARRIVED', color: '#42a5f5' },
  absent: { label: 'ABSENT', color: '#ff5252' },
  incident: { label: 'INCIDENT', color: '#ff5252' },
  technical: { label: 'TECHNICAL', color: '#ff5252' },
  flagged: { label: 'FLAGGED', color: '#ff5252' },
};

export function StatusBadge({
  status,
  size = 'md',
  variant = 'solid',
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`${styles.badge} ${styles[`size-${size}`]} ${styles[`variant-${variant}`]} ${className}`}
      style={{ '--badge-color': config.color } as React.CSSProperties}
      title={config.label}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
