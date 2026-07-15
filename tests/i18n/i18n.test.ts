import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildReports,
  extractUsedKeysFromContent,
  extractUsedKeys,
  loadNamespaces,
  flattenKeys,
  getValueAtKeyPath,
} from '../../scripts/i18n/keyUtils.ts';
import { generatePseudo, transformValue } from '../../scripts/i18n/generatePseudo.ts';
import { pseudoLocalize } from '../../src/localization/pseudoLocalize.ts';
import {
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatRelativeTime,
} from '../../src/localization/intlFormatters.ts';
import { getDirectionForLocale, isRTL, getLocaleFontFamily, getTextExpansionFactor } from '../../src/localization/LocaleConfig.ts';

function normalize(src: string): string {
  return src.replace(/\s+/g, ' ').trim();
}

describe('pseudo-localization', () => {
  it('wraps output with pseudo markers and expands text', () => {
    const input = 'Hello';
    const output = pseudoLocalize(input);
    expect(output.startsWith('!! ')).toBe(true);
    expect(output.endsWith(' !!')).toBe(true);
    expect(output.length).toBeGreaterThan(input.length);
  });

  it('preserves ICU placeholders and HTML tags', () => {
    const input = 'Hello <b>{name}</b>!';
    const output = pseudoLocalize(input);
    expect(output).toContain('{name}');
    expect(output).toContain('<b>');
    expect(output).toContain('</b>');
  });

  it('transforms a nested object consistently', () => {
    const input = {
      greeting: 'Hello {name}',
      meta: { count: 5, label: 'Items' },
    };
    const output = transformValue(input) as typeof input;
    expect(output.greeting).toBe(pseudoLocalize('Hello {name}'));
    expect(output.meta.count).toBe(5);
    expect(output.meta.label).toBe(pseudoLocalize('Items'));
  });
});

describe('key extraction', () => {
  it('extracts t() keys with default namespace from useTranslation', () => {
    const src = `
      import { useTranslation } from 'src/localization/useTranslation';
      export function Demo() {
        const { t } = useTranslation('common');
        return t('appName');
      }
    `;
    const keys = extractUsedKeysFromContent(normalize(src), 'Demo.tsx');
    expect(keys).toHaveLength(1);
    expect(keys[0].namespace).toBe('common');
    expect(keys[0].key).toBe('appName');
  });

  it('handles namespace:key and ns option overrides', () => {
    const src = `
      import { useTranslation } from 'src/localization/useTranslation';
      export function Demo() {
        const { t } = useTranslation('common');
        return (
          <>
            {t('idleVillage:workerTooltip.labels.bio')}
            {t('greeting', { ns: 'other' })}
            <Trans i18nKey="transKey" ns="other" />
          </>
        );
      }
    `;
    const keys = extractUsedKeysFromContent(normalize(src), 'Demo.tsx');
    const idle = keys.find((k) => k.namespace === 'idleVillage');
    const other = keys.filter((k) => k.namespace === 'other');
    expect(idle?.key).toBe('workerTooltip.labels.bio');
    expect(other).toHaveLength(2);
    expect(other.map((k) => k.key).sort()).toEqual(['greeting', 'transKey']);
  });

  it('detects missing keys against a namespace', () => {
    const usages: ReturnType<typeof extractUsedKeysFromContent> = [
      { namespace: 'common', key: 'appName', file: 'Demo.tsx', line: 1 },
      { namespace: 'common', key: 'missingKey', file: 'Demo.tsx', line: 2 },
    ];
    const namespaces = { common: { appName: 'RPG' } };
    const reports = buildReports(usages, namespaces);
    expect(reports).toHaveLength(1);
    expect(reports[0].missing).toHaveLength(1);
    expect(reports[0].missing[0].key).toBe('missingKey');
    expect(reports[0].present).toHaveLength(1);
    expect(reports[0].present[0]).toBe('appName');
  });
});

