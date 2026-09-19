import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';
import { getAgentStateDistribution } from '../lib/agent-state';

const router = Router();

/**
 * GET /api/dashboard/system-status
 * Real-time operational metrics
 */
router.get('/system-status', requireAuth, async (request, response) => {
  try {
    // Get metrics from Redis (updated by Socket.IO gateway events)
    // For now, calculate from database

    const [agentCount, electionDayReportCount, submissionRate] = await Promise.all([
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.electionDayReport.count(),
      // Submissions in last minute (placeholder)
      prisma.electionDayReport.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60000), // Last minute
          },
        },
      }),
    ]);

    response.status(200).json({
      activeAgentConnections: agentCount,
      submissionsPerMinute: submissionRate,
      serverLoadPercent: Math.floor(Math.random() * 100), // TODO: Get from actual metrics
      evidenceUploads: 0, // TODO: Count from EvidenceAsset table
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
router.get('/metrics', requireAuth, async (request, response) => {
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
    ] = await Promise.all([
      prisma.pollingUnit.count(),
      prisma.electionDayReport.count({
        where: { status: { in: ['SUBMITTED', 'VERIFIED'] } },
      }),
      prisma.electionDayReport.count({ where: { status: 'VERIFIED' } }),
      prisma.electionDayReport.count({ where: { status: 'PENDING' } }),
      prisma.electionDayReport.count({ where: { status: 'FLAGGED' } }),
      getAgentStateDistribution(),
      getIncidentStats(),
      getEvidenceStats(),
    ]);

    const coverage = totalPus > 0 ? Math.round((pusReporting / totalPus) * 100) : 0;
    const verificationRate = pusReporting > 0 ? Math.round((resultsVerified / pusReporting) * 100) : 0;

    response.status(200).json({
      operationalMetrics: {
        pusReporting: {
          total: totalPus,
          reporting: pusReporting,
          percentageCompleted: coverage,
        },
        resultsVerification: {
          total: pusReporting,
          verified: resultsVerified,
          pending: resultsPending,
          flagged: resultsFlagged,
          percentageVerified: verificationRate,
        },
        incidentTracking: incidentStats,
        agentStatus: agentStates,
        evidence: evidenceStats,
      },
      partyTally: await getPartyTally(),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    response
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

async function getIncidentStats() {
  const [total, highSeverity, escalated, resolved] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({ where: { severity: 'HIGH' } }),
    prisma.incident.count({ where: { status: 'ESCALATED' } }),
    prisma.incident.count({ where: { status: 'RESOLVED' } }),
  ]);

  return {
    total,
    openHigh: highSeverity,
    escalated,
    resolved,
  };
}

async function getEvidenceStats() {
  const [total, resultSheets, incidentImages, verified, pending, flagged, filed] =
    await Promise.all([
      prisma.evidenceAsset.count(),
      prisma.evidenceAsset.count({ where: { type: 'RESULT_SHEET' } }),
      prisma.evidenceAsset.count({ where: { type: 'INCIDENT_IMAGE' } }),
      prisma.evidenceAsset.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.evidenceAsset.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.evidenceAsset.count({ where: { verificationStatus: 'FLAGGED' } }),
      prisma.evidenceAsset.count({ where: { verificationStatus: 'FILED' } }),
    ]);

  return {
    total,
    resultSheets,
    incidentImages,
    verified,
    pending,
    flagged,
    filed,
  };
}

async function getPartyTally() {
  // Sum votes by party from all verified election day reports
  const results = await prisma.electionDayReport.findMany({
    where: { status: 'VERIFIED' },
    include: { voteEntries: true },
  });

  const tallyByParty: Record<string, number> = {};
  let totalVotes = 0;

  for (const report of results) {
    for (const entry of report.voteEntries) {
      tallyByParty[entry.politicalPartyId] = (tallyByParty[entry.politicalPartyId] || 0) + entry.votes;
      totalVotes += entry.votes;
    }
  }

  // Get party names
  const parties = await prisma.politicalParty.findMany();
  const partyMap = new Map(parties.map((p) => [p.id, p.name]));

  const tally: Record<string, { votes: number; percent: number }> = {};
  for (const [partyId, votes] of Object.entries(tallyByParty)) {
    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    const partyName = partyMap.get(partyId) || partyId;
    tally[partyName.toLowerCase().replace(/\s+/g, '_')] = { votes, percent };
  }

  return tally;
}

export default router;
