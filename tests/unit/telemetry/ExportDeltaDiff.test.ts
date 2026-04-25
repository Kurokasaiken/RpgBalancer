/**
 * Export Delta Diff Unit Tests - NP-255
 * 
 * Comprehensive unit tests for telemetry export delta diff functionality.
 * 
 * @since NP-255
 * @author Vector-PC – Telemetry Schema
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import * as path from 'path';
import { runDeltaDiff, type DeltaDiffResult } from '../../../scripts/telemetry/exportDeltaDiff';

describe('ExportDeltaDiff', () => {
  const testDir = path.join(__dirname, 'temp');
  const baselineFile = path.join(testDir, 'baseline.json');
  const comparisonFile = path.join(testDir, 'comparison.json');

  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  describe('Schema Change Detection', () => {
    it('should detect added fields', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            timestamp: { type: 'number' },
          },
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            timestamp: { type: 'number' },
            newField: { type: 'string' },
          },
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].type).toBe('field_added');
      expect(result.schemaChanges[0].path).toBe('newField');
      expect(result.schemaChanges[0].severity).toBe('medium');
    });

    it('should detect removed fields', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            timestamp: { type: 'number' },
            oldField: { type: 'string' },
          },
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            timestamp: { type: 'number' },
          },
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].type).toBe('field_removed');
      expect(result.schemaChanges[0].path).toBe('oldField');
      expect(result.schemaChanges[0].severity).toBe('high');
    });

    it('should detect field type changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            count: { type: 'number' },
          },
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            count: { type: 'string' },
          },
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].type).toBe('field_type_changed');
      expect(result.schemaChanges[0].path).toBe('count');
      expect(result.schemaChanges[0].severity).toBe('medium');
    });

    it('should detect no schema changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            timestamp: { type: 'number' },
          },
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            timestamp: { type: 'number' },
          },
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(0);
    });
  });

  describe('Metric Change Detection', () => {
    it('should detect added metrics', () => {
      const baseline = {
        metrics: {
          sessions: 100,
          users: 50,
        },
        data: [],
      };

      const comparison = {
        metrics: {
          sessions: 100,
          users: 50,
          newMetric: 25,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.metricChanges).toHaveLength(1);
      expect(result.metricChanges[0].type).toBe('metric_added');
      expect(result.metricChanges[0].metricName).toBe('newMetric');
      expect(result.metricChanges[0].severity).toBe('low');
    });

    it('should detect removed metrics', () => {
      const baseline = {
        metrics: {
          sessions: 100,
          users: 50,
          oldMetric: 25,
        },
        data: [],
      };

      const comparison = {
        metrics: {
          sessions: 100,
          users: 50,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.metricChanges).toHaveLength(1);
      expect(result.metricChanges[0].type).toBe('metric_removed');
      expect(result.metricChanges[0].metricName).toBe('oldMetric');
      expect(result.metricChanges[0].severity).toBe('medium');
    });

    it('should detect value changes', () => {
      const baseline = {
        metrics: {
          sessions: 100,
          users: 50,
        },
        data: [],
      };

      const comparison = {
        metrics: {
          sessions: 150,
          users: 50,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.metricChanges).toHaveLength(1);
      expect(result.metricChanges[0].type).toBe('value_range_changed');
      expect(result.metricChanges[0].metricName).toBe('sessions');
      expect(result.metricChanges[0].oldValue).toBe(100);
      expect(result.metricChanges[0].newValue).toBe(150);
      expect(result.metricChanges[0].severity).toBe('medium');
    });

    it('should detect high severity changes', () => {
      const baseline = {
        metrics: {
          sessions: 100,
          users: 50,
        },
        data: [],
      };

      const comparison = {
        metrics: {
          sessions: 250, // 150% increase
          users: 50,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.metricChanges).toHaveLength(1);
      expect(result.metricChanges[0].severity).toBe('high');
    });

    it('should detect no metric changes', () => {
      const baseline = {
        metrics: {
          sessions: 100,
          users: 50,
        },
        data: [],
      };

      const comparison = {
        metrics: {
          sessions: 100,
          users: 50,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.metricChanges).toHaveLength(0);
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate correct summary', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        metrics: {
          sessions: 100,
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            newField: { type: 'string' },
          },
        },
        metrics: {
          sessions: 150,
          newMetric: 25,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.summary.totalChanges).toBe(3);
      expect(result.summary.schemaChanges).toBe(1);
      expect(result.summary.metricChanges).toBe(2);
      expect(result.summary.mediumChanges).toBe(3);
      expect(result.summary.highChanges).toBe(0);
      expect(result.summary.criticalChanges).toBe(0);
      expect(result.summary.lowChanges).toBe(0);
    });

    it('should pass when no critical or high changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        metrics: {
          sessions: 100,
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            newField: { type: 'string' },
          },
        },
        metrics: {
          sessions: 110, // 10% change
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.passed).toBe(true);
    });

    it('should fail when critical changes detected', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        metrics: {
          sessions: 100,
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        metrics: {
          sessions: 300, // 200% change - should be high severity
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.passed).toBe(false);
    });
  });

  describe('Filtering Options', () => {
    it('should filter by severity level', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            oldField: { type: 'string' },
          },
        },
        metrics: {
          sessions: 100,
          oldMetric: 50,
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            newField: { type: 'string' },
          },
        },
        metrics: {
          sessions: 150,
          newMetric: 25,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, { severity: 'high' });

      // Should only include high severity changes (field_removed)
      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].type).toBe('field_removed');
      expect(result.metricChanges).toHaveLength(0);
    });

    it('should filter schema-only changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        metrics: {
          sessions: 100,
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            newField: { type: 'string' },
          },
        },
        metrics: {
          sessions: 150,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, { schemaOnly: true });

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.metricChanges).toHaveLength(0);
    });

    it('should filter metrics-only changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        metrics: {
          sessions: 100,
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            newField: { type: 'string' },
          },
        },
        metrics: {
          sessions: 150,
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, { metricsOnly: true });

      expect(result.schemaChanges).toHaveLength(0);
      expect(result.metricChanges).toHaveLength(1);
    });
  });

  describe('Schema Inference', () => {
    it('should infer schema from data when no schema provided', () => {
      const baseline = {
        data: [
          {
            sessionId: 'session-123',
            count: 10,
            active: true,
          },
        ],
      };

      const comparison = {
        data: [
          {
            sessionId: 'session-123',
            count: 10,
            active: true,
            newField: 'value',
          },
        ],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].type).toBe('field_added');
      expect(result.schemaChanges[0].path).toBe('newField');
    });

    it('should handle empty arrays gracefully', () => {
      const baseline = {
        data: [],
      };

      const comparison = {
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(0);
      expect(result.metricChanges).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing baseline file', () => {
      const comparison = {
        schema: { type: 'object' },
        data: [],
      };

      writeFileSync(comparisonFile, JSON.stringify(comparison));

      expect(() => {
        runDeltaDiff('missing.json', comparisonFile, {});
      }).toThrow('Telemetry export file not found: missing.json');
    });

    it('should handle missing comparison file', () => {
      const baseline = {
        schema: { type: 'object' },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));

      expect(() => {
        runDeltaDiff(baselineFile, 'missing.json', {});
      }).toThrow('Telemetry export file not found: missing.json');
    });

    it('should handle invalid JSON', () => {
      const baseline = {
        schema: { type: 'object' },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, 'invalid json content');

      expect(() => {
        runDeltaDiff(baselineFile, comparisonFile, {});
      }).toThrow('Failed to parse telemetry export');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle nested object changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].path).toBe('user.email');
      expect(result.schemaChanges[0].type).toBe('field_added');
    });

    it('should handle array type changes', () => {
      const baseline = {
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        data: [],
      };

      const comparison = {
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        },
        data: [],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.schemaChanges).toHaveLength(1);
      expect(result.schemaChanges[0].path).toBe('tags');
      expect(result.schemaChanges[0].type).toBe('field_type_changed');
    });

    it('should extract metrics from array data', () => {
      const baseline = {
        data: [
          { sessionId: 's1', duration: 100, interactions: 5 },
          { sessionId: 's2', duration: 120, interactions: 8 },
        ],
      };

      const comparison = {
        data: [
          { sessionId: 's1', duration: 110, interactions: 5 },
          { sessionId: 's2', duration: 130, interactions: 10 },
        ],
      };

      writeFileSync(baselineFile, JSON.stringify(baseline));
      writeFileSync(comparisonFile, JSON.stringify(comparison));

      const result = runDeltaDiff(baselineFile, comparisonFile, {});

      expect(result.metricChanges).toHaveLength(2);
      expect(result.metricChanges.some(c => c.metricName === 'duration')).toBe(true);
      expect(result.metricChanges.some(c => c.metricName === 'interactions')).toBe(true);
    });
  });
});
