#!/usr/bin/env tsx

/**
 * Renderer Stack Data Extraction and Comparison Utility
 * 
 * This script extracts renderer stack data from both /test and /minimal-gameplay pages
 * and performs a field-by-field comparison to identify the first divergence point.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface RendererStackData {
  page: 'test' | 'minimal-gameplay';
  timestamp: number;
  stackData: Array<{
    component: string;
    timestamp: number;
    page: string;
    // Component-specific data will be added dynamically
  }>;
}

interface ComparisonResult {
  component: string;
  field: string;
  path: string;
  testValue: any;
  minimalGameplayValue: any;
  isEqual: boolean;
}

class RendererStackExtractor {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async loadResidentsIfNeeded(page: Page): Promise<void> {
    // Check if residents are already loaded
    const hasResidents = await page.locator('[data-testid="pg-card"]').count().then(count => count > 0);
    
    if (hasResidents) {
      console.log('   Residents already loaded');
      return;
    }
    
    console.log('   Loading residents via localStorage...');
    
    // Seed fallback residents directly via localStorage
    await page.evaluate(() => {
      const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
      const FALLBACK_RESIDENTS = [
        {
          id: 'worker-1',
          displayName: 'Aldric',
          currentHp: 100,
          maxHp: 100,
          fatigue: 0,
          statSnapshot: { strength: 15, agility: 12, intelligence: 10 }
        },
        {
          id: 'worker-2', 
          displayName: 'Brenna',
          currentHp: 85,
          maxHp: 100,
          fatigue: 15,
          statSnapshot: { strength: 12, agility: 15, intelligence: 13 }
        },
        {
          id: 'worker-3',
          displayName: 'Caelan',
          currentHp: 95,
          maxHp: 100,
          fatigue: 5,
          statSnapshot: { strength: 14, agility: 11, intelligence: 12 }
        }
      ];
      
      localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(FALLBACK_RESIDENTS));
      window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
    });
    
    console.log('   Residents seeded, waiting for page to update...');
    await page.waitForTimeout(2000);
  }

  private async extractDataFromPage(pagePath: string): Promise<RendererStackData> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Load residents first if needed
      await this.loadResidentsIfNeeded(page);
      
      // Navigate to the target page
      await page.goto(`http://localhost:5173${pagePath}`);
      
      // Wait for the page to load completely
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for residents to load (check for pg-card elements)
      console.log(`   Waiting for residents to load on ${pagePath}...`);
      await page.waitForSelector('[data-testid="pg-card"]', { timeout: 15000 });
      
      // Wait a bit more for instrumentation to capture data
      await page.waitForTimeout(3000);
      
      // Check if renderer stack data is available and has components
      const hasData = await page.evaluate(() => {
        const data = (window as any).__RENDERER_STACK_DATA__;
        return data && data.stackData && data.stackData.length > 0;
      });

      if (!hasData) {
        // Try to trigger manual instrumentation
        console.log(`   No data found, attempting manual instrumentation on ${pagePath}...`);
        await page.evaluate(() => {
          // Expose fresh data
          if ((window as any).rendererStackInstrumentation) {
            (window as any).rendererStackInstrumentation.exposeRendererStackData();
          }
        });
        
        // Wait again for data to be available
        await page.waitForTimeout(2000);
      }

      // Extract the data
      const data = await page.evaluate(() => {
        return (window as any).__RENDERER_STACK_DATA__;
      });

      if (!data || !data.stackData || data.stackData.length === 0) {
        throw new Error(`No renderer stack data found on ${pagePath}. Make sure residents are loaded.`);
      }

      console.log(`✅ Extracted data from ${pagePath}`);
      console.log(`   Components: ${data.stackData.length}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      
      return data;
    } finally {
      await page.close();
    }
  }

  private compareDeep(value1: any, value2: any, path: string = ''): ComparisonResult[] {
    const results: ComparisonResult[] = [];

    // Handle null/undefined cases
    if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
      results.push({
        component: path.split('.')[0] || 'unknown',
        field: path,
        path,
        testValue: value1,
        minimalGameplayValue: value2,
        isEqual: value1 === value2
      });
      return results;
    }

    // Handle primitive values
    if (typeof value1 !== 'object' || typeof value2 !== 'object') {
      results.push({
        component: path.split('.')[0] || 'unknown',
        field: path,
        path,
        testValue: value1,
        minimalGameplayValue: value2,
        isEqual: value1 === value2
      });
      return results;
    }

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      const maxLength = Math.max(value1.length, value2.length);
      for (let i = 0; i < maxLength; i++) {
        const nestedResults = this.compareDeep(
          value1[i], 
          value2[i], 
          `${path}[${i}]`
        );
        results.push(...nestedResults);
      }
      return results;
    }

    // Handle objects
    const keys = new Set([...Object.keys(value1), ...Object.keys(value2)]);
    for (const key of keys) {
      const nestedResults = this.compareDeep(
        value1[key], 
        value2[key], 
        path ? `${path}.${key}` : key
      );
      results.push(...nestedResults);
    }

    return results;
  }

  private findFirstDivergence(results: ComparisonResult[]): ComparisonResult | null {
    for (const result of results) {
      if (!result.isEqual) {
        return result;
      }
    }
    return null;
  }

  async extractAndCompare(): Promise<void> {
    console.log('🔍 Starting renderer stack data extraction and comparison...\n');

    try {
      // Extract data from both pages
      console.log('1. Extracting data from /test page...');
      const testData = await this.extractDataFromPage('/test');
      
      console.log('\n2. Extracting data from /minimal-gameplay page...');
      const minimalGameData = await this.extractDataFromPage('/minimal-gameplay');

      // Save raw data
      const outputDir = join(process.cwd(), 'test-results');
      mkdirSync(outputDir, { recursive: true });

      const timestamp = new Date().toISOString().split('T')[0];
      
      writeFileSync(
        join(outputDir, `renderer-stack-test-${timestamp}.json`),
        JSON.stringify(testData, null, 2)
      );
      
      writeFileSync(
        join(outputDir, `renderer-stack-minimal-gameplay-${timestamp}.json`),
        JSON.stringify(minimalGameData, null, 2)
      );

      console.log('\n3. Comparing data...');
      
      // Compare the data
      const allResults: ComparisonResult[] = [];
      
      // Compare each component's data
      for (let i = 0; i < Math.max(testData.stackData.length, minimalGameData.stackData.length); i++) {
        const testComponent = testData.stackData[i];
        const minimalComponent = minimalGameData.stackData[i];
        
        if (testComponent && minimalComponent) {
          console.log(`   Comparing ${testComponent.component}...`);
          const componentResults = this.compareDeep(
            testComponent,
            minimalComponent,
            testComponent.component
          );
          allResults.push(...componentResults);
        } else if (testComponent && !minimalComponent) {
          console.log(`   ⚠️  Component ${testComponent.component} exists only in /test`);
        } else if (!testComponent && minimalComponent) {
          console.log(`   ⚠️  Component ${minimalComponent.component} exists only in /minimal-gameplay`);
        }
      }

      // Find the first divergence
      const firstDivergence = this.findFirstDivergence(allResults);

      // Generate comparison report
      const report = {
        summary: {
          testPage: {
            componentCount: testData.stackData.length,
            timestamp: testData.timestamp
          },
          minimalGameplayPage: {
            componentCount: minimalGameData.stackData.length,
            timestamp: minimalGameData.timestamp
          },
          totalComparisons: allResults.length,
          divergences: allResults.filter(r => !r.isEqual).length
        },
        firstDivergence: firstDivergence ? {
          component: firstDivergence.component,
          field: firstDivergence.field,
          path: firstDivergence.path,
          testValue: firstDivergence.testValue,
          minimalGameplayValue: firstDivergence.minimalGameplayValue,
          isEqual: false
        } : null,
        allDivergences: allResults.filter(r => !r.isEqual)
      };

      // Save comparison report
      writeFileSync(
        join(outputDir, `renderer-stack-comparison-${timestamp}.json`),
        JSON.stringify(report, null, 2)
      );

      // Print results
      console.log('\n📊 Comparison Results:');
      console.log(`   Total comparisons: ${report.summary.totalComparisons}`);
      console.log(`   Divergences found: ${report.summary.divergences}`);

      if (firstDivergence) {
        console.log('\n🎯 FIRST DIVERGENCE IDENTIFIED:');
        console.log(`   Component: ${firstDivergence.component}`);
        console.log(`   Field: ${firstDivergence.field}`);
        console.log(`   Path: ${firstDivergence.path}`);
        console.log(`   /test value: ${JSON.stringify(firstDivergence.testValue)}`);
        console.log(`   /minimal-gameplay value: ${JSON.stringify(firstDivergence.minimalGameplayValue)}`);
        console.log(`   Equal: ${firstDivergence.isEqual}`);
      } else {
        console.log('\n✅ No divergences found - renderer stacks are identical');
      }

      // Save detailed log
      const logContent = this.generateLogReport(testData, minimalGameData, report);
      writeFileSync(
        join(outputDir, `renderer-divergence-analysis-${timestamp}.log`),
        logContent
      );

      console.log(`\n📁 Results saved to test-results/`);
      console.log(`   - renderer-stack-test-${timestamp}.json`);
      console.log(`   - renderer-stack-minimal-gameplay-${timestamp}.json`);
      console.log(`   - renderer-stack-comparison-${timestamp}.json`);
      console.log(`   - renderer-divergence-analysis-${timestamp}.log`);

    } catch (error) {
      console.error('❌ Error during extraction/comparison:', error);
      throw error;
    }
  }

  private generateLogReport(testData: RendererStackData, minimalGameData: RendererStackData, report: any): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `# RENDERER-DIVERGENCE-ANALYSIS-001 - Renderer Stack Divergence Analysis
## Evidence Log - ${timestamp}

### Status: COMPLETATO

### Objective
Isolate the first exact divergence point inside the renderer stack between \`/test\` and \`/minimal-gameplay\` for the roster system.

### Instrumentation Points Used
1. **VillageRosterSection** - Captured before render with input residents
2. **ResidentRosterPanel** - Captured on received props  
3. **DragTestContainer** - Captured on passed resident data and processed results
4. **PgCard** - Captured final card props and displayed values

### Renderer-Level Data Exported

#### From /test Page
- Components: ${testData.stackData.length}
- Timestamp: ${testData.timestamp}
- Data: renderer-stack-test-${timestamp}.json

#### From /minimal-gameplay Page  
- Components: ${minimalGameData.stackData.length}
- Timestamp: ${minimalGameData.timestamp}
- Data: renderer-stack-minimal-gameplay-${timestamp}.json

### Field-by-Field Comparison
- Total comparisons: ${report.summary.totalComparisons}
- Divergences found: ${report.summary.divergences}
- Comparison data: renderer-stack-comparison-${timestamp}.json

### First Exact Divergence Point
${report.firstDivergence ? `
**Component**: ${report.firstDivergence.component}
**Field**: ${report.firstDivergence.field}  
**Path**: ${report.firstDivergence.path}
**Value in /test**: ${JSON.stringify(report.firstDivergence.testValue)}
**Value in /minimal-gameplay**: ${JSON.stringify(report.firstDivergence.minimalGameplayValue)}
**Equal**: ${report.firstDivergence.isEqual}
` : 'No divergences found - renderer stacks are identical'}

### Notes
- Instrumentation was already in place in all target components
- Data extraction performed via Playwright browser automation
- Comparison performed using deep field-by-field analysis
- No fixes applied - analysis-only task as required

### Files Generated
- renderer-stack-test-${timestamp}.json
- renderer-stack-minimal-gameplay-${timestamp}.json  
- renderer-stack-comparison-${timestamp}.json
- renderer-divergence-analysis-${timestamp}.log

### Explicit Statement
No fix was applied. This was an analysis-only task to identify the exact divergence point.
`;
  }
}

// Main execution
async function main() {
  const extractor = new RendererStackExtractor();
  
  try {
    await extractor.init();
    await extractor.extractAndCompare();
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    process.exit(1);
  } finally {
    await extractor.close();
  }
}

// Run if executed directly
main().catch(console.error);

export { RendererStackExtractor };
