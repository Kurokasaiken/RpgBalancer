#!/usr/bin/env tsx
/**
 * Mobile Playtest Stress Harness – NP-262
 * Executes 100 simulated sessions with random tap/scroll actions
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface StressConfig {
  sessions: number;
  actionsPerSession: number;
  baseUrl: string;
  outputDir: string;
}

export const DEFAULT_CONFIG: StressConfig = {
  sessions: 100,
  actionsPerSession: 20,
  baseUrl: 'http://localhost:5173',
  outputDir: 'test-results/stress-harness',
};

export class MobileStressHarness {
  private config: StressConfig;
  private results: any[] = [];

  constructor(config: Partial<StressConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async run(): Promise<void> {
    console.log(`\n🔥 Running ${this.config.sessions} stress sessions\n`);
    mkdirSync(this.config.outputDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });

    try {
      for (let i = 0; i < this.config.sessions; i++) {
        const context = await browser.newContext({
          viewport: { width: 375, height: 667 },
          isMobile: true,
          hasTouch: true,
        });
        
        const page = await context.newPage();
        const startTime = Date.now();
        const actions: any[] = [];
        const errors: string[] = [];

        try {
          await page.goto(this.config.baseUrl);

          for (let j = 0; j < this.config.actionsPerSession; j++) {
            const action = Math.random() > 0.5 ? 'tap' : 'scroll';
            
            try {
              if (action === 'tap') {
                await page.mouse.click(
                  Math.random() * 300 + 50,
                  Math.random() * 600 + 50
                );
              } else {
                await page.mouse.wheel(0, Math.random() * 400 - 200);
              }
              actions.push({ type: action, success: true });
            } catch (error) {
              actions.push({ type: action, success: false });
              errors.push(String(error));
            }

            await page.waitForTimeout(Math.random() * 500 + 100);
          }
        } catch (error) {
          errors.push(String(error));
        }

        this.results.push({
          sessionId: `session_${i + 1}`,
          duration: Date.now() - startTime,
          actions: actions.length,
          errors: errors.length,
        });

        await context.close();

        if ((i + 1) % 10 === 0) {
          console.log(`✓ Completed ${i + 1}/${this.config.sessions}`);
        }
      }

      this.generateReport();
    } finally {
      await browser.close();
    }
  }

  private generateReport(): void {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const jsonPath = join(this.config.outputDir, `report-${timestamp}.json`);
    
    const summary = {
      totalSessions: this.results.length,
      totalActions: this.results.reduce((s, r) => s + r.actions, 0),
      totalErrors: this.results.reduce((s, r) => s + r.errors, 0),
      avgDuration: this.results.reduce((s, r) => s + r.duration, 0) / this.results.length,
    };

    writeFileSync(jsonPath, JSON.stringify({ summary, results: this.results }, null, 2));
    console.log(`\n📄 Report: ${jsonPath}\n`);
  }
}

if (require.main === module) {
  new MobileStressHarness().run().catch(console.error);
}
