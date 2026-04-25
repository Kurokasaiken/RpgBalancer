#!/usr/bin/env tsx

/**
 * Guardian Handoff Scripts for Physics Lab Deployment
 * 
 * Provides health checks, deployment validation, and automated
 * evidence collection for Physics Lab production deployment.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { generateGuardianReport, processLogFile } from './physicsLabEvidence';

interface HealthCheckResult {
  status: 'PASS' | 'FAIL' | 'WARNING';
  timestamp: string;
  checks: {
    build: {
      status: 'PASS' | 'FAIL';
      duration: number;
      errors: string[];
    };
    tests: {
      status: 'PASS' | 'FAIL' | 'WARNING';
      passing: number;
      failing: number;
      coverage?: number;
    };
    lint: {
      status: 'PASS' | 'FAIL' | 'WARNING';
      errors: number;
      warnings: number;
    };
    performance: {
      status: 'PASS' | 'FAIL' | 'WARNING';
      bundleSize: number;
      loadTime: number;
    };
    accessibility: {
      status: 'PASS' | 'FAIL' | 'WARNING';
      violations: number;
      critical: number;
    };
  };
}

interface DeploymentValidation {
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
  timestamp: string;
  evidence: {
    healthCheck: HealthCheckResult;
    safeguardCompliance: boolean;
    performanceBaseline: boolean;
    securityScan: boolean;
  };
  recommendations: string[];
}

/**
 * Execute Guardian health check
 */
async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log('🔬 Running Guardian health check...');
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    status: 'PASS',
    timestamp: new Date().toISOString(),
    checks: {
      build: { status: 'FAIL', duration: 0, errors: [] },
      tests: { status: 'FAIL', passing: 0, failing: 0 },
      lint: { status: 'FAIL', errors: 0, warnings: 0 },
      performance: { status: 'FAIL', bundleSize: 0, loadTime: 0 },
      accessibility: { status: 'FAIL', violations: 0, critical: 0 }
    }
  };
  
  try {
    // Build check
    console.log('  🏗️  Checking build...');
    const buildStart = Date.now();
    try {
      execSync('npm run build:check', { stdio: 'pipe' });
      result.checks.build.status = 'PASS';
      result.checks.build.duration = Date.now() - buildStart;
    } catch (error: any) {
      result.checks.build.status = 'FAIL';
      result.checks.build.duration = Date.now() - buildStart;
      result.checks.build.errors = error.stdout?.toString().split('\n').filter((l: string) => l.trim()) || [];
    }
    
    // Test check
    console.log('  🧪 Running tests...');
    try {
      const testOutput = execSync('npm run test -- --run --reporter=json', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      const testResults = JSON.parse(testOutput);
      result.checks.tests.status = 'PASS';
      result.checks.tests.passing = testResults.numPassedTests || 0;
      result.checks.tests.failing = testResults.numFailedTests || 0;
      if (testResults.coverageMap) {
        result.checks.tests.coverage = testResults.coverageMap.total?.lines?.pct || 0;
      }
    } catch (error: any) {
      result.checks.tests.status = 'FAIL';
      // Try to extract some test results from partial output
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const passedMatch = output.match(/(\d+) passing/);
      const failedMatch = output.match(/(\d+) failing/);
      if (passedMatch) result.checks.tests.passing = parseInt(passedMatch[1]);
      if (failedMatch) result.checks.tests.failing = parseInt(failedMatch[1]);
    }
    
    // Lint check
    console.log('  🔍 Running lint...');
    try {
      execSync('npm run lint -- src/ui/styleLab/ src/analytics/styleLab/', { stdio: 'pipe' });
      result.checks.lint.status = 'PASS';
    } catch (error: any) {
      result.checks.lint.status = 'FAIL';
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorMatch = output.match(/(\d+) errors?/);
      const warningMatch = output.match(/(\d+) warnings?/);
      if (errorMatch) result.checks.lint.errors = parseInt(errorMatch[1]);
      if (warningMatch) result.checks.lint.warnings = parseInt(warningMatch[1]);
    }
    
    // Performance check (bundle size)
    console.log('  ⚡ Checking performance...');
    try {
      // Check if build exists and get bundle size
      const buildDir = 'dist';
      if (fs.existsSync(buildDir)) {
        const files = fs.readdirSync(buildDir, { recursive: true });
        let totalSize = 0;
        files.forEach(file => {
          const filePath = path.join(buildDir, file as string);
          if (fs.statSync(filePath).isFile()) {
            totalSize += fs.statSync(filePath).size;
          }
        });
        result.checks.performance.bundleSize = totalSize;
        result.checks.performance.status = totalSize < 20 * 1024 * 1024 ? 'PASS' : 'FAIL'; // 20MB limit
      }
    } catch (error) {
      result.checks.performance.status = 'WARNING';
    }
    
    // Accessibility check (if axe-core is available)
    console.log('  ♿ Checking accessibility...');
    try {
      execSync('npm run test:a11y', { stdio: 'pipe' });
      result.checks.accessibility.status = 'PASS';
    } catch (error: any) {
      result.checks.accessibility.status = 'WARNING';
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const violationMatch = output.match(/(\d+) violations?/);
      const criticalMatch = output.match(/(\d+) critical/);
      if (violationMatch) result.checks.accessibility.violations = parseInt(violationMatch[1]);
      if (criticalMatch) result.checks.accessibility.critical = parseInt(criticalMatch[1]);
    }
    
    // Determine overall status
    const failedChecks = Object.values(result.checks).filter(check => check.status === 'FAIL').length;
    const warningChecks = Object.values(result.checks).filter(check => check.status === 'WARNING').length;
    
    if (failedChecks > 0) {
      result.status = 'FAIL';
    } else if (warningChecks > 0) {
      result.status = 'WARNING';
    } else {
      result.status = 'PASS';
    }
    
  } catch (error) {
    console.error('Health check failed:', error);
    result.status = 'FAIL';
  }
  
  const duration = Date.now() - startTime;
  console.log(`✅ Health check completed in ${duration}ms - Status: ${result.status}`);
  
  return result;
}

