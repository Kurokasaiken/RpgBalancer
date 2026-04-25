#!/usr/bin/env tsx
/**
 * Prompt Quick Buffer Automation
 * 
 * Automates the update of prompt_quick_buffer.md by:
 * 1. Parsing agent_assignments.md Kanban
 * 2. Applying policy rules (≥20 ready prompts, domain diversity)
 * 3. Generating changelog and history
 * 4. Emitting telemetry
 * 
 * @module scripts/coordinator/promptQuickBuffer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Represents a prompt entry from the Kanban
 */
interface PromptEntry {
  id: string;
  description: string;
  status: string;
  dependencies: string;
  agent: string;
  startTime: string;
  endTime: string;
  duration: string;
  estimate: string;
  lastUpdate: string;
  notes: string;
}

/**
 * Configuration for buffer policy
 */
interface BufferPolicy {
  minPrompts: number;
  requireDomainDiversity: boolean;
  excludeStatuses: string[];
}

/**
 * Changelog entry for buffer updates
 */
interface ChangelogEntry {
  timestamp: string;
  action: 'added' | 'removed' | 'refreshed';
  promptId: string;
  reason: string;
}

/**
 * Default buffer policy
 */
const DEFAULT_POLICY: BufferPolicy = {
  minPrompts: 20,
  requireDomainDiversity: true,
  excludeStatuses: ['In corso', 'Completato'],
};

/**
 * Parses the Kanban markdown file and extracts prompt entries
 * 
 * @param kanbanPath - Path to agent_assignments.md
 * @returns Array of prompt entries
 */
function parseKanban(kanbanPath: string): PromptEntry[] {
  const content = fs.readFileSync(kanbanPath, 'utf-8');
  const lines = content.split('\n');
  const prompts: PromptEntry[] = [];

  // Find table rows (skip header and separator)
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('| Prompt ID/Descrizione')) {
      inTable = true;
      continue;
    }
    if (line.startsWith('| ---')) {
      continue;
    }
    if (!inTable || !line.startsWith('|')) {
      continue;
    }

    // Parse table row
    const cells = line
      .split('|')
      .slice(1, -1) // Remove leading/trailing empty cells
      .map(cell => cell.trim());

    if (cells.length >= 10) {
      const [idDesc, status, deps, agent, start, end, duration, estimate, lastUpdate, notes] = cells;
      
      // Extract ID from "ID – Description" format
      const idMatch = idDesc.match(/^([A-Z]+-\d+)/);
      if (idMatch) {
        prompts.push({
          id: idMatch[1],
          description: idDesc,
          status,
          dependencies: deps,
          agent,
          startTime: start,
          endTime: end,
          duration,
          estimate,
          lastUpdate,
          notes,
        });
      }
    }
  }

  return prompts;
}

/**
 * Filters prompts based on buffer policy
 * 
 * @param prompts - All prompt entries
 * @param policy - Buffer policy configuration
 * @returns Filtered prompts ready for buffer
 */
function filterPrompts(prompts: PromptEntry[], policy: BufferPolicy): PromptEntry[] {
  // Exclude prompts with blocked statuses
  const filtered = prompts.filter(p => !policy.excludeStatuses.includes(p.status));

  // Check domain diversity if required
  if (policy.requireDomainDiversity) {
    const domains = new Set<string>();
    filtered.forEach(p => {
      const domainMatch = p.id.match(/^([A-Z]+)-/);
      if (domainMatch) {
        domains.add(domainMatch[1]);
      }
    });

    // Require at least 3 different domains
    if (domains.size < 3) {
      console.warn(`⚠️  Domain diversity check: only ${domains.size} domains found (need ≥3)`);
    }
  }

  // Ensure minimum prompt count
  if (filtered.length < policy.minPrompts) {
    console.warn(`⚠️  Buffer has ${filtered.length} prompts (policy requires ≥${policy.minPrompts})`);
  }

  return filtered;
}

/**
 * Generates markdown content for the buffer file
 * 
 * @param prompts - Filtered prompt entries
 * @param changelog - Recent changes
 * @returns Markdown content
 */
