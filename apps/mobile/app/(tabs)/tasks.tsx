import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import * as api from "../../src/lib/api";
import { describeError, isSessionError, useSession } from "../../src/lib/auth";
import { FIELD_TASK_STATUSES, type FieldTaskItem, type FieldTaskStatus } from "../../src/lib/types";
import { Banner, Button, Card, Choice, EmptyState, Field, Loading, Muted, Pill, Row, Screen, formatDateTime, humanize } from "../../src/ui/components";

function priorityTone(priority: FieldTaskItem["priority"]): "neutral" | "warning" | "danger" | "info" {
  switch (priority) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "info";
    default:
      return "neutral";
  }
}

function statusTone(status: FieldTaskStatus): "neutral" | "success" | "warning" | "info" {
  switch (status) {
    case "DONE":
      return "success";
    case "BLOCKED":
      return "warning";
    case "IN_PROGRESS":
      return "info";
    default:
      return "neutral";
  }
}

function TaskCard({ task, token, onUpdated, onSignOut }: { task: FieldTaskItem; token: string; onUpdated: (task: FieldTaskItem) => void; onSignOut: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [nextStatus, setNextStatus] = useState<FieldTaskStatus>(task.status);
  const [note, setNote] = useState(task.resolutionNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const updated = await api.updateTask(token, task.id, { status: nextStatus, ...(note.trim() ? { resolutionNote: note.trim() } : {}) });
      onUpdated(updated);
      setExpanded(false);
    } catch (err) {
      if (isSessionError(err)) {
        await onSignOut();
        return;
      }
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={task.title}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Pill tone={statusTone(task.status)}>{humanize(task.status)}</Pill>
        <Pill tone={priorityTone(task.priority)}>{humanize(task.priority)} priority</Pill>
      </View>
      <Muted>{task.description}</Muted>
      <Row label="From" value={task.creatorName} />
      <Row label="Due" value={formatDateTime(task.dueAt)} />
      {task.completedAt ? <Row label="Completed" value={formatDateTime(task.completedAt)} /> : null}
      {task.resolutionNote && !expanded ? <Muted>Note: {task.resolutionNote}</Muted> : null}
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {expanded ? (
        <>
          <Choice
            label="Status"
            options={FIELD_TASK_STATUSES.map((value) => ({ value, label: humanize(value) }))}
            value={nextStatus}
            onChange={setNextStatus}
          />
          <Field label="Resolution note (optional)" value={note} onChangeText={setNote} maxLength={1000} multiline />
          <Button title="Save" onPress={save} loading={busy} disabled={busy} />
          <Button title="Cancel" variant="secondary" onPress={() => setExpanded(false)} disabled={busy} />
        </>
      ) : task.status === "DONE" ? null : (
        <Button title="Update status" variant="secondary" onPress={() => setExpanded(true)} />
      )}
    </Card>
  );
}

export default function TasksScreen() {
  const { token, signOut } = useSession();
  const [tasks, setTasks] = useState<FieldTaskItem[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setTasks(await api.fetchTasks(token));
    } catch (err) {
      if (isSessionError(err)) {
        await signOut();
        return;
      }
      setError(describeError(err));
    }
  }, [signOut, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const open = tasks?.filter((task) => task.status !== "DONE") ?? [];
  const done = tasks?.filter((task) => task.status === "DONE") ?? [];

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {tasks === null && !error ? <Loading label="Loading tasks…" /> : null}
      {tasks !== null && tasks.length === 0 ? <EmptyState>No tasks have been assigned to you.</EmptyState> : null}
      {open.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          token={token}
          onSignOut={signOut}
          onUpdated={(updated) => setTasks((current) => (current ?? []).map((item) => (item.id === updated.id ? updated : item)))}
        />
      ))}
      {done.length > 0 ? (
        <Card title={`Completed (${done.length})`}>
          {done.map((task) => (
            <Row key={task.id} label={task.title} value={formatDateTime(task.completedAt)} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
