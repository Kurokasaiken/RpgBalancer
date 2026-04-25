import { describe, it, expect } from 'vitest';
import {
  parseKanbanRows,
  collectActiveMinimalPrompts,
  buildChecklistReport,
  formatChecklistMarkdown,
  type ChecklistReport,
  type ChecklistSection,
  type KanbanRow,
} from '../../../scripts/idleVillage/minimalQaChecklist';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';

const SAMPLE_KANBAN = `| Prompt ID/Descrizione | Stato | Dipende da | Agente | Durata (min) | Est. (min) | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MG-01 – Minimal Gameplay Hook & HUD | In corso | - | Cascade | 45 | 150 | 2026-02-10 | Evidence: test-results/mg-01.log |
| NP-MIN-STRAT-004 – Minimal Visual Feedback & Style Lab | Non assegnato | - | - | - | 210 | - | - |
| MG-99 – Archive Prompt | Completato | - | Cascade | 15 | 60 | 2026-02-01 | Evidence: test-results/archive.log |`;

describe('minimalQaChecklist helpers', () => {
  it('parses Kanban rows from markdown tables', () => {
    const rows = parseKanbanRows(SAMPLE_KANBAN);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      promptId: 'MG-01',
      title: 'Minimal Gameplay Hook & HUD',
      status: 'In corso',
      agent: 'Cascade',
    });
    expect(rows[1]).toMatchObject({ promptId: 'NP-MIN-STRAT-004', status: 'Non assegnato' });
  });

  it('filters active Minimal Gameplay prompts', () => {
    const rows = parseKanbanRows(SAMPLE_KANBAN);
    const active = collectActiveMinimalPrompts(rows);
    expect(active).toHaveLength(1);
    expect(active[0].promptId).toBe('MG-01');
  });

  it('builds checklist reports using MinimalGameplayConfig metadata', () => {
    const rows = parseKanbanRows(SAMPLE_KANBAN);
    const active = collectActiveMinimalPrompts(rows);
    const report = buildChecklistReport(active, undefined);

    expect(report.configVersion).toBe(MINIMAL_GAMEPLAY_CONFIG.version);
    expect(report.locationsTracked).toBe(MINIMAL_GAMEPLAY_CONFIG.locations.length);
    expect(report.residentsTracked).toBe(MINIMAL_GAMEPLAY_CONFIG.residents.length);
    expect(report.eventLogEntries).toBe(MINIMAL_GAMEPLAY_CONFIG.defaultEventLog.length);
    expect(report.activePrompts).toHaveLength(1);
    expect(report.sections.length).toBeGreaterThan(0);
  });

  it('formats markdown with sections, safeguards, and snapshot info', () => {
    const demoSections: ChecklistSection[] = [
      {
        title: 'Demo Section',
        description: 'Validates sample tasks.',
        items: [
          {
            title: 'Sample Item',
            bullets: ['Do something important', 'Verify output matches config'],
          },
        ],
      },
    ];

    const demoReport: ChecklistReport = {
      generatedAt: '2026-02-12T12:00:00.000Z',
      configVersion: 'v-test',
      kanbanPath: 'src/docs/docs/coordinator/agent_assignments.md',
      locationsTracked: 3,
      residentsTracked: 1,
      eventLogEntries: 2,
      activePrompts: [
        {
          promptId: 'MG-42',
          title: 'Minimal QA Polish',
          status: 'In corso',
          agent: 'QA-Sage',
          lastUpdate: '2026-02-12',
          note: 'Evidence pending',
        },
      ],
      sections: demoSections,
      safeguards: ['npm run lint -- scripts/idleVillage'],
      configSnapshot: {
        path: '/tmp/minimal-config.json',
        exists: true,
        sizeBytes: 512,
        excerpt: '{"version":"test"}',
      },
    };

    const markdown = formatChecklistMarkdown(demoReport);
    expect(markdown).toContain('# Minimal Gameplay QA Checklist');
    expect(markdown).toContain('## Active Minimal Gameplay Prompts');
    expect(markdown).toContain('MG-42 – Minimal QA Polish');
    expect(markdown).toContain('## Demo Section');
    expect(markdown).toContain('- [ ] npm run lint -- scripts/idleVillage');
    expect(markdown).toContain('## Config Snapshot Reference');
    expect(markdown).toContain('```text');
  });
});
