import { promises as fs } from 'node:fs';
import path from 'node:path';
import { mergeResourcesAsInterface } from 'i18next-resources-for-ts';

const ROOT = process.cwd();
const EN_LOCALES_DIR = path.join(ROOT, 'public', 'locales', 'en');
const OUTPUT_FILE = path.join(ROOT, 'src', 'localization', 'i18n.types.ts');

interface NamespaceInput {
  name: string;
  resources: Record<string, unknown>;
}

async function collectNamespaces(): Promise<NamespaceInput[]> {
  const files = await fs.readdir(EN_LOCALES_DIR);
  const jsonFiles = files.filter((file) => file.endsWith('.json') && !file.endsWith('.meta.json'));

  return Promise.all(
    jsonFiles.map(async (file) => {
      const filePath = path.join(EN_LOCALES_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const name = path.basename(file, '.json');
      return {
        name,
        resources: JSON.parse(content) as Record<string, unknown>,
      };
    }),
  );
}

async function generateTypes() {
  const namespaces = await collectNamespaces();
  const resourcesInterface = mergeResourcesAsInterface(namespaces, { indentation: 2 });

  const output = [
    "import 'i18next';",
    '',
    resourcesInterface,
    '',
    "declare module 'i18next' {",
    '  interface CustomTypeOptions {',
    "    defaultNS: 'common';",
    '    parseInterpolation: false;',
    '    resources: Resources;',
    '  }',
    '}',
    '',
  ].join('\n');

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, output, 'utf8');

  console.log(`Generated ${OUTPUT_FILE} from ${namespaces.length} namespace(s).`);
}

generateTypes().catch((error) => {
  console.error('Failed to generate i18n types:', error);
  process.exit(1);
});
