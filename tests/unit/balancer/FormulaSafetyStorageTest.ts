/**
 * Formula Safety Storage Test Suite
 * 
 * Config-first test suite for verifying formula safety in Balancer storage.
 * Integrates with Storage Testing Framework and provides CLI interface.
 */

import { FormulaSafetyAnalyzer, DEFAULT_SAFETY_CONFIG, DEFAULT_SAFETY_RULES } from '../../balancing/formulaSafetyAnalyzer';
import { StorageTestFramework, type StorageAdapter } from '../../../shared/testing/StorageTestFramework';
import { PersistenceService } from '../../../shared/persistence/PersistenceService';

// Test configuration schema
export interface FormulaSafetyTestConfig {
  formulaId?: string;
  rules?: string[];
  outputFormat?: 'json' | 'markdown' | 'csv';
  verbose?: boolean;
  includeRecommendations?: boolean;
  customThresholds?: {
    maxComplexity?: 'low' | 'medium' | 'high';
    maxOperations?: number;
  };
}

// Test data schema
export interface FormulaTestData {
  id: string;
  formula: string;
  context: {
    stats: Record<string, { min: number; max: number; current: number }>;
    maxOperations?: number;
    allowNegative?: boolean;
  };
  expectedSafety?: 'safe' | 'warning' | 'unsafe' | 'critical';
}

// Default test formulas
export const DEFAULT_TEST_FORMULAS: FormulaTestData[] = [
  {
    id: 'basic-damage',
    formula: 'damage + strength * 0.5',
    context: {
      stats: {
        damage: { min: 10, max: 100, current: 50 },
        strength: { min: 5, max: 20, current: 10 },
      },
    },
    expectedSafety: 'safe',
  },
  {
    id: 'complex-nested',
    formula: 'max(0, min(100, (base + bonus) * multiplier * (1 + critChance)))',
    context: {
      stats: {
        base: { min: 10, max: 50, current: 25 },
        bonus: { min: 0, max: 20, current: 5 },
        multiplier: { min: 1, max: 3, current: 1.5 },
        critChance: { min: 0, max: 0.5, current: 0.1 },
      },
    },
    expectedSafety: 'warning',
  },
  {
    id: 'division-risk',
    formula: 'damage / defense',
    context: {
      stats: {
        damage: { min: 10, max: 100, current: 50 },
        defense: { min: 0, max: 50, current: 25 },
      },
    },
    expectedSafety: 'unsafe',
  },
  {
    id: 'potential-cycle',
    formula: 'value + calculateValue(value)',
    context: {
      stats: {
        value: { min: 1, max: 100, current: 50 },
      },
    },
    expectedSafety: 'critical',
  },
];

/**
 * Formula Safety Storage Test Suite
 */
export class FormulaSafetyStorageTestSuite {
  private analyzer: FormulaSafetyAnalyzer;
  private storageFramework: StorageTestFramework<any>;

  constructor(config: Partial<FormulaSafetyTestConfig> = {}) {
    const safetyConfig = {
      ...DEFAULT_SAFETY_CONFIG,
      ...config.customThresholds,
    };

    this.analyzer = new FormulaSafetyAnalyzer(safetyConfig);
    
    // Add custom rules
    DEFAULT_SAFETY_RULES.forEach(rule => this.analyzer.addRule(rule));

    // Initialize storage framework with PersistenceService
    this.storageFramework = new StorageTestFramework('formula-safety', {
      save: async (data) => {
        await PersistenceService.saveData('formula-safety-test', data);
      },
      load: async () => {
        return await PersistenceService.loadData('formula-safety-test') || {};
      },
      clear: async () => {
        await PersistenceService.saveData('formula-safety-test', {});
      },
    });
  }

  /**
   * Run single formula test
   */
  async testSingleFormula(testData: FormulaTestData): Promise<any> {
    const result = this.analyzer.analyzeFormula(
      testData.formula,
      testData.id,
      testData.context
    );

    const passed = testData.expectedSafety ? 
      result.overallSafety === testData.expectedSafety : 
      result.overallSafety !== 'critical';

    return {
      formulaId: testData.id,
      formula: testData.formula,
      expected: testData.expectedSafety,
      actual: result.overallSafety,
      passed,
      result,
      timestamp: Date.now(),
    };
  }

