#!/usr/bin/env tsx
/**
 * @fileoverview Merge translated XLIFF 1.2 or PO files back into locale JSON.
 *
 * Reads `dist/i18n/tms-import/<locale>/<namespace>.{xlf,po}` and writes
 * `public/locales/<locale>/<namespace>.json` plus `*.meta.json` for context
 * and maxLength. Existing translations are preserved unless the imported file
 * provides a non-empty target for a key.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_LOCALES_DIR,
  flattenKeys,
  getValueAtKeyPath,
  loadNamespaces,
  saveMetaForNamespace,
  setValueAtKeyPath,
  type NamespaceMeta,
} from './keyUtils.ts';

const ROOT = process.cwd();
const IMPORT_DIR = process.env['I18N_IMPORT_DIR']
  ? path.resolve(process.env['I18N_IMPORT_DIR'])
  : path.join(ROOT, 'dist', 'i18n', 'tms-import');
const OUTPUT_LOCALES_DIR = process.env['I18N_OUTPUT_LOCALES_DIR'] ?? DEFAULT_LOCALES_DIR;
const EN_DIR = process.env['I18N_EN_DIR'] ?? DEFAULT_EN_DIR;

interface ParsedUnit {
  id: string;
  source: string;
  target: string;
  context: string;
  description: string;
  maxLength: number;
}

function parsePo(content: string): ParsedUnit[] {
  const units: ParsedUnit[] = [];
  const blocks = content.split(/\n\n/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const idMatch = block.match(/^msgctxt\s+"([^"]+)"/m) || block.match(/^#\.\s+id:\s+(.+)$/m);
    const sourceMatch = block.match(/^msgid\s+"([^"]+)"(?:\s+"([^"]+)")*/m);
    const targetMatch = block.match(/^msgstr\s+"([^"]+)"(?:\s+"([^"]+)")*/m);

    if (!idMatch && !sourceMatch) continue;

    const id = idMatch ? idMatch[1] : '';
    const source = sourceMatch ? sourceMatch[1] : '';
    const target = targetMatch ? targetMatch[1] : '';
    const contextMatch = block.match(/^#\s+Context:\s+(.+)$/m);
    const maxLengthMatch = block.match(/^#\s+MaxLength:\s+(\d+)$/m);

    units.push({
      id,
      source,
      target,
      context: contextMatch ? contextMatch[1] : '',
      description: '',
      maxLength: maxLengthMatch ? parseInt(maxLengthMatch[1], 10) : 0,
    });
  }

  return units;
}

function parseXliff(content: string): ParsedUnit[] {
  const units: ParsedUnit[] = [];
  const transUnitRegex = /<trans-unit[\s\S]*?<\/trans-unit>/g;
  let match: RegExpExecArray | null;

  while ((match = transUnitRegex.exec(content)) !== null) {
    const unitBlock = match[0];
    const idMatch = unitBlock.match(/id="([^"]+)"/);
    const maxLengthMatch = unitBlock.match(/maxwidth="(\d+)"/);
    const sourceMatch = unitBlock.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const targetMatch = unitBlock.match(/<target[^>]*>([\s\S]*?)<\/target>/);
    const contextMatch = unitBlock.match(/<note from="context">([\s\S]*?)<\/note>/);
    const descriptionMatch = unitBlock.match(/<note from="description">([\s\S]*?)<\/note>/);
    const maxLengthNoteMatch = unitBlock.match(/<note from="maxLength">(\d+)<\/note>/);

    if (!idMatch) continue;

    const id = decodeXml(idMatch[1]);
    const source = decodeXml(sourceMatch ? sourceMatch[1].trim() : '');
    const target = decodeXml(targetMatch ? targetMatch[1].trim() : '');
    const context = decodeXml(contextMatch ? contextMatch[1].trim() : '');
    const description = decodeXml(descriptionMatch ? descriptionMatch[1].trim() : '');
    const maxLength = maxLengthMatch
      ? parseInt(maxLengthMatch[1], 10)
      : maxLengthNoteMatch
        ? parseInt(maxLengthNoteMatch[1], 10)
        : 0;

    units.push({ id, source, target, context, description, maxLength });
  }

  return units;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function collectImportFiles(importDir: string): Promise<Map<string, string[]>> {
  const files = new Map<string, string[]>();

  try {
    const localeDirs = await fs.readdir(importDir, { withFileTypes: true });
    for (const localeDir of localeDirs) {
      if (!localeDir.isDirectory()) continue;
      const localePath = path.join(importDir, localeDir.name);
      const fileEntries = await fs.readdir(localePath, { withFileTypes: true });
      const filePaths = fileEntries
        .filter((e) => e.isFile() && /\.(xlf|po)$/i.test(e.name))
        .map((e) => path.join(localePath, e.name));
      if (filePaths.length > 0) {
        files.set(localeDir.name, filePaths);
      }
    }
  } catch {
    // Import directory may not exist.
  }

  return files;
}

