import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  OFFLINE_PATCH_PACKAGE_CONFIG,
  OfflinePatchDefinition,
  OfflinePatchIntegrityConfig,
  OfflinePatchPackageBuilderConfig,
  OfflinePatchPackageBuilderConfigSchema,
} from '../../service-worker/offlinePatchConfig';

/**
 * Workbox precache manifest entry.
 */
interface WorkboxManifestEntry {
  url: string;
  revision?: string;
  integrity?: string;
}

/**
 * Asset information written inside the patch package for added/updated files.
 */
export interface PatchAssetRecord {
  url: string;
  revision?: string;
  hash?: string;
  size?: number;
  exists: boolean;
}

/**
 * Metadata for removed assets (no file hash available).
 */
export interface PatchRemovedAssetRecord {
  url: string;
  previousRevision?: string;
}

/**
 * Metadata for updated assets (references previous revision).
 */
export interface PatchUpdatedAssetRecord extends PatchAssetRecord {
  previousRevision?: string;
}

/**
 * Asset delta collection written to disk.
 */
export interface OfflinePatchAssets {
  added: PatchAssetRecord[];
  removed: PatchRemovedAssetRecord[];
  updated: PatchUpdatedAssetRecord[];
}

/**
 * Patch integrity payload used to compute deterministic signatures.
 */
export interface PatchSignaturePayload {
  patchId: string;
  fromVersion: string;
  toVersion: string;
  assets: OfflinePatchAssets;
  metadata: Record<string, unknown>;
}

/**
 * Resulting patch package structure persisted as JSON.
 */
export interface OfflinePatchPackage {
  patchId: string;
  fromVersion: string;
  toVersion: string;
  manifestFormat: OfflinePatchPackageBuilderConfig['manifestFormat'];
  generatedAt: string;
  metadata: Record<string, unknown>;
  stats: {
    totalManifestEntries: number;
    consideredAssets: number;
    added: number;
    removed: number;
    updated: number;
    missingAssets: number;
    totalSizeBytes: number;
  };
  assets: OfflinePatchAssets;
  integrity: OfflinePatchIntegrityConfig & { signature: string };
}

/**
 * Compute a deterministic signature over the patch contents.
 */
export function computePatchSignature(payload: PatchSignaturePayload, integrity: OfflinePatchIntegrityConfig): string {
  const hash = createHash(integrity.algorithm);
  hash.update(
    JSON.stringify({
      patchId: payload.patchId,
      fromVersion: payload.fromVersion,
      toVersion: payload.toVersion,
      assets: payload.assets,
      metadata: payload.metadata,
      salt: integrity.salt ?? '',
    })
  );
  return hash.digest('hex');
}

interface BuilderOptions {
  now?: () => Date;
  logger?: Pick<typeof console, 'info' | 'warn' | 'error' | 'log'>;
}

interface ManifestMaps {
  baseline: Map<string, WorkboxManifestEntry>;
  target: Map<string, WorkboxManifestEntry>;
  totalEntries: number;
  consideredEntries: number;
}

/**
 * Offline patch package builder responsible for diffing manifests and producing signed patch bundles.
 */
export class OfflinePatchPackageBuilder {
  private readonly nowFn: () => Date;
  private readonly logger: Pick<typeof console, 'info' | 'warn' | 'error' | 'log'>;

  constructor(private readonly config: OfflinePatchPackageBuilderConfig, options: BuilderOptions = {}) {
    this.nowFn = options.now ?? (() => new Date());
    this.logger = options.logger ?? console;
  }

  /**
   * Generate every configured patch (or a subset selected via options).
   */
  async buildAll(opts: { onlyPatchId?: string } = {}): Promise<OfflinePatchPackage[]> {
    const definitions = opts.onlyPatchId
      ? this.config.patches.filter(patch => patch.patchId === opts.onlyPatchId)
      : this.config.patches;

    if (definitions.length === 0) {
      throw new Error('Nessuna patch configurata. Aggiorna service-worker/offlinePatchConfig.ts prima di eseguire il builder.');
    }

    const results: OfflinePatchPackage[] = [];

    for (const definition of definitions) {
      this.logger.info(`\n🔧 Generating patch: ${definition.patchId}`);
      const patch = await this.buildPatch(definition);
      results.push(patch);
      this.logger.info(
        `✓ Patch ${definition.patchId} pronta – Added: ${patch.assets.added.length}, Updated: ${patch.assets.updated.length}, Removed: ${patch.assets.removed.length}`
      );
    }

    return results;
  }

