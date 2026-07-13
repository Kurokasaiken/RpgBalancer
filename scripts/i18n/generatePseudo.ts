import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pseudoLocalize } from '../../src/localization/pseudoLocalize.ts';

export function transformValue(value: unknown): unknown {
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

export async function generatePseudo(
  enDir: string,
  pseudoDir: string,
): Promise<void> {
  await fs.mkdir(pseudoDir, { recursive: true });

  const files = await fs.readdir(enDir);
  const jsonFiles = files.filter((file) => file.endsWith('.json') && !file.endsWith('.meta.json'));

  await Promise.all(
    jsonFiles.map(async (file) => {
      const sourcePath = path.join(enDir, file);
      const targetPath = path.join(pseudoDir, file);

      const content = await fs.readFile(sourcePath, 'utf8');
      const sourceData = JSON.parse(content) as Record<string, unknown>;
      const pseudoData = transformValue(sourceData);

      await fs.writeFile(
        targetPath,
        `${JSON.stringify(pseudoData, null, 2)}\n`,
        'utf8',
      );
      console.log(`Generated ${path.relative(process.cwd(), targetPath)}`);
    }),
  );
}

const isMain = (() => {
  try {
    const invoked = path.resolve(process.argv[1] ?? '');
    const self = fileURLToPath(import.meta.url);
    return invoked === self;
  } catch {
    return false;
  }
})();

if (isMain) {
  const ROOT = process.cwd();
  const EN_LOCALES_DIR = path.join(ROOT, 'public', 'locales', 'en');
  const PSEUDO_LOCALES_DIR = path.join(ROOT, 'public', 'locales', 'pseudo');

  generatePseudo(EN_LOCALES_DIR, PSEUDO_LOCALES_DIR).catch((error) => {
    console.error('Failed to generate pseudo locale:', error);
    process.exit(1);
  });
}
