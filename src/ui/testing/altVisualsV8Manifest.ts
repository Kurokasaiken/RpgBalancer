const ALT_VISUALS_V8_MANIFEST_URL = '/assets/alt-visuals/v8/manifest.json';
const ALT_VISUALS_V8_ASSET_BASE_PATH = '/assets/alt-visuals/v8/';

export interface AltVisualsV8ColumnMaterial {
  id: string;
  albedo: string;
  normal?: string;
  roughness?: string;
  displacement?: string;
  ao?: string;
  specular?: string;
  arm?: string;
}

export interface AltVisualsV8TextureAsset {
  file: string;
  format?: string;
  usage?: string;
}

export interface AltVisualsV8Manifest {
  version: number;
  updatedAt: string;
  columns: {
    enemy: AltVisualsV8ColumnMaterial;
    player: AltVisualsV8ColumnMaterial;
  };
  goo: {
    alpha: AltVisualsV8TextureAsset;
    normal: AltVisualsV8TextureAsset;
  };
  background: {
    hdri: string;
    particles: string;
    filmGrain: string;
  };
  blueNoise: {
    root: string;
    tiles: Record<string, string>;
  };
  metadata?: {
    licenses?: Record<
      string,
      {
        source: string;
        author: string;
        license: string;
      }
    >;
  };
}

export interface AltVisualsV8ResolvedAssets {
  columns: {
    enemy: AltVisualsV8ColumnMaterial & { maps: Record<string, string> };
    player: AltVisualsV8ColumnMaterial & { maps: Record<string, string> };
  };
  goo: {
    alpha: string;
    normal: string;
  };
  background: {
    hdri: string;
    particles: string;
    filmGrain: string;
  };
  blueNoise: Record<string, string>;
}

let cachedManifest: AltVisualsV8Manifest | null = null;
let inflightManifestPromise: Promise<AltVisualsV8Manifest> | null = null;

export function getAltVisualsV8ManifestUrl(): string {
  return ALT_VISUALS_V8_MANIFEST_URL;
}

export function getAltVisualsV8AssetBasePath(): string {
  return ALT_VISUALS_V8_ASSET_BASE_PATH;
}

export function clearAltVisualsV8ManifestCache() {
  cachedManifest = null;
  inflightManifestPromise = null;
}

export async function fetchAltVisualsV8Manifest(init?: RequestInit): Promise<AltVisualsV8Manifest> {
  if (cachedManifest) {
    return cachedManifest;
  }
  if (inflightManifestPromise) {
    return inflightManifestPromise;
  }
  inflightManifestPromise = fetch(ALT_VISUALS_V8_MANIFEST_URL, init)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load Alt Visuals v8 manifest (status ${response.status})`);
      }
      return (await response.json()) as AltVisualsV8Manifest;
    })
    .then((manifest) => {
      cachedManifest = manifest;
      return manifest;
    })
    .finally(() => {
      inflightManifestPromise = null;
    });
  return inflightManifestPromise;
}

export function resolveAltVisualsV8Assets(manifest: AltVisualsV8Manifest): AltVisualsV8ResolvedAssets {
  return {
    columns: {
      enemy: {
        ...manifest.columns.enemy,
        maps: collectColumnMaps(manifest.columns.enemy),
      },
      player: {
        ...manifest.columns.player,
        maps: collectColumnMaps(manifest.columns.player),
      },
    },
    goo: {
      alpha: toAltVisualsV8PublicUrl(manifest.goo.alpha.file),
      normal: toAltVisualsV8PublicUrl(manifest.goo.normal.file),
    },
    background: {
      hdri: toAltVisualsV8PublicUrl(manifest.background.hdri),
      particles: toAltVisualsV8PublicUrl(manifest.background.particles),
      filmGrain: toAltVisualsV8PublicUrl(manifest.background.filmGrain),
    },
    blueNoise: Object.fromEntries(
      Object.entries(manifest.blueNoise.tiles).map(([tileSize, relPath]) => [
        tileSize,
        toAltVisualsV8PublicUrl(relPath),
      ]),
    ),
  };
}

function collectColumnMaps(material: AltVisualsV8ColumnMaterial): Record<string, string> {
  const entries: [string, string][] = [];
  (['albedo', 'normal', 'roughness', 'displacement', 'ao', 'specular', 'arm'] as const).forEach((key) => {
    const file = material[key];
    if (file) {
      entries.push([key, toAltVisualsV8PublicUrl(file)]);
    }
  });
  return Object.fromEntries(entries);
}

export function toAltVisualsV8PublicUrl(relativePath: string): string {
  if (!relativePath) {
    return '';
  }
  return `${ALT_VISUALS_V8_ASSET_BASE_PATH}${relativePath.replace(/^\//, '')}`;
}
