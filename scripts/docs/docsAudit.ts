import { promises as fs } from 'fs';
import path from 'path';

interface DocIssue {
  file: string;
  type: 'missing_frontmatter' | 'invalid_status' | 'missing_field' | 'stale';
  message: string;
}

interface Frontmatter {
  title?: string;
  status?: string;
  owner?: string;
  last_reviewed?: string;
  domain?: string;
  description?: string;
}

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'src', 'docs', 'docs');
const TEST_RESULTS_DIR = path.join(ROOT, 'test-results');
const ALLOWED_STATUS = new Set(['draft', 'active', 'archived']);
const STALE_THRESHOLD_DAYS = 90;

async function main() {
  const markdownFiles = await collectMarkdownFiles(DOCS_DIR);
  const issues: DocIssue[] = [];

  for (const file of markdownFiles) {
    const relative = path.relative(ROOT, file);
    const content = await fs.readFile(file, 'utf8');
    const fm = parseFrontmatter(content);

    if (!fm) {
      issues.push({
        file: relative,
        type: 'missing_frontmatter',
        message: 'Missing YAML frontmatter block at top of file',
      });
      continue;
    }

    if (!fm.status) {
      issues.push({
        file: relative,
        type: 'missing_field',
        message: 'Frontmatter missing "status"',
      });
    } else if (!ALLOWED_STATUS.has(fm.status)) {
      issues.push({
        file: relative,
        type: 'invalid_status',
        message: `Invalid status "${fm.status}" (allowed: ${Array.from(ALLOWED_STATUS).join(', ')})`,
      });
    }

    if (!fm.owner) {
      issues.push({
        file: relative,
        type: 'missing_field',
        message: 'Frontmatter missing "owner"',
      });
    }

    if (!fm.last_reviewed) {
      issues.push({
        file: relative,
        type: 'missing_field',
        message: 'Frontmatter missing "last_reviewed"',
      });
    } else if (fm.status !== 'archived') {
      const stale = isStale(fm.last_reviewed, STALE_THRESHOLD_DAYS);
      if (stale) {
        issues.push({
          file: relative,
          type: 'stale',
          message: `Document last reviewed on ${fm.last_reviewed} (> ${STALE_THRESHOLD_DAYS} days)`,
        });
      }
    }
  }

  await fs.mkdir(TEST_RESULTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString();
  const outputPath = path.join(TEST_RESULTS_DIR, `docs-audit-${timestamp}.json`);
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        timestamp,
        totalFiles: markdownFiles.length,
        issues,
      },
      null,
      2,
    ),
    'utf8',
  );

  if (issues.length > 0) {
    console.error(`Docs audit found ${issues.length} issue(s). See ${outputPath}`);
    process.exitCode = 1;
  } else {
    console.log(`Docs audit passed. See ${outputPath}`);
  }
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      const childFiles = await collectMarkdownFiles(fullPath);
      results.push(...childFiles);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function parseFrontmatter(content: string): Frontmatter | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return null;

  const lines = trimmed.split(/\r?\n/);
  lines.shift();
  const frontmatterLines: string[] = [];
  while (lines.length > 0) {
    const line = lines.shift();
    if (line === undefined) break;
    if (line.trim() === '---') {
      break;
    }
    frontmatterLines.push(line);
  }

  const data: Frontmatter = {};
  for (const line of frontmatterLines) {
    const [key, ...rest] = line.split(':');
    if (!key) continue;
    data[key.trim() as keyof Frontmatter] = rest.join(':').trim().replace(/^"|"$/g, '');
  }
  return data;
}

function isStale(dateString: string, thresholdDays: number): boolean {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return true;
  const diffMs = Date.now() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

main().catch((error) => {
  console.error('Docs audit failed:', error);
  process.exitCode = 1;
});
