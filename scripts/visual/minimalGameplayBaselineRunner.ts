/**
 * Minimal Gameplay Visual Baseline Runner
 * 
 * CLI script to generate visual baselines for Minimal Gameplay Page.
 * Supports multiple viewports, states, and output formats.
 * 
 * @since NP-MIN-010E – Routing, Tests & Visual Baseline
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs/promises';

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  outputDir: path.resolve(process.env.OUTPUT_DIR || 'test-results/visual-baselines'),
  viewports: [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ],
  visualStates: [
    'initial',
    'jobActive',
    'questSkillCheck',
    'marketPurchase',
    'gameOver',
  ],
  timeout: 30000,
  retries: 2,
};

type VisualState = typeof CONFIG.visualStates[number];
type Viewport = typeof CONFIG.viewports[number];

interface ScreenshotResult {
  viewport: Viewport;
  state: VisualState;
  path: string;
  success: boolean;
  error?: string;
  duration: number;
}

class MinimalGameplayBaselineRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Minimal Gameplay Baseline Runner...');
    
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.context = await this.browser.newContext({
      viewport: CONFIG.viewports[0], // Default to desktop
    });
    
    this.page = await this.context.newPage();
    
    // Setup test hooks
    await this.page.evaluate(() => {
      (window as any).__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
    });
    
    // Disable animations for consistent screenshots
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `,
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up resources...');
    
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    
    console.log('✅ Cleanup completed');
  }

  async navigateToMinimalGameplay(queryParams?: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    const url = `${CONFIG.baseUrl}/minimal-gameplay${queryParams ? `?${queryParams}` : ''}`;
    
    console.log(`📍 Navigating to: ${url}`);
    
    await this.page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout,
    });
    
    // Wait for page to be ready
    await this.page.waitForSelector('[data-testid="minimal-gameplay-page"]', {
      timeout: CONFIG.timeout,
    });
    
    // Wait for visual stability
    await this.page.waitForFunction(() => document.fonts.ready);
    await this.page.waitForTimeout(300);
    
    console.log('✅ Page loaded and ready');
  }

  async setVisualState(state: VisualState): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    console.log(`🎨 Setting visual state to: ${state}`);
    
    await this.page.evaluate((targetState) => {
      (window as any).__MINIMAL_GAMEPLAY_DEBUG__?.setVisualState(targetState);
    }, state);
    
    // Wait for state to update
    await this.page.waitForFunction(
      (expectedState) => {
        const page = document.querySelector('[data-testid="minimal-gameplay-page"]');
        return page?.getAttribute('data-visual-state') === expectedState;
      },
      state,
      { timeout: 5000 }
    );
    
    // Wait for animations to settle
    await this.page.waitForTimeout(300);
    
    console.log(`✅ Visual state set to: ${state}`);
  }

  async setViewport(viewport: Viewport): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');
    
    console.log(`📱 Setting viewport to: ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    await this.context.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    
    // Wait for layout to adjust
    await this.page?.waitForTimeout(200);
    
    console.log(`✅ Viewport set to: ${viewport.name}`);
  }

  async takeScreenshot(viewport: Viewport, state: VisualState): Promise<ScreenshotResult> {
    if (!this.page) throw new Error('Page not initialized');
    
    const startTime = Date.now();
    const filename = `minimal-gameplay-${viewport.name}-${state}.png`;
    const screenshotPath = path.join(CONFIG.outputDir, filename);
    
    console.log(`📸 Capturing screenshot: ${filename}`);
    
    try {
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled',
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ Screenshot captured in ${duration}ms: ${filename}`);
      
      return {
        viewport,
        state,
        path: screenshotPath,
        success: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Failed to capture screenshot: ${filename}`, errorMessage);
      
      return {
        viewport,
        state,
        path: screenshotPath,
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  async generateBaselines(): Promise<ScreenshotResult[]> {
    console.log('🎯 Starting baseline generation...');
    
    const results: ScreenshotResult[] = [];
    const totalScreenshots = CONFIG.viewports.length * CONFIG.visualStates.length;
    let completed = 0;
    
    for (const viewport of CONFIG.viewports) {
      await this.setViewport(viewport);
      
      for (const state of CONFIG.visualStates) {
        completed++;
        console.log(`\n📊 Progress: ${completed}/${totalScreenshots} - ${viewport.name}/${state}`);
        
        // Navigate with state parameter
        await this.navigateToMinimalGameplay(`mgState=${state}`);
        
        // Ensure state is set (double-check)
        await this.setVisualState(state);
        
        // Take screenshot
        const result = await this.takeScreenshot(viewport, state);
        results.push(result);
        
        if (!result.success) {
          console.warn(`⚠️  Screenshot failed for ${viewport.name}/${state}`);
        }
      }
    }
    
    console.log(`\n🎉 Baseline generation completed! ${results.length} screenshots captured.`);
    
    return results;
  }

  async generateReport(results: ScreenshotResult[]): Promise<void> {
    console.log('📋 Generating report...');
    
    const reportPath = path.join(CONFIG.outputDir, 'baseline-report.json');
    const summary = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      },
    };
    
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    
    // Generate markdown report
    const markdownPath = path.join(CONFIG.outputDir, 'baseline-report.md');
    const markdown = this.generateMarkdownReport(summary);
    await fs.writeFile(markdownPath, markdown);
    
    console.log(`📄 Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   MD:   ${markdownPath}`);
  }

  private generateMarkdownReport(summary: any): string {
    const { results, summary: stats } = summary;
    
    let markdown = `# Minimal Gameplay Visual Baseline Report\n\n`;
    markdown += `**Generated:** ${summary.timestamp}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Screenshots:** ${stats.total}\n`;
    markdown += `- **Successful:** ${stats.successful}\n`;
    markdown += `- **Failed:** ${stats.failed}\n`;
    markdown += `- **Success Rate:** ${((stats.successful / stats.total) * 100).toFixed(1)}%\n`;
    markdown += `- **Average Duration:** ${stats.averageDuration.toFixed(0)}ms\n\n`;
    
    markdown += `## Results by Viewport\n\n`;
    
    for (const viewport of CONFIG.viewports) {
      const viewportResults = results.filter(r => r.viewport.name === viewport.name);
      const successful = viewportResults.filter(r => r.success).length;
      
      markdown += `### ${viewport.name} (${viewport.width}x${viewport.height})\n\n`;
      markdown += `- **Screenshots:** ${viewportResults.length}\n`;
      markdown += `- **Successful:** ${successful}\n`;
      markdown += `- **Failed:** ${viewportResults.length - successful}\n\n`;
      
      markdown += `| State | Status | Duration | Path |\n`;
      markdown += `|-------|--------|----------|------|\n`;
      
      for (const result of viewportResults) {
        const status = result.success ? '✅' : '❌';
        const path = path.basename(result.path);
        markdown += `| ${result.state} | ${status} | ${result.duration}ms | ${path} |\n`;
      }
      
      markdown += `\n`;
    }
    
    if (stats.failed > 0) {
      markdown += `## Failed Screenshots\n\n`;
      
      for (const result of results.filter(r => !r.success)) {
        markdown += `### ${result.viewport.name}/${result.state}\n\n`;
        markdown += `**Error:** ${result.error}\n\n`;
      }
    }
    
    return markdown;
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      
      const results = await this.generateBaselines();
      await this.generateReport(results);
      
      const failed = results.filter(r => !r.success).length;
      if (failed > 0) {
        console.warn(`\n⚠️  ${failed} screenshots failed. Check the report for details.`);
        process.exit(1);
      } else {
        console.log('\n🎊 All baselines generated successfully!');
        process.exit(0);
      }
    } catch (error) {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const runner = new MinimalGameplayBaselineRunner();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Minimal Gameplay Visual Baseline Runner

Usage:
  npm run visual:minimal-gameplay                    # Generate all baselines
  npm run visual:minimal-gameplay -- --help         # Show this help

Environment Variables:
  BASE_URL          Base URL of the application (default: http://localhost:5173)
  OUTPUT_DIR        Output directory for screenshots (default: test-results/visual-baselines)
  HEADLESS          Run browser in headless mode (default: true)

Examples:
  BASE_URL=http://localhost:3000 OUTPUT_DIR=./baselines npm run visual:minimal-gameplay
  HEADLESS=false npm run visual:minimal-gameplay
`);
    process.exit(0);
  }
  
  await runner.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MinimalGameplayBaselineRunner };
