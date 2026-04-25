#!/usr/bin/env tsx

/**
 * Guardian Deployment Health Check Script
 * 
 * Performs comprehensive health checks before deployment:
 * 1. Build verification
 * 2. Critical page testing with Puppeteer
 * 3. Bundle size analysis
 * 4. Performance metrics
 * 
 * Usage: npm run guardian:health-check
 */

import { chromium, Browser, Page, ConsoleMessage } from 'playwright';
import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  category: string;
  test: string;
  message: string;
  duration: number;
  details?: any;
}

/**
 * Preview server helpers
 */
class PreviewServerManager {
  static DEFAULT_PORT = Number(process.env.GUARDIAN_PREVIEW_PORT || 3000);

  static async waitForServerReady(url: string, timeoutMs = 10000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          return;
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    throw new Error(`Preview server not ready after ${timeoutMs / 1000}s`);
  }
}

interface DeploymentHealthReport {
  timestamp: string;
  overall: 'pass' | 'fail' | 'warn';
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    duration: number;
  };
  results: HealthCheckResult[];
}

class DeploymentHealthChecker {
  private results: HealthCheckResult[] = [];
  private startTime: number = performance.now();
  private previewProcess: ReturnType<typeof spawn> | null = null;

  private async startPreviewServer(): Promise<void> {
    if (this.previewProcess) {
      return;
    }

    const port = PreviewServerManager.DEFAULT_PORT;
    this.previewProcess = spawn('npm', ['run', 'preview', '--', '--host', '0.0.0.0', '--port', String(port)], {
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_EXCLUDE_LARGE_ASSETS: 'true',
        VITE_DISABLE_SW: 'true',
      },
    });

