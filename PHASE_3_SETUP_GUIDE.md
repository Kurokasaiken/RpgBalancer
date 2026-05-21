# Phase 3: Version Lock Files & Component Metadata

**Phase:** 3 of 4  
**Timeline:** 2026-05-22 to 2026-05-23  
**Status:** Planning & Preparation

---

## 🎯 Phase 3 Overview

Phase 3 creates an immutable audit trail for each component, ensuring version integrity and preventing unauthorized modifications.

### Key Deliverables
- 📄 Component metadata extraction script
- 🔐 Version lock file generation (VERTICAL_SLICE_LOCKED.json)
- 📋 Hash verification system
- 📊 Component inventory automation
- 🔍 Audit trail tracking

### Problems Solved
- ✅ Prevents version number lies (components claiming to be v1.0.0 but changed)
- ✅ Creates audit trail of all changes
- ✅ Automatic component registry generation
- ✅ Hash-based integrity verification
- ✅ Breaking change detection

---

## 📄 File Structures

### 1. VERTICAL_SLICE_LOCKED.json (Immutable Record)

Generated file that locks all component versions with hashes:

```json
{
  "generated": "2026-05-23T14:30:00Z",
  "phase": 1,
  "components": [
    {
      "name": "PGCard",
      "version": "1.0.0",
      "released": "2026-05-20T00:00:00Z",
      "status": "stable",
      "hash": {
        "types": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        "implementation": "q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
        "tests": "f6g7h8i9j0k1l2m3n4o5p6a1b2c3d4e5"
      },
      "api": {
        "props": [
          {
            "name": "id",
            "type": "string",
            "required": true
          },
          {
            "name": "character",
            "type": "Character",
            "required": true
          }
        ],
        "exports": ["PGCard"]
      },
      "tests": {
        "total": 45,
        "passing": 45,
        "coverage": 98.5
      },
      "file-paths": {
        "component": "src/components/core/PGCard.tsx",
        "spec": "tests/e2e/minimal_slice_01_pgcard.spec.ts",
        "page": "src/pages/minimal-pgcard.tsx"
      },
      "audit-trail": [
        {
          "date": "2026-05-20",
          "action": "freeze",
          "hash-before": "original",
          "hash-after": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
          "reason": "Phase 1 Release"
        }
      ]
    }
  ],
  "integrity": {
    "total-hash": "checksum-of-all-components",
    "verified": true,
    "last-verified": "2026-05-23T14:30:00Z"
  }
}
```

### 2. .componentrc.json (Component Configuration)

Centralized component registry:

```json
{
  "components": [
    {
      "id": "pgcard",
      "name": "PGCard",
      "description": "Player Grid Card component",
      "version": "1.0.0",
      "phase": 1,
      "paths": {
        "component": "src/components/core/PGCard.tsx",
        "page": "src/pages/minimal-pgcard.tsx",
        "spec": "tests/e2e/minimal_slice_01_pgcard.spec.ts"
      },
      "api": {
        "props": [
          {
            "name": "id",
            "type": "string",
            "required": true,
            "description": "Unique component identifier"
          }
        ]
      }
    }
  ],
  "phases": {
    "phase1": ["pgcard", "activity-card", "theater-view"],
    "phase2": ["active-hud", "activity-slot"],
    "phase3": [],
    "phase4": []
  }
}
```

---

## 🔧 Scripts to Create

### script-1: extract-component-metadata.js

