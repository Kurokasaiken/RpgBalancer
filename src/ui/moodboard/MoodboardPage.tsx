import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent, SyntheticEvent } from 'react';
import { GlassButton } from '@/ui/atoms/GlassButton';
import WorkerCard from '@/ui/idleVillage/components/WorkerCard';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import VerbCard from '@/ui/idleVillage/VerbCard';
import { FantasyCard } from '@/ui/fantasy/atoms/FantasyCard';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { MOODBOARD_STYLES } from './moodboardStyles';
import './moodboard.css';

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

  const shellStyle = useMemo<CSSProperties>(() => {
    if (!stylePreset) return {};
    const tokenStyles = Object.entries(stylePreset.tokens).reduce<Record<string, string>>((acc, [token, value]) => {
      acc[`--${token}`] = value;
      return acc;
    }, {});
    return tokenStyles as CSSProperties;
  }, [stylePreset]);

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
  const verbPreview = useMemo(
    () => ({
      icon: '⚔️',
      progressFraction: 0.42,
      elapsedSeconds: 180,
      totalDuration: 780,
      injuryPercentage: 18,
      deathPercentage: 4,
      assignedCount: 2,
      totalSlots: 3,
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
    <div className="moodboard-shell" style={shellStyle}>
      <div className="moodboard-shell__grid" onKeyDown={handleKeyboard} tabIndex={0}>
        <div className="moodboard-main">
          <header className="moodboard-header">
            <div>
              <p className="moodboard-kicker">Moodboard</p>
              <h1 className="moodboard-title">Inspiration Deck</h1>
              <p className="moodboard-subcopy">
                Droppa qualsiasi file .png/.jpg/.webp in{' '}
                <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">src/assets/mood</code> e verrà inserito
                nello slideshow immediatamente.
              </p>
            </div>
            <div className="moodboard-style-switcher">
              {MOODBOARD_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setActiveStyleId(style.id)}
                  className={`moodboard-style-pill ${style.id === stylePreset?.id ? 'is-active' : ''}`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </header>

          <section className="moodboard-panel">
            <div className="moodboard-panel__row">
              <div>
                <p className="moodboard-panel__kicker">Style Laboratory</p>
                <p className="moodboard-panel__subtitle">
                  {activePreset.label}
                  {isRandomized ? ' + Chaos Mix' : ''} · {activePreset.description}
                </p>
              </div>
              <div className="moodboard-button-group">
                {presets.map((preset) => {
                  const isPresetActive = activePreset.id === preset.id && !isRandomized;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPreset(preset.id)}
                      className={`moodboard-button ${isPresetActive ? 'is-active' : ''}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button type="button" onClick={randomizeTheme} className="moodboard-button">
                  Randomize
                </button>
                {isRandomized && (
                  <button type="button" onClick={resetRandomization} className="moodboard-button moodboard-button--ghost">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="moodboard-frame">
              <div className="moodboard-frame__inner" style={{ aspectRatio: aspectRatio.toFixed(3) }}>
                {hasImages && activeImage ? (
                  <>
                    <img
                      key={activeImage.id}
                      src={activeImage.src}
                      alt={activeImage.fileName}
                      onLoad={handleImageLoaded}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5 shadow-inner shadow-black/40" />
                  </>
                ) : (
                  <div className="moodboard-frame__fallback">
                    <p className="text-base font-medium">Nessuna immagine trovata</p>
                    <p className="text-sm">Aggiungi file in src/assets/mood per popolare lo slideshow.</p>
                  </div>
                )}
              </div>
            </div>

            {hasImages && (
              <div className="moodboard-frame-meta">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em]">File</p>
                  <p className="text-sm font-semibold">{activeImage?.fileName}</p>
                  <p className="text-[11px]">{activeImage?.folder}</p>
                </div>
                <div className="moodboard-button-group">
                  <button type="button" className="moodboard-button" onClick={() => setIsPlaying((prev) => !prev)}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button type="button" className="moodboard-button" onClick={() => goToOffset(-1)}>
                    ‹ Prev
                  </button>
                  <button type="button" className="moodboard-button" onClick={() => goToOffset(1)}>
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="moodboard-panel moodboard-panel--dashed">
            <div className="moodboard-panel__row">
              <div>
                <p className="moodboard-panel__kicker">Component Showcase</p>
                <p className="moodboard-panel__subtitle">
                  Componenti Idle Village & Fantasy resi con i token attivi in tempo reale.
                </p>
              </div>
              <span className="moodboard-chip">Config-first</span>
            </div>
            <div className="moodboard-component-grid">
              <div className="moodboard-component-card">
                <p className="moodboard-component-card__title">WorkerCard</p>
                <p className="moodboard-component-card__copy">
                  Stato base del residente con HP/Fatica legati alle barre gradient.
                </p>
                <div className="moodboard-component-stack">
                  <WorkerCard
                    id={showcaseWorker.id}
                    name={showcaseWorker.name}
                    hp={showcaseWorker.hp}
                    fatigue={showcaseWorker.fatigue}
                  />
                </div>
              </div>

              <div className="moodboard-component-card">
                <p className="moodboard-component-card__title">ActivitySlot & LocationCard</p>
                <p className="moodboard-component-card__copy">Drop target circolare + card location per overlay tematici.</p>
                <div className="moodboard-component-stack">
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
                    description="Preset location per validare textures, blur e bagliori dinamici."
                  />
                </div>
              </div>

              <div className="moodboard-component-card">
                <p className="moodboard-component-card__title">VerbCard</p>
                <p className="moodboard-component-card__copy">Preview con halo progress e stripe rischio dinamico.</p>
                <div className="flex justify-center">
                  <VerbCard
                    icon={verbPreview.icon}
                    progressFraction={verbPreview.progressFraction}
                    elapsedSeconds={verbPreview.elapsedSeconds}
                    totalDuration={verbPreview.totalDuration}
                    injuryPercentage={verbPreview.injuryPercentage}
                    deathPercentage={verbPreview.deathPercentage}
                    assignedCount={verbPreview.assignedCount}
                    totalSlots={verbPreview.totalSlots}
                    isInteractive
                  />
                </div>
              </div>

              <div className="moodboard-component-card">
                <p className="moodboard-component-card__title">FantasyCard + GlassButtons</p>
                <p className="moodboard-component-card__copy">Componenti fantasy riutilizzati per stressare i token.</p>
                <FantasyCard
                  title="Carta Missione"
                  action={<span className="text-[11px] uppercase tracking-[0.3em] text-(--mood-text-secondary)">Live</span>}
                >
                  <p className="mb-3 text-sm">Conferma che gli stili legnosi non rompano l&apos;atmosfera corrente.</p>
                  <div className="flex flex-wrap gap-2">
                    <GlassButton size="sm">Brief</GlassButton>
                    <GlassButton size="sm" variant="secondary">
                      Mood Pack
                    </GlassButton>
                    <GlassButton size="sm" variant="ghost">
                      Export
                    </GlassButton>
                  </div>
                </FantasyCard>
              </div>
            </div>
          </section>
        </div>

        <aside className="moodboard-sidebar">
          <div className="moodboard-info-card">
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.35em]">
              <span className="moodboard-accent-text">{stylePreset?.label}</span>
              {stylePreset?.badge}
            </div>
            <p className="mt-3 text-sm">{stylePreset?.description}</p>
            <ul className="moodboard-list">
              <li>• {images.length} asset caricati dinamicamente</li>
              <li>• Frame adattivo {aspectRatio.toFixed(2)}:1</li>
              <li>• Auto-play: {Math.round((stylePreset?.autoAdvanceMs ?? 0) / 1000)}s</li>
              <li>• Comandi tastiera: ← →</li>
            </ul>
          </div>
          <div className="moodboard-tip-card">
            <p className="font-semibold uppercase tracking-[0.3em] text-xs">Suggerimenti</p>
            <p className="mt-2">
              Organizza sottocartelle (es. <code>src/assets/mood/phase11</code>) per raggruppare le reference. La UI mostra il
              percorso automaticamente.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MoodboardPage;
