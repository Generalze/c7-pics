"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentActivitySummary, AgentUserItem } from "@pics-nigeria/shared";
import {
  fetchAdminAgentActivitySummaries,
  fetchAgents,
  fetchCommandCentreMetrics,
  type CommandCentreAgentState,
} from "../../../lib/api";
import { useCommandSession } from "../../../components/command/session";
import { loadLgaNames, loadPollingUnitNames, loadWardNames, nameOf } from "../../../components/command/territory";
import {
  Badge,
  Banner,
  Def,
  DetailEmpty,
  Empty,
  Loading,
  Panel,
  agentStateTone,
  clockTime,
  count,
  dayAndTime,
  initials,
  words,
} from "../../../components/command/ui";

const REFRESH_MS = 30_000;

/** The nine states the API derives, in the order a shift supervisor scans them. */
const STATE_ORDER: CommandCentreAgentState[] = [
  "result_submitted",
  "verified",
  "voting_underway",
  "counting",
  "arrived",
  "incident",
  "absent",
  "technical",
  "pending",
];

type Row = {
  id: string;
  name: string;
  state: CommandCentreAgentState;
  email: string | null;
  phone: string | null;
  lgaId: string | null;
  wardId: string | null;
  pollingUnitId: string | null;
  lastSeen: string | null;
  lastActivity: string | null;
};

export default function AgentsPage() {
  const { token } = useCommandSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | CommandCentreAgentState>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());
  const [puNames, setPuNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [metrics, directory, activity] = await Promise.all([
        fetchCommandCentreMetrics(token),
        fetchAgents(token),
        fetchAdminAgentActivitySummaries(token),
      ]);

      const byId = new Map<string, AgentUserItem>(directory.map((agent) => [agent.userId, agent]));
      const activityById = new Map<string, AgentActivitySummary>(
        activity.map((entry) => [entry.agentUserId, entry]),
      );

      setRows(
        metrics.operationalMetrics.agentStatus.agents.map((agent) => {
          const record = byId.get(agent.id);
          const seen = activityById.get(agent.id);
          return {
            id: agent.id,
            name: agent.name,
            state: agent.state,
            email: record?.email ?? null,
            phone: record?.phone ?? null,
            lgaId: record?.territory.lgaId ?? seen?.territory.lgaId ?? null,
            wardId: record?.territory.wardId ?? seen?.territory.wardId ?? null,
            pollingUnitId: record?.territory.pollingUnitId ?? seen?.pollingUnitId ?? null,
            lastSeen: seen?.latestActivityAt ?? null,
            lastActivity: seen?.latestActivityType ?? null,
          };
        }),
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the agent roster.");
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
    ]).then(([lgas, wards]) => {
      if (cancelled) return;
      setLgaNames(lgas);
      setWardNames(wards);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (rows.length === 0 || wardNames.size === 0) return;
    let cancelled = false;
    void loadPollingUnitNames(
      token,
      rows.map((row) => row.wardId),
    ).then((map) => {
      if (!cancelled) setPuNames(new Map(map));
    });
    return () => {
      cancelled = true;
    };
  }, [rows, token, wardNames]);

  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    for (const row of rows) {
      tally.set(row.state, (tally.get(row.state) ?? 0) + 1);
    }
    return tally;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((row) => row.state === filter);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  if (!loaded) {
    return <Loading label="Loading the roster" />;
  }

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-chips" role="group" aria-label="Filter by agent state">
        <button type="button" className="ec-chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          All ({rows.length})
        </button>
        {STATE_ORDER.filter((state) => (counts.get(state) ?? 0) > 0).map((state) => (
          <button
            key={state}
            type="button"
            className="ec-chip"
            aria-pressed={filter === state}
            onClick={() => setFilter(state)}
          >
            {words(state)} ({counts.get(state) ?? 0})
          </button>
        ))}
      </div>

      <div className="ec-cols ec-cols--two" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 340px)" }}>
        <Panel flush title={`${visible.length} agents`} meta="Click a row for detail">
          {visible.length === 0 ? (
            <Empty>
              {rows.length === 0
                ? "No agent accounts exist yet. Create one in Manage Users and assign a polling unit."
                : "No agent is in this state."}
            </Empty>
          ) : (
            <div className="ec-tableWrap">
              <table className="ec-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>LGA</th>
                    <th>Ward</th>
                    <th>PU</th>
                    <th>Last seen</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.id}
                      data-clickable="true"
                      aria-selected={row.id === selectedId}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td>{row.name}</td>
                      <td className="ec-muted">{nameOf(lgaNames, row.lgaId)}</td>
                      <td className="ec-muted">{nameOf(wardNames, row.wardId)}</td>
                      <td className="ec-mono ec-muted">{nameOf(puNames, row.pollingUnitId)}</td>
                      <td className="ec-num ec-dim">{clockTime(row.lastSeen)}</td>
                      <td>
                        <Badge tone={agentStateTone(row.state)}>{words(row.state)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="ec-detail">
          <Panel title="Agent detail">
            {!selected ? (
              <DetailEmpty icon="☖">Select an agent to view their assignment and last activity.</DetailEmpty>
            ) : (
              <>
                <div className="ec-railFoot-user" style={{ marginBottom: 14 }}>
                  <span className="ec-avatar" aria-hidden="true">
                    {initials(selected.name)}
                  </span>
                  <span>
                    <span className="ec-railFoot-name">{selected.name}</span>
                    <span className="ec-railFoot-role">{words(selected.state)}</span>
                  </span>
                </div>
                <div className="ec-defs">
                  <Def label="Status">
                    <Badge tone={agentStateTone(selected.state)}>{words(selected.state)}</Badge>
                  </Def>
                  <Def label="Email">{selected.email ?? "—"}</Def>
                  <Def label="Phone">{selected.phone ?? "—"}</Def>
                  <Def label="LGA">{nameOf(lgaNames, selected.lgaId)}</Def>
                  <Def label="Ward">{nameOf(wardNames, selected.wardId)}</Def>
                  <Def label="Polling unit">{nameOf(puNames, selected.pollingUnitId)}</Def>
                  <Def label="Last activity">{selected.lastActivity ? words(selected.lastActivity) : "None"}</Def>
                  <Def label="Last seen">{dayAndTime(selected.lastSeen)}</Def>
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>

      <p className="ec-dim ec-mono" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {count(rows.length)} agent accounts · state derived from activity, incidents and election-day reports
      </p>
    </>
  );
}
