#!/usr/bin/env node

/**
 * Balancer Formula Safety Lint CLI
 * 
 * Command-line interface for analyzing Balancer formulas with comprehensive
 * safety checks, cycle detection, and range analysis.
 * 
 * @module formulaSafetyLint
 * @since 2026-01-20
 * @author Guardian-Balancer – Formula Safety
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { 
  FormulaSafetyLint, 
  FormulaLintConfig, 
  FormulaLintResults,
  FormulaLintResult,
  defaultFormulaLint,
  lintFormulas,
  type FormulaContext 
} from '../../src/balancing/config/FormulaSafetyLint.js';

/**
 * CLI options schema
 */
const CliOptionsSchema = z.object({
  input: z.string().optional(),
  output: z.string().optional(),
  format: z.enum(['json', 'markdown', 'summary']).default('json'),
  config: z.string().optional(),
  rules: z.array(z.string()).optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  maxOperations: z.number().optional(),
  timeout: z.number().optional(),
  verbose: z.boolean().default(false),
  quiet: z.boolean().default(false),
});

type CliOptions = z.infer<typeof CliOptionsSchema>;

/**
 * Formula input formats
 */
interface FormulaInput {
  /** Formula identifier */
  id: string;
  /** Formula expression */
  formula: string;
  /** Formula description */
  description?: string;
  /** Stat context */
  context?: Partial<FormulaContext>;
}

/**
 * Balancer preset structure
 */
interface BalancerPreset {
  id: string;
  name: string;
  cards: Array<{
    id: string;
    name: string;
    derivedStats?: Record<string, {
      formula: string;
      description?: string;
    }>;
  }>;
}

/**
 * Formula Safety Lint CLI
 */
class FormulaSafetyLintCLI {
  private options: CliOptions;
  private lintSuite: FormulaSafetyLint;

  constructor(options: CliOptions) {
    this.options = options;
    this.lintSuite = new FormulaSafetyLint();
    this.applyConfiguration();
  }

  /**
   * Apply CLI configuration to lint suite
   */
  private applyConfiguration(): void {
    const config: Partial<FormulaLintConfig> = {};

    if (this.options.rules) {
      config.enabledRules = this.options.rules;
    }

    if (this.options.severity) {
      config.severityOverrides = {};
      // Apply severity override to all enabled rules
      this.lintSuite.getRules().forEach(rule => {
        if (this.options.rules?.includes(rule.id)) {
          config.severityOverrides![rule.id] = this.options.severity!;
        }
      });
    }

    if (this.options.maxOperations) {
      config.maxOperations = this.options.maxOperations;
    }

    if (this.options.timeout) {
      config.timeout = this.options.timeout;
    }

    if (Object.keys(config).length > 0) {
      this.lintSuite.updateConfig(config);
    }
  }

