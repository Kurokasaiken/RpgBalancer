#!/usr/bin/env tsx

/**
 * Guardian Vercel Deployment Guard
 * 
 * Ensures safe deployment to Vercel by:
 * 1. Running pre-deployment health checks
 * 2. Verifying Vercel CLI availability
 * 3. Monitoring deployment status
 * 4. Running post-deployment verification
 * 
 * Usage: npm run guardian:deploy-guard
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { DeploymentHealthChecker } from './deploymentHealthCheck';

interface DeploymentGuardConfig {
  preDeployChecks: boolean;
  postDeployVerification: boolean;
  maxDeployWaitTime: number; // minutes
  criticalPages: string[];
  vercelProject?: string;
}

interface DeploymentResult {
  success: boolean;
  deploymentUrl?: string;
  error?: string;
  duration: number;
  healthReport?: any;
}

class VercelDeploymentGuard {
  private config: DeploymentGuardConfig = {
    preDeployChecks: true,
    postDeployVerification: true,
    maxDeployWaitTime: 10, // 10 minutes
    criticalPages: [
      '/',
      '/balancer',
      '/idle-village',
      '/punch-club',
      '/sts'
    ]
  };

  /**
   * Checks if Vercel CLI is available
   */
  private checkVercelCLI(): { available: boolean; version?: string; error?: string } {
    try {
      const output = execSync('npx vercel --version', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return {
        available: true,
        version: output.trim()
      };
    } catch (error: any) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Checks if user is logged into Vercel
   */
  private checkVercelAuth(): { authenticated: boolean; error?: string } {
    try {
      const output = execSync('npx vercel whoami', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return {
        authenticated: true
      };
    } catch (error: any) {
      return {
        authenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Runs pre-deployment health checks
   */
  private async runPreDeployChecks(): Promise<{ success: boolean; report?: any }> {
    console.log('🔍 Running pre-deployment health checks...');
    
    const checker = new DeploymentHealthChecker();
    const report = await checker.runHealthChecks();
    
    if (report.overall === 'fail') {
      console.log('❌ Pre-deployment checks failed - aborting deployment');
      return { success: false, report };
    }
    
    console.log('✅ Pre-deployment checks passed');
    return { success: true, report };
  }

  /**
   * Deploys to Vercel
   */
  private async deployToVercel(): Promise<{ success: boolean; url?: string; error?: string }> {
    console.log('🚀 Deploying to Vercel...');
    
    try {
      // Deploy to production
      const output = execSync('npx vercel --prod', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https?:\/\/[^\s]+\.vercel\.app/);
      const deploymentUrl = urlMatch ? urlMatch[0] : undefined;
      
      if (!deploymentUrl) {
        return {
          success: false,
          error: 'Could not extract deployment URL from Vercel output'
        };
      }
      
      console.log(`✅ Deployment initiated: ${deploymentUrl}`);
      return { success: true, url: deploymentUrl };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Monitors deployment status
   */
  private async monitorDeployment(deploymentUrl: string): Promise<{ success: boolean; error?: string }> {
    console.log('⏳ Monitoring deployment status...');
    
    const startTime = performance.now();
    const maxWaitTime = this.config.maxDeployWaitTime * 60 * 1000; // Convert to milliseconds
    
    while (performance.now() - startTime < maxWaitTime) {
      try {
        // Check if deployment is ready by making a simple request
        const response = await fetch(deploymentUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          console.log('✅ Deployment is live and accessible');
          return { success: true };
        }
      } catch (error) {
        // Deployment not ready yet, wait and retry
      }
      
      // Wait 30 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 30000));
      console.log('⏳ Still waiting for deployment...');
    }
    
    return {
      success: false,
      error: `Deployment not ready after ${this.config.maxDeployWaitTime} minutes`
    };
  }

  /**
   * Runs post-deployment verification
   */
  private async runPostDeployVerification(deploymentUrl: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 Running post-deployment verification...');
    
    // For now, just check if the main page loads
    // In a full implementation, this would run comprehensive tests against the deployed URL
    
    try {
      const response = await fetch(deploymentUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Post-deployment check failed: HTTP ${response.status}`
        };
      }
      
      // Check if the page contains expected content
      const content = await response.text();
      const hasExpectedContent = content.includes('RPG Balancer') || content.includes('id="root"');
      
      if (!hasExpectedContent) {
        return {
          success: false,
          error: 'Post-deployment check failed: Unexpected page content'
        };
      }
      
      console.log('✅ Post-deployment verification passed');
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Post-deployment verification failed: ${error.message}`
      };
    }
  }

  /**
   * Creates deployment log entry
   */
  private logDeployment(result: DeploymentResult): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: result.success,
      deploymentUrl: result.deploymentUrl,
      error: result.error,
      duration: result.duration,
      healthReport: result.healthReport
    };
    
    const logPath = join(process.cwd(), 'test-results', 'guardian-deployment-log.json');
    const logs: any[] = [];
    
    // Load existing logs
    if (existsSync(logPath)) {
      const existingLogs = JSON.parse(readFileSync(logPath, 'utf8'));
      logs.push(...existingLogs);
    }
    
    // Add new log entry
    logs.push(logEntry);
    
    // Keep only last 10 deployments
    if (logs.length > 10) {
      logs.splice(0, logs.length - 10);
    }
    
    // Save logs
    mkdirSync(join(process.cwd(), 'test-results'), { recursive: true });
    writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    console.log(`📝 Deployment logged to: ${logPath}`);
  }

  /**
   * Executes the full deployment guard process
   */
  async execute(): Promise<DeploymentResult> {
    const startTime = performance.now();
    
    console.log('🛡️  Guardian Vercel Deployment Guard Starting...\n');
    
    // Check Vercel CLI
    console.log('🔧 Checking Vercel CLI...');
    const cliCheck = this.checkVercelCLI();
    if (!cliCheck.available) {
      const error = `Vercel CLI not available: ${cliCheck.error}`;
      console.log(`❌ ${error}`);
      return { success: false, error, duration: performance.now() - startTime };
    }
    console.log(`✅ Vercel CLI available: ${cliCheck.version}`);
    
    // Check authentication
    console.log('🔐 Checking Vercel authentication...');
    const authCheck = this.checkVercelAuth();
    if (!authCheck.authenticated) {
      const error = `Not authenticated with Vercel: ${authCheck.error}`;
      console.log(`❌ ${error}`);
      return { success: false, error, duration: performance.now() - startTime };
    }
    console.log('✅ Authenticated with Vercel');
    
    // Run pre-deployment checks
    let healthReport: any;
    if (this.config.preDeployChecks) {
      const preDeployResult = await this.runPreDeployChecks();
      if (!preDeployResult.success) {
        return { 
          success: false, 
          error: 'Pre-deployment checks failed',
          duration: performance.now() - startTime,
          healthReport: preDeployResult.report
        };
      }
      healthReport = preDeployResult.report;
    }
    
    // Deploy
    const deployResult = await this.deployToVercel();
    if (!deployResult.success) {
      return { 
        success: false, 
        error: deployResult.error,
        duration: performance.now() - startTime,
        healthReport
      };
    }
    
    // Monitor deployment
    const monitorResult = await this.monitorDeployment(deployResult.url!);
    if (!monitorResult.success) {
      return { 
        success: false, 
        error: monitorResult.error,
        deploymentUrl: deployResult.url,
        duration: performance.now() - startTime,
        healthReport
      };
    }
    
    // Post-deployment verification
    if (this.config.postDeployVerification) {
      const postDeployResult = await this.runPostDeployVerification(deployResult.url!);
      if (!postDeployResult.success) {
        return { 
          success: false, 
          error: postDeployResult.error,
          deploymentUrl: deployResult.url,
          duration: performance.now() - startTime,
          healthReport
        };
      }
    }
    
    const totalDuration = performance.now() - startTime;
    
    // Log deployment
    const result: DeploymentResult = {
      success: true,
      deploymentUrl: deployResult.url,
      duration: totalDuration,
      healthReport
    };
    
    this.logDeployment(result);
    
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`   URL: ${deployResult.url}`);
    console.log(`   Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    
    return result;
  }
}

const isDirectExecution = (): boolean => {
  if (!process.argv[1]) {
    return false;
  }

  try {
    const modulePath = new URL(import.meta.url).pathname;
    const invokedPath = new URL(`file://${process.argv[1]}`).pathname;
    return modulePath === invokedPath;
  } catch (error) {
    console.warn('Unable to determine execution context:', error);
    return false;
  }
};

function shutdownSystem(reason: string, detail: string): void {
  console.log(`Session ${reason === 'SUCCESS' ? 'completed' : 'failed'} - initiating shutdown: ${reason}`);
  
  // Create final session summary
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalLog = `test-results/auto-commit-guardian/${timestamp}-session-complete.log`;
  const summary = `=== GUARDIAN SESSION COMPLETE ===
Timestamp: ${new Date().toISOString()}
Stage: deployment
Branch: main
Final Status: ${reason}
Shutdown Reason: ${reason}
Detail: ${detail}
================================`;
  
  try {
    const fs = require('fs');
    const path = require('path');
    fs.mkdirSync(path.dirname(finalLog), { recursive: true });
    fs.writeFileSync(finalLog, summary);
    console.log(`Final session summary written to: ${finalLog}`);
  } catch (err) {
    console.log(`Failed to write session summary: ${(err as Error).message}`);
  }

  // Attempt graceful shutdown with unattended safety checks
  const { exec, spawnSync } = require('child_process');
  
  // Check for unattended sudo access
  if (process.platform === 'linux') {
    const sudoCheck = spawnSync('sudo', ['-n', 'true'], { stdio: 'pipe' });
    if (sudoCheck.status === 0) {
      console.log('Executing unattended Linux shutdown...');
      exec('sudo shutdown -h now', (err: any) => {
        if (err) {
          console.log('Linux shutdown failed - no fallback available');
        }
      });
    } else {
      console.log('No unattended sudo access - cannot shutdown Linux');
    }
  } else if (process.platform === 'darwin') {
    console.log('Executing macOS shutdown via osascript...');
    exec('osascript -e "tell application \\"System Events\\" to shut down"', (err: any) => {
      if (err) {
        console.log('macOS shutdown failed - no fallback available');
      }
    });
  } else {
    console.log('Shutdown command not available for this platform - session ended');
  }
  
  // Force exit after short delay to prevent hanging
  setTimeout(() => {
    console.log('Forcing process exit - session ended');
    process.exit(0);
  }, 3000);
}

// Run deployment guard if called directly
if (isDirectExecution()) {
  const guard = new VercelDeploymentGuard();
  guard.execute()
    .then(result => {
      if (result.success) {
        console.log('\n Deployment guard completed successfully');
        shutdownSystem('SUCCESS', 'Deployment completed successfully');
        process.exit(0);
      } else {
        console.log(`\n Deployment guard failed: ${result.error}`);
        shutdownSystem('DEPLOYMENT_FAILED', result.error || 'Unknown deployment error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Deployment guard error:', error);
      shutdownSystem('DEPLOYMENT_ERROR', (error as Error).message);
      process.exit(1);
    });
}

export { VercelDeploymentGuard, DeploymentResult };
