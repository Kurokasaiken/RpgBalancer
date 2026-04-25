#!/usr/bin/env tsx

/**
 * IV-DIAG-02 – Character Manager Snapshot Inspector
 * 
 * CLI tool for inspecting and validating Character Manager snapshots.
 * Provides detailed analysis of character data structure, validation,
 * and health checks for the roster persistence layer.
 * 
 * Usage: npx tsx scripts/idleVillage/characterManagerSnapshotInspector.ts [options]
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

interface CharacterSnapshot {
  id: string;
  name: string;
  aiBehavior: string;
  statBlock: {
    hp: number;
    damage: number;
    txc: number;
    evasion: number;
    armor: number;
    critChance: number;
  };
  equippedSpellIds: string[];
  visualProfileId?: string;
  portraitUrl?: string;
  fullFigureUrl?: string;
  portraitCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // ResidentState properties
  status: 'available' | 'assigned' | 'injured' | 'returning';
  fatigue: number;
  currentHp: number;
  maxHp: number;
  isInjured: boolean;
  isHero: boolean;
  survivalCount: number;
  survivalScore: number;
  lastUpdated: number;
}

interface InspectorConfig {
  verbose: boolean;
  validateStructure: boolean;
  checkDuplicates: boolean;
  checkIntegrity: boolean;
  outputPath?: string;
}

interface InspectorResult {
  timestamp: string;
  snapshotPath: string;
  totalCharacters: number;
  validCharacters: number;
  invalidCharacters: number;
  duplicateIds: string[];
  integrityIssues: string[];
  structureErrors: string[];
  performance: {
    readTimeMs: number;
    validationTimeMs: number;
    totalTimeMs: number;
  };
  summary: {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  };
}

class CharacterSnapshotInspector {
  private config: InspectorConfig;
  private startTime: number = performance.now();

  constructor(config: InspectorConfig) {
    this.config = config;
  }

  /**
   * Loads and parses the character snapshot from storage
   */
  private async loadSnapshot(): Promise<CharacterSnapshot[]> {
    const startTime = performance.now();
    
    try {
      // Try to read from the default storage location
      const storagePath = join(process.cwd(), 'data', 'characters.json');
      let snapshotPath = storagePath;
      
      // Check for alternative locations
      const possiblePaths = [
        storagePath,
        join(process.cwd(), 'data', 'idleVillage', 'characters.json'),
        join(process.cwd(), 'data', 'characters.json'),
      ];
      
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          snapshotPath = path;
          break;
        }
      }
      
      if (!existsSync(snapshotPath)) {
        console.error(`Character snapshot not found at any of: ${possiblePaths.join(', ')}`);
        process.exit(1);
      }
      
      const rawContent = readFileSync(snapshotPath, 'utf8');
      const parsed = JSON.parse(rawContent);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid snapshot format: expected array of characters');
      }
      
      const readTime = performance.now() - startTime;
      
      if (this.config.verbose) {
        console.log(`📁 Loaded snapshot from: ${snapshotPath}`);
        console.log(`📊 Raw characters count: ${parsed.length}`);
        console.log(`⏱️  Read time: ${readTime.toFixed(2)}ms`);
      }
      
      return parsed;
    } catch (error) {
      console.error(`Failed to load snapshot: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  /**
   * Validates individual character structure
   */
  private validateCharacter(character: any, index: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!character || typeof character !== 'object') {
      errors.push(`Character ${index}: Not an object`);
      return { isValid: false, errors };
    }
    
    // Required fields
    const requiredFields = ['id', 'name', 'aiBehavior', 'statBlock', 'status', 'lastUpdated'];
    for (const field of requiredFields) {
      if (!(field in character)) {
        errors.push(`Character ${index}: Missing required field '${field}'`);
      }
    }
    
    // Validate ID
    if (character.id && typeof character.id !== 'string') {
      errors.push(`Character ${index}: ID must be string`);
    }
    
    // Validate statBlock
    if (character.statBlock) {
      const requiredStats = ['hp', 'damage', 'txc', 'evasion', 'armor', 'critChance'];
      for (const stat of requiredStats) {
        if (!(stat in character.statBlock) || typeof character.statBlock[stat] !== 'number') {
          errors.push(`Character ${index}: Invalid or missing stat '${stat}'`);
        }
      }
    }
    
    // Validate status
    const validStatuses = ['available', 'assigned', 'injured', 'returning'];
    if (character.status && !validStatuses.includes(character.status)) {
      errors.push(`Character ${index}: Invalid status '${character.status}'`);
    }
    
    // Validate HP consistency
    if (typeof character.currentHp === 'number' && typeof character.maxHp === 'number') {
      if (character.currentHp > character.maxHp) {
        errors.push(`Character ${index}: currentHp (${character.currentHp}) > maxHp (${character.maxHp})`);
      }
      if (character.currentHp < 0) {
        errors.push(`Character ${index}: currentHp cannot be negative`);
      }
    }
    
    // Validate fatigue
    if (typeof character.fatigue === 'number') {
      if (character.fatigue < 0 || character.fatigue > 100) {
        errors.push(`Character ${index}: fatigue should be 0-100, got ${character.fatigue}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks for duplicate character IDs
   */
  private checkDuplicates(characters: CharacterSnapshot[]): string[] {
    const idCounts = new Map<string, number>();
    const duplicates: string[] = [];
    
    characters.forEach(char => {
      if (char.id) {
        const count = idCounts.get(char.id) || 0;
        idCounts.set(char.id, count + 1);
        if (count === 1) {
          duplicates.push(char.id);
        }
      }
    });
    
    return duplicates;
  }

  /**
   * Performs integrity checks on the snapshot
   */
  private checkIntegrity(characters: CharacterSnapshot[]): string[] {
    const issues: string[] = [];
    
    // Check for characters without names
    const unnamedChars = characters.filter(char => !char.name || char.name.trim() === '');
    if (unnamedChars.length > 0) {
      issues.push(`${unnamedChars.length} characters without names`);
    }
    
    // Check for characters with zero or negative stats
    const zeroHpChars = characters.filter(char => char.statBlock?.hp <= 0);
    if (zeroHpChars.length > 0) {
      issues.push(`${zeroHpChars.length} characters with HP <= 0`);
    }
    
    // Check for inconsistent injury flags
    const injuryInconsistencies = characters.filter(char => {
      const hpPercent = char.maxHp > 0 ? char.currentHp / char.maxHp : 0;
      const shouldBeInjured = hpPercent < 0.5;
      return char.isInjured !== shouldBeInjured;
    });
    if (injuryInconsistencies.length > 0) {
      issues.push(`${injuryInconsistencies.length} characters with inconsistent injury flags`);
    }
    
    // Check for outdated timestamps
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const outdatedChars = characters.filter(char => 
      char.lastUpdated && (now - char.lastUpdated) > oneDayMs
    );
    if (outdatedChars.length > 0) {
      issues.push(`${outdatedChars.length} characters not updated in >24h`);
    }
    
    return issues;
  }

  /**
   * Runs the complete inspection
   */
  async inspect(): Promise<InspectorResult> {
    const startTime = performance.now();
    const readStartTime = performance.now();
    
    if (this.config.verbose) {
      console.log('🔍 IV-DIAG-02 – Character Manager Snapshot Inspector');
      console.log('📋 Starting snapshot inspection...\n');
    }
    
    // Load snapshot
    const characters = await this.loadSnapshot();
    const readTime = performance.now() - readStartTime;
    
    const validationStartTime = performance.now();
    const result: InspectorResult = {
      timestamp: new Date().toISOString(),
      snapshotPath: 'data/characters.json', // Simplified for reporting
      totalCharacters: characters.length,
      validCharacters: 0,
      invalidCharacters: 0,
      duplicateIds: [],
      integrityIssues: [],
      structureErrors: [],
      performance: {
        readTimeMs: readTime,
        validationTimeMs: 0,
        totalTimeMs: 0,
      },
      summary: {
        healthy: true,
        issues: [],
        recommendations: [],
      }
    };
    
    // Validate each character
    if (this.config.validateStructure) {
      console.log('🔧 Validating character structure...');
      
      characters.forEach((char, index) => {
        const validation = this.validateCharacter(char, index);
        if (validation.isValid) {
          result.validCharacters++;
        } else {
          result.invalidCharacters++;
          result.structureErrors.push(...validation.errors);
        }
      });
      
      console.log(`✅ Valid characters: ${result.validCharacters}`);
      console.log(`❌ Invalid characters: ${result.invalidCharacters}`);
    }
    
    // Check for duplicates
    if (this.config.checkDuplicates) {
      console.log('🔍 Checking for duplicate IDs...');
      result.duplicateIds = this.checkDuplicates(characters);
      console.log(`🔄 Duplicate IDs: ${result.duplicateIds.length}`);
    }
    
    // Check integrity
    if (this.config.checkIntegrity) {
      console.log('🛡️  Checking data integrity...');
      result.integrityIssues = this.checkIntegrity(characters);
      console.log(`⚠️  Integrity issues: ${result.integrityIssues.length}`);
    }
    
    const validationTime = performance.now() - validationStartTime;
    const totalTime = performance.now() - startTime;
    
    result.performance.validationTimeMs = validationTime;
    result.performance.totalTimeMs = totalTime;
    
    // Generate summary
    result.summary.issues = [
      ...result.structureErrors,
      ...result.duplicateIds.map(id => `Duplicate ID: ${id}`),
      ...result.integrityIssues,
    ];
    
    result.summary.healthy = result.summary.issues.length === 0;
    
    // Generate recommendations
    if (result.invalidCharacters > 0) {
      result.summary.recommendations.push('Fix structural errors in invalid characters');
    }
    if (result.duplicateIds.length > 0) {
      result.summary.recommendations.push('Resolve duplicate character IDs');
    }
    if (result.integrityIssues.length > 0) {
      result.summary.recommendations.push('Address data integrity issues');
    }
    if (characters.length === 0) {
      result.summary.recommendations.push('Create initial character roster');
    }
    
    // Print results
    this.printResults(result);
    
    // Save results if output path specified
    if (this.config.outputPath) {
      await this.saveResults(result);
    }
    
    return result;
  }

  /**
   * Prints inspection results to console
   */
  private printResults(result: InspectorResult): void {
    console.log('\n📊 INSPECTION RESULTS');
    console.log('==================');
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log(`📁 Snapshot: ${result.snapshotPath}`);
    console.log(`👥 Total characters: ${result.totalCharacters}`);
    console.log(`✅ Valid: ${result.validCharacters}`);
    console.log(`❌ Invalid: ${result.invalidCharacters}`);
    console.log(`🔄 Duplicate IDs: ${result.duplicateIds.length}`);
    console.log(`⚠️  Integrity issues: ${result.integrityIssues.length}`);
    
    console.log('\n⏱️  PERFORMANCE');
    console.log('===============');
    console.log(`📖 Read time: ${result.performance.readTimeMs.toFixed(2)}ms`);
    console.log(`🔧 Validation time: ${result.performance.validationTimeMs.toFixed(2)}ms`);
    console.log(`⏳ Total time: ${result.performance.totalTimeMs.toFixed(2)}ms`);
    
    if (result.summary.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND');
      console.log('===============');
      result.summary.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    if (result.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('==================');
      result.summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    console.log('\n🎯 OVERALL HEALTH');
    console.log('================');
    console.log(`${result.summary.healthy ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`);
  }

  /**
   * Saves results to file
   */
  private async saveResults(result: InspectorResult): Promise<void> {
    try {
      const outputPath = resolve(this.config.outputPath!);
      const reportData = {
        ...result,
        inspectorVersion: 'IV-DIAG-02-v1.0.0',
        generatedBy: 'CharacterManagerSnapshotInspector',
      };
      
      // Write JSON report
      const jsonPath = outputPath.replace(/\.[^.]+$/, '') + '.json';
      const fs = await import('fs');
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
      
      // Write markdown report
      const markdownPath = outputPath.replace(/\.[^.]+$/, '') + '.md';
      const markdown = this.generateMarkdownReport(reportData);
      fs.writeFileSync(markdownPath, markdown);
      
      console.log(`\n📄 Reports saved:`);
      console.log(`  📄 JSON: ${jsonPath}`);
      console.log(`  📝 Markdown: ${markdownPath}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error}`);
    }
  }

  /**
   * Generates markdown report
   */
  private generateMarkdownReport(result: InspectorResult & { inspectorVersion: string; generatedBy: string }): string {
    return `# IV-DIAG-02 Character Manager Snapshot Inspector Report

**Generated:** ${result.timestamp}  
**Inspector Version:** ${result.inspectorVersion}  
**Generated By:** ${result.generatedBy}

## Summary

| Metric | Value |
|--------|-------|
| Total Characters | ${result.totalCharacters} |
| Valid Characters | ${result.validCharacters} |
| Invalid Characters | ${result.invalidCharacters} |
| Duplicate IDs | ${result.duplicateIds.length} |
| Integrity Issues | ${result.integrityIssues.length} |
| Overall Health | ${result.summary.healthy ? '✅ Healthy' : '⚠️ Needs Attention'} |

## Performance

- **Read Time:** ${result.performance.readTimeMs.toFixed(2)}ms
- **Validation Time:** ${result.performance.validationTimeMs.toFixed(2)}ms
- **Total Time:** ${result.performance.totalTimeMs.toFixed(2)}ms

## Issues

${result.summary.issues.length > 0 
  ? result.summary.issues.map(issue => `- ${issue}`).join('\n')
  : 'No issues detected.'
}

## Recommendations

${result.summary.recommendations.length > 0
  ? result.summary.recommendations.map(rec => `- ${rec}`).join('\n')
  : 'No recommendations at this time.'
}

## Detailed Data

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
`;
  }
}

// CLI interface
async function main() {
  console.log('🔍 IV-DIAG-02 – Character Manager Snapshot Inspector');
  console.log('📋 Starting snapshot inspection...\n');
  
  const args = process.argv.slice(2);
  const config: InspectorConfig = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    validateStructure: !args.includes('--no-validate'),
    checkDuplicates: !args.includes('--no-duplicates'),
    checkIntegrity: !args.includes('--no-integrity'),
    outputPath: args.find(arg => arg.startsWith('--output='))?.split('=')[1],
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
IV-DIAG-02 – Character Manager Snapshot Inspector

USAGE:
  node --import tsx/esm scripts/idleVillage/characterManagerSnapshotInspector.ts [options]

OPTIONS:
  -v, --verbose          Enable verbose output
  --no-validate          Skip structure validation
  --no-duplicates        Skip duplicate ID checking
  --no-integrity         Skip integrity checks
  --output=<path>        Save report to specified path
  -h, --help             Show this help message

EXAMPLES:
  node --import tsx/esm scripts/idleVillage/characterManagerSnapshotInspector.ts
  node --import tsx/esm scripts/idleVillage/characterManagerSnapshotInspector.ts --verbose
  node --import tsx/esm scripts/idleVillage/characterManagerSnapshotInspector.ts --output=report
    `);
    return;
  }

  try {
    const inspector = new CharacterSnapshotInspector(config);
    const result = await inspector.inspect();
    
    // Exit with error code if unhealthy
    process.exit(result.summary.healthy ? 0 : 1);
  } catch (error) {
    console.error('❌ Inspection failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { CharacterSnapshotInspector, type InspectorConfig, type InspectorResult };
