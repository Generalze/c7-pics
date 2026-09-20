import { useRouter } from "expo-router";
import React, { useState } from "react";
import * as api from "../src/lib/api";
import { describeError, isSessionError, useSession } from "../src/lib/auth";
import { LocationPermissionError, getCurrentCoordinates } from "../src/lib/location";
import { INCIDENT_SEVERITIES, INCIDENT_TYPES, type IncidentSeverity, type IncidentType } from "../src/lib/types";
import { Banner, Button, Card, Choice, Field, Muted, Screen, humanize } from "../src/ui/components";

export default function IncidentScreen() {
  const { token, signOut } = useSession();
  const router = useRouter();
  const [type, setType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = type !== null && severity !== null && title.trim().length >= 3 && description.trim().length >= 10 && !busy;

  async function handleSubmit() {
    if (!type || !severity) return;
    setBusy(true);
    setError("");
    try {
      // Location is attached when available; an incident report must never be
      // blocked by a missing GPS fix.
      let coordinates: { latitude?: number; longitude?: number } = {};
      try {
        const fix = await getCurrentCoordinates();
        coordinates = { latitude: fix.latitude, longitude: fix.longitude };
      } catch (err) {
        if (!(err instanceof LocationPermissionError)) {
          coordinates = {};
        }
      }
      await api.reportIncident(token, {
        type,
        severity,
        title: title.trim(),
        description: description.trim(),
        ...coordinates,
      });
      router.back();
    } catch (err) {
      if (isSessionError(err)) {
        await signOut();
        return;
      }
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Card>
        <Muted>Reports go straight to the situation room for your territory. Give the facts: what, where, who, when.</Muted>
        <Choice
          label="What happened"
          options={INCIDENT_TYPES.map((value) => ({ value, label: humanize(value) }))}
          value={type}
          onChange={setType}
        />
        <Choice
          label="Severity"
          options={INCIDENT_SEVERITIES.map((value) => ({ value, label: humanize(value) }))}
          value={severity}
          onChange={setSeverity}
        />
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Short summary" maxLength={120} />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="At least 10 characters"
          maxLength={1500}
          multiline
          hint={`${description.trim().length}/1500`}
        />
        <Button title="Send incident report" variant="danger" onPress={handleSubmit} disabled={!canSubmit} loading={busy} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} disabled={busy} />
      </Card>
    </Screen>
  );
}