```javascript
#!/usr/bin/env node
/**
 * Extract component metadata and generate .componentrc.json
 * Usage: node scripts/extract-component-metadata.js
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

async function extractComponents() {
  const componentsDir = path.join(process.cwd(), 'src/components/core');
  const components = [];

  // Scan all component files
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

  for (const file of files) {
    const filePath = path.join(componentsDir, file);
    const source = fs.readFileSync(filePath, 'utf8');

    // Parse TypeScript
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true
    );

    // Extract props interface
    const props = extractPropsFromTypeScript(sourceFile);

    // Extract exports
    const exports = extractExportsFromTypeScript(sourceFile);

    components.push({
      id: file.replace('.tsx', '').toLowerCase().replace(/([A-Z])/g, '-$1'),
      name: file.replace('.tsx', ''),
      paths: {
        component: path.relative(process.cwd(), filePath),
        page: `src/pages/minimal-${file.replace('.tsx', '').toLowerCase()}.tsx`,
        spec: `tests/e2e/minimal_slice_XX_${file.replace('.tsx', '').toLowerCase()}.spec.ts`
      },
      api: {
        props: props,
        exports: exports
      }
    });
  }

  return components;
}

async function main() {
  try {
    const components = await extractComponents();
    
    const config = {
      components,
      phases: {
        phase1: components.slice(0, 5).map(c => c.id),
        phase2: components.slice(5, 10).map(c => c.id),
        phase3: components.slice(10, 13).map(c => c.id),
        phase4: []
      },
      generated: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(process.cwd(), '.componentrc.json'),
      JSON.stringify(config, null, 2)
    );

    console.log('✓ Component metadata extracted');
    console.log(`  Total components: ${components.length}`);
    console.log(`  Config saved: .componentrc.json`);
  } catch (error) {
    console.error('❌ Error extracting metadata:', error.message);
    process.exit(1);
  }
}

main();
```

### script-2: generate-version-lock.js

```javascript
#!/usr/bin/env node
/**
 * Generate immutable version lock file with hashes
 * Usage: node scripts/generate-version-lock.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function generateVersionLock() {
  const componentrc = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '.componentrc.json'), 'utf8')
  );

  const frozenVersions = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'context/VERTICAL_SLICE_FROZEN_VERSIONS.md'),
      'utf8'
    )
  );

  const locked = {
    generated: new Date().toISOString(),
    phase: 1,
    components: componentrc.components.map(component => {
      const componentPath = path.join(process.cwd(), component.paths.component);
      const specPath = path.join(process.cwd(), component.paths.spec);

      // Get version from VERTICAL_SLICE_FROZEN_VERSIONS.md
      const versionMatch = frozenVersions.match(
        new RegExp(`${component.name}.*?version: ([\\d.]+)`, 's')
      );
      const version = versionMatch ? versionMatch[1] : '0.1.0';

      return {
        name: component.name,
        version: version,
        hash: {
          component: calculateHash(componentPath),
          spec: calculateHash(specPath)
        },
        api: component.api,
        files: component.paths,
        audit: [
          {
            date: new Date().toISOString(),
            action: 'lock',
            reason: 'Phase 3 Version Lock',
            author: 'semantic-release'
          }
        ]
      };
    }),
    integrity: {
      total: crypto.createHash('sha256')
        .update(JSON.stringify(componentrc.components))
        .digest('hex'),
      verified: true,
      timestamp: new Date().toISOString()
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'VERTICAL_SLICE_LOCKED.json'),
    JSON.stringify(locked, null, 2)
  );

  console.log('✓ Version lock file generated');
  console.log(`  Components locked: ${locked.components.length}`);
  console.log(`  File: VERTICAL_SLICE_LOCKED.json`);
  console.log(`  Integrity hash: ${locked.integrity.total}`);
}

generateVersionLock().catch(error => {
  console.error('❌ Error generating version lock:', error.message);
  process.exit(1);
});
```

### script-3: verify-version-integrity.js

```javascript
#!/usr/bin/env node
/**
 * Verify component version integrity
 * Usage: node scripts/verify-version-integrity.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function verifyIntegrity() {
  const lockFile = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'VERTICAL_SLICE_LOCKED.json'), 'utf8')
  );

  let allValid = true;

  console.log('🔍 Verifying component integrity...\n');

  for (const component of lockFile.components) {
    const componentPath = path.join(process.cwd(), component.files.component);
    const specPath = path.join(process.cwd(), component.files.spec);

    const currentComponentHash = calculateHash(componentPath);
    const currentSpecHash = calculateHash(specPath);

    const componentValid = currentComponentHash === component.hash.component;
    const specValid = currentSpecHash === component.hash.spec;

    console.log(`${component.name} v${component.version}`);
    console.log(`  Component: ${componentValid ? '✓' : '✗'} ${componentValid ? '' : '(MODIFIED)'}`);
    console.log(`  Tests: ${specValid ? '✓' : '✗'} ${specValid ? '' : '(MODIFIED)'}`);

    if (!componentValid || !specValid) {
      allValid = false;
      console.log(`  ⚠️  Hash mismatch detected!`);
    }
    console.log('');
  }

  if (allValid) {
    console.log('✅ All components verified - integrity check passed');
    process.exit(0);
  } else {
    console.log('❌ Integrity check failed - unauthorized modifications detected');
    process.exit(1);
  }
}

verifyIntegrity();
```

