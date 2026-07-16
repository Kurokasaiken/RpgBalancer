import { describe, it, expect } from 'vitest';
import {
  COMPONENT_CATALOG,
  CatalogEntrySchema,
  getCatalogEntry,
  getCatalogStatus,
  getCatalogCounts,
} from '@/ui/designSystem/componentCatalog';

/**
 * Component Catalog — governance della UI Review Room.
 * Verifica: validazione Zod, derivazione status dal KIT_REGISTRY (mai
 * ridichiarato), campi pattern-only, contatori inventory.
 */
describe('componentCatalog', () => {
  it('every entry passes the Zod schema', () => {
    for (const entry of COMPONENT_CATALOG) {
      expect(() => CatalogEntrySchema.parse(entry)).not.toThrow();
    }
  });

  it('derives status from KIT_REGISTRY for kit-backed entries', () => {
    // poiKit è certified nel registry → production
    const poi = getCatalogEntry('poi-medallion');
    expect(poi).toBeDefined();
    expect(getCatalogStatus(poi!)).toBe('production');

    // slottedMedalKit è draft (certified:false) → candidate
    const medal = getCatalogEntry('slotted-medal');
    expect(medal).toBeDefined();
    expect(getCatalogStatus(medal!)).toBe('candidate');
    expect(medal!.blockedNote).toBeTruthy();
  });

  it('uses statusOverride only for entries without a kit', () => {
    const button = getCatalogEntry('skin-button');
    expect(button?.kitId).toBeUndefined();
    expect(getCatalogStatus(button!)).toBe('production');
  });

  it('interaction patterns declare flow and emotional goal', () => {
    const patterns = COMPONENT_CATALOG.filter((e) => e.category === 'pattern');
    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      expect(pattern.flow?.length ?? 0).toBeGreaterThan(0);
      expect(pattern.emotionalGoal).toBeTruthy();
    }
  });

  it('composition rules are semantic contexts, not allow-lists', () => {
    for (const entry of COMPONENT_CATALOG) {
      if (entry.compositionRules) {
        expect(Array.isArray(entry.compositionRules.primaryContexts)).toBe(true);
        expect(Array.isArray(entry.compositionRules.forbiddenContexts)).toBe(true);
      }
    }
  });

  it('inventory counts add up to the catalog size', () => {
    const counts = getCatalogCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(COMPONENT_CATALOG.length);
  });
});
