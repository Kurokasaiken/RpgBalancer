import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { DragEvent } from 'react';
import { useActionDetailHarness } from '../useActionDetailHarness';

describe('useActionDetailHarness', () => {
  const defaultProps: Parameters<typeof useActionDetailHarness>[0] = {
    primaryJobActivity: { label: 'Test Job' },
    effectiveJobSlotId: 'job-slot-1',
    jobAssignedResidentId: 'resident-1',
    jobAssignedResidentName: 'Test Resident',
    jobHelperText: 'Test helper text',
    slotDropStates: { 'job-slot-1': 'idle' as const },
    jobIsPlaying: false,
    jobProgressFraction: 0.5,
    jobElapsedSeconds: 30,
    jobTotalDurationSeconds: 60,
    jobRemainingSeconds: 30,
    draggingResidentId: null,
    handleWorkerDrop: vi.fn(),
    handleDragOver: vi.fn(),
    formatCycleSeconds: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useActionDetailHarness(defaultProps));

    expect(result.current.actionDetailHarnessState).toMatchObject({
      title: 'Test Job',
      slotId: 'job-slot-1',
      assignedResidentName: 'Test Resident',
      helperText: 'Test helper text',
      dropState: 'idle',
      isPlaying: false,
      progressFraction: 0.5,
      elapsedSeconds: 30,
      totalDurationSeconds: 60,
      elapsedLabel: '0:30',
      remainingLabel: '0:30',
      remainingSeconds: 30,
      showBloom: false,
    });
  });

  it('exposes dropzone handlers so the harness mirrors drag feedback', () => {
    const formatCycleSeconds = vi.fn().mockReturnValue('0:05');
    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        formatCycleSeconds,
      }),
    );

    expect(formatCycleSeconds).toHaveBeenCalledWith(30);
    expect(typeof result.current.handleJobDropzoneDrop).toBe('function');
    expect(typeof result.current.handleJobDropzoneDragOver).toBe('function');
  });

  it('should handle resident assignment', () => {
    const handleWorkerDrop = vi.fn();
    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        handleWorkerDrop,
      })
    );

    result.current.handleAssignResidentToJob('resident-2');
    expect(handleWorkerDrop).toHaveBeenCalledWith('job-slot-1', 'resident-2');
  });

  it('should handle drag over', () => {
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as DragEvent<HTMLDivElement>;

    const { result } = renderHook(() => useActionDetailHarness(defaultProps));
    result.current.handleJobDropzoneDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.dataTransfer.dropEffect).toBe('move');
  });

  it('should handle drop', () => {
    const handleWorkerDrop = vi.fn();
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { getData: vi.fn().mockReturnValue('resident-2') },
    } as unknown as DragEvent<HTMLDivElement>;

    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        handleWorkerDrop,
      })
    );

    result.current.handleJobDropzoneDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(handleWorkerDrop).toHaveBeenCalledWith('job-slot-1', 'resident-2');
  });

  it('should generate a snapshot', () => {
    const { result } = renderHook(() => useActionDetailHarness(defaultProps));
    const snapshot = result.current.getActionDetailHarnessSnapshot();

    expect(snapshot).toMatchObject({
      title: 'Test Job',
      slotId: 'job-slot-1',
      assignedResidentName: 'Test Resident',
      assignedResidentId: 'resident-1',
      helperText: 'Test helper text',
      dropState: 'idle',
      isPlaying: false,
      progressFraction: 0.5,
      elapsedSeconds: 30,
      totalDurationSeconds: 60,
      elapsedLabel: '0:30',
      remainingLabel: '0:30',
      remainingSeconds: 30,
      showBloom: false,
    });
  });

  it('should return null snapshot when slotId is null', () => {
    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        effectiveJobSlotId: null,
      })
    );
    const snapshot = result.current.getActionDetailHarnessSnapshot();
    expect(snapshot).toBeNull();
  });

  it('should show bloom when dragging resident', () => {
    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        draggingResidentId: 'dragging-resident',
      })
    );

    expect(result.current.actionDetailHarnessState.showBloom).toBe(true);
  });

  it('should handle valid drop state', () => {
    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        jobDropState: 'valid',
        draggingResidentId: 'dragging-resident',
      })
    );

    expect(result.current.actionDetailHarnessState.dropState).toBe('valid');
    expect(result.current.actionDetailHarnessState.showBloom).toBe(true);
  });

  it('should format time labels correctly', () => {
    const { result } = renderHook(() =>
      useActionDetailHarness({
        ...defaultProps,
        jobElapsedSeconds: 90, // 1:30
        jobRemainingSeconds: 30, // 0:30
      })
    );

    expect(result.current.actionDetailHarnessState.elapsedLabel).toBe('1:30');
    expect(result.current.actionDetailHarnessState.remainingLabel).toBe('0:30');
  });

  it('keeps timer progress synchronized in state and snapshot', () => {
    const { result, rerender } = renderHook(
      (props) => useActionDetailHarness(props),
      {
        initialProps: defaultProps,
      },
    );

    rerender({
      ...defaultProps,
      jobElapsedSeconds: 42,
      jobRemainingSeconds: 18,
      jobTotalDurationSeconds: 120,
    });

    expect(result.current.actionDetailHarnessState.elapsedSeconds).toBe(42);
    expect(result.current.actionDetailHarnessState.remainingSeconds).toBe(18);
    expect(result.current.getActionDetailHarnessSnapshot()?.remainingSeconds).toBe(18);
  });
});
