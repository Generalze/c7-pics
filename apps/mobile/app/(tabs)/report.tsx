import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as api from "../../src/lib/api";
import { describeError, isSessionError, useSession } from "../../src/lib/auth";
import { REPORT_PHOTO_MAX_BYTES, VOTE_ENTRY_COUNT } from "../../src/lib/config";
import {
  ELECTION_DAY_OPENING_STATUSES,
  type ElectionDayOpeningStatus,
  type ElectionDayReportItem,
  type PoliticalPartyItem,
} from "../../src/lib/types";
import { Banner, Button, Card, Choice, Field, Loading, Muted, Pill, Row, Screen, formatDate, formatDateTime, humanize } from "../../src/ui/components";
import { colors, radius, spacing } from "../../src/ui/theme";

type Photo = { uri: string; mimeType: string; fileName: string; assetId: string | null; uploading: boolean };

type VoteRow = { politicalPartyId: string | null; votes: string };

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

async function pickPhoto(fromCamera: boolean): Promise<{ uri: string; mimeType: string; fileName: string } | null> {
  if (fromCamera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Camera permission is required to take the photo.");
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, allowsEditing: false };
  const result = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > REPORT_PHOTO_MAX_BYTES) {
    throw new Error("That photo is larger than 2 MB. Take it again at a lower resolution.");
  }
  const mimeType = asset.mimeType && ["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType) ? asset.mimeType : "image/jpeg";
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return { uri: asset.uri, mimeType, fileName: asset.fileName ?? `photo-${Date.now()}.${extension}` };
}