  /**
   * Generate a single patch package.
   */
  async buildPatch(definition: OfflinePatchDefinition): Promise<OfflinePatchPackage> {
    const manifestMaps = await this.createManifestMaps(definition);
    const includeFilters = this.compileRegex(definition.includeFilters ?? ['.*']);
    const excludeFilters = this.compileRegex(definition.excludeFilters ?? []);

    const added: PatchAssetRecord[] = [];
    const updated: PatchUpdatedAssetRecord[] = [];
    const removed: PatchRemovedAssetRecord[] = [];

    const assetHashAlgorithm = definition.integrity.assetHashAlgorithm;

    for (const [url, entry] of manifestMaps.target.entries()) {
      if (!this.isUrlAllowed(url, includeFilters, excludeFilters)) {
        continue;
      }

      const baselineEntry = manifestMaps.baseline.get(url);
      if (!baselineEntry) {
        added.push(await this.createAssetRecord(url, entry, definition, assetHashAlgorithm));
        continue;
      }

      if (this.isEntryChanged(entry, baselineEntry)) {
        updated.push(
          await this.createAssetRecord(url, entry, definition, assetHashAlgorithm, {
            previousRevision: baselineEntry.revision,
          })
        );
      }
    }

    for (const [url, entry] of manifestMaps.baseline.entries()) {
      if (!this.isUrlAllowed(url, includeFilters, excludeFilters)) {
        continue;
      }
      if (!manifestMaps.target.has(url)) {
        removed.push({ url, previousRevision: entry.revision });
      }
    }

    const missingAssets = [...added, ...updated].filter(asset => !asset.exists).length;
    const totalSizeBytes = [...added, ...updated].reduce((sum, asset) => sum + (asset.size ?? 0), 0);

    const patch: OfflinePatchPackage = {
      patchId: definition.patchId,
      fromVersion: definition.fromVersion,
      toVersion: definition.toVersion,
      manifestFormat: this.config.manifestFormat,
      generatedAt: this.nowFn().toISOString(),
      metadata: definition.metadata ?? {},
      stats: {
        totalManifestEntries: manifestMaps.totalEntries,
        consideredAssets: manifestMaps.consideredEntries,
        added: added.length,
        removed: removed.length,
        updated: updated.length,
        missingAssets,
        totalSizeBytes,
      },
      assets: {
        added,
        removed,
        updated,
      },
      integrity: {
        algorithm: definition.integrity.algorithm,
        assetHashAlgorithm,
        salt: definition.integrity.salt,
        signature: '',
      },
    };

    patch.integrity.signature = computePatchSignature(
      {
        patchId: patch.patchId,
        fromVersion: patch.fromVersion,
        toVersion: patch.toVersion,
        assets: patch.assets,
        metadata: patch.metadata,
      },
      patch.integrity
    );

    await this.writePatch(definition, patch);
    return patch;
  }

  private async createManifestMaps(definition: OfflinePatchDefinition): Promise<ManifestMaps> {
    const baselineEntries = await this.loadManifest(definition.baselineManifestPath);
    const targetEntries = await this.loadManifest(definition.targetManifestPath);

    const includeFilters = this.compileRegex(definition.includeFilters ?? ['.*']);
    const excludeFilters = this.compileRegex(definition.excludeFilters ?? []);

    const filteredBaseline = baselineEntries.filter(entry => this.isUrlAllowed(entry.url, includeFilters, excludeFilters));
    const filteredTarget = targetEntries.filter(entry => this.isUrlAllowed(entry.url, includeFilters, excludeFilters));

    return {
      baseline: new Map(filteredBaseline.map(entry => [entry.url, entry])),
      target: new Map(filteredTarget.map(entry => [entry.url, entry])),
      totalEntries: targetEntries.length,
      consideredEntries: filteredTarget.length,
    };
  }

  private compileRegex(patterns: string[]): RegExp[] {
    return patterns.map(pattern => {
      try {
        return new RegExp(pattern);
      } catch (error) {
        throw new Error(`Regex non valida "${pattern}": ${(error as Error).message}`);
      }
    });
  }

  private isUrlAllowed(url: string, include: RegExp[], exclude: RegExp[]): boolean {
    const included = include.some(regex => regex.test(url));
    const excluded = exclude.some(regex => regex.test(url));
    return included && !excluded;
  }

  private isEntryChanged(nextEntry: WorkboxManifestEntry, previousEntry: WorkboxManifestEntry): boolean {
    if (nextEntry.revision && previousEntry.revision && nextEntry.revision !== previousEntry.revision) {
      return true;
    }
    if (nextEntry.integrity && previousEntry.integrity && nextEntry.integrity !== previousEntry.integrity) {
      return true;
    }
    if (!nextEntry.revision && !previousEntry.revision && nextEntry.integrity && !previousEntry.integrity) {
      return true;
    }
    if (!nextEntry.revision && !previousEntry.revision && nextEntry.integrity === previousEntry.integrity) {
      return false;
    }
    return false;
  }

