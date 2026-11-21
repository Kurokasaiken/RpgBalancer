/**
 * PLAN-129 — `/hud-lab` catalog integrity (permanent INV).
 * The lab page renders LAB_CATALOG × HOSTS blind: this suite is the only
 * mechanical guard that the vocabulary list and the host registry stay in
 * sync, and that entries carry the provenance the ruling requires.
 */
import { describe, expect, it } from 'vitest';
import { LAB_CATALOG } from '@/pages/hud-lab/catalog';
import { HOSTS } from '@/pages/hud-lab/hostRegistry';

describe('hud-lab catalog (PLAN-129)', () => {
  it('has unique entry ids', () => {
    const ids = LAB_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry host resolves in the registry', () => {
    for (const entry of LAB_CATALOG) {
      expect(HOSTS[entry.host], `entry ${entry.id} → host '${entry.host}'`).toBeTypeOf('function');
    }
  });

  it('every registered host is referenced by at least one entry', () => {
    const used = new Set(LAB_CATALOG.map((e) => e.host));
    for (const key of Object.keys(HOSTS)) {
      // 'note' is the shared fallback host — always registered, not required in the catalog.
      if (key === 'note') continue;
      expect(used.has(key), `orphan host '${key}'`).toBe(true);
    }
  });

  it('baptized/candidate entries carry ruling provenance', () => {
    for (const entry of LAB_CATALOG) {
      if (entry.status === 'deprecato') continue;
      expect(entry.provenance.ruling.trim().length, `entry ${entry.id}`).toBeGreaterThan(0);
    }
  });

  it('component cards mount a real host, not the note fallback', () => {
    for (const entry of LAB_CATALOG) {
      if (entry.kind !== 'component' || entry.status === 'da-riallineare') continue;
      expect(entry.host, `component ${entry.id} uses the note fallback`).not.toBe('note');
    }
  });

  it('contains the OB-4 minimum seed (components + pieces + village flag)', () => {
    const ids = new Set(LAB_CATALOG.map((e) => e.id));
    for (const id of ['cassetto', 'roster', 'stash', 'victory-reward', 'top-chrome', 'nav', 'time-sole',
      'frame-smeraldo', 'scroll-band', 'piastrina', 'cta-confirm']) {
      expect(ids.has(id), `missing seed entry '${id}'`).toBe(true);
    }
  });

  it('village family is flagged da-riallineare with the clipped-buildings defect', () => {
    const village = LAB_CATALOG.filter((e) => e.family === 'villaggio');
    expect(village.length).toBeGreaterThan(0);
    for (const e of village) {
      expect(e.status).toBe('da-riallineare');
    }
    expect(village.some((e) => /ritagliat/i.test(e.notes ?? ''))).toBe(true);
  });
});
