/**
 * Tests for CharacterToResidentBootstrap
 * Verifies the canonical Character -> Resident conversion path
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bootstrapResidentsFromCharacters } from '@/engine/game/idleVillage/CharacterToResidentBootstrap';
import { loadCharacters } from '@/engine/idle/characterStorage';
import { saveCharacter } from '@/engine/idle/characterStorage';
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';
import type { SavedCharacter } from '@/engine/idle/characterStorage';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

// Mock dependencies
vi.mock('@/engine/idle/characterStorage');
vi.mock('@/engine/game/idleVillage/characterImport');
vi.mock('@/analytics/telemetry/telemetryProvider');

const mockLoadCharacters = vi.mocked(loadCharacters);
const mockSaveCharacter = vi.mocked(saveCharacter);
const mockSavedCharacterToResident = vi.mocked(savedCharacterToResident);
const mockTrackTelemetryEvent = vi.fn();

describe('CharacterToResidentBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadCharacters.mockReturnValue([]);
    mockSavedCharacterToResident.mockImplementation((character, options) => ({
      id: character.id,
      displayName: character.name,
      status: 'available',
      fatigue: options?.defaultFatigue ?? 10, // Use override or default
      statProfileId: character.aiBehavior || 'unknown',
      statTags: character.statTags || [],
      statSnapshot: character.statBlock || {},
      currentHp: character.statBlock?.hp || 100,
      maxHp: character.statBlock?.hp || 100,
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
    }));
  });

  describe('bootstrapResidentsFromCharacters', () => {
    it('should return fallback residents when character storage is empty', () => {
      mockLoadCharacters.mockReturnValue([]);

      const result = bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(result.usedFallback).toBe(true);
      expect(result.residents).toHaveLength(2);
      expect(result.residents[0].id).toBe('fallback-worker-1');
      expect(result.residents[1].id).toBe('fallback-worker-2');
      expect(result.charactersConverted).toBe(0);
    });

    it('should return empty array when character storage is empty and fallback disabled', () => {
      mockLoadCharacters.mockReturnValue([]);

      const result = bootstrapResidentsFromCharacters({ enableFallback: false });

      expect(result.usedFallback).toBe(false);
      expect(result.residents).toHaveLength(0);
      expect(result.charactersConverted).toBe(0);
    });

    it('should convert characters to residents successfully', () => {
      const mockCharacters: SavedCharacter[] = [
        {
          id: 'char-1',
          name: 'Test Character',
          aiBehavior: 'warrior',
          statBlock: { hp: 100, strength: 50 },
          equippedSpellIds: [],
          status: 'available',
          fatigue: 0,
          currentHp: 100,
          maxHp: 100,
          isInjured: false,
          isHero: false,
          survivalCount: 0,
          survivalScore: 0,
        },
      ];
      mockLoadCharacters.mockReturnValue(mockCharacters);

      const result = bootstrapResidentsFromCharacters();

      expect(result.usedFallback).toBe(false);
      expect(result.residents).toHaveLength(1);
      expect(result.residents[0].id).toBe('char-1');
      expect(result.residents[0].displayName).toBe('Test Character');
      expect(result.charactersConverted).toBe(1);
    });

    it('should apply starting fatigue override', () => {
      const mockCharacters: SavedCharacter[] = [
        {
          id: 'char-1',
          name: 'Test Character',
          aiBehavior: 'warrior',
          statBlock: { hp: 100 },
          equippedSpellIds: [],
          status: 'available',
          fatigue: 10,
          currentHp: 100,
          maxHp: 100,
          isInjured: false,
          isHero: false,
          survivalCount: 0,
          survivalScore: 0,
        },
      ];
      mockLoadCharacters.mockReturnValue(mockCharacters);

      const result = bootstrapResidentsFromCharacters({ startingFatigueOverride: 5 });

      // The bootstrap function should apply the override to the converted resident
      expect(result.residents[0].fatigue).toBe(5);
    });

    it('should handle conversion errors gracefully', () => {
      mockLoadCharacters.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = bootstrapResidentsFromCharacters({ enableFallback: true });

      expect(result.usedFallback).toBe(true);
      expect(result.error).toBe('Storage error');
      expect(result.residents).toHaveLength(2); // Fallback residents
    });

    it('should return error when conversion fails and fallback disabled', () => {
      mockLoadCharacters.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = bootstrapResidentsFromCharacters({ enableFallback: false });

      expect(result.usedFallback).toBe(false);
      expect(result.error).toBe('Storage error');
      expect(result.residents).toHaveLength(0);
    });

    it('should track telemetry events', async () => {
      // Import telemetry module
      const telemetryModule = await import('@/analytics/telemetry/telemetryProvider');
      const mockTrackEvent = vi.fn();
      vi.spyOn(telemetryModule, 'trackTelemetryEvent').mockImplementation(mockTrackEvent);
      
      // Test fallback usage
      mockLoadCharacters.mockReturnValue([]);
      bootstrapResidentsFromCharacters({ enableFallback: true });
      
      expect(mockTrackEvent).toHaveBeenCalledWith('character_to_resident_fallback_used', expect.objectContaining({
        reason: 'character_storage_empty',
        fallbackCount: 2,
      }));

      // Test successful conversion
      mockLoadCharacters.mockReturnValue([{
        id: 'char-1',
        name: 'Test',
        aiBehavior: 'warrior',
        statBlock: { hp: 100 },
        equippedSpellIds: [],
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isInjured: false,
        isHero: false,
        survivalCount: 0,
        survivalScore: 0,
      }]);
      
      const mockResident: ResidentState = {
        id: 'test-character-1',
        displayName: 'Test Character',
        status: 'available',
        fatigue: 10, // Default fatigue that will be overridden
        statProfileId: 'warrior',
        statTags: ['strength'],
        statSnapshot: { hp: 100, damage: 10 },
        currentHp: 100,
        maxHp: 100,
        isInjured: false,
        isHero: false,
        survivalCount: 0,
        survivalScore: 0,
      };
      
      bootstrapResidentsFromCharacters();
      
      expect(mockTrackEvent).toHaveBeenCalledWith('character_to_resident_bootstrap_success', expect.objectContaining({
        characterCount: 1,
        residentCount: 1,
      }));
    });
  });
});
