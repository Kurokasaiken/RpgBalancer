import { readFile } from 'node:fs/promises';
import path from 'node:path';

interface KanbanRow {
  id: string;
  status: string;
  dependencies: string;
  agent: string;
  startTime: string;
  endTime: string;
  duration: string;
  estimated: string;
  lastUpdate: string;
  notes: string;
  lineNumber: number;
}

const ALLOWED_STATUSES = new Set(['Non assegnato', 'Assegnato', 'In corso', 'Completato']);

async function loadKanbanRows(): Promise<KanbanRow[]> {
  const kanbanPath = path.resolve(
    'src',
    'docs',
    'docs',
    'coordinator',
    'agent_assignments.md',
  );
  const raw = await readFile(kanbanPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const rows: KanbanRow[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim().startsWith('|')) {
      continue;
    }
    if (line.includes('---')) {
      continue;
    }

    const columns = line
      .split('|')
      .slice(1, -1)
      .map((col) => col.trim());

    if (columns.length < 10) {
      continue;
    }

    if (columns[0] === 'Prompt ID/Descrizione') {
      continue;
    }

    const [id, status, dependencies, agent, startTime, endTime, duration, estimated, lastUpdate, notes] = columns;
    rows.push({
      id,
      status,
      dependencies,
      agent,
      startTime,
      endTime,
      duration,
      estimated,
      lastUpdate,
      notes,
      lineNumber: lineIndex + 1,
    });
  }

  return rows;
}

function validateRows(rows: KanbanRow[]): string[] {
  const errors: string[] = [];
  const seenIds = new Map<string, KanbanRow>();

  rows.forEach((row) => {
    if (!row.id || row.id === '-') {
      errors.push(`Linea ${row.lineNumber}: Prompt ID mancante.`);
    }

    if (seenIds.has(row.id)) {
      errors.push(
        `Linea ${row.lineNumber}: Prompt ID "${row.id}" duplicato (già usato in linea ${seenIds.get(row.id)?.lineNumber}).`,
      );
    } else {
      seenIds.set(row.id, row);
    }

    if (!ALLOWED_STATUSES.has(row.status)) {
      errors.push(`Linea ${row.lineNumber}: Stato "${row.status}" non permesso.`);
    }

    if (row.status === 'Non assegnato') {
      if (row.agent !== '-' || row.lastUpdate !== '-') {
        errors.push(
          `Linea ${row.lineNumber}: I prompt "Non assegnato" devono avere agente e data impostati a "-".`,
        );
      }
    } else {
      if (row.agent === '-' || !row.agent) {
        errors.push(`Linea ${row.lineNumber}: Lo stato "${row.status}" richiede un agente impostato.`);
      }
      if (!row.lastUpdate || row.lastUpdate === '-') {
        errors.push(`Linea ${row.lineNumber}: Lo stato "${row.status}" richiede una data di update.`);
      }
    }

    if (row.status === 'Completato' && (!row.notes || row.notes === '-')) {
      errors.push(`Linea ${row.lineNumber}: I prompt completati devono avere note/evidenze.`);
    }
  });

  return errors;
}

const DEFAULT_KANBAN_TIMEOUT_MS = 30000;

function parseArgs(argv: string[]): { timeoutMs: number } {
  const timeoutArg = argv.find((arg) => arg.startsWith('--timeout='));
  const timeoutMs = timeoutArg
    ? Number(timeoutArg.split('=')[1]) || DEFAULT_KANBAN_TIMEOUT_MS
    : DEFAULT_KANBAN_TIMEOUT_MS;
  return { timeoutMs };
}

async function main() {
  const { timeoutMs } = parseArgs(process.argv.slice(2));

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`kanban:lint timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  const rows = await Promise.race([loadKanbanRows(), timeoutPromise]);
  clearTimeout(timeoutId);
  if (rows.length === 0) {
    console.warn('Nessuna riga Kanban trovata.');
    return;
  }

  const errors = validateRows(rows);
  if (errors.length > 0) {
    console.error('Kanban lint fallito. Risolvi i seguenti problemi:');
    for (const err of errors) {
      console.error(` • ${err}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Kanban lint passato: ${rows.length} prompt validati.`);
}

main().catch((error) => {
  console.error('Errore eseguendo kanban:lint', error);
  process.exitCode = 1;
});
