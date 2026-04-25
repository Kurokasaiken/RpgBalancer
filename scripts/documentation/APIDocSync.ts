#!/usr/bin/env tsx

/**
 * NP-027 – Idle Village Crew Scheduler API Doc Sync
 * 
 * Script TS→Markdown per documentazione API scheduler + strategy task update.
 * Extracts TypeScript API definitions from crew scheduler and generates
 * comprehensive Markdown documentation with strategy task synchronization.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Types for API documentation
interface APIElement {
  name: string;
  type: 'class' | 'interface' | 'function' | 'method' | 'property' | 'type' | 'enum';
  description?: string;
  signature?: string;
  parameters?: APIParameter[];
  returns?: APIReturn;
  examples?: string[];
  deprecated?: boolean;
  since?: string;
  seeAlso?: string[];
}

interface APIParameter {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
  defaultValue?: string;
}

interface APIReturn {
  type: string;
  description?: string;
}

interface StrategyTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  tags: string[];
  dependencies: string[];
  apiElements: string[];
  lastUpdated: number;
}

interface DocumentationConfig {
  sourceDirectory: string;
  outputDirectory: string;
  strategyFile: string;
  templates: {
    api: string;
    strategy: string;
    index: string;
  };
  excludePatterns: string[];
  includePatterns: string[];
  output: {
    format: 'markdown' | 'html' | 'both';
    includeExamples: boolean;
    includeToc: boolean;
    includeSearchIndex: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: DocumentationConfig = {
  sourceDirectory: join(process.cwd(), 'src/ui/idleVillage'),
  outputDirectory: join(process.cwd(), 'docs/api'),
  strategyFile: join(process.cwd(), 'docs/plans/crew_scheduler_strategy.md'),
  templates: {
    api: 'api-template.md',
    strategy: 'strategy-template.md',
    index: 'index-template.md',
  },
  excludePatterns: [
    '*.test.ts',
    '*.test.tsx',
    '*.spec.ts',
    '*.spec.tsx',
    '__tests__/**',
    'node_modules/**',
  ],
  includePatterns: [
    '*.ts',
    '*.tsx',
  ],
  output: {
    format: 'markdown',
    includeExamples: true,
    includeToc: true,
    includeSearchIndex: true,
  },
};

class APIDocSync {
  private config: DocumentationConfig;
  private apiElements: APIElement[] = [];
  private strategyTasks: StrategyTask[] = [];
  private startTime: number;

  constructor(config?: Partial<DocumentationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = Date.now();
    
    // Ensure output directory exists
    if (!existsSync(this.config.outputDirectory)) {
      mkdirSync(this.config.outputDirectory, { recursive: true });
    }
  }

  /**
   * Extract TypeScript API elements from source files
   */
  private async extractAPIElements(): Promise<void> {
    console.log('🔍 Extracting API elements from TypeScript files...');
    
    const sourceFiles = this.getSourceFiles();
    
    for (const file of sourceFiles) {
      const elements = await this.extractFromFile(file);
      this.apiElements.push(...elements);
    }
    
    console.log(`✅ Extracted ${this.apiElements.length} API elements from ${sourceFiles.length} files`);
  }

  /**
   * Get source files to process
   */
  private getSourceFiles(): string[] {
    const { execSync } = require('child_process');
    
    try {
      const output = execSync(`find "${this.config.sourceDirectory}" -name "*.ts" -o -name "*.tsx"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });
      
      const files = output.split('\n').filter(file => file.trim());
      
      return files.filter(file => {
        return this.shouldIncludeFile(file);
      });
    } catch (error) {
      console.warn('Could not use find command, falling back to manual scan');
      return this.manualFileScan();
    }
  }

  /**
   * Manual file scanning fallback
   */
  private manualFileScan(): string[] {
    const { readdirSync, statSync } = require('fs');
    const { join } = require('path');
    
    const files: string[] = [];
    
    const scanDirectory = (dir: string) => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.shouldIncludeFile(fullPath)) {
          files.push(fullPath);
        }
      }
    };
    
    scanDirectory(this.config.sourceDirectory);
    return files;
  }

  /**
   * Check if file should be included
   */
  private shouldIncludeFile(filePath: string): boolean {
    const relativePath = filePath.replace(this.config.sourceDirectory, '');
    
    // Check exclude patterns
    for (const pattern of this.config.excludePatterns) {
      if (relativePath.includes(pattern.replace('*', ''))) {
        return false;
      }
    }
    
    // Check include patterns
    for (const pattern of this.config.includePatterns) {
      if (relativePath.endsWith(pattern.replace('*', ''))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract API elements from a single file
   */
  private async extractFromFile(filePath: string): Promise<APIElement[]> {
    const content = readFileSync(filePath, 'utf8');
    const elements: APIElement[] = [];
    
    // Extract classes
    const classMatches = content.matchAll(/export\s+class\s+(\w+)(?:\s*<[^>]*>)?\s*(?:extends\s+(\w+))?\s*\{[^}]*\}/g);
    for (const match of classMatches) {
      elements.push({
        name: match[1],
        type: 'class',
        description: this.extractDescription(content, match.index),
        signature: match[0],
        examples: this.extractExamples(content, match[1]),
        seeAlso: this.extractSeeAlso(content, match[1]),
      });
    }
    
    // Extract interfaces
    const interfaceMatches = content.matchAll(/export\s+interface\s+(\w+)(?:\s*<[^>]*>)?\s*(?:extends\s+([^{\n]+))?\s*\{[^}]*\}/g);
    for (const match of interfaceMatches) {
      elements.push({
        name: match[1],
        type: 'interface',
        description: this.extractDescription(content, match.index),
        signature: match[0],
        seeAlso: this.extractSeeAlso(content, match[1]),
      });
    }
    
    // Extract functions
    const functionMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{;]+))?\s*\{[^}]*\}/g);
    for (const match of functionMatches) {
      const parameters = this.parseParameters(match[2]);
      elements.push({
        name: match[1],
        type: 'function',
        description: this.extractDescription(content, match.index),
        signature: match[0],
        parameters,
        returns: match[3] ? { type: match[3].trim() } : undefined,
        examples: this.extractExamples(content, match[1]),
        seeAlso: this.extractSeeAlso(content, match[1]),
      });
    }
    
    // Extract types
    const typeMatches = content.matchAll(/export\s+type\s+(\w+)\s*=\s*([^;]+);/g);
    for (const match of typeMatches) {
      elements.push({
        name: match[1],
        type: 'type',
        description: this.extractDescription(content, match.index),
        signature: match[0],
        seeAlso: this.extractSeeAlso(content, match[1]),
      });
    }
    
    // Extract enums
    const enumMatches = content.matchAll(/export\s+enum\s+(\w+)\s*\{[^}]*\}/g);
    for (const match of enumMatches) {
      elements.push({
        name: match[1],
        type: 'enum',
        description: this.extractDescription(content, match.index),
        signature: match[0],
        seeAlso: this.extractSeeAlso(content, match[1]),
      });
    }
    
    return elements;
  }

  /**
   * Extract description from content
   */
  private extractDescription(content: string, index: number): string {
    const lines = content.substring(0, index).split('\n');
    const descriptionLines: string[] = [];
    
    // Look backwards from the match to find JSDoc comments
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      if (line.startsWith('/**')) {
        // Found JSDoc start, collect description
        for (let j = i; j < lines.length; j++) {
          const docLine = lines[j].trim();
          if (docLine === '*/') break;
          
          // Remove JSDoc markers and clean up
          const cleanLine = docLine
            .replace(/^\*\s?/, '')
            .replace(/\/\*\*/, '')
            .replace(/@\w+\s+/, '');
          
          if (cleanLine && !cleanLine.startsWith('@')) {
            descriptionLines.unshift(cleanLine);
          }
        }
        break;
      }
      
      if (line && !line.startsWith('//') && !line.startsWith('/*')) {
        break; // Stop at non-comment line
      }
    }
    
    return descriptionLines.join(' ');
  }

  /**
   * Extract examples for an element
   */
  private extractExamples(content: string, elementName: string): string[] {
    const examples: string[] = [];
    const exampleRegex = new RegExp(`\\/\\*\\*\\s*${elementName}\\s*example[^*]*\\*\\/([\\s\\S]*?)\\/\\*\\*`, 'gi');
    
    const matches = content.matchAll(exampleRegex);
    for (const match of matches) {
      const example = match[1].trim();
      if (example) {
        examples.push(example);
      }
    }
    
    return examples;
  }

  /**
   * Extract "See also" references
   */
  private extractSeeAlso(content: string, elementName: string): string[] {
    const seeAlso: string[] = [];
    const seeAlsoRegex = new RegExp(`\\/\\*\\*\\s*${elementName}[^*]*\\@see\\s+([^\\*]+)\\*\\/`, 'gi');
    
    const matches = content.matchAll(seeAlsoRegex);
    for (const match of matches) {
      const reference = match[1].trim();
      if (reference) {
        seeAlso.push(reference);
      }
    }
    
    return seeAlso;
  }

  /**
   * Parse function parameters
   */
  private parseParameters(paramString: string): APIParameter[] {
    if (!paramString.trim()) return [];
    
    const parameters: APIParameter[] = [];
    const params = paramString.split(',').map(p => p.trim());
    
    for (const param of params) {
      const match = param.match(/(\w+)(\?)?:\s*([^=]+)/);
      if (match) {
        parameters.push({
          name: match[1],
          optional: !!match[2],
          type: match[3].trim(),
        });
      }
    }
    
    return parameters;
  }

  /**
   * Load existing strategy tasks
   */
  private loadStrategyTasks(): void {
    if (!existsSync(this.config.strategyFile)) {
      console.log('📝 Creating new strategy file...');
      this.createDefaultStrategyFile();
      return;
    }
    
    console.log('📖 Loading existing strategy tasks...');
    const content = readFileSync(this.config.strategyFile, 'utf8');
    
    // Parse strategy tasks from markdown
    const taskMatches = content.matchAll(/###\s*\[([^\]]+)\]\s*([^\n]+)\n\n(.*?)\n\n---/gs);
    
    for (const match of taskMatches) {
      const [, status, title, description] = match;
      
      this.strategyTasks.push({
        id: this.generateTaskId(title),
        title: title.trim(),
        description: description.trim(),
        status: status as StrategyTask['status'],
        priority: this.extractPriority(description),
        tags: this.extractTags(description),
        dependencies: this.extractDependencies(description),
        apiElements: this.extractAPIElements(description),
        lastUpdated: Date.now(),
      });
    }
    
    console.log(`✅ Loaded ${this.strategyTasks.length} strategy tasks`);
  }

  /**
   * Create default strategy file
   */
  private createDefaultStrategyFile(): void {
    const defaultContent = `# Crew Scheduler Strategy Tasks

This document contains strategy tasks for the Idle Village Crew Scheduler API development and maintenance.

## Task Template

### [pending] Task Title
Description of the task with details about implementation requirements.

**Priority:** medium
**Tags:** api, documentation
**Dependencies:** task-id-1, task-id-2
**API Elements:** ClassName, functionName

---

## Current Tasks

### [pending] API Documentation Setup
Set up the initial API documentation structure and templates.

**Priority:** high
**Tags:** api, documentation, setup
**Dependencies:** 
**API Elements:** 

---

*Generated on ${new Date().toISOString()}*
`;

    writeFileSync(this.config.strategyFile, defaultContent, 'utf8');
  }

  /**
   * Generate task ID
   */
  private generateTaskId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
  }

  /**
   * Extract priority from description
   */
  private extractPriority(description: string): StrategyTask['priority'] {
    const priorityMatch = description.match(/\*\*Priority:\*\*\s*(low|medium|high|critical)/i);
    return priorityMatch ? priorityMatch[1].toLowerCase() as StrategyTask['priority'] : 'medium';
  }

  /**
   * Extract tags from description
   */
  private extractTags(description: string): string[] {
    const tagsMatch = description.match(/\*\*Tags:\*\*\s*([^\n]+)/i);
    if (!tagsMatch) return [];
    
    return tagsMatch[1].split(',').map(tag => tag.trim());
  }

  /**
   * Extract dependencies from description
   */
  private extractDependencies(description: string): string[] {
    const depsMatch = description.match(/\*\*Dependencies:\*\*\s*([^\n]+)/i);
    if (!depsMatch) return [];
    
    return depsMatch[1].split(',').map(dep => dep.trim());
  }

  /**
   * Extract API elements from description
   */
  private extractAPIElements(description: string): string[] {
    const apiMatch = description.match(/\*\*API Elements:\*\*\s*([^\n]+)/i);
    if (!apiMatch) return [];
    
    return apiMatch[1].split(',').map(element => element.trim());
  }

  /**
   * Update strategy tasks based on API elements
   */
  private updateStrategyTasks(): void {
    console.log('🔄 Updating strategy tasks based on API elements...');
    
    // Find API elements that need documentation
    const undocumentedElements = this.apiElements.filter(element => {
      return !this.strategyTasks.some(task => 
        task.apiElements.includes(element.name)
      );
    });
    
    // Create tasks for undocumented elements
    for (const element of undocumentedElements) {
      const task: StrategyTask = {
        id: this.generateTaskId(`document-${element.name}`),
        title: `Document ${element.name} ${element.type}`,
        description: `Create comprehensive documentation for the ${element.type} \`${element.name}\`. Include usage examples, parameter descriptions, and integration guides.

**Priority:** medium
**Tags:** api, documentation, ${element.type}
**Dependencies:** 
**API Elements:** ${element.name}`,
        status: 'pending',
        priority: 'medium',
        tags: ['api', 'documentation', element.type],
        dependencies: [],
        apiElements: [element.name],
        lastUpdated: Date.now(),
      };
      
      this.strategyTasks.push(task);
    }
    
    // Mark tasks as completed if their API elements are documented
    for (const task of this.strategyTasks) {
      if (task.status === 'in_progress' || task.status === 'pending') {
        const isDocumented = task.apiElements.every(elementName =>
          this.apiElements.some(element => element.name === elementName)
        );
        
        if (isDocumented) {
          task.status = 'completed';
          task.lastUpdated = Date.now();
        }
      }
    }
    
    console.log(`✅ Updated strategy tasks. Created ${undocumentedElements.length} new tasks.`);
  }

  /**
   * Save updated strategy file
   */
  private saveStrategyFile(): void {
    console.log('💾 Saving updated strategy file...');
    
    let content = `# Crew Scheduler Strategy Tasks

This document contains strategy tasks for the Idle Village Crew Scheduler API development and maintenance.

*Last updated: ${new Date().toISOString()}*
*Total tasks: ${this.strategyTasks.length}*
*Completed: ${this.strategyTasks.filter(t => t.status === 'completed').length}*
*In Progress: ${this.strategyTasks.filter(t => t.status === 'in_progress').length}*
*Pending: ${this.strategyTasks.filter(t => t.status === 'pending').length}*

---

## Task Summary

| Status | Count |
|--------|-------|
| Completed | ${this.strategyTasks.filter(t => t.status === 'completed').length} |
| In Progress | ${this.strategyTasks.filter(t => t.status === 'in_progress').length} |
| Pending | ${this.strategyTasks.filter(t => t.status === 'pending').length} |
| Blocked | ${this.strategyTasks.filter(t => t.status === 'blocked').length} |

---

## Tasks

`;

    // Sort tasks by priority and status
    const sortedTasks = this.strategyTasks.sort((a, b) => {
      const statusOrder = { blocked: 0, pending: 1, in_progress: 2, completed: 3 };
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const task of sortedTasks) {
      content += `### [${task.status}] ${task.title}
${task.description}

**Priority:** ${task.priority}
**Tags:** ${task.tags.join(', ')}
**Dependencies:** ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'none'}
**API Elements:** ${task.apiElements.join(', ')}
**Last Updated:** ${new Date(task.lastUpdated).toISOString()}

---
`;
    }

    writeFileSync(this.config.strategyFile, content, 'utf8');
    console.log('✅ Strategy file saved successfully');
  }

  /**
   * Generate API documentation
   */
  private generateAPIDocumentation(): void {
    console.log('📚 Generating API documentation...');
    
    // Group API elements by type
    const groupedElements = this.groupAPIElements();
    
    // Generate index
    this.generateIndex(groupedElements);
    
    // Generate documentation for each group
    for (const [type, elements] of Object.entries(groupedElements)) {
      this.generateGroupDocumentation(type, elements);
    }
    
    console.log('✅ API documentation generated successfully');
  }

  /**
   * Group API elements by type
   */
  private groupAPIElements(): Record<string, APIElement[]> {
    const grouped: Record<string, APIElement[]> = {};
    
    for (const element of this.apiElements) {
      if (!grouped[element.type]) {
        grouped[element.type] = [];
      }
      grouped[element.type].push(element);
    }
    
    // Sort elements within each group
    for (const type in grouped) {
      grouped[type].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return grouped;
  }

  /**
   * Generate index documentation
   */
  private generateIndex(groupedElements: Record<string, APIElement[]>): void {
    let content = `# Crew Scheduler API Documentation

Complete API reference for the Idle Village Crew Scheduler system.

*Generated on ${new Date().toISOString()}*
*Total API Elements: ${this.apiElements.length}*

---

## Quick Navigation

`;

    // Add table of contents
    content += '| Type | Count | Documentation |\n';
    content += '|------|-------|----------------|\n';
    
    for (const [type, elements] of Object.entries(groupedElements)) {
      const fileName = `${type.toLowerCase()}.md`;
      content += `| ${type.charAt(0).toUpperCase() + type.slice(1)} | ${elements.length} | [${fileName}](${fileName}) |\n`;
    }

    content += '\n---\n\n';

    // Add API elements overview
    content += '## API Elements Overview\n\n';
    
    for (const [type, elements] of Object.entries(groupedElements)) {
      content += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
      
      for (const element of elements) {
        const link = `${type.toLowerCase()}.md#${element.name.toLowerCase()}`;
        content += `- [\`${element.name}\`](${link})${element.description ? ` - ${element.description}` : ''}\n`;
      }
      
      content += '\n';
    }

    const indexPath = join(this.config.outputDirectory, 'index.md');
    writeFileSync(indexPath, content, 'utf8');
  }

  /**
   * Generate documentation for a specific group
   */
  private generateGroupDocumentation(type: string, elements: APIElement[]): void {
    let content = `# ${type.charAt(0).toUpperCase() + type.slice(1)}

API documentation for ${type} in the Crew Scheduler system.

*Generated on ${new Date().toISOString()}*

---

`;

    for (const element of elements) {
      content += `## ${element.name}\n\n`;
      
      if (element.description) {
        content += `${element.description}\n\n`;
      }
      
      if (element.signature) {
        content += '### Signature\n\n';
        content += '```typescript\n';
        content += element.signature;
        content += '\n```\n\n';
      }
      
      if (element.parameters && element.parameters.length > 0) {
        content += '### Parameters\n\n';
        content += '| Name | Type | Optional | Description |\n';
        content += '|------|------|----------|------------|\n';
        
        for (const param of element.parameters) {
          content += `| \`${param.name}\` | \`${param.type}\` | ${param.optional ? 'Yes' : 'No'} | ${param.description || '-'} |\n`;
        }
        
        content += '\n';
      }
      
      if (element.returns) {
        content += '### Returns\n\n';
        content += `**Type:** \`${element.returns.type}\`\n\n`;
        
        if (element.returns.description) {
          content += `${element.returns.description}\n\n`;
        }
      }
      
      if (element.examples && element.examples.length > 0) {
        content += '### Examples\n\n';
        
        for (const example of element.examples) {
          content += '```typescript\n';
          content += example;
          content += '\n```\n\n';
        }
      }
      
      if (element.seeAlso && element.seeAlso.length > 0) {
        content += '### See Also\n\n';
        
        for (const reference of element.seeAlso) {
          content += `- ${reference}\n`;
        }
        
        content += '\n';
      }
      
      if (element.deprecated) {
        content += '⚠️ **Deprecated**\n\n';
      }
      
      if (element.since) {
        content += `*Since: ${element.since}*\n\n`;
      }
      
      content += '---\n\n';
    }

    const fileName = `${type.toLowerCase()}.md`;
    const filePath = join(this.config.outputDirectory, fileName);
    writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Generate search index
   */
  private generateSearchIndex(): void {
    if (!this.config.output.includeSearchIndex) return;
    
    console.log('🔍 Generating search index...');
    
    const searchIndex = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      elements: this.apiElements.map(element => ({
        name: element.name,
        type: element.type,
        description: element.description,
        keywords: [
          element.name,
          element.type,
          ...(element.description ? element.description.split(' ') : []),
          ...(element.seeAlso || []),
        ],
      })),
    };
    
    const indexPath = join(this.config.outputDirectory, 'search-index.json');
    writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2), 'utf8');
    
    console.log('✅ Search index generated');
  }

  /**
   * Run the complete documentation sync process
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting API Documentation Sync...');
      console.log(`📁 Source directory: ${this.config.sourceDirectory}`);
      console.log(`📁 Output directory: ${this.config.outputDirectory}`);
      
      // Extract API elements
      await this.extractAPIElements();
      
      // Load and update strategy tasks
      this.loadStrategyTasks();
      this.updateStrategyTasks();
      this.saveStrategyFile();
      
      // Generate documentation
      this.generateAPIDocumentation();
      this.generateSearchIndex();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n🎉 API Documentation Sync completed successfully!`);
      console.log(`📊 Processed ${this.apiElements.length} API elements`);
      console.log(`📋 Updated ${this.strategyTasks.length} strategy tasks`);
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      
    } catch (error) {
      console.error(`❌ API Documentation Sync failed:`, error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: Partial<DocumentationConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        console.log(`
NP-027 API Documentation Sync

Usage: tsx APIDocSync.ts [options]

Options:
  --help, -h              Show this help message
  --source-dir, -s        Source directory (default: ./src/ui/idleVillage)
  --output-dir, -o        Output directory (default: ./docs/api)
  --strategy-file, -f      Strategy file path (default: ./docs/plans/crew_scheduler_strategy.md)
  --format, -f            Output format: markdown, html, both (default: markdown)
  --no-examples           Exclude code examples from documentation
  --no-toc               Exclude table of contents
  --no-search-index       Exclude search index generation

Examples:
  tsx APIDocSync.ts
  tsx APIDocSync.ts --source-dir ./src --output-dir ./docs
  tsx APIDocSync.ts --format both --no-examples
  tsx APIDocSync.ts --strategy-file ./custom/strategy.md
        `);
        process.exit(0);
        
      case '--source-dir':
      case '-s':
        config.sourceDirectory = args[++i];
        break;
        
      case '--output-dir':
      case '-o':
        config.outputDirectory = args[++i];
        break;
        
      case '--strategy-file':
      case '-f':
        config.strategyFile = args[++i];
        break;
        
      case '--format':
        const format = args[++i] as 'markdown' | 'html' | 'both';
        if (['markdown', 'html', 'both'].includes(format)) {
          config.output = { ...DEFAULT_CONFIG.output, format };
        } else {
          console.error(`Invalid format: ${format}`);
          process.exit(1);
        }
        break;
        
      case '--no-examples':
        config.output = { ...DEFAULT_CONFIG.output, includeExamples: false };
        break;
        
      case '--no-toc':
        config.output = { ...DEFAULT_CONFIG.output, includeToc: false };
        break;
        
      case '--no-search-index':
        config.output = { ...DEFAULT_CONFIG.output, includeSearchIndex: false };
        break;
        
      default:
        console.error(`Unknown option: ${arg}`);
        console.log('Use --help for available options');
        process.exit(1);
    }
  }

  // Run the documentation sync
  const sync = new APIDocSync(config);
  await sync.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { APIDocSync, type APIElement, type StrategyTask, type DocumentationConfig };
