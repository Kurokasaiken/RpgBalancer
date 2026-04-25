import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiagnosticsPanel from '../../src/ui/idleVillage/components/DiagnosticsPanel';
import type { DiagnosticsFilter } from '../../src/ui/idleVillage/utils/sandboxDiagnostics';

const {
  baseTimestamp,
  getDiagnosticLogsMock,
  exportDiagnosticLogsMock,
  clearDiagnosticLogsMock,
} = vi.hoisted(() => {
  const timestamp = 1_736_012_800_000;
  const logs = [
    {
      channel: 'picker',
      timestamp: timestamp - 30_000,
      level: 'info' as const,
      scope: 'PickerDiagnostics',
      message: 'Picker opened',
      payload: { residentId: 'ws11-resident-1' },
    },
    {
      channel: 'validators',
      timestamp: timestamp - 20_000,
      level: 'warn' as const,
      scope: 'ValidatorDiagnostics',
      message: 'Drop blocked',
      payload: { reason: 'fatigue' },
    },
    {
      channel: 'risk',
      timestamp: timestamp - 10_000,
      level: 'debug' as const,
      scope: 'RiskDiagnostics',
      message: 'Risk snapshot',
      payload: { injury: 45, death: 12 },
    },
  ];

  const getMock = vi.fn((filter: DiagnosticsFilter = {}) => {
    let filtered = [...logs];
    const { channel, since } = filter;
    if (channel) {
      filtered = filtered.filter((log) => log.channel === channel);
    }
    if (typeof since === 'number') {
      filtered = filtered.filter((log) => log.timestamp >= since);
    }
    return filtered;
  });

  const exportMock = vi.fn(() => JSON.stringify({ logs }));
  const clearMock = vi.fn();

  return {
    baseTimestamp: timestamp,
    getDiagnosticLogsMock: getMock,
    exportDiagnosticLogsMock: exportMock,
    clearDiagnosticLogsMock: clearMock,
  };
});

declare global {
  interface Window {
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  }
}

vi.mock('../../src/ui/idleVillage/utils/sandboxDiagnostics', async () => {
  const actual = await vi.importActual<typeof import('../../src/ui/idleVillage/utils/sandboxDiagnostics')>(
    '../../src/ui/idleVillage/utils/sandboxDiagnostics',
  );
  return {
    ...actual,
    getDiagnosticLogs: getDiagnosticLogsMock,
    exportDiagnosticLogs: exportDiagnosticLogsMock,
    clearDiagnosticLogs: clearDiagnosticLogsMock,
  };
});

describe('DiagnosticsPanel', () => {
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalRevokeObjectURL = global.URL.revokeObjectURL;
  let anchorClickSpy: ReturnType<typeof vi.spyOn>;
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    anchorClickSpy = vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterAll(() => {
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    anchorClickSpy.mockRestore();
  });

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(baseTimestamp);
    window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
    getDiagnosticLogsMock.mockClear();
    exportDiagnosticLogsMock.mockClear();
    clearDiagnosticLogsMock.mockClear();
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('renders logs for all channels and filters by selected tab', async () => {
    const { container } = render(<DiagnosticsPanel />);

    const panel = screen.getByTestId('sandbox-diagnostics-panel');
    expect(panel).toBeVisible();

    // Default tab shows all logs
    expect(panel).toHaveTextContent(/PickerDiagnostics: Picker opened/);
    expect(panel).toHaveTextContent(/ValidatorDiagnostics: Drop blocked/);
    expect(panel).toHaveTextContent(/RiskDiagnostics: Risk snapshot/);
    expect(getDiagnosticLogsMock).toHaveBeenLastCalledWith({ since: baseTimestamp - 5 * 60 * 1000 });

    // Switch to validators tab
    const channelSelect = screen.getByLabelText(/Diagnostics channel filter/i);
    await userEvent.selectOptions(channelSelect, 'validators');

    let list = screen.getByTestId('diagnostic-log-list');
    const validatorEntries = within(list).getAllByTestId('diagnostic-entry');
    expect(validatorEntries).toHaveLength(1);
    expect(validatorEntries[0]).toHaveAttribute('data-channel', 'validators');
    expect(getDiagnosticLogsMock).toHaveBeenLastCalledWith({
      channel: 'validators',
      since: baseTimestamp - 5 * 60 * 1000,
    });

    expect(container).toMatchSnapshot('diagnostics-panel-validator-view');

    // Switch to risk tab
    await userEvent.selectOptions(channelSelect, 'risk');
    list = screen.getByTestId('diagnostic-log-list');
    const riskEntries = within(list).getAllByTestId('diagnostic-entry');
    expect(riskEntries).toHaveLength(1);
    expect(riskEntries[0]).toHaveAttribute('data-channel', 'risk');
    expect(getDiagnosticLogsMock).toHaveBeenLastCalledWith({
      channel: 'risk',
      since: baseTimestamp - 5 * 60 * 1000,
    });

    expect(container).toMatchSnapshot('diagnostics-panel-risk-view');
  });

  it('exports and clears logs via actions', async () => {
    render(<DiagnosticsPanel />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    await userEvent.click(exportButton);
    expect(exportDiagnosticLogsMock).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalled();

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);
    expect(clearDiagnosticLogsMock).toHaveBeenCalledTimes(1);
  });
});
