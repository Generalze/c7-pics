import React from 'react';
import styles from './kpi-card.module.css';

export type AccentType = 'success' | 'warning' | 'danger' | 'info';

interface KpiCardProps {
  label: string;
  value: string | number;
  percentage?: number;
  percentageLabel?: string;
  trend?: 'up' | 'down';
  trendPercent?: number;
  accent?: AccentType;
  icon?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  value,
  percentage,
  percentageLabel,
  trend,
  trendPercent,
  accent = 'info',
  icon,
  className = '',
}: KpiCardProps) {
  const accentColor = {
    success: '#00d084',
    warning: '#ffa726',
    danger: '#ff5252',
    info: '#42a5f5',
  }[accent];

  return (
    <div className={`${styles.kpiCard} ${styles[`accent-${accent}`]} ${className}`}>
      <div className={styles.leftBorder} style={{ backgroundColor: accentColor }} />

      <div className={styles.content}>
        <div className={styles.header}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.label}>{label}</span>
        </div>

        <div className={styles.value}>{value}</div>

        {(percentage || percentageLabel) && (
          <div className={styles.percentage}>
            <span className={styles.percentageValue}>{percentage}%</span>
            {percentageLabel && <span className={styles.percentageLabel}>{percentageLabel}</span>}
          </div>
        )}

        {trend && trendPercent !== undefined && (
          <div className={`${styles.trend} ${styles[`trend-${trend}`]}`}>
            <span className={styles.trendIcon}>{trend === 'up' ? '↑' : '↓'}</span>
            <span className={styles.trendValue}>{trend === 'up' ? '+' : ''}{trendPercent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
