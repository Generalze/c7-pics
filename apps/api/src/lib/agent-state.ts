import { prisma } from '../prisma';
import { AgentActivityType } from '@prisma/client';

export enum AgentState {
  PENDING = 'pending',
  ARRIVED = 'arrived',
  VOTING_UNDERWAY = 'voting_underway',
  COUNTING = 'counting',
  RESULT_SUBMITTED = 'result_submitted',
  VERIFIED = 'verified',
  ABSENT = 'absent',
  INCIDENT = 'incident',
  TECHNICAL = 'technical',
}

export type AgentStateType = AgentState;

/**
 * Determines the current state of an agent based on their activities and election day report status.
 * State hierarchy (top to bottom = highest priority):
 * 1. INCIDENT - if agent has open incident
 * 2. TECHNICAL - if last activity is technical issue
 * 3. ABSENT - if last activity is check-out
 * 4. VERIFIED - if result submitted and verified
 * 5. RESULT_SUBMITTED - if result submitted but not verified
 * 6. COUNTING - if last activity indicates counting phase
 * 7. VOTING_UNDERWAY - if last activity indicates voting phase
 * 8. ARRIVED - if checked in (last activity is check-in)
 * 9. PENDING - default/no activities
 */
export async function determineAgentState(agentId: string): Promise<AgentState> {
  const [hasOpenIncident, lastActivity, electionDayReport] = await Promise.all([
    hasOpenIncidentForAgent(agentId),
    getLastActivityForAgent(agentId),
    getLatestElectionDayReport(agentId),
  ]);

  // Priority 1: Check for open incidents
  if (hasOpenIncident) {
    return AgentState.INCIDENT;
  }

  // Priority 2: Check for technical issues
  if (lastActivity?.type === AgentActivityType.TECHNICAL_ISSUE) {
    return AgentState.TECHNICAL;
  }

  // Priority 3: Check for check-out
  if (lastActivity?.type === AgentActivityType.CHECK_OUT) {
    return AgentState.ABSENT;
  }

  // Priority 4-5: Check election day report status
  if (electionDayReport) {
    // Check if result is verified
    if (electionDayReport.status === 'VERIFIED') {
      return AgentState.VERIFIED;
    }

    // If report exists but not verified
    if (electionDayReport.status === 'SUBMITTED' || electionDayReport.status === 'PENDING') {
      return AgentState.RESULT_SUBMITTED;
    }
  }

  // Priority 6: Check for counting activity
  if (lastActivity?.type === AgentActivityType.OBSERVATION) {
    return AgentState.COUNTING;
  }

  // Priority 7: Check for voting underway activity
  if (lastActivity?.type === AgentActivityType.VOTER_OUTREACH) {
    return AgentState.VOTING_UNDERWAY;
  }

  // Priority 8: Check for check-in
  if (lastActivity?.type === AgentActivityType.CHECK_IN) {
    return AgentState.ARRIVED;
  }

  // Priority 9: No activities recorded
  return AgentState.PENDING;
}

async function hasOpenIncidentForAgent(agentId: string): Promise<boolean> {
  const openIncident = await prisma.incident.findFirst({
    where: {
      reportingAgentId: agentId,
      status: {
        in: ['OPEN', 'IN_PROGRESS'],
      },
    },
  });

  return !!openIncident;
}

async function getLastActivityForAgent(agentId: string) {
  const user = await prisma.user.findUnique({
    where: { id: agentId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return user?.activities[0] || null;
}

async function getLatestElectionDayReport(agentId: string) {
  const user = await prisma.user.findUnique({
    where: { id: agentId },
    include: {
      electionDayReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return user?.electionDayReports[0] || null;
}

/**
 * Get state summary for all agents in a territory
 */
export async function getAgentStateDistribution(senatorialDistrictId?: string) {
  const agents = await prisma.user.findMany({
    where: {
      role: 'AGENT',
      ...(senatorialDistrictId ? { agentProfile: { senatorialDistrictId } } : {}),
    },
    include: {
      agentProfile: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      electionDayReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      incidents: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        take: 1,
      },
    },
  });

  const states: Record<AgentState, number> = {
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

  for (const agent of agents) {
    const state = await determineAgentState(agent.id);
    states[state]++;
  }

  return {
    total: agents.length,
    byState: states,
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      state: determineAgentState(agent.id),
    })),
  };
}
