/**
 * Kanban manager for the executor harness.
 *
 * Reads and updates `src/docs/docs/coordinator/agent_assignments.md`.
 * The file contains multiple markdown tables with different column layouts;
 * this module is table-format-agnostic and updates rows in place.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_KANBAN_PATH = path.resolve(
  'src',
  'docs',
  'docs',
  'coordinator',
  'agent_assignments.md',
);

/** Parsed Kanban row. */
export interface KanbanRow {
  /** Raw ID cell. */
  id: string;
  /** Current status. */
  status: string;
  /** Dependencies listed in the Kanban row. */
  dependencies: string;
  /** Agent name. */
  agent: string;
  /** Last update timestamp (free text). */
  lastUpdate: string;
  /** Notes cell, may contain FILE TARGET: entries. */
  notes: string;
  /** 1-based line number in the file. */
  lineNumber: number;
  /** Canonical ID = first whitespace-separated token of `id`. */
  canonicalId: string;
  /** Full row cells. */
  columns: string[];
}

/** Extract a canonical ID from an ID cell. */
function canonicalIdFromId(id: string): string {
  return id.split(/\s+/)[0] ?? id;
}

/** Parse all Kanban-like rows in the file. */
export async function loadKanbanRows(kanbanPath = DEFAULT_KANBAN_PATH): Promise<KanbanRow[]> {
  const raw = await readFile(kanbanPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const rows: KanbanRow[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim().startsWith('|')) continue;
    if (line.includes('---')) continue;

    const columns = line
      .split('|')
      .slice(1, -1)
      .map((col) => col.trim());

    if (columns.length < 5) continue;
    if (columns[0] === 'Prompt ID/Descrizione') continue;

    const id = columns[0];
    const status = columns[1];
    const dependencies = columns.length >= 8 ? columns[2] : '';
    const agent = columns.length >= 8 ? columns[3] : columns[2];
    const lastUpdate = columns.length >= 10 ? columns[8] : columns.length >= 8 ? columns[6] : columns[3];
    const notes = columns.length >= 10 ? columns[9] : columns.length >= 8 ? columns[7] : columns[4];

    rows.push({
      id,
      status,
      dependencies,
      agent,
      lastUpdate,
      notes,
      lineNumber: lineIndex + 1,
      canonicalId: canonicalIdFromId(id),
      columns,
    });
  }

  return rows;
}

/** Find a row by canonical ID. */
export async function findKanbanRow(
  canonicalId: string,
  kanbanPath = DEFAULT_KANBAN_PATH,
): Promise<KanbanRow | undefined> {
  const rows = await loadKanbanRows(kanbanPath);
  return rows.find((r) => r.canonicalId === canonicalId);
}

/**
 * Update a Kanban row.
 *
 * Supports 5, 8, and 10 column tables.
 */
export async function updateKanbanRow(
  canonicalId: string,
  updates: {
    status?: string;
    agent?: string;
    lastUpdate?: string;
    endTime?: string;
  },
  kanbanPath = DEFAULT_KANBAN_PATH,
): Promise<void> {
  const raw = await readFile(kanbanPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let modified = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim().startsWith('|') || line.includes('---')) continue;

    const columns = line
      .split('|')
      .slice(1, -1)
      .map((col) => col.trim());

    if (columns.length < 5) continue;
    if (columns[0] === 'Prompt ID/Descrizione') continue;

    if (canonicalIdFromId(columns[0]) !== canonicalId) continue;

    if (updates.status !== undefined) {
      columns[1] = updates.status;
    }
    if (updates.agent !== undefined) {
      if (columns.length >= 8) {
        columns[3] = updates.agent;
      } else {
        columns[2] = updates.agent;
      }
    }
    if (updates.lastUpdate !== undefined) {
      if (columns.length >= 10) {
        columns[8] = updates.lastUpdate;
      } else if (columns.length >= 8) {
        columns[6] = updates.lastUpdate;
      } else {
        columns[3] = updates.lastUpdate;
      }
    }
    if (updates.endTime !== undefined) {
      // 10-column table has an explicit end time column.
      if (columns.length >= 10) {
        columns[5] = updates.endTime;
      }
    }

    lines[lineIndex] = `| ${columns.join(' | ')} |`;
    modified = true;
    break;
  }

  if (!modified) {
    throw new Error(`Kanban row "${canonicalId}" not found.`);
  }

  await writeFile(kanbanPath, lines.join('\n'), 'utf8');
}

/** Extract FILE TARGET entries from prompt notes. */
export function extractFileTargets(notes: string): string[] {
  const fileTargetMatch = notes.match(/FILE TARGET:\s*(.+?)(?=\n\n|\n[A-Z]|\n#|$)/s);
  if (!fileTargetMatch) {
    return [];
  }

  const targetsText = fileTargetMatch[1].trim();
  return targetsText
    .split(/,|\n/)
    .map((target) => target.trim())
    .filter((target) => target.length > 0);
}
