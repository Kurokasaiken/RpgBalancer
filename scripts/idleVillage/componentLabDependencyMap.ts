import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * Component Lab Dependency Mapper CLI
 * -----------------------------------
 * Inspects Idle Village component sources and produces JSON/Markdown reports
 * aligned with `component_lab_intake_template.md` dependency matrix requirements.
 *
 * Usage example:
 *   tsx scripts/idleVillage/componentLabDependencyMap.ts --components=night_threat,expedition_list
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_OUTPUT_DIR = path.resolve(PROJECT_ROOT, 'tmp', 'component-lab-deps');

type DependencyCategory = 'config' | 'hook' | 'asset' | 'other';

export interface ComponentCatalogEntry {
  label: string;
  description: string;
  sourcePaths: string[];
  fallbackPaths?: string[];
  notes?: string[];
}

interface ParsedImport {
  moduleSpecifier: string;
  namedImports: string[];
}

export interface ComponentDependencyReport {
  componentId: string;
  label: string;
  description: string;
  templateReference: string;
  analyzedFiles: string[];
  missingSources: string[];
  dependencies: {
    config: string[];
    hooks: string[];
    assets: string[];
    other: string[];
  };
  telemetryEvents: string[];
  persistenceKeys: string[];
  notes: string[];
  generatedAt: string;
}

export const COMPONENT_CATALOG: Record<string, ComponentCatalogEntry> = {
  night_threat: {
    label: 'Night Threat HUD',
    description: 'Countdown HUD + spy mitigation slot extracted from Village Sandbox.',
    sourcePaths: [
      'src/ui/idleVillage/components/nightThreat',
      'src/ui/idleVillage/VillageSandbox.tsx',
    ],
    fallbackPaths: ['src/ui/idleVillage/VillageSandbox.tsx'],
    notes: ['Tracks spy slot config, countdown labels, and telemetry for threat escalation.'],
  },
  expedition_list: {
    label: 'Expedition List',
    description: 'Dispatch list surface for quests/expeditions with risk telemetry.',
    sourcePaths: [
      'src/ui/idleVillage/components/expeditions',
      'src/ui/idleVillage/VillageSandbox.tsx',
    ],
    fallbackPaths: ['src/ui/idleVillage/VillageSandbox.tsx'],
    notes: ['Requires questConfig + risk display assets for stripes.'],
  },
  combat_replay: {
    label: 'Combat Replay UI',
    description: 'Playback controls + timeline for combat logs within Sandbox UI.',
    sourcePaths: [
      'src/ui/idleVillage/components/combatReplay',
      'src/ui/idleVillage/VillageSandbox.tsx',
    ],
    fallbackPaths: ['src/ui/idleVillage/VillageSandbox.tsx'],
    notes: ['Consumes TimeEngine events + telemetry from quest/arena simulators.'],
  },
};

interface CliArgs {
  components: string[];
  outputDir: string;
}

interface GenerateReportOptions {
  projectRoot?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const componentsFlag = argv.find((arg) => arg.startsWith('--components='));
  const outputFlag = argv.find((arg) => arg.startsWith('--outputDir='));

  const components = componentsFlag
    ? componentsFlag.split('=')[1].split(',').map((c) => c.trim()).filter(Boolean)
    : Object.keys(COMPONENT_CATALOG);

