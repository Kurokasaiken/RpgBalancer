/**
 * Coordinator Prompt Consistency CLI - Markdown Parser
 * 
 * Simple Markdown parser for extracting prompt information from Kanban documents.
 * Uses robust text parsing without external dependencies.
 * 
 * @since 2026-01-20
 * @author Coordinator-Bot – Prompt QA
 */

import type {
  PromptEntryType,
  KanbanTableType,
  MarkdownDocumentType,
  AgentAssignmentType,
  KPIRequirementType,
} from './promptConsistencySchema';

/**
 * Parse agent assignment from text
 */
function parseAgentAssignment(text: string): AgentAssignmentType | null {
  // Handle different formats: "Name – Role" or just "Name"
  if (!text || text.trim() === '-' || text.trim() === '') return null;
  
  const agentMatch = text.match(/^([A-Za-z0-9-\s]+?)\s*–\s*(.+)$/);
  if (agentMatch) {
    return {
      name: agentMatch[1].trim(),
      role: agentMatch[2].trim(),
    };
  }
  
  // If no dash found, treat the whole text as name with empty role
  return {
    name: text.trim(),
    role: '',
  };
}

/**
 * Parse KPI requirements from prompt content
 */
function parseKPIRequirements(content: string): KPIRequirementType[] {
  const kpis: KPIRequirementType[] = [];
  
  // Look for KPI-related sections with more specific patterns
  const kpiPatterns = [
    /KPI\s*[:-]\s*(.+)/gi,
    /Key\s+Performance\s+Indicator[s]?\s*[:-]\s*(.+)/gi,
    /Metric[s]?\s*[:-]\s*(.+)/gi,
    /REGRESSION SAFEGUARDS\s*[:-]\s*(.+)/gi, // Common in prompts
  ];
  
  for (const pattern of kpiPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const kpiText = match[1].trim();
      // Skip if it's just a list of commands
      if (kpiText && !kpiText.startsWith('npm run')) {
        kpis.push({
          type: 'performance', // Default type
          description: kpiText,
        });
      }
    }
  }
  
  // If no KPIs found but there are safeguard commands, add them
  if (kpis.length === 0 && content.includes('REGRESSION SAFEGUARDS')) {
    kpis.push({
      type: 'testing',
      description: 'Regression safeguards implemented',
    });
  }
  
  return kpis;
}

/**
 * Parse evidence log reference
 */
function parseEvidenceLog(notes: string): string | null {
  const evidenceMatch = notes.match(/Evidence:\s*(test-results\/[^–\n]+)/);
  return evidenceMatch ? evidenceMatch[1].trim() : null;
}

/**
 * Parse table from markdown content
 */
function parseTable(content: string): KanbanTableType | null {
  const lines = content.split('\n');
  const tableStart = lines.findIndex(line => line.includes('---'));
  
  if (tableStart === -1) return null;
  
  // Find header row (usually before the separator)
  const headerLine = tableStart > 0 ? lines[tableStart - 1] : '';
  const headers = headerLine.split('|').map((h: string) => h.trim()).filter((h: string) => h);
  
  const rows: string[][] = [];
  
  // Parse data rows - simplified approach for test cases
  for (let i = tableStart + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and non-table lines
    if (!line.startsWith('|') || !line.includes('NP-')) continue;
    
    // Basic row parsing - split on pipes and clean up
    const cells = line.split('|')
      .map((c: string) => c.trim())
      .filter((c: string) => c)
      .map((c: string) => c.replace(/\n\s*\|/g, ' ')) // Clean up line breaks within cells
    
    if (cells.length >= headers.length) {
      rows.push(cells);
    }
    
    // Stop at empty line after table
    if (i + 1 < lines.length && lines[i + 1].trim() === '' && !lines[i + 1].startsWith('|')) {
      break;
    }
  }
  
  return { headers, rows };
}

/**
 * Parse prompt entry from table row
 */
