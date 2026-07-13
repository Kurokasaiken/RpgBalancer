import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pseudoLocalize } from '../../src/localization/pseudoLocalize.ts';

const ROOT = process.cwd();
const EN_LOCALES_DIR = path.join(ROOT, 'public', 'locales', 'en');
const PSEUDO_LOCALES_DIR = path.join(ROOT, 'public', 'locales', 'pseudo');

function transformValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return pseudoLocalize(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => transformValue(item));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = transformValue(val);
    }
    return result;
  }
  return value;
}

async function buildPseudo() {
  await fs.mkdir(PSEUDO_LOCALES_DIR, { recursive: true });

  const files = await fs.readdir(EN_LOCALES_DIR);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));

  await Promise.all(
    jsonFiles.map(async (file) => {
      const sourcePath = path.join(EN_LOCALES_DIR, file);
      const targetPath = path.join(PSEUDO_LOCALES_DIR, file);

      const content = await fs.readFile(sourcePath, 'utf8');
      const sourceData = JSON.parse(content) as Record<string, unknown>;
      const pseudoData = transformValue(sourceData);

      await fs.writeFile(targetPath, `${JSON.stringify(pseudoData, null, 2)}\n`, 'utf8');
      console.log(`Generated ${path.relative(ROOT, targetPath)}`);
    }),
  );
}

buildPseudo().catch((error) => {
  console.error('Failed to build pseudo locale:', error);
  process.exit(1);
});
