#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const TEST_RESULTS_DIR = resolve(PROJECT_ROOT, 'test-results');
const TELEMETRY_DIR = resolve(TEST_RESULTS_DIR, 'telemetry');
const MOBILE_LOGGER_SCRIPT = resolve(PROJECT_ROOT, 'scripts/mobilePlaytestLogger.ts');

/**
 * Post-test workflow script that integrates mobilePlaytestLogger CLI with Playwright tests.
 * Automatically processes telemetry files and generates mobile playtest logs.
 */

interface TelemetryFile {
  path: string;
  data: unknown;
  testInfo: {
    title: string;
    file: string;
  };
}

interface ProcessedResult {
  telemetryFile: string;
  logFile?: string;
  success: boolean;
  error?: string;
}

/**
 * Finds all telemetry JSON files in test-results/telemetry directory.
 */
function findTelemetryFiles(): TelemetryFile[] {
  if (!existsSync(TELEMETRY_DIR)) {
    console.log('📂 No telemetry directory found, skipping mobile logger integration');
    return [];
  }

  try {
    const files = readdirSync(TELEMETRY_DIR)
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => join(TELEMETRY_DIR, file));

    const telemetryFiles: TelemetryFile[] = [];
    
    for (const filePath of files) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        if (data.testInfo && (data.events?.length > 0 || data.metrics)) {
          telemetryFiles.push({
            path: filePath,
            data,
            testInfo: data.testInfo,
          });
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse telemetry file ${filePath}:`, error);
      }
    }

    console.log(`📊 Found ${telemetryFiles.length} telemetry files to process`);
    return telemetryFiles;
  } catch (error) {
    console.error('❌ Failed to read telemetry directory:', error);
    return [];
  }
}

/**
 * Extracts session tag from telemetry data for automatic tagging.
 */
function extractSessionTag(telemetryData: unknown): string | undefined {
  const data = telemetryData as { sessionTag?: string; events?: { type: string; payload?: { sessionTag?: string } }[] };
  return data.sessionTag || 
         data.events?.find((e: { type: string }) => e.type === 'session_start')?.payload?.sessionTag;
}

/**
 * Generates default values for missing mobile logger fields.
 */
function generateDefaults(telemetryData: unknown, testInfo: unknown) {
  const sessionTag = extractSessionTag(telemetryData);
  const telemetry = telemetryData as { sessionId?: string };
  const test = testInfo as { title: string; file: string };
  
  // Extract test name for session ID
  const testSlug = test.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  
  return {
    sessionId: telemetry.sessionId || `playwright-${testSlug}-${Date.now()}`,
    sessionTag,
    testName: test.title,
    testFile: test.file,
    tester: 'playwright-automation',
    device: 'test-environment',
    qualitativeNotes: `Auto-generated from Playwright test: ${test.title}`,
  };
}

/**
 * Calls mobilePlaytestLogger CLI with telemetry data.
 */
async function callMobileLogger(telemetryFile: TelemetryFile): Promise<ProcessedResult> {
  const defaults = generateDefaults(telemetryFile.data, telemetryFile.testInfo);
  
  // Prepare CLI arguments
  const args = [
    'tsx',
    MOBILE_LOGGER_SCRIPT,
    '--session', defaults.sessionId,
    '--tester', defaults.tester,
    '--device', defaults.device,
    '--notes', defaults.qualitativeNotes,
    '--import', telemetryFile.path,
    '--format', 'json',
    '--format', 'markdown',
  ];

  if (defaults.sessionTag) {
    args.push('--session-tag', defaults.sessionTag);
  }

  console.log(`🔄 Processing ${telemetryFile.testInfo.title}...`);

  return new Promise((resolve) => {
    const child = spawn('npx', args, {
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Successfully processed ${telemetryFile.testInfo.title}`);
        
        // Extract output file path from stdout
        const outputMatch = stdout.match(/Files? written to .+\/([^/\s]+\.json)/);
        const logFile = outputMatch ? join('data/runs/mobile_playtests', outputMatch[1]) : undefined;
        
        resolve({
          telemetryFile: telemetryFile.path,
          logFile,
          success: true,
        });
      } else {
        console.error(`❌ Failed to process ${telemetryFile.testInfo.title}`);
        console.error(`stderr: ${stderr}`);
        
        resolve({
          telemetryFile: telemetryFile.path,
          success: false,
          error: stderr || `Process exited with code ${code}`,
        });
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to spawn mobile logger for ${telemetryFile.testInfo.title}:`, error);
      resolve({
        telemetryFile: telemetryFile.path,
        success: false,
        error: error.message,
      });
    });
  });
}

/**
 * Generates a summary report of processed telemetry files.
 */
function generateSummaryReport(results: ProcessedResult[]): void {
  const summaryPath = join(TEST_RESULTS_DIR, 'mobile-logger-summary.md');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const report = `# Mobile Playtest Logger Integration Summary

Generated: ${new Date().toISOString()}

## Results Overview
- **Total telemetry files**: ${results.length}
- **Successfully processed**: ${successful.length}
- **Failed**: ${failed.length}

## Successfully Processed
${successful.map(result => {
  const logFile = result.logFile ? ` → [Log file](${result.logFile})` : '';
  return `- ✅ \`${result.telemetryFile}\`${logFile}`;
}).join('\n')}

${failed.length > 0 ? `
## Failed Processing
${failed.map(result => `- ❌ \`${result.telemetryFile}\`: ${result.error}`).join('\n')}
` : ''}

## Integration Notes
- Session tags automatically extracted from sessionStorage when available
- Default values used for missing fields (tester: 'playwright-auto', device: 'test-runner')
- Output files saved to \`data/runs/mobile_playtests/\` directory
- Both JSON and Markdown formats generated for each successful processing

## Usage
To view the generated mobile playtest logs:
\`\`\`bash
# List all generated logs
ls data/runs/mobile_playtests/

# View a specific log
cat data/runs/mobile_playtests/<session-id>.json

# Open markdown report (macOS)
open data/runs/mobile_playtests/<session-id>.md
\`\`\`
`;

  writeFileSync(summaryPath, report);
  console.log(`📋 Summary report generated: ${summaryPath}`);
}

/**
 * Main execution function.
 */
async function main() {
  console.log('🚀 Starting mobile playtest logger post-test workflow...');
  
  // Check if mobile logger script exists
  if (!existsSync(MOBILE_LOGGER_SCRIPT)) {
    console.error('❌ Mobile logger script not found:', MOBILE_LOGGER_SCRIPT);
    process.exit(1);
  }

  // Find telemetry files
  const telemetryFiles = findTelemetryFiles();
  
  if (telemetryFiles.length === 0) {
    console.log('✅ No telemetry files to process. Workflow complete.');
    return;
  }

  // Process each telemetry file
  const results: ProcessedResult[] = [];
  
  for (const telemetryFile of telemetryFiles) {
    const result = await callMobileLogger(telemetryFile);
    results.push(result);
  }

  // Generate summary report
  generateSummaryReport(results);

  // Exit with appropriate code
  const failedCount = results.filter(r => !r.success).length;
  if (failedCount > 0) {
    console.log(`⚠️  Workflow completed with ${failedCount} failures`);
    process.exit(1);
  } else {
    console.log('🎉 Mobile playtest logger integration completed successfully!');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Unhandled error in post-test workflow:', error);
    process.exit(1);
  });
}

export { main, findTelemetryFiles, callMobileLogger, generateSummaryReport };
