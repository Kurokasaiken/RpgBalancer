import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import { GlassButton } from '@/ui/atoms/GlassButton';
import { MOODBOARD_STYLES } from './moodboardStyles';
import WorkerCard from '@/ui/idleVillage/components/WorkerCard';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';

interface MoodImage {
  id: string;
  src: string;
  fileName: string;
  folder: string;
}

const moodImageModules = import.meta.glob<{ default: string }>('@/assets/mood/**/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
});

const MOOD_IMAGES: MoodImage[] = Object.entries(moodImageModules)
  .map(([path, mod]) => {
    const normalizedPath = path.replace(/^.*?assets\/mood\//, '');
    const segments = normalizedPath.split('/');
    const fileName = segments.at(-1) ?? normalizedPath;
    const folder = segments.length > 1 ? segments.slice(0, -1).join(' / ') : 'root';
    return {
      id: normalizedPath,
      src: mod.default,
      fileName,
      folder,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const FALLBACK_ASPECT_RATIO = 16 / 9;

/**
 * MoodboardPage renders a dynamic slideshow sourced from any image files placed under src/assets/mood.
 * Designers can toggle between multiple visual treatments without touching the component logic.
 */
export function MoodboardPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStyleId, setActiveStyleId] = useState(MOODBOARD_STYLES[0]?.id ?? 'gilded-observatory');
  const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
  const { activePreset, presets, setPreset, randomizeTheme, resetRandomization, isRandomized } = useThemeSwitcher();

  const stylePreset = useMemo(() => {
    return MOODBOARD_STYLES.find((style) => style.id === activeStyleId) ?? MOODBOARD_STYLES[0];
  }, [activeStyleId]);

  const images = useMemo(() => MOOD_IMAGES, []);

  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[activeIndex % images.length] : undefined;
  const showcaseWorker = useMemo(
    () => ({
      id: 'resident-aurora',
      name: 'Aurora V.',
      hp: 86,
      fatigue: 28,
    }),
    [],
  );
  const showcaseSlot = useMemo(
    () => ({
      slotId: 'scouting-01',
      iconName: '⛬',
      label: 'Scout Ridge',
      assignedWorkerName: 'Aurora V.',
    }),
    [],
  );

  const goToOffset = useCallback(
    (offset: number) => {
      if (!hasImages) return;
      setActiveIndex((prev) => {
        const total = images.length;
        return (prev + offset + total) % total;
      });
    },
    [hasImages, images.length],
  );

  useEffect(() => {
    if (!hasImages || !stylePreset) return;
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      goToOffset(1);
    }, stylePreset.autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [goToOffset, hasImages, isPlaying, stylePreset]);

  const handleImageLoaded = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  }, []);

  const handleKeyboard = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowRight') {
        goToOffset(1);
      } else if (event.key === 'ArrowLeft') {
        goToOffset(-1);
      }
    },
    [goToOffset],
  );

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] transition-colors duration-500 ${
        stylePreset?.backgroundClasses ?? ''
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row" onKeyDown={handleKeyboard} tabIndex={0}>
        <div className="flex-1 space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3 text-ivory">
            <div>
              <p className={`text-[11px] uppercase tracking-[0.35em] ${stylePreset?.accentTextClasses ?? ''}`}>
                Moodboard
              </p>
              <h1 className="text-2xl font-display text-white">Inspiration Deck</h1>
              <p className="text-xs text-slate-200/80">
                Drop any .png/.jpg/.webp into{' '}
                <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">src/assets/mood</code> and they appear
                here instantly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {MOODBOARD_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setActiveStyleId(style.id)}
                  className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.3em] transition-all ${
                    style.id === stylePreset?.id
                      ? 'border-gold bg-gold/10 text-gold shadow-glow-gold'
                      : 'border-slate-600/60 text-slate-300 hover:border-gold/40 hover:text-gold'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </header>

          <section
            className="rounded-3xl border p-4 shadow-xl backdrop-blur-sm"
            style={{
              borderColor: 'var(--panel-border)',
              background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
              boxShadow: `0 30px 60px var(--card-shadow-color)`,
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.5em]"
                  style={{ color: 'var(--slot-helper-color, rgba(255,255,255,0.55))' }}
                >
                  Style Laboratory
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {activePreset.label}
                  {isRandomized ? ' + Chaos Mix' : ''} · {activePreset.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
                  const isPresetActive = activePreset.id === preset.id && !isRandomized;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPreset(preset.id)}
                      className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                      style={{
                        border: `1px solid ${isPresetActive ? 'var(--accent-color)' : 'var(--panel-border)'}`,
                        background: isPresetActive ? 'var(--card-highlight)' : 'transparent',
                        color: isPresetActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: isPresetActive ? `0 0 20px var(--halo-color)` : 'none',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={randomizeTheme}
                  className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                  style={{
                    border: '1px solid var(--accent-strong)',
                    background: 'var(--card-highlight)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Randomize
                </button>
                {isRandomized && (
                  <button
                    type="button"
                    onClick={resetRandomization}
                    className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                    style={{
                      border: '1px dashed var(--panel-border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="relative">
            {stylePreset?.frameAuraClasses && (
              <div className={`${stylePreset.frameAuraClasses} pointer-events-none`} aria-hidden="true" />
            )}
            <div
              className={`relative overflow-hidden ${stylePreset?.frameClasses ?? ''}`}
              style={{ aspectRatio: aspectRatio.toFixed(3) }}
            >
              {hasImages && activeImage ? (
                <>
                  <img
                    key={activeImage.id}
                    src={activeImage.src}
                    alt={activeImage.fileName}
                    onLoad={handleImageLoaded}
                    className="h-full w-full rounded-3xl object-cover object-center transition-opacity duration-700"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5 shadow-inner shadow-black/40" />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-600/70 text-center text-slate-300/70">
                  <p className="text-base font-medium">Nessuna immagine trovata</p>
                  <p className="text-sm">Aggiungi file in src/assets/mood per popolare lo slideshow.</p>
                </div>
              )}
            </div>

            {hasImages && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
                <div>
                  <p className="uppercase tracking-[0.35em] text-[10px] text-slate-400">File</p>
                  <p className="text-sm font-semibold text-white">{activeImage?.fileName}</p>
                  <p className="text-[11px] text-slate-400">{activeImage?.folder}</p>
                </div>
                <div className="flex items-center gap-2">
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsPlaying((prev) => !prev);
                    }}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </GlassButton>
                  <GlassButton size="sm" variant="secondary" onClick={() => goToOffset(-1)}>
                    ‹ Prev
                  </GlassButton>
                  <GlassButton size="sm" variant="secondary" onClick={() => goToOffset(1)}>
                    Next ›
                  </GlassButton>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-ivory shadow-inner shadow-black/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'var(--slot-helper-color)' }}>
                  Component Showcase
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Live Idle Village components rendered with the active theme tokens.
                </p>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-white/70">
                Config-first
              </span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                  WorkerCard
                </p>
                <div className="mt-3 max-w-xs">
                  <WorkerCard
                    id={showcaseWorker.id}
                    name={showcaseWorker.name}
                    hp={showcaseWorker.hp}
                    fatigue={showcaseWorker.fatigue}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                  ActivitySlot & LocationCard
                </p>
                <div className="mt-3 flex flex-col gap-4">
                  <div className="flex justify-center">
                    <ActivitySlot
                      slotId={showcaseSlot.slotId}
                      iconName={showcaseSlot.iconName}
                      label={showcaseSlot.label}
                      assignedWorkerName={showcaseSlot.assignedWorkerName}
                      onWorkerDrop={() => undefined}
                      onInspect={() => undefined}
                    />
                  </div>
                  <LocationCard
                    title="Foresta Radiante"
                    description="Preset location preview per validare gli overlay tematici e le texture dinamiche."
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="w-full max-w-md space-y-4 text-ivory">
          <div className={`${stylePreset?.infoPanelClasses ?? ''} rounded-3xl p-5`}>
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.35em]">
              <span className={stylePreset?.accentTextClasses}>{stylePreset?.label}</span>
              {stylePreset?.badge}
            </div>
            <p className="mt-3 text-sm text-slate-200/90">{stylePreset?.description}</p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300/80">
              <li>• {images.length} asset caricati dinamicamente</li>
              <li>• Frame adattivo {aspectRatio.toFixed(2)}:1</li>
              <li>• Auto-play: {Math.round((stylePreset?.autoAdvanceMs ?? 0) / 1000)}s</li>
              <li>• Comandi tastiera: ← →</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-600/50 p-4 text-xs text-slate-300/80">
            <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">Suggerimenti</p>
            <p className="mt-2">
              Organizza sottocartelle (es. <code>src/assets/mood/phase11</code>) per raggruppare le reference. La UI
              mostra automaticamente il percorso.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MoodboardPage;