  const envOutput = process.env.COMPONENT_LAB_DEPS_DIR;
  const outputDir = outputFlag ? outputFlag.split('=')[1] : envOutput || DEFAULT_OUTPUT_DIR;
  return {
    components,
    outputDir,
  };
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toRelative(projectPath: string, projectRoot: string = PROJECT_ROOT): string {
  const relativePath = path.relative(projectRoot, projectPath) || '.';
  return relativePath.replace(/\\/g, '/');
}

function collectSourceFiles(entry: ComponentCatalogEntry, projectRoot: string): {
  files: string[];
  missing: string[];
} {
  const files = new Set<string>();
  const missing: string[] = [];
  const pathsToResolve = entry.sourcePaths.length ? entry.sourcePaths : entry.fallbackPaths ?? [];

  pathsToResolve.forEach((relativePath) => {
    const targetPath = path.resolve(projectRoot, relativePath);
    if (!fs.existsSync(targetPath)) {
      missing.push(relativePath);
      return;
    }
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      walkDirectory(targetPath, (file) => {
        if (/\.(ts|tsx|js|jsx)$/.test(file)) {
          files.add(file);
        }
      });
    } else if (stat.isFile()) {
      files.add(targetPath);
    }
  });

  if (!files.size && entry.fallbackPaths) {
    entry.fallbackPaths.forEach((relativePath) => {
      const candidate = path.resolve(projectRoot, relativePath);
      if (fs.existsSync(candidate)) {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) files.add(candidate);
        if (stat.isDirectory()) {
          walkDirectory(candidate, (file) => {
            if (/\.(ts|tsx|js|jsx)$/.test(file)) {
              files.add(file);
            }
          });
        }
      } else {
        missing.push(relativePath);
      }
    });
  }

  return { files: Array.from(files), missing };
}

function walkDirectory(dir: string, onFile: (filePath: string) => void): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(entryPath, onFile);
    } else if (entry.isFile()) {
      onFile(entryPath);
    }
  }
}

function parseImports(filePath: string): ParsedImport[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const imports: ParsedImport[] = [];

  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const namedImports: string[] = [];
      const importClause = node.importClause;
      if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        importClause.namedBindings.elements.forEach((el) => namedImports.push(el.name.getText()));
      }
      imports.push({ moduleSpecifier, namedImports });
    }
  });

  return imports;
}

function categorizeImport(moduleSpecifier: string): DependencyCategory {
  if (moduleSpecifier.includes('/config/') || /config/i.test(moduleSpecifier)) {
    return 'config';
  }
  if (moduleSpecifier.includes('/hooks/') || /use[A-Z]/.test(moduleSpecifier.split('/').pop() ?? '')) {
    return 'hook';
  }
  if (moduleSpecifier.includes('/assets/') || moduleSpecifier.includes('public/assets')) {
    return 'asset';
  }
  return 'other';
}

function extractTelemetryEvents(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const events = new Set<string>();

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && expression.text === 'trackTelemetryEvent') {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          events.add(arg.text);
        }
      }
    }
    if (ts.isStringLiteral(node) && node.text.startsWith('component_lab_')) {
      events.add(node.text);
    }
    node.forEachChild(visit);
  }

  visit(sourceFile);
  return Array.from(events);
}

function extractPersistenceKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const keys = new Set<string>();

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const access = node.expression;
      if (ts.isIdentifier(access.expression) && access.expression.text === 'PersistenceService') {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          keys.add(arg.text);
        }
      }
    }
    node.forEachChild(visit);
  }

  visit(sourceFile);
  return Array.from(keys);
}

