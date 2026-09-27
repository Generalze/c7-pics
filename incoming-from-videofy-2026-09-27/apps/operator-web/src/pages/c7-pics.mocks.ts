/** @author masterzee001 */
/**
 * C7-PICS mock data for development and testing.
 */
import type { Incident, CampaignTally, LgaLeaderboardEntry, IncidentBreakdownEntry, EvidenceSummary, ReportMetrics } from './c7-pics.types';

const MOCK_INCIDENTS: readonly Incident[] = [
  {
    id: '1',
    type: 'verification',
    title: 'Inconsistent voter registration data',
    description: 'Discrepancy between voter registration records and on-ground data at PU/LGA/001.',
    severity: 'high',
    status: 'open',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    location: 'Lagos State',
    pu: 'LGA/001/PU/042',
    agent: 'Ade Okafor',
    assignedTo: 'John Okoro',
    notes: [
      {
        id: 'n1',
        author: 'John Okoro',
        text: 'Confirmed discrepancy. Awaiting recount from agent.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '2',
    type: 'reporting',
    title: 'Late results submission',
    description: 'Agent at PU/LGA/015 has not submitted results within SLA window.',
    severity: 'medium',
    status: 'escalated',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    location: 'Oyo State',
    pu: 'LGA/001/PU/015',
    agent: 'Chioma Nwosu',
    assignedTo: 'Folake Adebayo',
    notes: [
      {
        id: 'n2',
        author: 'Folake Adebayo',
        text: 'Agent contacted. Sending results in 30 minutes.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '3',
    type: 'equipment',
    title: 'BIOMETRIC device malfunction',
    description: 'Biometric verification device not functioning at PU/LGA/007. Manual process engaged.',
    severity: 'critical',
    status: 'open',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    location: 'Rivers State',
    pu: 'LGA/007/PU/028',
    agent: 'Seun Adeyemi',
    assignedTo: 'Mike Eze',
    notes: [],
  },
  {
    id: '4',
    type: 'security',
    title: 'Unauthorized access attempt',
    description: 'Multiple failed login attempts detected at operations console from unknown IP.',
    severity: 'critical',
    status: 'escalated',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    location: 'Abuja',
    assignedTo: 'Tunde Ogunleye',
    notes: [
      {
        id: 'n3',
        author: 'Tunde Ogunleye',
        text: 'IP blocked. Investigating source. Security team notified.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
    ],
  },
  {
    id: '5',
    type: 'other',
    title: 'Network connectivity issue',
    description: 'Intermittent connectivity at PU/LGA/033. Agent unable to upload evidence files.',
    severity: 'medium',
    status: 'open',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    location: 'Enugu State',
    pu: 'LGA/033/PU/011',
    agent: 'Chidiebere Onu',
    notes: [
      {
        id: 'n4',
        author: 'System',
        text: 'Automated retry initiated. Evidence queued for upload.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '6',
    type: 'verification',
    title: 'Duplicate vote entries resolved',
    description: 'Duplicate votes detected and removed from PU/LGA/002. Record updated.',
    severity: 'high',
    status: 'resolved',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: 'Kano State',
    pu: 'LGA/002/PU/055',
    agent: 'Amina Hassan',
    assignedTo: 'Ibrahim Musa',
    notes: [
      {
        id: 'n5',
        author: 'Ibrahim Musa',
        text: 'Root cause identified: duplicate scan during data entry.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: 'n6',
        author: 'Ibrahim Musa',
        text: 'Corrected. Records verified with agent. Case resolved.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '7',
    type: 'reporting',
    title: 'Missing observer attestation',
    description: 'Observer signatures missing from official result sheet at PU/LGA/009.',
    severity: 'low',
    status: 'resolved',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    location: 'Kaduna State',
    pu: 'LGA/009/PU/067',
    agent: 'Kamsi Obi',
    assignedTo: 'Grace Adebisi',
    notes: [
      {
        id: 'n7',
        author: 'Grace Adebisi',
        text: 'Observer contacted. Updated sheets received and processed.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  },
];

const MOCK_CAMPAIGNS: readonly CampaignTally[] = [
  {
    id: '1',
    campaignName: 'Federal Election 2025',
    total: 8809,
    completed: 6547,
    inProgress: 1200,
    pending: 1062,
    startDate: new Date('2025-01-01'),
  },
  {
    id: '2',
    campaignName: 'State Assembly Election',
    total: 8809,
    completed: 5234,
    inProgress: 2100,
    pending: 1475,
    startDate: new Date('2025-01-15'),
  },
];

const MOCK_LGA_LEADERBOARD: readonly LgaLeaderboardEntry[] = [
  {
    rank: 1,
    lga: 'Ifako-Ijaiye',
    coverage: 98,
    resultsReported: 124,
    agents: 28,
    pollingUnits: 124,
    averageCompletionTime: 45,
  },
  {
    rank: 2,
    lga: 'Alimosho',
    coverage: 96,
    resultsReported: 189,
    agents: 42,
    pollingUnits: 189,
    averageCompletionTime: 52,
  },
  {
    rank: 3,
    lga: 'Kosofe',
    coverage: 94,
    resultsReported: 156,
    agents: 35,
    pollingUnits: 156,
    averageCompletionTime: 58,
  },
  {
    rank: 4,
    lga: 'Surulere',
    coverage: 92,
    resultsReported: 142,
    agents: 31,
    pollingUnits: 142,
    averageCompletionTime: 61,
  },
  {
    rank: 5,
    lga: 'Ikeja',
    coverage: 90,
    resultsReported: 167,
    agents: 38,
    pollingUnits: 167,
    averageCompletionTime: 55,
  },
];

const MOCK_INCIDENT_BREAKDOWN: readonly IncidentBreakdownEntry[] = [
  { severity: 'critical', count: 3 },
  { severity: 'high', count: 8 },
  { severity: 'medium', count: 14 },
  { severity: 'low', count: 12 },
];

const MOCK_EVIDENCE_SUMMARY: EvidenceSummary = {
  photos: 24567,
  videos: 3421,
  documents: 8934,
  audio: 1234,
  total: 38156,
  size: 125 * 1024 * 1024 * 1024, // 125 GB
};

const MOCK_METRICS: ReportMetrics = {
  coverage: 78,
  verification: 86,
  activity: 93,
  resolution: 43,
};

export { MOCK_INCIDENTS, MOCK_CAMPAIGNS, MOCK_LGA_LEADERBOARD, MOCK_INCIDENT_BREAKDOWN, MOCK_EVIDENCE_SUMMARY, MOCK_METRICS };
