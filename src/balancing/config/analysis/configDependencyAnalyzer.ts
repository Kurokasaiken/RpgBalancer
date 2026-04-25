/**
 * Config Dependency Analyzer
 * Analyzes import dependencies between config files using TypeScript AST parsing
 * 
 * @see NP-140 – Tooling: Config Dependency Graph Generator
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { z } from 'zod';

// Dependency types
export const DependencyType = {
  IMPORT: 'import',
  TYPE_IMPORT: 'type_import',
  DYNAMIC_IMPORT: 'dynamic_import',
  REQUIRE: 'require',
} as const;

export type DependencyType = typeof DependencyType[keyof typeof DependencyType];

// Dependency info
export interface DependencyInfo {
  source: string;
  target: string;
  type: DependencyType;
  importedSymbols: string[];
  isTypeOnly: boolean;
  line: number;
}

// File node in dependency graph
export interface FileNode {
  filePath: string;
  relativePath: string;
  dependencies: DependencyInfo[];
  dependents: string[];
  isOrphaned: boolean;
  cyclesWith: string[];
}

// Dependency graph
export interface DependencyGraph {
  nodes: Map<string, FileNode>;
  edges: DependencyInfo[];
  cycles: string[][];
  orphans: string[];
  roots: string[];
}

// Analysis configuration
export interface AnalysisConfig {
  rootDir: string;
  includePatterns: string[];
  excludePatterns: string[];
  followTypeImports: boolean;
  detectCycles: boolean;
  detectOrphans: boolean;
  maxDepth: number;
}

// Zod schemas
export const DependencyInfoSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(['import', 'type_import', 'dynamic_import', 'require']),
  importedSymbols: z.array(z.string()),
  isTypeOnly: z.boolean(),
  line: z.number(),
});

export const AnalysisConfigSchema = z.object({
  rootDir: z.string(),
  includePatterns: z.array(z.string()),
  excludePatterns: z.array(z.string()),
  followTypeImports: z.boolean(),
  detectCycles: z.boolean(),
  detectOrphans: z.boolean(),
  maxDepth: z.number(),
});

// Default configuration
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  rootDir: './src/balancing/config',
  includePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/node_modules/**'],
  followTypeImports: true,
  detectCycles: true,
  detectOrphans: true,
  maxDepth: 10,
};

/**
 * Config Dependency Analyzer
 * 
 * Parses TypeScript files to extract import dependencies and build a dependency graph.
 * Detects circular dependencies and orphaned config files.
 */
export class ConfigDependencyAnalyzer {
  private config: AnalysisConfig;
  private graph: DependencyGraph;
  private fileCache: Map<string, ts.SourceFile>;

  constructor(config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG) {
    this.config = config;
    this.graph = {
      nodes: new Map(),
      edges: [],
      cycles: [],
      orphans: [],
      roots: [],
    };
    this.fileCache = new Map();
  }

  /**
   * Analyze all config files in the root directory
   */
  async analyze(): Promise<DependencyGraph> {
    const files = this.findConfigFiles();
    
    // Parse all files and extract dependencies
    for (const file of files) {
      await this.analyzeFile(file);
    }

    // Build reverse dependencies (dependents)
    this.buildDependents();

    // Detect cycles if enabled
    if (this.config.detectCycles) {
      this.detectCycles();
    }

    // Detect orphans if enabled
    if (this.config.detectOrphans) {
      this.detectOrphans();
    }

    // Find root nodes (no dependencies)
    this.findRoots();

    return this.graph;
  }

