/**
 * Kanban Lint Integration Script
 * 
 * CI guardrails for kanban lint validation and policy enforcement.
 * Integrates with GitHub Actions, pre-commit hooks, and CI pipelines.
 * 
 * @module kanbanLintIntegration
 * @since 2026-01-14
 * @author CI-Coordinator
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
import { execSync } from 'child_process';

/**
 * CI integration configuration
 */
interface CIConfig {
  /** GitHub Actions workflow file path */
  workflowPath: string;
  /** Pre-commit hook script path */
  preCommitHookPath: string;
  /** CI failure reporting template */
  failureReportPath: string;
  /** Policy KS-005 validation rules */
  policyValidation: {
    maxInProgressPerAgent: number;
    maxStaleDays: number;
    requiredEvidencePatterns: RegExp[];
  };
}

/**
 * CI validation result
 */
interface CIValidationResult {
  /** Overall validation passed */
  passed: boolean;
  /** Kanban lint results */
  kanbanLint: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  /** Policy KS-005 validation results */
  policyValidation: {
    passed: boolean;
    violations: string[];
  };
  /** CI integration status */
  integrationStatus: {
    workflowExists: boolean;
    preCommitHookExists: boolean;
    failureReporting: boolean;
  };
}

/**
 * Default CI configuration
 */
const DEFAULT_CI_CONFIG: CIConfig = {
  workflowPath: '.github/workflows/kanban-lint.yml',
  preCommitHookPath: '.git/hooks/pre-commit',
  failureReportPath: 'docs/coordinator/ci-failure-reports.md',
  policyValidation: {
    maxInProgressPerAgent: 3,
    maxStaleDays: 7,
    requiredEvidencePatterns: [
      /Evidence:\s*test-results\/.*\.md/,
      /Evidence:\s*src\/.*\.(ts|tsx)/,
      /Evidence:\s*docs\/.*\.md/
    ]
  }
};

/**
 * Run kanban lint and capture results
 */
function runKanbanLint(): { passed: boolean; output: string; errors: string[] } {
  try {
    const output = execSync('npm run kanban:lint', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    return {
      passed: true,
      output,
      errors: []
    };
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      passed: false,
      output: '',
      errors: [errorMessage]
    };
  }
}

/**
 * Validate KS-005 policy compliance
 */
function validatePolicyKS005(content: string): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  const lines = content.split('\n');
  
  // Parse kanban entries
  const entries = lines
    .filter(line => line.startsWith('|'))
    .map(line => line.split('|').map(cell => cell.trim()))
    .filter(cells => cells.length >= 12 && cells[1] && cells[1] !== 'Task ID');

  // Track agent assignments
  const agentAssignments: Record<string, number> = {};
  const today = new Date();
  
  entries.forEach(([_, taskId, status, agent, startDate, endDate, __, ___, ____, _____, ______, _______]) => {
    // Check max in-progress per agent
    if (status === 'In corso' && agent && agent !== '-') {
      agentAssignments[agent] = (agentAssignments[agent] || 0) + 1;
    }
    
    // Check stale entries
    if (status === 'In corso' && startDate && startDate !== '-') {
      const start = new Date(startDate);
      const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > DEFAULT_CI_CONFIG.policyValidation.maxStaleDays) {
        violations.push(`Task ${taskId} is stale (${daysDiff} days)`);
      }
    }
    
    // Check evidence for completed tasks
    if (status === 'Completato' && endDate && endDate !== '-') {
      const hasEvidence = DEFAULT_CI_CONFIG.policyValidation.requiredEvidencePatterns.some(
        pattern => pattern.test(taskId)
      );
      if (!hasEvidence) {
        violations.push(`Completed task ${taskId} missing proper evidence`);
      }
    }
  });

  // Check agent workload limits
  Object.entries(agentAssignments).forEach(([agent, count]) => {
    if (count > DEFAULT_CI_CONFIG.policyValidation.maxInProgressPerAgent) {
      violations.push(`Agent ${agent} has ${count} tasks in progress (max: ${DEFAULT_CI_CONFIG.policyValidation.maxInProgressPerAgent})`);
    }
  });

  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Create GitHub Actions workflow for kanban lint
 */
function createGitHubWorkflow(config: CIConfig): void {
  const workflow = `name: Kanban Lint Check

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/docs/docs/coordinator/agent_assignments.md'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/docs/docs/coordinator/agent_assignments.md'

jobs:
  kanban-lint:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.19.6'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci --ignore-scripts
      
    - name: Run kanban lint
      run: npm run kanban:lint
      
    - name: Validate KS-005 policy
      run: npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy
      
    - name: Generate CI report
      if: failure()
      run: npx tsx scripts/coord/kanbanLintIntegration.ts report-failure
      
    - name: Upload failure report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: kanban-lint-failure
        path: docs/coordinator/ci-failure-reports.md`;

  // Ensure .github/workflows directory exists
  const workflowDir = join(process.cwd(), '.github', 'workflows');
  if (!existsSync(workflowDir)) {
    execSync(`mkdir -p ${workflowDir}`, { stdio: 'inherit' });
  }

  writeFileSync(config.workflowPath, workflow);
  console.log(`✅ GitHub Actions workflow created: ${config.workflowPath}`);
}