  /**
   * Run complete test suite
   */
  async runTestSuite(formulas: FormulaTestData[] = DEFAULT_TEST_FORMULAS): Promise<any> {
    const startTime = Date.now();
    const results = [];

    for (const formula of formulas) {
      try {
        const result = await this.testSingleFormula(formula);
        results.push(result);
        
        if (this.analyzer['config']?.verbose) {
          console.log(`✓ Formula ${formula.id}: ${result.actual} (${result.passed ? 'PASS' : 'FAIL'})`);
        }
      } catch (error) {
        results.push({
          formulaId: formula.id,
          formula: formula.formula,
          error: error instanceof Error ? error.message : 'Unknown error',
          passed: false,
          timestamp: Date.now(),
        });
      }
    }

    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };

    return {
      summary,
      results,
      storageAnalysis: this.analyzer.analyzeStorage(
        formulas.map(f => ({
          id: f.id,
          formula: f.formula,
          context: f.context,
        }))
      ),
    };
  }

  /**
   * Run storage integration tests
   */
  async runStorageTests(): Promise<any> {
    const testData = {
      formulas: DEFAULT_TEST_FORMULAS,
      timestamp: Date.now(),
    };

    return await this.storageFramework.runFullTest(testData, {
      formulas: [],
      timestamp: Date.now() + 1000,
    });
  }

  /**
   * Generate test report
   */
  generateReport(testResults: any, format: 'json' | 'markdown' | 'csv' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(testResults, null, 2);
      
      case 'markdown':
        return this.generateMarkdownReport(testResults);
      
      case 'csv':
        return this.generateCSVReport(testResults);
      
      default:
        return JSON.stringify(testResults, null, 2);
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(results: any): string {
    const { summary, results: formulaResults, storageAnalysis } = results;
    
    let markdown = `# Formula Safety Storage Test Report\n\n`;
    markdown += `**Generated:** ${new Date(results.timestamp).toISOString()}\n\n`;
    
    // Summary section
    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${summary.total}\n`;
    markdown += `- **Passed:** ${summary.passed}\n`;
    markdown += `- **Failed:** ${summary.failed}\n`;
    markdown += `- **Success Rate:** ${((summary.passed / summary.total) * 100).toFixed(1)}%\n`;
    markdown += `- **Duration:** ${summary.duration}ms\n\n`;
    
    // Storage analysis section
    if (storageAnalysis) {
      markdown += `## Storage Analysis\n\n`;
      markdown += `- **Overall Health:** ${storageAnalysis.overallHealth}\n`;
      markdown += `- **Safe Formulas:** ${storageAnalysis.safeFormulas}\n`;
      markdown += `- **Warning Formulas:** ${storageAnalysis.warningFormulas}\n`;
      markdown += `- **Unsafe Formulas:** ${storageAnalysis.unsafeFormulas}\n`;
      markdown += `- **Critical Formulas:** ${storageAnalysis.criticalFormulas}\n\n`;
    }
    
    // Detailed results
    markdown += `## Detailed Results\n\n`;
    markdown += `| Formula ID | Formula | Expected | Actual | Status |\n`;
    markdown += `|------------|---------|----------|--------|--------|\n`;
    
    for (const result of formulaResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const formula = result.formula.length > 50 ? 
        result.formula.substring(0, 47) + '...' : 
        result.formula;
      
      markdown += `| ${result.formulaId} | \`${formula}\` | ${result.expected || 'N/A'} | ${result.actual} | ${status} |\n`;
    }
    
    // Recommendations section
    if (storageAnalysis?.summary?.mostCommonIssues?.length > 0) {
      markdown += `\n## Common Issues\n\n`;
      for (const issue of storageAnalysis.summary.mostCommonIssues) {
        markdown += `- **${issue.issue}:** ${issue.count} occurrences\n`;
      }
    }
    
    return markdown;
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(results: any): string {
    const { results: formulaResults } = results;
    
    let csv = 'Formula ID,Formula,Expected,Actual,Status,Timestamp\n';
    
    for (const result of formulaResults) {
      const status = result.passed ? 'PASS' : 'FAIL';
      const formula = `"${result.formula.replace(/"/g, '""')}"`;
      
      csv += `${result.formulaId},${formula},${result.expected || 'N/A'},${result.actual},${status},${result.timestamp}\n`;
    }
    
    return csv;
  }

  /**
   * Emit telemetry event
   */
  async emitTelemetry(testResults: any): Promise<void> {
    const telemetryData = {
      eventType: 'balancer_formula_safety_storage_test',
      data: {
        timestamp: Date.now(),
        summary: testResults.summary,
        storageHealth: testResults.storageAnalysis?.overallHealth,
        totalFormulas: testResults.storageAnalysis?.totalFormulas,
        criticalIssues: testResults.storageAnalysis?.criticalFormulas,
        recommendations: testResults.storageAnalysis?.summary?.riskFactors || [],
      },
    };

    try {
      // Emit telemetry (implementation depends on your telemetry system)
      console.log('Telemetry event:', JSON.stringify(telemetryData, null, 2));
      
      // Store telemetry data
      await PersistenceService.saveData('formula-safety-telemetry', telemetryData);
    } catch (error) {
      console.warn('Failed to emit telemetry:', error);
    }
  }
}

