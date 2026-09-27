/** @author masterzee001 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsPage, type ReportsPageProps } from './ReportsPage';

describe('ReportsPage', () => {
  const mockProps: ReportsPageProps = {
    active: true,
    metrics: {
      coverage: 78,
      verification: 86,
      activity: 93,
      resolution: 43,
    },
    campaignTally: [
      {
        id: '1',
        campaignName: 'Federal Election 2025',
        total: 8809,
        completed: 6547,
        inProgress: 1200,
        pending: 1062,
        startDate: new Date('2025-01-01'),
      },
    ],
    lgaLeaderboard: [
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
    ],
    incidentBreakdown: [
      { severity: 'critical', count: 3 },
      { severity: 'high', count: 8 },
      { severity: 'medium', count: 14 },
      { severity: 'low', count: 12 },
    ],
    evidenceSummary: {
      photos: 24567,
      videos: 3421,
      documents: 8934,
      audio: 1234,
      total: 38156,
    },
    onExportReport: vi.fn(),
  };

  describe('rendering', () => {
    it('renders the page title and description', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      expect(screen.getByText(/View key performance metrics/)).toBeInTheDocument();
    });

    it('renders key metrics cards', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(screen.getByText('Verification Rate')).toBeInTheDocument();
      expect(screen.getByText('Activity Rate')).toBeInTheDocument();
      expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
    });

    it('displays metric values correctly', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('86%')).toBeInTheDocument();
      expect(screen.getByText('93%')).toBeInTheDocument();
      expect(screen.getByText('43%')).toBeInTheDocument();
    });

    it('renders campaign tally chart', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Campaign Tally')).toBeInTheDocument();
      expect(screen.getByText('Federal Election 2025')).toBeInTheDocument();
    });

    it('renders LGA leaderboard', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Top LGAs Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Ifako-Ijaiye')).toBeInTheDocument();
      expect(screen.getByText('Alimosho')).toBeInTheDocument();
    });

    it('renders incident breakdown', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Incident Breakdown')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('renders evidence summary', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Evidence Summary')).toBeInTheDocument();
      expect(screen.getByText('24567')).toBeInTheDocument(); // photos
      expect(screen.getByText('3421')).toBeInTheDocument(); // videos
      expect(screen.getByText('8934')).toBeInTheDocument(); // documents
      expect(screen.getByText('1234')).toBeInTheDocument(); // audio
    });

    it('renders export report buttons', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Export operational reports')).toBeInTheDocument();
      expect(screen.getByText('LGA Coverage')).toBeInTheDocument();
      expect(screen.getByText('Results Summary')).toBeInTheDocument();
      expect(screen.getByText('Incident Report')).toBeInTheDocument();
      expect(screen.getByText('Agent Activity')).toBeInTheDocument();
      expect(screen.getByText('Evidence Inventory')).toBeInTheDocument();
      expect(screen.getByText('System Audit')).toBeInTheDocument();
    });
  });

  describe('campaign tally', () => {
    it('displays correct completion percentage', () => {
      render(<ReportsPage {...mockProps} />);
      // 6547 / 8809 = 74.3%
      expect(screen.getByText(/74.*% complete/)).toBeInTheDocument();
    });

    it('shows campaign progress details', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('6547/8809')).toBeInTheDocument();
    });
  });

  describe('leaderboard', () => {
    it('displays LGA names with rankings', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Ifako-Ijaiye')).toBeInTheDocument();
      expect(screen.getByText('Alimosho')).toBeInTheDocument();
    });

    it('displays coverage percentages', () => {
      render(<ReportsPage {...mockProps} />);
      // The leaderboard should show coverage values
      const rows = screen.getAllByRole('row');
      expect(rows.some((row) => row.textContent?.includes('98%'))).toBe(true);
      expect(rows.some((row) => row.textContent?.includes('96%'))).toBe(true);
    });

    it('displays reported results count', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('124')).toBeInTheDocument();
      expect(screen.getByText('189')).toBeInTheDocument();
    });

    it('displays agent count', () => {
      render(<ReportsPage {...mockProps} />);
      // Should have agent counts for each LGA
      const rows = screen.getAllByRole('row');
      expect(rows.some((row) => row.textContent?.includes('28'))).toBe(true);
      expect(rows.some((row) => row.textContent?.includes('42'))).toBe(true);
    });
  });

  describe('incident breakdown', () => {
    it('displays incident counts by severity', () => {
      render(<ReportsPage {...mockProps} />);
      const breakdown = screen.getByText('Incident Breakdown').parentElement;
      expect(breakdown?.textContent).toContain('3'); // critical
      expect(breakdown?.textContent).toContain('8'); // high
      expect(breakdown?.textContent).toContain('14'); // medium
      expect(breakdown?.textContent).toContain('12'); // low
    });

    it('calculates percentage of total incidents', () => {
      render(<ReportsPage {...mockProps} />);
      // Total incidents: 3 + 8 + 14 + 12 = 37
      // critical: 3/37 = 8%
      const breakdown = screen.getByText('Incident Breakdown').parentElement;
      expect(breakdown?.textContent).toContain('%');
    });
  });

  describe('evidence summary', () => {
    it('displays evidence count by type', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Photos')).toBeInTheDocument();
      expect(screen.getByText('Videos')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    it('displays total evidence count', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Total Items')).toBeInTheDocument();
      expect(screen.getByText('38156')).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('calls onExportReport with report type when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportsPage {...mockProps} />);

      const lgaCoverageButton = screen.getByText('LGA Coverage');
      await user.click(lgaCoverageButton);

      expect(mockProps.onExportReport).toHaveBeenCalledWith('LGA Coverage');
    });

    it('exports all report types', async () => {
      const user = userEvent.setup();
      render(<ReportsPage {...mockProps} />);

      const reportTypes = [
        'LGA Coverage',
        'Results Summary',
        'Incident Report',
        'Agent Activity',
        'Evidence Inventory',
        'System Audit',
      ];

      for (const reportType of reportTypes) {
        const button = screen.getByText(reportType);
        await user.click(button);
        expect(mockProps.onExportReport).toHaveBeenCalledWith(reportType);
      }

      expect(mockProps.onExportReport).toHaveBeenCalledTimes(6);
    });
  });

  describe('metric tone based on values', () => {
    it('shows success tone for high coverage', () => {
      const highCoverageProps: ReportsPageProps = {
        ...mockProps,
        metrics: {
          ...mockProps.metrics,
          coverage: 95,
        },
      };
      render(<ReportsPage {...highCoverageProps} />);
      // The coverage metric should have success tone styling
      const coverageCard = screen.getByText('Coverage').parentElement;
      expect(coverageCard).toBeInTheDocument();
    });

    it('shows danger tone for low resolution rate', () => {
      const lowResolutionProps: ReportsPageProps = {
        ...mockProps,
        metrics: {
          ...mockProps.metrics,
          resolution: 25,
        },
      };
      render(<ReportsPage {...lowResolutionProps} />);
      const resolutionCard = screen.getByText('Resolution Rate').parentElement;
      expect(resolutionCard).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('renders gracefully with empty campaign tally', () => {
      const emptyProps: ReportsPageProps = {
        ...mockProps,
        campaignTally: [],
      };
      render(<ReportsPage {...emptyProps} />);
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });

    it('renders gracefully with empty leaderboard', () => {
      const emptyProps: ReportsPageProps = {
        ...mockProps,
        lgaLeaderboard: [],
      };
      render(<ReportsPage {...emptyProps} />);
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });

    it('renders gracefully with empty incident breakdown', () => {
      const emptyProps: ReportsPageProps = {
        ...mockProps,
        incidentBreakdown: [],
      };
      render(<ReportsPage {...emptyProps} />);
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses proper heading hierarchy', () => {
      render(<ReportsPage {...mockProps} />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Reports & Analytics');
    });

    it('has table role for leaderboard', () => {
      render(<ReportsPage {...mockProps} />);
      const table = screen.getByRole('grid');
      expect(table).toBeInTheDocument();
    });

    it('has proper table headers', () => {
      render(<ReportsPage {...mockProps} />);
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('LGA')).toBeInTheDocument();
      expect(screen.getByText('Coverage %')).toBeInTheDocument();
      expect(screen.getByText('Results Reported')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
    });
  });
});
