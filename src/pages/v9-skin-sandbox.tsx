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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { V9GlassLayers } from '@/ui/v9-skin/V9GlassLayers';
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

// ─── DraggablePoiPanel — inner component (must live inside DndContext) ───────
type PanelDragState = 'idle' | 'lifted' | 'thud';

interface DraggablePanelProps {
  children: React.ReactNode;
  offset: { x: number; y: number };
  dragState: PanelDragState;
  onDragStateChange: (s: PanelDragState) => void;
  dropRef: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

const DraggablePoiPanel: React.FC<DraggablePanelProps> = ({
  children, offset, dragState, onDragStateChange, dropRef,
}) => {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: 'poi-panel',
  });

  const prevDragging = useRef(false);
  useEffect(() => {
    if (isDragging && !prevDragging.current) onDragStateChange('lifted');
    prevDragging.current = isDragging;
  }, [isDragging, onDragStateChange]);

  const combinedRef = useCallback((node: HTMLElement | null) => {
    setDragRef(node);
    dropRef(node);
  }, [setDragRef, dropRef]);

  // Apply persistent offset + current drag delta. No lag modifier — position
  // is accurate so e.delta on drop correctly matches visual position.
  const tx = offset.x + (transform?.x ?? 0);
  const ty = offset.y + (transform?.y ?? 0);

  return (
    <div
      ref={combinedRef}
      data-drag-state={dragState}
      className="v9-panel-draggable"
      style={{
        transform: `translate(${tx}px, ${ty}px)`,
        transition: isDragging ? 'none' : 'transform 0.50s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────────

export const V9SkinSandbox: React.FC = () => {
  const [wanderlustShape, setWanderlustShape] = useState<WanderlustShape>('panel');
  const [material, setMaterial] = useState<MaterialPreset>('bronze');
  const [wanderlustInteractive, setWanderlustInteractive] = useState(true);
  const [wanderlustDragging, setWanderlustDragging] = useState(false);
  const [wanderlustPaused, setWanderlustPaused] = useState(false);
  const [showPoiChrome, setShowPoiChrome] = useState(true);
  const [poiVersion, setPoiVersion] = useState<'surface' | 'layout' | 'sapphire'>('surface');

  // ── Drag state ───────────────────────────────────────────────────
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const [panelDragState, setPanelDragState] = useState<PanelDragState>('idle');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setPanelOffset(prev => ({ x: prev.x + e.delta.x, y: prev.y + e.delta.y }));
    setPanelDragState('thud');
    setTimeout(() => setPanelDragState('idle'), 540);
  }, []);
  // ────────────────────────────────────────────────────────────────

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
    position: 'fixed', inset: '-12%', zIndex: -1,
    ...(state.backgroundMode === 'marble'    && { backgroundImage: 'url(/assets/alt-visuals/v8/columns/Marble01/marble01_diff_2k.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }),
    ...(state.backgroundMode === 'parchment' && { backgroundColor: '#2a2418', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(180,140,80,0.15) 0%, transparent 70%)' }),
    ...(state.backgroundMode === 'void'      && { backgroundColor: '#02020b' }),
    ...(state.backgroundMode === 'bg'        && { backgroundImage: 'url(/assets/ui/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }),
  };

  // Active tab pill style — azure instead of amber
  const tabActive   = 'bg-sky-500/20 text-sky-200 border border-sky-500/40';
  const tabInactive = 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30';

  return (
    <div className="min-h-screen p-8 font-serif">
      <div style={backgroundStyle} className={state.backgroundMode === 'bg' ? 'v9-bg-animated' : ''} />

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
              {showPoiChrome ? 'Nascondi POI' : 'Mostra POI'}
            </button>
          </div>
        </div>

        {/* POI Version Selector */}
        {showPoiChrome && (
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">POI Version</span>
            <div className="flex gap-2">
              {([
                { id: 'surface',  label: 'Surface' },
                { id: 'layout',   label: 'Layout Primitives' },
                { id: 'sapphire', label: 'Zaffiro Abissale' },
              ] as const).map(version => (
                <button key={version.id}
                  onClick={() => setPoiVersion(version.id)}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors border ${poiVersion === version.id ? 'bg-sky-500/20 text-sky-200 border-sky-500/40' : 'bg-black/30 text-white/60 border-white/10 hover:border-white/30'}`}
                >
                  {version.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh', position: 'relative' }}>
          <DraggablePoiPanel
            offset={panelOffset}
            dragState={panelDragState}
            onDragStateChange={setPanelDragState}
            dropRef={setDropRef}
          >
          <WanderlustSurface
            shape={wanderlustShape}
            material={material}
            interactive={wanderlustInteractive}
            isDragging={wanderlustDragging || panelDragState === 'lifted'}
            isPaused={wanderlustPaused}
            materialLayer={materialLayerConfig}
            style={{
              width:  showPoiChrome ? 480 : (wanderlustShape === 'badge' ? 280 : 400),
              height: showPoiChrome ? 450 : 320,
              boxShadow: isOver ? `0 0 30px ${V9.glowAzure}66` : undefined,
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
                <>
                  {poiVersion === 'surface' && (
                    <V9GlassLayers
                      className="v9-poi-demo v9-poi-demo--surface"
                      role="group"
                      aria-label="V9 POI Detail Preview - Surface Version"
                    >
                      {/* Close button */}
                      <button type="button" className="v9-poi-demo__close" title="Usa 'Nascondi POI' in alto per nascondere" aria-label="Chiudi (demo)">×</button>

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

                        {/* POI Artwork */}
                        <div className="v9-poi-demo__artwork">
                          <div className="v9-poi-demo__artwork-inner">
                            <svg className="v9-poi-demo__artwork-watermark" viewBox="0 0 300 130" fill="none" preserveAspectRatio="xMidYMid slice">
                              <circle cx="150" cy="65" r="58" stroke="#dfb857" strokeWidth="0.4" />
                              <circle cx="150" cy="65" r="42" stroke="#dfb857" strokeWidth="0.3" strokeDasharray="2 3" />
                              <circle cx="150" cy="65" r="26" stroke="#00f0ff" strokeWidth="0.3" />
                              <ellipse cx="150" cy="65" rx="58" ry="20" stroke="#00f0ff" strokeWidth="0.3" strokeDasharray="1 4" />
                              <line x1="150" y1="7" x2="150" y2="123" stroke="#dfb857" strokeWidth="0.3" />
                              <line x1="92" y1="65" x2="208" y2="65" stroke="#dfb857" strokeWidth="0.3" />
                              <path d="M 20 110 Q 70 40 150 65" stroke="#00f0ff" strokeWidth="0.35" strokeDasharray="3 4" />
                              <path d="M 280 20 Q 230 90 150 65" stroke="#dfb857" strokeWidth="0.35" strokeDasharray="3 4" />
                              <polyline points="35,30 55,42 48,62 68,74 60,95" stroke="#dfb857" strokeWidth="0.5" />
                              {['35,30','55,42','48,62','68,74','60,95'].map((p, i) => {
                                const [x, y] = p.split(',').map(Number);
                                return <circle key={i} cx={x} cy={y} r={i === 2 ? 2 : 1.3} fill="#dfb857" />;
                              })}
                              <polyline points="235,25 252,45 270,38 262,68 244,80" stroke="#00f0ff" strokeWidth="0.5" />
                              {['235,25','252,45','270,38','262,68','244,80'].map((p, i) => {
                                const [x, y] = p.split(',').map(Number);
                                return <circle key={i} cx={x} cy={y} r={i === 3 ? 2 : 1.2} fill="#00f0ff" />;
                              })}
                              {[[105, 25], [190, 105], [120, 100], [95, 80], [205, 30]].map(([x, y], i) => (
                                <path key={i} d={`M ${x} ${y - 3} L ${x + 1} ${y - 1} L ${x + 3} ${y} L ${x + 1} ${y + 1} L ${x} ${y + 3} L ${x - 1} ${y + 1} L ${x - 3} ${y} L ${x - 1} ${y - 1} Z`} fill="#dfb857" />
                              ))}
                            </svg>
                          </div>
                        </div>

                        {/* Stats box */}
                        <div className="v9-poi-demo__stats">
                          <div className="v9-poi-demo__stat-row">
                            <svg className="v9-poi-demo__stat-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                          <div className="v9-poi-demo__stat-inner-sep">
                            <span className="v9-poi-demo__stat-inner-line" />
                            <span className="v9-poi-demo__sep-diamond" style={{ fontSize: '7px', opacity: 0.6 }}>◈</span>
                            <span className="v9-poi-demo__stat-inner-line" />
                          </div>
                          <div className="v9-poi-demo__stat-row">
                            <svg className="v9-poi-demo__stat-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                        <span className="v9-poi-demo__cta-ornament">◈</span>
                        <button type="button" className="v9-poi-demo__cta">Avvia</button>
                        <span className="v9-poi-demo__cta-ornament">◈</span>
                      </div>
                    </div>

                  </div>
                </V9GlassLayers>
                  )}

                  {poiVersion === 'layout' && (
                    <div className="v9-poi-demo v9-poi-demo--layout" role="group" aria-label="V9 POI Detail Preview - Layout Primitives Version">
                      <button type="button" className="v9-poi-demo__close" title="Usa 'Nascondi POI' in alto per nascondere" aria-label="Chiudi (demo)">×</button>
                      <div className="v9-poi-demo__content">
                        <div className="v9-poi-demo__header">
                          <div className="v9-poi-demo__badge">
                            <span className="v9-poi-demo__badge-inner">Quest</span>
                          </div>
                          <h4 className="v9-poi-demo__title">Dangerous Hunt</h4>
                        </div>
                        <div className="v9-poi-demo__sep">
                          <span className="v9-poi-demo__sep-line" />
                          <span className="v9-poi-demo__sep-diamond">✦</span>
                          <span className="v9-poi-demo__sep-line" />
                        </div>
                        <div className="v9-poi-demo__artwork">
                          <div className="v9-poi-demo__artwork-inner">
                            <svg className="v9-poi-demo__artwork-watermark" viewBox="0 0 300 130" fill="none" preserveAspectRatio="xMidYMid slice">
                              <circle cx="150" cy="65" r="58" stroke="#dfb857" strokeWidth="0.4" />
                              <circle cx="150" cy="65" r="42" stroke="#dfb857" strokeWidth="0.3" strokeDasharray="2 3" />
                              <circle cx="150" cy="65" r="26" stroke="#00f0ff" strokeWidth="0.3" />
                            </svg>
                          </div>
                        </div>
                        <div className="v9-poi-demo__stats">
                          <div className="v9-poi-demo__stat-row">
                            <span className="v9-poi-demo__stat-label">Danger</span>
                            <span className="v9-poi-demo__stat-dots" aria-hidden="true" />
                            <span className="v9-poi-demo__stat-value v9-danger">High</span>
                          </div>
                          <div className="v9-poi-demo__stat-inner-sep">
                            <span className="v9-poi-demo__stat-inner-line" />
                            <span className="v9-poi-demo__sep-diamond" style={{ fontSize: '7px', opacity: 0.6 }}>◈</span>
                            <span className="v9-poi-demo__stat-inner-line" />
                          </div>
                          <div className="v9-poi-demo__stat-row">
                            <span className="v9-poi-demo__stat-label">Duration</span>
                            <span className="v9-poi-demo__stat-dots" aria-hidden="true" />
                            <span className="v9-poi-demo__stat-value v9-duration">8s</span>
                          </div>
                        </div>
                        <div className="v9-poi-demo__footer">
                          <div className="v9-poi-demo__cta-wrap">
                            <span className="v9-poi-demo__cta-ornament">◈</span>
                            <button type="button" className="v9-poi-demo__cta">Avvia</button>
                            <span className="v9-poi-demo__cta-ornament">◈</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Zaffiro Abissale — spedizione navale, argento lunare ── */}
                  {poiVersion === 'sapphire' && (
                    <V9GlassLayers
                      variant="sapphire"
                      className="v9-poi-demo"
                      role="group"
                      aria-label="V9 POI Detail Preview - Zaffiro Abissale"
                    >
                      <button type="button" className="v9-poi-demo__close" title="Usa 'Nascondi POI' in alto per nascondere" aria-label="Chiudi (demo)">×</button>
                      <div className="v9-poi-demo__content">
                        <div className="v9-poi-demo__header">
                          <div className="v9-poi-demo__badge">
                            <span className="v9-poi-demo__badge-inner">Viaggio</span>
                          </div>
                          <h4 className="v9-poi-demo__title">Rotta del Leviatano</h4>
                        </div>
                        <p className="v9-var-flavor">Le carte nautiche finiscono dove inizia il suo canto.</p>
                        <div className="v9-poi-demo__sep">
                          <span className="v9-poi-demo__sep-line" />
                          <span className="v9-poi-demo__sep-diamond v9-accent-glyph">✦</span>
                          <span className="v9-poi-demo__sep-line" />
                        </div>
                        <div className="v9-poi-demo__artwork">
                          <div className="v9-poi-demo__artwork-inner">
                            {/* Rosa dei venti abissale */}
                            <svg className="v9-poi-demo__artwork-watermark" viewBox="0 0 300 130" fill="none" preserveAspectRatio="xMidYMid slice">
                              <circle cx="150" cy="65" r="55" stroke="#8fd6ff" strokeWidth="0.4" opacity="0.7" />
                              <circle cx="150" cy="65" r="38" stroke="#8fd6ff" strokeWidth="0.3" strokeDasharray="3 4" opacity="0.6" />
                              <path d="M150 12 L156 59 L150 65 L144 59 Z" stroke="#dfb857" strokeWidth="0.5" opacity="0.8" />
                              <path d="M150 118 L144 71 L150 65 L156 71 Z" stroke="#dfb857" strokeWidth="0.4" opacity="0.5" />
                              <path d="M60 90 Q100 70 140 88 Q180 106 240 82" stroke="#8fd6ff" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.7" />
                              <path d="M55 102 Q105 84 150 100 Q195 116 245 96" stroke="#8fd6ff" strokeWidth="0.4" strokeDasharray="1 3" opacity="0.5" />
                            </svg>
                          </div>
                        </div>
                        <div className="v9-poi-demo__stats">
                          <div className="v9-poi-demo__stat-row">
                            <span className="v9-poi-demo__stat-label">Profondità</span>
                            <span className="v9-poi-demo__stat-dots" aria-hidden="true" />
                            <span className="v9-poi-demo__stat-value v9-accent-value">Abissale</span>
                          </div>
                          <div className="v9-poi-demo__stat-inner-sep">
                            <span className="v9-poi-demo__stat-inner-line" />
                            <span className="v9-poi-demo__sep-diamond" style={{ fontSize: '7px', opacity: 0.6 }}>◈</span>
                            <span className="v9-poi-demo__stat-inner-line" />
                          </div>
                          <div className="v9-poi-demo__stat-row">
                            <span className="v9-poi-demo__stat-label">Durata</span>
                            <span className="v9-poi-demo__stat-dots" aria-hidden="true" />
                            <span className="v9-poi-demo__stat-value v9-accent-value">12s</span>
                          </div>
                        </div>
                        <div className="v9-poi-demo__footer">
                          <div className="v9-poi-demo__cta-wrap">
                            <span className="v9-poi-demo__cta-ornament">◈</span>
                            <button type="button" className="v9-poi-demo__cta">Salpa</button>
                            <span className="v9-poi-demo__cta-ornament">◈</span>
                          </div>
                          <div className="v9-var-btn-row">
                            <button type="button" className="v9-var-btn">Sonda</button>
                            <button type="button" className="v9-var-btn">Ritira</button>
                          </div>
                        </div>
                      </div>
                    </V9GlassLayers>
                  )}

                </>
              )}
            </div>
          </WanderlustSurface>
          </DraggablePoiPanel>
        </div>
        </DndContext>
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

        /* ── Sfondo animato: lento drift + respiro + colori vividi ── */
        .v9-bg-animated {
          animation:
            v9BgDrift 45s ease-in-out infinite alternate,
            v9BgBreath 28s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }
        @keyframes v9BgDrift {
          0%   { transform: scale(1.12) translate(0%, 0%); }
          25%  { transform: scale(1.12) translate(-1.2%, -0.7%); }
          55%  { transform: scale(1.12) translate(-0.4%, -1.4%); }
          80%  { transform: scale(1.12) translate(-1.8%, -0.3%); }
          100% { transform: scale(1.12) translate(-0.8%, -1.1%); }
        }
        @keyframes v9BgBreath {
          from { opacity: 0.88; }
          to   { opacity: 1.00; }
        }

        /* ── Drag pesante ── */
        .v9-panel-draggable {
          cursor: grab;
          touch-action: none;
          user-select: none;
          /* hover: glow ambientale oro, NO scala */
          transition:
            filter 0.35s ease-out,
            box-shadow 0.35s ease-out;
        }
        /* HOVER: pulsazione oro sul frame — niente scala, effetto "risponde alla mano" */
        .v9-panel-draggable:hover {
          filter:
            drop-shadow(0 0 14px rgba(223,184,87,0.45))
            drop-shadow(0 0 30px rgba(0,229,255,0.18));
        }

        /* LIFTED: sale in aria — scala cresce, ombra profonda */
        .v9-panel-draggable[data-drag-state="lifted"] {
          cursor: grabbing;
          filter:
            drop-shadow(0 28px 48px rgba(0,0,0,0.72))
            drop-shadow(0 8px 16px rgba(0,0,0,0.55));
          transform-origin: center;
          /* la scala viene sovrapposta via animation ma il translate viene da dnd */
          animation: v9Lift 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes v9Lift {
          from { scale: 1.00; }
          to   { scale: 1.04; }
        }

        /* THUD: atterra con peso, rimbalzo fisico */
        .v9-panel-draggable[data-drag-state="thud"] {
          animation: v9Thud 0.54s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes v9Thud {
          0%   { scale: 1.04; filter: drop-shadow(0 28px 48px rgba(0,0,0,0.72)); }
          38%  { scale: 1.00; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.60)); }   /* impatto */
          58%  { scale: 1.01; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.40)); }  /* micro-rimbalzo */
          100% { scale: 1.00; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.25)); }
        }

        /* ══════════════════════════════════════════════════════════════
           POI Demo — V9 Obsidian Aesthetic
           MASTER CONTAINER: Rigid layer structure
        ══════════════════════════════════════════════════════════════ */
        /* ══ MASTER: Obsidian Shield for Text Readability ══
           Background is solid obsidian (#060f16) for crystal-clear text readability.
           Oil painting texture is confined ONLY to the artwork slot at 10% opacity. */
        .v9-poi-demo {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          isolation: isolate;
          color: ${V9.textPrimary};
          font-family: 'EB Garamond', 'Georgia', serif;
          background-color: #060f16;
          border: 1.5px solid rgba(223, 184, 87, 0.4);
          border-radius: 8px;
          box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* ── POI Artwork Image Container: Confined oil painting texture at 10% opacity ── */
        .v9-poi-demo__artwork {
          position: relative;
          width: 100%;
          height: 130px;
          margin-bottom: 10px;
          border-radius: 6px;
          overflow: hidden;
          background-image: url('/assets/bg.png');
          background-size: cover;
          background-position: center;
          opacity: 0.1;
          border: 1px solid rgba(223, 184, 87, 0.15);
        }
        .v9-poi-demo__artwork-inner {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
        }

        /* ── Version-specific styles ── */
        /* Surface: Full-featured with all decorations */
        .v9-poi-demo--surface {
          border-color: rgba(223, 184, 87, 0.5);
        }
        .v9-poi-demo--surface .v9-poi-demo__compass-top {
          display: flex;
        }
        .v9-poi-demo--surface .v9-poi-demo__stat-icon {
          display: block;
        }

        /* Layout: Minimalist, no compass, no icons, simplified artwork */
        .v9-poi-demo--layout {
          border-color: rgba(223, 184, 87, 0.3);
        }
        .v9-poi-demo--layout .v9-poi-demo__compass-top {
          display: none;
        }
        .v9-poi-demo--layout .v9-poi-demo__stat-icon {
          display: none;
        }
        .v9-poi-demo--layout .v9-poi-demo__artwork-watermark {
          opacity: 0.15;
        }

        /* Aureo Profondo: Warm gold with soft shadows, cinematic depth */
        .v9-poi-demo[variant="aureo"] {
          --v9-accent: #e8c547;
          --v9-accent-soft: rgba(232, 197, 71, 0.4);
          border-color: rgba(232, 197, 71, 0.5);
          background: linear-gradient(135deg, rgba(15, 12, 6, 0.95) 0%, rgba(20, 16, 10, 0.98) 100%);
          box-shadow:
            0 20px 50px rgba(232, 197, 71, 0.15),
            0 15px 35px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(232, 197, 71, 0.25);
        }
        .v9-poi-demo[variant="aureo"] .v9-poi-demo__artwork {
          opacity: 0.12;
          background: radial-gradient(circle at 40% 30%, rgba(232, 197, 71, 0.2), transparent);
        }

        /* Cristallo Abissale: Deep cyan, layered, mysterious */
        .v9-poi-demo[variant="cristallo"] {
          --v9-accent: #5dd9ff;
          --v9-accent-soft: rgba(93, 217, 255, 0.35);
          border-color: rgba(93, 217, 255, 0.4);
          background: linear-gradient(135deg, rgba(8, 22, 30, 0.97) 0%, rgba(10, 25, 35, 0.99) 100%);
          box-shadow:
            0 20px 50px rgba(93, 217, 255, 0.12),
            0 15px 35px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(93, 217, 255, 0.20);
        }
        .v9-poi-demo[variant="cristallo"] .v9-poi-demo__artwork {
          opacity: 0.14;
          background: radial-gradient(circle at 50% 50%, rgba(93, 217, 255, 0.15), transparent);
        }

        /* ── Close button ── */
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

        /* Badge */
        .v9-poi-demo__badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 13px 5px;
          border: 1.5px solid rgba(223, 184, 87, 0.7);
          border-radius: 4px;
          background-color: rgba(6, 29, 37, 0.5);
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
          background: rgba(3, 15, 20, 0.15);
          border: 1px solid rgba(223, 184, 87, 0.15);
        }
        .v9-poi-demo__artwork-inner {
          width: 100%;
          height: 100%;
          /* Incavo nel cristallo: appena più profondo del master */
          background: linear-gradient(135deg,
            rgba(4, 22, 30, 0.20) 0%,
            rgba(3, 14, 20, 0.28) 100%
          );
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
          position: relative;
        }
        /* Carta celeste — filigrana sottile, mistero accademico */
        .v9-poi-demo__artwork-watermark {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.30;
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
          background: rgba(6,15,22,0.45);
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
        /* Gradient div separator - rigid specification */
        .v9-poi-demo__stat-dots {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(223, 184, 87, 0.3), transparent);
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
        .v9-duration { color: #a5f3fc; }  /* turchese spento antico — niente LED digitale */

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
        /* ◈ ai lati della placca — spezzano la geometria */
        .v9-poi-demo__cta-wrap {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .v9-poi-demo__cta-ornament {
          font-size: 9px;
          color: ${V9.goldBronze};
          opacity: 0.75;
          line-height: 1;
          text-shadow: 0 0 6px rgba(223,184,87,0.4);
        }

        /* CTA: placca metallica d'esplorazione — angoli tagliati, doppio bordo oro */
        .v9-poi-demo__cta {
          position: relative;
          overflow: hidden;
          padding: 10px 30px;
          border-radius: 4px;
          border: 2px solid #dfb857;
          /* angoli tagliati (notched) — placca fusa nel bronzo */
          clip-path: polygon(
            8px 0, calc(100% - 8px) 0, 100% 8px,
            100% calc(100% - 8px), calc(100% - 8px) 100%,
            8px 100%, 0 calc(100% - 8px), 0 8px
          );
          /* metallo brunito con riflesso in alto */
          background:
            linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 40%),
            linear-gradient(135deg, rgba(13, 55, 72, 0.85) 0%, rgba(6, 29, 37, 0.95) 100%) !important;
          box-shadow:
            0 0 14px rgba(223, 184, 87, 0.2),
            0 3px 8px rgba(0,0,0,0.5),
            inset 0 0 0 1px rgba(4, 20, 26, 0.9),       /* gap scuro */
            inset 0 0 0 2px rgba(223, 184, 87, 0.35),   /* secondo bordo oro interno */
            inset 0 1px 0 rgba(245,242,232,0.15),
            inset 0 -2px 4px rgba(0,0,0,0.4);
          color: ${V9.warmGold};
          font-family: 'Cinzel', 'Georgia', serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          /* bevel d'oro: ombra dura sotto + filo di luce sopra */
          text-shadow:
            0 2px 4px rgba(0,0,0,0.8),
            0 -1px 0 rgba(255,245,200,0.25);
          cursor: pointer;
          transition: filter 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        /* sweep di luce — attraversa il bottone su hover */
        .v9-poi-demo__cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: -80%;
          width: 55%;
          height: 100%;
          background: linear-gradient(105deg,
            transparent 0%,
            rgba(255, 244, 200, 0.22) 45%,
            rgba(0, 229, 255, 0.12) 55%,
            transparent 100%
          );
          transform: skewX(-18deg);
          transition: left 0.55s ease;
          pointer-events: none;
        }
        .v9-poi-demo__cta:hover {
          filter: brightness(1.12);
          box-shadow:
            0 0 20px rgba(223, 184, 87, 0.35),
            0 0 32px rgba(0, 229, 255, 0.12),
            0 3px 8px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(245,242,232,0.20),
            inset 0 -2px 4px rgba(0,0,0,0.4);
          border-color: ${V9.azureLight};
        }
        .v9-poi-demo__cta:hover::before {
          left: 125%;
        }

        /* ═══ Varianti POI — accento pilotato da --v9-accent (dal variant del glass) ═══ */
        .v9-var-flavor {
          margin: 8px auto 0;
          font-style: italic;
          font-size: 13px;
          line-height: 1.5;
          color: ${V9.textSecondary};
          max-width: 270px;
          text-align: center;
        }
        .v9-accent-value {
          color: var(--v9-accent) !important;
          text-shadow: 0 0 10px var(--v9-accent-soft);
        }
        .v9-accent-glyph {
          color: var(--v9-accent);
        }
        .v9-var-btn-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }
        .v9-var-btn {
          padding: 6px 16px;
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--v9-accent);
          background: rgba(2, 8, 10, 0.35);
          border: 1px solid var(--v9-accent-soft);
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }
        .v9-var-btn:hover {
          background: rgba(2, 8, 10, 0.6);
          color: ${V9.ivory};
          box-shadow: 0 0 12px var(--v9-accent-soft), inset 0 0 8px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default V9SkinSandbox;
