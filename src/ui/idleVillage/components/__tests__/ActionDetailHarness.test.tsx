import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActionDetailHarness from '../ActionDetailHarness';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

const baseProps = {
  title: 'Harness Job',
  slotId: 'job-slot-1',
  dropState: 'idle' as const,
  showBloom: false,
  isPlaying: true,
  progressFraction: 0.5,
  elapsedSeconds: 30,
  totalDurationSeconds: 120,
  elapsedLabel: '0:30',
  remainingLabel: '1:30',
  onJobDrop: vi.fn(),
  onJobDragOver: vi.fn(),
};

const createDataTransfer = (data: Record<string, string>): DataTransfer =>
  ({
    dropEffect: 'copy',
    effectAllowed: 'all',
    getData: (key: string) => data[key] ?? '',
    setData: vi.fn(),
  }) as unknown as DataTransfer;

describe('ActionDetailHarness', () => {
  it('renders timer labels and slot metadata', () => {
    render(<ActionDetailHarness {...baseProps} assignedResidentName="Test Fighter" helperText="6 gold per shift" />);

    expect(screen.getByText('Action Detail Harness')).toBeInTheDocument();
    expect(screen.getByText('Harness Job')).toBeInTheDocument();
    expect(screen.getByText('Test Fighter')).toBeInTheDocument();
    expect(screen.getByText('job-slot-1')).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('shows bloom overlay only when showBloom is true and dropState is valid', () => {
    const { rerender, queryByTestId } = render(
      <ActionDetailHarness {...baseProps} showBloom dropState="valid" />
    );

    expect(screen.getByTestId('action-detail-harness-bloom')).toBeInTheDocument();

    rerender(<ActionDetailHarness {...baseProps} showBloom dropState="invalid" />);
    expect(queryByTestId('action-detail-harness-bloom')).toBeNull();
  });

  it('invokes onJobDrop with resident id from drag payload when drop is valid', () => {
    const handleDrop = vi.fn();
    render(<ActionDetailHarness {...baseProps} dropState="valid" onJobDrop={handleDrop} />);

    const dropzone = screen.getByTestId('action-detail-harness-dropzone');
    const transfer = createDataTransfer({ [RESIDENT_DRAG_MIME]: 'resident-42', 'text/plain': 'fallback-id' });

    fireEvent.dragOver(dropzone, { dataTransfer: transfer, preventDefault: () => {} });
    fireEvent.drop(dropzone, { dataTransfer: transfer, preventDefault: () => {} });

    expect(handleDrop).toHaveBeenCalledTimes(1);
    expect(handleDrop).toHaveBeenCalledWith('resident-42');
  });

  it('prevents drop handler execution when dropState is invalid', () => {
    const handleDrop = vi.fn();
    render(<ActionDetailHarness {...baseProps} dropState="invalid" onJobDrop={handleDrop} />);

    const dropzone = screen.getByTestId('action-detail-harness-dropzone');
    const transfer = createDataTransfer({ [RESIDENT_DRAG_MIME]: 'resident-99' });

    fireEvent.drop(dropzone, { dataTransfer: transfer, preventDefault: () => {} });

    expect(handleDrop).not.toHaveBeenCalled();
  });
});
