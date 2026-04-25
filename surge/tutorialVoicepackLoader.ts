import { z } from 'zod';

const VoicepackFileSchema = z.object({
  id: z.string(),
  clip: z.string(),
  textKey: z.string(),
  checksum: z.string(),
  durationMs: z.number().nonnegative(),
});

const VoicepackEntrySchema = z.object({
  id: z.string(),
  guardianId: z.string(),
  locale: z.string(),
  version: z.string(),
  tags: z.array(z.string()).default([]),
  sizeBytes: z.number().nonnegative(),
  updatedAt: z.string(),
  files: z.array(VoicepackFileSchema),
  fallbackLocale: z.string().optional(),
});

const VoicepackManifestSchema = z.object({
  version: z.string(),
  updatedAt: z.string(),
  defaultLocale: z.string(),
  fallbackLocale: z.string(),
  defaultGuardianId: z.string().default('guardian_seraphina'),
  packs: z.array(VoicepackEntrySchema),
});

export type VoicepackFile = z.infer<typeof VoicepackFileSchema>;
export type VoicepackEntry = z.infer<typeof VoicepackEntrySchema>;
export type VoicepackManifest = z.infer<typeof VoicepackManifestSchema>;

export interface VoicepackLoaderConfig {
  manifestUrl: string;
  assetBaseUrl: string;
  defaultLocale: string;
  fallbackLocale: string;
}

export const DEFAULT_VOICEPACK_LOADER_CONFIG: VoicepackLoaderConfig = {
  manifestUrl: '/assets/punchClub/tutorial/voiceover-manifest.json',
  assetBaseUrl: '/assets/punchClub/tutorial/voiceover',
  defaultLocale: 'en',
  fallbackLocale: 'en',
};

const manifestCache = new Map<string, VoicepackManifest>();

interface ResolvedVoicepackFile extends VoicepackFile {
  url: string;
}

export interface ResolvedVoicepack {
  locale: string;
  guardianId: string;
  version: string;
  files: ResolvedVoicepackFile[];
  fallbackChain: string[];
  sourceLocale: string;
  sourceGuardianId: string;
  tags: string[];
  sizeBytes: number;
  updatedAt: string;
}

export interface LoadVoicepackOptions {
  locale?: string;
  guardianId?: string;
  config?: Partial<VoicepackLoaderConfig>;
  forceRefresh?: boolean;
}

export async function getVoicepackManifest(
  options: Partial<VoicepackLoaderConfig> = {},
  forceRefresh = false
): Promise<VoicepackManifest> {
  const config = { ...DEFAULT_VOICEPACK_LOADER_CONFIG, ...options };
  if (!forceRefresh && manifestCache.has(config.manifestUrl)) {
    return manifestCache.get(config.manifestUrl)!;
  }

  const response = await fetchJson(config.manifestUrl);
  const manifest = VoicepackManifestSchema.parse(response);

  manifestCache.set(config.manifestUrl, manifest);
  return manifest;
}

export async function loadVoicepack(options: LoadVoicepackOptions = {}): Promise<ResolvedVoicepack> {
  const config = { ...DEFAULT_VOICEPACK_LOADER_CONFIG, ...options.config };
  const manifest = await getVoicepackManifest(config, options.forceRefresh);

  const requestedLocale = options.locale ?? config.defaultLocale;
  const requestedGuardian = options.guardianId ?? manifest.defaultGuardianId;

  const { entry, fallbackChain } = resolveVoicepackEntry(
    manifest,
    requestedLocale,
    requestedGuardian,
    config.fallbackLocale
  );

  if (!entry) {
    throw new Error(`Voicepack not found for locale ${requestedLocale} or fallback chain ${fallbackChain.join(' > ')}`);
  }

  return {
    locale: requestedLocale,
    guardianId: requestedGuardian,
    version: entry.version,
    tags: entry.tags,
    sizeBytes: entry.sizeBytes,
    updatedAt: entry.updatedAt,
    fallbackChain,
    sourceLocale: entry.locale,
    sourceGuardianId: entry.guardianId,
    files: entry.files.map((file) => ({
      ...file,
      url: toAbsoluteUrl(file.clip, config.assetBaseUrl),
    })),
  };
}

export async function listVoicepacks(options: Partial<VoicepackLoaderConfig> = {}): Promise<VoicepackEntry[]> {
  const manifest = await getVoicepackManifest(options);
  return manifest.packs.slice();
}

export interface VoicepackOptionSummary {
  locale: string;
  guardians: Array<{ guardianId: string; tags: string[] }>;
}

export function summarizeVoicepackOptions(manifest: VoicepackManifest): VoicepackOptionSummary[] {
  const map = new Map<string, VoicepackOptionSummary>();
  for (const pack of manifest.packs) {
    if (!map.has(pack.locale)) {
      map.set(pack.locale, { locale: pack.locale, guardians: [] });
    }
    map.get(pack.locale)!.guardians.push({ guardianId: pack.guardianId, tags: pack.tags });
  }
  return Array.from(map.values()).sort((a, b) => a.locale.localeCompare(b.locale));
}

function resolveVoicepackEntry(
  manifest: VoicepackManifest,
  locale: string,
  guardianId: string,
  fallbackLocale?: string
): { entry: VoicepackEntry | undefined; fallbackChain: string[] } {
  const fallbackChain: string[] = [];
  const queue = dedupe([
    locale,
    fallbackLocale,
    manifest.fallbackLocale,
    manifest.defaultLocale,
  ]);
  const visitedLocales = new Set<string>();

  while (queue.length) {
    const candidateLocale = queue.shift()!;
    if (!candidateLocale || visitedLocales.has(candidateLocale)) {
      continue;
    }
    visitedLocales.add(candidateLocale);

    const directMatch = manifest.packs.find(
      (pack) => pack.locale === candidateLocale && pack.guardianId === guardianId
    );

    if (directMatch) {
      if (candidateLocale !== locale) {
        fallbackChain.push(`${locale}→${candidateLocale}`);
      }
      return { entry: directMatch, fallbackChain };
    }

    const localeMatch = manifest.packs.find((pack) => pack.locale === candidateLocale);
    if (localeMatch) {
      fallbackChain.push(`${guardianId}@${locale}→${localeMatch.guardianId}@${candidateLocale}`);
      if (localeMatch.fallbackLocale && !visitedLocales.has(localeMatch.fallbackLocale)) {
        queue.push(localeMatch.fallbackLocale);
      }
      return { entry: localeMatch, fallbackChain };
    }

    fallbackChain.push(`${candidateLocale} unavailable`);
  }

  return { entry: undefined, fallbackChain };
}

async function fetchJson(url: string): Promise<unknown> {
  if (typeof fetch === 'undefined') {
    throw new Error('Voicepack loader requires fetch to be available in the environment.');
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch voicepack manifest: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function toAbsoluteUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${baseUrl}`.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

function dedupe(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function clearVoicepackCache(): void {
  manifestCache.clear();
}
