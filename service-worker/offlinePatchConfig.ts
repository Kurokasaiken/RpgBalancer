import { z } from 'zod';

/**
 * Integrity configuration applied to a generated offline patch package.
 */
export const OfflinePatchIntegritySchema = z.object({
  /** Hash algorithm used for the patch signature */
  algorithm: z.enum(['sha256', 'sha384', 'sha512']).default('sha256'),
  /** Optional salt mixed into every signature */
  salt: z.string().default(''),
  /** Hash algorithm used for individual asset checksums */
  assetHashAlgorithm: z.enum(['sha256', 'sha384', 'sha512']).default('sha256'),
});

/**
 * Definition for include/exclude filters that operate on manifest URLs.
 */
const FilterArraySchema = z.array(z.string()).default([]);

/**
 * Schema describing a single offline patch build definition.
 */
export const OfflinePatchDefinitionSchema = z.object({
  /** Unique identifier for the generated patch package */
  patchId: z.string().min(1),
  /** Semantic version of the source bundle */
  fromVersion: z.string().min(1),
  /** Semantic version of the destination bundle */
  toVersion: z.string().min(1),
  /** Path to the baseline manifest (previous release) */
  baselineManifestPath: z.string().min(1),
  /** Path to the target manifest (current release) */
  targetManifestPath: z.string().min(1),
  /** Directory that contains the built asset files referenced by the manifest */
  assetRoot: z.string().min(1),
  /** Directory where the generated patch JSON should be saved */
  outputDir: z.string().min(1),
  /** Regex filters that must match for an asset to be considered */
  includeFilters: FilterArraySchema.default(['.*']),
  /** Regex filters that, when matched, exclude the asset */
  excludeFilters: FilterArraySchema,
  /** Optional metadata written verbatim in the patch */
  metadata: z.record(z.string(), z.unknown()).default({}),
  /** Integrity / hashing configuration */
  integrity: OfflinePatchIntegritySchema.default({
    algorithm: 'sha256',
    salt: '',
    assetHashAlgorithm: 'sha256',
  }),
});

/**
 * Schema describing the full offline patch builder configuration.
 */
export const OfflinePatchPackageBuilderConfigSchema = z.object({
  /** Version of the configuration document */
  version: z.string().min(1),
  /** Optional manifest format hint (Workbox, Rollup, etc.) */
  manifestFormat: z.enum(['workbox', 'assetMap']).default('workbox'),
  /** List of patch build definitions */
  patches: z.array(OfflinePatchDefinitionSchema).default([]),
});

export type OfflinePatchIntegrityConfig = z.infer<typeof OfflinePatchIntegritySchema>;
export type OfflinePatchDefinition = z.infer<typeof OfflinePatchDefinitionSchema>;
export type OfflinePatchPackageBuilderConfig = z.infer<typeof OfflinePatchPackageBuilderConfigSchema>;

/**
 * Default configuration used by the offline patch builder.
 * Replace manifest paths with real artifacts before running the CLI.
 */
export const OFFLINE_PATCH_PACKAGE_CONFIG: OfflinePatchPackageBuilderConfig =
  OfflinePatchPackageBuilderConfigSchema.parse({
    version: '1.0.0',
    manifestFormat: 'workbox',
    patches: [
      {
        patchId: 'pc-offline-patch-sample',
        fromVersion: '1.1.0',
        toVersion: '1.1.1',
        baselineManifestPath: 'dist/precache-manifest.previous.json',
        targetManifestPath: 'dist/precache-manifest.json',
        assetRoot: 'dist',
        outputDir: 'test-results/offline-patches',
        includeFilters: ['^assets/'],
        excludeFilters: ['\\.map$'],
        metadata: {
          channel: 'punch-club-mobile',
          description: 'Sample placeholder configuration. Update before running.',
        },
        integrity: {
          algorithm: 'sha256',
          salt: 'punch-club-offline',
          assetHashAlgorithm: 'sha256',
        },
      },
    ],
  });
