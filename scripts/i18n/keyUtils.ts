import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface KeyUsage {
  namespace: string;
  key: string;
  file: string;
  line: number;
}

export interface KeyReport {
  namespace: string;
  missing: KeyUsage[];
  obsolete: string[];
  present: string[];
}

export const DEFAULT_SOURCE_ROOT = 'src/ui';
export const DEFAULT_LOCALES_DIR = 'public/locales';
export const DEFAULT_EN_DIR = path.join(DEFAULT_LOCALES_DIR, 'en');

const EXCLUDE_DIR = /(?:__tests__|__mocks__|node_modules|_OLD_DEPRECATED|\.git)/;
const EXCLUDE_FILE = /\.(?:test|spec)\.(?:ts|tsx)$/;
const EXCLUDE_LOCALE_FILE = /\.(?:meta|xliff|xlf|po|mo)$/i;

export async function collectSourceFiles(
  root: string = DEFAULT_SOURCE_ROOT,
  extensions: string[] = ['ts', 'tsx'],
): Promise<string[]> {
  const files: string[] = [];
  const rootPath = path.resolve(process.cwd(), root);

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDE_DIR.test(entry.name)) continue;
        await walk(full);
      } else if (entry.isFile()) {
        if (EXCLUDE_FILE.test(full)) continue;
        if (extensions.some((ext) => full.endsWith(`.${ext}`))) {
          files.push(full);
        }
      }
    }
  }

  await walk(rootPath);
  return files;
}

