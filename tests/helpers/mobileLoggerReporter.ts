import { type Reporter, type TestCase, type TestResult, type FullResult } from '@playwright/test/reporter';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { spawn } from 'child_process';
import type { TelemetrySnapshot } from './testTypes';

/**
 * Playwright reporter for mobile logger integration.
 * Tracks telemetry collection and generates mobile playtest logger reports.
 */

interface MobileLoggerReporterOptions {
  outputFile?: string;
  enabled?: boolean;
  autoProcessTelemetry?: boolean;
  telemetryOutputDir?: string;
  aggregateFormat?: 'json' | 'markdown' | 'csv';
}

interface TestReport {
  testId: string;
  title: string;
  file: string;
  status: string;
  duration: number;
  telemetryCollected: boolean;
  telemetryPath?: string;
  sessionTag?: string;
  error?: string;
}

interface MobileLoggerReport {
  generatedAt: string;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  testsWithTelemetry: number;
  tests: TestReport[];
  summary: {
    telemetryCollectionRate: number;
    averageTestDuration: number;
    totalDuration: number;
  };
  postProcessing?: {
    enabled: boolean;
    completed: boolean;
    outputPath?: string;
    error?: string;
  };
}

export class MobileLoggerReporter implements Reporter {
  private options: MobileLoggerReporterOptions;
  private tests: TestReport[] = [];
  private startTime: number = Date.now();

  constructor(options: MobileLoggerReporterOptions = {}) {
    this.options = {
      outputFile: 'test-results/mobile-logger-report.json',
      enabled: true,
      autoProcessTelemetry: true,
      telemetryOutputDir: 'test-results/telemetry',
      aggregateFormat: 'json',
      ...options,
    };
  }

  onBegin() {
    if (!this.options.enabled) {
      return;
    }
    
    console.log('📱 Mobile Logger Reporter started');
    this.startTime = Date.now();
    
    // Ensure output directory exists
    const outputDir = dirname(this.options.outputFile!);
    mkdirSync(outputDir, { recursive: true });
  }