  /**
   * Find all config files matching patterns
   */
  private findConfigFiles(): string[] {
    const files: string[] = [];
    
    const walk = (dir: string, depth: number = 0): void => {
      if (depth > this.config.maxDepth) return;
      
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.config.rootDir, fullPath);
        
        // Check exclude patterns
        if (this.matchesPatterns(relativePath, this.config.excludePatterns)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          // Check include patterns
          if (this.matchesPatterns(relativePath, this.config.includePatterns)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    walk(this.config.rootDir);
    return files;
  }

  /**
   * Check if path matches any of the patterns
   */
  private matchesPatterns(filePath: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      // Simple glob matching (** and *)
      const regex = new RegExp(
        '^' + pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\./g, '\\.')
          + '$'
      );
      
      if (regex.test(filePath)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Analyze a single file and extract dependencies
   */
  private async analyzeFile(filePath: string): Promise<void> {
    const sourceFile = this.parseFile(filePath);
    if (!sourceFile) return;

    const dependencies: DependencyInfo[] = [];
    const relativePath = path.relative(this.config.rootDir, filePath);

    // Visit all import declarations
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        const dep = this.extractImportDependency(node, filePath, sourceFile);
        if (dep) dependencies.push(dep);
      } else if (ts.isCallExpression(node)) {
        // Check for dynamic imports and require()
        const dep = this.extractDynamicDependency(node, filePath, sourceFile);
        if (dep) dependencies.push(dep);
      }
      
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Create or update node
    const node: FileNode = {
      filePath,
      relativePath,
      dependencies,
      dependents: [],
      isOrphaned: false,
      cyclesWith: [],
    };

    this.graph.nodes.set(filePath, node);
    this.graph.edges.push(...dependencies);
  }

  /**
   * Parse TypeScript file
   */
  private parseFile(filePath: string): ts.SourceFile | null {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      this.fileCache.set(filePath, sourceFile);
      return sourceFile;
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract dependency from import declaration
   */
  private extractImportDependency(
    node: ts.ImportDeclaration,
    sourceFile: string,
    source: ts.SourceFile
  ): DependencyInfo | null {
    const moduleSpecifier = node.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) return null;

    const importPath = moduleSpecifier.text;
    const resolvedPath = this.resolveImportPath(importPath, sourceFile);
    if (!resolvedPath) return null;

    // Extract imported symbols
    const importedSymbols: string[] = [];
    const isTypeOnly = node.importClause?.isTypeOnly || false;

    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        importedSymbols.push(node.importClause.name.text);
      }

      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            importedSymbols.push(element.name.text);
          }
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          importedSymbols.push(node.importClause.namedBindings.name.text);
        }
      }
    }

    const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    return {
      source: sourceFile,
      target: resolvedPath,
      type: isTypeOnly ? 'type_import' : 'import',
      importedSymbols,
      isTypeOnly,
      line,
    };
  }

  /**
   * Extract dependency from dynamic import or require()
   */
  private extractDynamicDependency(
    node: ts.CallExpression,
    sourceFile: string,
    source: ts.SourceFile
  ): DependencyInfo | null {
    const expression = node.expression;
    
    // Check for import()
    if (expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (ts.isStringLiteral(arg)) {
        const resolvedPath = this.resolveImportPath(arg.text, sourceFile);
        if (!resolvedPath) return null;

        const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;

        return {
          source: sourceFile,
          target: resolvedPath,
          type: 'dynamic_import',
          importedSymbols: [],
          isTypeOnly: false,
          line,
        };
      }
    }

    // Check for require()
    if (ts.isIdentifier(expression) && expression.text === 'require') {
      const arg = node.arguments[0];
      if (ts.isStringLiteral(arg)) {
        const resolvedPath = this.resolveImportPath(arg.text, sourceFile);
        if (!resolvedPath) return null;

        const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;

        return {
          source: sourceFile,
          target: resolvedPath,
          type: 'require',
          importedSymbols: [],
          isTypeOnly: false,
          line,
        };
      }
    }

    return null;
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImportPath(importPath: string, sourceFile: string): string | null {
    // Skip external modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const sourceDir = path.dirname(sourceFile);
    const resolvedPath = path.resolve(sourceDir, importPath);

    // Try adding extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
    
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      return resolvedPath;
    }

    for (const ext of extensions) {
      const withExt = resolvedPath + ext;
      if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
        return withExt;
      }
    }

    return null;
  }

  /**
   * Build reverse dependencies (dependents)
   */
  private buildDependents(): void {
    for (const [filePath, node] of this.graph.nodes) {
      for (const dep of node.dependencies) {
        const targetNode = this.graph.nodes.get(dep.target);
        if (targetNode && !targetNode.dependents.includes(filePath)) {
          targetNode.dependents.push(filePath);
        }
      }
    }
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (filePath: string, path: string[]): void => {
      visited.add(filePath);
      recursionStack.add(filePath);
      path.push(filePath);

      const node = this.graph.nodes.get(filePath);
      if (!node) return;

      for (const dep of node.dependencies) {
        const target = dep.target;

        if (!visited.has(target)) {
          dfs(target, [...path]);
        } else if (recursionStack.has(target)) {
          // Found a cycle
          const cycleStart = path.indexOf(target);
          if (cycleStart !== -1) {
            const cycle = path.slice(cycleStart);
            cycle.push(target); // Close the cycle
            cycles.push(cycle);

            // Mark nodes as part of cycle
            for (const file of cycle) {
              const cycleNode = this.graph.nodes.get(file);
              if (cycleNode) {
                for (const otherFile of cycle) {
                  if (file !== otherFile && !cycleNode.cyclesWith.includes(otherFile)) {
                    cycleNode.cyclesWith.push(otherFile);
                  }
                }
              }
            }
          }
        }
      }

      recursionStack.delete(filePath);
    };

    for (const filePath of this.graph.nodes.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath, []);
      }
    }

    this.graph.cycles = cycles;
  }

  /**
   * Detect orphaned files (no dependents and not imported by anyone)
   */
  private detectOrphans(): void {
    const orphans: string[] = [];

    for (const [filePath, node] of this.graph.nodes) {
      if (node.dependents.length === 0) {
        node.isOrphaned = true;
        orphans.push(filePath);
      }
    }

    this.graph.orphans = orphans;
  }

  /**
   * Find root nodes (no dependencies)
   */
  private findRoots(): void {
    const roots: string[] = [];

    for (const [filePath, node] of this.graph.nodes) {
      if (node.dependencies.length === 0) {
        roots.push(filePath);
      }
    }

    this.graph.roots = roots;
  }

  /**
   * Get dependency graph
   */
  getGraph(): DependencyGraph {
    return this.graph;
  }

  /**
   * Get node by file path
   */
  getNode(filePath: string): FileNode | undefined {
    return this.graph.nodes.get(filePath);
  }

  /**
   * Get all cycles
   */
  getCycles(): string[][] {
    return this.graph.cycles;
  }

  /**
   * Get all orphans
   */
  getOrphans(): string[] {
    return this.graph.orphans;
  }

  /**
   * Get all roots
   */
  getRoots(): string[] {
    return this.graph.roots;
  }

  /**
   * Check if file is part of a cycle
   */
  isInCycle(filePath: string): boolean {
    const node = this.graph.nodes.get(filePath);
    return node ? node.cyclesWith.length > 0 : false;
  }

  /**
   * Get dependency chain from source to target
   */
  getDependencyChain(source: string, target: string): string[] | null {
    const visited = new Set<string>();
    const queue: { file: string; path: string[] }[] = [{ file: source, path: [source] }];

    while (queue.length > 0) {
      const { file, path } = queue.shift()!;
      
      if (file === target) {
        return path;
      }

      if (visited.has(file)) continue;
      visited.add(file);

      const node = this.graph.nodes.get(file);
      if (!node) continue;

      for (const dep of node.dependencies) {
        if (!visited.has(dep.target)) {
          queue.push({
            file: dep.target,
            path: [...path, dep.target],
          });
        }
      }
    }

    return null;
  }
}
