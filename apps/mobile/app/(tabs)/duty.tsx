import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import * as api from "../../src/lib/api";
import { describeError, isSessionError, useSession } from "../../src/lib/auth";
import { LOCATION_PING_INTERVAL_MS } from "../../src/lib/config";
import { formatCoordinates, getCurrentCoordinates } from "../../src/lib/location";
import type { Coordinates } from "../../src/lib/types";
import { Banner, Button, Card, Field, Muted, Pill, Row, Screen, formatDateTime } from "../../src/ui/components";

type Phase = "unknown" | "off-duty" | "on-duty";

function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Check-in, check-out and the location trail. While on duty and the app is in
 * the foreground, a ping goes out every LOCATION_PING_INTERVAL_MS. Background
 * location is deliberately not requested in this release.
 */
export default function DutyScreen() {
  const { token, signOut } = useSession();
  const [phase, setPhase] = useState<Phase>("unknown");
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [lastFix, setLastFix] = useState<Coordinates | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"check-in" | "check-out" | "ping" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const { status } = await api.fetchMyStatus(token);
      const onDuty = Boolean(status?.checkedInAt);
      setPhase(onDuty ? "on-duty" : "off-duty");
      setCheckedInAt(status?.checkedInAt ?? null);
      if (status?.lastLocation) {
        setLastFix({
          latitude: status.lastLocation.latitude,
          longitude: status.lastLocation.longitude,
          ...(status.lastLocation.accuracyMeters ? { accuracyMeters: status.lastLocation.accuracyMeters } : {}),
        });
        setLastPingAt(status.lastLocation.capturedAt);
      }
    } catch (err) {
      if (isSessionError(err)) {
        await signOut();
        return;
      }
      setError(describeError(err));
    }
  }, [signOut, token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const ping = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setBusy("ping");
        setError("");
      }
      try {
        const coordinates = await getCurrentCoordinates();
        await api.sendLocationPing(token, { ...coordinates, idempotencyKey: newIdempotencyKey("ping") });
        setLastFix(coordinates);
        setLastPingAt(new Date().toISOString());
        if (!silent) setNotice("Location sent.");
      } catch (err) {
        if (isSessionError(err)) {
          await signOut();
          return;
        }
        if (!silent) setError(describeError(err));
      } finally {
        if (!silent) setBusy(null);
      }
    },
    [signOut, token],
  );

  // Periodic pings only while on duty and only while the app is in the foreground.
  useEffect(() => {
    function stop() {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }
    function start() {
      stop();
      if (phase === "on-duty") {
        timer.current = setInterval(() => void ping(true), LOCATION_PING_INTERVAL_MS);
      }
    }
    start();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") start();
      else stop();
    });
    return () => {
      stop();
      subscription.remove();
    };
  }, [phase, ping]);

  async function handleCheckIn() {
    setBusy("check-in");
    setError("");
    setNotice("");
    try {
      const coordinates = await getCurrentCoordinates();
      const result = await api.checkIn(token, {
        ...coordinates,
        ...(note.trim() ? { note: note.trim() } : {}),
        idempotencyKey: newIdempotencyKey("checkin"),
      });
      setLastFix(coordinates);
      setLastPingAt(new Date().toISOString());
      setNotice(result.message);
      setNote("");
      await loadStatus();
    } catch (err) {
      if (isSessionError(err)) {
        await signOut();
        return;
      }
      setError(describeError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleCheckOut() {
    setBusy("check-out");
    setError("");
    setNotice("");
    try {
      const coordinates = await getCurrentCoordinates();
      const result = await api.checkOut(token, {
        ...coordinates,
        ...(note.trim() ? { note: note.trim() } : {}),
        idempotencyKey: newIdempotencyKey("checkout"),
      });
      setNotice(result.message);
      setNote("");
      setPhase("off-duty");
      setCheckedInAt(null);
    } catch (err) {
      if (isSessionError(err)) {
        await signOut();
        return;
      }
      setError(describeError(err));
    } finally {
      setBusy(null);
    }
  }

  const onDuty = phase === "on-duty";

  return (
    <Screen onRefresh={loadStatus} refreshing={false}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {notice ? <Banner tone="success">{notice}</Banner> : null}

      <Card title="Duty status">
        <Pill tone={onDuty ? "success" : phase === "unknown" ? "neutral" : "warning"}>
          {phase === "unknown" ? "Checking…" : onDuty ? "On duty" : "Off duty"}
        </Pill>
        <Row label="Checked in at" value={formatDateTime(checkedInAt)} />
        <Row label="Last location sent" value={formatDateTime(lastPingAt)} />
        <Row label="Position" value={formatCoordinates(lastFix)} />
        <Muted>
          {onDuty
            ? `While this screen stays open your position is sent every ${Math.round(LOCATION_PING_INTERVAL_MS / 60000)} minutes.`
            : "Check in when you arrive at your polling unit. Your position is recorded with the check-in."}
        </Muted>
      </Card>

      <Card title={onDuty ? "Check out" : "Check in"}>
        <Field
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder={onDuty ? "e.g. leaving after counting" : "e.g. arrived, materials present"}
          maxLength={500}
          multiline
        />
        <View style={{ gap: 12 }}>
          {onDuty ? (
            <Button title="Check out" variant="danger" onPress={handleCheckOut} loading={busy === "check-out"} disabled={busy !== null} />
          ) : (
            <Button title="Check in now" onPress={handleCheckIn} loading={busy === "check-in"} disabled={busy !== null || phase === "unknown"} />
          )}
          <Button title="Send my location now" variant="secondary" onPress={() => void ping(false)} loading={busy === "ping"} disabled={busy !== null} />
        </View>
      </Card>
    </Screen>
  );
}
