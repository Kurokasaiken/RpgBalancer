#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class VerticalSliceLinter {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  error(message) {
    this.errors.push(`❌ ${message}`);
  }

  warn(message) {
    this.warnings.push(`⚠️ ${message}`);
  }

  async lint() {
    await this.checkComponentRegistry();
    await this.checkVersionConsistency();
    await this.checkDocumentationSync();
    await this.checkContractInheritance();
    await this.checkTestCoverage();

    return this.report();
  }

  async checkComponentRegistry() {
    const cwd = process.cwd();
    const registryPath = path.join(cwd, 'context/VERTICAL_SLICE_REFERENCE.md');

    if (!fs.existsSync(registryPath)) {
      this.warn('VERTICAL_SLICE_REFERENCE.md not found');
      return;
    }

    const registry = fs.readFileSync(registryPath, 'utf8');
    const componentsDir = path.join(cwd, 'src/components/core');

    if (!fs.existsSync(componentsDir)) {
      this.warn('src/components/core directory not found');
      return;
    }

    const components = fs.readdirSync(componentsDir)
      .filter(f => f.endsWith('.tsx'))
      .map(f => f.replace('.tsx', ''));

    let foundCount = 0;
    for (const component of components) {
      if (registry.includes(component)) {
        foundCount++;
      }
    }

    if (foundCount < components.length) {
      this.warn(`Only ${foundCount}/${components.length} components documented in VERTICAL_SLICE_REFERENCE.md`);
    }
  }

  async checkVersionConsistency() {
    const cwd = process.cwd();
    const frozenPath = path.join(cwd, 'context/VERTICAL_SLICE_FROZEN_VERSIONS.md');
    const changelogPath = path.join(cwd, 'CHANGELOG.md');

    if (!fs.existsSync(frozenPath)) {
      this.error('context/VERTICAL_SLICE_FROZEN_VERSIONS.md not found');
      return;
    }

    if (!fs.existsSync(changelogPath)) {
      this.warn('CHANGELOG.md not found');
      return;
    }

    const frozen = fs.readFileSync(frozenPath, 'utf8');
    const versionRegex = /version:\s*([\d.]+)/g;
    const frozenVersions = [...frozen.matchAll(versionRegex)];

    if (frozenVersions.length === 0) {
      this.warn('No versions found in VERTICAL_SLICE_FROZEN_VERSIONS.md');
    }
  }

  async checkDocumentationSync() {
    const cwd = process.cwd();
    const readmePath = path.join(cwd, 'README.md');

    if (!fs.existsSync(readmePath)) {
      this.error('README.md not found');
      return;
    }

    const readme = fs.readFileSync(readmePath, 'utf8');

    if (!readme.includes('VERTICAL_SLICE') && !readme.includes('minimal')) {
      this.warn('README.md should reference Vertical Slice architecture');
    }
  }

  async checkContractInheritance() {
    const cwd = process.cwd();
    const referenceFile = path.join(cwd, 'context/VERTICAL_SLICE_REFERENCE.md');

    if (!fs.existsSync(referenceFile)) {
      return;
    }

    const content = fs.readFileSync(referenceFile, 'utf8');

    if (!content.includes('immutable') && !content.includes('contract')) {
      this.warn('VERTICAL_SLICE_REFERENCE.md should define immutable contracts');
    }
  }

  async checkTestCoverage() {
    const cwd = process.cwd();
    const testsDir = path.join(cwd, 'tests/e2e');

    if (!fs.existsSync(testsDir)) {
      this.warn('tests/e2e directory not found');
      return;
    }

    const testFiles = fs.readdirSync(testsDir)
      .filter(f => f.startsWith('minimal_slice_') && f.endsWith('.spec.ts'));

    if (testFiles.length < 5) {
      this.warn(`Only ${testFiles.length} minimal slice test files found (expected 5+)`);
    }
  }

  report() {
    console.log('\n🔍 Vertical Slice Governance Lint Report\n');

    if (this.errors.length > 0) {
      console.log('Errors:');
      this.errors.forEach(e => console.log(`  ${e}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('Warnings:');
      this.warnings.forEach(w => console.log(`  ${w}`));
      console.log('');
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All governance checks passed\n');
      return 0;
    }

    const code = this.errors.length > 0 ? 1 : 0;
    console.log(`Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    return code;
  }
}

const linter = new VerticalSliceLinter();
const code = await linter.lint();
process.exit(code);
