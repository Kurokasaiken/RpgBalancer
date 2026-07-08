/**
 * V9 Skin Architecture Sandbox - Explorer Journal Edition
 *
 * Premium AAA fantasy RPG UI inspired by ancient exploration, wonder, and discovery.
 * Aesthetic: Opening the journal of a legendary explorer who travelled through forgotten kingdoms.
 *
 * Key Design Principles:
 *   • Wonder & Wanderlust: Evokes curiosity, mystery, and timeless craftsmanship
 *   • Materials: Lacquered wood, aged brass, polished bronze, magical glass, old parchment
 *   • Lighting: Volumetric cyan (upper-left) + golden (lower-right), soft gradients
 *   • Depth: Multiple physically stacked layers with subtle imperfections
 *   • Decorative: Compass roses, celestial motifs, explorer symbols (never overpowering)
 *   • Typography: Roman inscription-inspired serif with generous tracking
 *   • Mood: Calm, refined, immersive, handcrafted inside the world itself
 *
 * Avoid: Gothic horror, grimdark, blood, skulls, spikes, aggressive medieval motifs
 */

import React, { useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { WanderlustSurface, InsetPanel, type MaterialLayerConfig } from '@/ui/wanderlust-surface';
import { type MaterialPreset, MATERIAL_PRESETS } from '@/ui/wanderlust-surface/materialPresets';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import {
  WanderlustHeading,
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustRequirementList,
  WanderlustRecordList,
  WanderlustDivider,
  WanderlustSectionHeader,
  WanderlustAmbientField,
} from '@/ui/wanderlust-surface/layout';
import { useGenericTokens } from '@/ui/styleLab/hooks/useGenericTokens';

type BackgroundMode = 'marble' | 'parchment' | 'void' | 'bg';

interface SandboxState {
  backgroundMode: BackgroundMode;
  activeTab: 'surface' | 'layout' | 'generic';
  physicalDepth: boolean;
  heavyFeel: boolean;
  dynamicRimLight: boolean;
}

type WanderlustShape = 'panel' | 'card' | 'badge' | 'medallion' | 'tablet';

const WANDERLUST_SHAPES: { id: WanderlustShape; label: string; description: string }[] = [
  { id: 'panel',     label: 'Panel',     description: 'Wide cinematic frame — HUD, chronicles' },
  { id: 'card',      label: 'Card',      description: 'Portrait 3:4 — quest cards, roster' },
  { id: 'badge',     label: 'Badge',     description: 'Pill shape — notifications, status' },
  { id: 'medallion', label: 'Medallion', description: 'Circular — POI, avatar frames' },
  { id: 'tablet',    label: 'Tablet',    description: '4:3 with corners — dialogs, info boxes' },
];

// ─── V9 Obsidian Palette ────────────────────────────────────────────────────────
const V9 = {
  // Core colors - Obsidian aesthetic
  obsidianBase:    '#060f16',                      // Dark teal/midnight navy base
  azureLight:      '#00e5ff',                      // Crystalline azure for light leak
  goldBronze:      '#dfb857',                      // Gold/bronze for borders
  warmGold:        '#f7dd80',                      // Light gold for text
  ivory:           '#F5F2E8',                      // Ivory text
  textPrimary:     '#F5F2E8',                      // Ivory primary
  textSecondary:   'rgba(245,242,232,0.70)',       // Ivory secondary
  textMuted:       'rgba(245,242,232,0.50)',       // Ivory muted

  // Obsidian background with azure light leak from top-left
  obsidianBg: `
    radial-gradient(circle at 0% 0%, rgba(0,229,255,0.15) 0%, transparent 50%),
    #060f16
  `.trim(),

  // Borders and glows
  borderGold:      'rgba(223,184,87,0.50)',
  glowAzure:       'rgba(0,229,255,0.25)',
  glowGold:        'rgba(223,184,87,0.20)',
};
// ────────────────────────────────────────────────────────────────────────────────

const GenericTokensDemo: React.FC<{ material: MaterialPreset; materialLayer?: any }> = ({ material, materialLayer }) => {
  const { typography, spacing } = useGenericTokens();

  return (
    <div className="flex justify-center">
      <WanderlustSurface
        shape="panel"
        material={material}
        interactive={true}
        isDragging={false}
        isPaused={false}
        materialLayer={materialLayer}
        style={{ width: '100%', maxWidth: 1400, minHeight: '80vh' }}
      >
        <div style={{ padding: '32px', background: V9.obsidianBg }}>
          <div style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: V9.textPrimary,
              marginBottom: spacing.md,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${V9.glowAzure}55`,
            }}>
              Generic Tokens · V9 Explorer Journal
            </h2>
            <p style={{ color: V9.textSecondary, fontSize: typography.fontSize.sm }}>
              Palette: Midnight Blue + Antique Bronze + Volumetric Lighting
            </p>
          </div>

          {/* Palette swatch */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: spacing['2xl'], flexWrap: 'wrap' }}>
            {[
              { label: 'Obsidian', color: V9.obsidianBase },
              { label: 'Azure',    color: V9.azureLight },
              { label: 'Gold',     color: V9.goldBronze },
              { label: 'Warm',     color: V9.warmGold },
              { label: 'Ivory',    color: V9.ivory },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '6px', background: color, border: '1px solid rgba(255,255,255,0.12)' }} />
                <span style={{ fontSize: '9px', color: V9.textSecondary, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>

          <WanderlustDivider />

          <WanderlustSectionHeader tier="primary">Tipografia · Roman Inscription</WanderlustSectionHeader>
          {(['xs','sm','base','lg','xl','2xl','3xl'] as const).map(size => (
            <div key={size} style={{ marginBottom: spacing.md, color: V9.textPrimary }}>
              <span style={{ fontSize: typography.fontSize[size], fontFamily: typography.fontFamily.display }}>
                Explorer's Journal — {size}
              </span>
            </div>
          ))}

          <WanderlustDivider />

          <WanderlustSectionHeader tier="tertiary" hint="Lacquered Wood + Aged Brass">
            InsetPanel · Slot Rack
          </WanderlustSectionHeader>
          <InsetPanel style={{ background: V9.obsidianBase, border: `1px solid ${V9.borderGold}` }}>
            <ResidentSlotRack
              slots={[
                { id: 'v9-s1', index: 0, label: 'Slot 1', assignedResidentId: null, isPlaceholder: false, dropState: 'idle' },
                { id: 'v9-s2', index: 1, label: 'Slot 2', assignedResidentId: null, isPlaceholder: false, dropState: 'idle' },
                { id: 'v9-s3', index: 2, label: 'Slot 3', assignedResidentId: null, isPlaceholder: true,  dropState: 'idle' },
              ]}
              layout="detail"
              overflowBehavior="scroll"
              slotSize={96}
            />
          </InsetPanel>
        </div>
      </WanderlustSurface>
    </div>
  );
};

export const V9SkinSandbox: React.FC = () => {
  const [wanderlustShape, setWanderlustShape] = useState<WanderlustShape>('panel');
  const [material, setMaterial] = useState<MaterialPreset>('bronze');
  const [wanderlustInteractive, setWanderlustInteractive] = useState(true);
  const [wanderlustDragging, setWanderlustDragging] = useState(false);
  const [wanderlustPaused, setWanderlustPaused] = useState(false);
  const [showPoiChrome, setShowPoiChrome] = useState(true);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'v9-skin-sandbox-drop-zone',
    data: { accepts: ['resident'], kind: 'poi' },
  });

  const [state, setState] = useState<SandboxState>({
    backgroundMode: 'bg',
    activeTab: 'surface',
    physicalDepth: true,
    heavyFeel: true,
    dynamicRimLight: true,
  });

  const setBackgroundMode = useCallback((mode: BackgroundMode) => {
    setState(prev => ({ ...prev, backgroundMode: mode }));
  }, []);

  const togglePhysicalDepth  = useCallback(() => setState(prev => ({ ...prev, physicalDepth:    !prev.physicalDepth    })), []);
  const toggleHeavyFeel      = useCallback(() => setState(prev => ({ ...prev, heavyFeel:         !prev.heavyFeel        })), []);
  const toggleDynamicRimLight= useCallback(() => setState(prev => ({ ...prev, dynamicRimLight:   !prev.dynamicRimLight  })), []);

  const materialLayerConfig: any = {
    baseTexture:       'obsidian',
    edgeTreatment:     'eroded-bronze',
    emissiveHalo:      'none',
    microInteraction:  wanderlustInteractive,
    rimLight:          state.dynamicRimLight,
    physicalDepth:     state.physicalDepth,
    heavyFeel:         state.heavyFeel,
    backgroundMode:    state.backgroundMode,
  };

  const backgroundStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: -1,
    ...(state.backgroundMode === 'marble'    && { backgroundImage: 'url(/assets/alt-visuals/v8/columns/Marble01/marble01_diff_2k.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }),
    ...(state.backgroundMode === 'parchment' && { backgroundColor: '#2a2418', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(180,140,80,0.15) 0%, transparent 70%)' }),
    ...(state.backgroundMode === 'void'      && { backgroundColor: '#02020b' }),
    ...(state.backgroundMode === 'bg'        && { backgroundImage: 'url(/assets/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }),
  };

  // Active tab pill style — azure instead of amber
  const tabActive   = 'bg-sky-500/20 text-sky-200 border border-sky-500/40';
  const tabInactive = 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30';

  return (
    <div className="min-h-screen p-8 font-serif">
      <div style={backgroundStyle} />

      {/* ── Configuration Bar ── */}
      <div className="mb-8 rounded-lg border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-[0.3em] uppercase" style={{ color: V9.azureLight }}>
              V9 Explorer Journal
            </h1>
            <p className="text-xs mt-0.5" style={{ color: V9.textSecondary, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Ancient Exploration · Wonder & Discovery
            </p>
          </div>
          <div className="flex gap-2">
            {(['surface','layout','generic'] as const).map(tab => (
              <button key={tab}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab }))}
                className={`rounded px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${state.activeTab === tab ? tabActive : tabInactive}`}
              >
                {tab === 'surface' ? 'Surface' : tab === 'layout' ? 'Layout Primitives' : 'Generic Tokens'}
              </button>
            ))}
            <button
              onClick={() => setShowPoiChrome(v => !v)}
              className={`rounded px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors border ${showPoiChrome ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' : 'bg-black/30 text-white/60 border-white/10 hover:border-white/30'}`}
            >
              {showPoiChrome ? 'Nascondi Copy' : 'Mostra Copy'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          {/* Background */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Background</span>
            <div className="flex gap-2">
              {(['marble','parchment','void','bg'] as const).map(mode => (
                <button key={mode} onClick={() => setBackgroundMode(mode)}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${state.backgroundMode === mode ? tabActive : tabInactive}`}
                >
                  {mode === 'marble' ? 'Marmo Venato' : mode === 'parchment' ? 'Pergamena Mappa' : mode === 'void' ? 'Vuoto Assoluto' : 'BG'}
                </button>
              ))}
            </div>
          </div>

          {/* Shape */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Shape</span>
            <div className="flex gap-2">
              {WANDERLUST_SHAPES.map(s => (
                <button key={s.id} onClick={() => setWanderlustShape(s.id)} title={s.description}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${wanderlustShape === s.id ? tabActive : tabInactive}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Material */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Material</span>
            <div className="flex gap-2">
              {(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map(m => (
                <button key={m} onClick={() => setMaterial(m)}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${material === m ? tabActive : tabInactive}`}
                >
                  {MATERIAL_PRESETS[m].label}
                </button>
              ))}
            </div>
          </div>

          {/* State */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">State</span>
            <div className="flex gap-4">
              {[
                { label: 'Interactive',       checked: wanderlustInteractive, onChange: () => setWanderlustInteractive(v => !v) },
                { label: 'isDragging (perf)', checked: wanderlustDragging,   onChange: () => setWanderlustDragging(v => !v)   },
                { label: 'isPaused',          checked: wanderlustPaused,     onChange: () => setWanderlustPaused(v => !v)     },
              ].map(({ label, checked, onChange }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={onChange} className="accent-sky-400" />
                  <span className="text-xs uppercase tracking-[0.15em] text-white/60">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* V9 MLE */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">V9 MLE</span>
            <div className="flex gap-4">
              {[
                { label: 'Physical Depth',    checked: state.physicalDepth,    onChange: togglePhysicalDepth   },
                { label: 'Heavy Feel',        checked: state.heavyFeel,        onChange: toggleHeavyFeel       },
                { label: 'Dynamic Rim Light', checked: state.dynamicRimLight,  onChange: toggleDynamicRimLight },
              ].map(({ label, checked, onChange }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={onChange} className="accent-sky-400" />
                  <span className="text-xs uppercase tracking-[0.15em] text-white/60">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Surface Tab ── */}
      {state.activeTab === 'surface' && (
        <div className="flex items-center justify-center">
          <WanderlustSurface
            ref={setDropRef}
            shape={wanderlustShape}
            material={material}
            interactive={wanderlustInteractive}
            isDragging={wanderlustDragging}
            isPaused={wanderlustPaused}
            materialLayer={materialLayerConfig}
            style={{
              width:  showPoiChrome ? 480 : (wanderlustShape === 'badge' ? 280 : 400),
              height: showPoiChrome ? 450 : 320,
              transition: isOver ? 'transform 0.2s ease, box-shadow 0.2s ease' : 'none',
              transform:  isOver ? 'scale(1.02)'  : 'none',
              boxShadow:  isOver ? `0 0 30px ${V9.glowAzure}66` : 'none',
            }}
          >
            <div className="relative" style={{ width: '100%', height: '100%' }}>
              {!showPoiChrome && (
                <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ height: '100%' }}>
                  <h3 className="text-sm tracking-[0.2em] uppercase" style={{ color: V9.azureLight }}>
                    {WANDERLUST_SHAPES.find(s => s.id === wanderlustShape)?.label ?? wanderlustShape}
                  </h3>
                  <p className="text-xs max-w-[80%]" style={{ color: V9.textMuted }}>
                    {WANDERLUST_SHAPES.find(s => s.id === wanderlustShape)?.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: V9.textSecondary }}>
                    <span>Shape: {wanderlustShape}</span>
                    <span>Material: {MATERIAL_PRESETS[material].label}</span>
                    {wanderlustDragging && <span style={{ color: '#f87171' }}>Filters OFF</span>}
                    {wanderlustPaused   && <span style={{ color: V9.azureLight }}>Paused</span>}
                  </div>
                </div>
              )}
              {showPoiChrome && (
                <div className="v9-poi-demo" role="group" aria-label="V9 POI Detail Preview">
                  {/* Layer 1: Texture Original (bg.png) */}
                  <img
                    src="/assets/ui/bg.png"
                    alt=""
                    className="v9-poi-demo__layer-1"
                  />

                  {/* Layer 2: Teal Dark Chromatic Fusion (Multiplier) */}
                  <div className="v9-poi-demo__layer-2" />

                  {/* Layer 3: Optical Effects and Vignette */}
                  <div className="v9-poi-demo__layer-3" />

                  {/* Close */}
                  <button type="button" className="v9-poi-demo__close" onClick={() => setShowPoiChrome(false)} aria-label="Chiudi">×</button>

                  <div className="v9-poi-demo__content">

                    {/* Ornamento bussola in alto */}
                    <div className="v9-poi-demo__compass-top">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M11 1 L12.2 9.8 L11 11 L9.8 9.8 Z" fill="#C9A227" opacity="0.9"/>
                        <path d="M21 11 L12.2 12.2 L11 11 L12.2 9.8 Z" fill="#C9A227" opacity="0.55"/>
                        <path d="M11 21 L9.8 12.2 L11 11 L12.2 12.2 Z" fill="#C9A227" opacity="0.55"/>
                        <path d="M1 11 L9.8 9.8 L11 11 L9.8 12.2 Z" fill="#C9A227" opacity="0.55"/>
                        <circle cx="11" cy="11" r="2" fill="none" stroke="#C9A227" strokeWidth="0.8" opacity="0.7"/>
                      </svg>
                    </div>

                    {/* Header: badge + titolo */}
                    <div className="v9-poi-demo__header">
                      <div className="v9-poi-demo__badge">
                        <span className="v9-poi-demo__badge-inner">Quest</span>
                      </div>
                      <h4 className="v9-poi-demo__title">Dangerous Hunt</h4>
                    </div>

                    {/* Separatore ✦ */}
                    <div className="v9-poi-demo__sep">
                      <span className="v9-poi-demo__sep-line" />
                      <span className="v9-poi-demo__sep-diamond">✦</span>
                      <span className="v9-poi-demo__sep-line" />
                    </div>

                    {/* POI Artwork Image Container */}
                    <div className="v9-poi-demo__artwork">
                      <div className="v9-poi-demo__artwork-inner">
                        {/* Astrolabe SVG watermark */}
                        <svg className="v9-poi-demo__artwork-watermark" viewBox="0 0 100 100" fill="none">
                          {/* Outer circle */}
                          <circle cx="50" cy="50" r="45" stroke="#00f0ff" strokeWidth="0.5" />
                          {/* Inner circle */}
                          <circle cx="50" cy="50" r="30" stroke="#00f0ff" strokeWidth="0.5" />
                          {/* Center circle */}
                          <circle cx="50" cy="50" r="15" stroke="#00f0ff" strokeWidth="0.5" />
                          {/* Cardinal lines */}
                          <line x1="50" y1="5" x2="50" y2="95" stroke="#00f0ff" strokeWidth="0.5" />
                          <line x1="5" y1="50" x2="95" y2="50" stroke="#00f0ff" strokeWidth="0.5" />
                          {/* Diagonal lines */}
                          <line x1="18" y1="18" x2="82" y2="82" stroke="#00f0ff" strokeWidth="0.5" />
                          <line x1="82" y1="18" x2="18" y2="82" stroke="#00f0ff" strokeWidth="0.5" />
                        </svg>
                      </div>
                    </div>

                    {/* Stats box */}
                    <div className="v9-poi-demo__stats">
                      {/* Stat: Danger */}
                      <div className="v9-poi-demo__stat-row">
                        <svg className="v9-poi-demo__stat-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          {/* Compass/sun gold icon */}
                          <circle cx="8" cy="8" r="6" stroke="#C9A227" strokeWidth="1" opacity="0.8"/>
                          <circle cx="8" cy="8" r="3" stroke="#C9A227" strokeWidth="0.7" opacity="0.6"/>
                          <line x1="8" y1="2" x2="8" y2="14" stroke="#C9A227" strokeWidth="0.8" opacity="0.7"/>
                          <line x1="2" y1="8" x2="14" y2="8" stroke="#C9A227" strokeWidth="0.8" opacity="0.7"/>
                          <circle cx="8" cy="8" r="1" fill="#C9A227" opacity="0.9"/>
                        </svg>
                        <span className="v9-poi-demo__stat-label">Danger</span>
                        <span className="v9-poi-demo__stat-dots" aria-hidden="true" />
                        <span className="v9-poi-demo__stat-value v9-danger">High</span>
                      </div>
                      {/* Divisore interno */}
                      <div className="v9-poi-demo__stat-inner-sep">
                        <span className="v9-poi-demo__stat-inner-line" />
                        <span className="v9-poi-demo__sep-diamond" style={{ fontSize: '6px', opacity: 0.5 }}>✦</span>
                        <span className="v9-poi-demo__stat-inner-line" />
                      </div>
                      {/* Stat: Duration */}
                      <div className="v9-poi-demo__stat-row">
                        <svg className="v9-poi-demo__stat-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          {/* Bronze hourglass icon */}
                          <rect x="4" y="1" width="8" height="2" rx="1" stroke="#8B6914" strokeWidth="1" fill="none" opacity="0.8"/>
                          <rect x="4" y="13" width="8" height="2" rx="1" stroke="#8B6914" strokeWidth="1" fill="none" opacity="0.8"/>
                          <path d="M5 3 Q5 8 8 9 Q5 10 5 13" stroke="#8B6914" strokeWidth="1" fill="none" opacity="0.6"/>
                          <path d="M11 3 Q11 8 8 9 Q11 10 11 13" stroke="#8B6914" strokeWidth="1" fill="none" opacity="0.6"/>
                          <circle cx="8" cy="9" r="1" fill="#8B6914" opacity="0.5"/>
                        </svg>
                        <span className="v9-poi-demo__stat-label">Duration</span>
                        <span className="v9-poi-demo__stat-dots" aria-hidden="true" />
                        <span className="v9-poi-demo__stat-value v9-duration">8s</span>
                      </div>
                    </div>

                    {/* Footer: CTA con ornamenti */}
                    <div className="v9-poi-demo__footer">
                      <div className="v9-poi-demo__cta-wrap">
                        <span className="v9-poi-demo__cta-ornament">✦</span>
                        <button type="button" className="v9-poi-demo__cta">Avvia</button>
                        <span className="v9-poi-demo__cta-ornament">✦</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </WanderlustSurface>
        </div>
      )}

      {/* ── Layout Primitives Tab ── */}
      {state.activeTab === 'layout' && (
        <div className="flex justify-center">
          <WanderlustSurface
            shape="panel"
            material={material}
            interactive={wanderlustInteractive}
            isDragging={wanderlustDragging}
            isPaused={wanderlustPaused}
            materialLayer={materialLayerConfig}
            style={{ width: 680, minHeight: 500 }}
          >
            <WanderlustAmbientField paused={wanderlustDragging}>
              <div style={{ padding: '24px', background: V9.obsidianBg, borderRadius: 'inherit' }}>
                <WanderlustHeading
                  title="Layout Primitives Demo"
                  subtitle="V9 Obsidian Aesthetic"
                  description="Palette: Obsidian base (#060f16) · Azure light leak · Gold/bronze borders."
                />
                <WanderlustDivider />

                <WanderlustSectionHeader tier="primary">Field Group</WanderlustSectionHeader>
                <WanderlustFieldGroup layout="columns" columns={3}>
                  <WanderlustField label="Durata"    value="8000s"  />
                  <WanderlustField label="Ricompensa" value="Gold +15" />
                  <WanderlustField label="ETA"        value="2800s"  />
                </WanderlustFieldGroup>

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary" hint="squadra attuale">Requisiti</WanderlustSectionHeader>
                <WanderlustRequirementList
                  requirements={[
                    { label: 'Forza',        current: 14, required: 12 },
                    { label: 'Destrezza',    current:  9, required: 11 },
                    { label: 'Costituzione', current: 12, required: 10 },
                  ]}
                />

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary">Registro Eventi</WanderlustSectionHeader>
                <WanderlustRecordList
                  columns={[
                    { width: '60px', variant: 'caption' },
                    { width: '1fr',  variant: 'body'    },
                  ]}
                  records={[
                    ['17:33', 'Activity started'],
                    ['18:03', 'Worker assigned to slot 3'],
                    ['18:23', 'Progress update: 65%'],
                  ]}
                  rail
                />

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary" hint="obsidian base — gold trim">
                  InsetPanel · Slot Rack
                </WanderlustSectionHeader>
                {/* Obsidian base with gold trim for contrast */}
                <InsetPanel style={{ background: V9.obsidianBase, border: `1px solid ${V9.borderGold}` }}>
                  <ResidentSlotRack
                    slots={[
                      { id: 'v9-l1', index: 0, label: 'Slot 1', assignedResidentId: null, isPlaceholder: false, dropState: 'idle' },
                      { id: 'v9-l2', index: 1, label: 'Slot 2', assignedResidentId: null, isPlaceholder: false, dropState: 'idle' },
                      { id: 'v9-l3', index: 2, label: 'Slot 3', assignedResidentId: null, isPlaceholder: true,  dropState: 'idle' },
                    ]}
                    layout="detail"
                    overflowBehavior="scroll"
                    slotSize={96}
                  />
                </InsetPanel>

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary" hint="old parchment — aged brass frame">
                  InsetPanel · Parchment (Requisiti)
                </WanderlustSectionHeader>
                <InsetPanel material="parchment">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Forza',        current: 45, required: 60 },
                      { label: 'Destrezza',    current: 38, required: 50 },
                      { label: 'Costituzione', current: 42, required: 40 },
                    ].map((req, i) => {
                      const met = req.current >= req.required;
                      const pct = Math.min(1, req.current / req.required);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ flex: '0 0 88px', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(55,38,12,0.65)' }}>
                            {req.label}
                          </span>
                          <div style={{ flex: 1, height: 3, background: 'rgba(110,80,30,0.18)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct*100}%`, height: '100%', background: met ? 'rgba(65,115,50,0.75)' : 'rgba(160,85,25,0.65)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                          </div>
                          <span style={{ fontSize: 11, minWidth: 46, textAlign: 'right', color: met ? 'rgba(45,90,35,0.9)' : 'rgba(130,65,20,0.9)' }}>
                            {req.current}<span style={{ opacity: 0.5, fontSize: 9 }}>/{req.required}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </InsetPanel>
              </div>
            </WanderlustAmbientField>
          </WanderlustSurface>
        </div>
      )}

      {/* ── Generic Tokens Tab ── */}
      {state.activeTab === 'generic' && (
        <GenericTokensDemo material={material} materialLayer={materialLayerConfig} />
      )}

      {/* ── V9 Theme CSS ── */}
      <style>{`
        /* WanderlustSurface content: z sopra l'SVG frame, height per propagare al child */
        .ws-content { z-index: 2; padding: 0; height: 100%; box-sizing: border-box; }

        /* ══════════════════════════════════════════════════════════════
           POI Demo — V9 Obsidian Aesthetic
           MASTER CONTAINER: Rigid layer structure
        ══════════════════════════════════════════════════════════════ */
        .v9-poi-demo {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          color: ${V9.textPrimary};
          font-family: 'EB Garamond', 'Georgia', serif;
        }

        /* Layer 1: Texture Original (bg.png) */
        .v9-poi-demo__layer-1 {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          opacity: 0.45;
          mix-blend-mode: normal;
        }

        /* Layer 2: Teal Dark Chromatic Fusion (Multiplier) */
        .v9-poi-demo__layer-2 {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(5, 34, 43, 0.85) 0%, rgba(3, 18, 24, 0.95) 100%);
          mix-blend-mode: multiply;
          pointer-events: none;
        }

        /* Layer 3: Optical Effects and Vignette */
        .v9-poi-demo__layer-3 {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 15%, rgba(0, 240, 255, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 85% 85%, rgba(223, 184, 87, 0.12) 0%, transparent 50%);
          mix-blend-mode: screen;
          box-shadow: inset 0 0 90px rgba(1, 11, 14, 0.98);
          pointer-events: none;
        }

        /* ── Close button — embossed, evidente ── */
        .v9-poi-demo__close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid rgba(201,162,39,0.80);
          background: radial-gradient(circle at 42% 38%,
            rgba(201,162,39,0.28) 0%,
            rgba(12,18,40,0.92) 65%
          );
          color: ${V9.warmGold};
          font-size: 1.15rem;
          font-weight: 300;
          line-height: 1;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          /* rilievo: ombra esterna + bordo luminoso interno */
          box-shadow:
            0 3px 10px rgba(0,0,0,0.70),
            0 1px 3px rgba(0,0,0,0.90),
            inset 0 1px 0 rgba(201,162,39,0.35),
            inset 0 -1px 0 rgba(0,0,0,0.50);
          text-shadow: 0 1px 3px rgba(0,0,0,0.90);
          transition: all 0.18s ease;
        }
        .v9-poi-demo__close:hover {
          border-color: ${V9.warmGold};
          box-shadow:
            0 4px 14px rgba(0,0,0,0.75),
            0 0 10px rgba(201,162,39,0.25),
            inset 0 1px 0 rgba(201,162,39,0.50),
            inset 0 -1px 0 rgba(0,0,0,0.50);
          background: radial-gradient(circle at 42% 38%,
            rgba(201,162,39,0.40) 0%,
            rgba(12,18,40,0.95) 65%
          );
        }

        /* ── Main content (above background layers) ── */
        .v9-poi-demo__content {
          position: relative;
          z-index: 10;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 8px 20px 12px;
          box-sizing: border-box;
        }

        /* ── Bussola ornamentale top-center ── */
        .v9-poi-demo__compass-top {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
          opacity: 0.85;
        }

        /* ── Header: badge + titolo ── */
        .v9-poi-demo__header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        /* Badge: transparent with backdrop-filter for texture show-through */
        .v9-poi-demo__badge {
          position: relative;
          padding: 5px 13px;
          border: 1px solid rgba(223,184,87,0.40);
          border-radius: 4px;
          /* Transparent background for texture show-through */
          background: rgba(4, 22, 28, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow:
            0 1px 4px rgba(0,0,0,0.50),
            0 0 6px rgba(223,184,87,0.10),
            inset 0 1px 0 rgba(223,184,87,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.35);
        }
        /* ◆ angolini decorativi - smaller, subtler */
        .v9-poi-demo__badge::before,
        .v9-poi-demo__badge::after {
          content: '◆';
          position: absolute;
          font-size: 5px;
          color: rgba(223,184,87,0.50);
          line-height: 1;
        }
        .v9-poi-demo__badge::before { top: -3px; left: -3px; }
        .v9-poi-demo__badge::after  { bottom: -3px; right: -3px; }
        .v9-poi-demo__badge-inner {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.28em;
          color: ${V9.warmGold};
          font-family: 'Cinzel', 'Georgia', serif;
          text-shadow: 0 0 8px rgba(201,162,39,0.60), 0 1px 2px rgba(0,0,0,0.70);
        }

        /* Titolo: gold shimmer + Cinzel bold + glow multiplo */
        .v9-poi-demo__title {
          margin: 0;
          font-family: 'Cinzel', 'Georgia', serif;
          font-size: 1.55rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          /* gradiente oro a 5 stop — simula la lucentezza del metallo */
          background: linear-gradient(168deg,
            #fff5c0 0%,
            #f7dd80 18%,
            ${V9.warmGold} 42%,
            #e8c340 60%,
            #a87010 80%,
            #f0d070 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          /* glow caldo + ombra per profondità */
          filter:
            drop-shadow(0 0 12px rgba(201,162,39,0.55))
            drop-shadow(0 2px 4px rgba(0,0,0,0.80));
          line-height: 1.15;
        }

        /* ── Separatore ✦ ── */
        .v9-poi-demo__sep {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 7px;
        }
        .v9-poi-demo__sep-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(201,162,39,0.50), transparent);
        }
        .v9-poi-demo__sep-diamond {
          font-size: 8px;
          color: ${V9.warmGold};
          opacity: 0.75;
          flex-shrink: 0;
        }

        /* ── POI Artwork Image Container (NEUTRAL) ── */
        .v9-poi-demo__artwork {
          position: relative;
          width: 100%;
          height: 130px;
          margin-bottom: 10px;
          border-radius: 6px;
          overflow: hidden;
          /* Transparent background */
          background: rgba(3, 15, 20, 0.4);
          border: 1px solid rgba(223, 184, 87, 0.15);
        }
        .v9-poi-demo__artwork-inner {
          width: 100%;
          height: 100%;
          /* Neutral gradient */
          background: linear-gradient(135deg,
            rgba(20,28,35,0.8) 0%,
            rgba(15,23,30,0.9) 50%,
            rgba(18,26,33,0.85) 100%
          );
          position: relative;
        }
        /* Astrolabe SVG watermark - ultra-light (3% opacity) */
        .v9-poi-demo__artwork-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          opacity: 0.03;
          pointer-events: none;
        }

        /* ── Body placeholder lines (removed, kept for reference) ── */
        .v9-poi-demo__body {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 8px;
        }
        .v9-poi-demo__line {
          height: 6px;
          border-radius: 3px;
          width: 100%;
          background: linear-gradient(to right,
            rgba(240,239,228,0.14) 0%,
            rgba(240,239,228,0.08) 100%
          );
        }
        .v9-poi-demo__line.short { width: 55%; }

        /* ── Stats box — warm bronze frame to contrast with cold obsidian background ── */
        .v9-poi-demo__stats {
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
          border-radius: 7px;
          background: rgba(6,15,22,0.75);
          /* warm bronze border for contrast */
          border: 1px solid rgba(223,184,87,0.45);
          box-shadow:
            0 0 0 2px rgba(6,15,22,0.80),
            0 0 0 3px rgba(223,184,87,0.15),
            0 4px 16px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(223,184,87,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.45);
          overflow: hidden;
        }

        .v9-poi-demo__stat-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
        }
        .v9-poi-demo__stat-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .v9-poi-demo__stat-label {
          font-size: 0.72rem;
          font-family: 'Cinzel', 'Georgia', serif;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240,239,228,0.75);
          flex-shrink: 0;
        }
        /* Gradient div separator - metal groove effect */
        .v9-poi-demo__stat-dots {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(223, 184, 87, 0.3) 20%, rgba(223, 184, 87, 0.3) 80%, transparent);
          margin: 0 4px;
          align-self: center;
        }
        .v9-poi-demo__stat-value {
          font-size: 0.85rem;
          font-weight: 700;
          font-family: 'Cinzel', 'Georgia', serif;
          flex-shrink: 0;
        }
        .v9-danger   { color: #e07060; }
        .v9-duration { color: #67e8f9; }

        /* Separatore interno alle stat */
        .v9-poi-demo__stat-inner-sep {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
        }
        .v9-poi-demo__stat-inner-line {
          flex: 1;
          height: 1px;
          background: rgba(201,162,39,0.20);
        }

        /* ── Footer: bottone AVVIA ── */
        .v9-poi-demo__footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 8px;
        }
        .v9-poi-demo__cta-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .v9-poi-demo__cta-ornament {
          font-size: 8px;
          color: ${V9.warmGold};
          opacity: 0.65;
          line-height: 1;
        }

        /* Bottone AVVIA: transparent with backdrop-filter for texture show-through */
        .v9-poi-demo__cta {
          padding: 9px 32px;
          border-radius: 9999px;
          border: 1.5px solid rgba(223, 184, 87, 0.8);
          /* Transparent background for texture show-through */
          background: rgba(4, 22, 28, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          /* Gold glow */
          box-shadow: 0 0 12px rgba(223, 184, 87, 0.15);
          color: ${V9.warmGold};
          font-family: 'Cinzel', 'Georgia', serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          cursor: pointer;
          transition: filter 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .v9-poi-demo__cta:hover {
          filter: brightness(1.15);
          box-shadow: 0 0 18px rgba(223, 184, 87, 0.35);
          border-color: ${V9.azureLight};
        }
      `}</style>
    </div>
  );
};

export default V9SkinSandbox;
