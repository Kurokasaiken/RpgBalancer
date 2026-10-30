/**
 * Regression guard for R-297 follow-up: the /mappa2-lab tuning must persist
 * per device on every surface (dev AND Vercel prod). The dev-only
 * `/__mappa2-lab-defaults` bake stays dev-only; on prod the same button
 * writes PersistenceService (localStorage) instead of failing.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const LAB_SRC = readFileSync('src/pages/mappa2-lab.tsx', 'utf8');

describe('mappa2-lab defaults persistence (R-297)', () => {
  it('persists lab defaults + effects through PersistenceService', () => {
    expect(LAB_SRC).toContain("from '@/shared/persistence/PersistenceService'");
    expect(LAB_SRC).toContain("LAB_STORAGE_KEY = 'mappa2-lab:defaults:v1'");
    expect(LAB_SRC).toMatch(/loadData<LabPersistedState/);
    expect(LAB_SRC).toMatch(/saveData\(LAB_STORAGE_KEY/);
  });

  it('autosaves only after the stored state has been restored', () => {
    expect(LAB_SRC).toContain('defaultsLoaded');
    expect(LAB_SRC).toMatch(/if \(!defaultsLoaded\) return;/);
  });

  it('keeps the code-bake endpoint dev-server-only and saves per-device elsewhere', () => {
    expect(LAB_SRC).toContain("import.meta.env.MODE === 'development'");
    expect(LAB_SRC).toContain('/__mappa2-lab-defaults');
    expect(LAB_SRC).toContain('saved on this device');
  });

  it('exposes a share/copy path producing WhatsApp-ready text for the bake', () => {
    expect(LAB_SRC).toContain('isMobile && typeof navigator.share');
    expect(LAB_SRC).toContain('navigator.clipboard');
    expect(LAB_SRC).toContain('defaults da cuocere nel codice');
    expect(LAB_SRC).toContain('Share config');
  });
});
