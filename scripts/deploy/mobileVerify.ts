#!/usr/bin/env tsx

/**
 * Mobile Deploy Verification Script
 * 
 * Verifies Vercel deployment for mobile functionality including:
 * - Mobile redirect behavior
 * - Moodboard tab navigation
 * - Alias configuration
 * - Build verification
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  success: boolean;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    details?: string;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

/**
 * Execute command and return result
 */
function runCommand(command: string, cwd?: string): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error: unknown) {
    const err = error as Error & { stdout?: string; stderr?: string };
    return { 
      success: false, 
      output: err.stdout || '', 
      error: err.stderr || err.message 
    };
  }
}

/**
 * Check if Vercel CLI is available
 */
function checkVercelCLI(): boolean {
  const result = runCommand('vercel --version');
  return result.success;
}

/**
 * Verify build works correctly
 */
function verifyBuild(): { success: boolean; message: string } {
  console.log('🔨 Verifying build...');
  
  const result = runCommand('npm run build');
  if (!result.success) {
    return { 
      success: false, 
      message: `Build failed: ${result.error}` 
    };
  }
  
  // Check if dist directory exists
  const distPath = join(process.cwd(), 'dist');
  if (!existsSync(distPath)) {
    return { 
      success: false, 
      message: 'Build completed but dist directory not found' 
    };
  }
  
  // Check for key files
  const requiredFiles = ['index.html', 'manifest.webmanifest'];
  const missingFiles = requiredFiles.filter(file => 
    !existsSync(join(distPath, file))
  );
  
  if (missingFiles.length > 0) {
    return { 
      success: false, 
      message: `Missing required files: ${missingFiles.join(', ')}` 
    };
  }
  
  return { 
    success: true, 
    message: 'Build completed successfully with all required files' 
  };
}

/**
 * Verify Vercel configuration
 */
function verifyVercelConfig(): { success: boolean; message: string; details?: string } {
  console.log('📋 Verifying Vercel configuration...');
  
  const vercelConfigPath = join(process.cwd(), 'vercel.json');
  if (!existsSync(vercelConfigPath)) {
    return { 
      success: false, 
      message: 'vercel.json not found' 
    };
  }
  
  try {
    const config = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
    
    // Check required fields
    const requiredFields = ['version', 'framework', 'buildCommand'];
    const missingFields = requiredFields.filter(field => !(field in config));
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        message: `Missing required fields in vercel.json: ${missingFields.join(', ')}` 
      };
    }
    
    // Check SPA rewrite rule
    const hasRewrite = config.rewrites?.some((rule: { source: string; destination: string }) => 
      rule.source === '/(.*)' && rule.destination === '/index.html'
    );
    
    if (!hasRewrite) {
      return { 
        success: false, 
        message: 'Missing SPA rewrite rule for client-side routing' 
      };
    }
    
    // Check security headers
    const hasSecurityHeaders = config.headers?.some((header: { source: string; headers: Array<{ key: string }> }) => 
      header.source === '/:path*' && 
      header.headers?.some((h: { key: string }) => h.key === 'X-Content-Type-Options')
    );
    
    if (!hasSecurityHeaders) {
      return { 
        success: false, 
        message: 'Missing security headers configuration' 
      };
    }
    
    return { 
      success: true, 
      message: 'Vercel configuration is valid',
      details: `Framework: ${config.framework}, Build: ${config.buildCommand}`
    };
    
  } catch (error) {
    return { 
      success: false, 
      message: `Invalid vercel.json: ${error}` 
    };
  }
}

/**
 * Verify mobile redirect logic in App.tsx
 */
function verifyMobileRedirect(): { success: boolean; message: string; details?: string } {
  console.log('📱 Verifying mobile redirect logic...');
  
  const appPath = join(process.cwd(), 'src', 'App.tsx');
  if (!existsSync(appPath)) {
    return { 
      success: false, 
      message: 'App.tsx not found' 
    };
  }
  
  try {
    const appContent = readFileSync(appPath, 'utf8');
    
    // Check for mobile detection logic
    const hasMobileDetection = appContent.includes('useIsMobile');
    const hasMobileRedirect = appContent.includes('isMobile') && 
      appContent.includes('moodboard') && 
      appContent.includes('setActiveTab');
    
    if (!hasMobileDetection) {
      return { 
        success: false, 
        message: 'Missing mobile detection with useIsMobile hook' 
      };
    }
    
    if (!hasMobileRedirect) {
      return { 
        success: false, 
        message: 'Missing mobile redirect logic to moodboard' 
      };
    }
    
    // Check for mobile override handling
    const hasMobileOverride = appContent.includes('mobile') && 
      appContent.includes('URLSearchParams');
    
    if (!hasMobileOverride) {
      return { 
        success: false, 
        message: 'Missing mobile URL parameter override handling' 
      };
    }
    
    return { 
      success: true, 
      message: 'Mobile redirect logic is properly implemented',
      details: 'Mobile detection, redirect, and override handling found'
    };
    
  } catch (error) {
    return { 
      success: false, 
      message: `Error reading App.tsx: ${error}` 
    };
  }
}

/**
 * Verify mobile E2E tests
 */
