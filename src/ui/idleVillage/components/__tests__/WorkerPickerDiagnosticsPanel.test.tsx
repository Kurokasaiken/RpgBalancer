import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import WorkerPickerDiagnosticsPanel from '../WorkerPickerDiagnosticsPanel';
import type { WorkerPickerTelemetryEvent } from '../WorkerPickerSheet';

describe('WorkerPickerDiagnosticsPanel', () => {
  const mockTelemetryBuffer: WorkerPickerTelemetryEvent[] = [
    { type: 'assignment_attempt', slotId: 'slot-1', residentId: 'res-1', compatibilityScore: 0.8 },
    { type: 'assignment_success', slotId: 'slot-1', residentId: 'res-1', latencyMs: 150, compatibilityScore: 0.8 },
    { type: 'assignment_cancel', slotId: 'slot-2', reason: 'backdrop' },
    { type: 'close', slotId: 'slot-1', closeDurationMs: 500, closedWithinThreshold: true },
    { type: 'open', slotId: 'slot-1', candidateCount: 5 },
  ];

  it('renders KPI metrics correctly', () => {
    render(<WorkerPickerDiagnosticsPanel telemetryBuffer={mockTelemetryBuffer} />);

    expect(screen.getByText('Worker Picker Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Avg Latency')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument(); // avg latency
    expect(screen.getByText('Close Rate')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // close rate 1/1
    expect(screen.getByText('Success Rate: 50% (1/2)')).toBeInTheDocument(); // 1 success, 1 cancel
  });

  it('renders sparklines with SVG', () => {
    render(<WorkerPickerDiagnosticsPanel telemetryBuffer={mockTelemetryBuffer} />);

    const svgElements = screen.getAllByRole('img'); // SVG is treated as img
    expect(svgElements.length).toBe(2); // latency and close sparklines
  });

  it('renders recent events table with aria labels', () => {
    render(<WorkerPickerDiagnosticsPanel telemetryBuffer={mockTelemetryBuffer} />);

    const table = screen.getByRole('table', { name: /worker picker events/i });
    expect(table).toBeInTheDocument();

    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent('Event');
    expect(headers[1]).toHaveTextContent('Details');

    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(6); // header + 5 data rows

    // Check last event (most recent)
    expect(within(table).getByText('open')).toBeInTheDocument();
    expect(within(table).getByText('Candidates: 5')).toBeInTheDocument();
  });

  it('handles empty buffer gracefully', () => {
    render(<WorkerPickerDiagnosticsPanel telemetryBuffer={[]} />);

    expect(screen.getByText('Avg Latency')).toBeInTheDocument();
    expect(screen.getByText('0ms')).toBeInTheDocument();
    expect(screen.getByText('Close Rate')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate: 0% (0/0)')).toBeInTheDocument();
  });

  it('limits buffer display to last 5 events', () => {
    const largeBuffer: WorkerPickerTelemetryEvent[] = Array.from({ length: 10 }, (_, i) => ({
      type: 'assignment_success' as const,
      slotId: `slot-${i}`,
      residentId: `res-${i}`,
      latencyMs: 100 + i * 10,
      compatibilityScore: 0.5,
    }));

    render(<WorkerPickerDiagnosticsPanel telemetryBuffer={largeBuffer} />);

    // Should show only last 5
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6); // header + 5 data rows
    // Check first data row is the 5th from end
    expect(screen.getByText('slot-5')).toBeInTheDocument(); // last 5: 5,6,7,8,9
  });
});
