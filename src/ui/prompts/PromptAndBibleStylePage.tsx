import { useCallback, useEffect, useMemo, useState } from 'react';
import styleBibleRaw from '@docs/plans/art_direction_plan.md?raw';
import promptLibraryRaw from '@docs/prompts/prompt_library.md?raw';
import { PromptReferenceGallery } from './PromptReferenceGallery';
import './promptStyles.css';

const assetModules = import.meta.glob<{ default: string }>('@/assets/**/*', { eager: true });
const assetUrlMap = new Map<string, string>();
Object.entries(assetModules).forEach(([key, mod]) => {
  const normalized = normalizeAssetKey(key);
  if (normalized) {
    assetUrlMap.set(normalized, mod.default);
  }
});

function normalizeAssetKey(path: string): string | null {
  const cleaned = path.replace(/\\/g, '/');
  const match = cleaned.match(/assets\/.+/);
  return match ? match[0] : null;
}

interface PromptImageRef {
  /** Unique id tying the image reference to the originating prompt. */
  id: string;
  /** Human readable label (e.g. Image, Concept Variant). */
  label: string;
  /** Title pulled from the markdown link label. */
  title: string;
  /** Raw doc path (useful for fallback links). */
  docPath: string;
  /** Browser-safe URL derived from project assets/public folder. */
  url: string | null;
}

interface PromptEntry {
  /** Stable slug for React keying and note persistence. */
  id: string;
  /** Full heading text (e.g. "Volto eroico – Elite Portrait Prompt"). */
  title: string;
  /** Computed key used for sorting (based on markdown order or detected date). */
  sortKey: number;
  /** Optional intent sentence from markdown. */
  intent?: string;
  /** Optional art stack description from markdown. */
  artStack?: string;
  /** Core prompt content extracted from the fenced code block. */
  promptText: string;
  /** References to linked images or concept variants. */
  images: PromptImageRef[];
  /** Note text sourced from the markdown (e.g., folder info). */
  docNote?: string;
}

const DEV_ONLY_NOTICE =
  'Questa pagina esiste solo in modalità dev. Aggiorna docs/plans/art_direction_plan.md o docs/prompts/prompt_library.md per sincronizzare contenuti.';

/**
 * Converts a string into a kebab-case slug usable for ids.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

/**
 * Attempts to resolve a markdown document asset reference into a runnable URL.
 */
function resolveDocAssetUrl(docPath: string): string | null {
  const decoded = decodeURIComponent(docPath).replace(/\\/g, '/');
  const srcMatch = decoded.match(/src\/assets\/.+/);
  if (srcMatch) {
    const normalized = srcMatch[0].replace(/^src\//, '');
    const url = assetUrlMap.get(normalized);
    if (url) {
      return url;
    }
  }
  if (decoded.includes('public/')) {
    return decoded.replace(/^.*public\//, '/');
  }
  return null;
}

/**
 * Parses docs/prompts/prompt_library.md and extracts prompt definitions dynamically.
 */
function parsePromptLibrary(markdown: string): PromptEntry[] {
  const lines = markdown.split('\n');
  const entries: PromptEntry[] = [];

  const flushBlock = (title: string | null, blockLines: string[], blockIndex: number) => {
    if (!title || blockLines.length === 0) return;
    const blockText = blockLines.join('\n');
    const promptMatch = blockText.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (!promptMatch) return;

    const promptText = promptMatch[1].trim();
    const intentLine = blockLines.find((line) => line.trim().startsWith('- **Intent:**'));
    const artStackLine = blockLines.find((line) => line.trim().startsWith('- **Art Stack:**'));

    const images: PromptImageRef[] = blockLines
      .map((line) => {
        const match = line.match(/-\s*\*\*(.+?)\*\*\s*:?\s*\[([^\]]+)\]\(([^)]+)\)/);
        if (!match) return null;
        const [, rawLabel, imageTitle, path] = match;
        const label = rawLabel.trim().replace(/:$/, '');
        const url = resolveDocAssetUrl(path);
        return {
          id: `${slugify(title)}-${slugify(label)}-${slugify(imageTitle)}`,
          label,
          title: imageTitle,
          docPath: path,
          url,
        } satisfies PromptImageRef;
      })
      .filter((ref): ref is PromptImageRef => Boolean(ref));

    const noteLine = blockLines.find((line) => line.trim().startsWith('- **Note:**'));
    const docNote = noteLine?.replace(/- \*\*Note:\*\*\s*/, '').trim();

    const dateMatch = blockLines
      .map((line) => line.match(/(20\d{2})[-/](\d{2})[-/](\d{2})/))
      .find((match) => Boolean(match));
    const dateTimestamp = dateMatch ? Date.parse(dateMatch[0] ?? '') : undefined;

    entries.push({
      id: slugify(title),
      title,
      sortKey: dateTimestamp && !Number.isNaN(dateTimestamp) ? dateTimestamp : blockIndex,
      intent: intentLine?.replace('- **Intent:**', '').trim(),
      artStack: artStackLine?.replace('- **Art Stack:**', '').trim(),
      promptText,
      images,
      docNote,
    });
  };

  let currentTitle: string | null = null;
  let buffer: string[] = [];
  let blockCounter = 0;

  lines.forEach((line) => {
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      flushBlock(currentTitle, buffer, blockCounter);
      currentTitle = line.replace(/^##\s*/, '').trim();
      buffer = [];
      blockCounter += 1;
    } else if (currentTitle) {
      buffer.push(line);
    }
  });

  flushBlock(currentTitle, buffer, blockCounter);
  return entries.sort((a, b) => b.sortKey - a.sortKey);
}