---

## 📦 Integration with package.json

Add these scripts to package.json:

```json
{
  "scripts": {
    "meta:extract": "node scripts/extract-component-metadata.js",
    "meta:lock": "node scripts/generate-version-lock.js",
    "meta:verify": "node scripts/verify-version-integrity.js",
    "meta:all": "npm run meta:extract && npm run meta:lock && npm run meta:verify"
  }
}
```

---

## 🔄 Workflow: Lock & Verify

```
Developer finishes component
        ↓
npm run meta:extract
  ↓ Scans source code
  ↓ Extracts props, types, exports
  ↓ Generates .componentrc.json
        ↓
npm run meta:lock
  ↓ Reads .componentrc.json
  ↓ Calculates SHA-256 hashes
  ↓ Generates VERTICAL_SLICE_LOCKED.json
        ↓
npm run meta:verify
  ↓ Re-calculates current hashes
  ↓ Compares with lock file
  ↓ Reports integrity status
        ↓
Version locked - no modifications possible
```

---

## 🎯 Phase 3 Implementation Steps

### Step 1: Create Scripts (Today)
```bash
# Create metadata extraction script
# Create version lock generation script
# Create integrity verification script
```

### Step 2: Test Scripts Locally (Tomorrow)
```bash
npm run meta:extract    # Should create .componentrc.json
npm run meta:lock       # Should create VERTICAL_SLICE_LOCKED.json
npm run meta:verify     # Should pass (no modifications)
```

### Step 3: Integrate with CI/CD (Day 3)
```bash
# Add to GitHub Actions workflow
# Run on every commit
# Block push if integrity fails
```

### Step 4: Document for Team (Day 3)
```bash
# Add to QUICK_REFERENCE.md
# Train team on integrity checking
# Share audit trail reports
```

---

## 📊 Expected Output Files

### .componentrc.json
```
~500 bytes
Contains: Component locations, props, exports, phases
Generated: Auto (npm run meta:extract)
```

### VERTICAL_SLICE_LOCKED.json
```
~2-5 KB
Contains: Hashes, versions, audit trails, integrity check
Generated: Auto (npm run meta:lock)
Updated: After each release
```

### VERTICAL_SLICE_FROZEN_VERSIONS.md
```
~3-5 KB (already created in Phase 1)
Contains: Human-readable version info
Updated: Manually or auto
```

---

## 🔐 Security Benefits

1. **Hash Verification:** Detects unauthorized changes immediately
2. **Audit Trail:** Records who changed what and when
3. **Version Integrity:** Prevents version number lies
4. **Breaking Change Detection:** Automatically identifies incompatible changes
5. **Release Integrity:** Ensures released versions never change

---

## 📈 Metrics Phase 3 Provides

- **Component Change Frequency:** How often each component changes
- **Breaking Change Rate:** How many breaking changes per phase
- **Version Stability:** How long components stay at v1.0.0
- **Test Coverage:** Tracks test count per component
- **Audit Trail:** Complete history of all modifications

---

## 🚀 Phase 3 Complete When

- [ ] `extract-component-metadata.js` created & working
- [ ] `generate-version-lock.js` created & working
- [ ] `verify-version-integrity.js` created & working
- [ ] Scripts added to package.json
- [ ] `.componentrc.json` generated
- [ ] `VERTICAL_SLICE_LOCKED.json` generated
- [ ] Integrity verification passes
- [ ] GitHub Actions integrated with meta:verify

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| [VERTICAL_SLICE_REFERENCE.md](./context/VERTICAL_SLICE_REFERENCE.md) | Governance rules |
| [VERTICAL_SLICE_FROZEN_VERSIONS.md](./context/VERTICAL_SLICE_FROZEN_VERSIONS.md) | Version registry |
| [PHASE_2_SETUP_GUIDE.md](./PHASE_2_SETUP_GUIDE.md) | Semantic versioning |
| [PHASE_4_SETUP_GUIDE.md](./PHASE_4_SETUP_GUIDE.md) | Governance enforcement |

---

**Phase 3 Target Completion:** 2026-05-23  
**Status:** Ready to implement  
**Next Phase:** Phase 4 - Governance Enforcement (2026-05-23)