describe('pseudo-locale consistency', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'i18n-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('generates pseudo files matching English keys with transformed strings', async () => {
    const enDir = path.join(tmpDir, 'locales', 'en');
    const pseudoDir = path.join(tmpDir, 'locales', 'pseudo');
    await mkdir(enDir, { recursive: true });
    await mkdir(pseudoDir, { recursive: true });

    const enData = {
      appName: 'RPG Balancer',
      greeting: 'Hello {name}',
      nested: { label: 'Items' },
    };
    await writeFile(path.join(enDir, 'common.json'), JSON.stringify(enData, null, 2));

    await generatePseudo(enDir, pseudoDir);

    const enNamespaces = await loadNamespaces(enDir);
    const pseudoNamespaces = await loadNamespaces(pseudoDir);

    const enKeys = flattenKeys(enNamespaces.common, '');
    const pseudoKeys = flattenKeys(pseudoNamespaces.common, '');
    expect(pseudoKeys.sort()).toEqual(enKeys.sort());

    for (const key of enKeys) {
      const enValue = getValueAtKeyPath(enNamespaces.common, key);
      const pseudoValue = getValueAtKeyPath(pseudoNamespaces.common, key);
      if (typeof enValue === 'string') {
        expect(pseudoValue).toBe(pseudoLocalize(enValue));
      }
    }
  });
});

describe('extractUsedKeys from source tree', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'i18n-src-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('reads keys from a temporary source tree', async () => {
    const componentDir = path.join(tmpDir, 'components');
    await mkdir(componentDir, { recursive: true });
    const src = `
      import { useTranslation } from 'src/localization/useTranslation';
      export function Demo() {
        const { t } = useTranslation('common');
        return t('treeKey');
      }
    `;
    await writeFile(path.join(componentDir, 'Demo.tsx'), normalize(src));

    const keys = await extractUsedKeys(tmpDir);
    expect(keys).toHaveLength(1);
    expect(keys[0].namespace).toBe('common');
    expect(keys[0].key).toBe('treeKey');
  });
});

describe('intl formatters', () => {
  it('formatNumber formats decimals with locale', () => {
    expect(formatNumber(1234.5, { locale: 'en-US' })).toBe('1,234.5');
    expect(formatNumber(1234.5, { locale: 'de-DE' })).toBe('1.234,5');
  });

  it('formatPercent formats a percentage value', () => {
    expect(formatPercent(42.5, { locale: 'en-US' })).toMatch(/42\.5\s*%/);
    expect(formatPercent(42.5, { locale: 'de-DE' })).toMatch(/42,5\s*%/);
  });

  it('formatDate formats a date with locale', () => {
    const date = new Date(2026, 6, 13); // Jul 13 2026
    expect(formatDate(date, { locale: 'en-US' })).toContain('7');
    expect(formatDate(date, { locale: 'de-DE' })).toContain('13');
  });

  it('formatDateTime formats date and time', () => {
    const date = new Date(2026, 6, 13, 14, 30, 0);
    expect(formatDateTime(date, { locale: 'en-US', hour12: false })).toContain('14');
    expect(formatDateTime(date, { locale: 'de-DE', hour12: false })).toContain('14');
  });

  it('formatCurrency formats a currency amount', () => {
    expect(formatCurrency(1234.5, 'USD', { locale: 'en-US' })).toContain('$');
    expect(formatCurrency(1234.5, 'EUR', { locale: 'de-DE' })).toContain('€');
  });

  it('formatRelativeTime formats a relative time', () => {
    expect(formatRelativeTime(-1, 'day', { locale: 'en-US' })).toBe('yesterday');
    expect(formatRelativeTime(1, 'day', { locale: 'en-US' })).toBe('tomorrow');
  });
});

describe('locale direction and font', () => {
  it('getDirectionForLocale returns rtl for Arabic/Hebrew and ltr for others', () => {
    expect(getDirectionForLocale('ar')).toBe('rtl');
    expect(getDirectionForLocale('he-IL')).toBe('rtl');
    expect(getDirectionForLocale('en')).toBe('ltr');
    expect(getDirectionForLocale('de-DE')).toBe('ltr');
  });

  it('isRTL returns true for Arabic and false for English', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('en')).toBe(false);
  });

  it('getLocaleFontFamily returns a locale-specific font stack', () => {
    expect(getLocaleFontFamily('ar')).toContain('Noto Sans Arabic');
    expect(getLocaleFontFamily('ja')).toContain('Source Han Sans JP');
    expect(getLocaleFontFamily('zh-CN')).toContain('Source Han Sans SC');
    expect(getLocaleFontFamily('en')).toContain('Cinzel');
  });

  it('getTextExpansionFactor returns higher values for pseudo and de', () => {
    expect(getTextExpansionFactor('pseudo')).toBe(1.3);
    expect(getTextExpansionFactor('de')).toBe(1.15);
    expect(getTextExpansionFactor('en')).toBe(1.0);
  });
});

