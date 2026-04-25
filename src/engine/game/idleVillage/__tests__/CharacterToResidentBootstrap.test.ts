/**
 * Character-to-Resident Bootstrap Tests
 * 
 * Tests the canonical bootstrap path for converting Character entities
 * to Resident projections for Idle Village usage.
 * 
 * This covers the contract, not incidental implementation details.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  bootstrapResidentsFromCharacters,
  type BootstrapResidentsOptions,
  type BootstrapResidentsResult,
} from '../CharacterToResidentBootstrap';
// Define types inline to avoid import path issues and focus on contract testing
interface IdleVillageConfig {
  version: string;
  globalRules?: {
    startingResidentFatigue?: number;
  };
}

interface SavedCharacter {
  id: string;
  name: string;
  level: number;
  statBlock?: Record<string, number>;
  aiBehavior?: string;
  statTags?: string[];
}

interface ResidentState {
  id: string;
  displayName: string;
  status: string;
  fatigue: number;
  statProfileId?: string;
  statTags?: string[];
  statSnapshot?: Record<string, number>;
  currentHp: number;
  maxHp: number;
  isHero: boolean;
  isInjured: boolean;
  survivalCount: number;
  survivalScore: number;
}

// Mock dependencies
vi.mock('@/engine/idle/characterStorage', () => ({
  loadCharacters: vi.fn(),
}));

vi.mock('@/engine/game/idleVillage/characterImport', () => ({
  savedCharacterToResident: vi.fn(),
}));

vi.mock('@/engine/game/idleVillage/TimeEngine', () => ({
  getStartingResidentFatigue: vi.fn(),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Import mocked modules
import { loadCharacters } from '@/engine/idle/characterStorage';
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';
import { getStartingResidentFatigue } from '@/engine/game/idleVillage/TimeEngine';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

// Test data
const mockCharacter: SavedCharacter = {
  id: 'test-character-1',
  name: 'Test Character',
  level: 1,
  statBlock: { strength: 10, hp: 100 },
  aiBehavior: 'warrior',
  statTags: ['strength'],
};

const mockResident: ResidentState = {
  id: 'test-character-1',
  displayName: 'Test Character',
  status: 'available',
  fatigue: 0,
  statProfileId: 'warrior',
  statTags: ['strength'],
  statSnapshot: { hp: 100, damage: 10 },
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
};

const mockConfig: IdleVillageConfig = {
  version: '1.0.0',
  globalRules: {
    startingResidentFatigue: 25,
  },
};

describe('CharacterToResidentBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadCharacters).mockReturnValue([]);
    vi.mocked(savedCharacterToResident).mockReturnValue(mockResident);
    vi.mocked(getStartingResidentFatigue).mockReturnValue(0);
  });

  describe('Bootstrap Function Contract', () => {
    it('should return valid BootstrapResidentsResult structure', () => {
      const result = bootstrapResidentsFromCharacters();

      expect(result).toHaveProperty('residents');
      expect(result).toHaveProperty('usedFallback');
      expect(result).toHaveProperty('charactersConverted');
      expect(Array.isArray(result.residents)).toBe(true);
      expect(typeof result.usedFallback).toBe('boolean');
      expect(typeof result.charactersConverted).toBe('number');
    });

    it('should accept empty options object', () => {
      expect(() => bootstrapResidentsFromCharacters({})).not.toThrow();
    });

    it('should accept undefined options', () => {
      expect(() => bootstrapResidentsFromCharacters()).not.toThrow();
    });
  });

  describe('Character Input to Resident Output', () => {
    it('should convert characters to residents using canonical conversion', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);

      const result = bootstrapResidentsFromCharacters();

      expect(savedCharacterToResident).toHaveBeenCalledWith(mockCharacter, { defaultFatigue: 0 });
      expect(result.residents).toHaveLength(1);
      expect(result.charactersConverted).toBe(1);
      expect(result.usedFallback).toBe(false);
    });

    it('should convert multiple characters correctly', () => {
      const mockCharacter2: SavedCharacter = {
        ...mockCharacter,
        id: 'test-character-2',
        name: 'Test Character 2',
      };
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter, mockCharacter2]);

      const result = bootstrapResidentsFromCharacters();

      expect(savedCharacterToResident).toHaveBeenCalledTimes(2);
      expect(result.residents).toHaveLength(2);
      expect(result.charactersConverted).toBe(2);
      expect(result.usedFallback).toBe(false);
    });

    it('should use config-based fatigue when provided', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);
      vi.mocked(getStartingResidentFatigue).mockReturnValue(25);

      const result = bootstrapResidentsFromCharacters({ config: mockConfig });

      expect(getStartingResidentFatigue).toHaveBeenCalledWith(mockConfig);
      expect(savedCharacterToResident).toHaveBeenCalledWith(mockCharacter, { defaultFatigue: 25 });
      expect(result.charactersConverted).toBe(1);
    });

    it('should use fatigue override when provided', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);

      const result = bootstrapResidentsFromCharacters({ 
        startingFatigueOverride: 50,
        config: mockConfig 
      });

      expect(getStartingResidentFatigue).not.toHaveBeenCalled();
      expect(savedCharacterToResident).toHaveBeenCalledWith(mockCharacter, { defaultFatigue: 50 });
      expect(result.charactersConverted).toBe(1);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback residents when character storage is empty', () => {
      vi.mocked(loadCharacters).mockReturnValue([]);

      const result = bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(result.usedFallback).toBe(true);
      expect(result.charactersConverted).toBe(0);
      expect(result.residents).toHaveLength(2); // FALLBACK_RESIDENTS has 2 residents
      expect(result.residents[0].id).toBe('fallback-worker-1');
      expect(result.residents[1].id).toBe('fallback-worker-2');
    });

    it('should return empty array when character storage is empty and fallback disabled', () => {
      vi.mocked(loadCharacters).mockReturnValue([]);

      const result = bootstrapResidentsFromCharacters({ enableFallback: false });

      expect(result.usedFallback).toBe(false);
      expect(result.charactersConverted).toBe(0);
      expect(result.residents).toHaveLength(0);
    });

    it('should use fallback residents when conversion fails and fallback enabled', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);
      vi.mocked(savedCharacterToResident).mockImplementation(() => {
        throw new Error('Conversion failed');
      });

      const result = bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(result.usedFallback).toBe(true);
      expect(result.charactersConverted).toBe(0);
      expect(result.error).toBe('Conversion failed');
      expect(result.residents).toHaveLength(2);
    });

    it('should return empty array when conversion fails and fallback disabled', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);
      vi.mocked(savedCharacterToResident).mockImplementation(() => {
        throw new Error('Conversion failed');
      });

      const result = bootstrapResidentsFromCharacters({ enableFallback: false });

      expect(result.usedFallback).toBe(false);
      expect(result.charactersConverted).toBe(0);
      expect(result.error).toBe('Conversion failed');
      expect(result.residents).toHaveLength(0);
    });
  });

  describe('Field Mapping Validation', () => {
    it('should preserve character ID in resident', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);

      const result = bootstrapResidentsFromCharacters();

      expect(result.residents[0].id).toBe(mockCharacter.id);
    });

    it('should map character name to resident displayName', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);

      const result = bootstrapResidentsFromCharacters();

      expect(result.residents[0].displayName).toBe(mockCharacter.name);
    });

    it('should handle characters with missing optional fields', () => {
      const minimalCharacter: SavedCharacter = {
        id: 'minimal-character',
        name: 'Minimal',
        level: 1,
      };
      vi.mocked(loadCharacters).mockReturnValue([minimalCharacter]);

      const result = bootstrapResidentsFromCharacters();

      expect(result.charactersConverted).toBe(1);
      expect(result.usedFallback).toBe(false);
      expect(savedCharacterToResident).toHaveBeenCalledWith(minimalCharacter, { defaultFatigue: 0 });
    });
  });

  describe('Error Handling', () => {
    it('should handle character loading errors gracefully', () => {
      vi.mocked(loadCharacters).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(result.usedFallback).toBe(true);
      expect(result.charactersConverted).toBe(0);
      expect(result.error).toBe('Storage error');
      expect(result.residents).toHaveLength(2);
    });

    it('should handle non-Error objects in error handling', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);
      vi.mocked(savedCharacterToResident).mockImplementation(() => {
        throw 'String error';
      });

      const result = bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(result.error).toBe('String error');
      expect(result.usedFallback).toBe(true);
    });

    it('should track telemetry events for successful bootstrap', () => {
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);

      bootstrapResidentsFromCharacters({ config: mockConfig });

      expect(trackTelemetryEvent).toHaveBeenCalledWith('character_to_resident_bootstrap_success', {
        characterCount: 1,
        residentCount: 1,
        defaultFatigue: 0,
        timestamp: expect.any(Number),
      });
    });

    it('should track telemetry events for fallback usage', () => {
      vi.mocked(loadCharacters).mockReturnValue([]);

      bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(trackTelemetryEvent).toHaveBeenCalledWith('character_to_resident_fallback_used', {
        reason: 'character_storage_empty',
        fallbackCount: 2,
        timestamp: expect.any(Number),
      });
    });

    it('should track telemetry events for bootstrap errors', () => {
      vi.mocked(loadCharacters).mockImplementation(() => {
        throw new Error('Test error');
      });

      bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(trackTelemetryEvent).toHaveBeenCalledWith('character_to_resident_bootstrap_error', {
        error: 'Test error',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Contract Edge Cases', () => {
    it('should handle empty character array correctly', () => {
      vi.mocked(loadCharacters).mockReturnValue([]);

      const result = bootstrapResidentsFromCharacters();

      expect(result.residents).toHaveLength(2); // Fallback residents
      expect(result.usedFallback).toBe(true);
      expect(result.charactersConverted).toBe(0);
    });

    it('should not call conversion functions when using fallback', () => {
      vi.mocked(loadCharacters).mockReturnValue([]);

      bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(savedCharacterToResident).not.toHaveBeenCalled();
      expect(getStartingResidentFatigue).not.toHaveBeenCalled();
    });

    it('should handle config without globalRules', () => {
      const configWithoutRules = { ...mockConfig, globalRules: undefined as any };
      vi.mocked(loadCharacters).mockReturnValue([mockCharacter]);

      const result = bootstrapResidentsFromCharacters({ config: configWithoutRules });

      expect(getStartingResidentFatigue).not.toHaveBeenCalled();
      expect(savedCharacterToResident).toHaveBeenCalledWith(mockCharacter, { defaultFatigue: 0 });
      expect(result.charactersConverted).toBe(1);
    });
  });
});
