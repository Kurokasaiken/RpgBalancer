import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

/**
 * Global teardown for mobile playtest logger integration.
 * Runs post-test workflow to process telemetry files and generate mobile logs.
 */
async function globalTeardown() {
  console.log('🔄 Running mobile playtest logger post-test workflow...');
  
  const telemetryDir = resolve(process.cwd(), 'test-results/telemetry');
  
  if (!existsSync(telemetryDir)) {
    console.log('📂 No telemetry directory found, skipping post-test workflow');
    return;
  }
  
  // Check if telemetry directory has files
  const files = readdirSync(telemetryDir);
  
  if (files.length === 0) {
    console.log('📂 No telemetry files found, skipping post-test workflow');
    return;
  }
  
  // Run the post-test workflow
  return new Promise<void>((resolve, reject) => {
    const child = spawn('npx', ['tsx', 'scripts/postTestMobileLogger.ts'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Mobile playtest logger post-test workflow completed');
        resolve();
      } else {
        console.error(`❌ Post-test workflow failed with code ${code}`);
        reject(new Error(`Post-test workflow failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Failed to run post-test workflow:', error);
      reject(error);
    });
  });
}

export default globalTeardown;
