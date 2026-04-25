#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_FILE = 'src/docs/docs/coordinator/agent_assignments.md';
const DEFAULT_STATUS = 'Non assegnato';
const OUTPUT_FORMATS = new Set(['list', 'json', 'table']);

function parseArgs(argv) {
  const opts = {
    file: DEFAULT_FILE,
    status: DEFAULT_STATUS,
    max: undefined,
    excludeBlocked: true,
    format: 'list',
    contains: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file' && argv[i + 1]) {
      opts.file = argv[++i];
    } else if (arg === '--status' && argv[i + 1]) {
      opts.status = argv[++i];
    } else if (arg === '--max' && argv[i + 1]) {
      opts.max = Number(argv[++i]) || undefined;
    } else if (arg === '--includeBlocked') {
      opts.excludeBlocked = false;
    } else if (arg === '--contains' && argv[i + 1]) {
      opts.contains = argv[++i].toLowerCase();
    } else if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i];
      if (OUTPUT_FORMATS.has(fmt)) {
        opts.format = fmt;
      }
    }
  }

  return opts;
}

function readLines(filePath) {
  const absolutePath = path.resolve(filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return content.split(/\r?\n/);
}

function isBlocked(rowLine, blockText) {
  const text = `${rowLine}\n${blockText}`.toLowerCase();
  return text.includes('bloccato finché') || text.includes('bloccato');
}

function summarize(details, maxLines = 4) {
  if (!details.trim()) return '(nessuna nota)';
  return details
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .join(' ');
}

function parsePromptEntries(lines, opts) {
  const entries = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith('|') || line.startsWith('| ---')) continue;

    const columns = line.split('|').slice(1, -1).map((col) => col.trim());
    if (columns.length < 2) continue;

    const status = columns[1];
    if (opts.status && status !== opts.status) continue;

    let j = i + 1;
    const blockLines = [];
    while (j < lines.length && !lines[j].startsWith('|')) {
      blockLines.push(lines[j]);
      j += 1;
    }
    const details = blockLines.join('\n').trim();

    if (opts.excludeBlocked && isBlocked(line, details)) {
      i = j - 1;
      continue;
    }

    if (opts.contains) {
      const combined = `${line}\n${details}`.toLowerCase();
      if (!combined.includes(opts.contains)) {
        i = j - 1;
        continue;
      }
    }

    const meta = (columns[0] ?? '').split(' ');
    const id = meta.shift() ?? '';
    const title = meta.join(' ').trim();

    entries.push({
      id,
      title,
      status,
      dependsOn: columns[2] ?? '',
      agent: columns[3] ?? '',
      startTime: columns[4] ?? '',
      endTime: columns[5] ?? '',
      duration: columns[6] ?? '',
      estimate: columns[7] ?? '',
      lastUpdate: columns[8] ?? '',
      rowNote: columns.slice(9).join(' | ').trim(),
      details,
      lineNumber: i + 1,
    });

    i = j - 1;
  }

  return entries;
}

function printEntries(entries, opts) {
  const selected = typeof opts.max === 'number' ? entries.slice(0, opts.max) : entries;

  if (opts.format === 'json') {
    console.log(JSON.stringify(selected, null, 2));
    return;
  }

  selected.forEach((entry, index) => {
    const header = `${index + 1}. ${entry.id}${entry.title ? ` – ${entry.title}` : ''}`;
    const ref = `${opts.file}#L${entry.lineNumber}`;
    const summary = summarize(entry.details);

    console.log(header);
    console.log(`   Status: ${entry.status}`);
    console.log(`   Depends: ${entry.dependsOn || '-'}`);
    console.log(`   Agent: ${entry.agent || '-'}`);
    console.log(`   Estimate: ${entry.estimate || '-'} | Duration: ${entry.duration || '-'}`);
    console.log(`   Last update: ${entry.lastUpdate || '-'}`);
    console.log(`   Kanban ref: ${ref}`);
    console.log(`   Summary: ${summary}`);

    if (opts.format === 'table') {
      console.log('   Details:');
      const block = entry.details ? entry.details.split('\n').map((line) => `     ${line}`).join('\n') : '     (vuoto)';
      console.log(block);
    }
    console.log('');
  });
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const lines = readLines(opts.file);
  const entries = parsePromptEntries(lines, opts);

  if (entries.length === 0) {
    console.error('Nessun prompt trovato con i criteri specificati.');
    process.exit(1);
  }

  printEntries(entries, opts);
}

if (require.main === module) {
  main();
}
