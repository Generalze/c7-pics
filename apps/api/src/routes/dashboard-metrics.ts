import { Router } from 'express';
import {
  ElectionDayReportStatus,
  EvidenceClassification,
  EvidenceReviewStatus,
  EvidenceType,
  IncidentSeverity,
  IncidentStatus,
  Prisma,
} from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';
import { getAgentStateDistribution } from '../lib/agent-state';

const router = Router();

/**
 * The Command Centre is a state-wide view. It is offered to the command roles
 * that can already see every territory, plus the legacy ADMIN still in
 * migration. Coordinators are excluded because these figures are not scoped
 * to the territory they command.
 */
const requireCommandCentreRole = requireRole('SUPER_ADMIN', 'STATE_OFFICER', 'ADMIN');

/**
 * GET /api/dashboard/system-status
 * Real-time operational metrics
 */
router.get('/system-status', requireAuth, requireCommandCentreRole, async (_request, response) => {
  try {
    const [agentCount, submissionsLastMinute, evidenceUploads] = await Promise.all([
      prisma.user.count({ where: { role: 'AGENT', isActive: true } }),
      prisma.electionDayReport.count({
        where: { createdAt: { gte: new Date(Date.now() - 60_000) } },
      }),
      prisma.evidenceAsset.count(),
    ]);

    response.status(200).json({
      activeAgentConnections: agentCount,
      submissionsPerMinute: submissionsLastMinute,
      serverLoadPercent: null, // not measured yet; never fabricate a value here
      evidenceUploads,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    response
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/metrics
 * Comprehensive dashboard metrics with breakdown by status
 */
router.get('/metrics', requireAuth, requireCommandCentreRole, async (_request, response) => {
  try {
    const [
      totalPus,
      pusReporting,
      resultsVerified,
      resultsPending,
      resultsFlagged,
      agentStates,
      incidentStats,
      evidenceStats,
      partyTally,
    ] = await Promise.all([
      prisma.pollingUnit.count(),
      countPollingUnitsWithReports(),
      prisma.electionDayReport.count({ where: { status: ElectionDayReportStatus.APPROVED } }),
      prisma.electionDayReport.count({
        where: {
          status: { in: [ElectionDayReportStatus.SUBMITTED, ElectionDayReportStatus.UNDER_REVIEW] },
        },
      }),
      prisma.electionDayReport.count({ where: { status: ElectionDayReportStatus.REJECTED } }),
      getAgentStateDistribution(),
      getIncidentStats(),
      getEvidenceStats(),
      getPartyTally(),
    ]);

    const coverage = totalPus > 0 ? Math.round((pusReporting / totalPus) * 100) : 0;
    const totalReports = resultsVerified + resultsPending + resultsFlagged;
    const verificationRate =
      totalReports > 0 ? Math.round((resultsVerified / totalReports) * 100) : 0;

    response.status(200).json({
      operationalMetrics: {
        pusReporting: {
          total: totalPus,
          reporting: pusReporting,
          percentageCompleted: coverage,
        },
        resultsVerification: {
          total: totalReports,
          verified: resultsVerified,
          pending: resultsPending,
          flagged: resultsFlagged,
          percentageVerified: verificationRate,
        },
        incidentTracking: incidentStats,
        agentStatus: agentStates,
        evidence: evidenceStats,
      },
      partyTally,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    response
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/** Distinct polling units that have at least one election day report of any status. */
async function countPollingUnitsWithReports(): Promise<number> {
  const groups = await prisma.electionDayReport.groupBy({
    by: ['pollingUnitId'],
    _count: { _all: true },
  });
  return groups.length;
}

async function getIncidentStats() {
  const [total, openHigh, escalated, resolved] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({
      where: {
        severity: { in: [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL] },
        status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
      },
    }),
    // Escalation is recorded by escalatedAt, not by a status value.
    prisma.incident.count({ where: { escalatedAt: { not: null } } }),
    prisma.incident.count({
      where: { status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] } },
    }),
  ]);

  return { total, openHigh, escalated, resolved };
}

async function getEvidenceStats() {
  const [total, resultSheets, incidentImages, verified, pending, flagged, filed] =
    await Promise.all([
      prisma.evidenceAsset.count(),
      prisma.evidenceAsset.count({
        where: { classification: EvidenceClassification.RESULT_SHEET },
      }),
      prisma.evidenceAsset.count({
        where: { evidenceType: EvidenceType.PHOTO, incidentId: { not: null } },
      }),
      prisma.evidenceAsset.count({ where: { reviewStatus: EvidenceReviewStatus.VERIFIED } }),
      prisma.evidenceAsset.count({
        where: {
          reviewStatus: { in: [EvidenceReviewStatus.SUBMITTED, EvidenceReviewStatus.UNDER_REVIEW] },
        },
      }),
      prisma.evidenceAsset.count({
        where: {
          reviewStatus: {
            in: [EvidenceReviewStatus.DISPUTED, EvidenceReviewStatus.REQUIRES_CLARIFICATION],
          },
        },
      }),
      prisma.evidenceAsset.count({ where: { reviewStatus: EvidenceReviewStatus.ARCHIVED } }),
    ]);

  return { total, resultSheets, incidentImages, verified, pending, flagged, filed };
}

interface VoteEntry {
  politicalPartyId: string;
  votes: number;
}

/** ElectionDayReport.voteEntriesJson is a JSON column; keep only well-formed entries. */
function parseVoteEntries(value: Prisma.JsonValue): VoteEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: VoteEntry[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, Prisma.JsonValue>;
    const politicalPartyId = record.politicalPartyId;
    const votes = record.votes;
    if (typeof politicalPartyId !== 'string' || typeof votes !== 'number' || !Number.isFinite(votes)) {
      continue;
    }
    entries.push({ politicalPartyId, votes });
  }
  return entries;
}

async function getPartyTally() {
  // Sum votes by party across all approved election day reports.
  const reports = await prisma.electionDayReport.findMany({
    where: { status: ElectionDayReportStatus.APPROVED },
    select: { voteEntriesJson: true },
  });

  const tallyByParty = new Map<string, number>();
  let totalVotes = 0;

  for (const report of reports) {
    for (const entry of parseVoteEntries(report.voteEntriesJson)) {
      tallyByParty.set(entry.politicalPartyId, (tallyByParty.get(entry.politicalPartyId) ?? 0) + entry.votes);
      totalVotes += entry.votes;
    }
  }

  const parties = await prisma.politicalParty.findMany({ select: { id: true, name: true } });
  const partyNameById = new Map(parties.map((party) => [party.id, party.name]));

  const tally: Record<string, { votes: number; percent: number }> = {};
  for (const [partyId, votes] of tallyByParty) {
    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    const partyName = partyNameById.get(partyId) ?? partyId;
    tally[partyName.toLowerCase().replace(/\s+/g, '_')] = { votes, percent };
  }

  return tally;
}

export default router;
