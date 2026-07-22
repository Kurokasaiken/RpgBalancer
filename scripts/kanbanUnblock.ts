#!/usr/bin/env tsx

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const KANBAN_PATH = path.resolve('src', 'docs', 'docs', 'coordinator', 'agent_assignments.md');
const ALLOWED_STATUSES = new Set(['Non assegnato', 'Assegnato', 'Bloccato', 'In corso', 'Completato']);
const EXECUTORS = new Set(['harness', 'ai-worker', 'manual', 'Cascade']);
const DEPENDENCY_KEYWORDS = [
  'attesa',
  'attesa completamento',
  'dipende',
  'dipendenza',
  'bloccato',
  'blocked',
  'BLOCKED',
  'fino a',
  'until',
  'waiting for',
  'depends on',
];

interface KanbanRow {
  raw: string;
  lineIndex: number;
  cells: string[];
  id: string;
  status: string;
}

function extractId(cell: string): string | null {
  const match = cell.trim().match(/^[A-Z][A-Z0-9_-]+/);
  return match ? match[0] : null;
}

function looksLikeDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value.trim());
}

function looksLikeTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value.trim());
}

function parseTableRows(content: string): KanbanRow[] {
  const lines = content.split(/\r?\n/);
  const rows: KanbanRow[] = [];
  let inCodeFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    if (!trimmed.startsWith('|')) continue;
    if (line.includes('---')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length < 2) continue;
    if (cells[1].toLowerCase() === 'status') continue;

    const id = extractId(cells[0]);
    const status = cells[1];
    if (!id || !ALLOWED_STATUSES.has(status)) continue;

    rows.push({ raw: line, lineIndex: i, cells, id, status });
  }

  return rows;
}

function findDependencyIds(row: KanbanRow, allIds: Set<string>): string[] {
  const text = row.raw;
  const rowTextWithoutId = text.replace(new RegExp(`\\|\\s*${row.id}[^|]*\\|`, 'g'), '|');

  const found = new Set<string>();
  for (const id of allIds) {
    if (id === row.id) continue;
    if (!rowTextWithoutId.includes(id)) continue;

    const beforeIndex = rowTextWithoutId.indexOf(id);
    const snippet = rowTextWithoutId.substring(Math.max(0, beforeIndex - 80), beforeIndex + id.length + 80);
    const lower = snippet.toLowerCase();
    const hasKeyword = DEPENDENCY_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));

    if (hasKeyword) {
      found.add(id);
    }
  }

  return Array.from(found);
}

function findExecutor(row: KanbanRow): string | null {
  const text = row.raw;
  for (const executor of EXECUTORS) {
    const pattern = new RegExp(`\\|\\s*${executor}\\s*\\|`);
    if (pattern.test(text)) {
      return executor;
    }
  }

  for (let i = 2; i < row.cells.length; i += 1) {
    const value = row.cells[i].trim();
    if (value === '-' || value === '') continue;
    if (looksLikeDate(value) || looksLikeTimestamp(value)) continue;
    if (EXECUTORS.has(value)) return value;
  }

  return null;
}

function updateRow(row: KanbanRow, dependencyId: string, now: string): string | null {
  const cells = [...row.cells];
  if (cells.length < 2) return null;

  const newStatus = findExecutor(row) ? 'Assegnato' : 'Non assegnato';
  cells[1] = newStatus;

  const executor = findExecutor(row);
  const updateDate = (index: number) => {
    if (index >= 0 && index < cells.length) {
      if (newStatus === 'Non assegnato' && cells[index] === '-') {
        cells[index] = '-';
      } else {
        cells[index] = now;
      }
    }
  };

  // 10-column format: [id, status, deps, agent, start, end, duration, estimated, lastUpdate, notes, ...]
  if (cells.length >= 10) {
    if (newStatus === 'Non assegnato') {
      cells[3] = '-';
      cells[8] = '-';
    } else if (executor) {
      cells[3] = executor;
      cells[8] = now;
    } else {
      cells[8] = now;
    }
  } else {
    // Older formats: try to find the first date-like cell after status and update it.
    let updated = false;
    for (let i = 2; i < cells.length; i += 1) {
      if (looksLikeDate(cells[i]) || looksLikeTimestamp(cells[i])) {
        cells[i] = now;
        updated = true;
        break;
      }
    }

    // If no date cell found and there is room, update the cell right after status/agent/dep.
    if (!updated && cells.length > 2) {
      for (let i = 2; i < cells.length; i += 1) {
        const value = cells[i].trim();
        if (value === '-' || value === '') {
          cells[i] = now;
          updated = true;
          break;
        }
      }
    }
  }

  // Append auto-unblock marker to the last/notes cell to keep audit trail.
  const lastIndex = cells.length - 1;
  const marker = ` [AUTO-UNBLOCKED: ${dependencyId}]`;
  if (!cells[lastIndex].includes(marker)) {
    cells[lastIndex] = `${cells[lastIndex]}${marker}`;
  }

  return `| ${cells.join(' | ')} |`;
}

async function main() {
  const now = new Date().toISOString();
  const content = await readFile(KANBAN_PATH, 'utf8');
  const lines = content.split(/\r?\n/);
  const rows = parseTableRows(content);

  const idToRow = new Map<string, KanbanRow>();
  const allIds = new Set<string>();
  for (const row of rows) {
    allIds.add(row.id);
    // Keep the last occurrence if duplicate IDs exist.
    idToRow.set(row.id, row);
  }

  const statusById = new Map<string, string>();
  for (const row of rows) {
    statusById.set(row.id, row.status);
  }

  const updatedRows = new Map<number, string>();
  let changed = true;
  let passes = 0;
  const maxPasses = 10;

  while (changed && passes < maxPasses) {
    changed = false;
    passes += 1;

    for (const row of rows) {
      if (row.status !== 'Bloccato') continue;
      if (updatedRows.has(row.lineIndex)) continue;

      const deps = findDependencyIds(row, allIds);
      if (deps.length === 0) continue;

      const completedDep = deps.find((dep) => statusById.get(dep) === 'Completato');
      if (!completedDep) continue;

      const newLine = updateRow(row, completedDep, now);
      if (!newLine) continue;

      updatedRows.set(row.lineIndex, newLine);
      statusById.set(row.id, findExecutor(row) ? 'Assegnato' : 'Non assegnato');
      console.log(`Sbloccato ${row.id} (dipendenza ${completedDep} completata)`);
      changed = true;
    }
  }

  if (updatedRows.size === 0) {
    console.log('Nessun task bloccato da sbloccare.');
    return;
  }

  for (const [lineIndex, newLine] of updatedRows.entries()) {
    lines[lineIndex] = newLine;
  }

  await writeFile(KANBAN_PATH, lines.join('\n'), 'utf8');
  console.log(`Sbloccati ${updatedRows.size} task. File aggiornato: ${KANBAN_PATH}`);
}

main().catch((error) => {
  console.error('Errore eseguendo kanban:unblock', error);
  process.exitCode = 1;
});
