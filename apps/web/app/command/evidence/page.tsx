"use client";

import { useCallback, useEffect, useState } from "react";
import type { EvidenceAssetItem, EvidenceExplorerSummary } from "@pics-nigeria/shared";
import { fetchEvidenceExplorer } from "../../../lib/api";
import { useCommandSession } from "../../../components/command/session";
import { loadLgaNames, loadPollingUnitNames, loadWardNames, nameOf } from "../../../components/command/territory";
import {
  Badge,
  Banner,
  Empty,
  Kpi,
  Loading,
  Panel,
  clockTime,
  count,
  evidenceStatusTone,
  fileSize,
  words,
} from "../../../components/command/ui";

const REFRESH_MS = 60_000;

type KindFilter = "all" | "RESULT_SHEET" | "INCIDENT";
type StatusFilter = "all" | "VERIFIED" | "PENDING" | "FLAGGED" | "ARCHIVED";

const KIND_ICON: Record<string, string> = {
  PHOTO: "🖼",
  VIDEO: "▶",
  WRITTEN_REPORT: "🗎",
};

function statusMatches(filter: StatusFilter, status: EvidenceAssetItem["reviewStatus"]): boolean {
  switch (filter) {
    case "VERIFIED":
      return status === "VERIFIED";
    case "PENDING":
      return status === "SUBMITTED" || status === "UNDER_REVIEW";
    case "FLAGGED":
      return status === "DISPUTED" || status === "REQUIRES_CLARIFICATION";
    case "ARCHIVED":
      return status === "ARCHIVED";
    default:
      return true;
  }
}

export default function EvidencePage() {
  const { token } = useCommandSession();
  const [assets, setAssets] = useState<EvidenceAssetItem[]>([]);
  const [summary, setSummary] = useState<EvidenceExplorerSummary | null>(null);
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [lgaNames, setLgaNames] = useState<Map<string, string>>(new Map());
  const [wardNames, setWardNames] = useState<Map<string, string>>(new Map());
  const [puNames, setPuNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await fetchEvidenceExplorer(token, { limit: 100 });
      setAssets(next.evidence);
      setSummary(next.summary);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the evidence vault.");
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
    if (assets.length === 0 || wardNames.size === 0) return;
    let cancelled = false;
    void loadPollingUnitNames(
      token,
      assets.map((asset) => asset.territory.wardId),
    ).then((map) => {
      if (!cancelled) setPuNames(new Map(map));
    });
    return () => {
      cancelled = true;
    };
  }, [assets, token, wardNames]);

  const visible = assets.filter((asset) => {
    const kindOk =
      kind === "all" ||
      (kind === "RESULT_SHEET" ? asset.classification === "RESULT_SHEET" : asset.incidentId !== null);
    return kindOk && statusMatches(status, asset.reviewStatus);
  });

  if (!loaded) {
    return <Loading label="Opening the vault" />;
  }

  const resultSheets = assets.filter((asset) => asset.classification === "RESULT_SHEET").length;
  const incidentImages = assets.filter((asset) => asset.incidentId !== null).length;
  const verified = assets.filter((asset) => asset.reviewStatus === "VERIFIED").length;

  return (
    <>
      {error ? <Banner>{error}</Banner> : null}

      <div className="ec-pageHead">
        <div>
          <h2>Evidence vault</h2>
          <p>Private storage for uploaded result sheets and incident media. Originals are never served publicly.</p>
        </div>
      </div>

      <div className="ec-kpis">
        <Kpi icon="🗎" label="Total documents" value={count(summary?.total ?? assets.length)} />
        <Kpi icon="▤" tone="info" label="Result sheets" value={count(resultSheets)} />
        <Kpi icon="🖼" tone="warning" label="Incident media" value={count(incidentImages)} />
        <Kpi icon="✓" tone="success" label="Verified" value={count(verified)} />
      </div>

      <div className="ec-btnRow">
        <div className="ec-chips" role="group" aria-label="Filter by kind">
          {(
            [
              ["all", "All"],
              ["RESULT_SHEET", "Result sheet"],
              ["INCIDENT", "Incident media"],
            ] as Array<[KindFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="ec-chip"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ec-chips" role="group" aria-label="Filter by review status">
          {(
            [
              ["all", "All"],
              ["VERIFIED", "Verified"],
              ["PENDING", "Pending"],
              ["FLAGGED", "Disputed"],
              ["ARCHIVED", "Filed"],
            ] as Array<[StatusFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="ec-chip"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Panel>
          <Empty>
            {assets.length === 0
              ? "No evidence has been uploaded yet. Agents upload result sheets and incident media from the field app."
              : "No document matches these filters."}
          </Empty>
        </Panel>
      ) : (
        <div className="ec-cardGrid">
          {visible.map((asset) => (
            <article className="ec-doc" key={asset.id}>
              <div className="ec-doc-thumb">
                <span aria-hidden="true">{KIND_ICON[asset.evidenceType] ?? "🗎"}</span>
                <span className="ec-doc-status">
                  <Badge tone={evidenceStatusTone(asset.reviewStatus)}>{words(asset.reviewStatus)}</Badge>
                </span>
                <span className="ec-doc-kind">
                  <Badge tone="neutral">{words(asset.classification)}</Badge>
                </span>
              </div>
              <div className="ec-doc-body">
                <div className="ec-doc-name" title={asset.originalFileName}>
                  {asset.originalFileName}
                </div>
                <div className="ec-doc-meta">
                  {nameOf(puNames, asset.territory.pollingUnitId)} · {nameOf(lgaNames, asset.territory.lgaId)}
                </div>
                <div className="ec-doc-foot">
                  <span>{clockTime(asset.uploadedAt)}</span>
                  <span>{fileSize(asset.fileSize)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="ec-dim" style={{ fontSize: 13 }}>
        Thumbnails are placeholders: originals sit in private object storage and require a signed, audited access
        request, so the vault deliberately does not render them inline.
      </p>
    </>
  );
}