  private async loadManifest(manifestPath: string): Promise<WorkboxManifestEntry[]> {
    const absolutePath = path.resolve(manifestPath);
    let raw: string;
    try {
      raw = await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      throw new Error(`Impossibile leggere il manifest ${absolutePath}: ${(error as Error).message}`);
    }

    try {
      return this.parseManifest(raw);
    } catch (error) {
      throw new Error(`Manifest non valido (${absolutePath}): ${(error as Error).message}`);
    }
  }

  private parseManifest(raw: string): WorkboxManifestEntry[] {
    const format = this.config.manifestFormat;

    if (format === 'assetMap') {
      const data = JSON.parse(raw) as Record<string, { hash?: string; revision?: string }>;
      return Object.entries(data).map(([url, meta]) => ({
        url,
        revision: meta.revision ?? meta.hash,
      }));
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(entry => this.normalizeManifestEntry(entry));
      }
    } catch (error) {
      // Try to extract JSON array from Workbox injected manifest bundle
      const match = raw.match(/\[(.|\n|\r)*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          return parsed.map(entry => this.normalizeManifestEntry(entry));
        }
      }
      throw error;
    }

    throw new Error('Formato manifest non supportato');
  }

  private normalizeManifestEntry(entry: unknown): WorkboxManifestEntry {
    if (typeof entry === 'object' && entry !== null && 'url' in entry) {
      const normalized = entry as WorkboxManifestEntry;
      return {
        url: normalized.url,
        revision: normalized.revision,
        integrity: normalized.integrity,
      };
    }
    throw new Error('Entry manifest non valida. Atteso oggetto con proprietà "url".');
  }

  private async createAssetRecord(
    url: string,
    entry: WorkboxManifestEntry,
    definition: OfflinePatchDefinition,
    hashAlgorithm: OfflinePatchIntegrityConfig['assetHashAlgorithm'],
    extra: { previousRevision?: string } = {}
  ): Promise<PatchUpdatedAssetRecord> {
    const assetPath = this.resolveAssetPath(definition.assetRoot, url);
    try {
      const buffer = await fs.readFile(assetPath);
      const hash = createHash(hashAlgorithm).update(buffer).digest('hex');
      return {
        url,
        revision: entry.revision,
        hash,
        size: buffer.length,
        exists: true,
        ...extra,
      };
    } catch (error) {
      this.logger.warn(`⚠️  Asset mancante per ${url}: ${(error as Error).message}`);
      return {
        url,
        revision: entry.revision,
        exists: false,
        ...extra,
      };
    }
  }

  private resolveAssetPath(assetRoot: string, assetUrl: string): string {
    const sanitized = assetUrl.replace(/^\/+/, '').split('?')[0];
    return path.resolve(assetRoot, sanitized);
  }

  private async writePatch(definition: OfflinePatchDefinition, patch: OfflinePatchPackage): Promise<void> {
    const outputDir = path.resolve(definition.outputDir);
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${definition.patchId}.json`);
    await fs.writeFile(filePath, JSON.stringify(patch, null, 2), 'utf-8');
    this.logger.info(`📦 Patch salvata in ${filePath}`);
  }
}

interface CliArgs {
  configPath?: string;
  patchId?: string;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--config' && argv[i + 1]) {
      args.configPath = argv[++i];
    } else if (token === '--patch' && argv[i + 1]) {
      args.patchId = argv[++i];
    }
  }
  return args;
}

async function loadConfigFromCli(configPath?: string): Promise<OfflinePatchPackageBuilderConfig> {
  if (!configPath) {
    return OFFLINE_PATCH_PACKAGE_CONFIG;
  }

  const resolved = path.resolve(configPath);
  if (resolved.endsWith('.json')) {
    const json = await fs.readFile(resolved, 'utf-8');
    return OfflinePatchPackageBuilderConfigSchema.parse(JSON.parse(json));
  }

  const url = pathToFileURL(resolved).href;
  const imported = await import(url);
  const candidate = imported.default ?? imported.OFFLINE_PATCH_PACKAGE_CONFIG ?? imported.config ?? imported;
  return OfflinePatchPackageBuilderConfigSchema.parse(candidate);
}

async function runCli(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const config = await loadConfigFromCli(args.configPath);
  const builder = new OfflinePatchPackageBuilder(config);
  await builder.buildAll({ onlyPatchId: args.patchId });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href || process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch(error => {
    console.error('❌ Offline Patch Package Builder failed:', error);
    process.exit(1);
  });
}
