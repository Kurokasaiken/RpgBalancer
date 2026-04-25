import { mkdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Global setup for mobile playtest logger integration.
 * Ensures telemetry directory exists and is ready for test execution.
 */
async function globalSetup() {
  console.log('🔧 Setting up mobile playtest logger integration...');
  
  const testResultsDir = resolve(process.cwd(), 'test-results');
  const telemetryDir = join(testResultsDir, 'telemetry');
  
  try {
    mkdirSync(telemetryDir, { recursive: true });
    console.log(`📁 Telemetry directory ready: ${telemetryDir}`);
  } catch (error) {
    console.warn('⚠️  Failed to create telemetry directory:', error);
  }
}

export default globalSetup;
