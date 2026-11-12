/**
 * placesConfig / poiConfig / eventsConfig — OB-5 (PLAN-117 rev. 5, T0.3/T0.4).
 *
 * Every POI belongs to an authored Place: `placeId` is required AND must
 * exist in placesConfig (referential integrity, not just presence). Region
 * links stay provisional until F6 — the test asserts they are declared, not
 * that they resolve. Fixtures are labelled `fixture: true` (D-2).
 */
import { describe, expect, it } from 'vitest';
import {
  PLACES_CONFIG,
  PlacesConfigSchema,
  placeById,
} from '@/balancing/config/idleVillage/placesConfig';
import { POI_CONFIG, PoiConfigSchema } from '@/balancing/config/idleVillage/poiConfig';
import { EVENTS_CONFIG, EventsConfigSchema, sortStrategicEvents } from '@/balancing/config/idleVillage/eventsConfig';

describe('placesConfig — authored Place model (Region 1:N Place 1:N POI, D-13)', () => {
  it('config is Zod-valid and placeIds are unique', () => {
    expect(() => PlacesConfigSchema.parse(PLACES_CONFIG)).not.toThrow();
    const ids = PLACES_CONFIG.places.map((p) => p.placeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('placeId is opaque (not derived from coordinates or regionId)', () => {
    for (const place of PLACES_CONFIG.places) {
      expect(place.placeId).not.toContain(String(place.worldPoint.x));
      expect(place.regionId ? place.placeId !== place.regionId : true).toBe(true);
    }
  });

  it('the village fixture is labelled fixture (D-2)', () => {
    const village = placeById('place_village_start')!;
    expect(village.fixture).toBe(true);
    expect(village.titleKey.startsWith('idleVillage.')).toBe(true);
  });
});

describe('poiConfig — every POI belongs to a Place (OB-5 referential integrity)', () => {
  it('config is Zod-valid; every poi has a placeId', () => {
    expect(() => PoiConfigSchema.parse(POI_CONFIG)).not.toThrow();
    for (const poi of POI_CONFIG.pois) expect(poi.placeId.length).toBeGreaterThan(0);
  });

  it('every poi.placeId resolves to an authored Place', () => {
    for (const poi of POI_CONFIG.pois) {
      expect(placeById(poi.placeId), `poi ${poi.id} → ${poi.placeId}`).toBeDefined();
    }
  });

  it('a poi referencing a missing placeId is rejected by the contract', () => {
    expect(() =>
      PoiConfigSchema.parse({ pois: [{ id: 'bad', type: 'quest', placeId: '' }] }),
    ).toThrow();
  });

  it('MapPOIType event exists but stays local — it is not a StrategicEventKind', () => {
    // D-12: 'event' as a poi type means a punctual LOCAL event with deadline;
    // strategic kinds live only in eventsConfig.
    expect(POI_CONFIG.pois.every((p) => ['quest', 'job', 'event'].includes(p.type))).toBe(true);
  });
});

describe('eventsConfig — strategic events ordered by deadline (T0.4)', () => {
  it('config is Zod-valid; every event has a deadlineTurn', () => {
    expect(() => EventsConfigSchema.parse(EVENTS_CONFIG)).not.toThrow();
    for (const e of EVENTS_CONFIG.events) expect(e.deadlineTurn).toBeGreaterThanOrEqual(0);
  });

  it('sortStrategicEvents orders by deadlineTurn asc, stable, non-mutating', () => {
    const input = [
      { id: 'b', kind: 'negative' as const, deadlineTurn: 9, titleKey: 'k.b' },
      { id: 'a', kind: 'positive' as const, deadlineTurn: 3, titleKey: 'k.a' },
      { id: 'c', kind: 'negative' as const, deadlineTurn: 3, titleKey: 'k.c' },
    ];
    const sorted = sortStrategicEvents(input);
    expect(sorted.map((e) => e.id)).toEqual(['a', 'c', 'b']);
    expect(input.map((e) => e.id)).toEqual(['b', 'a', 'c']);
  });

  it('event.placeId, when present, resolves to an authored Place', () => {
    for (const e of EVENTS_CONFIG.events) {
      if (e.placeId) expect(placeById(e.placeId), `event ${e.id}`).toBeDefined();
    }
  });
});
