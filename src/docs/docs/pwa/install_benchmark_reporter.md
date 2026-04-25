# NP-261 · PWA Install Benchmark Reporter

## Overview

- Automatic benchmarking of PWA install prompt → ready → launch latencies across configurable network presets.
- Config-first design (Zod schema) with persistence via `PersistenceService` and telemetry via `trackTelemetryEvent`.
- Reporter core (`src/analytics/pwa/installBenchmarkReporter.ts`), CLI harness (`scripts/pwa/installBenchmarkCLI.ts`), and Vitest suite (`tests/unit/pwa/InstallBenchmarkReporter.test.ts`).

## Config Schema

```typescript
export interface InstallBenchmarkConfig {
  enabled: boolean;
  storageKey: string;                 // persistence key (default pwa.installBenchmark.samples)
  warningThreshold: number;           // multiplier for warning vs fail (default 1.25)
  networks: Array<{
    id: string;
    label: string;
    latencyMs: number;
    bandwidthMbps: number;
    targetSamples: number;
  }>;
  stages: Array<{
    id: string;
    label: string;
    budgetMs: number;
  }>;
  telemetry: {
    enabled: boolean;
    eventName: string;                // default pwa_install_benchmark_sampled
    emitWarningsOnly: boolean;        // skip pass events when true
  };
}
```

- `DEFAULT_INSTALL_BENCHMARK_CONFIG` ships Wi‑Fi / 5G / LTE profiles and three stages (Prompt→Accept, Accept→Ready, Ready→First Launch).
- Warning vs fail classification uses `warningThreshold`: `duration <= budget` ⇒ pass, `<= budget * threshold` ⇒ warning, otherwise fail.

## Reporter API

```typescript
const reporter = new InstallBenchmarkReporter(partialConfig?, partialDeps?);
await reporter.ready;                      // hydrate persistence
await reporter.runBenchmark('wifi');       // uses default simulated runner
await reporter.recordSample('lte', { step_a: 900, step_b: 2100 });
const samples = reporter.getSamples();
const summary = await reporter.getSummary();
const csv = await reporter.exportSamples('csv');
await reporter.clearHistory();
```

Dependencies (DI-friendly):
- `persistence.save/load` (async, defaults to `PersistenceService`).
- `telemetryPublisher` (defaults to `trackTelemetryEvent`).
- `now`/`random` helpers for deterministic tests.

## CLI Usage

`scripts/pwa/installBenchmarkCLI.ts`

```bash
node scripts/pwa/installBenchmarkCLI.ts --networks=wifi,5g --samples-per-network=3 --export=markdown

Options:
--networks=all|id1,id2    # default all configured profiles
--samples-per-network=N    # overrides profile target
--export=json|markdown|csv # output format (default markdown)
--output=path              # write export to file (default stdout)
--clear=true               # wipe persisted samples before run
```

CLI prints per-network summaries and writes/prints an export snapshot.

## Telemetry

- Event name default `pwa_install_benchmark_sampled`.
- Payload includes `sampleId`, `networkId`, `totalDurationMs`, `overallStatus`, and per-stage metrics.
- `telemetry.emitWarningsOnly = true` (default) skips pass samples to avoid noise.

## Persistence

- Samples stored under `config.storageKey` via `PersistenceService` (Tauri FS → localStorage fallback).
- `InstallBenchmarkReporter.clearHistory()` wipes in-memory + persisted history.

## Testing

`tests/unit/pwa/InstallBenchmarkReporter.test.ts` verifies:

1. Persistence hydration & clear history behavior.
2. Benchmark run path with injected runner + telemetry gating.
3. Warning-only telemetry suppression for pass samples.
4. Export formatting (Markdown/CSV) and summary aggregation.

## Safeguards

Run after changes:

```bash
npm run lint -- src/analytics/pwa scripts/pwa
npm run test -- tests/unit/pwa/InstallBenchmarkReporter.test.ts
npm run build:check
npm run kanban:lint
```

Append outputs to `test-results/np-261-install-benchmark.log` for evidence.
