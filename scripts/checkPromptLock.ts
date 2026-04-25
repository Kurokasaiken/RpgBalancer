import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { checkFileLockConflicts, formatFileLockWarnings } from './fileLockManager.js';

interface KanbanRow {
  id: string;
  status: string;
  agent: string;
  lastUpdate: string;
  notes: string;
  lineNumber: number;
  canonicalId: string;
}

async function loadKanbanRows() {
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
    if (!line.trim().startsWith('|')) continue;
    if (line.includes('---')) continue;

    const columns = line
      .split('|')
      .slice(1, -1)
      .map((col) => col.trim());

    if (columns.length < 5) continue;
    if (columns[0] === 'Prompt ID/Descrizione') continue;

    const [id, status, agent, lastUpdate, notes] = columns;
    const canonicalId = id.split(/\s+/)[0] ?? id;
    rows.push({
      id,
      status,
      agent,
      lastUpdate,
      notes,
      lineNumber: lineIndex + 1,
      canonicalId,
    });
  }

  return rows;
}

async function main() {
  const [, , promptIdRaw] = process.argv;
  if (!promptIdRaw) {
    console.error('Uso: npm run prompt:check -- <PROMPT_ID>');
    process.exitCode = 1;
    return;
  }

  const promptId = promptIdRaw.trim();
  const rows = await loadKanbanRows();
  const row = rows.find((r) => r.canonicalId === promptId);

  if (!row) {
    console.error(`Prompt "${promptId}" non trovato in agent_assignments.md.`);
    process.exitCode = 1;
    return;
  }

  if (row.status !== 'Non assegnato') {
    console.error(
      `Prompt "${promptId}" è marcato come "${row.status}" (linea ${row.lineNumber}, colonna "${row.id}"). Fermati: il prompt è già in corso o completato.`,
    );
    process.exitCode = 1;
    return;
  }

  // Check file lock conflicts
  const fileLockWarnings = await checkFileLockConflicts(promptId, []);
  if (fileLockWarnings.length > 0) {
    console.log(formatFileLockWarnings(fileLockWarnings));
  }

  console.log(
    `Prompt "${promptId}" disponibile (linea ${row.lineNumber}, descrizione "${row.id}"). Puoi procedere: ricordati di aggiornare subito lo stato a "Assegnato".`,
  );
}

main().catch((error) => {
  console.error('Errore eseguendo prompt:check', error);
  process.exitCode = 1;
});
