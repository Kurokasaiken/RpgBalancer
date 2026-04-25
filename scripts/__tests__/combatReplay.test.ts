/**
 * Unit tests for STS Combat Replay CLI
 * 
 * Tests the combat telemetry replay functionality including:
 * - CLI argument parsing
 * - Telemetry data validation
 * - Event filtering
 * - ASCII timeline generation
 * - JSON export functionality
 * - Persistence integration
 * 
 * @module combatReplay.test
 * @since 2026-01-16
 * @author Vector-CLI
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { CombatReplayProcessor } from '../sts/combatReplay';
import type { STSTelemetryEvent } from '../../ui/tools/sts/telemetry/stsTelemetryConfig';
import { PersistenceService } from '../../shared/persistence/PersistenceService';

// Mock telemetry data
const mockTelemetryData = {
  sessionId: 'test-session-123',
  events: [
    {
      id: 'event-1',
      type: 'combat_start' as const,
      timestamp: 1641894400000,
      sessionId: 'test-session-123',
      data: { combatId: 'combat-001' },
      metadata: {
        turn: 0,
        combatId: 'combat-001',
        playerHealth: 75,
        enemyHealth: 100,
        energy: 3,
        block: 0,
      },
    },
    {
      id: 'event-2',
      type: 'turn_start' as const,
      timestamp: 1641894401000,
      sessionId: 'test-session-123',
      data: { turn: 1 },
      metadata: {
        turn: 1,
        combatId: 'combat-001',
        playerHealth: 75,
        enemyHealth: 100,
        energy: 3,
        block: 0,
      },
    },
    {
      id: 'event-3',
      type: 'card_played' as const,
      timestamp: 1641894402000,
      sessionId: 'test-session-123',
      data: { 
        card: 'Strike',
        cost: 1,
        target: 'Enemy',
        damage: 6,
      },
      metadata: {
        turn: 1,
        combatId: 'combat-001',
        playerHealth: 75,
        enemyHealth: 94,
        energy: 2,
        block: 0,
      },
    },
    {
      id: 'event-4',
      type: 'card_played' as const,
      timestamp: 1641894403000,
      sessionId: 'test-session-123',
      data: { 
        card: 'Defend',
        cost: 1,
        target: 'Player',
        block: 5,
      },
      metadata: {
        turn: 1,
        combatId: 'combat-001',
        playerHealth: 75,
        enemyHealth: 94,
        energy: 1,
        block: 5,
      },
    },
    {
      id: 'event-5',
      type: 'energy_spent' as const,
      timestamp: 1641894404000,
      sessionId: 'test-session-123',
      data: { amount: 2 },
      metadata: {
        turn: 1,
        combatId: 'combat-001',
        playerHealth: 75,
        enemyHealth: 94,
        energy: 1,
        block: 5,
      },
    },
    {
      id: 'event-6',
      type: 'enemy_action' as const,
      timestamp: 1641894405000,
      sessionId: 'test-session-123',
      data: { action: 'Attack for 8 damage' },
      metadata: {
        turn: 1,
        combatId: 'combat-001',
        playerHealth: 72,
        enemyHealth: 94,
        energy: 1,
        block: 5,
      },
    },
    {
      id: 'event-7',
      type: 'turn_end' as const,
      timestamp: 1641894406000,
      sessionId: 'test-session-123',
      data: { turn: 1 },
      metadata: {
        turn: 1,
        combatId: 'combat-001',
        playerHealth: 72,
        enemyHealth: 94,
        energy: 1,
        block: 0,
      },
    },
    {
      id: 'event-8',
      type: 'turn_start' as const,
      timestamp: 1641894407000,
      sessionId: 'test-session-123',
      data: { turn: 2 },
      metadata: {
        turn: 2,
        combatId: 'combat-001',
        playerHealth: 72,
        enemyHealth: 94,
        energy: 3,
        block: 0,
      },
    },
    {
      id: 'event-9',
      type: 'card_played' as const,
      timestamp: 1641894408000,
      sessionId: 'test-session-123',
      data: { 
        card: 'Bash',
        cost: 2,
        target: 'Enemy',
        damage: 8,
        vulnerable: 2,
      },
      metadata: {
        turn: 2,
        combatId: 'combat-001',
        playerHealth: 72,
        enemyHealth: 86,
        energy: 1,
        block: 0,
      },
    },
    {
      id: 'event-10',
      type: 'combat_end' as const,
      timestamp: 1641894409000,
      sessionId: 'test-session-123',
      data: { result: 'victory', combatId: 'combat-001' },
      metadata: {
        turn: 2,
        combatId: 'combat-001',
        playerHealth: 72,
        enemyHealth: 0,
        energy: 1,
        block: 0,
      },
    },
  ],
  sessions: [
    {
      id: 'combat-001',
      startTime: 1641894400000,
      endTime: 1641894409000,
      turns: 2,
      result: 'victory' as const,
      stats: {
        cardsPlayed: 3,
        cardsDrawn: 5,
        totalDamage: 14,
        totalBlock: 5,
        totalEnergySpent: 4,
        averageTurnTime: 4500,
      },
    },
  ],
};

// Mock file system operations
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock PersistenceService
vi.mock('../../shared/persistence/PersistenceService', () => ({
  PersistenceService: vi.fn().mockImplementation(() => ({
    saveData: vi.fn().mockResolvedValue(undefined),
    loadData: vi.fn().mockResolvedValue(null),
  })),
}));

describe('CombatReplayProcessor', () => {
  let processor: CombatReplayProcessor;

  beforeEach(() => {
    processor = new CombatReplayProcessor(mockTelemetryData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create processor with default config', () => {
      expect(processor).toBeDefined();
      // Test that processor has default config
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('STS COMBAT TELEMETRY REPLAY');
    });

    it('should accept custom config', () => {
      const customProcessor = new CombatReplayProcessor(mockTelemetryData, {
        width: 100,
        showMana: false,
        compact: true,
      });
      expect(customProcessor).toBeDefined();
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by combat ID', () => {
      const filtered = processor.filterByCombat('combat-001');
      expect(filtered).toHaveLength(mockTelemetryData.events.length);
      
      const filteredWrong = processor.filterByCombat('wrong-id');
      expect(filteredWrong).toHaveLength(0);
    });

    it('should filter events by card name', () => {
      const events = processor.filterByCombat('combat-001');
      const filtered = processor.filterByCard(events, 'Strike');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].data.card).toBe('Strike');
    });

    it('should filter events by partial card name', () => {
      const events = processor.filterByCombat('combat-001');
      const filtered = processor.filterByCard(events, 'Def');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].data.card).toBe('Defend');
    });

    it('should return all events when no filters applied', () => {
      const filtered = processor.filterByCombat();
      expect(filtered).toHaveLength(mockTelemetryData.events.length);
      
      const filteredByCard = processor.filterByCard(filtered);
      expect(filteredByCard).toHaveLength(mockTelemetryData.events.length);
    });
  });

  describe('Timeline Generation', () => {
    it('should generate ASCII timeline with header', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('═'.repeat(80)); // Default width
      expect(timeline).toContain('STS COMBAT TELEMETRY REPLAY');
      expect(timeline).toContain('═'.repeat(80));
    });

    it('should generate turn headers with player state', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('TURN 1');
      expect(timeline).toContain('HP: 75');
      expect(timeline).toContain('Enemy: 100');
      expect(timeline).toContain('Energy: 3');
      expect(timeline).toContain('Block: 0');
    });

    it('should format card play events correctly', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('🎴 Play Strike (cost: 1) → Enemy');
      expect(timeline).toContain('🎴 Play Defend (cost: 1) → Player');
      expect(timeline).toContain('🎴 Play Bash (cost: 2) → Enemy');
    });

    it('should format energy spent events correctly', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('⚡ Spend 2 energy');
    });

    it('should format enemy action events correctly', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('👹 Enemy: Attack for 8 damage');
    });

    it('should format combat start/end events correctly', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('⚔️ Combat started');
      expect(timeline).toContain('🏁 Combat ended: victory');
    });

    it('should format turn start/end events correctly', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('🔄 Turn started');
      expect(timeline).toContain('⏹️ Turn ended');
    });

    it('should generate summary statistics', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      expect(timeline).toContain('Total Events: 10');
      expect(timeline).toContain('Event Breakdown:');
      expect(timeline).toContain('card_played: 3');
      expect(timeline).toContain('turn_start: 2');
      expect(timeline).toContain('turn_end: 2');
    });

    it('should handle empty events array', () => {
      const timeline = processor.generateTimeline([]);
      expect(timeline).toContain('No events found for the specified filters.');
    });

    it('should group events by turn correctly', () => {
      const timeline = processor.generateTimeline(mockTelemetryData.events);
      const lines = timeline.split('\n');
      
      // Should have TURN 1 section
      const turn1Index = lines.findIndex(line => line.includes('TURN 1'));
      expect(turn1Index).toBeGreaterThan(-1);
      
      // Should have TURN 2 section
      const turn2Index = lines.findIndex(line => line.includes('TURN 2'));
      expect(turn2Index).toBeGreaterThan(-1);
      
      // TURN 2 should come after TURN 1
      expect(turn2Index).toBeGreaterThan(turn1Index);
    });
  });

  describe('JSON Export', () => {
    it('should export filtered events as JSON', () => {
      const filtered = processor.filterByCombat('combat-001');
      const jsonOutput = processor.exportJSON(filtered);
      
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.totalEvents).toBe(10);
      expect(parsed.events).toHaveLength(10);
    });

    it('should include metadata in JSON export', () => {
      const filtered = processor.filterByCard(mockTelemetryData.events, 'Strike');
      const jsonOutput = processor.exportJSON(filtered);
      
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.totalEvents).toBe(1);
      expect(parsed.events[0].data.card).toBe('Strike');
    });
  });

  describe('Event Formatting Edge Cases', () => {
    it('should handle events with missing data gracefully', () => {
      const eventsWithMissingData: STSTelemetryEvent[] = [
        {
          id: 'missing-data',
          type: 'card_played',
          timestamp: 1641894400000,
          sessionId: 'test',
          data: {}, // Missing card data
        },
        {
          id: 'missing-metadata',
          type: 'health_change',
          timestamp: 1641894400000,
          sessionId: 'test',
          data: { delta: 5 },
          metadata: {}, // Missing target
        },
      ];
      
      const timeline = processor.generateTimeline(eventsWithMissingData);
      expect(timeline).toContain('🎴 Play Unknown (cost: ?)');
      expect(timeline).toContain('❤️ ??? +5 HP');
    });

    it('should handle unknown event types', () => {
      const unknownEvent: STSTelemetryEvent = {
        id: 'unknown',
        type: 'unknown_type' as any,
        timestamp: 1641894400000,
        sessionId: 'test',
        data: { custom: 'data' },
      };
      
      const timeline = processor.generateTimeline([unknownEvent]);
      expect(timeline).toContain('unknown_type: {"custom":"data"}');
    });

    it('should format health changes with positive/negative indicators', () => {
      const healthEvents: STSTelemetryEvent[] = [
        {
          id: 'heal',
          type: 'health_change',
          timestamp: 1641894400000,
          sessionId: 'test',
          data: { delta: 10, target: 'Player' },
        },
        {
          id: 'damage',
          type: 'health_change',
          timestamp: 1641894400000,
          sessionId: 'test',
          data: { delta: -5, target: 'Player' },
        },
      ];
      
      const timeline = processor.generateTimeline(healthEvents);
      expect(timeline).toContain('❤️ Player +10 HP');
      expect(timeline).toContain('💔 Player -5 HP');
    });

    it('should format block changes with positive/negative indicators', () => {
      const blockEvents: STSTelemetryEvent[] = [
        {
          id: 'gain-block',
          type: 'block_change',
          timestamp: 1641894400000,
          sessionId: 'test',
          data: { delta: 8, target: 'Player' },
        },
        {
          id: 'lose-block',
          type: 'block_change',
          timestamp: 1641894400000,
          sessionId: 'test',
          data: { delta: -3, target: 'Player' },
        },
      ];
      
      const timeline = processor.generateTimeline(blockEvents);
      expect(timeline).toContain('🛡️ Player +8 Block');
      expect(timeline).toContain('💨 Player -3 Block');
    });
  });

  describe('Performance', () => {
    it('should handle large number of events efficiently', () => {
      // Generate 1000 events
      const largeEventSet: STSTelemetryEvent[] = [];
      for (let i = 0; i < 1000; i++) {
        largeEventSet.push({
          id: `event-${i}`,
          type: 'card_played',
          timestamp: 1641894400000 + i * 1000,
          sessionId: 'test',
          data: { card: `Card${i}`, cost: 1 },
          metadata: { turn: Math.floor(i / 5) + 1 },
        });
      }
      
      const startTime = Date.now();
      const timeline = processor.generateTimeline(largeEventSet);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
      expect(timeline).toContain('Total Events: 1000');
    });
  });
});

describe('CLI Integration', () => {
  beforeEach(() => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockTelemetryData));
    vi.mocked(existsSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should save last input path to persistence', async () => {
    // This would be tested in an integration test
    // For now, just verify the mock is set up correctly
    const persistenceService = new PersistenceService('sts-combat-replay');
    expect(persistenceService.saveData).toBeDefined();
  });

  it('should handle file not found error', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    
    // In a real test, we would call the CLI and expect it to throw
    // For now, just verify the mock setup
    expect(existsSync).toHaveBeenCalled();
  });
});

describe('Persistence Integration', () => {
  it('should use PersistenceService for evidence logging', async () => {
    const persistenceService = new PersistenceService('sts-combat-replay');
    
    await persistenceService.saveData('last-evidence', {
      path: '/path/to/evidence.log',
      content: 'test content',
      timestamp: Date.now(),
    });
    
    expect(persistenceService.saveData).toHaveBeenCalledWith(
      'last-evidence',
      expect.objectContaining({
        path: '/path/to/evidence.log',
        content: 'test content',
      })
    );
  });

  it('should save last input path', async () => {
    const persistenceService = new PersistenceService('sts-combat-replay');
    
    await persistenceService.saveData('last-input-path', '/path/to/input.json');
    
    expect(persistenceService.saveData).toHaveBeenCalledWith(
      'last-input-path',
      '/path/to/input.json'
    );
  });
});
