import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "./app";
import { prisma } from "./prisma";

type Case = {
  name: string;
  run: () => Promise<void>;
};

let baseUrl = "";
let server: http.Server | null = null;
const createdUserEmails = new Set<string>();

const SUPER_ADMIN = { email: "superadmin@pics.ng", password: "ChangeMe123!" };
const SUITE_AGENT = { email: "command-centre-agent@pics.ng", password: "TestAgent123!", userId: "" };
const SUITE_MEMBER = { email: "command-centre-member@pics.ng", password: "TestVoter123!" };

const OGUN = { stateId: "ng-state-ogun", lgaId: "", wardId: "", pollingUnitId: "" };

async function login(email: string, password: string, extra: Record<string, unknown> = {}): Promise<string> {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, ...extra }),
  });

  const payload = (await response.json()) as { token?: string; message?: string };
  assert.equal(response.status, 200, payload.message || "Login failed.");
  assert.ok(payload.token, "Login response did not include a token.");
  return payload.token;
}

async function apiRequest(
  path: string,
  options?: { method?: string; token?: string; body?: Record<string, unknown> },
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options?.method || "GET",
    headers: {
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = (await response.json()) as Record<string, unknown>;
  return { status: response.status, payload };
}

function readUserId(payload: Record<string, unknown>): string {
  const user = payload.user as { id?: string } | undefined;
  assert.ok(user?.id, "Response payload did not include a user id.");
  return user.id;
}

type MetricsPayload = {
  operationalMetrics: {
    pusReporting: { total: number; reporting: number; percentageCompleted: number };
    resultsVerification: { total: number; verified: number; pending: number; flagged: number };
    incidentTracking: { total: number; openHigh: number; escalated: number; resolved: number };
    agentStatus: {
      total: number;
      byState: Record<string, number>;
      agents: Array<{ id: string; name: string; state: string }>;
    };
    evidence: { total: number };
  };
  partyTally: Record<string, { votes: number; percent: number }>;
  lastUpdated: string;
};

const cases: Case[] = [
  {
    name: "command centre metrics refuse anonymous callers",
    run: async () => {
      const metrics = await apiRequest("/dashboard/metrics");
      assert.equal(metrics.status, 401);
      const status = await apiRequest("/dashboard/system-status");
      assert.equal(status.status, 401);
    },
  },
  {
    name: "command centre metrics refuse a member and an agent",
    run: async () => {
      for (const persona of [SUITE_MEMBER, SUITE_AGENT]) {
        // Agents must consent to GPS tracking at sign-in; members have no such step.
        const token = await login(persona.email, persona.password, { agentGpsConsent: true });
        const metrics = await apiRequest("/dashboard/metrics", { token });
        assert.equal(metrics.status, 403, `${persona.email} must not read state-wide metrics.`);
        const status = await apiRequest("/dashboard/system-status", { token });
        assert.equal(status.status, 403, `${persona.email} must not read system status.`);
      }
    },
  },
  {
    name: "command centre metrics are database counts, not constants",
    run: async () => {
      const token = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
      const [pollingUnits, agents, incidents, evidence, approvedReports, reportedUnits] = await Promise.all([
        prisma.pollingUnit.count(),
        prisma.user.count({ where: { role: "AGENT" } }),
        prisma.incident.count(),
        prisma.evidenceAsset.count(),
        prisma.electionDayReport.count({ where: { status: "APPROVED" } }),
        prisma.electionDayReport.groupBy({ by: ["pollingUnitId"] }),
      ]);
      assert.ok(pollingUnits > 0, "The suite needs Ogun polling units loaded.");
      assert.ok(agents > 0, "The suite provisions an agent, so at least one must exist.");

      const response = await apiRequest("/dashboard/metrics", { token });
      assert.equal(response.status, 200, JSON.stringify(response.payload));
      const body = response.payload as unknown as MetricsPayload;
      const metrics = body.operationalMetrics;

      assert.equal(metrics.pusReporting.total, pollingUnits);
      assert.equal(metrics.pusReporting.reporting, reportedUnits.length);
      assert.equal(metrics.agentStatus.total, agents);
      assert.equal(metrics.agentStatus.agents.length, agents);
      assert.equal(metrics.incidentTracking.total, incidents);
      assert.equal(metrics.evidence.total, evidence);
      assert.equal(metrics.resultsVerification.verified, approvedReports);
      assert.equal(
        metrics.resultsVerification.total,
        metrics.resultsVerification.verified + metrics.resultsVerification.pending + metrics.resultsVerification.flagged,
      );

      const stateTotal = Object.values(metrics.agentStatus.byState).reduce((sum, value) => sum + value, 0);
      assert.equal(stateTotal, agents, "Every agent is counted in exactly one state.");

      // The agent this suite created has no activity, no incident and no report: it is pending.
      const suiteAgent = metrics.agentStatus.agents.find((agent) => agent.id === SUITE_AGENT.userId);
      assert.ok(suiteAgent, "The provisioned agent appears in the distribution.");
      assert.equal(suiteAgent.state, "pending");
      assert.ok(metrics.agentStatus.byState.pending >= 1);
      assert.ok(!Number.isNaN(Date.parse(body.lastUpdated)));
    },
  },
  {
    name: "system status counts active agents and evidence uploads",
    run: async () => {
      const token = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
      const [activeAgents, evidence] = await Promise.all([
        prisma.user.count({ where: { role: "AGENT", isActive: true } }),
        prisma.evidenceAsset.count(),
      ]);

      const response = await apiRequest("/dashboard/system-status", { token });
      assert.equal(response.status, 200, JSON.stringify(response.payload));
      assert.equal(response.payload.activeAgentConnections, activeAgents);
      assert.equal(response.payload.evidenceUploads, evidence);
      assert.equal(response.payload.serverLoadPercent, null, "Server load is not measured and must not be invented.");
      assert.equal(typeof response.payload.submissionsPerMinute, "number");
    },
  },
];

/** Resolved from the imported Ogun reference data, never hardcoded. */
async function resolveOgunTerritory() {
  const lga = await prisma.lGA.findFirst({ where: { stateId: OGUN.stateId }, orderBy: { name: "asc" } });
  if (!lga) {
    throw new Error("Ogun reference data must be loaded before this suite.");
  }
  const ward = await prisma.ward.findFirst({
    where: {
      stateId: OGUN.stateId,
      lgaId: lga.id,
      stateConstituencyEdgeInferred: false,
      stateConstituency: { is: { federalConstituencyId: { not: null } } },
      pollingUnits: { some: {} },
    },
    orderBy: { name: "asc" },
  });
  if (!ward) {
    throw new Error("No Ogun ward with a reviewed constituency edge is present; reference data must be loaded before this suite.");
  }
  const pollingUnit = await prisma.pollingUnit.findFirst({
    where: { stateId: OGUN.stateId, wardId: ward.id },
    orderBy: { name: "asc" },
  });
  if (!pollingUnit) {
    throw new Error("No Ogun polling unit is present; reference data must be loaded before this suite.");
  }
  OGUN.lgaId = lga.id;
  OGUN.wardId = ward.id;
  OGUN.pollingUnitId = pollingUnit.id;
}

/** The suite provisions the agent and member it signs in as, through the product's own paths. */
async function createSuitePersonas() {
  const adminToken = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);

  createdUserEmails.add(SUITE_AGENT.email);
  const agent = await apiRequest("/admin/agents", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Command Centre Agent",
      email: SUITE_AGENT.email,
      password: SUITE_AGENT.password,
      phone: "08031111199",
      politicalPartyId: "seed-party-independent-alliance",
      stateId: OGUN.stateId,
      lgaId: OGUN.lgaId,
      wardId: OGUN.wardId,
      pollingUnitId: OGUN.pollingUnitId,
    },
  });
  assert.equal(agent.status, 201, JSON.stringify(agent.payload));
  SUITE_AGENT.userId = readUserId(agent.payload);

  createdUserEmails.add(SUITE_MEMBER.email);
  const member = await apiRequest("/auth/register-voter", {
    method: "POST",
    body: {
      fullName: "Command Centre Member",
      email: SUITE_MEMBER.email,
      phone: "08039990199",
      password: SUITE_MEMBER.password,
      voterCardNumber: `VIN-COMMAND-CENTRE-${Date.now()}`,
      stateId: OGUN.stateId,
      lgaId: OGUN.lgaId,
      wardId: OGUN.wardId,
      pollingUnitId: OGUN.pollingUnitId,
      acceptTerms: true,
      acceptPrivacy: true,
      contactConsent: true,
      confirmAdult: true,
    },
  });
  assert.equal(member.status, 201, JSON.stringify(member.payload));
}

async function setup() {
  await resolveOgunTerritory();
  server = http.createServer(createApp());
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not start.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  await createSuitePersonas();
}

async function teardown() {
  if (createdUserEmails.size > 0) {
    await prisma.user.deleteMany({ where: { email: { in: Array.from(createdUserEmails) } } });
  }

  await prisma.$disconnect();

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

export async function runDashboardMetricsTests() {
  await setup();
  const failures: string[] = [];

  try {
    for (const testCase of cases) {
      try {
        await testCase.run();
        console.log(`PASS ${testCase.name}`);
      } catch (error) {
        failures.push(`${testCase.name}: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`FAIL ${testCase.name}`);
      }
    }
  } finally {
    await teardown();
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}
