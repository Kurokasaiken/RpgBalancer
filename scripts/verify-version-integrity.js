#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function calculateHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return 'not-found';
  }
}

async function verifyIntegrity() {
  const lockFilePath = path.join(process.cwd(), 'VERTICAL_SLICE_LOCKED.json');

  if (!fs.existsSync(lockFilePath)) {
    console.log('⚠️ VERTICAL_SLICE_LOCKED.json not found');
    console.log('   Run: node scripts/generate-version-lock.js');
    return;
  }

  const lockFile = JSON.parse(fs.readFileSync(lockFilePath, 'utf8'));

  let allValid = true;
  let checkedCount = 0;
  let validCount = 0;

  console.log('🔍 Verifying component integrity...\n');

  for (const component of lockFile.components) {
    const componentPath = path.join(process.cwd(), component.files.component);
    const pagePath = path.join(process.cwd(), component.files.page);

    const currentComponentHash = calculateHash(componentPath);
    const currentPageHash = calculateHash(pagePath);

    const componentValid = currentComponentHash === component.hash.component;
    const pageValid = currentPageHash === component.hash.page;

    checkedCount++;

    console.log(`${component.name} v${component.version}`);
    console.log(`  Component: ${componentValid ? '✓' : '✗'} ${componentValid ? '' : '(MODIFIED)'}`);
    console.log(`  Page: ${pageValid ? '✓' : '✗'} ${pageValid ? '' : '(MODIFIED)'}`);

    if (componentValid && pageValid) {
      validCount++;
    } else {
      allValid = false;
      console.log(`  ⚠️  Hash mismatch detected!`);
    }
    console.log('');
  }

  console.log(`\n📊 Summary: ${validCount}/${checkedCount} components verified`);

  if (allValid) {
    console.log('✅ All components verified - integrity check passed');
    return 0;
  } else {
    console.log('❌ Integrity check failed - unauthorized modifications detected');
    return 1;
  }
}

const code = await verifyIntegrity();
process.exit(code || 0);
