import { prisma } from '../prisma';
import { AgentActivityType, ElectionDayReportStatus, IncidentStatus } from '@prisma/client';

export enum AgentState {
  PENDING = 'pending',
  ARRIVED = 'arrived',
  VOTING_UNDERWAY = 'voting_underway',
  COUNTING = 'counting',
  RESULT_SUBMITTED = 'result_submitted',
  VERIFIED = 'verified',
  ABSENT = 'absent',
  INCIDENT = 'incident',
  /**
   * Reserved for a future "technical issue" activity type. The schema's
   * AgentActivityType has no such value today, so nothing derives this state.
   */
  TECHNICAL = 'technical',
}

export type AgentStateType = AgentState;

const OPEN_INCIDENT_STATUSES: IncidentStatus[] = [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS];

interface AgentStateInputs {
  hasOpenIncident: boolean;
  lastActivityType: AgentActivityType | null;
  latestReportStatus: ElectionDayReportStatus | null;
}

/**
 * Pure derivation of an agent's state from the facts that matter.
 * State hierarchy (top to bottom = highest priority):
 * 1. INCIDENT - agent has an open incident they reported
 * 2. ABSENT - last activity is a check-out
 * 3. VERIFIED - latest election day report approved
 * 4. RESULT_SUBMITTED - latest election day report submitted or under review
 * 5. COUNTING - last activity is an observation (counting phase)
 * 6. VOTING_UNDERWAY - last activity is voter outreach (voting phase)
 * 7. ARRIVED - last activity is a check-in, location ping, material distribution
 *    or incident response (all imply presence at the polling unit)
 * 8. PENDING - no activities recorded
 * A REJECTED report does not count as a submission; the state falls through to
 * the activity-based rules.
 */
export function deriveAgentState(inputs: AgentStateInputs): AgentState {
  const { hasOpenIncident, lastActivityType, latestReportStatus } = inputs;

  if (hasOpenIncident) {
    return AgentState.INCIDENT;
  }

  if (lastActivityType === AgentActivityType.CHECK_OUT) {
    return AgentState.ABSENT;
  }

  if (latestReportStatus === ElectionDayReportStatus.APPROVED) {
    return AgentState.VERIFIED;
  }

  if (
    latestReportStatus === ElectionDayReportStatus.SUBMITTED ||
    latestReportStatus === ElectionDayReportStatus.UNDER_REVIEW
  ) {
    return AgentState.RESULT_SUBMITTED;
  }

  switch (lastActivityType) {
    case AgentActivityType.OBSERVATION:
      return AgentState.COUNTING;
    case AgentActivityType.VOTER_OUTREACH:
      return AgentState.VOTING_UNDERWAY;
    case AgentActivityType.CHECK_IN:
    case AgentActivityType.LOCATION_PING:
    case AgentActivityType.MATERIAL_DISTRIBUTION:
    case AgentActivityType.INCIDENT_RESPONSE:
      return AgentState.ARRIVED;
    default:
      return AgentState.PENDING;
  }
}

/**
 * Determines the current state of one agent from their activities, incidents
 * and election day reports.
 */
export async function determineAgentState(agentId: string): Promise<AgentState> {
  const [openIncident, lastActivity, latestReport] = await Promise.all([
    prisma.incident.findFirst({
      where: { reportedByUserId: agentId, status: { in: OPEN_INCIDENT_STATUSES } },
      select: { id: true },
    }),
    prisma.agentActivity.findFirst({
      where: { agentUserId: agentId },
      orderBy: { createdAt: 'desc' },
      select: { type: true },
    }),
    prisma.electionDayReport.findFirst({
      where: { agentUserId: agentId },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    }),
  ]);

  return deriveAgentState({
    hasOpenIncident: openIncident !== null,
    lastActivityType: lastActivity?.type ?? null,
    latestReportStatus: latestReport?.status ?? null,
  });
}

/**
 * Get state summary for all agents, optionally limited to a senatorial district.
 */
export async function getAgentStateDistribution(senatorialDistrictId?: string) {
  const agents = await prisma.user.findMany({
    where: {
      role: 'AGENT',
      ...(senatorialDistrictId ? { agentProfile: { senatorialDistrictId } } : {}),
    },
    select: {
      id: true,
      name: true,
      agentActivities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { type: true },
      },
      electionDayReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true },
      },
      reportedIncidents: {
        where: { status: { in: OPEN_INCIDENT_STATUSES } },
        take: 1,
        select: { id: true },
      },
    },
  });

  const byState: Record<AgentState, number> = {
    [AgentState.PENDING]: 0,
    [AgentState.ARRIVED]: 0,
    [AgentState.VOTING_UNDERWAY]: 0,
    [AgentState.COUNTING]: 0,
    [AgentState.RESULT_SUBMITTED]: 0,
    [AgentState.VERIFIED]: 0,
    [AgentState.ABSENT]: 0,
    [AgentState.INCIDENT]: 0,
    [AgentState.TECHNICAL]: 0,
  };

  const agentSummaries = agents.map((agent) => {
    const state = deriveAgentState({
      hasOpenIncident: agent.reportedIncidents.length > 0,
      lastActivityType: agent.agentActivities[0]?.type ?? null,
      latestReportStatus: agent.electionDayReports[0]?.status ?? null,
    });
    byState[state]++;
    return { id: agent.id, name: agent.name, state };
  });

  return {
    total: agents.length,
    byState,
    agents: agentSummaries,
  };
}