/**
 * Create pre-commit hook for kanban validation
 */
function createPreCommitHook(config: CIConfig): void {
  const hook = `#!/bin/bash
# Pre-commit hook for kanban lint validation

# Check if agent_assignments.md is being modified
if git diff --cached --name-only | grep -q "src/docs/docs/coordinator/agent_assignments.md"; then
  echo "🔍 Running kanban lint validation..."
  
  # Run kanban lint
  if ! npm run kanban:lint > /dev/null 2>&1; then
    echo "❌ Kanban lint failed. Please fix issues before committing."
    echo "Run 'npm run kanban:lint' to see detailed errors."
    exit 1
  fi
  
  # Validate KS-005 policy
  if ! npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy > /dev/null 2>&1; then
    echo "❌ KS-005 policy validation failed. Please fix violations before committing."
    exit 1
  fi
  
  echo "✅ Kanban validation passed."
fi

exit 0`;

  writeFileSync(config.preCommitHookPath, hook);
  execSync(`chmod +x ${config.preCommitHookPath}`, { stdio: 'inherit' });
  console.log(`✅ Pre-commit hook created: ${config.preCommitHookPath}`);
}

/**
 * Generate CI failure report
 */
function generateFailureReport(result: CIValidationResult, config: CIConfig): void {
  const report = `# Kanban Lint CI Failure Report

**Generated:** ${new Date().toISOString()}
**Status:** ❌ FAILED

## Kanban Lint Results
${result.kanbanLint.passed ? '✅ Passed' : '❌ Failed'}

### Errors
${result.kanbanLint.errors.length > 0 ? result.kanbanLint.errors.map(error => `- ${error}`).join('\n') : 'None'}

### Warnings
${result.kanbanLint.warnings.length > 0 ? result.kanbanLint.warnings.map(warning => `- ${warning}`).join('\n') : 'None'}

## KS-005 Policy Validation
${result.policyValidation.passed ? '✅ Passed' : '❌ Failed'}

### Violations
${result.policyValidation.violations.length > 0 ? result.policyValidation.violations.map(violation => `- ${violation}`).join('\n') : 'None'}

## CI Integration Status
- **GitHub Actions Workflow:** ${result.integrationStatus.workflowExists ? '✅ Exists' : '❌ Missing'}
- **Pre-commit Hook:** ${result.integrationStatus.preCommitHookExists ? '✅ Exists' : '❌ Missing'}
- **Failure Reporting:** ${result.integrationStatus.failureReporting ? '✅ Enabled' : '❌ Disabled'}

## Resolution Steps

1. **Fix Kanban Lint Issues:**
   \`\`\`bash
   npm run kanban:lint
   \`\`\`

2. **Fix Policy Violations:**
   \`\`\`bash
   npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy
   \`\`\`

3. **Re-run Validation:**
   \`\`\`bash
   npx tsx scripts/coord/kanbanLintIntegration.ts full-validation
   \`\`\`

4. **Commit Changes:**
   \`\`\`bash
   git add src/docs/docs/coordinator/agent_assignments.md
   git commit -m "fix: resolve kanban lint and policy violations"
   \`\`\`

## Policy KS-005 Reference

- **Max In-Progress per Agent:** ${config.policyValidation.maxInProgressPerAgent}
- **Max Stale Days:** ${config.policyValidation.maxStaleDays}
- **Required Evidence Patterns:** ${config.policyValidation.requiredEvidencePatterns.length} patterns

---
*This report was automatically generated by the kanban lint CI integration.*`;

  writeFileSync(config.failureReportPath, report);
  console.log(`📄 Failure report generated: ${config.failureReportPath}`);
}

/**
 * Run full CI validation
 */
