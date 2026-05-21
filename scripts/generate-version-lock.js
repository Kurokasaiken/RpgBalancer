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
    console.warn(`⚠️ Could not hash ${filePath}: ${e.message}`);
    return 'not-found';
  }
}

async function generateVersionLock() {
  const componentrcPath = path.join(process.cwd(), '.componentrc.json');
  const frozenVersionsPath = path.join(process.cwd(), 'context/VERTICAL_SLICE_FROZEN_VERSIONS.md');

  if (!fs.existsSync(componentrcPath)) {
    console.log('ℹ️ .componentrc.json not found. Run extract-component-metadata.js first.');
    return;
  }

  console.log('🔐 Generating version lock file...\n');

  const componentrc = JSON.parse(fs.readFileSync(componentrcPath, 'utf8'));
  let frozenVersions = {};

  if (fs.existsSync(frozenVersionsPath)) {
    const frozenContent = fs.readFileSync(frozenVersionsPath, 'utf8');
    const versionRegex = /name:\s*(\w+).*?version:\s*([\d.]+)/gs;
    let match;
    while ((match = versionRegex.exec(frozenContent)) !== null) {
      frozenVersions[match[1]] = match[2];
    }
  }

  const locked = {
    generated: new Date().toISOString(),
    phase: 1,
    components: componentrc.components.map(component => {
      const componentPath = path.join(process.cwd(), component.paths.component);
      const pagePath = path.join(process.cwd(), component.paths.page);

      const version = frozenVersions[component.name] || '0.1.0';
      const status = version.startsWith('1.') ? 'stable' : 'wip';

      return {
        name: component.name,
        version: version,
        status: status,
        released: version.startsWith('1.') ? new Date().toISOString() : null,
        hash: {
          component: calculateHash(componentPath),
          page: calculateHash(pagePath)
        },
        api: component.api,
        files: component.paths,
        audit: [
          {
            date: new Date().toISOString(),
            action: 'lock',
            reason: 'Phase 3 Version Lock Generation',
            author: 'vertical-slice-cli'
          }
        ]
      };
    }),
    integrity: {
      total: crypto.createHash('sha256')
        .update(JSON.stringify(componentrc.components.map(c => c.name)))
        .digest('hex'),
      verified: true,
      timestamp: new Date().toISOString()
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'VERTICAL_SLICE_LOCKED.json'),
    JSON.stringify(locked, null, 2)
  );

  console.log('✅ Version lock file generated');
  console.log(`  Components locked: ${locked.components.length}`);
  console.log(`  File: VERTICAL_SLICE_LOCKED.json`);
  console.log(`  Integrity hash: ${locked.integrity.total.substring(0, 16)}...`);
  console.log(`  Timestamp: ${locked.generated}`);
}

await generateVersionLock().catch(error => {
  console.error('❌ Error generating version lock:', error.message);
  process.exit(1);
});
