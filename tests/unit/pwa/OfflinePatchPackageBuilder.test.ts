import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import { OfflinePatchPackageBuilder, computePatchSignature } from '../../../scripts/pwa/offlinePatchPackageBuilder';
import type { OfflinePatchPackageBuilderConfig } from '@/service-worker/offlinePatchConfig';

const FIXED_DATE = new Date('2026-02-09T17:00:00.000Z');

describe('OfflinePatchPackageBuilder', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'offline-patch-tests-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('builds patch package with added, updated, and removed assets', async () => {
    const { config, manifestPaths, assetRoot } = await createConfig(tempDir, {
      baseline: [
        { url: 'assets/app.js', revision: 'a1' },
        { url: 'assets/old.png', revision: 'old' },
        { url: 'assets/shared.css', revision: '1.0.0' },
      ],
      target: [
        { url: 'assets/app.js', revision: 'a2' },
        { url: 'assets/shared.css', revision: '1.0.0' },
        { url: 'assets/new.png', revision: 'n1' },
      ],
    });

    await writeAsset(assetRoot, 'assets/app.js', 'console.log("updated")');
    await writeAsset(assetRoot, 'assets/shared.css', '.shared { color: #fff; }');
    await writeAsset(assetRoot, 'assets/new.png', 'binary');

    const builder = new OfflinePatchPackageBuilder(config, { now: () => FIXED_DATE, logger: silentLogger });
    const patch = await builder.buildPatch({
      ...config.patches[0],
      baselineManifestPath: manifestPaths.baseline,
      targetManifestPath: manifestPaths.target,
      assetRoot,
      outputDir: path.join(tempDir, 'out'),
    });

    expect(patch.patchId).toBe('pc-offline-test');
    expect(patch.stats.added).toBe(1);
    expect(patch.stats.updated).toBe(1);
    expect(patch.stats.removed).toBe(1);
    expect(patch.assets.added[0]).toMatchObject({ url: 'assets/new.png', revision: 'n1', exists: true });
    expect(patch.assets.updated[0]).toMatchObject({ url: 'assets/app.js', previousRevision: 'a1' });
    expect(patch.assets.removed[0]).toEqual({ url: 'assets/old.png', previousRevision: 'old' });
    expect(patch.integrity.signature).toEqual(
      computePatchSignature(
        {
          patchId: patch.patchId,
          fromVersion: patch.fromVersion,
          toVersion: patch.toVersion,
          assets: patch.assets,
          metadata: patch.metadata,
        },
        patch.integrity
      )
    );
  });

  it('marks missing assets and reports them in stats', async () => {
    const { config, manifestPaths, assetRoot } = await createConfig(tempDir, {
      baseline: [],
      target: [
        { url: 'assets/missing.dat', revision: 'm1' },
      ],
    });

    const builder = new OfflinePatchPackageBuilder(config, { now: () => FIXED_DATE, logger: silentLogger });
    const patch = await builder.buildPatch({
      ...config.patches[0],
      baselineManifestPath: manifestPaths.baseline,
      targetManifestPath: manifestPaths.target,
      assetRoot,
      outputDir: path.join(tempDir, 'out'),
    });

    expect(patch.stats.missingAssets).toBe(1);
    expect(patch.assets.added[0]).toMatchObject({ url: 'assets/missing.dat', exists: false });
  });
});

const silentLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  log: () => undefined,
} as const;

async function createConfig(
  tempDir: string,
  manifests: {
    baseline: Array<{ url: string; revision?: string }>;
    target: Array<{ url: string; revision?: string }>;
  }
): Promise<{ config: OfflinePatchPackageBuilderConfig; manifestPaths: { baseline: string; target: string }; assetRoot: string }> {
  const manifestPaths = {
    baseline: path.join(tempDir, 'baseline-manifest.json'),
    target: path.join(tempDir, 'target-manifest.json'),
  };

  await writeFile(manifestPaths.baseline, JSON.stringify(manifests.baseline, null, 2));
  await writeFile(manifestPaths.target, JSON.stringify(manifests.target, null, 2));

  const assetRoot = path.join(tempDir, 'assets');
  await mkdir(assetRoot, { recursive: true });

  const config: OfflinePatchPackageBuilderConfig = {
    version: 'test',
    manifestFormat: 'workbox',
    patches: [
      {
        patchId: 'pc-offline-test',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        baselineManifestPath: manifestPaths.baseline,
        targetManifestPath: manifestPaths.target,
        assetRoot,
        outputDir: path.join(tempDir, 'out'),
        includeFilters: ['^assets/'],
        excludeFilters: ['\\.map$'],
        metadata: { channel: 'test' },
        integrity: {
          algorithm: 'sha256',
          assetHashAlgorithm: 'sha256',
          salt: 'unit-test',
        },
      },
    ],
  };

  return { config, manifestPaths, assetRoot };
}

async function writeAsset(root: string, url: string, content: string): Promise<void> {
  const targetPath = path.join(root, url.replace(/^\/+/, ''));
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
}
