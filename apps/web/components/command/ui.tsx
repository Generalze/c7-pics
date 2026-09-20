"use client";

import type { ReactNode } from "react";

export type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "violet";

/* ------------------------------------------------------------- formatting */

export function count(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-NG");
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** 24-hour clock time, the way a situation room reads a log. */
export function clockTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function dayAndTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function words(value: string): string {
  return value.replace(/_/g, " ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/* ------------------------------------------------------------- primitives */

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`ec-badge ec-badge--${tone}`}>{children}</span>;
}

export function Kpi({
  label,
  value,
  note,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon: string;
  tone?: Tone;
}) {
  return (
    <div className={`ec-kpi ec-kpi--${tone}`}>
      <span className="ec-kpi-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="ec-kpi-body">
        <div className="ec-kpi-value">{value}</div>
        <div className="ec-kpi-label">{label}</div>
        {note ? <div className="ec-kpi-note">{note}</div> : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  meta,
  actions,
  flush,
  children,
}: {
  title?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="ec-panel">
      {title || meta || actions ? (
        <header className="ec-panel-head">
          {title ? <h3 className="ec-panel-title">{title}</h3> : null}
          {actions}
          {meta ? <span className="ec-panel-meta">{meta}</span> : null}
        </header>
      ) : null}
      <div className={flush ? "ec-panel-body ec-panel-body--flush" : "ec-panel-body"}>{children}</div>
    </section>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="ec-chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ec-chip"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.count === undefined ? option.label : `${option.label} (${option.count})`}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; badge?: number }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="ec-tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          className="ec-tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.badge ? <span className="ec-navBadge">{option.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Meter({ value, tone = "success" }: { value: number; tone?: "success" | "warning" | "danger" | "info" }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="ec-meter" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={`ec-meter-fill ec-meter-fill--${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function MetricRow({
  label,
  value,
  meter,
  tone = "success",
}: {
  label: string;
  value: ReactNode;
  meter?: number;
  tone?: "success" | "warning" | "danger" | "info";
}) {
  return (
    <div className="ec-metricRow">
      <span className="ec-metricRow-label">{label}</span>
      <span className="ec-metricRow-value">{value}</span>
      {meter === undefined ? null : (
        <span className="ec-metricRow-meter">
          <Meter value={meter} tone={tone} />
        </span>
      )}
    </div>
  );
}

export function Tile({ value, label, tone }: { value: ReactNode; label: string; tone?: Tone }) {
  const color =
    tone === "success"
      ? "var(--ec-green)"
      : tone === "info"
        ? "var(--ec-blue)"
        : tone === "warning"
          ? "var(--ec-amber)"
          : tone === "danger"
            ? "var(--ec-red)"
            : tone === "violet"
              ? "var(--ec-violet)"
              : "var(--ec-muted)";
  return (
    <div className="ec-tile">
      <div className="ec-tile-value" style={{ color }}>
        {value}
      </div>
      <div className="ec-tile-label">{label}</div>
    </div>
  );
}

export function Def({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ec-def">
      <span className="ec-def-key">{label}</span>
      <span className="ec-def-value">{children}</span>
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="ec-state">
      <span className="ec-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="ec-state">{children}</div>;
}

export function Banner({ tone = "danger", children }: { tone?: "danger" | "warning" | "info"; children: ReactNode }) {
  return <div className={tone === "danger" ? "ec-banner" : `ec-banner ec-banner--${tone}`}>{children}</div>;
}

export function DetailEmpty({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="ec-detail-empty">
      <span className="ec-detail-emptyIcon" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "default",
  disabled,
  wide,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  wide?: boolean;
  type?: "button" | "submit";
}) {
  const classes = ["ec-btn"];
  if (variant !== "default") classes.push(`ec-btn--${variant}`);
  if (wide) classes.push("ec-btn--wide");
  return (
    <button type={type} className={classes.join(" ")} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ tones */

export function severityTone(severity: string): Tone {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    default:
      return "neutral";
  }
}

export function incidentStatusTone(status: string): Tone {
  switch (status) {
    case "RESOLVED":
    case "CLOSED":
      return "success";
    case "IN_PROGRESS":
      return "info";
    default:
      return "danger";
  }
}

export function reportStatusTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "UNDER_REVIEW":
      return "info";
    case "SUBMITTED":
      return "warning";
    default:
      return "neutral";
  }
}

export function evidenceStatusTone(status: string): Tone {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "DISPUTED":
    case "REQUIRES_CLARIFICATION":
      return "danger";
    case "ARCHIVED":
      return "neutral";
    case "UNDER_REVIEW":
      return "info";
    default:
      return "warning";
  }
}

export function agentStateTone(state: string): Tone {
  switch (state) {
    case "verified":
      return "success";
    case "result_submitted":
      return "success";
    case "voting_underway":
      return "info";
    case "counting":
      return "warning";
    case "arrived":
      return "neutral";
    case "incident":
      return "danger";
    case "absent":
      return "danger";
    case "technical":
      return "warning";
    default:
      return "neutral";
  }
}

/** The party colours used by the tally bar, in a fixed order so a party keeps its colour. */
export const PARTY_COLOURS = [
  "var(--ec-green)",
  "var(--ec-blue)",
  "var(--ec-amber)",
  "var(--ec-violet)",
  "var(--ec-red)",
  "#26c6da",
  "#8d6e63",
  "#9e9e9e",
] as const;