  /**
   * Load formulas from file
   */
  private async loadFormulas(filePath: string): Promise<{ formulas: string[]; context: FormulaContext }> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Handle different input formats
      if (this.isBalancerPreset(data)) {
        return this.extractFromPreset(data);
      } else if (this.isFormulaList(data)) {
        return this.extractFromList(data);
      } else {
        throw new Error('Unsupported input format');
      }
    } catch (error) {
      console.error(`Error loading formulas from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if data is a Balancer preset
   */
  private isBalancerPreset(data: any): data is BalancerPreset {
    return data && typeof data === 'object' && 'id' in data && 'cards' in data && Array.isArray(data.cards);
  }

  /**
   * Check if data is a formula list
   */
  private isFormulaList(data: any): data is { formulas: FormulaInput[]; stats: Record<string, { min: number; max: number; current: number }> } {
    return data && typeof data === 'object' && 'formulas' in data && Array.isArray(data.formulas);
  }

  /**
   * Extract formulas from Balancer preset
   */
  private extractFromPreset(preset: BalancerPreset): { formulas: string[]; context: FormulaContext } {
    const formulas: string[] = [];
    const stats: Record<string, { min: number; max: number; current: number }> = {};

    // Extract derived stats from cards
    preset.cards.forEach(card => {
      if (card.derivedStats) {
        Object.entries(card.derivedStats).forEach(([statName, statConfig]) => {
          formulas.push(statConfig.formula);
          // Add basic stat context (would be enhanced with real data)
          stats[statName] = {
            min: 0,
            max: 100,
            current: 50,
          };
        });
      }
    });

    return {
      formulas,
      context: {
        stats,
        maxOperations: this.options.maxOperations || 1000,
        allowNegative: false,
      },
    };
  }

  /**
   * Extract formulas from formula list
   */
  private extractFromList(data: { formulas: FormulaInput[]; stats: Record<string, { min: number; max: number; current: number }> }): { formulas: string[]; context: FormulaContext } {
    const formulas = data.formulas.map(f => f.formula);
    
    return {
      formulas,
      context: {
        stats: data.stats,
        maxOperations: this.options.maxOperations || 1000,
        allowNegative: false,
      },
    };
  }

  /**
   * Run the lint analysis
   */
  async run(): Promise<void> {
    try {
      // Load formulas
      let formulas: string[] = [];
      let context: FormulaContext;

      if (this.options.input) {
        const loaded = await this.loadFormulas(this.options.input);
        formulas = loaded.formulas;
        context = loaded.context;
      } else {
        // Use sample formulas for demonstration
        formulas = this.getSampleFormulas();
        context = this.getSampleContext();
      }

      if (formulas.length === 0) {
        console.log('No formulas to analyze');
        return;
      }

      if (!this.options.quiet) {
        console.log(`Analyzing ${formulas.length} formulas...`);
      }

      // Run lint analysis
      const results = await this.lintSuite.lintFormulas(formulas, context);

      // Output results
      await this.outputResults(results);

      if (!this.options.quiet) {
        this.printSummary(results);
      }

      // Set exit code based on results
      if (results.status === 'critical' || results.status === 'error') {
        process.exit(1);
      } else if (results.status === 'warning') {
        process.exit(2);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Output results in specified format
   */
  private async outputResults(results: FormulaLintResults): Promise<void> {
    switch (this.options.format) {
      case 'json':
        await this.outputJSON(results);
        break;
      case 'markdown':
        await this.outputMarkdown(results);
        break;
      case 'summary':
        await this.outputSummary(results);
        break;
    }
  }

  /**
   * Output JSON format
   */
  private async outputJSON(results: FormulaLintResults): Promise<void> {
    const output = JSON.stringify(results, null, 2);
    
    if (this.options.output) {
      await writeFile(this.options.output, output, 'utf-8');
      if (!this.options.quiet) {
        console.log(`Results written to ${this.options.output}`);
      }
    } else {
      console.log(output);
    }
  }

  /**
   * Output Markdown format
   */
  private async outputMarkdown(results: FormulaLintResults): Promise<void> {
    const markdown = this.generateMarkdownReport(results);
    
    if (this.options.output) {
      await writeFile(this.options.output, markdown, 'utf-8');
      if (!this.options.quiet) {
        console.log(`Report written to ${this.options.output}`);
      }
    } else {
      console.log(markdown);
    }
  }

  /**
   * Output summary format
   */
  private async outputSummary(results: FormulaLintResults): Promise<void> {
    const summary = this.generateSummaryReport(results);
    
    if (this.options.output) {
      await writeFile(this.options.output, summary, 'utf-8');
      if (!this.options.quiet) {
        console.log(`Summary written to ${this.options.output}`);
      }
    } else {
      console.log(summary);
    }
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(results: FormulaLintResults): string {
    const lines: string[] = [];
    
    lines.push('# Balancer Formula Safety Lint Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Status:** ${results.status.toUpperCase()}`);
    lines.push(`**Total Formulas:** ${results.totalFormulas}`);
    lines.push(`**Processing Time:** ${results.totalProcessingTime}ms`);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Status | Count |');
    lines.push('|--------|-------|');
    lines.push(`| ✅ Pass | ${results.summary.pass} |`);
    lines.push(`| ⚠️ Warning | ${results.summary.warning} |`);
    lines.push(`| ❌ Error | ${results.summary.error} |`);
    lines.push(`| 🚨 Critical | ${results.summary.critical} |`);
    lines.push('');

    // Triggered rules
    if (Object.keys(results.triggeredRules).length > 0) {
      lines.push('## Triggered Rules');
      lines.push('');
      lines.push('| Rule | Count |');
      lines.push('|------|-------|');
      Object.entries(results.triggeredRules)
        .sort(([,a], [,b]) => b - a)
        .forEach(([rule, count]) => {
          lines.push(`| ${rule} | ${count} |`);
        });
      lines.push('');
    }

    // Detailed results
    lines.push('## Detailed Results');
    lines.push('');

    results.results.forEach((result, index) => {
      lines.push(`### ${index + 1}. ${result.formula}`);
      lines.push('');
      lines.push(`**Status:** ${result.status.toUpperCase()}`);
      lines.push(`**Processing Time:** ${result.processingTime}ms`);
      lines.push('');

      if (result.warnings.length > 0) {
        lines.push('**Warnings:**');
        lines.push('');
        result.warnings.forEach(warning => {
          lines.push(`- **${warning.severity.toUpperCase()}** [${warning.ruleId}]: ${warning.message}`);
          if (warning.suggestion) {
            lines.push(`  - 💡 *Suggestion:* ${warning.suggestion}`);
          }
        });
        lines.push('');
      } else {
        lines.push('✅ No warnings detected');
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * Generate summary report
   */
  private generateSummaryReport(results: FormulaLintResults): string {
    const lines: string[] = [];
    
    lines.push('Balancer Formula Safety Lint Summary');
    lines.push('=====================================');
    lines.push('');
    lines.push(`Status: ${results.status.toUpperCase()}`);
    lines.push(`Formulas: ${results.totalFormulas}`);
    lines.push(`Processing: ${results.totalProcessingTime}ms`);
    lines.push('');
    
    lines.push('Results:');
    lines.push(`  Pass:     ${results.summary.pass}`);
    lines.push(`  Warning:  ${results.summary.warning}`);
    lines.push(`  Error:    ${results.summary.error}`);
    lines.push(`  Critical: ${results.summary.critical}`);
    lines.push('');

    if (Object.keys(results.triggeredRules).length > 0) {
      lines.push('Triggered Rules:');
      Object.entries(results.triggeredRules)
        .sort(([,a], [,b]) => b - a)
        .forEach(([rule, count]) => {
          lines.push(`  ${rule}: ${count}`);
        });
      lines.push('');
    }

    // Show problematic formulas
    const problematicResults = results.results.filter(r => r.status !== 'pass');
    if (problematicResults.length > 0) {
      lines.push('Problematic Formulas:');
      problematicResults.forEach(result => {
        lines.push(`  [${result.status.toUpperCase()}] ${result.formula}`);
        if (result.warnings.length > 0) {
          result.warnings.slice(0, 3).forEach(warning => {
            lines.push(`    - ${warning.message}`);
          });
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * Print summary to console
   */
  private printSummary(results: FormulaLintResults): void {
    console.log('\n📊 Analysis Summary:');
    console.log(`   Status: ${results.status.toUpperCase()}`);
    console.log(`   Formulas: ${results.totalFormulas}`);
    console.log(`   Processing: ${results.totalProcessingTime}ms`);
    console.log('');
    console.log('   Results:');
    console.log(`     ✅ Pass:     ${results.summary.pass}`);
    console.log(`     ⚠️ Warning:  ${results.summary.warning}`);
    console.log(`     ❌ Error:    ${results.summary.error}`);
    console.log(`     🚨 Critical: ${results.summary.critical}`);
  }

  /**
   * Get sample formulas for demonstration
   */
  private getSampleFormulas(): string[] {
    return [
      'hp + damage * 2',
      'max(hp - damage, 0)',
      'damage / max(hp, 1)',
      '(hp + damage) * efficiency',
      'sqrt(hp * damage)',
      'min(hp, damage) * 1.5',
      'max(0, hp - damage / armor)',
      'damage + (hp * 0.1)',
      '(hp + damage + armor) / 3',
      'pow(damage, 2) / max(hp, 1)',
    ];
  }

  /**
   * Get sample context for demonstration
   */
  private getSampleContext(): FormulaContext {
    return {
      stats: {
        hp: { min: 0, max: 100, current: 50 },
        damage: { min: 0, max: 50, current: 25 },
        armor: { min: 0, max: 20, current: 10 },
        efficiency: { min: 0.5, max: 2.0, current: 1.0 },
      },
      maxOperations: 1000,
      allowNegative: false,
    };
  }
}

/**
 * CLI setup and execution
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('formula-safety-lint')
    .description('Balancer Formula Safety Lint - Analyze formulas for safety issues')
    .version('1.0.0');

  program
    .option('-i, --input <path>', 'Input file with formulas (JSON format)')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format (json, markdown, summary)', 'json')
    .option('-c, --config <path>', 'Configuration file path')
    .option('-r, --rules <rules...>', 'Enable specific rules only')
    .option('-s, --severity <severity>', 'Minimum severity level (info, warning, error, critical)')
    .option('--max-operations <number>', 'Maximum operations threshold')
    .option('--timeout <number>', 'Analysis timeout in milliseconds')
    .option('-v, --verbose', 'Verbose output')
    .option('-q, --quiet', 'Quiet mode (minimal output)')
    .action(async (options) => {
      try {
        const parsedOptions = CliOptionsSchema.parse(options);
        const cli = new FormulaSafetyLintCLI(parsedOptions);
        await cli.run();
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Execute CLI if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FormulaSafetyLintCLI };
