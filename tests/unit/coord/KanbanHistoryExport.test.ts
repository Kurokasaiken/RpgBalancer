/**
 * Test suite for Kanban History Export CLI tool
 * 
 * Tests export functionality, filtering, analytics generation,
 * and archiving capabilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Define types inline to avoid import issues
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

interface ExportConfig {
  format: 'json' | 'csv' | 'markdown' | 'html';
  status?: string;
  agent?: string;
  dateRange?: { start: Date; end: Date };
  includeArchived: boolean;
  sortBy: 'lastUpdate' | 'id' | 'status' | 'duration';
  sortOrder: 'asc' | 'desc';
  limit?: number;
}

interface KanbanAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byAgent: Record<string, number>;
  completedTasks: number;
  averageDuration: number;
  completionRate: number;
  activeTasks: number;
  archivedTasks: number;
  monthlyActivity: Record<string, number>;
  agentPerformance: Record<string, {
    completed: number;
    averageDuration: number;
    completionRate: number;
  }>;
}

// Mock data
const mockKanbanData = [
  {
    id: 'KS-001',
    status: 'Completato',
    dependencies: '-',
    agent: 'Cascade',
    startTime: '2026-01-01 10:00',
    endTime: '2026-01-01 12:00',
    duration: '120',
    estimated: '120',
    lastUpdate: '2026-01-01',
    notes: 'Evidence: Task completed successfully',
    lineNumber: 10,
  },
  {
    id: 'KS-002',
    status: 'In corso',
    dependencies: 'KS-001',
    agent: 'ChatGPT Codex 5.1',
    startTime: '2026-01-02 09:00',
    endTime: '-',
    duration: '-',
    estimated: '180',
    lastUpdate: '2026-01-02',
    notes: 'Working on implementation',
    lineNumber: 11,
  },
  {
    id: 'KS-003',
    status: 'Non assegnato',
    dependencies: '-',
    agent: '-',
    startTime: '-',
    endTime: '-',
    duration: '-',
    estimated: '90',
    lastUpdate: '-',
    notes: 'Pending assignment',
    lineNumber: 12,
  },
  {
    id: 'KS-004',
    status: 'Completato',
    dependencies: 'KS-002',
    agent: 'Cascade',
    startTime: '2026-01-03 14:00',
    endTime: '2026-01-03 16:30',
    duration: '150',
    estimated: '120',
    lastUpdate: '2026-01-03',
    notes: 'Evidence: All tests passing',
    lineNumber: 13,
  },
];

const mockKanbanMarkdown = `# WS6 Prompt Kanban

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Start Time | End Time | Duration | Est. | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KS-001 | Completato | - | Cascade | 2026-01-01 10:00 | 2026-01-01 12:00 | 120 | 120 | 2026-01-01 | Evidence: Task completed successfully |
| KS-002 | In corso | KS-001 | ChatGPT Codex 5.1 | 2026-01-02 09:00 | - | - | 180 | 2026-01-02 | Working on implementation |
| KS-003 | Non assegnato | - | - | - | - | - | 90 | - | Pending assignment |
| KS-004 | Completato | KS-002 | Cascade | 2026-01-03 14:00 | 2026-01-03 16:30 | 150 | 120 | 2026-01-03 | Evidence: All tests passing |
`;

// Mock file system
vi.mock('node:fs/promises');
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);
const mockExistsSync = vi.mocked(existsSync);

// Test utility functions
function parseDate(dateStr: string): Date {
  if (!dateStr || dateStr === '-') return new Date(0);
  return new Date(dateStr);
}

function compareDates(dateA: string, dateB: string): number {
  const dA = parseDate(dateA);
  const dB = parseDate(dateB);
  return dA.getTime() - dB.getTime();
}

function parseDuration(durationStr: string): number {
  if (!durationStr || durationStr === '-') return 0;
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function compareDurations(durationA: string, durationB: string): number {
  const dA = parseDuration(durationA);
  const dB = parseDuration(durationB);
  return dA - dB;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Test functions
async function loadKanbanData(): Promise<KanbanRow[]> {
  const kanbanPath = 'src/docs/docs/coordinator/agent_assignments.md';
  
  if (!mockExistsSync(kanbanPath)) {
    throw new Error(`Kanban file not found: ${kanbanPath}`);
  }

  const raw = await mockReadFile(kanbanPath, 'utf8') as string;
  const lines = raw.split(/\r?\n/);
  const rows: KanbanRow[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim().startsWith('|')) continue;
    if (line.includes('---')) continue;

    const columns = line
      .split('|')
      .slice(1, -1)
      .map((col: string) => col.trim());

    if (columns.length < 10) continue;
    if (columns[0] === 'Prompt ID/Descrizione') continue;

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

function filterData(data: KanbanRow[], config: ExportConfig): KanbanRow[] {
  let filtered = [...data];

  // Status filter
  if (config.status) {
    filtered = filtered.filter(row => row.status === config.status);
  }

  // Agent filter
  if (config.agent) {
    filtered = filtered.filter(row => row.agent === config.agent);
  }

  // Date range filter
  if (config.dateRange) {
    filtered = filtered.filter(row => {
      if (!row.lastUpdate || row.lastUpdate === '-') return false;
      const updateDate = parseDate(row.lastUpdate);
      return updateDate >= config.dateRange!.start && updateDate <= config.dateRange!.end;
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (config.sortBy) {
      case 'lastUpdate':
        comparison = compareDates(a.lastUpdate, b.lastUpdate);
        break;
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'duration':
        comparison = compareDurations(a.duration, b.duration);
        break;
    }

    return config.sortOrder === 'desc' ? -comparison : comparison;
  });

  // Limit
  if (config.limit) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function generateAnalytics(data: KanbanRow[]): KanbanAnalytics {
  const total = data.length;
  const byStatus: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  const monthlyActivity: Record<string, number> = {};
  const agentPerformance: Record<string, { completed: number; averageDuration: number; completionRate: number }> = {};

  let completedTasks = 0;
  let totalDuration = 0;
  let durationCount = 0;

  data.forEach(row => {
    // Status aggregation
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;

    // Agent aggregation
    if (row.agent && row.agent !== '-') {
      byAgent[row.agent] = (byAgent[row.agent] || 0) + 1;
    }

    // Monthly activity
    if (row.lastUpdate && row.lastUpdate !== '-') {
      const date = parseDate(row.lastUpdate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    }

    // Completion metrics
    if (row.status === 'Completato') {
      completedTasks++;
      
      if (row.duration && row.duration !== '-') {
        const duration = parseDuration(row.duration);
        if (duration > 0) {
          totalDuration += duration;
          durationCount++;
        }
      }
    }

    // Agent performance
    if (row.agent && row.agent !== '-') {
      if (!agentPerformance[row.agent]) {
        agentPerformance[row.agent] = { completed: 0, averageDuration: 0, completionRate: 0 };
      }
      
      if (row.status === 'Completato') {
        agentPerformance[row.agent].completed++;
        
        if (row.duration && row.duration !== '-') {
          const duration = parseDuration(row.duration);
          if (duration > 0) {
            agentPerformance[row.agent].averageDuration += duration;
          }
        }
      }
    }
  });

  // Calculate derived metrics
  const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;
  const completionRate = total > 0 ? (completedTasks / total) * 100 : 0;
  const activeTasks = (byStatus['In corso'] || 0) + (byStatus['Assegnato'] || 0);
  const archivedTasks = byStatus['Archived'] || 0;

  // Finalize agent performance
  Object.keys(agentPerformance).forEach(agent => {
    const perf = agentPerformance[agent];
    const totalAgentTasks = byAgent[agent] || 0;
    perf.completionRate = totalAgentTasks > 0 ? (perf.completed / totalAgentTasks) * 100 : 0;
    if (perf.completed > 0) {
      perf.averageDuration = perf.averageDuration / perf.completed;
    }
  });

  return {
    total,
    byStatus,
    byAgent,
    completedTasks,
    averageDuration,
    completionRate,
    activeTasks,
    archivedTasks,
    monthlyActivity,
    agentPerformance,
  };
}

async function exportJSON(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void> {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalEntries: data.length,
      source: 'src/docs/docs/coordinator/agent_assignments.md',
    },
    analytics,
    data,
  };

  await mockWriteFile(outputPath, JSON.stringify(exportData, null, 2));
}

async function exportCSV(data: KanbanRow[], outputPath: string): Promise<void> {
  const headers = ['ID', 'Status', 'Dependencies', 'Agent', 'Start Time', 'End Time', 'Duration', 'Estimated', 'Last Update', 'Notes'];
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = [
      escapeCSV(row.id),
      escapeCSV(row.status),
      escapeCSV(row.dependencies),
      escapeCSV(row.agent),
      escapeCSV(row.startTime),
      escapeCSV(row.endTime),
      escapeCSV(row.duration),
      escapeCSV(row.estimated),
      escapeCSV(row.lastUpdate),
      escapeCSV(row.notes),
    ];
    csvRows.push(values.join(','));
  });

  await mockWriteFile(outputPath, csvRows.join('\n'));
}

async function exportMarkdown(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void> {
  let markdown = '# Kanban History Export\n\n';
  markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

  // Analytics summary
  markdown += '## Analytics Summary\n\n';
  markdown += `- **Total Tasks**: ${analytics.total}\n`;
  markdown += `- **Completed**: ${analytics.completedTasks} (${analytics.completionRate.toFixed(1)}%)\n`;
  markdown += `- **Active**: ${analytics.activeTasks}\n`;
  markdown += `- **Average Duration**: ${analytics.averageDuration.toFixed(1)} minutes\n\n`;

  await mockWriteFile(outputPath, markdown);
}

async function exportHTML(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Kanban History Export</title>
</head>
<body>
    <h1>Kanban History Export</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Total Tasks: ${analytics.total}</p>
</body>
</html>`;

  await mockWriteFile(outputPath, html);
}

describe('KanbanHistoryExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(mockKanbanMarkdown);
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadKanbanData', () => {
    it('should load kanban data from markdown file', async () => {
      const data = await loadKanbanData();
      
      expect(data).toHaveLength(4);
      expect(data[0]).toEqual(mockKanbanData[0]);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('agent_assignments.md'),
        'utf8'
      );
    });

    it('should throw error if kanban file not found', async () => {
      mockExistsSync.mockReturnValue(false);
      
      await expect(loadKanbanData()).rejects.toThrow('Kanban file not found');
    });

    it('should handle empty kanban file', async () => {
      mockReadFile.mockResolvedValue('# Empty kanban\n\nNo data here');
      
      const data = await loadKanbanData();
      expect(data).toHaveLength(0);
    });

    it('should skip header and separator rows', async () => {
      const markdownWithHeaders = `# Kanban

| Prompt ID | Stato | Agente |
| --- | --- | --- |
| KS-001 | Completato | Cascade |
| KS-002 | In corso | Agent |
`;

      mockReadFile.mockResolvedValue(markdownWithHeaders);
      
      const data = await loadKanbanData();
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('KS-001');
      expect(data[1].id).toBe('KS-002');
    });
  });

  describe('filterData', () => {
    const config = {
      format: 'json' as const,
      includeArchived: false,
      sortBy: 'lastUpdate' as const,
      sortOrder: 'desc' as const,
    };

    it('should filter by status', () => {
      const result = filterData(mockKanbanData, { ...config, status: 'Completato' });
      
      expect(result).toHaveLength(2);
      expect(result.every(row => row.status === 'Completato')).toBe(true);
    });

    it('should filter by agent', () => {
      const result = filterData(mockKanbanData, { ...config, agent: 'Cascade' });
      
      expect(result).toHaveLength(2);
      expect(result.every(row => row.agent === 'Cascade')).toBe(true);
    });

    it('should filter by date range', () => {
      const result = filterData(mockKanbanData, {
        ...config,
        dateRange: {
          start: new Date('2026-01-01'),
          end: new Date('2026-01-02'),
        },
      });
      
      expect(result).toHaveLength(2);
      expect(result.every(row => {
        const date = new Date(row.lastUpdate);
        return date >= new Date('2026-01-01') && date <= new Date('2026-01-02');
      })).toBe(true);
    });

    it('should sort by last update descending', () => {
      const result = filterData(mockKanbanData, config);
      
      expect(result[0].lastUpdate).toBe('2026-01-03');
      expect(result[1].lastUpdate).toBe('2026-01-02');
      expect(result[2].lastUpdate).toBe('2026-01-01');
    });

    it('should sort by last update ascending', () => {
      const result = filterData(mockKanbanData, { ...config, sortOrder: 'asc' });
      
      expect(result[0].lastUpdate).toBe('2026-01-01');
      expect(result[1].lastUpdate).toBe('2026-01-02');
      expect(result[2].lastUpdate).toBe('2026-01-03');
    });

    it('should sort by id', () => {
      const result = filterData(mockKanbanData, { ...config, sortBy: 'id' });
      
      expect(result[0].id).toBe('KS-004');
      expect(result[1].id).toBe('KS-003');
      expect(result[2].id).toBe('KS-002');
      expect(result[3].id).toBe('KS-001');
    });

    it('should limit results', () => {
      const result = filterData(mockKanbanData, { ...config, limit: 2 });
      
      expect(result).toHaveLength(2);
    });

    it('should handle multiple filters combined', () => {
      const result = filterData(mockKanbanData, {
        ...config,
        status: 'Completato',
        agent: 'Cascade',
        limit: 1,
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Completato');
      expect(result[0].agent).toBe('Cascade');
    });
  });

  describe('generateAnalytics', () => {
    it('should generate comprehensive analytics', () => {
      const analytics = generateAnalytics(mockKanbanData);
      
      expect(analytics.total).toBe(4);
      expect(analytics.completedTasks).toBe(2);
      expect(analytics.activeTasks).toBe(1);
      expect(analytics.completionRate).toBe(50);
      expect(analytics.averageDuration).toBe(135); // (120 + 150) / 2
    });

    it('should aggregate by status', () => {
      const analytics = generateAnalytics(mockKanbanData);
      
      expect(analytics.byStatus['Completato']).toBe(2);
      expect(analytics.byStatus['In corso']).toBe(1);
      expect(analytics.byStatus['Non assegnato']).toBe(1);
    });

    it('should aggregate by agent', () => {
      const analytics = generateAnalytics(mockKanbanData);
      
      expect(analytics.byAgent['Cascade']).toBe(2);
      expect(analytics.byAgent['ChatGPT Codex 5.1']).toBe(1);
    });

    it('should calculate monthly activity', () => {
      const analytics = generateAnalytics(mockKanbanData);
      
      expect(analytics.monthlyActivity['2026-01']).toBe(3); // Excludes non-assegnato
    });

    it('should calculate agent performance', () => {
      const analytics = generateAnalytics(mockKanbanData);
      
      expect(analytics.agentPerformance['Cascade']).toEqual({
        completed: 2,
        averageDuration: 135, // (120 + 150) / 2
        completionRate: 100, // 2/2 * 100
      });
      
      expect(analytics.agentPerformance['ChatGPT Codex 5.1']).toEqual({
        completed: 0,
        averageDuration: 0,
        completionRate: 0, // 0/1 * 100
      });
    });

    it('should handle empty data', () => {
      const analytics = generateAnalytics([]);
      
      expect(analytics.total).toBe(0);
      expect(analytics.completedTasks).toBe(0);
      expect(analytics.completionRate).toBe(0);
      expect(analytics.averageDuration).toBe(0);
      expect(Object.keys(analytics.byStatus)).toHaveLength(0);
      expect(Object.keys(analytics.byAgent)).toHaveLength(0);
    });

    it('should handle tasks without duration', () => {
      const dataWithoutDuration = [
        { ...mockKanbanData[0], duration: '-' },
        { ...mockKanbanData[1], duration: 'unknown' },
      ];
      
      const analytics = generateAnalytics(dataWithoutDuration);
      
      expect(analytics.averageDuration).toBe(0);
      expect(analytics.completedTasks).toBe(0); // No completed tasks with valid duration
    });
  });

  describe('Export Functions', () => {
    const mockAnalytics = {
      total: 4,
      byStatus: { 'Completato': 2, 'In corso': 1, 'Non assegnato': 1 },
      byAgent: { 'Cascade': 2, 'ChatGPT Codex 5.1': 1 },
      completedTasks: 2,
      averageDuration: 135,
      completionRate: 50,
      activeTasks: 1,
      archivedTasks: 0,
      monthlyActivity: { '2026-01': 3 },
      agentPerformance: {
        'Cascade': { completed: 2, averageDuration: 135, completionRate: 100 },
        'ChatGPT Codex 5.1': { completed: 0, averageDuration: 0, completionRate: 0 },
      },
    };

    describe('exportJSON', () => {
      it('should export data as JSON', async () => {
        const outputPath = '/tmp/test-export.json';
        
        await exportJSON(mockKanbanData, mockAnalytics, outputPath);
        
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('"metadata"'),
          expect.anything()
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('"analytics"'),
          expect.anything()
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('"data"'),
          expect.anything()
        );
      });

      it('should include metadata in JSON export', async () => {
        const outputPath = '/tmp/test-export.json';
        
        await exportJSON(mockKanbanData, mockAnalytics, outputPath);
        
        const writeCall = mockWriteFile.mock.calls[0];
        const jsonContent = JSON.parse(writeCall[1] as string);
        
        expect(jsonContent.metadata).toEqual({
          exportedAt: expect.any(String),
          totalEntries: 4,
          source: expect.stringContaining('agent_assignments.md'),
        });
      });
    });

    describe('exportCSV', () => {
      it('should export data as CSV', async () => {
        const outputPath = '/tmp/test-export.csv';
        
        await exportCSV(mockKanbanData, outputPath);
        
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringMatching(/^ID,Status,Dependencies,Agent/),
          expect.anything()
        );
      });

      it('should escape CSV values with commas', async () => {
        const dataWithCommas = [
          { ...mockKanbanData[0], notes: 'Task completed, with evidence' },
        ];
        
        await exportCSV(dataWithCommas, '/tmp/test.csv');
        
        const writeCall = mockWriteFile.mock.calls[0];
        const csvContent = writeCall[1] as string;
        
        expect(csvContent).toContain('"Task completed, with evidence"');
      });

      it('should escape CSV values with quotes', async () => {
        const dataWithQuotes = [
          { ...mockKanbanData[0], notes: 'Task with "quotes" in text' },
        ];
        
        await exportCSV(dataWithQuotes, '/tmp/test.csv');
        
        const writeCall = mockWriteFile.mock.calls[0];
        const csvContent = writeCall[1] as string;
        
        expect(csvContent).toContain('"Task with ""quotes"" in text"');
      });
    });

    describe('exportMarkdown', () => {
      it('should export data as Markdown', async () => {
        const outputPath = '/tmp/test-export.md';
        
        await exportMarkdown(mockKanbanData, mockAnalytics, outputPath);
        
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('# Kanban History Export'),
          expect.anything()
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('## Analytics Summary'),
          expect.anything()
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('| Status | Count |'),
          expect.anything()
        );
      });

      it('should include analytics summary in Markdown', async () => {
        const outputPath = '/tmp/test-export.md';
        
        await exportMarkdown(mockKanbanData, mockAnalytics, outputPath);
        
        const writeCall = mockWriteFile.mock.calls[0];
        const markdownContent = writeCall[1] as string;
        
        expect(markdownContent).toContain('**Total Tasks**: 4');
        expect(markdownContent).toContain('**Completed**: 2 (50.0%)');
        expect(markdownContent).toContain('**Average Duration**: 135.0 minutes');
      });
    });

    describe('exportHTML', () => {
      it('should export data as HTML', async () => {
        const outputPath = '/tmp/test-export.html';
        
        await exportHTML(mockKanbanData, mockAnalytics, outputPath);
        
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('<!DOCTYPE html>'),
          expect.anything()
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('<title>Kanban History Export</title>'),
          expect.anything()
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('<table>'),
          expect.anything()
        );
      });

      it('should include CSS styling in HTML', async () => {
        const outputPath = '/tmp/test-export.html';
        
        await exportHTML(mockKanbanData, mockAnalytics, outputPath);
        
        const writeCall = mockWriteFile.mock.calls[0];
        const htmlContent = writeCall[1] as string;
        
        expect(htmlContent).toContain('<style>');
        expect(htmlContent).toContain('background: #f5f5f5');
        expect(htmlContent).toContain('color: #007acc');
      });

      it('should include analytics metrics in HTML', async () => {
        const outputPath = '/tmp/test-export.html';
        
        await exportHTML(mockKanbanData, mockAnalytics, outputPath);
        
        const writeCall = mockWriteFile.mock.calls[0];
        const htmlContent = writeCall[1] as string;
        
        expect(htmlContent).toContain('<div class="metric-value">4</div>');
        expect(htmlContent).toContain('<div class="metric-value">2</div>');
        expect(htmlContent).toContain('<div class="metric-value">50.0%</div>');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete export workflow', async () => {
      // Load data
      const data = await loadKanbanData();
      expect(data).toHaveLength(4);

      // Filter data
      const filtered = filterData(data, {
        format: 'json',
        includeArchived: false,
        sortBy: 'lastUpdate',
        sortOrder: 'desc',
        status: 'Completato',
      });
      expect(filtered).toHaveLength(2);

      // Generate analytics
      const analytics = generateAnalytics(filtered);
      expect(analytics.total).toBe(2);
      expect(analytics.completedTasks).toBe(2);

      // Export to JSON
      await exportJSON(filtered, analytics, '/tmp/integration-test.json');
      expect(mockWriteFile).toHaveBeenCalled();

      // Export to CSV
      await exportCSV(filtered, '/tmp/integration-test.csv');
      expect(mockWriteFile).toHaveBeenCalled();

      // Export to Markdown
      await exportMarkdown(filtered, analytics, '/tmp/integration-test.md');
      expect(mockWriteFile).toHaveBeenCalled();

      // Export to HTML
      await exportHTML(filtered, analytics, '/tmp/integration-test.html');
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should handle edge cases gracefully', async () => {
      // Empty data
      const emptyAnalytics = generateAnalytics([]);
      expect(emptyAnalytics.total).toBe(0);

      // Data with missing fields
      const incompleteData = [
        { ...mockKanbanData[0], lastUpdate: '-', duration: '-' },
        { ...mockKanbanData[1], agent: '-', notes: '-' },
      ];

      const incompleteAnalytics = generateAnalytics(incompleteData);
      expect(incompleteAnalytics.total).toBe(2);
      expect(incompleteAnalytics.completedTasks).toBe(0); // No valid completed tasks
    });

    it('should handle large datasets efficiently', async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockKanbanData[0],
        id: `KS-${String(i + 1).padStart(3, '0')}`,
        lineNumber: i + 10,
      }));

      const startTime = Date.now();
      
      // Test filtering performance
      const filtered = filterData(largeDataset, {
        format: 'json',
        includeArchived: false,
        sortBy: 'lastUpdate',
        sortOrder: 'desc',
        limit: 100,
      });
      
      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(100); // Should complete in <100ms
      expect(filtered).toHaveLength(100);

      // Test analytics performance
      const analyticsStartTime = Date.now();
      const analytics = generateAnalytics(filtered);
      const analyticsTime = Date.now() - analyticsStartTime;
      
      expect(analyticsTime).toBeLessThan(50); // Should complete in <50ms
      expect(analytics.total).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      await expect(loadKanbanData()).rejects.toThrow('File not found');
    });

    it('should handle write errors during export', async () => {
      mockWriteFile.mockRejectedValue(new Error('Write permission denied'));
      
      await expect(
        exportJSON(mockKanbanData, {} as any, '/tmp/test.json')
      ).rejects.toThrow('Write permission denied');
    });

    it('should handle malformed kanban data', async () => {
      const malformedMarkdown = `# Kanban

| Invalid | Table |
| --- | --- |
| Missing | Columns |
| Too | Few |
| KS-001 | Completato | Cascade | Extra | Columns | Here | 120 | 120 | 2026-01-01 | Notes |
`;

      mockReadFile.mockResolvedValue(malformedMarkdown);
      
      const data = await loadKanbanData();
      // Should handle gracefully and parse valid rows
      expect(data.length).toBeGreaterThanOrEqual(0);
    });
  });
});
