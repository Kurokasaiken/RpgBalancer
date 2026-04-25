#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface BuildResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timestamp: string;
  duration: number;
}

/**
 * Executes build check and captures output for safeguard logging.
 * Fails explicitly if TypeScript build has errors.
 */
async function runBuildCheck(): Promise<BuildResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log('🏗️  Running build check...');
  
  try {
    const stdout = execSync('npm run build', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const duration = Date.now() - startTime;
    
    const result: BuildResult = {
      success: true,
      exitCode: 0,
      stdout,
      stderr: '',
      timestamp,
      duration
    };
    
    console.log('✅ Build check passed');
    return result;
    
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    const result: BuildResult = {
      success: false,
      exitCode: (error as { status?: number; code?: number }).status || (error as { status?: number; code?: number }).code || 1,
      stdout: (error as { stdout?: string }).stdout || '',
      stderr: (error as { stderr?: string; message?: string }).stderr || (error as { stderr?: string; message?: string }).message || '',
      timestamp,
      duration
    };
    
    console.error('❌ Build check failed');
    console.error('Exit code:', result.exitCode);
    console.error('Duration:', `${result.duration}ms`);
    
    return result;
  }
}

/**
 * Saves build result to test-results directory for evidence collection.
 */
function saveBuildLog(result: BuildResult): void {
  const testResultsDir = join(process.cwd(), 'test-results');
  
  // Ensure directory exists
  mkdirSync(testResultsDir, { recursive: true });
  
  const logFileName = `build-check-${new Date().toISOString().split('T')[0]}.log`;
  const logPath = join(testResultsDir, logFileName);
  
  const logContent = [
    `Build Check Result - ${result.timestamp}`,
    `Success: ${result.success}`,
    `Exit Code: ${result.exitCode}`,
    `Duration: ${result.duration}ms`,
    '=' .repeat(80),
    'STDOUT:',
    result.stdout || '(empty)',
    '=' .repeat(80),
    'STDERR:',
    result.stderr || '(empty)',
    '=' .repeat(80),
  ].join('\n');
  
  writeFileSync(logPath, logContent, 'utf8');
  console.log(`📝 Build log saved: ${logPath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const result = await runBuildCheck();
  saveBuildLog(result);
  
  // Exit with same code as build to fail CI if build fails
  if (!result.success) {
    process.exit(result.exitCode || 1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Build check script failed:', error);
    process.exit(1);
  });
}
