/**
 * Unit tests for Stress Testing Report Export Pipeline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { exportStressReport, generateRanking } from '../exportStressReport';
import type { StressTestAnalysis, SynergyResult } from '../../../src/balancing/stressTesting/types';

// Mock fs operations
vi.mock('node:fs/promises');
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

describe('exportStressReport', () => {
  const mockAnalysis: StressTestAnalysis = {
    archetypes: [
      { id: 'baseline', name: 'Baseline', description: 'Baseline archetype', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'baseline' },
      { id: 'hp-single', name: 'HP Single', description: 'HP single stat test', stats: { hp: 125 }, testedStats: ['hp'], pointsPerStat: 25, seed: 123, type: 'single' }
    ],
    marginalUtilities: [
      {
        archetype: { id: 'hp-single', name: 'HP Single', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'single' } as any,
        averageScore: 0.6,
        marginalUtility: 0.1,
        standardDeviation: 0.05,
        simulationCount: 10000,
        runtimeMs: 150
      }
    ],
    synergies: [
      {
        pairArchetype: { id: 'hp-damage', name: 'HP + Damage', stats: {}, testedStats: ['hp', 'damage'], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
        statIds: ['hp', 'damage'],
        pairScore: 0.75,
        expectedScore: 0.6,
        synergyMultiplier: 1.25,
        isOpSynergy: true,
        isWeakSynergy: false,
        runtimeMs: 200
      },
      {
        pairArchetype: { id: 'speed-armor', name: 'Speed + Armor', stats: {}, testedStats: ['speed', 'armor'], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
        statIds: ['speed', 'armor'],
        pairScore: 0.45,
        expectedScore: 0.5,
        synergyMultiplier: 0.9,
        isOpSynergy: false,
        isWeakSynergy: true,
        runtimeMs: 180
      }
    ],
    heatmapData: { hp: { damage: 1.25, speed: 1.0 }, damage: { hp: 1.25, speed: 0.95 } },
    config: {
      pointsPerStat: 25,
      simulationCount: 10000,
      opSynergyThreshold: 1.15,
      weakSynergyThreshold: 0.95,
      seed: 123,
      includeDerived: true,
      includeHidden: false
    },
    timestamp: Date.now(),
    totalRuntimeMs: 5000
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mkdir as any).mockResolvedValue(undefined);
    (writeFile as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create output directory and export all formats', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(mockAnalysis));
    
    const config = {
      input: '/input/analysis.json',
      output: '/output',
      opThreshold: 1.15,
      weakThreshold: 0.95,
      includeDetails: true,
      generateCsv: true,
      generateMarkdown: true
    };

    await exportStressReport(config);

    expect(mockMkdir).toHaveBeenCalledWith('/output', { recursive: true });
    expect(mockReadFile).toHaveBeenCalledWith('/input/analysis.json', 'utf-8');
    
    // Should export JSON, CSV files, and Markdown
    expect(mockWriteFile).toHaveBeenCalledTimes(4); // JSON + 2 CSV + Markdown
  });

  it('should handle invalid input file gracefully', async () => {
    mockReadFile.mockRejectedValue(new Error('File not found'));
    
    const config = {
      input: '/nonexistent.json',
      output: '/output',
      opThreshold: 1.15,
      weakThreshold: 0.95,
      includeDetails: true,
      generateCsv: true,
      generateMarkdown: true
    };

    await expect(exportStressReport(config)).rejects.toThrow('File not found');
  });

  it('should validate analysis structure', async () => {
    const invalidAnalysis = { invalid: 'data' };
    mockReadFile.mockResolvedValue(JSON.stringify(invalidAnalysis));
    
    const config = {
      input: '/invalid.json',
      output: '/output',
      opThreshold: 1.15,
      weakThreshold: 0.95,
      includeDetails: true,
      generateCsv: true,
      generateMarkdown: true
    };

    await expect(exportStressReport(config)).rejects.toThrow('Invalid analysis file');
  });

  it('should export only requested formats', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(mockAnalysis));
    
    const config = {
      input: '/input/analysis.json',
      output: '/output',
      opThreshold: 1.15,
      weakThreshold: 0.95,
      includeDetails: false,
      generateCsv: false,
      generateMarkdown: false
    };

    await exportStressReport(config);

    // Should only export JSON
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
  });

  it('should generate correct JSON structure', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(mockAnalysis));
    
    const config = {
      input: '/input/analysis.json',
      output: '/output',
      opThreshold: 1.2,
      weakThreshold: 0.9,
      includeDetails: false,
      generateCsv: false,
      generateMarkdown: false
    };

    await exportStressReport(config);

    const jsonCall = mockWriteFile.mock.calls.find(call => 
      call[0].toString().endsWith('.json')
    );
    
    expect(jsonCall).toBeDefined();
    const exportedData = JSON.parse(jsonCall![1] as string);
    
    expect(exportedData).toHaveProperty('metadata');
    expect(exportedData).toHaveProperty('summary');
    expect(exportedData).toHaveProperty('ranking');
    expect(exportedData.metadata.thresholds.op).toBe(1.2);
    expect(exportedData.metadata.thresholds.weak).toBe(0.9);
    expect(exportedData.details).toBeUndefined(); // Should be excluded
  });

  it('should include details when requested', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(mockAnalysis));
    
    const config = {
      input: '/input/analysis.json',
      output: '/output',
      opThreshold: 1.15,
      weakThreshold: 0.95,
      includeDetails: true,
      generateCsv: false,
      generateMarkdown: false
    };

    await exportStressReport(config);

    const jsonCall = mockWriteFile.mock.calls.find(call => 
      call[0].toString().endsWith('.json')
    );
    
    const exportedData = JSON.parse(jsonCall![1] as string);
    expect(exportedData.details).toBeDefined();
    expect(exportedData.details.marginalUtilities).toHaveLength(1);
    expect(exportedData.details.synergies).toHaveLength(2);
  });
});

describe('generateRanking', () => {
  const mockSynergies: SynergyResult[] = [
    {
      pairArchetype: { id: 'op1', name: 'OP 1', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
      statIds: ['hp', 'damage'],
      pairScore: 0.8,
      expectedScore: 0.6,
      synergyMultiplier: 1.33,
      isOpSynergy: true,
      isWeakSynergy: false,
      runtimeMs: 200
    },
    {
      pairArchetype: { id: 'op2', name: 'OP 2', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
      statIds: ['speed', 'armor'],
      pairScore: 0.7,
      expectedScore: 0.55,
      synergyMultiplier: 1.27,
      isOpSynergy: true,
      isWeakSynergy: false,
      runtimeMs: 180
    },
    {
      pairArchetype: { id: 'weak1', name: 'Weak 1', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
      statIds: ['crit', 'evasion'],
      pairScore: 0.4,
      expectedScore: 0.5,
      synergyMultiplier: 0.8,
      isOpSynergy: false,
      isWeakSynergy: true,
      runtimeMs: 150
    },
    {
      pairArchetype: { id: 'extreme', name: 'Extreme', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
      statIds: ['hp', 'regen'],
      pairScore: 0.9,
      expectedScore: 0.4,
      synergyMultiplier: 2.25,
      isOpSynergy: true,
      isWeakSynergy: false,
      runtimeMs: 220
    }
  ];

  it('should rank OP synergies correctly', () => {
    const ranking = generateRanking(mockSynergies, 1.15, 0.95);
    
    expect(ranking.topSynergies).toHaveLength(3);
    expect(ranking.topSynergies[0]).toMatchObject({
      stat1: 'hp',
      stat2: 'regen',
      multiplier: 2.25,
      pairScore: 0.9,
      expectedScore: 0.4
    });
    expect(ranking.topSynergies[1]).toMatchObject({
      stat1: 'hp',
      stat2: 'damage',
      multiplier: 1.33
    });
  });

  it('should rank weak synergies correctly', () => {
    const ranking = generateRanking(mockSynergies, 1.15, 0.95);
    
    expect(ranking.weakSynergies).toHaveLength(1);
    expect(ranking.weakSynergies[0]).toMatchObject({
      stat1: 'crit',
      stat2: 'evasion',
      multiplier: 0.8,
      pairScore: 0.4,
      expectedScore: 0.5
    });
  });

  it('should identify anomalies', () => {
    const ranking = generateRanking(mockSynergies, 1.15, 0.95);
    
    expect(ranking.anomalies).toHaveLength(1);
    expect(ranking.anomalies[0]).toMatchObject({
      stat1: 'hp',
      stat2: 'regen',
      reason: 'Extreme OP',
      details: expect.stringContaining('Multiplier: 2.250')
    });
  });

  it('should handle empty synergies list', () => {
    const ranking = generateRanking([], 1.15, 0.95);
    
    expect(ranking.topSynergies).toHaveLength(0);
    expect(ranking.weakSynergies).toHaveLength(0);
    expect(ranking.anomalies).toHaveLength(0);
  });

  it('should respect threshold parameters', () => {
    const ranking = generateRanking(mockSynergies, 1.3, 0.85);
    
    // With higher OP threshold, only extreme OP should qualify
    expect(ranking.topSynergies).toHaveLength(3); // All 3 OP synergies > 1.3
    expect(ranking.topSynergies[0].stat1).toBe('hp');
    expect(ranking.topSynergies[0].stat2).toBe('regen');
    
    // With lower weak threshold, weak synergy should not qualify
    expect(ranking.weakSynergies).toHaveLength(0);
  });
});

describe('threshold filtering', () => {
  it('should filter based on custom thresholds', () => {
    const synergies: SynergyResult[] = [
      {
        pairArchetype: { id: 'test', name: 'Test', stats: {}, testedStats: [], pointsPerStat: 25, seed: 123, type: 'pair' } as any,
        statIds: ['a', 'b'],
        pairScore: 0.6,
        expectedScore: 0.5,
        synergyMultiplier: 1.2,
        isOpSynergy: false, // Will be filtered by custom threshold
        isWeakSynergy: false,
        runtimeMs: 100
      }
    ];

    const ranking = generateRanking(synergies, 1.25, 0.95);
    
    expect(ranking.topSynergies).toHaveLength(0);
    expect(ranking.weakSynergies).toHaveLength(0);
  });
});