describe('TMS export/import', () => {
  let tmpDir: string;
  let enDir: string;
  let importDir: string;
  let outLocalesDir: string;
  let exportDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'i18n-tms-'));
    enDir = path.join(tmpDir, 'locales', 'en');
    importDir = path.join(tmpDir, 'import');
    outLocalesDir = path.join(tmpDir, 'locales-out');
    exportDir = path.join(tmpDir, 'export');

    await mkdir(enDir, { recursive: true });
    await mkdir(importDir, { recursive: true });
    await mkdir(outLocalesDir, { recursive: true });

    const enCommon = {
      appName: 'RPG Balancer',
      greeting: 'Hello {name}',
      nested: { label: 'Items' },
    };
    const enMeta = {
      appName: { context: 'App title', maxLength: 32 },
      'nested.label': { context: 'Inventory label', maxLength: 20 },
    };
    await writeFile(path.join(enDir, 'common.json'), JSON.stringify(enCommon, null, 2));
    await writeFile(path.join(enDir, 'common.meta.json'), JSON.stringify(enMeta, null, 2));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  function runScript(script: string, extraEnv: Record<string, string>): void {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'i18n', script);
    execFileSync('npx', ['tsx', scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnv },
      stdio: 'pipe',
    });
  }

  it('exports English JSON to XLIFF with context and maxLength', async () => {
    runScript('exportTms.ts', {
      I18N_EN_DIR: enDir,
      I18N_EXPORT_DIR: exportDir,
    });

    const xlfPath = path.join(exportDir, 'en', 'common.xlf');
    const xlf = await readFile(xlfPath, 'utf8');
    expect(xlf).toContain('appName');
    expect(xlf).toContain('RPG Balancer');
    expect(xlf).toContain('App title');
    expect(xlf).toContain('maxwidth="32"');
    expect(xlf).toContain('Hello {name}');
  });

  it('imports translated XLIFF into locale JSON and preserves metadata', async () => {
    runScript('exportTms.ts', {
      I18N_EN_DIR: enDir,
      I18N_EXPORT_DIR: exportDir,
    });

    const xlfPath = path.join(exportDir, 'en', 'common.xlf');
    let xlf = await readFile(xlfPath, 'utf8');
    // Add an Italian translation target.
    xlf = xlf.replace(/<source>([^<]+)<\/source>/g, (match, source) => {
      const target = source === 'RPG Balancer' ? 'Bilanciere GDR' : `[it] ${source}`;
      return match + `<target>${target}</target>`;
    });

    const itImportDir = path.join(importDir, 'it-IT');
    await mkdir(itImportDir, { recursive: true });
    await writeFile(path.join(itImportDir, 'common.xlf'), xlf);

    runScript('importTms.ts', {
      I18N_IMPORT_DIR: importDir,
      I18N_EN_DIR: enDir,
      I18N_OUTPUT_LOCALES_DIR: outLocalesDir,
    });

    const itJson = JSON.parse(await readFile(path.join(outLocalesDir, 'it-IT', 'common.json'), 'utf8')) as Record<string, unknown>;
    expect(itJson.appName).toBe('Bilanciere GDR');
    expect(itJson.greeting).toBe('[it] Hello {name}');
    expect(itJson.nested).toEqual({ label: '[it] Items' });

    const itMeta = JSON.parse(await readFile(path.join(outLocalesDir, 'it-IT', 'common.meta.json'), 'utf8')) as Record<string, unknown>;
    expect((itMeta.appName as { context?: string }).context).toBe('App title');
    expect((itMeta.appName as { maxLength?: number }).maxLength).toBe(32);
  });
});
