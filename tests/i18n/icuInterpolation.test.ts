import { describe, it, expect, beforeAll } from 'vitest';
import i18next, { type i18n as I18nInstance } from 'i18next';
import ICU from 'i18next-icu';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* R-193 — regression guard: every user-facing string must be valid ICU.
 * i18next-icu is registered app-wide (src/localization/i18n.ts), so the
 * legacy i18next `{{var}}` interpolation renders literally — or worse,
 * throws and returns the raw key string. This suite loads the REAL
 * production JSONs and asserts the previously-broken keys interpolate. */

const LOCALES_ROOT = 'public/locales';

function* walkStrings(obj: unknown, prefix = ''): Generator<[string, string]> {
  if (typeof obj === 'string') {
    yield [prefix, obj];
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      yield* walkStrings(v, prefix ? `${prefix}.${k}` : k);
    }
  }
}

function* allLocaleFiles(): Generator<string> {
    for (const dir of readdirSync(LOCALES_ROOT)) {
      const dirPath = join(LOCALES_ROOT, dir);
      if (!statSync(dirPath).isDirectory()) continue;
      for (const file of readdirSync(dirPath)) {
        if (file.endsWith('.json')) yield join(dirPath, file);
      }
    }
}

describe('R-193 ICU audit — no legacy {{var}} interpolation remains', () => {
  it('no translation value contains a double-brace placeholder', () => {
    const offenders: string[] = [];
    for (const fp of allLocaleFiles()) {
      const data = JSON.parse(readFileSync(fp, 'utf-8')) as unknown;
      for (const [path, value] of walkStrings(data)) {
        if (/\{\{/.test(value)) offenders.push(`${fp} :: ${path} = "${value}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('pseudo files mirror the fixed syntax (no {{ in pseudo either)', () => {
    for (const file of readdirSync(join(LOCALES_ROOT, 'pseudo'))) {
      if (!file.endsWith('.json')) continue;
      const data = JSON.parse(readFileSync(join(LOCALES_ROOT, 'pseudo', file), 'utf-8')) as unknown;
      for (const [path, value] of walkStrings(data)) {
        expect(value, `pseudo/${file} :: ${path}`).not.toMatch(/\{\{/);
      }
    }
  });
});

describe('R-193 real ICU interpolation (production resources)', () => {
  let i18n: I18nInstance;
  const load = (lng: string, ns: string) =>
    JSON.parse(readFileSync(join(LOCALES_ROOT, lng, `${ns}.json`), 'utf-8')) as Record<string, unknown>;

  beforeAll(async () => {
    i18n = i18next.createInstance();
    await i18n.use(ICU).init({
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'it-IT', 'de', 'pseudo'],
      ns: ['common', 'idleVillage'],
      defaultNS: 'common',
      resources: {
        en: { common: load('en', 'common'), idleVillage: load('en', 'idleVillage') },
        'it-IT': { idleVillage: load('it-IT', 'idleVillage') },
        de: { common: load('de', 'common'), idleVillage: load('de', 'idleVillage') },
        pseudo: { common: load('pseudo', 'common'), idleVillage: load('pseudo', 'idleVillage') },
      },
      interpolation: { escapeValue: false },
    });
  });

  const t = (key: string, vars?: Record<string, unknown>) => i18n.t(key, vars);

  it('astrolabeV5 riskDeclared interpolates en + it-IT', async () => {
    expect(t('idleVillage:astrolabeV5.riskDeclared', { death: 12, wound: 34 }))
      .toBe('12% death · 34% wound');
    await i18n.changeLanguage('it-IT');
    expect(t('idleVillage:astrolabeV5.riskDeclared', { death: 12, wound: 34 }))
      .toBe('12% morte · 34% ferita');
    await i18n.changeLanguage('en');
  });

  it('astrolabeV63/V64 check readouts interpolate every placeholder', () => {
    expect(t('idleVillage:astrolabeV63.statVsDc', { stat: 'STR', difficulty: 45 }))
      .toBe('STR vs difficulty 45');
    expect(t('idleVillage:astrolabeV63.mathFmt', { roll: 62, stat: 15, difficulty: 45, tst: 20 }))
      .toBe('D100 62 · TST = 50 + (15 − 45) = 20');
    expect(t('idleVillage:astrolabeV64.risk', { wound: 10, dead: 2 }))
      .toBe('Wound 10% · Death 2%');
    expect(t('idleVillage:astrolabeV64.probability', { pct: 63 }))
      .toBe('Success chance ~63%');
  });

  it('equipment budget + HUD scale hint interpolate', () => {
    expect(t('idleVillage:equipment.balanced', { balance: 7 }))
      .toBe('Within budget (7 points free)');
    expect(t('idleVillage:gameFrame.menu.interfaceSizeAutoHint', { percent: 125 }))
      .toBe('Auto (125%)');
  });

  it('common.missingCount interpolates (was {{count}} literal)', () => {
    expect(t('designVsFidelity.missingCount', { count: 3 })).toBe('3 missing items');
  });

  it('plural sub-messages resolve the count via # (en + pseudo)', () => {
    expect(t('examples.swordCount', { count: 1 })).toBe('one sword');
    expect(t('examples.swordCount', { count: 5 })).toBe('5 swords');
  });

  it('de plural aria-live strings interpolate count + label', async () => {
    await i18n.changeLanguage('de');
    expect(t('idleVillage:activityCapsule.ariaLive.slotFreed', { count: 2, label: 'Hafen' }))
      .toBe('2 Slots von Hafen freigegeben');
    expect(t('idleVillage:activityCapsule.ariaLive.workerAssigned', { count: 1, label: 'Mina' }))
      .toBe('1 Arbeiter Mina zugewiesen');
    await i18n.changeLanguage('en');
  });

  it('pseudo resources still interpolate (markers wrap, placeholders resolve)', async () => {
    await i18n.changeLanguage('pseudo');
    const out = t('idleVillage:astrolabeV5.riskDeclared', { death: 12, wound: 34 });
    expect(out).toContain('12%');
    expect(out).toContain('34%');
    expect(out).not.toMatch(/\{\{/);
    await i18n.changeLanguage('en');
  });
});
