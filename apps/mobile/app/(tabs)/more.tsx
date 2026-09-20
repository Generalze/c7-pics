import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as api from "../../src/lib/api";
import { describeError, isSessionError, useSession } from "../../src/lib/auth";
import { API_BASE_URL } from "../../src/lib/config";
import type { NotificationItem } from "../../src/lib/types";
import { Banner, Button, Card, EmptyState, Loading, Muted, Pill, Row, Screen, formatDateTime, humanize } from "../../src/ui/components";

export default function MoreScreen() {
  const { token, user, signOut, refreshProfile } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setNotifications(await api.fetchNotifications(token));
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
      void refreshProfile();
    }, [load, refreshProfile]),
  );

  async function markAllRead() {
    setBusy(true);
    try {
      await api.markAllNotificationsRead(token);
      setNotifications((current) => (current ?? []).map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  function confirmSignOut() {
    Alert.alert("Sign out", "Signing out ends your active agent session on this phone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  const unread = notifications?.filter((item) => !item.isRead).length ?? 0;
  const version = Constants.expoConfig?.version ?? "dev";

  return (
    <Screen onRefresh={load} refreshing={false}>
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <Card title="Account">
        <Row label="Name" value={user.name} />
        <Row label="Email" value={user.email} />
        <Row label="Phone" value={user.phone ?? "—"} />
        <Row label="Role" value={humanize(user.role)} />
        <Row label="Polling unit" value={user.agentProfile?.pollingUnitId ?? "not assigned"} />
        <Row label="GPS consent" value={formatDateTime(user.agentProfile?.gpsTrackingConsentAt)} />
        <Muted>To change your password or details, sign in on the web console.</Muted>
        <Button title="Sign out" variant="danger" onPress={confirmSignOut} />
      </Card>

      <Card title={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}>
        {notifications === null && !error ? (
          <Loading />
        ) : notifications && notifications.length === 0 ? (
          <EmptyState>No notifications.</EmptyState>
        ) : (
          notifications?.map((item) => (
            <Row
              key={item.id}
              label={formatDateTime(item.createdAt)}
              value={
                <>
                  {!item.isRead ? <Pill tone="info">New</Pill> : null}
                  {`${item.title}: ${item.message}`}
                </>
              }
            />
          ))
        )}
        {unread > 0 ? <Button title="Mark all as read" variant="secondary" onPress={markAllRead} loading={busy} disabled={busy} /> : null}
      </Card>

      <Card title="About">
        <Row label="App" value={`PICS Agent ${version}`} />
        <Row label="Server" value={API_BASE_URL.replace(/^https?:\/\//, "")} />
      </Card>
    </Screen>
  );
}
