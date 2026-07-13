#!/usr/bin/env tsx
/**
 * @fileoverview Export English locale bundles to XLIFF 1.2 for TMS ingestion.
 *
 * Reads `public/locales/en/*.json` and optional `*.meta.json` for context and
 * maxLength. Writes `dist/i18n/tms-export/<namespace>.xlf`.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_EN_DIR,
  flattenKeys,
  getValueAtKeyPath,
  loadMetaForNamespace,
  type NamespaceMeta,
  type TranslationMeta,
} from './keyUtils.ts';

const ROOT = process.cwd();
const EN_DIR = process.env['I18N_EN_DIR']
  ? path.resolve(process.env['I18N_EN_DIR'])
  : DEFAULT_EN_DIR;
const OUTPUT_DIR = process.env['I18N_EXPORT_DIR']
  ? path.resolve(process.env['I18N_EXPORT_DIR'])
  : path.join(ROOT, 'dist', 'i18n', 'tms-export');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildXliff(namespace: string, sourceLang: string, units: TranslationUnit[]): string {
  const now = new Date().toISOString();
  const unitXml = units
    .map((unit) => {
      const notes = [];
      if (unit.context) {
        notes.push(`      <note from="context">${escapeXml(unit.context)}</note>`);
      }
      if (unit.description) {
        notes.push(`      <note from="description">${escapeXml(unit.description)}</note>`);
      }
      if (unit.maxLength && unit.maxLength > 0) {
        notes.push(`      <note from="maxLength">${unit.maxLength}</note>`);
      }
      const noteBlock = notes.length ? `\n${notes.join('\n')}\n    ` : '';
      return `    <trans-unit id="${escapeXml(unit.id)}" datatype="plaintext"${unit.maxLength && unit.maxLength > 0 ? ` size-unit="char" maxwidth="${unit.maxLength}"` : ''}>
      <source>${escapeXml(unit.source)}</source>${noteBlock}
    </trans-unit>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file original="${namespace}" source-language="${sourceLang}" datatype="plaintext">
    <header>
      <tool tool-id="rpg-i18n" tool-name="RPG i18n TMS exporter" tool-version="1.0" build-num="${now}"/>
    </header>
    <body>
${unitXml}
    </body>
  </file>
</xliff>
`;
}

interface TranslationUnit {
  id: string;
  source: string;
  context: string;
  description: string;
  maxLength: number;
}

function getMetaForKey(meta: NamespaceMeta, key: string, defaultSource: string): TranslationMeta {
  const existing = meta[key];
  const context = existing?.context ?? `namespace:${key}`;
  const description = existing?.description ?? '';
  let maxLength = existing?.maxLength ?? 0;
  if (maxLength === 0 && defaultSource) {
    // Provide a sensible default for translators (source length + 40% expansion headroom).
    maxLength = Math.ceil(defaultSource.length * 1.4);
  }
  return { context, description, maxLength };
}

async function exportTms(): Promise<void> {
  const sourceLang = 'en';
  const outputPath = path.join(OUTPUT_DIR, sourceLang);
  await fs.mkdir(outputPath, { recursive: true });

  const entries = await fs.readdir(EN_DIR, { withFileTypes: true });
  const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'));

  for (const entry of jsonFiles) {
    const namespace = path.basename(entry.name, '.json');
    const jsonPath = path.join(EN_DIR, entry.name);
    const metaPath = path.join(EN_DIR, `${namespace}.meta.json`);

    const content = await fs.readFile(jsonPath, 'utf8');
    const resources = JSON.parse(content) as Record<string, unknown>;
    const meta = await loadMetaForNamespace(metaPath);

    const keys = flattenKeys(resources, '');
    const units: TranslationUnit[] = [];

    for (const key of keys) {
      const value = getValueAtKeyPath(resources, key);
      if (typeof value !== 'string') {
        // Non-leaf or non-string values (numbers, objects) are not translatable strings.
        continue;
      }
      const metaForKey = getMetaForKey(meta, key, value);
      units.push({
        id: key,
        source: value,
        context: metaForKey.context ?? '',
        description: metaForKey.description ?? '',
        maxLength: metaForKey.maxLength ?? 0,
      });
    }

    const xliff = buildXliff(namespace, sourceLang, units);
    const outFile = path.join(outputPath, `${namespace}.xlf`);
    await fs.writeFile(outFile, xliff, 'utf8');
    console.log(`Exported ${namespace}: ${units.length} unit(s) -> ${path.relative(ROOT, outFile)}`);
  }

  console.log(`\nTMS export complete: ${path.relative(ROOT, outputPath)}`);
}

exportTms().catch((error) => {
  console.error('TMS export failed:', error);
  process.exit(1);
});
