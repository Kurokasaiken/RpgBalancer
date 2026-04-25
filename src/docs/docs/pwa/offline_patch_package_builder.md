# Punch Club Offline Patch Package Builder

## Overview

The offline patch package builder generates delta bundles between two PWA precache manifests. Each bundle records added, updated, and removed assets plus integrity metadata so that the Punch Club service worker can safely stage offline updates without re-downloading the entire asset set.

- **Config-first:** All build definitions live in `service-worker/offlinePatchConfig.ts` with Zod validation and default scaffolding.
- **Diff source:** Workbox precache manifests (supports JSON array or injected manifest snippets). An `assetMap` mode is also available for simple key-value JSON files.
- **Outputs:** Signed patch JSON files stored in the configured `outputDir`. Each JSON contains metadata, stats, asset deltas, and a deterministic signature.

## Files

| File | Purpose |
| --- | --- |
| `service-worker/offlinePatchConfig.ts` | Zod schemas + default `OFFLINE_PATCH_PACKAGE_CONFIG` |
| `scripts/pwa/offlinePatchPackageBuilder.ts` | CLI that loads config, diffs manifests, and writes patch JSON |
| `tests/unit/pwa/OfflinePatchPackageBuilder.test.ts` | Vitest coverage for builder logic |

## Configuration

```ts
export const OFFLINE_PATCH_PACKAGE_CONFIG = {
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
      },
      integrity: {
        algorithm: 'sha256',
        salt: 'punch-club-offline',
        assetHashAlgorithm: 'sha256',
      },
    },
  ],
};
```

### Key fields

- `includeFilters` / `excludeFilters`: Regex arrays applied to manifest URLs. Only URLs matching at least one include rule and no exclude rule participate in the diff.
- `assetRoot`: Directory containing built assets referenced by `url`. Paths are resolved relative to this folder.
- `integrity`: Hash algorithms for per-file checksums and the global patch signature. `salt` lets us derive environment-specific signatures.

## CLI Usage

```
npx tsx scripts/pwa/offlinePatchPackageBuilder.ts \
  --config service-worker/offlinePatchConfig.ts \
  --patch pc-offline-patch-sample
```

Arguments:

- `--config <path>`: Optional path to a JS/TS/JSON module exporting a config. Defaults to the built-in config.
- `--patch <patchId>`: Optional filter to build a single definition.

## Patch Format

Each generated JSON contains:

```json
{
  "patchId": "pc-offline-patch-sample",
  "fromVersion": "1.1.0",
  "toVersion": "1.1.1",
  "generatedAt": "2026-02-09T17:00:00.000Z",
  "stats": {
    "totalManifestEntries": 125,
    "consideredAssets": 96,
    "added": 3,
    "updated": 12,
    "removed": 1,
    "missingAssets": 0,
    "totalSizeBytes": 4213376
  },
  "assets": {
    "added": [{ "url": "assets/new.png", "hash": "…" }],
    "updated": [{ "url": "assets/app.js", "previousRevision": "a1" }],
    "removed": [{ "url": "assets/old.png" }]
  },
  "integrity": {
    "algorithm": "sha256",
    "assetHashAlgorithm": "sha256",
    "salt": "punch-club-offline",
    "signature": "…"
  }
}
```

`missingAssets` counts files referenced in the manifest but absent under `assetRoot` (recorded to catch build pipeline regressions). The service worker can inspect the stats to decide whether to accept or reject the patch during offline application.

## Testing

Run unit tests:

```
npm run test -- tests/unit/pwa/OfflinePatchPackageBuilder.test.ts
```

The suite verifies:

1. Added/updated/removed detection and signature stability.
2. Handling of missing assets and reporting through `stats.missingAssets`.

## Next Steps

- Integrate patch JSON download + verification inside the Punch Club service worker update flow.
- Extend config with per-channel overrides (beta vs production).
- Connect telemetry logging when patches are generated/applied (Guardian mandate).
