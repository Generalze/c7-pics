"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElectionDayReportItem, PoliticalPartyItem } from "@pics-nigeria/shared";
import {
  fetchAdminElectionDayReports,
  fetchPoliticalParties,
  updateAdminElectionDayReportStatus,
} from "../../../lib/api";
import { useCommandSession } from "../../../components/command/session";
import { loadLgaNames, loadPollingUnitNames, loadWardNames, nameOf } from "../../../components/command/territory";
import {
  Badge,
  Banner,
  Btn,
  Empty,
  Kpi,
  Loading,
  Panel,
  clockTime,
  count,
  reportStatusTone,
  words,
} from "../../../components/command/ui";

const REFRESH_MS = 30_000;

type Filter = "all" | "pending" | "verified" | "flagged";

/**
 * The reference shows PENDING / VERIFIED / FLAGGED. The schema's statuses are
 * SUBMITTED, UNDER_REVIEW, APPROVED and REJECTED, so pending covers the two
 * that are still in the reviewer's hands.
 */
function matches(filter: Filter, status: ElectionDayReportItem["status"]): boolean {
  switch (filter) {
    case "pending":
      return status === "SUBMITTED" || status === "UNDER_REVIEW";
    case "verified":
      return status === "APPROVED";
    case "flagged":
      return status === "REJECTED";
    default:
      return true;
  }
}

export default function ResultsPage() {
  const { token } = useCommandSession();
  const [reports, setReports] = useState<ElectionDayReportItem[]>([]);
  const [parties, setParties] = useState<PoliticalPartyItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());
  const [puNames, setPuNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await fetchAdminElectionDayReports(token);
      setReports(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load submitted results.");
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadLgaNames(token).catch(() => new Map<string, string>()),
      loadWardNames(token).catch(() => new Map<string, string>()),
      fetchPoliticalParties(token).catch(() => [] as PoliticalPartyItem[]),
    ]).then(([lgas, wards, nextParties]) => {
      if (cancelled) return;
      setLgaNames(lgas);
      setWardNames(wards);
      setParties(nextParties);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (reports.length === 0 || wardNames.size === 0) return;
    let cancelled = false;
    void loadPollingUnitNames(
      token,
      reports.map((report) => report.territory.wardId),
    ).then((map) => {
      if (!cancelled) setPuNames(new Map(map));
    });
    return () => {
      cancelled = true;
    };
  }, [reports, token, wardNames]);

  /** Party columns are the parties that actually appear in the submitted entries. */
  const columns = useMemo(() => {
    const seen = new Map<string, string>();
    for (const report of reports) {
      for (const entry of report.voteEntries) {
        if (!seen.has(entry.politicalPartyId)) {
          const party = parties.find((item) => item.id === entry.politicalPartyId);
          seen.set(entry.politicalPartyId, party?.code ?? entry.politicalPartyName ?? entry.politicalPartyId);
        }
      }
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [parties, reports]);

  const tallies = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter((report) => matches("pending", report.status)).length,
      verified: reports.filter((report) => matches("verified", report.status)).length,
      flagged: reports.filter((report) => matches("flagged", report.status)).length,
    };
  }, [reports]);

  const visible = reports.filter((report) => matches(filter, report.status));

  async function decide(reportId: string, status: "APPROVED" | "UNDER_REVIEW") {
    setBusyId(reportId);
    setError("");
    try {
      const { report } = await updateAdminElectionDayReportStatus(token, reportId, { status });
      setReports((current) => current.map((item) => (item.id === report.id ? report : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The review could not be saved.");
    } finally {
      setBusyId(null);
    }
  }

  if (!loaded) {
    return <Loading label="Loading submissions" />;
  }

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-kpis">
        <Kpi icon="▤" label="Total submissions" value={count(tallies.all)} />
        <Kpi icon="✓" tone="success" label="Verified" value={count(tallies.verified)} />
        <Kpi icon="◷" tone="warning" label="Pending review" value={count(tallies.pending)} />
        <Kpi icon="⚑" tone="danger" label="Rejected" value={count(tallies.flagged)} />
      </div>

      <div className="ec-chips" role="group" aria-label="Filter results">
        {(
          [
            ["all", `All (${tallies.all})`],
            ["pending", `Pending (${tallies.pending})`],
            ["verified", `Verified (${tallies.verified})`],
            ["flagged", `Rejected (${tallies.flagged})`],
          ] as Array<[Filter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="ec-chip"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <Panel flush title={`${visible.length} results`} meta="One report per polling unit per day">
        {visible.length === 0 ? (
          <Empty>
            {reports.length === 0
              ? "No election-day report has been submitted. Agents submit these from the field app."
              : "No result matches this filter."}
          </Empty>
        ) : (
          <div className="ec-tableWrap">
            <table className="ec-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>LGA</th>
                  <th>Ward</th>
                  <th>PU</th>
                  {columns.map((column) => (
                    <th key={column.id}>{column.label}</th>
                  ))}
                  <th>Total</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((report) => {
                  const byParty = new Map(report.voteEntries.map((entry) => [entry.politicalPartyId, entry.votes]));
                  const total = report.voteEntries.reduce((sum, entry) => sum + entry.votes, 0);
                  const leader = Math.max(...report.voteEntries.map((entry) => entry.votes), 0);
                  return (
                    <tr key={report.id}>
                      <td className="ec-num ec-dim">{clockTime(report.createdAt)}</td>
                      <td>{nameOf(lgaNames, report.territory.lgaId)}</td>
                      <td className="ec-muted">{nameOf(wardNames, report.territory.wardId)}</td>
                      <td className="ec-mono ec-muted">{nameOf(puNames, report.territory.pollingUnitId)}</td>
                      {columns.map((column) => {
                        const votes = byParty.get(column.id);
                        const isLeader = votes !== undefined && votes === leader && leader > 0;
                        return (
                          <td key={column.id} className={isLeader ? "ec-num ec-num--lead" : "ec-num"}>
                            {votes === undefined ? "—" : count(votes)}
                          </td>
                        );
                      })}
                      <td className="ec-num">{count(total)}</td>
                      <td className="ec-muted">{report.agentName}</td>
                      <td>
                        <Badge tone={reportStatusTone(report.status)}>{words(report.status)}</Badge>
                      </td>
                      <td>
                        {report.status === "APPROVED" || report.status === "REJECTED" ? null : (
                          <span className="ec-btnRow">
                            <Btn
                              variant="primary"
                              disabled={busyId === report.id}
                              onClick={() => void decide(report.id, "APPROVED")}
                            >
                              Verify
                            </Btn>
                            {report.status === "SUBMITTED" ? (
                              <Btn
                                disabled={busyId === report.id}
                                onClick={() => void decide(report.id, "UNDER_REVIEW")}
                              >
                                Review
                              </Btn>
                            ) : null}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="ec-dim" style={{ fontSize: 13 }}>
        Accredited-voter counts are not part of the election-day report schema, so that column is absent rather than
        estimated. Rejecting a report is done from the older Election Reports page, which captures the required review
        note.
      </p>
    </>
  );
}
