/**
 * Represents a portrait asset discovered automatically within src/assets/portraits.
 */
export interface AutoPortraitSource {
  /** Unique id derived from the file name (prefixed with auto_). */
  id: string;
  /** Human-readable label inferred from the file name. */
  label: string;
  /** Resolved URL emitted by Vite for the asset. */
  src: string;
  /** Raw file name including extension. */
  fileName: string;
}

const portraitModules = import.meta.glob<string>('@/assets/portraits/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * Normalizes a file name into a human-friendly label.
 */
function fileNameToLabel(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!base) {
    return 'Portrait';
  }
  return base.replace(/(^|\s)\w/g, (match) => match.toUpperCase());
}

const SKIP_PATTERNS = [/placeholder/i];

const autoPortraitSources: AutoPortraitSource[] = Object.entries(portraitModules)
  .map(([rawPath, url]) => {
    const fileName = rawPath.split('/').pop() ?? 'portrait';
    if (SKIP_PATTERNS.some((pattern) => pattern.test(fileName))) {
      return null;
    }
    const label = fileNameToLabel(fileName);
    const slug = fileName.replace(/\.[^.]+$/, '');
    return {
      id: `auto_${slug}`,
      label,
      src: url,
      fileName,
    };
  })
  .filter((entry): entry is AutoPortraitSource => Boolean(entry));

/**
 * Returns auto-discovered portrait assets located under src/assets/portraits.
 */
export function getAutoPortraitSources(): AutoPortraitSource[] {
  return autoPortraitSources;
}
