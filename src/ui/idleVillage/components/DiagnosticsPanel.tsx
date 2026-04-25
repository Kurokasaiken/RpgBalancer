import React, { useState, useMemo, useCallback } from 'react';
import { getDiagnosticLogs, exportDiagnosticLogs, clearDiagnosticLogs } from '../utils/sandboxDiagnostics';

type DiagnosticsTab = 'picker' | 'validators' | 'risk' | 'theater' | 'drag' | 'all';

const CHANNEL_OPTIONS: { id: DiagnosticsTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'picker', label: 'Picker' },
  { id: 'validators', label: 'Validators' },
  { id: 'risk', label: 'Risk' },
  { id: 'theater', label: 'Theater' },
  { id: 'drag', label: 'Drag' },
];

const TIME_WINDOWS = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '3 hours', value: 180 },
] as const;

const isDiagnosticsPanelEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
  if (isTestEnv) {
    return true;
  }
  return Boolean(window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS || window.__ENABLE_IDLE_VILLAGE_DIAGNOSTICS);
};

/**
 * Dev-only diagnostics panel for unified sandbox logs.
 */
export const DiagnosticsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DiagnosticsTab>('all');
  const [timeFilterMinutes, setTimeFilterMinutes] = useState(5);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const handleTimeFilterChange = useCallback((value: number) => {
    setTimeFilterMinutes(value);
    setCurrentTime(Date.now());
  }, []);

  const sinceTimestamp = useMemo(() => currentTime - timeFilterMinutes * 60 * 1000, [currentTime, timeFilterMinutes]);

  const logs = useMemo(() => {
    const filter =
      activeTab === 'all' ? { since: sinceTimestamp } : { channel: activeTab, since: sinceTimestamp };
    return getDiagnosticLogs(filter);
  }, [activeTab, sinceTimestamp]);

  const handleExport = useCallback(() => {
    const json = exportDiagnosticLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox-diagnostics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(() => {
    clearDiagnosticLogs();
  }, []);

  if (!isDiagnosticsPanelEnabled()) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-96 h-96 bg-black/90 border border-white/20 rounded-lg p-4 text-white overflow-hidden flex flex-col"
      role="region"
      aria-label="Sandbox Diagnostics Panel"
      data-testid="sandbox-diagnostics-panel"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Sandbox Diagnostics</h3>
        <div className="flex gap-2">
          <button onClick={handleExport} className="text-xs px-2 py-1 bg-blue-600 rounded">
            Export
          </button>
          <button onClick={handleClear} className="text-xs px-2 py-1 bg-red-600 rounded">
            Clear
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <label htmlFor="diagnostics-channel-filter" className="sr-only">
          Diagnostics channel filter
        </label>
        <select
          id="diagnostics-channel-filter"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as DiagnosticsTab)}
          className="text-xs bg-gray-800 px-2 py-1 rounded"
        >
          {CHANNEL_OPTIONS.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.label}
            </option>
          ))}
        </select>
        <label htmlFor="diagnostics-time-filter" className="sr-only">
          Diagnostics time filter
        </label>
        <select
          id="diagnostics-time-filter"
          value={timeFilterMinutes}
          onChange={(e) => handleTimeFilterChange(Number(e.target.value))}
          className="text-xs bg-gray-800 px-2 py-1 rounded"
        >
          {TIME_WINDOWS.map((windowOption) => (
            <option key={windowOption.value} value={windowOption.value}>
              {windowOption.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto text-xs space-y-1" data-testid="diagnostic-log-list">
        {logs.map((log) => {
          const entryKey = `${log.timestamp}-${log.scope}-${log.message}`;
          return (
            <div
              key={entryKey}
              className="bg-gray-800/50 p-2 rounded"
              data-testid="diagnostic-entry"
              data-channel={log.channel}
            >
              <div className="flex justify-between">
                <span className="font-mono text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span
                  className={`px-1 rounded text-xs ${
                    log.level === 'error'
                      ? 'bg-red-600'
                      : log.level === 'warn'
                        ? 'bg-yellow-600'
                        : log.level === 'info'
                          ? 'bg-blue-600'
                          : 'bg-gray-600'
                  }`}
                  data-testid="diagnostic-level"
                >
                  {log.level}
                </span>
              </div>
              <div className="font-semibold" data-testid="diagnostic-scope">
                {log.scope}: {log.message}
              </div>
              {log.payload ? (
                <pre className="text-gray-400 mt-1" data-testid="diagnostic-payload">
                  {JSON.stringify(log.payload as Record<string, unknown>, null, 2)}
                </pre>
              ) : null}
            </div>
          );
        })}
        {logs.length === 0 && <div className="text-gray-500 text-center py-4">No logs in selected time range</div>}
      </div>
    </div>
  );
};

export default DiagnosticsPanel;
