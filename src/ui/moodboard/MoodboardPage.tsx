import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent, SyntheticEvent } from 'react';
import { GlassButton } from '@/ui/atoms/GlassButton';
import WorkerCard from '@/ui/idleVillage/components/WorkerCard';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import VerbCard from '@/ui/idleVillage/VerbCard';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import type { ThemePreset } from '@/data/themePresets';
import { MOODBOARD_STYLES, type MoodboardStyle } from './moodboardStyles';
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
const DEFAULT_AUTO_ADVANCE_MS = 7000;
const STYLE_LAB_LABEL = 'Style Laboratory';
const STYLE_LAB_DESCRIPTION =
  'Laboratorio cromatico Gilded Observatory: tutti i token provengono dal preset config-first ufficiale.';
const DEFAULT_MOOD_STYLE_ID = MOODBOARD_STYLES[0]?.id ?? 'gilded-observatory';

const MOODBOARD_TOKEN_MAP: {
  moodVar: string;
  themeVar?: string;
  compute?: (preset: ThemePreset) => string;
  fallback: string;
}[] = [
  { moodVar: 'mood-background', themeVar: 'surface-base', fallback: '#050509' },
  { moodVar: 'mood-background-overlay', themeVar: 'body-bg-overlay', fallback: 'linear-gradient(135deg, rgba(5,5,9,0.95), rgba(4,7,14,0.85))' },
  { moodVar: 'mood-text-primary', themeVar: 'text-primary', fallback: '#f7f4ea' },
  { moodVar: 'mood-text-secondary', themeVar: 'text-secondary', fallback: '#f8d97c' },
  { moodVar: 'mood-text-muted', themeVar: 'text-muted', fallback: 'rgba(226,232,240,0.72)' },
  { moodVar: 'mood-accent', themeVar: 'accent-color', fallback: '#c9a227' },
  { moodVar: 'mood-accent-glow', themeVar: 'halo-color', fallback: 'rgba(201,162,39,0.4)' },
  { moodVar: 'mood-control-border', themeVar: 'button-border', fallback: 'rgba(201,162,39,0.4)' },
  { moodVar: 'mood-control-bg', themeVar: 'button-bg', fallback: 'rgba(5,9,14,0.75)' },
  { moodVar: 'mood-control-hover-bg', themeVar: 'card-highlight', fallback: 'rgba(255,255,255,0.08)' },
  { moodVar: 'mood-control-text', themeVar: 'button-text', fallback: '#f7f4ea' },
  { moodVar: 'mood-control-active-border', themeVar: 'accent-strong', fallback: '#ffd369' },
  { moodVar: 'mood-control-active-bg', themeVar: 'card-highlight', fallback: 'rgba(201,162,39,0.18)' },
  { moodVar: 'mood-control-active-text', themeVar: 'text-primary', fallback: '#ffffff' },
  { moodVar: 'mood-panel-border', themeVar: 'panel-border', fallback: 'rgba(201,162,39,0.35)' },
  { moodVar: 'mood-panel-surface', themeVar: 'panel-surface', fallback: 'rgba(5,7,13,0.82)' },
  {
    moodVar: 'mood-panel-shadow',
    compute: (preset) => `0 30px 60px ${preset.tokens['card-shadow-color'] ?? 'rgba(5,5,9,0.55)'}`,
    fallback: '0 30px 60px rgba(5,5,9,0.55)',
  },
  { moodVar: 'mood-panel-radius', fallback: '32px' },
  { moodVar: 'mood-chip-border', themeVar: 'slot-border', fallback: 'rgba(255,255,255,0.3)' },
  { moodVar: 'mood-chip-bg', themeVar: 'slot-surface', fallback: 'rgba(3,6,9,0.45)' },
  { moodVar: 'mood-chip-text', themeVar: 'slot-icon-color', fallback: '#f0efe4' },
  { moodVar: 'mood-frame-radius', fallback: '36px' },
  { moodVar: 'mood-frame-border', themeVar: 'panel-border', fallback: 'rgba(255,255,255,0.08)' },
  {
    moodVar: 'mood-frame-shadow',
    compute: (preset) => `0 35px 70px ${preset.tokens['card-shadow-color'] ?? 'rgba(5,5,9,0.65)'}`,
    fallback: '0 35px 70px rgba(5,5,9,0.65)',
  },
  { moodVar: 'mood-frame-surface', themeVar: 'card-surface', fallback: 'rgba(5,7,12,0.9)' },
  { moodVar: 'mood-frame-aura', themeVar: 'card-highlight', fallback: 'rgba(201,162,39,0.35)' },
  { moodVar: 'mood-component-border', themeVar: 'slot-border', fallback: 'rgba(255,255,255,0.12)' },
  { moodVar: 'mood-component-surface', themeVar: 'card-surface', fallback: 'rgba(5,8,14,0.78)' },
  {
    moodVar: 'mood-component-shadow',
    compute: (preset) => `0 25px 45px ${preset.tokens['card-shadow-color'] ?? 'rgba(0,0,0,0.55)'}`,
    fallback: '0 25px 45px rgba(0,0,0,0.55)',
  },
  { moodVar: 'mood-component-radius', fallback: '28px' },
  { moodVar: 'mood-component-muted', themeVar: 'slot-helper-color', fallback: 'rgba(226,232,240,0.65)' },
  { moodVar: 'mood-info-border', themeVar: 'panel-border', fallback: 'rgba(255,255,255,0.16)' },
  { moodVar: 'mood-info-surface', themeVar: 'panel-surface', fallback: 'rgba(4,7,12,0.92)' },
  {
    moodVar: 'mood-info-shadow',
    compute: (preset) => `0 30px 55px ${preset.tokens['card-shadow-color'] ?? 'rgba(0,0,0,0.45)'}`,
    fallback: '0 30px 55px rgba(0,0,0,0.45)',
  },
];

