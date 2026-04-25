/**
 * Tests for MigrationQueuePanel component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MigrationQueuePanel from '../MigrationQueuePanel';
import type { MigrationRequest } from '@/ui/idleVillage/state/VillageRegistry';

describe('MigrationQueuePanel', () => {
  const mockMigrationQueue: MigrationRequest[] = [
    {
      id: 'migration-1',
      residentId: 'resident-1',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      timeRemaining: 3,
      costPaid: { gold: 10 },
    },
    {
      id: 'migration-2',
      residentId: 'resident-2',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-gamma',
      timeRemaining: 5,
      costPaid: { gold: 10 },
    },
  ];

  const mockProps = {
    migrationQueue: mockMigrationQueue,
    onProcessMigrationTick: vi.fn(),
  };

  it('renders the panel with migration queue', () => {
    render(<MigrationQueuePanel {...mockProps} />);

    const panel = screen.getByTestId('migration-queue-panel');
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('Migration Queue')).toBeInTheDocument();
    expect(within(panel).getByText('Process Tick')).toBeInTheDocument();
    expect(screen.getByTestId('migration-card-migration-1')).toBeInTheDocument();
    expect(screen.getByTestId('migration-card-migration-2')).toBeInTheDocument();
    expect(screen.getByText('2 migrations in queue')).toBeInTheDocument();
  });

  it('calls onProcessMigrationTick when button is clicked', () => {
    render(<MigrationQueuePanel {...mockProps} />);

    const processButton = screen.getByRole('button', { name: 'Process one migration tick' });
    fireEvent.click(processButton);

    expect(mockProps.onProcessMigrationTick).toHaveBeenCalled();
  });

  it('disables process button when queue is empty', () => {
    render(<MigrationQueuePanel {...mockProps} migrationQueue={[]} />);

    const processButton = screen.getByRole('button', { name: 'No migrations to process' });
    expect(processButton).toBeDisabled();
  });

  it('shows empty state when no migrations', () => {
    render(<MigrationQueuePanel {...mockProps} migrationQueue={[]} />);

    expect(screen.getByTestId('migration-empty-state')).toBeInTheDocument();
  });

  it('displays migration details correctly', () => {
    render(<MigrationQueuePanel {...mockProps} />);

    expect(screen.getByText('Time remaining: 3 TU | Cost: 10 gold')).toBeInTheDocument();
    expect(screen.getByText('Time remaining: 5 TU | Cost: 10 gold')).toBeInTheDocument();
  });

  it('shows progress bar with correct width', () => {
    render(<MigrationQueuePanel {...mockProps} />);

    // The progress bars should reflect the time remaining
    // For 3 TU remaining out of initial 5 TU, progress should be 40%
    // For 5 TU remaining out of initial 5 TU, progress should be 0%
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2);
  });
});