function parsePromptEntry(row: string[], headers: string[]): PromptEntryType | null {
  if (row.length < 10) return null;
  
  // Find column indices
  const idIndex = headers.findIndex(h => h.includes('Prompt ID'));
  const stateIndex = headers.findIndex(h => h.includes('Stato'));
  const dependsIndex = headers.findIndex(h => h.includes('Dipende'));
  const agentIndex = headers.findIndex(h => h.includes('Agente'));
  const startIndex = headers.findIndex(h => h.includes('Start Time'));
  const endIndex = headers.findIndex(h => h.includes('End Time'));
  const durationIndex = headers.findIndex(h => h.includes('Duration'));
  const estimatedIndex = headers.findIndex(h => h.includes('Est.'));
  const updateIndex = headers.findIndex(h => h.includes('Ultimo Update'));
  const notesIndex = headers.findIndex(h => h.includes('Note'));
  
  if (idIndex === -1 || stateIndex === -1) return null;
  
  const idText = row[idIndex] || '';
  const idMatch = idText.match(/^NP-(\d+)\s*–\s*(.+)$/);
  if (!idMatch) return null;
  
  const [, idNum, title] = idMatch;
  const id = `NP-${idNum}`;
  const state = row[stateIndex] || '';
  const dependsOn = dependsIndex !== -1 && row[dependsIndex] ? 
    row[dependsIndex].split(',').map(d => d.trim()).filter(d => d && d !== '-') : [];
  const agentText = agentIndex !== -1 ? row[agentIndex] : '';
  const assignedTo = agentText ? parseAgentAssignment(agentText) || undefined : undefined;
  const startTime = startIndex !== -1 ? row[startIndex] || undefined : undefined;
  const endTime = endIndex !== -1 ? row[endIndex] || undefined : undefined;
  const duration = durationIndex !== -1 ? parseFloat(row[durationIndex]) || undefined : undefined;
  const estimated = estimatedIndex !== -1 ? parseFloat(row[estimatedIndex]) || undefined : undefined;
  const lastUpdate = updateIndex !== -1 ? row[updateIndex] || undefined : undefined;
  const notes = notesIndex !== -1 && notesIndex < row.length ? row[notesIndex] : '';
  const evidenceLog = notes ? parseEvidenceLog(notes) : undefined;
  
  return {
    id: id.trim(),
    title: title.trim(),
    description: title.trim(),
    state: state as any,
    dependsOn,
    assignedTo,
    startTime,
    endTime,
    duration,
    estimated,
    lastUpdate,
    notes,
    evidenceLog,
  };
}

/**
 * Main Markdown parser class
 */
export class MarkdownPromptParser {
  /**
   * Parse Markdown document and extract prompts
   */
  async parseDocument(content: string): Promise<MarkdownDocumentType> {
    const lines = content.split('\n');
    
    // Extract title
    const title = lines.find(line => line.startsWith('# '))?.slice(2) || '';
    
    // Parse table
    const table = parseTable(content);
    
    // Parse prompts from table
    const prompts: PromptEntryType[] = [];
    if (table && table.rows.length > 0) {
      for (const row of table.rows) {
        const prompt = parsePromptEntry(row, table.headers);
        if (prompt) {
          prompts.push(prompt);
        }
      }
    }
    
    // Extract KPIs from content
    const promptContents: { [id: string]: string } = {};
    let currentPromptId = '';
    let currentContent = '';
    
    for (const line of lines) {
      if (line.startsWith('NP-')) {
        // Save previous prompt content
        if (currentPromptId && currentContent) {
          promptContents[currentPromptId] = currentContent;
        }
        
        // Start new prompt
        const idMatch = line.match(/^(NP-\d+)/);
        currentPromptId = idMatch ? idMatch[1] : '';
        currentContent = line;
      } else if (currentPromptId) {
        currentContent += '\n' + line;
      }
    }
    
    // Save last prompt content
    if (currentPromptId && currentContent) {
      promptContents[currentPromptId] = currentContent;
    }
    
    // Add KPIs to prompts
    for (const prompt of prompts) {
      const content = promptContents[prompt.id];
      if (content) {
        prompt.kpiRequirements = parseKPIRequirements(content);
      }
    }
    
    return {
      title,
      content,
      prompts,
      table: table || { headers: [], rows: [] },
    };
  }
  
  /**
   * Parse multiple documents
   */
  async parseDocuments(contents: { [path: string]: string }): Promise<{ [path: string]: MarkdownDocumentType }> {
    const results: { [path: string]: MarkdownDocumentType } = {};
    
    for (const [path, content] of Object.entries(contents)) {
      try {
        results[path] = await this.parseDocument(content);
      } catch (error) {
        console.error(`Error parsing ${path}:`, error);
        results[path] = {
          title: '',
          content,
          prompts: [],
          table: { headers: [], rows: [] },
        };
      }
    }
    
    return results;
  }
  
  /**
   * Validate prompt entry
   */
  validatePrompt(prompt: PromptEntryType): boolean {
    return !!(
      prompt.id &&
      prompt.title &&
      prompt.state &&
      /^NP-\d+$/.test(prompt.id)
    );
  }
  
  /**
   * Extract dependencies from prompt content
   */
  extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Look for dependency patterns
    const depPatterns = [
      /DIPENDENZE\s*[:-]\s*([^\n]+)/gi,
      /Depends on\s*[:-]\s*([^\n]+)/gi,
      /Requires\s*[:-]\s*([^\n]+)/gi,
    ];
    
    for (const pattern of depPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const depText = match[1].trim();
        // Extract NP-XXX references
        const npMatches = depText.match(/NP-\d+/g);
        if (npMatches) {
          dependencies.push(...npMatches);
        }
      }
    }
    
    return [...new Set(dependencies)];
  }
}