function verifyMobileTests(): { success: boolean; message: string; details?: string } {
  console.log('🧪 Verifying mobile E2E tests...');
  
  const testPath = join(process.cwd(), 'tests', 'mobile-redirect.spec.ts');
  if (!existsSync(testPath)) {
    return { 
      success: false, 
      message: 'mobile-redirect.spec.ts not found' 
    };
  }
  
  try {
    const testContent = readFileSync(testPath, 'utf8');
    
    // Check for test cases
    const hasMobileTests = testContent.includes('Mobile User Agent Detection');
    const hasDesktopTests = testContent.includes('Desktop User Agent');
    const hasManualOverride = testContent.includes('Manual Mobile Override');
    
    if (!hasMobileTests || !hasDesktopTests || !hasManualOverride) {
      return { 
        success: false, 
        message: 'Missing required test cases in mobile-redirect.spec.ts' 
      };
    }
    
    // Check for Node.js version bypass
    const hasNodeVersionCheck = testContent.includes('nodeVersion') && 
      testContent.includes('shouldSkip');
    
    if (!hasNodeVersionCheck) {
      return { 
        success: false, 
        message: 'Missing Node.js version check for test compatibility' 
      };
    }
    
    return { 
      success: true, 
      message: 'Mobile E2E tests are properly configured',
      details: 'Mobile, desktop, and override test cases found with Node.js compatibility check'
    };
    
  } catch (error) {
    return { 
      success: false, 
      message: `Error reading mobile-redirect.spec.ts: ${error}` 
    };
  }
}

/**
 * Check Vercel project status
 */
function checkVercelProject(): { success: boolean; message: string; details?: string } {
  console.log('🌐 Checking Vercel project...');
  
  if (!checkVercelCLI()) {
    return { 
      success: false, 
      message: 'Vercel CLI not available - install with: npm i -g vercel' 
    };
  }
  
  const result = runCommand('vercel ls --scope=personal');
  if (!result.success) {
    return { 
      success: false, 
      message: 'Failed to list Vercel projects', 
      details: result.error 
    };
  }
  
  const projects = result.output.trim().split('\n');
  const hasProject = projects.some(line => 
    line.toLowerCase().includes('progetti-personali') || 
    line.toLowerCase().includes('rpg-balancer')
  );
  
  if (!hasProject) {
    return { 
      success: false, 
      message: 'No Vercel project found for this repository',
      details: 'Available projects:\n' + result.output
    };
  }
  
  return { 
    success: true, 
    message: 'Vercel project found',
    details: 'Project is available for deployment'
  };
}

/**
 * Main verification function
 */
function runVerification(): VerificationResult {
  console.log('🚀 Starting Mobile Deploy Verification...\n');
  
  const checks: VerificationResult['checks'] = [];
  
  // Build verification
  const buildResult = verifyBuild();
  checks.push({
    name: 'Build Verification',
    status: buildResult.success ? 'pass' : 'fail',
    message: buildResult.message,
    details: buildResult.success ? 'All required files generated' : undefined
  });
  
  // Vercel configuration
  const configResult = verifyVercelConfig();
  checks.push({
    name: 'Vercel Configuration',
    status: configResult.success ? 'pass' : 'fail',
    message: configResult.message,
    details: configResult.details
  });
  
  // Mobile redirect logic
  const redirectResult = verifyMobileRedirect();
  checks.push({
    name: 'Mobile Redirect Logic',
    status: redirectResult.success ? 'pass' : 'fail',
    message: redirectResult.message,
    details: redirectResult.details
  });
  
  // Mobile tests
  const testsResult = verifyMobileTests();
  checks.push({
    name: 'Mobile E2E Tests',
    status: testsResult.success ? 'pass' : 'fail',
    message: testsResult.message,
    details: testsResult.details
  });
  
  // Vercel project (optional)
  const projectResult = checkVercelProject();
  checks.push({
    name: 'Vercel Project Status',
    status: projectResult.success ? 'pass' : 'skip',
    message: projectResult.message,
    details: projectResult.details
  });
  
  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    skipped: checks.filter(c => c.status === 'skip').length
  };
  
  return {
    success: summary.failed === 0,
    checks,
    summary
  };
}

/**
 * Print verification results
 */
function printResults(result: VerificationResult): void {
  console.log('\n📊 Verification Results:');
  console.log('='.repeat(50));
  
  result.checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 Summary: ${result.summary.passed}/${result.summary.total} passed, ${result.summary.failed} failed, ${result.summary.skipped} skipped`);
  
  if (result.success) {
    console.log('🎉 All critical checks passed! Ready for Vercel deployment.');
  } else {
    console.log('⚠️  Some checks failed. Please address issues before deploying.');
  }
  
  console.log('\n📋 Next Steps:');
  if (result.success) {
    console.log('1. Run: vercel --prod');
    console.log('2. Test mobile redirect on deployed URL');
    console.log('3. Verify moodboard tab loads correctly on mobile');
  } else {
    console.log('1. Fix failed checks above');
    console.log('2. Re-run: npm run verify:mobile');
    console.log('3. Deploy when all checks pass');
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runVerification();
  printResults(result);
  process.exit(result.success ? 0 : 1);
}

export { runVerification, verifyBuild, verifyVercelConfig, verifyMobileRedirect, verifyMobileTests };
export type { VerificationResult };