function generateBufferMarkdown(prompts: PromptEntry[], changelog: ChangelogEntry[]): string {
  const timestamp = new Date().toISOString();
  
  let md = `# Prompt Quick Buffer\n\n`;
  md += `**Last Updated**: ${timestamp}\n`;
  md += `**Total Ready Prompts**: ${prompts.length}\n\n`;
  
  md += `## Policy\n\n`;
  md += `- Minimum prompts: ${DEFAULT_POLICY.minPrompts}\n`;
  md += `- Domain diversity: ${DEFAULT_POLICY.requireDomainDiversity ? 'Required' : 'Optional'}\n`;
  md += `- Excluded statuses: ${DEFAULT_POLICY.excludeStatuses.join(', ')}\n\n`;
  
  md += `## Ready Prompts\n\n`;
  md += `| Prompt ID | Description | Status | Dependencies | Estimate |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  
  for (const prompt of prompts) {
    const desc = prompt.description.replace(/^[A-Z]+-\d+ – /, '');
    md += `| ${prompt.id} | ${desc} | ${prompt.status} | ${prompt.dependencies} | ${prompt.estimate} |\n`;
  }
  
  md += `\n## Recent Changes\n\n`;
  if (changelog.length > 0) {
    md += `| Timestamp | Action | Prompt ID | Reason |\n`;
    md += `| --- | --- | --- | --- |\n`;
    for (const entry of changelog.slice(-10)) { // Last 10 changes
      md += `| ${entry.timestamp} | ${entry.action} | ${entry.promptId} | ${entry.reason} |\n`;
    }
  } else {
    md += `*No recent changes*\n`;
  }
  
  return md;
}

/**
 * Loads existing changelog from buffer file
 * 
 * @param bufferPath - Path to prompt_quick_buffer.md
 * @returns Array of changelog entries
 */
function loadExistingChangelog(bufferPath: string): ChangelogEntry[] {
  if (!fs.existsSync(bufferPath)) {
    return [];
  }

  const content = fs.readFileSync(bufferPath, 'utf-8');
  const changelog: ChangelogEntry[] = [];
  
  // Parse existing changelog section
  const changelogMatch = content.match(/## Recent Changes\n\n([\s\S]*?)(?:\n##|\n$|$)/);
  if (changelogMatch) {
    const lines = changelogMatch[1].split('\n');
    for (const line of lines) {
      // Skip header row, separator row, and non-table lines
      if (line.startsWith('|') && !line.includes('Timestamp') && !line.includes('---')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 4) {
          changelog.push({
            timestamp: cells[0],
            action: cells[1] as 'added' | 'removed' | 'refreshed',
            promptId: cells[2],
            reason: cells[3],
          });
        }
      }
    }
  }

  return changelog;
}

/**
 * Emits telemetry event for buffer refresh
 * 
 * @param promptCount - Number of prompts in buffer
 * @param domains - Set of domains represented
 */
function emitTelemetry(promptCount: number, domains: Set<string>): void {
  const event = {
    eventType: 'prompt_quick_buffer_refreshed',
    timestamp: new Date().toISOString(),
    data: {
      promptCount,
      domainCount: domains.size,
      domains: Array.from(domains),
      policyCompliant: promptCount >= DEFAULT_POLICY.minPrompts && domains.size >= 3,
    },
  };

  console.log('📊 Telemetry:', JSON.stringify(event, null, 2));
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '../..');
  const kanbanPath = path.join(projectRoot, 'src/docs/docs/coordinator/agent_assignments.md');
  const bufferPath = path.join(projectRoot, 'src/docs/docs/coordinator/prompt_quick_buffer.md');

  console.log('🔄 Refreshing Prompt Quick Buffer...\n');

  // Parse Kanban
  console.log('📖 Parsing Kanban...');
  const allPrompts = parseKanban(kanbanPath);
  console.log(`   Found ${allPrompts.length} total prompts\n`);

  // Apply policy
  console.log('🔍 Applying buffer policy...');
  const readyPrompts = filterPrompts(allPrompts, DEFAULT_POLICY);
  console.log(`   ${readyPrompts.length} prompts ready for buffer\n`);

  // Load existing changelog
  const existingChangelog = loadExistingChangelog(bufferPath);

  // Add refresh entry to changelog
  const newChangelog: ChangelogEntry[] = [
    ...existingChangelog,
    {
      timestamp: new Date().toISOString(),
      action: 'refreshed',
      promptId: 'ALL',
      reason: `Buffer refreshed: ${readyPrompts.length} prompts available`,
    },
  ];

  // Generate buffer markdown
  console.log('📝 Generating buffer file...');
  const markdown = generateBufferMarkdown(readyPrompts, newChangelog);
  
  // Ensure directory exists
  const bufferDir = path.dirname(bufferPath);
  if (!fs.existsSync(bufferDir)) {
    fs.mkdirSync(bufferDir, { recursive: true });
  }

  // Write buffer file
  fs.writeFileSync(bufferPath, markdown, 'utf-8');
  console.log(`   ✅ Buffer written to: ${bufferPath}\n`);

  // Emit telemetry
  const domains = new Set<string>();
  readyPrompts.forEach(p => {
    const domainMatch = p.id.match(/^([A-Z]+)-/);
    if (domainMatch) domains.add(domainMatch[1]);
  });
  emitTelemetry(readyPrompts.length, domains);

  console.log('✅ Buffer refresh complete!');
}

export { parseKanban, filterPrompts, generateBufferMarkdown, loadExistingChangelog };

// Execute main if this is the entry point
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
