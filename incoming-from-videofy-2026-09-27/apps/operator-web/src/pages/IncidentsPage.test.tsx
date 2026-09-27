/** @author masterzee001 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentsPage, type Incident } from './IncidentsPage';

describe('IncidentsPage', () => {
  const mockIncidents: readonly Incident[] = [
    {
      id: '1',
      type: 'verification',
      title: 'High severity incident',
      description: 'This is a critical issue that needs attention.',
      severity: 'high',
      status: 'open',
      timestamp: new Date('2025-01-19T10:00:00Z'),
      location: 'Lagos',
      pu: 'LGA/001/PU/001',
      agent: 'Test Agent',
      assignedTo: 'Test Operator',
      notes: [],
    },
    {
      id: '2',
      type: 'reporting',
      title: 'Medium severity incident',
      description: 'This is a medium priority issue.',
      severity: 'medium',
      status: 'escalated',
      timestamp: new Date('2025-01-19T08:00:00Z'),
      location: 'Kano',
      notes: [],
    },
    {
      id: '3',
      type: 'equipment',
      title: 'Low severity incident',
      description: 'Minor issue that can be resolved.',
      severity: 'low',
      status: 'resolved',
      timestamp: new Date('2025-01-19T06:00:00Z'),
      notes: [],
    },
  ];

  const mockProps = {
    active: true,
    incidents: mockIncidents,
    onAddNote: vi.fn(),
    onMessage: vi.fn(),
    onEscalate: vi.fn(),
    onResolve: vi.fn(),
  };

  describe('rendering', () => {
    it('renders the page title and description', () => {
      render(<IncidentsPage {...mockProps} />);
      expect(screen.getByText('Incident Management')).toBeInTheDocument();
      expect(screen.getByText(/Monitor and manage incidents/)).toBeInTheDocument();
    });

    it('renders all filter tabs', () => {
      render(<IncidentsPage {...mockProps} />);
      expect(screen.getByRole('tab', { name: /ALL/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /HIGH/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /MEDIUM/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /LOW/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /OPEN/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ESCALATED/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /RESOLVED/ })).toBeInTheDocument();
    });

    it('renders incident cards', () => {
      render(<IncidentsPage {...mockProps} />);
      expect(screen.getByText('High severity incident')).toBeInTheDocument();
      expect(screen.getByText('Medium severity incident')).toBeInTheDocument();
      expect(screen.getByText('Low severity incident')).toBeInTheDocument();
    });

    it('displays incident metadata', () => {
      render(<IncidentsPage {...mockProps} />);
      expect(screen.getByText('Lagos')).toBeInTheDocument();
      expect(screen.getByText('LGA/001/PU/001')).toBeInTheDocument();
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('filters incidents by HIGH severity', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const highTab = screen.getByRole('tab', { name: /HIGH/ });
      await user.click(highTab);

      expect(screen.getByText('High severity incident')).toBeInTheDocument();
      expect(screen.queryByText('Medium severity incident')).not.toBeInTheDocument();
      expect(screen.queryByText('Low severity incident')).not.toBeInTheDocument();
    });

    it('filters incidents by OPEN status', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const openTab = screen.getByRole('tab', { name: /OPEN/ });
      await user.click(openTab);

      expect(screen.getByText('High severity incident')).toBeInTheDocument();
      expect(screen.queryByText('Medium severity incident')).not.toBeInTheDocument();
      expect(screen.queryByText('Low severity incident')).not.toBeInTheDocument();
    });

    it('filters incidents by RESOLVED status', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const resolvedTab = screen.getByRole('tab', { name: /RESOLVED/ });
      await user.click(resolvedTab);

      expect(screen.queryByText('High severity incident')).not.toBeInTheDocument();
      expect(screen.queryByText('Medium severity incident')).not.toBeInTheDocument();
      expect(screen.getByText('Low severity incident')).toBeInTheDocument();
    });

    it('shows ALL incidents when ALL tab is selected', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const allTab = screen.getByRole('tab', { name: /ALL/ });
      await user.click(allTab);

      expect(screen.getByText('High severity incident')).toBeInTheDocument();
      expect(screen.getByText('Medium severity incident')).toBeInTheDocument();
      expect(screen.getByText('Low severity incident')).toBeInTheDocument();
    });

    it('displays filter tab counts', () => {
      render(<IncidentsPage {...mockProps} />);
      // ALL tab should show 3 incidents
      const allTab = screen.getByRole('tab', { name: /ALL/ });
      expect(within(allTab).getByText('(3)')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no incidents match filter', async () => {
      const user = userEvent.setup();
      const emptyIncidents: readonly Incident[] = [];
      render(<IncidentsPage {...mockProps} incidents={emptyIncidents} />);

      expect(screen.getByText('No Incidents')).toBeInTheDocument();
      expect(screen.getByText(/No incidents matching the selected filter/)).toBeInTheDocument();
    });
  });

  describe('incident selection and detail panel', () => {
    it('opens detail panel when incident card is clicked', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      // Detail panel should show
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('closes detail panel when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      // Open detail panel
      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      // Close it
      const closeButton = screen.getByLabelText('Close details');
      await user.click(closeButton);

      // Panel should be gone
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('closes detail panel when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      // Open detail panel
      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      // Click overlay
      const overlay = screen.getByRole('presentation');
      await user.click(overlay);

      // Panel should be gone
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('displays incident details in detail panel', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      expect(screen.getByText('High severity incident')).toBeInTheDocument();
      expect(screen.getByText('This is a critical issue that needs attention.')).toBeInTheDocument();
    });

    it('displays incident notes in detail panel', async () => {
      const user = userEvent.setup();
      const incidentsWithNotes: readonly Incident[] = [
        {
          ...mockIncidents[0],
          notes: [
            {
              id: 'n1',
              author: 'John Doe',
              text: 'This is a note',
              timestamp: new Date(),
            },
          ],
        },
      ];

      render(<IncidentsPage {...mockProps} incidents={incidentsWithNotes} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      expect(screen.getByText('This is a note')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls onAddNote when note is saved', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      const noteTextarea = screen.getByLabelText('Note text');
      await user.type(noteTextarea, 'Test note');

      const saveButton = screen.getByText('Save Note');
      await user.click(saveButton);

      expect(mockProps.onAddNote).toHaveBeenCalledWith('1', 'Test note');
    });

    it('calls onEscalate when Escalate button is clicked for open incidents', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      const escalateButton = screen.getByText('Escalate');
      await user.click(escalateButton);

      expect(mockProps.onEscalate).toHaveBeenCalledWith('1');
    });

    it('calls onResolve when Resolve button is clicked', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      const resolveButton = screen.getByText('Resolve');
      await user.click(resolveButton);

      expect(mockProps.onResolve).toHaveBeenCalledWith('1');
    });

    it('calls onMessage when Message button is clicked', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const incidentCard = screen.getByLabelText(/High severity incident/);
      await user.click(incidentCard);

      const messageButton = screen.getByText('Message');
      await user.click(messageButton);

      expect(mockProps.onMessage).toHaveBeenCalledWith('1', '');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels on incident cards', () => {
      render(<IncidentsPage {...mockProps} />);
      expect(screen.getByLabelText(/High severity incident.*high severity.*open status/)).toBeInTheDocument();
    });

    it('has proper role on filter tabs', () => {
      render(<IncidentsPage {...mockProps} />);
      const allTab = screen.getByRole('tab', { name: /ALL/ });
      expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    it('updates aria-selected on filter change', async () => {
      const user = userEvent.setup();
      render(<IncidentsPage {...mockProps} />);

      const allTab = screen.getByRole('tab', { name: /ALL/ });
      const openTab = screen.getByRole('tab', { name: /OPEN/ });

      expect(allTab).toHaveAttribute('aria-selected', 'true');
      expect(openTab).toHaveAttribute('aria-selected', 'false');

      await user.click(openTab);

      expect(allTab).toHaveAttribute('aria-selected', 'false');
      expect(openTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});
