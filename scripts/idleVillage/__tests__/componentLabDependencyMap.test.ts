import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  COMPONENT_CATALOG,
  generateComponentReport,
  parseArgs,
  type ComponentCatalogEntry,
} from '../componentLabDependencyMap';

describe('componentLabDependencyMap', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'component-lab-deps-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  const writeFile = (relativePath: string, content: string): void => {
    const absolutePath = path.join(projectRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');
  };

  it('generates dependency reports with categorized imports, telemetry, and persistence keys', () => {
    writeFile(
      'src/ui/idleVillage/components/nightThreat/NightThreatHUD.tsx',
      `import { nightThreatVisuals } from '@/balancing/config/idleVillage/nightThreatVisualConfig';
import { useNightThreatTelemetry } from '@/ui/idleVillage/hooks/useNightThreatTelemetry';
import warningIcon from '@/ui/idleVillage/assets/night/warning.svg';
import { trackTelemetryEvent } from '@/analytics/telemetry';
import { PersistenceService } from '@/shared/persistence/PersistenceService';

const inlineEvent = 'component_lab_inline';

export function NightThreatHUD() {
  trackTelemetryEvent('component_lab_viewed');
  PersistenceService.saveData('night_fixture', {});
  useNightThreatTelemetry();

  return {
    warningIcon,
    nightThreatVisuals,
    inlineEvent,
  };
}
`
    );

    const report = generateComponentReport('night_threat', COMPONENT_CATALOG.night_threat, {
      projectRoot,
    });

    expect(report.analyzedFiles).toEqual([
      'src/ui/idleVillage/components/nightThreat/NightThreatHUD.tsx',
    ]);
    expect(report.dependencies.config).toContain(
      '@/balancing/config/idleVillage/nightThreatVisualConfig'
    );
    expect(report.dependencies.hooks).toContain(
      '@/ui/idleVillage/hooks/useNightThreatTelemetry'
    );
    expect(report.dependencies.assets).toContain('@/ui/idleVillage/assets/night/warning.svg');
    expect(report.dependencies.other).toContain('@/analytics/telemetry');
    expect(report.telemetryEvents).toEqual([
      'component_lab_inline',
      'component_lab_viewed',
    ]);
    expect(report.persistenceKeys).toEqual(['night_fixture']);
    expect(report.missingSources).toEqual([]);
  });

  it('flags missing sources when files do not exist', () => {
    const customEntry: ComponentCatalogEntry = {
      label: 'Broken Component',
      description: 'Testing missing files',
      sourcePaths: ['src/non-existent/Broken.tsx'],
      notes: [],
    };

    const report = generateComponentReport('broken', customEntry, { projectRoot });

    expect(report.analyzedFiles).toEqual([]);
    expect(report.missingSources).toEqual(['src/non-existent/Broken.tsx']);
  });

  it('parses CLI arguments with defaults and overrides', () => {
    const overrides = parseArgs(['--components=a,b', '--outputDir=custom/output']);
    expect(overrides.components).toEqual(['a', 'b']);
    expect(overrides.outputDir).toBe('custom/output');

    const defaults = parseArgs([]);
    expect(defaults.components).toEqual(Object.keys(COMPONENT_CATALOG));
    expect(defaults.outputDir.replace(/\\/g, '/')).toContain('tmp/component-lab-deps');
  });
});