export async function loadNamespaces(
  enDir: string = DEFAULT_EN_DIR,
): Promise<Record<string, Record<string, unknown>>> {
  const namespaces: Record<string, Record<string, unknown>> = {};
  const dirPath = path.resolve(process.cwd(), enDir);

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json') && !EXCLUDE_LOCALE_FILE.test(entry.name)) {
        const name = path.basename(entry.name, '.json');
        const content = await fs.readFile(path.join(dirPath, entry.name), 'utf8');
        namespaces[name] = JSON.parse(content) as Record<string, unknown>;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load English namespaces from ${dirPath}: ${message}`);
  }

  return namespaces;
}

export function flattenKeys(obj: unknown, prefix = ''): string[] {
  const keys: string[] = [];

  if (obj === null || typeof obj !== 'object') {
    if (prefix) keys.push(prefix);
    return keys;
  }

  if (Array.isArray(obj)) {
    if (prefix) keys.push(prefix);
    return keys;
  }

  if (prefix) {
    keys.push(prefix);
  }

  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const childPrefix = prefix ? `${prefix}.${k}` : k;
    keys.push(...flattenKeys(v, childPrefix));
  }

  return keys;
}

export function getValueAtKeyPath(
  obj: unknown,
  keyPath: string,
  keySeparator = '.',
): unknown | undefined {
  const parts = keyPath.split(keySeparator);
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setValueAtKeyPath(
  obj: Record<string, unknown>,
  keyPath: string,
  value: unknown,
  keySeparator = '.',
): void {
  const parts = keyPath.split(keySeparator);
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export interface TranslationMeta {
  context?: string;
  maxLength?: number;
  description?: string;
}

export type NamespaceMeta = Record<string, TranslationMeta>;

export async function loadMetaForNamespace(
  metaPath: string,
): Promise<NamespaceMeta> {
  try {
    const content = await fs.readFile(metaPath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as NamespaceMeta;
    }
  } catch {
    // Missing or invalid meta is fine; return empty defaults.
  }
  return {};
}

export async function saveMetaForNamespace(
  metaPath: string,
  meta: NamespaceMeta,
): Promise<void> {
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

export function resolveKey(
  rawKey: string,
  defaultNamespace: string,
  namespaceSeparator = ':',
): { namespace: string; key: string } {
  if (rawKey.includes(namespaceSeparator)) {
    const [ns, ...rest] = rawKey.split(namespaceSeparator);
    return { namespace: ns, key: rest.join(namespaceSeparator) };
  }
  return { namespace: defaultNamespace, key: rawKey };
}

function parseUseTranslationCalls(content: string): { namespace: string; index: number }[] {
  const regex = /useTranslation\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const calls: { namespace: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    calls.push({ namespace: match[1], index: match.index });
  }
  return calls;
}

function findNamespaceAtIndex(
  calls: { namespace: string; index: number }[],
  index: number,
): string {
  let result = 'common';
  for (const call of calls) {
    if (call.index <= index) {
      result = call.namespace;
    } else {
      break;
    }
  }
  return result;
}

function parseOptionsNs(optionsStr: string): string | null {
  const match = optionsStr.match(/ns\s*:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

export function extractUsedKeysFromContent(
  content: string,
  filePath: string,
): KeyUsage[] {
  const usages: KeyUsage[] = [];
  const useTranslationCalls = parseUseTranslationCalls(content);
  const lineIndex = buildLineIndex(content);

  // t('key', { ns: 'foo' }) or i18n.t('key')
  const tRegex = /(?:^|[^a-zA-Z0-9_])t\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[^}]*\}))?\s*\)/g;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = tRegex.exec(content)) !== null) {
    const rawKey = tMatch[1];
    const optionsStr = tMatch[2] ?? '';
    const defaultNs = findNamespaceAtIndex(useTranslationCalls, tMatch.index);
    const optionsNs = parseOptionsNs(optionsStr);
    const resolved = resolveKey(rawKey, optionsNs ?? defaultNs);
    usages.push({
      namespace: resolved.namespace,
      key: resolved.key,
      file: filePath,
      line: lineNumberAtIndex(lineIndex, tMatch.index),
    });
  }

  // <Trans i18nKey="foo" ns="bar" />
  const transRegex = /<Trans\b[^>]*\bi18nKey\s*=\s*['"]([^'"]+)['"][^>]*>/g;
  let transMatch: RegExpExecArray | null;
  while ((transMatch = transRegex.exec(content)) !== null) {
    const rawKey = transMatch[1];
    const tagContent = transMatch[0];
    const nsMatch = tagContent.match(/\bns\s*=\s*['"]([^'"]+)['"]/);
    const defaultNs = findNamespaceAtIndex(useTranslationCalls, transMatch.index);
    const resolved = resolveKey(rawKey, nsMatch?.[1] ?? defaultNs);
    usages.push({
      namespace: resolved.namespace,
      key: resolved.key,
      file: filePath,
      line: lineNumberAtIndex(lineIndex, transMatch.index),
    });
  }

  return usages;
}

export async function extractUsedKeys(
  root: string = DEFAULT_SOURCE_ROOT,
): Promise<KeyUsage[]> {
  const files = await collectSourceFiles(root);
  const usages: KeyUsage[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    usages.push(...extractUsedKeysFromContent(content, file));
  }
  return usages;
}

export function dedupeByKey<T extends { namespace: string; key: string }>(
  items: T[],
): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const signature = `${item.namespace}:${item.key}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export function buildReports(
  usages: KeyUsage[],
  namespaces: Record<string, Record<string, unknown>>,
): KeyReport[] {
  const groupedByNs = new Map<string, KeyUsage[]>();
  for (const usage of usages) {
    const list = groupedByNs.get(usage.namespace) ?? [];
    list.push(usage);
    groupedByNs.set(usage.namespace, list);
  }

  const reports: KeyReport[] = [];
  for (const [namespace, nsUsages] of groupedByNs) {
    const enKeys = new Set(flattenKeys(namespaces[namespace] ?? {}, ''));
    const deduped = dedupeByKey(nsUsages);
    const missing = deduped.filter((u) => !enKeys.has(u.key));
    const present = deduped.filter((u) => enKeys.has(u.key));
    const usedKeys = new Set(deduped.map((u) => u.key));
    const obsolete = [...enKeys].filter((k) => !usedKeys.has(k));
    reports.push({ namespace, missing, obsolete, present: present.map((u) => u.key) });
  }

  // Also report namespaces present in JSON but not used as empty report
  for (const namespace of Object.keys(namespaces)) {
    if (!groupedByNs.has(namespace)) {
      const enKeys = flattenKeys(namespaces[namespace], '');
      reports.push({ namespace, missing: [], obsolete: enKeys, present: [] });
    }
  }

  return reports.sort((a, b) => a.namespace.localeCompare(b.namespace));
}

function buildLineIndex(content: string): number[] {
  const indices: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      indices.push(i + 1);
    }
  }
  return indices;
}

function lineNumberAtIndex(lineIndex: number[], index: number): number {
  for (let i = 0; i < lineIndex.length; i++) {
    if (index < lineIndex[i]) return i;
  }
  return lineIndex.length;
}

export function formatKeyUsage(usage: KeyUsage): string {
  return `  ${usage.key} (${path.relative(process.cwd(), usage.file)}:${usage.line})`;
}