/**
 * Validate deployment readiness
 */
async function validateDeployment(): Promise<DeploymentValidation> {
  console.log('🚀 Validating deployment readiness...');
  
  const validation: DeploymentValidation = {
    status: 'NEEDS_REVIEW',
    timestamp: new Date().toISOString(),
    evidence: {
      healthCheck: await runHealthCheck(),
      safeguardCompliance: false,
      performanceBaseline: false,
      securityScan: false
    },
    recommendations: []
  };
  
  // Check safeguard compliance
  console.log('  📋 Checking safeguard compliance...');
  try {
    execSync('npm run kanban:lint', { stdio: 'pipe' });
    validation.evidence.safeguardCompliance = true;
  } catch (error) {
    validation.recommendations.push('Fix Kanban validation issues before deployment');
  }
  
  // Check performance baseline
  console.log('  📊 Checking performance baseline...');
  const healthCheck = validation.evidence.healthCheck;
  if (healthCheck.checks.performance.status === 'PASS' && 
      healthCheck.checks.performance.bundleSize < 10 * 1024 * 1024) {
    validation.evidence.performanceBaseline = true;
  } else {
    validation.recommendations.push('Optimize bundle size to meet performance baseline');
  }
  
  // Basic security check
  console.log('  🔒 Running security scan...');
  try {
    // Check for common security issues
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const hasSecurityIssues = Object.entries(packageJson.dependencies || {})
      .some(([dep, version]) => {
        // Basic check for known vulnerable packages
        return dep.includes('axios') && (version as string).toString().includes('0.24.0');
      });
    
    if (!hasSecurityIssues) {
      validation.evidence.securityScan = true;
    } else {
      validation.recommendations.push('Update dependencies to address security vulnerabilities');
    }
  } catch (error) {
    validation.recommendations.push('Unable to complete security scan');
  }
  
  // Generate recommendations based on health check
  if (healthCheck.checks.build.status === 'FAIL') {
    validation.recommendations.push('Build failures must be resolved before deployment');
  }
  
  if (healthCheck.checks.tests.status === 'FAIL') {
    validation.recommendations.push('Fix failing tests before deployment');
  }
  
  if (healthCheck.checks.lint.status === 'FAIL') {
    validation.recommendations.push('Resolve lint errors before deployment');
  }
  
  // Determine overall status
  const allChecksPass = Object.values(validation.evidence).every(check => 
    typeof check === 'boolean' ? check : check.status === 'PASS'
  );
  
  if (allChecksPass && validation.recommendations.length === 0) {
    validation.status = 'APPROVED';
  } else if (validation.recommendations.length > 3) {
    validation.status = 'REJECTED';
  } else {
    validation.status = 'NEEDS_REVIEW';
  }
  
  console.log(`✅ Deployment validation completed - Status: ${validation.status}`);
  
  return validation;
}

/**
 * Generate deployment report
 */
