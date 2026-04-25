#!/usr/bin/env node

/**
 * Agent Task Completion Safeguard Script
 * 
 * This script MUST be run before any agent marks a task as completed.
 * It enforces all safeguard checks and prevents completion if any check fails.
 * 
 * Usage: node scripts/agentComplete.js <TASK_ID>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TASK_ID = process.argv[2];

if (!TASK_ID) {
  console.error('❌ Usage: node scripts/agentComplete.js <TASK_ID>');
  process.exit(1);
}

console.log(`🔍 Running safeguard suite for task ${TASK_ID}...`);

const safeguardSteps = [
  {
    name: 'TypeScript Build',
    command: 'npm run build',
    critical: true,
    description: 'All TypeScript errors must be resolved'
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    critical: true,
    description: 'All lint warnings must be resolved'
  },
  {
    name: 'Unit Tests',
    command: 'npm run test -- --run',
    critical: true,
    description: 'All unit tests must pass'
  },
  {
    name: 'Kanban Validation',
    command: 'npm run kanban:lint',
    critical: true,
    description: 'Kanban must be properly formatted'
  }
];

let allPassed = true;
const results = [];

for (const step of safeguardSteps) {
  console.log(`\n📋 Running: ${step.name}`);
  console.log(`📝 Description: ${step.description}`);
  
  try {
    const startTime = Date.now();
    const output = execSync(step.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${step.name} - PASSED (${duration}ms)`);
    results.push({
      step: step.name,
      status: 'PASSED',
      duration,
      output: output.trim()
    });
    
  } catch (error) {
    console.error(`❌ ${step.name} - FAILED`);
    console.error(`📄 Error output:\n${error.stdout || error.stderr}`);
    
    results.push({
      step: step.name,
      status: 'FAILED',
      output: error.stdout || error.stderr,
      critical: step.critical
    });
    
    if (step.critical) {
      allPassed = false;
    }
  }
}

// Generate evidence log
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceLog = {
  taskId: TASK_ID,
  timestamp: new Date().toISOString(),
  overallStatus: allPassed ? 'PASSED' : 'FAILED',
  results,
  nodeVersion: process.version,
  platform: process.platform,
  agentCompleteScript: 'v1.0.0'
};

// Save evidence log
const evidenceDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const evidenceFile = path.join(evidenceDir, `${TASK_ID}-safeguard-${timestamp}.log`);
fs.writeFileSync(evidenceFile, JSON.stringify(evidenceLog, null, 2));

console.log(`\n📄 Evidence log saved: ${evidenceFile}`);

if (allPassed) {
  console.log(`\n🎉 SAFEGUARD SUITE PASSED`);
  console.log(`✅ Task ${TASK_ID} can be marked as COMPLETED`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Update Kanban row to "Completato"`);
  console.log(`2. Include evidence: test-results/${TASK_ID}-safeguard-${timestamp}.log`);
  console.log(`3. Run npm run kanban:lint to verify`);
  process.exit(0);
} else {
  console.log(`\n🚨 SAFEGUARD SUITE FAILED`);
  console.log(`❌ Task ${TASK_ID} CANNOT be marked as completed`);
  console.log(`\n🔧 Required actions:`);
  
  const failedSteps = results.filter(r => r.status === 'FAILED' && r.critical);
  failedSteps.forEach(step => {
    console.log(`- Fix ${step.step} issues`);
  });
  
  console.log(`\n📋 After fixing:`);
  console.log(`1. Re-run: node scripts/agentComplete.js ${TASK_ID}`);
  console.log(`2. Only proceed if all safeguards pass`);
  
  process.exit(1);
}
