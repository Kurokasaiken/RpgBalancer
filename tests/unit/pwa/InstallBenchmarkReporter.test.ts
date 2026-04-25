import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  InstallBenchmarkReporter,
  DEFAULT_INSTALL_BENCHMARK_CONFIG,
  type InstallBenchmarkSample,
  type InstallBenchmarkNetworkProfile,
} from '@/analytics/pwa/installBenchmarkReporter';

const networkProfile: InstallBenchmarkNetworkProfile = {
  id: 'wifi',
  label: 'Wi-Fi',
  latencyMs: 20,
  bandwidthMbps: 100,
  targetSamples: 2,
};

const stageConfigs = [
  { id: 'step_a', label: 'Step A', budgetMs: 1000 },
  { id: 'step_b', label: 'Step B', budgetMs: 2000 },
];

describe('InstallBenchmarkReporter', () => {
  const saveMock = vi.fn();
  const loadMock = vi.fn();
  const telemetryMock = vi.fn();
  const nowMock = vi.fn(() => 1_700_000_000_000);
  const randomMock = vi.fn(() => 0.42);

  beforeEach(() => {
    vi.clearAllMocks();
    loadMock.mockResolvedValue({ samples: [] });
  });

  function createReporter() {
    return new InstallBenchmarkReporter(
      {
        networks: [networkProfile],
        stages: stageConfigs,
        telemetry: { enabled: true },
      },
      {
        persistence: {
          save: saveMock,
          load: loadMock,
        },
        telemetryPublisher: telemetryMock,
        now: nowMock,
        random: randomMock,
      },
    );
  }

  it('restores samples from persistence on init', async () => {
    const persistedSample: InstallBenchmarkSample = {
      id: 'install_benchmark_wifi_1',
      timestamp: nowMock(),
      networkId: 'wifi',
      networkLabel: 'Wi-Fi',
      totalDurationMs: 1234,
      stages: [
        { id: 'step_a', label: 'Step A', budgetMs: 1000, durationMs: 1100, status: 'warning' },
      ],
      overallStatus: 'warning',
      notes: 'persisted',
    };
    loadMock.mockResolvedValueOnce({ samples: [persistedSample] });

    const reporter = createReporter();
    await reporter.ready;

    expect(reporter.getSamples()).toEqual([persistedSample]);
    expect(loadMock).toHaveBeenCalledWith(DEFAULT_INSTALL_BENCHMARK_CONFIG.storageKey, { samples: [] });
  });

  it('records benchmark results and emits telemetry for non-pass status', async () => {
    const reporter = createReporter();
    await reporter.ready;

    const customRunner = vi.fn().mockResolvedValue({
      durations: {
        step_a: 1200,
        step_b: 4000,
      },
      notes: 'manual',
    });

    const sample = await reporter.runBenchmark('wifi', customRunner);

    expect(sample.overallStatus).toBe('fail');
    expect(customRunner).toHaveBeenCalledWith(networkProfile, stageConfigs);
    expect(saveMock).toHaveBeenCalled();
    expect(telemetryMock).toHaveBeenCalledWith('pwa_install_benchmark_sampled', expect.objectContaining({
      sampleId: sample.id,
      overallStatus: 'fail',
      stages: expect.any(Array),
    }));
  });

  it('skips telemetry for passing sample when emitWarningsOnly enabled', async () => {
    const reporter = new InstallBenchmarkReporter(
      {
        networks: [networkProfile],
        stages: stageConfigs,
        telemetry: { enabled: true, emitWarningsOnly: true },
      },
      {
        persistence: {
          save: saveMock,
          load: loadMock,
        },
        telemetryPublisher: telemetryMock,
        now: nowMock,
        random: randomMock,
      },
    );
    await reporter.ready;
    const sample = await reporter.recordSample('wifi', { step_a: 900, step_b: 1500 });

    expect(sample.overallStatus).toBe('pass');
    expect(telemetryMock).not.toHaveBeenCalled();
  });

  it('exports markdown and csv formats', async () => {
    const reporter = createReporter();
    await reporter.ready;
    await reporter.recordSample('wifi', { step_a: 1100, step_b: 2100 });

    const markdown = await reporter.exportSamples('markdown');
    const csv = await reporter.exportSamples('csv');

    expect(markdown).toContain('# PWA Install Benchmark Report');
    expect(csv).toContain('sampleId,networkId');
  });

  it('computes summary metrics per network', async () => {
    const reporter = createReporter();
    await reporter.ready;
    await reporter.recordSample('wifi', { step_a: 900, step_b: 1000 });
    await reporter.recordSample('wifi', { step_a: 1200, step_b: 2500 });

    const summary = await reporter.getSummary();
    expect(summary.rows).toHaveLength(1);
    expect(summary.rows[0]).toMatchObject({
      networkId: 'wifi',
      sampleCount: 2,
      warningRate: expect.any(Number),
    });
  });

  it('clears history and persistence', async () => {
    const reporter = createReporter();
    await reporter.ready;
    await reporter.recordSample('wifi', { step_a: 1000 });

    await reporter.clearHistory();

    expect(reporter.getSamples()).toHaveLength(0);
    expect(saveMock).toHaveBeenCalledWith(expect.any(String), { samples: [] });
  });
});