  onTestBegin(test: TestCase) {
    if (!this.options.enabled) {
      return;
    }
    
    console.log(`🧪 Starting test: ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.options.enabled) {
      return;
    }
    
    const testReport: TestReport = {
      testId: test.id,
      title: test.title,
      file: test.location.file,
      status: result.status,
      duration: result.duration,
      telemetryCollected: false,
    };

    // Check for telemetry attachments
    const telemetryAttachment = result.attachments.find(
      (attachment) => attachment.name === 'telemetry' && attachment.contentType === 'application/json'
    );

    if (telemetryAttachment && telemetryAttachment.path) {
      testReport.telemetryCollected = true;
      testReport.telemetryPath = telemetryAttachment.path;
      
      // Try to extract session tag from telemetry file
      try {
        const telemetryData = readFileSync(telemetryAttachment.path, 'utf8');
        const telemetry: TelemetrySnapshot = JSON.parse(telemetryData);
        testReport.sessionTag = telemetry.sessionTag;
      } catch (error) {
        console.warn(`⚠️  Failed to read telemetry for ${test.title}:`, error);
      }
    }

    // Check for errors
    if (result.status === 'failed' && result.error) {
      testReport.error = result.error.message;
    }

    this.tests.push(testReport);
    
    const status = testReport.telemetryCollected ? '📊' : '⚪';
    console.log(`${status} Test completed: ${test.title} (${Math.round(result.duration)}ms)`);
  }

  onEnd(_result: FullResult) {
    if (!this.options.enabled) {
      return;
    }
    
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.tests.filter(t => t.status === 'passed').length;
    const failedTests = this.tests.filter(t => t.status === 'failed').length;
    const testsWithTelemetry = this.tests.filter(t => t.telemetryCollected).length;
    
    const report: MobileLoggerReport = {
      generatedAt: new Date().toISOString(),
      totalTests: this.tests.length,
      successfulTests,
      failedTests,
      testsWithTelemetry,
      tests: this.tests,
      summary: {
        telemetryCollectionRate: this.tests.length > 0 ? (testsWithTelemetry / this.tests.length) * 100 : 0,
        averageTestDuration: this.tests.length > 0 ? this.tests.reduce((sum, t) => sum + t.duration, 0) / this.tests.length : 0,
        totalDuration,
      },
    };

    // Auto-process telemetry with mobilePlaytestLogger if enabled
    if (this.options.autoProcessTelemetry && testsWithTelemetry > 0) {
      console.log('\n🔄 Auto-processing telemetry with mobilePlaytestLogger...');
      
      this.processTelemetryWithCLI()
        .then((result) => {
          report.postProcessing = {
            enabled: true,
            completed: result.success,
            outputPath: result.outputPath,
            error: result.error,
          };
          
          // Update report with post-processing results
          this.saveReport(report);
        })
        .catch((error) => {
          console.error('❌ Post-processing failed:', error);
          report.postProcessing = {
            enabled: true,
            completed: false,
            error: error instanceof Error ? error.message : String(error),
          };
          this.saveReport(report);
        });
    } else {
      // Save report immediately if no auto-processing
      this.saveReport(report);
    }
  }

  /**
   * Saves the mobile logger report to file.
   */
  private saveReport(report: MobileLoggerReport): void {
    try {
      writeFileSync(this.options.outputFile!, JSON.stringify(report, null, 2));
      console.log(`📋 Mobile Logger Report saved: ${this.options.outputFile}`);
      
      // Print summary
      console.log('\n📱 Mobile Logger Integration Summary:');
      console.log(`   Total tests: ${report.totalTests}`);
      console.log(`   Successful: ${report.successfulTests}`);
      console.log(`   Failed: ${report.failedTests}`);
      console.log(`   With telemetry: ${report.testsWithTelemetry} (${report.summary.telemetryCollectionRate.toFixed(1)}%)`);
      console.log(`   Average duration: ${Math.round(report.summary.averageTestDuration)}ms`);
      console.log(`   Total duration: ${Math.round(report.summary.totalDuration)}ms`);
      
      if (report.postProcessing) {
        console.log(`   Post-processing: ${report.postProcessing.completed ? '✅' : '❌'}`);
        if (report.postProcessing.outputPath) {
          console.log(`   Output: ${report.postProcessing.outputPath}`);
        }
        if (report.postProcessing.error) {
          console.log(`   Error: ${report.postProcessing.error}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to save Mobile Logger Report:', error);
    }
  }

  /**
   * Processes telemetry data using mobilePlaytestLogger CLI.
   */
  private async processTelemetryWithCLI(): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    try {
      const args = [
        '--post-playwright',
        '--playwright-output-dir', this.options.telemetryOutputDir!,
        '--aggregate-format', this.options.aggregateFormat!,
      ];

      console.log(`🔧 Running: mobilePlaytestLogger ${args.join(' ')}`);
      
      const result = await this.runMobileLoggerCLI(args);
      
      if (result.success) {
        console.log('✅ MobilePlaytestLogger processing completed successfully');
        return { success: true, outputPath: result.outputPath };
      } else {
        console.warn(`⚠️  MobilePlaytestLogger processing failed: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ MobilePlaytestLogger processing failed:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Runs the mobilePlaytestLogger CLI with specified arguments.
   */
  private async runMobileLoggerCLI(args: string[]): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const cliPath = `${dirname(__dirname)}/../../scripts/mobilePlaytestLogger.ts`;
      const child = spawn('npx', ['tsx', cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code === 0) {
          console.log(output);
          
          // Extract output path from CLI output
          const outputPathMatch = output.match(/📄 (JSON|Markdown|CSV) aggregate report: (.+)/);
          const outputPath = outputPathMatch ? outputPathMatch[2] : undefined;
          
          resolve({ success: true, outputPath });
        } else {
          console.error(errorOutput);
          resolve({ success: false, error: `CLI exited with code ${code}` });
        }
      });

      child.on('error', (error: Error) => {
        resolve({ success: false, error: error.message });
      });
    });
  }
}

// Export a single class as required by Playwright
export default MobileLoggerReporter;