/**
 * CLI interface for formula safety testing
 */
export class FormulaSafetyTestCLI {
  private testSuite: FormulaSafetyStorageTestSuite;

  constructor() {
    this.testSuite = new FormulaSafetyStorageTestSuite();
  }

  /**
   * Run CLI command
   */
  async runCommand(args: string[]): Promise<void> {
    const config = this.parseArgs(args);
    
    try {
      let results;
      
      if (config.formulaId) {
        // Test single formula
        const formula = DEFAULT_TEST_FORMULAS.find(f => f.id === config.formulaId);
        if (!formula) {
          console.error(`Formula "${config.formulaId}" not found`);
          process.exit(1);
        }
        
        results = await this.testSuite.testSingleFormula(formula);
      } else {
        // Run full test suite
        results = await this.testSuite.runTestSuite();
      }
      
      // Generate report
      const report = this.testSuite.generateReport(results, config.outputFormat);
      
      // Save report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `formula-safety-storage-test-${timestamp}.${config.outputFormat}`;
      const outputPath = `test-results/${filename}`;
      
      await this.saveReport(outputPath, report);
      
      // Emit telemetry
      await this.testSuite.emitTelemetry(results);
      
      console.log(`Report saved to: ${outputPath}`);
      
      if (config.verbose) {
        console.log('\nTest Results:');
        console.log(report);
      }
      
    } catch (error) {
      console.error('Test execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Parse CLI arguments
   */
  private parseArgs(args: string[]): FormulaSafetyTestConfig {
    const config: FormulaSafetyTestConfig = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--formula':
          config.formulaId = args[++i];
          break;
        case '--rules':
          config.rules = args[++i].split(',');
          break;
        case '--output':
          config.outputFormat = args[++i] as 'json' | 'markdown' | 'csv';
          break;
        case '--verbose':
          config.verbose = true;
          break;
        case '--recommendations':
          config.includeRecommendations = true;
          break;
        case '--max-complexity':
          config.customThresholds = {
            ...config.customThresholds,
            maxComplexity: args[++i] as 'low' | 'medium' | 'high',
          };
          break;
        case '--max-operations':
          config.customThresholds = {
            ...config.customThresholds,
            maxOperations: parseInt(args[++i]),
          };
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
          break;
        default:
          if (arg.startsWith('--')) {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
          }
      }
    }
    
    return config;
  }

  /**
   * Show help message
   */
  private showHelp(): void {
    console.log(`
Formula Safety Storage Test Suite

Usage: npm run formula-safety-test [options]

Options:
  --formula <id>           Test specific formula by ID
  --rules <rules>          Comma-separated list of rule IDs to apply
  --output <format>        Output format: json, markdown, csv (default: json)
  --verbose                Enable verbose output
  --recommendations        Include recommendations in output
  --max-complexity <level> Set maximum complexity level: low, medium, high
  --max-operations <num>  Set maximum operations threshold
  --help                   Show this help message

Examples:
  npm run formula-safety-test
  npm run formula-safety-test --formula basic-damage --output markdown
  npm run formula-safety-test --verbose --recommendations
  npm run formula-safety-test --max-complexity low --max-operations 500

Available Formulas:
${DEFAULT_TEST_FORMULAS.map(f => `  ${f.id}: ${f.formula}`).join('\n')}
`);
  }

  /**
   * Save report to file
   */
  private async saveReport(path: string, content: string): Promise<void> {
    try {
      await PersistenceService.saveData(path.replace(/^test-results\//, ''), content);
      
      // Also write to filesystem for immediate access
      const fs = await import('fs/promises');
      await fs.writeFile(path, content);
    } catch (error) {
      console.error('Failed to save report:', error);
      throw error;
    }
  }
}

// Export for CLI usage
export const formulaSafetyTestCLI = new FormulaSafetyTestCLI();