/**
 * Dev-only dashboard that surfaces the Style Bible and validated prompt references.
 * Content is sourced dynamically from markdown files so updates propagate automatically.
 */
export function PromptAndBibleStylePage() {
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(true);
  const [thumbnailScale, setThumbnailScale] = useState<'xs' | 'sm' | 'md'>('xs');
  const [folderFilter, setFolderFilter] = useState('all');
  const [isBibleOpen, setIsBibleOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notesByImage, setNotesByImage] = useState<Record<string, string>>({});
  const [styleBibleText, setStyleBibleText] = useState(() => styleBibleRaw.trim());
  const [promptEntries, setPromptEntries] = useState<PromptEntry[]>(() => parsePromptLibrary(promptLibraryRaw));

  const imageIndex = useMemo(() => {
    const list: PromptImageRef[] = [];
    promptEntries.forEach((entry) => {
      entry.images.forEach((ref) => {
        list.push(ref);
      });
    });
    return list.map((ref, index) => ({
      ...ref,
      order: index,
      parentPromptTitle: promptEntries.find((entry) =>
        entry.images.some((image) => image.id === ref.id),
      )?.title,
    }));
  }, [promptEntries]);

  const filteredImageIndex = useMemo(() => {
    if (folderFilter === 'all') return imageIndex;
    return imageIndex.filter((ref) => ref.docPath.toLowerCase().includes(folderFilter.toLowerCase()));
  }, [folderFilter, imageIndex]);

  const folderOptions = useMemo(() => {
    const set = new Set<string>();
    imageIndex.forEach((ref) => {
      const folder = ref.docPath.split('/').slice(0, -1).join('/');
      if (folder) set.add(folder);
    });
    return ['all', ...Array.from(set)];
  }, [imageIndex]);

  const contactSheetGridClass = useMemo(
    () => `prompt-thumb-grid prompt-thumb-grid--${thumbnailScale}`,
    [thumbnailScale],
  );

  const handleScrollToImage = useCallback((imageId: string) => {
    const element = document.getElementById(imageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('prompt-image--highlight');
      window.setTimeout(() => element.classList.remove('prompt-image--highlight'), 1600);
      setActiveImageId(imageId);
    }
  }, []);

  const handleToggleContactSheet = useCallback(() => {
    setIsContactSheetOpen((prev) => !prev);
  }, []);

  const handleThumbnailScaleChange = useCallback((scale: 'xs' | 'sm' | 'md') => {
    setThumbnailScale(scale);
  }, []);

  const handleFolderChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setFolderFilter(event.target.value);
  }, []);

  useEffect(() => {
    if (!import.meta.hot) return undefined;
    const biblePath = '@docs/plans/art_direction_plan.md?raw';
    const promptsPath = '@docs/prompts/prompt_library.md?raw';

    const handleBibleUpdate = (mod?: unknown) => {
      const next = (mod as { default?: string } | undefined)?.default ?? '';
      setStyleBibleText(next.trim());
    };

    const handlePromptUpdate = (mod?: unknown) => {
      const next = (mod as { default?: string } | undefined)?.default ?? '';
      setPromptEntries(parsePromptLibrary(next));
    };

    import.meta.hot.accept(biblePath, handleBibleUpdate);
    import.meta.hot.accept(promptsPath, handlePromptUpdate);

    return () => {
      import.meta.hot?.invalidate?.();
    };
  }, []);

  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (error) {
      console.error('[PromptAndBibleStylePage] Copy failed', error);
    }
  }, []);

  const biblePreview = styleBibleText;

  const handleGalleryNavigate = useCallback(
    (imageId: string) => {
      handleScrollToImage(imageId);
    },
    [handleScrollToImage],
  );

  return (
    <div className="observatory-page min-h-screen px-4 py-6 text-ivory">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="default-card border border-white/10 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200">Prompt & Style Bible</p>
          <h1 className="mt-2 text-3xl font-serif">Prompt and Bible Style</h1>
          <p className="mt-2 text-sm text-slate-200">
            {DEV_ONLY_NOTICE}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-amber-300/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-amber-100 transition hover:border-amber-200"
              onClick={() => setIsBibleOpen(true)}
            >
              Apri Style Bible
            </button>
            <button
              type="button"
              className="rounded-full border border-teal-300/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-teal-100 transition hover:border-teal-200"
              onClick={() => handleCopy(biblePreview, 'style-bible')}
            >
              Copia Style Bible
            </button>
            {copiedKey === 'style-bible' && (
              <span className="text-xs uppercase tracking-[0.35em] text-emerald-300">Copiato</span>
            )}
          </div>
        </header>

        <section className="space-y-4">
          <div className="default-card border border-white/10 p-4 shadow-[0_15px_35px_rgba(0,0,0,0.4)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Reference Contact Sheet</p>
                <p className="text-sm text-slate-200">{filteredImageIndex.length} immagini · Ordine ultime aggiunte</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-slate-100 hover:border-amber-200"
                onClick={handleToggleContactSheet}
              >
                {isContactSheetOpen ? 'Nascondi' : 'Mostra'}
              </button>
            </div>
            {isContactSheetOpen && (
              <>
                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="flex flex-col text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    Cartella
                    <select
                      className="mt-1 rounded-xl border border-white/15 bg-black/40 px-3 py-1 text-xs text-slate-100"
                      value={folderFilter}
                      onChange={handleFolderChange}
                    >
                      {folderOptions.map((folder) => (
                        <option key={folder} value={folder}>
                          {folder === 'all' ? 'Tutte' : folder}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="prompt-thumb-scales" role="group" aria-label="Thumbnail scale">
                    {(['xs', 'sm', 'md'] as const).map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        className={`prompt-thumb-scale ${thumbnailScale === scale ? 'is-active' : ''}`}
                        onClick={() => handleThumbnailScaleChange(scale)}
                      >
                        {scale.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredImageIndex.length > 0 ? (
                  <div className={contactSheetGridClass}>
                    {filteredImageIndex.map((ref) => (
                      <button
                        key={ref.id}
                        type="button"
                        className={`prompt-thumb ${activeImageId === ref.id ? 'is-active' : ''}`}
                        onClick={() => handleScrollToImage(ref.id)}
                      >
                        {ref.url ? (
                          <img src={ref.url} alt={ref.title} loading="lazy" />
                        ) : (
                          <div className="prompt-thumb__missing">Missing</div>
                        )}
                        <span className="prompt-thumb__meta">
                          <span className="prompt-thumb__label" title={ref.label}>
                            {ref.label}
                          </span>
                          <span className="prompt-thumb__title" title={ref.title}>
                            {ref.title}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Nessuna immagine per la cartella selezionata.</p>
                )}
              </>
            )}
          </div>
          {promptEntries.map((prompt) => (
            <article
              key={prompt.id}
              className="default-card border border-white/10 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Prompt Validato</p>
                  <h2 className="text-2xl font-serif text-amber-100">{prompt.title}</h2>
                  {prompt.intent && <p className="text-sm text-slate-200">{prompt.intent}</p>}
                  {prompt.artStack && (
                    <p className="text-xs font-mono text-slate-400">Art Stack:{' '}{prompt.artStack}</p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <button
                    type="button"
                    className="rounded-full border border-white/25 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-slate-100 transition hover:border-amber-200 hover:text-amber-100"
                    onClick={() => handleCopy(prompt.promptText, `${prompt.id}-prompt`)}
                  >
                    Copia Prompt
                  </button>
                  {copiedKey === `${prompt.id}-prompt` && (
                    <span className="text-[10px] uppercase tracking-[0.35em] text-emerald-300">Copiato</span>
                  )}
                </div>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-100">
                {prompt.promptText}
              </pre>

              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-4">
                  {prompt.images.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-slate-400">
                      Nessuna immagine referenziata in markdown.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/25 p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                        <span>{prompt.images[0].label}</span>
                        <a
                          href={prompt.images[0].url ?? prompt.images[0].docPath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-200 hover:text-amber-100"
                        >
                          Apri
                        </a>
                      </div>
                      {prompt.images[0].url ? (
                        <button
                          id={prompt.images[0].id}
                          type="button"
                          onClick={() => window.open(prompt.images[0].url ?? prompt.images[0].docPath, '_blank', 'noopener')}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/20 prompt-image"
                        >
                          <img
                            src={prompt.images[0].url}
                            alt={prompt.images[0].title}
                            className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/40" />
                        </button>
                      ) : (
                        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-slate-500">
                          Immagine non risolta ({prompt.images[0].docPath})
                        </div>
                      )}
                      <p className="text-sm text-slate-200">{prompt.images[0].title}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                      <span>Reference Set</span>
                      <span>{prompt.images.length} asset</span>
                    </div>
                    <PromptReferenceGallery
                      images={prompt.images}
                      activeImageId={activeImageId}
                      onOpen={(image) => handleGalleryNavigate(image.id)}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Note</p>
                  <p className="mt-2 text-sm text-slate-200">{prompt.docNote ?? 'Nessuna nota dal documento.'}</p>
                  <label className="mt-4 block text-[10px] uppercase tracking-[0.3em] text-slate-400" htmlFor={`${prompt.id}-notes`}>
                    Appunti personali
                  </label>
                  <textarea
                    id={`${prompt.id}-notes`}
                    className="mt-2 min-h-[120px] w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-slate-100"
                    placeholder="Annotazioni personali per questo prompt."
                    value={notesByImage[`${prompt.id}-notes`] ?? ''}
                    onChange={(event) =>
                      setNotesByImage((prev) => ({ ...prev, [`${prompt.id}-notes`]: event.target.value }))
                    }
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {isBibleOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsBibleOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 mt-6 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black/85 shadow-[0_40px_90px_rgba(0,0,0,0.65)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-serif text-amber-100">DNA Prismatic Wanderlust — Style Bible</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-teal-100 hover:border-teal-200 hover:text-teal-100/90"
                  onClick={() => handleCopy(biblePreview, 'style-bible-modal')}
                >
                  Copia
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-100 hover:border-amber-200 hover:text-amber-200"
                  onClick={() => setIsBibleOpen(false)}
                >
                  Chiudi
                </button>
              </div>
            </div>
            <div className="custom-scrollbar max-h-[70vh] overflow-auto px-5 py-4 text-sm leading-relaxed text-slate-100">
              <pre className="whitespace-pre-wrap">{biblePreview}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromptAndBibleStylePage;