const buildMoodboardTokens = (preset: ThemePreset): CSSProperties => {
  const tokens: Record<string, string> = {};
  MOODBOARD_TOKEN_MAP.forEach(({ moodVar, themeVar, compute, fallback }) => {
    const value = compute
      ? compute(preset)
      : themeVar
        ? preset.tokens[themeVar] ?? fallback
        : fallback;
    tokens[`--${moodVar}`] = value ?? fallback;
  });
  return tokens as CSSProperties;
};

const getAutoAdvanceMs = (presetId: string): number => {
  switch (presetId) {
    case 'vellumLight':
      return 9000;
    case 'obsidian':
      return 5500;
    default:
      return DEFAULT_AUTO_ADVANCE_MS;
  }
};

/**
 * MoodboardPage renders a dynamic slideshow sourced from any image files placed under src/assets/mood.
 * Designers can toggle between multiple visual treatments without touching the component logic.
 */
export function MoodboardPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
  const { activePreset, randomizeTheme, resetRandomization, isRandomized } = useThemeSwitcher();
  const [selectedMoodStyleId, setSelectedMoodStyleId] = useState<string>(DEFAULT_MOOD_STYLE_ID);
  const moodboardStyles = useMemo<MoodboardStyle[]>(() => MOODBOARD_STYLES, []);
  const activeMoodStyle = useMemo<MoodboardStyle | null>(() => {
    if (moodboardStyles.length === 0) return null;
    return moodboardStyles.find((style) => style.id === selectedMoodStyleId) ?? moodboardStyles[0];
  }, [moodboardStyles, selectedMoodStyleId]);
  const fallbackShellTokens = useMemo<CSSProperties>(() => buildMoodboardTokens(activePreset), [activePreset]);
  const shellStyle = useMemo<CSSProperties>(() => {
    if (!activeMoodStyle) return fallbackShellTokens;
    return { ...fallbackShellTokens, ...activeMoodStyle.tokens };
  }, [activeMoodStyle, fallbackShellTokens]);
  const autoAdvanceMs = useMemo(
    () => activeMoodStyle?.autoAdvanceMs ?? getAutoAdvanceMs(activePreset.id),
    [activeMoodStyle, activePreset.id],
  );

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
    if (!hasImages || !isPlaying) return undefined;
    const timer = window.setInterval(() => {
      goToOffset(1);
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, goToOffset, hasImages, isPlaying]);

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
              {moodboardStyles.map((style) => {
                const isActiveStyle = style.id === activeMoodStyle?.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    className={`moodboard-style-pill ${isActiveStyle ? 'is-active' : ''}`}
                    onClick={() => setSelectedMoodStyleId(style.id)}
                  >
                    {style.label}
                  </button>
                );
              })}
              <GlassButton variant="secondary" size="sm" onClick={randomizeTheme} className="uppercase tracking-[0.3em]">
                Randomize
              </GlassButton>
              {isRandomized && (
                <GlassButton variant="ghost" size="sm" onClick={resetRandomization} className="uppercase tracking-[0.3em]">
                  Reset
                </GlassButton>
              )}
            </div>
          </header>

          <section className="moodboard-panel">
            <div className="moodboard-panel__row">
              <div>
                <p className="moodboard-panel__kicker">{STYLE_LAB_LABEL}</p>
                <p className="moodboard-panel__subtitle">
                  {activeMoodStyle?.description ?? STYLE_LAB_DESCRIPTION}
                  {isRandomized ? ' · Chaos Mix attivo' : ''}
                </p>
              </div>
              {activeMoodStyle?.badge && <div className="moodboard-style-badge">{activeMoodStyle.badge}</div>}
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
                <p className="moodboard-component-card__title">Observatory Card</p>
                <p className="moodboard-component-card__copy">
                  Shell default-card alimentato dai token attivi, senza dipendenze fantasy.
                </p>
                <div className="moodboard-component-stack">
                  <div className="default-card moodboard-demo-card">
                    <div className="moodboard-demo-card__header">
                      <div>
                        <p className="moodboard-demo-card__eyebrow">Mission Brief</p>
                        <h4 className="moodboard-demo-card__title">Carta Missione</h4>
                      </div>
                      <span className="moodboard-demo-card__badge">LIVE</span>
                    </div>
                    <p className="moodboard-demo-card__body">
                      Conferma che gli stili legnosi non rompano l&apos;atmosfera corrente.
                    </p>
                    <div className="moodboard-demo-card__footer">
                      <GlassButton size="sm">Brief</GlassButton>
                      <GlassButton size="sm" variant="secondary">
                        Mood Pack
                      </GlassButton>
                      <GlassButton size="sm" variant="ghost">
                        Export
                      </GlassButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="moodboard-sidebar">
            <div className="moodboard-info-card">
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.35em]">
              <span className="moodboard-accent-text">{STYLE_LAB_LABEL}</span>
            </div>
            <p className="mt-3 text-sm">
              {STYLE_LAB_DESCRIPTION}
              {isRandomized ? ' · Variabile' : ''}
            </p>
            <ul className="moodboard-list">
              <li>• {images.length} asset caricati dinamicamente</li>
              <li>• Frame adattivo {aspectRatio.toFixed(2)}:1</li>
              <li>• Auto-play: {Math.round(autoAdvanceMs / 1000)}s</li>
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
