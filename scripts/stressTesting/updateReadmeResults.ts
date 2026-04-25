#!/usr/bin/env node

/**
 * Update README with Stress Testing Results
 * 
 * Script to update README.md with latest stress testing results
 * from CI aggregated reports.
 * 
 * @module updateReadmeResults
 * @since 2026-01-11
 * @author Hermes-CI
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';

interface SummaryData {
  timestamp: string;
  config: {
    iterations: number;
    seed: number;
    environment: string;
  };
  results: {
    archetypesGenerated: number;
    simulationsRun: number;
    pairsAnalyzed: number;
    topSynergies: number;
    topWeaknesses: number;
  };
  duration: number;
  cacheHit: boolean;
}

/**
 * Generate stress testing results section
 */
function generateResultsSection(data: SummaryData): string {
  const date = new Date(data.timestamp).toLocaleDateString();
  const duration = (data.duration / 1000).toFixed(1);
  
  return `## 🧪 Stress Testing Results

**Last Updated:** ${date}  
**Environment:** ${data.environment}  
**Configuration:** ${data.iterations.toLocaleString()} iterations, seed ${data.seed}

### 📊 Latest Results

| Metric | Value |
|--------|-------|
| **Archetypes Generated** | ${data.results.archetypesGenerated.toLocaleString()} |
| **Simulations Run** | ${data.results.simulationsRun.toLocaleString()} |
| **Pairs Analyzed** | ${data.results.pairsAnalyzed.toLocaleString()} |
| **Top Synergies** | ${data.results.topSynergies} |
| **Top Weaknesses** | ${data.results.topWeaknesses} |
| **Duration** | ${duration}s |
| **Cache Hit** | ${data.cacheHit ? '✅ Yes' : '❌ No'} |

### 🔍 Key Insights

- **Synergy Detection:** ${data.results.topSynergies} stat pairs show strong synergy (>1.15x multiplier)
- **Weakness Detection:** ${data.results.topWeaknesses} stat pairs show weak synergy (<0.95x multiplier)
- **Performance:** ${(data.results.simulationsRun / data.duration * 1000).toFixed(0)} simulations/second
- **Coverage:** ${((data.results.topSynergies + data.results.topWeaknesses) / data.results.pairsAnalyzed * 100).toFixed(1)}% of pairs show significant deviation

### 📈 Historical Data

Historical stress testing results are tracked in the \`docs/stress-testing-results.md\` file.

### 🚀 Running Stress Tests

To run stress testing locally:

\`\`\`bash
# Run with default configuration
npm run stress:test

# Run with custom parameters
npm run stress:test -- --iterations 50000 --seed 123

# Run CI suite
npm run ci:stress-suite
\`\`\`

### 📁 Results Data

All stress testing results are stored in \`data/stressTesting/\` with the following structure:

- \`ci/\` - CI run results
- \`cache/\` - Cached results for performance
- \`reports/\` - Generated reports and summaries
- \`aggregated/\` - Historical aggregated data

---

*Results automatically updated by CI Stress Testing Suite*
`;
}

/**
 * Update README with stress testing results
 */
async function updateReadme(inputFile: string, outputFile: string): Promise<void> {
  console.log('📝 Updating README with stress testing results...');
  
  try {
    // Read summary data
    const summaryData = JSON.parse(await readFile(inputFile, 'utf8')) as SummaryData;
    
    // Read current README
    const readmeContent = await readFile('README.md', 'utf8');
    
    // Find stress testing section
    const stressTestStart = readmeContent.indexOf('## 🧪 Stress Testing Results');
    const nextSectionStart = readmeContent.indexOf('\n## ', stressTestStart + 1);
    
    let updatedReadme: string;
    
    if (stressTestStart !== -1 && nextSectionStart !== -1) {
      // Replace existing section
      const before = readmeContent.substring(0, stressTestStart);
      const after = readmeContent.substring(nextSectionStart);
      const newSection = generateResultsSection(summaryData);
      
      updatedReadme = before + newSection + after;
    } else {
      // Add new section at end
      const newSection = generateResultsSection(summaryData);
      updatedReadme = readmeContent + '\n\n' + newSection;
    }
    
    // Write updated README
    await writeFile(outputFile, updatedReadme);
    
    console.log('✅ README updated successfully!');
    console.log(`📊 Results from: ${summaryData.timestamp}`);
    console.log(`📋 ${summaryData.results.pairsAnalyzed} pairs analyzed`);
    console.log(`⚡ ${summaryData.results.topSynergies} synergies found`);
    
  } catch (error) {
    console.error('❌ Failed to update README:', error);
    throw error;
  }
}

/**
 * Main CLI command
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('update-readme-results')
    .description('Update README with stress testing results')
    .option('-i, --input <path>', 'Input summary JSON file', './data/stressTesting/aggregated/summary.json')
    .option('-o, --output <path>', 'Output README file', './README.md')
    .action(async (options) => {
      try {
        await updateReadme(options.input, options.output);
        console.log('✅ README update completed successfully!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Failed to update README:', error);
        process.exit(1);
      }
    });
  
  await program.parseAsync();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