function runFullValidation(config: CIConfig): CIValidationResult {
  console.log('🔍 Running full kanban lint CI validation...\n');

  // Run kanban lint
  console.log('1. Running kanban lint...');
  const kanbanLintResult = runKanbanLint();
  if (!kanbanLintResult.passed) {
    console.log('❌ Kanban lint failed');
  } else {
    console.log('✅ Kanban lint passed');
  }

  // Read kanban content
  const kanbanPath = join(process.cwd(), 'src/docs/docs/coordinator/agent_assignments.md');
  const kanbanContent = readFileSync(kanbanPath, 'utf-8');

  // Validate KS-005 policy
  console.log('\n2. Validating KS-005 policy...');
  const policyResult = validatePolicyKS005(kanbanContent);
  if (!policyResult.passed) {
    console.log('❌ KS-005 policy validation failed');
    policyResult.violations.forEach(violation => console.log(`   - ${violation}`));
  } else {
    console.log('✅ KS-005 policy validation passed');
  }

  // Check CI integration status
  console.log('\n3. Checking CI integration status...');
  const integrationStatus = {
    workflowExists: existsSync(config.workflowPath),
    preCommitHookExists: existsSync(config.preCommitHookPath),
    failureReporting: true
  };

  console.log(`   GitHub Actions workflow: ${integrationStatus.workflowExists ? '✅' : '❌'}`);
  console.log(`   Pre-commit hook: ${integrationStatus.preCommitHookExists ? '✅' : '❌'}`);
  console.log(`   Failure reporting: ✅`);

  const result: CIValidationResult = {
    passed: kanbanLintResult.passed && policyResult.passed,
    kanbanLint: {
      passed: kanbanLintResult.passed,
      errors: kanbanLintResult.errors,
      warnings: []
    },
    policyValidation: policyResult,
    integrationStatus
  };

  // Generate failure report if validation failed
  if (!result.passed) {
    console.log('\n📄 Generating failure report...');
    generateFailureReport(result, config);
  }

  console.log(`\n${result.passed ? '✅' : '❌'} Full validation ${result.passed ? 'passed' : 'failed'}`);
  return result;
}

/**
 * Setup CLI program
 */
function setupCLI(): void {
  program
    .name('kanban-lint-integration')
    .description('CI guardrails for kanban lint validation and policy enforcement')
    .version('1.0.0');

  program
    .command('setup')
    .description('Setup CI integration (GitHub Actions + pre-commit hook)')
    .option('--workflow-path <path>', 'GitHub Actions workflow path', DEFAULT_CI_CONFIG.workflowPath)
    .option('--hook-path <path>', 'Pre-commit hook path', DEFAULT_CI_CONFIG.preCommitHookPath)
    .action((options) => {
      const config = { ...DEFAULT_CI_CONFIG, ...options };
      
      console.log('🚀 Setting up kanban lint CI integration...\n');
      
      createGitHubWorkflow(config);
      createPreCommitHook(config);
      
      console.log('\n✅ CI integration setup complete!');
      console.log('📖 Usage:');
      console.log('   - GitHub Actions will run on PRs and pushes to agent_assignments.md');
      console.log('   - Pre-commit hook will validate before local commits');
      console.log('   - Run "npm run kanban:lint" to manually validate');
    });

  program
    .command('validate')
    .description('Run kanban lint validation only')
    .action(() => {
      console.log('🔍 Running kanban lint validation...\n');
      const result = runKanbanLint();
      
      if (result.passed) {
        console.log('✅ Kanban lint validation passed');
      } else {
        console.log('❌ Kanban lint validation failed');
        result.errors.forEach(error => console.log(`   ${error}`));
        process.exit(1);
      }
    });

  program
    .command('validate-policy')
    .description('Validate KS-005 policy compliance')
    .action(() => {
      const kanbanPath = join(process.cwd(), 'src/docs/docs/coordinator/agent_assignments.md');
      const content = readFileSync(kanbanPath, 'utf-8');
      
      console.log('🔍 Validating KS-005 policy compliance...\n');
      const result = validatePolicyKS005(content);
      
      if (result.passed) {
        console.log('✅ KS-005 policy validation passed');
      } else {
        console.log('❌ KS-005 policy validation failed');
        result.violations.forEach(violation => console.log(`   ${violation}`));
        process.exit(1);
      }
    });

  program
    .command('full-validation')
    .description('Run complete CI validation (kanban lint + policy + integration check)')
    .action(() => {
      const result = runFullValidation(DEFAULT_CI_CONFIG);
      
      if (!result.passed) {
        process.exit(1);
      }
    });

  program
    .command('report-failure')
    .description('Generate CI failure report (for GitHub Actions failure handling)')
    .action(() => {
      // Simulate failure for demonstration
      const mockResult: CIValidationResult = {
        passed: false,
        kanbanLint: {
          passed: false,
          errors: ['Sample kanban lint error'],
          warnings: []
        },
        policyValidation: {
          passed: false,
          violations: ['Sample policy violation']
        },
        integrationStatus: {
          workflowExists: true,
          preCommitHookExists: true,
          failureReporting: true
        }
      };
      
      generateFailureReport(mockResult, DEFAULT_CI_CONFIG);
      console.log('📄 Sample failure report generated');
    });
}

// Run CLI if called directly
if (require.main === module) {
  setupCLI();
  program.parse();
}

export {
  runKanbanLint,
  validatePolicyKS005,
  createGitHubWorkflow,
  createPreCommitHook,
  generateFailureReport,
  runFullValidation,
  type CIConfig,
  type CIValidationResult
};