function PhotoSlot({
  label,
  photo,
  onPick,
  disabled,
}: {
  label: string;
  photo: Photo | null;
  onPick: (fromCamera: boolean) => void;
  disabled: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.slotLabel}>{label}</Text>
      {photo ? (
        <View style={styles.preview}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          <Pill tone={photo.assetId ? "success" : photo.uploading ? "info" : "warning"}>
            {photo.assetId ? "Uploaded" : photo.uploading ? "Uploading…" : "Upload failed"}
          </Pill>
        </View>
      ) : null}
      <View style={styles.slotButtons}>
        <Pressable style={styles.slotButton} onPress={() => onPick(true)} disabled={disabled}>
          <Text style={styles.slotButtonText}>Take photo</Text>
        </Pressable>
        <Pressable style={styles.slotButton} onPress={() => onPick(false)} disabled={disabled}>
          <Text style={styles.slotButtonText}>Choose from gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const { token, user, signOut } = useSession();
  const [parties, setParties] = useState<PoliticalPartyItem[] | null>(null);
  const [reports, setReports] = useState<ElectionDayReportItem[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [openingStatus, setOpeningStatus] = useState<ElectionDayOpeningStatus | null>(null);
  const [arrivalConfirmedAt] = useState(() => new Date().toISOString());
  const [turnout, setTurnout] = useState("");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [remarks, setRemarks] = useState("");
  const [arrivalPhoto, setArrivalPhoto] = useState<Photo | null>(null);
  const [postCountingPhoto, setPostCountingPhoto] = useState<Photo | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>(() => Array.from({ length: VOTE_ENTRY_COUNT }, () => ({ politicalPartyId: null, votes: "" })));

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextParties, nextReports] = await Promise.all([api.fetchParties(), api.fetchMyReports(token)]);
      setParties(nextParties.filter((party) => party.isApprovedByInec));
      setReports(nextReports);
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

  const todaysReport = useMemo(() => {
    const today = todayIsoDate();
    return reports?.find((report) => report.reportDate.slice(0, 10) === today) ?? null;
  }, [reports]);

  async function handlePick(kind: "arrival" | "post-counting", fromCamera: boolean) {
    setError("");
    try {
      const picked = await pickPhoto(fromCamera);
      if (!picked) return;
      const setter = kind === "arrival" ? setArrivalPhoto : setPostCountingPhoto;
      setter({ ...picked, assetId: null, uploading: true });
      const asset = await api.uploadReportPhoto(token, kind === "arrival" ? "arrival-photo" : "post-counting-photo", picked);
      setter({ ...picked, assetId: asset.id, uploading: false });
    } catch (err) {
      if (isSessionError(err)) {
        await signOut();
        return;
      }
      const setter = kind === "arrival" ? setArrivalPhoto : setPostCountingPhoto;
      setter((current) => (current ? { ...current, uploading: false, assetId: null } : current));
      setError(describeError(err));
    }
  }

  const selectedPartyIds = votes.map((row) => row.politicalPartyId).filter((id): id is string => id !== null);
  const votesComplete =
    votes.every((row) => row.politicalPartyId !== null && /^\d+$/.test(row.votes.trim())) &&
    new Set(selectedPartyIds).size === VOTE_ENTRY_COUNT;
  const canSubmit =
    !busy &&
    openingStatus !== null &&
    turnout.trim().length >= 10 &&
    arrivalPhoto?.assetId !== null &&
    arrivalPhoto !== null &&
    postCountingPhoto?.assetId !== null &&
    postCountingPhoto !== null &&
    votesComplete;

  async function handleSubmit() {
    if (!openingStatus || !arrivalPhoto?.assetId || !postCountingPhoto?.assetId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const report = await api.submitElectionReport(token, {
        reportDate: todayIsoDate(),
        openingStatus,
        arrivalConfirmedAt,
        turnoutObservation: turnout.trim(),
        ...(incidentNotes.trim() ? { incidentNotes: incidentNotes.trim() } : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        arrivalPhotoAssetId: arrivalPhoto.assetId,
        postCountingPhotoAssetId: postCountingPhoto.assetId,
        voteEntries: votes.map((row) => ({ politicalPartyId: row.politicalPartyId as string, votes: Number(row.votes.trim()) })),
      });
      setNotice(`Report submitted for ${formatDate(report.reportDate)}.`);
      setReports((current) => [report, ...(current ?? [])]);
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

  const partyOptions = (parties ?? []).map((party) => ({ value: party.id, label: party.code }));

  return (
    <Screen onRefresh={load} refreshing={false}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {notice ? <Banner tone="success">{notice}</Banner> : null}

      {!user.agentProfile?.pollingUnitId ? (
        <Banner tone="warning">You need an assigned polling unit before you can submit an election-day report.</Banner>
      ) : null}

      {todaysReport ? (
        <Card title="Today's report">
          <Pill tone={todaysReport.status === "APPROVED" ? "success" : todaysReport.status === "REJECTED" ? "danger" : "info"}>
            {humanize(todaysReport.status)}
          </Pill>
          <Row label="Submitted" value={formatDateTime(todaysReport.createdAt)} />
          <Row label="Opening" value={humanize(todaysReport.openingStatus)} />
          {todaysReport.voteEntries.map((entry) => (
            <Row key={entry.politicalPartyId} label={entry.politicalPartyName ?? entry.politicalPartyId} value={String(entry.votes)} />
          ))}
          {todaysReport.reviewNote ? <Muted>Reviewer: {todaysReport.reviewNote}</Muted> : null}
          <Muted>One report per polling unit per day. If this one is rejected, ask your coordinator before resubmitting.</Muted>
        </Card>
      ) : (
        <>
          <Card title="1 · Opening">
            <Choice
              label="Did the polling unit open?"
              options={ELECTION_DAY_OPENING_STATUSES.map((value) => ({ value, label: humanize(value) }))}
              value={openingStatus}
              onChange={setOpeningStatus}
            />
            <Row label="Arrival confirmed at" value={formatDateTime(arrivalConfirmedAt)} />
            <PhotoSlot label="Arrival photo" photo={arrivalPhoto} onPick={(camera) => void handlePick("arrival", camera)} disabled={busy} />
          </Card>

          <Card title="2 · Observations">
            <Field
              label="Turnout observation"
              value={turnout}
              onChangeText={setTurnout}
              placeholder="What you saw of turnout, queues, accreditation (at least 10 characters)"
              maxLength={1000}
              multiline
              hint={`${turnout.trim().length}/1000`}
            />
            <Field label="Incident notes (optional)" value={incidentNotes} onChangeText={setIncidentNotes} maxLength={1000} multiline />
            <Field label="Remarks (optional)" value={remarks} onChangeText={setRemarks} maxLength={1000} multiline />
          </Card>

          <Card title="3 · Results">
            {parties === null ? (
              <Loading label="Loading parties…" />
            ) : parties.length < VOTE_ENTRY_COUNT ? (
              <Banner tone="warning">
                Only {parties.length} approved parties are on record; the report needs {VOTE_ENTRY_COUNT}. Ask an administrator to
                add the missing parties before election day.
              </Banner>
            ) : (
              <Muted>Enter the count for {VOTE_ENTRY_COUNT} different parties exactly as written on the result sheet.</Muted>
            )}
            {votes.map((row, index) => (
              <View key={index} style={styles.voteRow}>
                <Choice
                  label={`Party ${index + 1}`}
                  options={partyOptions}
                  value={row.politicalPartyId as string | null}
                  onChange={(value) => setVotes((current) => current.map((item, i) => (i === index ? { ...item, politicalPartyId: value } : item)))}
                />
                <Field
                  label="Votes"
                  value={row.votes}
                  onChangeText={(text) => setVotes((current) => current.map((item, i) => (i === index ? { ...item, votes: text.replace(/[^\d]/g, "") } : item)))}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            ))}
            {selectedPartyIds.length !== new Set(selectedPartyIds).size ? (
              <Banner tone="danger">Each row must be a different party.</Banner>
            ) : null}
            <PhotoSlot
              label="Post-counting photo (result sheet)"
              photo={postCountingPhoto}
              onPick={(camera) => void handlePick("post-counting", camera)}
              disabled={busy}
            />
          </Card>

          <Button title="Submit election-day report" onPress={handleSubmit} disabled={!canSubmit} loading={busy} />
        </>
      )}

      {reports && reports.length > 0 ? (
        <Card title="Previous reports">
          {reports.map((report) => (
            <Row key={report.id} label={formatDate(report.reportDate)} value={humanize(report.status)} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  slotLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  preview: { gap: spacing.sm },
  previewImage: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.border },
  slotButtons: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  slotButton: {
    flexGrow: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  slotButtonText: { fontSize: 15, fontWeight: "600", color: colors.text },
  voteRow: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
