import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { lockFilesForPrompt, unlockFilesForPrompt, extractFileTargets } from './fileLockManager.js';

interface KanbanRow {
  id: string;
  status: string;
  dependencies: string;
  agent: string;
  lastUpdate: string;
  notes: string;
  lineNumber: number;
  canonicalId: string;
}

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

    if (columns.length < 6) {
      continue;
    }

    if (columns[0] === 'Prompt ID/Descrizione') {
      continue;
    }

    const [id, status, dependencies, agent, lastUpdate, notes] = columns;
    const canonicalId = id.split(/\s+/)[0] ?? id;
    rows.push({
      id,
      status,
      dependencies,
      agent,
      lastUpdate,
      notes,
      lineNumber: lineIndex + 1,
      canonicalId,
    });
  }

  return rows;
}

/**
 * Lock file per un prompt quando viene assegnato
 */
export async function lockPromptFiles(promptId: string, agent: string): Promise<void> {
  const rows = await loadKanbanRows();
  const row = rows.find((r) => r.canonicalId === promptId);
  
  if (!row) {
    throw new Error(`Prompt "${promptId}" non trovato`);
  }

  // Estrai file target dalle note del prompt
  const fileTargets = extractFileTargets(row.notes);
  
  if (fileTargets.length > 0) {
    await lockFilesForPrompt(promptId, agent, fileTargets);
    console.log(`Locked ${fileTargets.length} files for prompt ${promptId}`);
  }
}

/**
 * Unlock file quando un prompt viene completato
 */
export async function unlockPromptFiles(promptId: string): Promise<void> {
  await unlockFilesForPrompt(promptId);
  console.log(`Unlocked files for prompt ${promptId}`);
}

/**
 * Verifica lock per tutti i prompt attivi
 */
export async function auditActiveLocks(): Promise<void> {
  const rows = await loadKanbanRows();
  const activePrompts = rows.filter(row => row.status === 'In corso');
  
  console.log(`Auditing locks for ${activePrompts.length} active prompts...`);
  
  for (const prompt of activePrompts) {
    const promptId = prompt.id.split(/\s+/)[0] ?? prompt.id;
    try {
      await lockPromptFiles(promptId, prompt.agent);
    } catch (error) {
      console.error(`Failed to lock files for ${promptId}:`, error);
    }
  }
}
