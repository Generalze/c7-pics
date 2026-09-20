import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import * as api from "../../src/lib/api";
import { describeError, isSessionError, useSession } from "../../src/lib/auth";
import { formatCoordinates } from "../../src/lib/location";
import type { AgentActivity, MyStatusResponse } from "../../src/lib/types";
import { Banner, Button, Card, EmptyState, Loading, Muted, Pill, Row, Screen, formatDateTime, humanize } from "../../src/ui/components";

function reportTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "info";
    case "REJECTED":
      return "danger";
    default:
      return "warning";
  }
}

export default function StatusScreen() {
  const { token, user, signOut } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<MyStatusResponse | null>(null);
  const [activities, setActivities] = useState<AgentActivity[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextStatus, nextActivities] = await Promise.all([api.fetchMyStatus(token), api.fetchActivities(token, 10)]);
      setStatus(nextStatus);
      setActivities(nextActivities);
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

  const pu = status?.status ?? null;
  const territory = user.agentProfile;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <Card title={user.name}>
        <Muted>{user.email}</Muted>
        <Row label="Role" value={humanize(user.role)} />
        <Row label="Polling unit" value={pu?.pollingUnitName ?? territory?.pollingUnitId ?? "not assigned"} />
        {!territory?.pollingUnitId ? (
          <Banner tone="warning">
            No polling unit is assigned to your account. Check-in and reports need one; ask your coordinator.
          </Banner>
        ) : null}
      </Card>

      <Card title="Today at your polling unit">
        {status === null && !error ? (
          <Loading />
        ) : pu ? (
          <View style={{ gap: 8 }}>
            <Pill tone={pu.checkedInAt ? "success" : "warning"}>{pu.checkedInAt ? "Checked in" : "Not checked in"}</Pill>
            <Row label="Operational status" value={humanize(pu.operationalStatus)} />
            <Row label="Checked in at" value={formatDateTime(pu.checkedInAt)} />
            <Row label="Last seen" value={formatDateTime(pu.lastSeenAt)} />
            <Row label="Last location" value={formatCoordinates(pu.lastLocation)} />
            <Row label="Open incidents" value={String(pu.openIncidentCount)} />
            <Row label="Election report" value={<Pill tone={reportTone(pu.reportStatus)}>{humanize(pu.reportStatus)}</Pill>} />
            <Row label="Result submitted" value={pu.resultSubmitted ? "Yes" : "No"} />
            <Row label="Evidence received" value={pu.evidenceReceived ? "Yes" : "No"} />
          </View>
        ) : (
          <EmptyState>No status yet. Check in from the Duty tab when you arrive.</EmptyState>
        )}
        <Button title="Report an incident" variant="danger" onPress={() => router.push("/incident")} />
      </Card>

      <Card title="Recent activity">
        {activities === null ? (
          <Loading />
        ) : activities.length === 0 ? (
          <EmptyState>Nothing recorded yet.</EmptyState>
        ) : (
          activities.map((activity) => (
            <Row
              key={activity.id}
              label={formatDateTime(activity.createdAt)}
              value={`${humanize(activity.type)}${activity.note ? ` · ${activity.note}` : ""}`}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}
