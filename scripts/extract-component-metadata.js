#!/usr/bin/env node

/**
 * Extract component metadata and generate .componentrc.json
 * Usage: node scripts/extract-component-metadata.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractComponents() {
  const componentsDir = path.join(process.cwd(), 'src/components/core');
  const components = [];

  console.log('🔍 Scanning components...\n');

  if (!fs.existsSync(componentsDir)) {
    console.warn('⚠️ src/components/core directory not found');
    return components;
  }

  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

  for (const file of files) {
    const componentName = file.replace('.tsx', '');
    const filePath = path.join(componentsDir, file);
    const source = fs.readFileSync(filePath, 'utf8');

    // Extract props interface
    const propsMatch = source.match(/interface\s+(\w+Props)\s*\{([^}]*)\}/);
    const props = [];

    if (propsMatch) {
      const propsContent = propsMatch[2];
      const propLines = propsContent.split('\n').filter(line => line.trim());

      for (const line of propLines) {
        const match = line.match(/(\w+)\s*\??:\s*(.+?)[;,]?$/);
        if (match) {
          props.push({
            name: match[1],
            type: match[2].trim(),
            required: !line.includes('?')
          });
        }
      }
    }

    // Extract exports
    const exports = [];
    const exportMatches = [...source.matchAll(/export\s+(?:const|function|class|default)?\s+(\w+)/g)];
    exportMatches.forEach(m => {
      if (m[1] && !exports.includes(m[1])) {
        exports.push(m[1]);
      }
    });

    const componentId = componentName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    components.push({
      id: componentId,
      name: componentName,
      paths: {
        component: path.relative(process.cwd(), filePath),
        page: `src/pages/minimal-${componentId}.tsx`,
        spec: `tests/e2e/minimal_slice_XX_${componentId}.spec.ts`
      },
      api: {
        props: props.length > 0 ? props : [{ name: 'TBD', type: 'unknown', required: true }],
        exports: exports.length > 0 ? exports : [componentName]
      },
      extracted: new Date().toISOString()
    });

    console.log(`✓ ${componentName}`);
  }

  return components;
}

async function main() {
  try {
    const components = await extractComponents();

    if (components.length === 0) {
      console.log('\n⚠️ No components found to extract');
      return;
    }

    const config = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      components,
      phases: {
        phase1: components.slice(0, 5).map(c => c.id),
        phase2: components.slice(5, 10).map(c => c.id),
        phase3: components.slice(10, 13).map(c => c.id),
        phase4: []
      },
      stats: {
        total: components.length,
        byPhase: {
          phase1: Math.min(5, components.length),
          phase2: Math.min(5, Math.max(0, components.length - 5)),
          phase3: Math.max(0, components.length - 10),
          phase4: 0
        }
      }
    };

    fs.writeFileSync(
      path.join(process.cwd(), '.componentrc.json'),
      JSON.stringify(config, null, 2)
    );

    console.log('\n✅ Component metadata extracted');
    console.log(`  Total components: ${components.length}`);
    console.log(`  Config saved: .componentrc.json`);
  } catch (error) {
    console.error('❌ Error extracting metadata:', error.message);
    process.exit(1);
  }
}

await main();