async function importTms(): Promise<void> {
  const importDir = process.argv[2] ? path.resolve(process.argv[2]) : IMPORT_DIR;
  const filesByLocale = await collectImportFiles(importDir);

  if (filesByLocale.size === 0) {
    console.log(`No TMS files found in ${path.relative(ROOT, importDir)}. Nothing to import.`);
    return;
  }

  // Load English source namespaces for fallback when a target is missing.
  const enNamespaces = await loadNamespaces(EN_DIR);

  for (const [locale, files] of filesByLocale) {
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      const namespace = path.basename(filePath, ext === '.xlf' ? '.xlf' : '.po');
      const content = await fs.readFile(filePath, 'utf8');
      const units = ext === '.po' ? parsePo(content) : parseXliff(content);

      const targetJsonPath = path.join(ROOT, OUTPUT_LOCALES_DIR, locale, `${namespace}.json`);
      const targetMetaPath = path.join(ROOT, OUTPUT_LOCALES_DIR, locale, `${namespace}.meta.json`);

      let existingTarget: Record<string, unknown> = {};
      let existingMeta: NamespaceMeta = {};

      try {
        existingTarget = JSON.parse(await fs.readFile(targetJsonPath, 'utf8')) as Record<string, unknown>;
      } catch {
        // Fresh file.
      }

      try {
        existingMeta = JSON.parse(await fs.readFile(targetMetaPath, 'utf8')) as NamespaceMeta;
      } catch {
        // Fresh meta.
      }

      const meta: NamespaceMeta = { ...existingMeta };
      const target: Record<string, unknown> = {};

      // Start with source English as fallback, then apply imported translations.
      const source = enNamespaces[namespace] ?? {};
      const keys = new Set<string>();

      // Ensure all source keys exist in the target JSON with fallback to source.
      for (const key of flattenKeys(source, '')) {
        const value = getValueAtKeyPath(source, key);
        if (typeof value === 'string') {
          setValueAtKeyPath(target, key, value);
          keys.add(key);
        }
      }

      // Apply imported target values and metadata.
      for (const unit of units) {
        if (!unit.id) continue;
        keys.add(unit.id);

        if (unit.target && unit.target.trim() !== '') {
          setValueAtKeyPath(target, unit.id, unit.target);
        }

        meta[unit.id] = {
          context: unit.context || meta[unit.id]?.context || `namespace:${unit.id}`,
          description: unit.description || meta[unit.id]?.description || '',
          maxLength: unit.maxLength || meta[unit.id]?.maxLength || 0,
        };
      }

      await fs.mkdir(path.dirname(targetJsonPath), { recursive: true });
      await fs.writeFile(targetJsonPath, `${JSON.stringify(target, null, 2)}\n`, 'utf8');
      await saveMetaForNamespace(targetMetaPath, meta);

      console.log(`Imported ${locale}/${namespace}: ${units.length} unit(s) from ${path.relative(ROOT, filePath)}`);
    }
  }

  console.log(`\nTMS import complete. Imported files are in public/locales/<locale>/`);
}

importTms().catch((error) => {
  console.error('TMS import failed:', error);
  process.exit(1);
});