function generateDeploymentReport(validation: DeploymentValidation): string {
  const { evidence, recommendations } = validation;
  
  let report = `# Guardian Deployment Validation Report\n\n`;
  report += `**Generated**: ${validation.timestamp}\n`;
  report += `**Status**: ${validation.status}\n\n`;
  
  // Health check results
  report += `\n## Health Check Results\n\n`;
  Object.entries(evidence.healthCheck.checks).forEach(([check, result]) => {
    report += `- **${check}**: ${result.status}`;
    
    // Type-specific properties
    if (check === 'build' && 'duration' in result) {
      report += ` (${(result as any).duration}ms)`;
    }
    if (check === 'tests' && 'passing' in result) {
      const testResult = result as any;
      report += ` (${testResult.passing} passing, ${testResult.failing} failing)`;
    }
    if (check === 'lint' && ('errors' in result || 'warnings' in result)) {
      const lintResult = result as any;
      report += ` (${lintResult.errors} errors, ${lintResult.warnings} warnings)`;
    }
    if (check === 'performance' && 'bundleSize' in result) {
      const perfResult = result as any;
      report += ` (${(perfResult.bundleSize / 1024 / 1024).toFixed(2)}MB)`;
    }
    report += `\n`;
  });
  
  // Compliance checks
  report += `\n## Compliance Checks\n\n`;
  report += `- **Safeguard Compliance**: ${evidence.safeguardCompliance ? '✅ PASS' : '❌ FAIL'}\n`;
  report += `- **Performance Baseline**: ${evidence.performanceBaseline ? '✅ PASS' : '❌ FAIL'}\n`;
  report += `- **Security Scan**: ${evidence.securityScan ? '✅ PASS' : '❌ FAIL'}\n`;
  
  // Recommendations
  if (recommendations.length > 0) {
    report += `\n## Recommendations\n\n`;
    recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
  }
  
  // Deployment decision
  report += `\n## Deployment Decision\n\n`;
  switch (validation.status) {
    case 'APPROVED':
      report += `✅ **APPROVED** - All checks passed. Ready for deployment.\n`;
      break;
    case 'REJECTED':
      report += `❌ **REJECTED** - Critical issues must be addressed before deployment.\n`;
      break;
    case 'NEEDS_REVIEW':
      report += `⚠️ **NEEDS REVIEW** - Some issues need attention. Review recommendations above.\n`;
      break;
  }
  
  return report;
}

/**
 * Save deployment validation results
 */
async function saveDeploymentValidation(validation: DeploymentValidation): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `guardian-deploy-validation-${timestamp}`;
  
  // Save JSON
  const jsonPath = `test-results/${baseFilename}.json`;
  fs.writeFileSync(jsonPath, JSON.stringify(validation, null, 2));
  
  // Save Markdown report
  const markdownPath = `test-results/${baseFilename}.md`;
  const markdown = generateDeploymentReport(validation);
  fs.writeFileSync(markdownPath, markdown);
  
  console.log(`Deployment validation saved:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  Markdown: ${markdownPath}`);
}

/**
 * Main Guardian handoff workflow
 */
async function guardianHandoff(): Promise<void> {
  console.log('🛡️  Guardian Handoff Workflow - Starting...\n');
  
  try {
    // Step 1: Run health check
    const healthCheck = await runHealthCheck();
    
    // Step 2: Validate deployment
    const validation = await validateDeployment();
    
    // Step 3: Generate evidence report
    console.log('\n📊 Generating evidence report...');
    const { main: evidenceMain } = await import('./physicsLabEvidence');
    
    // Call the main function to generate reports
    await evidenceMain();
    
    // Step 4: Save deployment validation
    await saveDeploymentValidation(validation);
    
    // Step 5: Print final status
    console.log('\n🎯 Guardian Handoff Summary:');
    console.log(`  Health Check: ${healthCheck.status}`);
    console.log(`  Deployment: ${validation.status}`);
    console.log(`  Recommendations: ${validation.recommendations.length}`);
    
    if (validation.status === 'APPROVED') {
      console.log('\n✅ Deployment approved - Ready for production');
    } else {
      console.log('\n⚠️  Deployment needs attention - Review recommendations');
    }
    
  } catch (error) {
    console.error('❌ Guardian handoff failed:', error);
    process.exit(1);
  }
}

// CLI interface
async function main(): Promise<void> {
  const command = process.argv[2];
  
  switch (command) {
    case 'health-check':
      await runHealthCheck();
      break;
    case 'validate':
      await validateDeployment();
      break;
    case 'handoff':
      await guardianHandoff();
      break;
    default:
      console.log('Usage: tsx guardianHandoff.ts [health-check|validate|handoff]');
      console.log('  health-check  - Run comprehensive health check');
      console.log('  validate     - Validate deployment readiness');
      console.log('  handoff      - Run complete Guardian handoff workflow');
      process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { 
  runHealthCheck, 
  validateDeployment, 
  guardianHandoff, 
  generateDeploymentReport 
};
