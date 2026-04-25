/**
 * TelemetrySchemaLinter tests
 *
 * Ensures Punch Club telemetry schema linting stays config-first with
 * PersistenceService integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TelemetrySchemaLinter,
  DEFAULT_TELEMETRY_SCHEMA_LINT_CONFIG,
  type TelemetrySchemaLintResult,
} from '../../../src/analytics/punchClub/telemetrySchemaLinter';
import { saveData, loadData } from '../../../src/shared/persistence/PersistenceService';

vi.mock('../../../src/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

const mockSaveData = vi.mocked(saveData);
const mockLoadData = vi.mocked(loadData);

const timestamp = 1_735_000_000_000;

describe('TelemetrySchemaLinter', () => {
  beforeEach(() => {
    mockSaveData.mockReset();
    mockLoadData.mockReset();
  });

  it('marks well-formed events as valid', async () => {
    const events = [
      {
        eventType: 'pwa_install_success',
        timestamp,
        data: {
          timestamp,
          userAgent: 'UnitTestAgent/1.0',
          platform: 'web',
          promptShown: true,
        },
      },
    ];

    const linter = new TelemetrySchemaLinter({ autoPersist: false });
    const result = await linter.lint(events, { source: 'unit-test' });

    expect(result.isValid).toBe(true);
    expect(result.summary.validEvents).toBe(1);
    expect(result.summary.issueCount).toBe(0);
    expect(result.metadata?.source).toBe('unit-test');
    expect(mockSaveData).not.toHaveBeenCalled();
  });

  it('collects schema issues for invalid events', async () => {
    const invalidEvents = [
      {
        eventType: 'pwa_install_success',
        timestamp,
        data: {
          timestamp,
          userAgent: 'UnitTestAgent/1.0',
          promptShown: 'yes', // invalid type, should be boolean
        },
      },
    ];

    const linter = new TelemetrySchemaLinter({ autoPersist: false });
    const result = await linter.lint(invalidEvents);

    expect(result.isValid).toBe(false);
    expect(result.summary.issueCount).toBeGreaterThan(0);
    expect(result.issues[0].eventIndex).toBe(0);
    expect(result.issues[0].path).toContain('promptShown');
    expect(result.summary.issuesByCategory.pwa ?? 1).toBeGreaterThan(0);
  });

  it('persists lint results when autoPersist is enabled', async () => {
    mockSaveData.mockResolvedValueOnce();

    const events = [
      {
        eventType: 'pwa_install_success',
        timestamp,
        data: {
          timestamp,
          userAgent: 'UnitTestAgent/1.0',
          promptShown: true,
        },
      },
    ];

    const config = {
      ...DEFAULT_TELEMETRY_SCHEMA_LINT_CONFIG,
      autoPersist: true,
      persistKey: 'unit-test-key',
    };

    const linter = new TelemetrySchemaLinter(config);
    await linter.lint(events);

    expect(mockSaveData).toHaveBeenCalledTimes(1);
    expect(mockSaveData).toHaveBeenCalledWith('unit-test-key', expect.any(Object));
  });

  it('loads cached results through PersistenceService', async () => {
    const storedResult: TelemetrySchemaLintResult = {
      timestamp,
      isValid: true,
      summary: {
        totalEvents: 1,
        validEvents: 1,
        invalidEvents: 0,
        issueCount: 0,
        uniqueEventTypes: 1,
        issuesByCategory: {},
      },
      issues: [],
      metadata: { source: 'cache' },
    };

    mockLoadData.mockResolvedValueOnce(storedResult);

    const linter = new TelemetrySchemaLinter({ autoPersist: false });
    const result = await linter.loadLastResult();

    expect(mockLoadData).toHaveBeenCalledWith(
      DEFAULT_TELEMETRY_SCHEMA_LINT_CONFIG.persistKey,
      null,
    );
    expect(result).toEqual(storedResult);
  });
});