    await PreviewServerManager.waitForServerReady(`http://localhost:${port}`);
  }

  private async stopPreviewServer(): Promise<void> {
    if (!this.previewProcess) {
      return;
    }
    await new Promise<void>((resolve) => {
      const proc = this.previewProcess;
      if (!proc) {
        return resolve();
      }
      proc.once('close', () => {
        this.previewProcess = null;
        resolve();
      });
      proc.kill();
    });
  }

  /**
   * Executes a command and returns result
   */
  private async runCommand(
    command: string,
    category: string,
    testName: string,
    options?: {
      env?: NodeJS.ProcessEnv;
    }
  ): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        env: {
          ...process.env,
          ...options?.env,
        }
      });
      
      const duration = performance.now() - startTime;
      
      return {
        status: 'pass',
        category,
        test: testName,
        message: 'Command executed successfully',
        duration,
        details: { output: output.trim() }
      };
    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      return {
        status: 'fail',
        category,
        test: testName,
        message: `Command failed: ${error.message}`,
        duration,
        details: { 
          exitCode: error.status,
          stderr: error.stderr?.trim() || 'No stderr'
        }
      };
    }
  }

  /**
   * Checks if IV-DIAG-01 diagnostics pass
   */
  private async checkDragDiagnostics(): Promise<HealthCheckResult> {
    return this.runCommand('tsx scripts/idleVillage/dragDiagnostics.ts --preset quick --output test-results', 'Diagnostics', 'IV-DIAG-01 Drag Diagnostics');
  }

  /**
   * Checks if build succeeds
   */
  private async checkGuardianTests(): Promise<HealthCheckResult> {
    return this.runCommand('npm run guardian:test', 'Tests', 'Guardian Targeted Tests');
  }

  private async checkBuild(): Promise<HealthCheckResult> {
    return this.runCommand('npm run build:deploy', 'Build', 'Deploy Build Verification', {
      env: {
        GUARDIAN_BUILD_STATS: 'true',
      },
    });
  }

  /**
   * Checks bundle size against thresholds
   */
  private async checkBundleSize(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      const distPath = join(process.cwd(), 'dist');
      const statsPath = join(distPath, 'stats.json');
      
      if (!existsSync(statsPath)) {
        return {
          status: 'warn',
          category: 'Bundle',
          test: 'Bundle Size Analysis',
          message: 'stats.json not found - run build with stats',
          duration: performance.now() - startTime
        };
      }

      const stats = JSON.parse(readFileSync(statsPath, 'utf8'));
      const mainBundle = stats.assets?.find((asset: any) => asset.names?.includes('index'));
      
      if (!mainBundle) {
        return {
          status: 'warn',
          category: 'Bundle',
          test: 'Bundle Size Analysis',
          message: 'Main bundle not found in stats',
          duration: performance.now() - startTime
        };
      }

      const sizeKB = mainBundle.size / 1024;
      const thresholds = {
        warn: 500, // KB
        fail: 1000 // KB
      };

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Bundle size: ${sizeKB.toFixed(2)} KB`;

      if (sizeKB > thresholds.fail) {
        status = 'fail';
        message += ` (exceeds ${thresholds.fail} KB limit)`;
      } else if (sizeKB > thresholds.warn) {
        status = 'warn';
        message += ` (exceeds ${thresholds.warn} KB warning)`;
      }

      return {
        status,
        category: 'Bundle',
        test: 'Bundle Size Analysis',
        message,
        duration: performance.now() - startTime,
        details: { sizeKB, thresholds }
      };
    } catch (error: any) {
      return {
        status: 'fail',
        category: 'Bundle',
        test: 'Bundle Size Analysis',
        message: `Bundle analysis failed: ${error.message}`,
        duration: performance.now() - startTime
      };
    }
  }

  /**
   * Tests critical pages with Puppeteer
   */
  private async testCriticalPages(): Promise<HealthCheckResult[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const results: HealthCheckResult[] = [];

    const criticalPages = [
      { path: '/', name: 'Home Page' },
      { path: '/balancer', name: 'Balancer Page' },
      { path: '/idle-village', name: 'Idle Village Page' },
      { path: '/punch-club', name: 'Punch Club Page' },
      { path: '/sts', name: 'STS Tools Page' }
    ];

    try {
      for (const pageConfig of criticalPages) {
        const result = await this.testSinglePage(context, pageConfig.path, pageConfig.name);
        results.push(result);
      }
    } finally {
      await context.close();
      await browser.close();
    }

    return results;
  }

  /**
   * Tests a single page for errors and performance
   */
  private async testSinglePage(
    context: any, 
    path: string, 
    name: string
  ): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const page = await context.newPage();

    try {
      // Capture console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Capture unhandled exceptions
      const pageErrors: string[] = [];
      page.on('pageerror', (error: Error) => {
        pageErrors.push(error.message);
      });

      // Navigate to page
      const response = await page.goto(`http://localhost:3000${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      if (!response || response.status() !== 200) {
        return {
          status: 'fail',
          category: 'Page Test',
          test: name,
          message: `Page failed to load (status: ${response?.status() || 'unknown'})`,
          duration: performance.now() - startTime,
          details: { status: response?.status(), path }
        };
      }

      // Wait for critical elements
      await page.waitForSelector('body', { timeout: 10000 });

      // Check for React hydration errors
      const hasHydrationError = await page.evaluate(() => {
        const body = document.body;
        return body?.innerHTML?.includes('Hydration failed') || false;
      });

      // Performance metrics
      const metrics = await page.evaluate(() => {
        type NavigationTimingLike = {
          domContentLoadedEventEnd: number;
          domContentLoadedEventStart: number;
          loadEventEnd: number;
          loadEventStart: number;
        };

        const entries = performance.getEntries();
        const navigationEntry = entries.find((entry: any) => entry.entryType === 'navigation') as NavigationTimingLike | undefined;
        const paintEntry = entries.find((entry: any) => entry.entryType === 'paint');

        return {
          domContentLoaded: navigationEntry
            ? navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart
            : 0,
          loadComplete: navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.loadEventStart : 0,
          firstPaint: paintEntry ? (paintEntry as PerformanceEntry).startTime ?? 0 : 0,
        };
      });

      const duration = performance.now() - startTime;
      const hasErrors = consoleErrors.length > 0 || pageErrors.length > 0 || hasHydrationError;

      return {
        status: hasErrors ? 'fail' : 'pass',
        category: 'Page Test',
        test: name,
        message: hasErrors 
          ? `Page loaded with ${consoleErrors.length + pageErrors.length} errors`
          : `Page loaded successfully in ${duration.toFixed(0)}ms`,
        duration,
        details: {
          path,
          consoleErrors,
          pageErrors,
          hasHydrationError,
          metrics
        }
      };
    } catch (error: any) {
      return {
        status: 'fail',
        category: 'Page Test',
        test: name,
        message: `Page test failed: ${error.message}`,
        duration: performance.now() - startTime,
        details: { path, error: error.message }
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Runs all health checks
   */
  async runHealthChecks(): Promise<DeploymentHealthReport> {
    console.log('🔍 Starting Guardian Deployment Health Check...\n');

    // Guardian test checks
    console.log('🧪 Running guardian targeted tests...');
    const testResult = await this.checkGuardianTests();
    this.results.push(testResult);
    console.log(`  ${testResult.status === 'pass' ? '✅' : '❌'} ${testResult.test}: ${testResult.message}`);

    // IV-DIAG-01 drag diagnostics
    console.log('🔧 Running IV-DIAG-01 drag diagnostics...');
    const diagResult = await this.checkDragDiagnostics();
    this.results.push(diagResult);
    console.log(`  ${diagResult.status === 'pass' ? '✅' : '❌'} ${diagResult.test}: ${diagResult.message}`);

    // Build checks
    console.log('📦 Checking deploy build...');
    const buildResult = await this.checkBuild();
    this.results.push(buildResult);
    console.log(`  ${buildResult.status === 'pass' ? '✅' : '❌'} ${buildResult.test}: ${buildResult.message}`);

    // Bundle size check
    console.log('📊 Analyzing bundle size...');
    const bundleResult = await this.checkBundleSize();
    this.results.push(bundleResult);
    console.log(`  ${bundleResult.status === 'pass' ? '✅' : bundleResult.status === 'warn' ? '⚠️' : '❌'} ${bundleResult.test}: ${bundleResult.message}`);

    // Page tests (only if build passed)
    if (buildResult.status === 'pass') {
      try {
        console.log('🌐 Starting preview server...');
        await this.startPreviewServer();
        console.log('🌐 Testing critical pages...');
        const pageResults = await this.testCriticalPages();
        this.results.push(...pageResults);
        
        pageResults.forEach(result => {
          console.log(`  ${result.status === 'pass' ? '✅' : '❌'} ${result.test}: ${result.message}`);
        });
      } catch (error: any) {
        console.error('❌ Failed to start preview server:', error.message);
        this.results.push({
          status: 'fail',
          category: 'Preview Server',
          test: 'Preview Server Startup',
          message: error.message,
          duration: 0
        });
      } finally {
        await this.stopPreviewServer();
      }
    } else {
      console.log('⏭️  Skipping page tests due to build failure');
    }

    // Generate report
    const totalDuration = performance.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;

    const overall: 'pass' | 'fail' | 'warn' = failed > 0 ? 'fail' : warnings > 0 ? 'warn' : 'pass';

    const report: DeploymentHealthReport = {
      timestamp: new Date().toISOString(),
      overall,
      summary: {
        total: this.results.length,
        passed,
        failed,
        warnings,
        duration: totalDuration
      },
      results: this.results
    };

    // Save report
    const reportPath = join(process.cwd(), 'test-results', 'guardian-health-check.json');
    mkdirSync(join(process.cwd(), 'test-results'), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📋 Health Check Complete (${totalDuration.toFixed(0)}ms)`);
    console.log(`   Overall: ${overall.toUpperCase()}`);
    console.log(`   Passed: ${passed}, Failed: ${failed}, Warnings: ${warnings}`);
    console.log(`   Report saved to: ${reportPath}`);

    return report;
  }
}

// Run health checks if called directly
const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = process.argv[1] ? resolve(process.argv[1]) : '';
const isDirectExecution =
  entryFilePath === currentFilePath || entryFilePath.endsWith('scripts/guardian/deploymentHealthCheck.ts');

if (isDirectExecution) {
  const checker = new DeploymentHealthChecker();
  checker.runHealthChecks()
    .then(report => {
      process.exit(report.overall === 'fail' ? 1 : 0);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

export { DeploymentHealthChecker, DeploymentHealthReport };
