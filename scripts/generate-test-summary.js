#!/usr/bin/env node

/**
 * Generate test summary from Playwright JSON results
 * Usage: node scripts/generate-test-summary.js
 */

const fs = require('fs');
const path = require('path');

const resultsFile = path.join(process.cwd(), 'test-results.json');

if (!fs.existsSync(resultsFile)) {
  console.warn('⚠️ test-results.json not found - skipping summary generation');
  process.exit(0);
}

try {
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

  const summary = {
    total: results.stats.expected,
    passed: results.stats.expected - results.stats.unexpected - results.stats.skipped,
    failed: results.stats.unexpected,
    skipped: results.stats.skipped,
    duration: results.stats.duration,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'test-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('✓ Test Summary Generated');
  console.log(`  Total:   ${summary.total}`);
  console.log(`  Passed:  ${summary.passed} ✓`);
  console.log(`  Failed:  ${summary.failed} ${summary.failed > 0 ? '✗' : ''}`);
  console.log(`  Skipped: ${summary.skipped}`);
  console.log(`  Duration: ${(summary.duration / 1000).toFixed(2)}s`);

  // Exit with error if tests failed
  if (summary.failed > 0) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error generating test summary:', error.message);
  process.exit(1);
}
