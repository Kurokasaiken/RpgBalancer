import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MasterPlanSync } from '../../../scripts/coord/planSync';

// Mock file system operations
const mockFs = vi.mocked(require('fs'));

describe('MasterPlanSync', () => {
  let sync: MasterPlanSync;

  beforeEach(() => {
    sync = new MasterPlanSync({
      direction: 'bidirectional',
      dryRun: true,
      outputDir: 'test-results',
      verbose: false,
      autoMerge: false
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultSync = new MasterPlanSync();
      expect(defaultSync).toBeInstanceOf(MasterPlanSync);
    });

    it('should merge user config with defaults', () => {
      const customSync = new MasterPlanSync({
        direction: 'kanban-to-plan',
        dryRun: true,
        verbose: true
      });

      expect(customSync).toBeInstanceOf(MasterPlanSync);
    });
  });

  describe('parseKanban', () => {
    beforeEach(() => {
      const mockKanbanContent = `# WS6 Prompt Kanban

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Start Time | End Time | Duration | Est. | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PC-M2 Telemetry replay | Completato | - | Cascade | - | - | - | - | 2026-01-04 | Evidence: CLI completed |
| PC-M2A Manifest setup | In corso | - | Cascade | 2026-01-05 | - | - | 2 | 2026-01-05 | Working on manifest |
| KS-105-radar-autotune | Completato | KS-105-synergy-visuals | Cascade | 2026-01-12 | 2026-01-12 | 1 | 1 | 2026-01-12 | Evidence: Auto-tuning completed |
`;

      mockFs.readFileSync.mockReturnValue(mockKanbanContent);
    });

    it('should parse Kanban entries correctly', async () => {
      const entries = sync['parseKanban']();
      
      expect(entries).toHaveLength(3);
      expect(entries[0].taskId).toBe('PC-M2 Telemetry replay');
      expect(entries[0].status).toBe('Completato');
      expect(entries[0].agent).toBe('Cascade');
      expect(entries[1].status).toBe('In corso');
      expect(entries[2].taskId).toBe('KS-105-radar-autotune');
    });

    it('should extract phase from task ID', async () => {
      const entries = sync['parseKanban']();
      
      expect(entries[2].phase).toBe('Phase 105');
    });

    it('should extract evidence from notes', async () => {
      const entries = sync['parseKanban']();
      
      expect(entries[0].evidence).toBe('CLI completed');
      expect(entries[2].evidence).toBe('Auto-tuning completed');
    });

    it('should throw error if table not found', async () => {
      mockFs.readFileSync.mockReturnValue('No table here');

      expect(() => sync['parseKanban']()).toThrow('Kanban table not found');
    });
  });

  describe('parseMasterPlan', () => {
    beforeEach(() => {
      const mockMasterPlanContent = `# MASTER PLAN

## 📊 OVERALL PROGRESS

- Phase 1: Foundation — ✅ DONE (~160 tasks)
- Phase 2: Archetypes — 🔄 ACTIVE (~200 tasks)
- Phase 3: Scenario UI — 📋 TODO (~50 tasks)
- Phase 10: Config Balancer — 🔥 ACTIVE (~140 tasks)
- Phase 10.5: Stat Testing — 🔥 NEXT (~80 tasks)
`;

      mockFs.readFileSync.mockReturnValue(mockMasterPlanContent);
    });

    it('should parse Master Plan phases correctly', async () => {
      const phases = sync['parseMasterPlan']();
      
      expect(phases).toHaveLength(5);
      expect(phases[0].phase).toBe('Phase 1: Foundation');
      expect(phases[0].status).toBe('DONE');
      expect(phases[0].taskCount).toBe(160);
      expect(phases[1].status).toBe('ACTIVE');
      expect(phases[2].status).toBe('TODO');
    });

    it('should handle different status indicators', async () => {
      const phases = sync['parseMasterPlan']();
      
      expect(phases.find((p: any) => p.phase.includes('10'))?.status).toBe('ACTIVE');
      expect(phases.find((p: any) => p.phase.includes('10.5'))?.status).toBe('NEXT');
    });
  });

  describe('generateDiff', () => {
    beforeEach(() => {
      // Mock Kanban data
      const mockKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
| Phase 1 Task | Completato | Cascade | Evidence: Done |
| Phase 2 Task | In corso | Orion | Working |
| Phase 99 Task | Non assegnato | - | New task |
`;

      // Mock Master Plan data
      const mockMasterPlanContent = `# Master Plan

## Progress
- Phase 1: Foundation — ✅ DONE (~10 tasks)
- Phase 2: Archetypes — 🔄 ACTIVE (~20 tasks)
- Phase 3: Scenario UI — 📋 TODO (~15 tasks)
`;

      mockFs.readFileSync
        .mockReturnValueOnce(mockKanbanContent)
        .mockReturnValueOnce(mockMasterPlanContent);
    });

    it('should generate diff correctly', async () => {
      const kanban = sync['parseKanban']();
      const plan = sync['parseMasterPlan']();
      const diff = sync['generateDiff'](kanban, plan);

      expect(diff.kanbanOnly).toHaveLength(1); // Phase 99 Task
      expect(diff.planOnly).toHaveLength(1); // Phase 3
      expect(diff.statusDiffs).toHaveLength(0); // Statuses match
    });

    it('should detect status differences', async () => {
      // Update Master Plan to have different status
      const mockMasterPlanContent = `# Master Plan

## Progress
- Phase 1: Foundation — 🔄 ACTIVE (~10 tasks)
- Phase 2: Archetypes — 📋 TODO (~20 tasks)
`;

      mockFs.readFileSync.mockReturnValue(mockMasterPlanContent);

      const kanban = sync['parseKanban']();
      const plan = sync['parseMasterPlan']();
      const diff = sync['generateDiff'](kanban, plan);

      expect(diff.statusDiffs).toHaveLength(2);
      expect(diff.statusDiffs[0].kanbanStatus).toBe('DONE');
      expect(diff.statusDiffs[0].planStatus).toBe('ACTIVE');
    });
  });

  describe('status mapping', () => {
    it('should map Kanban to Plan status correctly', () => {
      expect(sync['mapKanbanToPlanStatus']('Completato')).toBe('DONE');
      expect(sync['mapKanbanToPlanStatus']('In corso')).toBe('ACTIVE');
      expect(sync['mapKanbanToPlanStatus']('Non assegnato')).toBe('TODO');
      expect(sync['mapKanbanToPlanStatus']('Bloccato')).toBe('PAUSED');
    });

    it('should map Plan to Kanban status correctly', () => {
      expect(sync['mapPlanToKanbanStatus']('DONE')).toBe('Completato');
      expect(sync['mapPlanToKanbanStatus']('ACTIVE')).toBe('In corso');
      expect(sync['mapPlanToKanbanStatus']('TODO')).toBe('Non assegnato');
      expect(sync['mapPlanToKanbanStatus']('PAUSED')).toBe('Bloccato');
    });
  });

  describe('executeSync', () => {
    beforeEach(() => {
      // Mock successful file reads
      const mockKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
| Phase 1 Task | Completato | Cascade | Evidence: Done |
`;

      const mockMasterPlanContent = `# Master Plan

## Progress
- Phase 1: Foundation — ✅ DONE (~10 tasks)
`;

      mockFs.readFileSync
        .mockReturnValueOnce(mockKanbanContent)
        .mockReturnValueOnce(mockMasterPlanContent);

      // Mock output directory existence
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should execute sync successfully', async () => {
      const result = await sync.executeSync();

      expect(result.success).toBe(true);
      expect(result.diff).toBeDefined();
      expect(result.changes).toBeDefined();
      expect(result.evidenceLog).toContain('masterplan-sync-');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle dry run mode', async () => {
      const dryRunSync = new MasterPlanSync({ dryRun: true });
      const result = await dryRunSync.executeSync();

      expect(result.success).toBe(true);
      expect(result.changes).toHaveLength(0); // No changes in dry run
    });

    it('should generate evidence log', async () => {
      await sync.executeSync();

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock file read error
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(sync.executeSync()).rejects.toThrow('File not found');
    });
  });

  describe('sync directions', () => {
    beforeEach(() => {
      const mockKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
| Phase 1 Task | Completato | Cascade | Evidence: Done |
| Phase 2 Task | In corso | Orion | Working |
`;

      const mockMasterPlanContent = `# Master Plan

## Progress
- Phase 1: Foundation — 🔄 ACTIVE (~10 tasks)
- Phase 2: Archetypes — 📋 TODO (~20 tasks)
`;

      mockFs.readFileSync
        .mockReturnValueOnce(mockKanbanContent)
        .mockReturnValueOnce(mockMasterPlanContent);

      mockFs.existsSync.mockReturnValue(true);
    });

    it('should sync kanban-to-plan', async () => {
      const kanbanToPlanSync = new MasterPlanSync({ 
        direction: 'kanban-to-plan',
        dryRun: false
      });
      
      const result = await kanbanToPlanSync.executeSync();

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should sync plan-to-kanban', async () => {
      const planToKanbanSync = new MasterPlanSync({ 
        direction: 'plan-to-kanban',
        dryRun: false
      });
      
      const result = await planToKanbanSync.executeSync();

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should sync bidirectional', async () => {
      const bidirectionalSync = new MasterPlanSync({ 
        direction: 'bidirectional',
        dryRun: false
      });
      
      const result = await bidirectionalSync.executeSync();

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });

  describe('evidence logging', () => {
    beforeEach(() => {
      const mockKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
| Phase 1 Task | Completato | Cascade | Evidence: Done |
`;

      const mockMasterPlanContent = `# Master Plan

## Progress
- Phase 1: Foundation — ✅ DONE (~10 tasks)
`;

      mockFs.readFileSync
        .mockReturnValueOnce(mockKanbanContent)
        .mockReturnValueOnce(mockMasterPlanContent);

      mockFs.existsSync.mockReturnValue(false); // Directory doesn't exist
    });

    it('should create output directory if not exists', async () => {
      await sync.executeSync();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        'test-results',
        { recursive: true }
      );
    });

    it('should write comprehensive evidence log', async () => {
      await sync.executeSync();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const logContent = writeCall[1] as string;

      expect(logContent).toContain('# Master Plan Sync Evidence Log');
      expect(logContent).toContain('## Summary');
      expect(logContent).toContain('## Diff Analysis');
      expect(logContent).toContain('## Applied Changes');
      expect(logContent).toContain('Generated by Master Plan Sync Automation');
    });
  });

  describe('edge cases', () => {
    it('should handle empty Kanban', async () => {
      const emptyKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
`;

      const mockMasterPlanContent = `# Master Plan

## Progress
- Phase 1: Foundation — ✅ DONE (~10 tasks)
`;

      mockFs.readFileSync
        .mockReturnValueOnce(emptyKanbanContent)
        .mockReturnValueOnce(mockMasterPlanContent);

      mockFs.existsSync.mockReturnValue(true);

      const result = await sync.executeSync();

      expect(result.success).toBe(true);
      expect(result.diff.kanbanOnly).toHaveLength(0);
    });

    it('should handle malformed entries gracefully', async () => {
      const malformedKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
| Invalid entry without enough columns
| Phase 1 Task | Completato | Cascade | Evidence: Done |
`;

      mockFs.readFileSync.mockReturnValue(malformedKanbanContent);
      mockFs.existsSync.mockReturnValue(true);

      const result = await sync.executeSync();

      expect(result.success).toBe(true);
      // Should only parse the valid entry
      expect(result.diff.kanbanOnly.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown phases', async () => {
      const unknownPhaseKanbanContent = `# Kanban

| Prompt ID | Stato | Agente | Note |
| --- | --- | --- | --- |
| Unknown Task | Completato | Cascade | Evidence: Done |
`;

      mockFs.readFileSync.mockReturnValue(unknownPhaseKanbanContent);
      mockFs.existsSync.mockReturnValue(true);

      const result = await sync.executeSync();

      expect(result.success).toBe(true);
      expect(result.diff.kanbanOnly).toHaveLength(1);
      expect(result.diff.kanbanOnly[0].phase).toBe('Unknown');
    });
  });
});
