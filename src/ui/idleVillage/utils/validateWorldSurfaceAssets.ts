import {
  WorldSurfaceManifestSchema,
  type WorldSurfaceManifest,
} from '../config/worldSurfaceConfig';

/**
 * Result of validating a World Surface manifest against its runtime assets.
 */
export interface WorldSurfaceAssetValidationResult {
  /** True when the manifest parses and every referenced layer file exists. */
  valid: boolean;
  /** Human-readable schema error message, when the manifest is invalid. */
  schemaError?: string;
  /** List of layer files referenced by the manifest that were not found on disk. */
  missingFiles: Array<{
    /** Layer id from the manifest. */
    layerId: string;
    /** File name referenced by the layer. */
    file: string;
    /** Resolved path that was checked. */
    resolvedPath: string;
  }>;
}

/**
 * Options for {@link validateWorldSurfaceAssets}.
 */
export interface ValidateWorldSurfaceAssetsOptions {
  /** Parsed or raw manifest object to validate. */
  manifest: unknown;
  /** Directory containing the layer image files. */
  layersDir: string;
  /**
   * Function used to test whether a resolved file path exists.
   * Accepts the full path and returns a boolean or a Promise<boolean>.
   */
  fileExists: (path: string) => boolean | Promise<boolean>;
}

/**
 * Validate a World Surface manifest: Zod schema + semantic file existence check.
 *
 * Every layer listed in `surfaceLayers` and `atmosphereLayers` must have its
 * `file` property resolve to an existing file under `layersDir`. This keeps the
 * runtime honest and catches artist drop-in mismatches before deployment.
 *
 * @param options - Validation options.
 * @returns Validation result with schema and missing-file details.
 */
export async function validateWorldSurfaceAssets(
  options: ValidateWorldSurfaceAssetsOptions,
): Promise<WorldSurfaceAssetValidationResult> {
  const { manifest, layersDir, fileExists } = options;

  const parseResult = WorldSurfaceManifestSchema.safeParse(manifest);
  if (!parseResult.success) {
    return {
      valid: false,
      schemaError: parseResult.error.message,
      missingFiles: [],
    };
  }

  const validManifest: WorldSurfaceManifest = parseResult.data;
  const layers = [
    ...validManifest.surfaceLayers,
    ...validManifest.atmosphereLayers,
  ];

  const missingFiles: WorldSurfaceAssetValidationResult['missingFiles'] = [];

  for (const layer of layers) {
    const resolvedPath = `${layersDir}/${layer.file}`;
    const exists = await fileExists(resolvedPath);
    if (!exists) {
      missingFiles.push({
        layerId: layer.id,
        file: layer.file,
        resolvedPath,
      });
    }
  }

  return {
    valid: missingFiles.length === 0,
    missingFiles,
  };
}
