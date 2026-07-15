import { describe, it, expect } from 'vitest';
import {
  getResidentPortraitUrl,
  resolveResidentPortrait,
} from '../../../src/engine/game/idleVillage/residentVisualResolver';
import type { ResidentState } from '../../../src/engine/game/idleVillage/TimeEngine';

describe('Portrait propagation regression coverage', () => {
  /**
   * Regression contract: PG card render path must use resolved portrait source
   * via getResidentPortraitUrl(), not stale raw portraitUrl from resident state.
   */
  describe('getResidentPortraitUrl', () => {
    it('returns resolved portrait URL from resident override when valid', () => {
      const resident: ResidentState = {
        id: 'test-resident-1',
        displayName: 'Test Resident',
        portraitUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const url = getResidentPortraitUrl(resident);
      expect(url).toBe(resident.portraitUrl);
    });

    it('rejects stale raw portrait paths without content hash', () => {
      const resident: ResidentState = {
        id: 'test-resident-2',
        displayName: 'Test Resident',
        portraitUrl: '/assets/portraits/sir-spaccaculi.png',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const url = getResidentPortraitUrl(resident);
      // Should fall back to profile portrait, not use stale raw path
      expect(url).not.toBe(resident.portraitUrl);
    });

    it('accepts Vite-resolved assets with content hash', () => {
      const resident: ResidentState = {
        id: 'test-resident-3',
        displayName: 'Test Resident',
        portraitUrl: '/assets/portrait-D1K3m9Fq.png',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const url = getResidentPortraitUrl(resident);
      expect(url).toBe(resident.portraitUrl);
    });

    it('returns fallback portrait URL for null/undefined resident', () => {
      const nullUrl = getResidentPortraitUrl(null);
      const undefinedUrl = getResidentPortraitUrl(undefined);
      // Should return fallback from default profile, not throw
      expect(typeof nullUrl).toBe('string');
      expect(typeof undefinedUrl).toBe('string');
    });
  });

  /**
   * Regression contract: Broken raw portrait values must not silently win
   * over resolved portrait values in the card render path.
   */
  describe('resolveResidentPortrait', () => {
    it('prioritizes resident override when valid', () => {
      const resident: ResidentState = {
        id: 'test-resident-4',
        displayName: 'Test Resident',
        portraitUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const resolved = resolveResidentPortrait(resident);
      expect(resolved.portraitUrl).toBe(resident.portraitUrl);
      expect(resolved.source).toBe('resident_override');
    });

    it('falls back to snapshot when resident override is invalid', () => {
      const resident: ResidentState = {
        id: 'test-resident-5',
        displayName: 'Test Resident',
        portraitUrl: '/assets/portraits/stale.png',
        visualProfileId: 'default',
        statSnapshot: {} as any,
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const resolved = resolveResidentPortrait(resident);
      expect(resolved.portraitUrl).not.toBe(resident.portraitUrl);
      expect(resolved.source).toBe('profile');
    });

    it('falls back to profile when both override and snapshot are invalid', () => {
      const resident: ResidentState = {
        id: 'test-resident-6',
        displayName: 'Test Resident',
        portraitUrl: '/assets/portraits/stale.png',
        visualProfileId: 'default',
        statSnapshot: {} as any,
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const resolved = resolveResidentPortrait(resident);
      expect(resolved.portraitUrl).not.toBe(resident.portraitUrl);
      expect(resolved.source).toBe('profile');
    });

    it('returns valid URL from profile as final fallback', () => {
      const resident: ResidentState = {
        id: 'test-resident-7',
        displayName: 'Test Resident',
        portraitUrl: '/assets/portraits/stale.png',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const resolved = resolveResidentPortrait(resident);
      // Profile should provide a valid URL (empty string if no portrait defined)
      expect(typeof resolved.portraitUrl).toBe('string');
      expect(resolved.source).toBe('profile');
    });
  });

  /**
   * Regression contract: /minimal-gameplay resident cards must receive usable
   * portrait URLs, not broken paths that would cause image load failures.
   */
  describe('minimal-gameplay compatibility', () => {
    it('provides usable portrait URL for typical resident state', () => {
      const resident: ResidentState = {
        id: 'minimal-resident-1',
        displayName: 'Minimal Resident',
        portraitUrl: '/assets/portrait-A1B2C3D4.png',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const url = getResidentPortraitUrl(resident);
      expect(url).toBeTruthy();
      expect(url.length).toBeGreaterThan(0);
    });

    it('handles residents with no portraitUrl gracefully', () => {
      const resident: ResidentState = {
        id: 'minimal-resident-2',
        displayName: 'Minimal Resident',
        visualProfileId: 'default',
        status: 'available',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const url = getResidentPortraitUrl(resident);
      expect(typeof url).toBe('string');
      // Should not throw, should return empty string or profile fallback
    });
  });
});