export function generateComponentReport(
  componentId: string,
  entry: ComponentCatalogEntry,
  options?: GenerateReportOptions
): ComponentDependencyReport {
  const projectRoot = options?.projectRoot ?? PROJECT_ROOT;
  const { files, missing } = collectSourceFiles(entry, projectRoot);
  const analyzedFiles = files.map((file) => toRelative(file, projectRoot));
  const dependencyBuckets: Record<DependencyCategory, Set<string>> = {
    config: new Set(),
    hook: new Set(),
    asset: new Set(),
    other: new Set(),
  };
  const telemetryEvents = new Set<string>();
  const persistenceKeys = new Set<string>();

  files.forEach((filePath) => {
    const imports = parseImports(filePath);
    imports.forEach((imp) => {
      const relModule = imp.moduleSpecifier;
      dependencyBuckets[categorizeImport(relModule)].add(relModule);
    });
    extractTelemetryEvents(filePath).forEach((evt) => telemetryEvents.add(evt));
    extractPersistenceKeys(filePath).forEach((key) => persistenceKeys.add(key));
  });

  const generatedAt = new Date().toISOString();

  return {
    componentId,
    label: entry.label,
    description: entry.description,
    templateReference:
      'src/docs/docs/coordinator/component_lab_intake_template.md#3-dependency--config-matrix',
    analyzedFiles,
    missingSources: missing,
    dependencies: {
      config: Array.from(dependencyBuckets.config).sort(),
      hooks: Array.from(dependencyBuckets.hook).sort(),
      assets: Array.from(dependencyBuckets.asset).sort(),
      other: Array.from(dependencyBuckets.other).sort(),
    },
    telemetryEvents: Array.from(telemetryEvents).sort(),
    persistenceKeys: Array.from(persistenceKeys).sort(),
    notes: entry.notes ?? [],
    generatedAt,
  };
}

function writeJsonReport(report: ComponentDependencyReport, outputDir: string): string {
  const filePath = path.join(outputDir, `${report.componentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  return filePath;
}

function writeMarkdownReport(report: ComponentDependencyReport, outputDir: string): string {
  const filePath = path.join(outputDir, `${report.componentId}.md`);
  const lines: string[] = [];
  lines.push(`# Component Lab Dependency Map – ${report.label}`);
  lines.push('');
  lines.push(report.description);
  lines.push('');
  lines.push(`Template reference: ${report.templateReference}`);
  lines.push('');
  if (report.missingSources.length) {
    lines.push('> ⚠️ Some source paths were missing:');
    report.missingSources.forEach((missingPath) => lines.push(`> - ${missingPath}`));
    lines.push('');
  }
  lines.push('## Dependency Matrix');
  lines.push('');
  lines.push('| Category | Modules |');
  lines.push('| --- | --- |');
  lines.push(`| Config | ${report.dependencies.config.join('<br>') || '_None_'} |`);
  lines.push(`| Hooks | ${report.dependencies.hooks.join('<br>') || '_None_'} |`);
  lines.push(`| Assets | ${report.dependencies.assets.join('<br>') || '_None_'} |`);
  lines.push(`| Other Imports | ${report.dependencies.other.join('<br>') || '_None_'} |`);
  lines.push('');
  lines.push('## Telemetry & Persistence');
  lines.push('');
  lines.push(`- Telemetry events: ${report.telemetryEvents.join(', ') || '_None found_'}`);
  lines.push(`- Persistence keys: ${report.persistenceKeys.join(', ') || '_None found_'}`);
  lines.push('');
  if (report.notes.length) {
    lines.push('## Notes');
    lines.push('');
    report.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push('');
  }
  lines.push('## Analyzed Files');
  lines.push('');
  report.analyzedFiles.forEach((file) => lines.push(`- ${file}`));
  lines.push('');
  lines.push(`_Generated at ${report.generatedAt}_`);

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

export function runDependencyMapCli(): void {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.outputDir);
  const selectedComponents = args.components;
  console.log(`[component-lab:deps] Writing reports to ${args.outputDir}`);

  selectedComponents.forEach((componentId) => {
    const entry = COMPONENT_CATALOG[componentId];
    if (!entry) {
      console.error(`Unknown component id "${componentId}". Available: ${Object.keys(COMPONENT_CATALOG).join(', ')}`);
      return;
    }
    const report = generateComponentReport(componentId, entry);
    const jsonPath = writeJsonReport(report, args.outputDir);
    const mdPath = writeMarkdownReport(report, args.outputDir);
    console.log(`Generated dependency map for ${componentId}:`);
    console.log(`  JSON → ${toRelative(jsonPath)}`);
    console.log(`  Markdown → ${toRelative(mdPath)}`);
  });
}

const invokedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedScriptPath && invokedScriptPath === __filename) {
  runDependencyMapCli();
}
