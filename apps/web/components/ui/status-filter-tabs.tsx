import React from 'react';
import styles from './status-filter-tabs.module.css';

export interface StatusOption {
  id: string;
  label: string;
  count?: number;
  accent?: 'success' | 'warning' | 'danger' | 'info';
}

interface StatusFilterTabsProps {
  statuses: StatusOption[];
  active: string;
  onSelect: (statusId: string) => void;
  showCounts?: boolean;
  className?: string;
}

const accentColors = {
  success: '#00d084',
  warning: '#ffa726',
  danger: '#ff5252',
  info: '#42a5f5',
};

export function StatusFilterTabs({
  statuses,
  active,
  onSelect,
  showCounts = true,
  className = '',
}: StatusFilterTabsProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.tabs}>
        {statuses.map((status) => (
          <button
            key={status.id}
            className={`${styles.tab} ${active === status.id ? styles.active : ''}`}
            onClick={() => onSelect(status.id)}
            style={
              active === status.id && status.accent
                ? ({ '--tab-color': accentColors[status.accent] } as React.CSSProperties)
                : undefined
            }
          >
            {status.label}
            {showCounts && status.count !== undefined && (
              <span className={styles.count}>({status.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StatusFilterTabs;
