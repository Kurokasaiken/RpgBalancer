import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadKanbanRows,
  findKanbanRow,
  updateKanbanRow,
  extractFileTargets,
} from '../../../scripts/harness/kanbanManager.js';

const sampleKanban = `| Prompt ID/Descrizione | Stato | Dipende da | Agente | Durata (min) | Est. (min) | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-001 - Test row | Non assegnato | - | - | - | - | - | FILE TARGET: src/foo.ts, src/bar.ts – initial notes |
| TEST-002 - Another row | Assegnato | - | - | - | - | - | FILE TARGET: src/baz.ts |
`;

describe('harness kanban manager', () => {
  let tmpDir: string;
  let kanbanPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'harness-kanban-'));
    kanbanPath = path.join(tmpDir, 'kanban.md');
    writeFileSync(kanbanPath, sampleKanban, 'utf8');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads rows and canonical IDs', async () => {
    const rows = await loadKanbanRows(kanbanPath);
    expect(rows.length).toBe(2);
    expect(rows[0].canonicalId).toBe('TEST-001');
    expect(rows[1].canonicalId).toBe('TEST-002');
  });

  it('finds a row by canonical ID', async () => {
    const row = await findKanbanRow('TEST-001', kanbanPath);
    expect(row).toBeDefined();
    expect(row?.status).toBe('Non assegnato');
  });

  it('updates status and timestamp', async () => {
    await updateKanbanRow('TEST-001', { status: 'In corso', agent: 'harness', lastUpdate: '2026-01-01' }, kanbanPath);
    const rows = await loadKanbanRows(kanbanPath);
    const row = rows.find((r) => r.canonicalId === 'TEST-001');
    expect(row?.status).toBe('In corso');
    expect(row?.agent).toBe('harness');
    expect(row?.lastUpdate).toBe('2026-01-01');
  });

  it('extracts file targets from notes', () => {
    expect(extractFileTargets('FILE TARGET: src/foo.ts, src/bar.ts')).toEqual(['src/foo.ts', 'src/bar.ts']);
    expect(extractFileTargets('no targets here')).toEqual([]);
  });
});
