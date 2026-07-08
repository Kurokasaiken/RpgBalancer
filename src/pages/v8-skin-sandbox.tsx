/**
 * V8 Skin Architecture Sandbox
 *
 * High-fidelity UI playground to test and refine the global V8 Material
 * Architecture (.wanderlust-artifact) before deploying to real components.
 *
 * Features:
 * - Background switcher (Marmo Venato, Pergamena Mappa, Vuoto Assoluto)
 * - Global state toggles (.is-hovered, .is-active, .is-paused)
 * - Responsive artifact shape matrix
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
  // V8 MLE state
  physicalDepth: boolean;
  heavyFeel: boolean;
  dynamicRimLight: boolean;
}

type WanderlustShape = 'panel' | 'card' | 'badge' | 'medallion' | 'tablet';

const WANDERLUST_SHAPES: { id: WanderlustShape; label: string; description: string }[] = [
  { id: 'panel', label: 'Panel', description: 'Wide cinematic frame — HUD, chronicles' },
  { id: 'card', label: 'Card', description: 'Portrait 3:4 — quest cards, roster' },
  { id: 'badge', label: 'Badge', description: 'Pill shape — notifications, status' },
  { id: 'medallion', label: 'Medallion', description: 'Circular — POI, avatar frames' },
  { id: 'tablet', label: 'Tablet', description: '4:3 with corners — dialogs, info boxes' },
];

/**
 * Generic Tokens Demo Component
 * Shows typography, spacing, borders, animations, and interaction states
 */
const GenericTokensDemo: React.FC<{ material: MaterialPreset; materialLayer?: MaterialLayerConfig }> = ({ material, materialLayer }) => {
  const { typography, spacing, border } = useGenericTokens();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="flex justify-center">
      <WanderlustSurface
        shape="panel"
        material={material}
        interactive={true}
        isDragging={isDragging}
        isPaused={false}
        materialLayer={materialLayer}
        style={{ width: '100%', maxWidth: 1400, minHeight: '80vh' }}
      >
        <div style={{ padding: '32px', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          {/* Header */}
          <div style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#e2e8f0',
              marginBottom: spacing.md,
            }}>
              Generic Design Tokens
            </h2>
            <p style={{
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.lg,
              color: '#94a3b8',
              lineHeight: typography.lineHeight.relaxed,
            }}>
              Skin-agnostic tokens for all new components. Typography, spacing, borders, animations, and interaction states.
            </p>
          </div>

          {/* Typography Demo */}
          <div style={{
            marginBottom: spacing['2xl'],
            padding: spacing.xl,
            border: `${border.width.thin} solid ${border.color.default}`,
            borderRadius: border.radius.lg,
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}>
            <h3 style={{
              fontFamily: typography.fontFamily.heading,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: '#e2e8f0',
              marginBottom: spacing.lg,
            }}>
              Typography Scale
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <div style={{ fontFamily: typography.fontFamily.display, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: '#e2e8f0' }}>
                Display Text (3xl) - Large headlines
              </div>
              <div style={{ fontFamily: typography.fontFamily.heading, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: '#e2e8f0' }}>
                Heading Text (xl) - Section titles
              </div>
              <div style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.normal, color: '#e2e8f0' }}>
                Body Text (base) - Regular content text
              </div>
              <div style={{ fontFamily: typography.fontFamily.caption, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: '#94a3b8' }}>
                Caption Text (sm) - Small labels and metadata
              </div>
              <div style={{ fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: '#64748b' }}>
                Mono Text (sm) - Code and data values
              </div>
            </div>
          </div>

          {/* Spacing Demo */}
          <div style={{
            marginBottom: spacing['2xl'],
            padding: spacing.xl,
            border: `${border.width.thin} solid ${border.color.default}`,
            borderRadius: border.radius.lg,
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}>
            <h3 style={{
              fontFamily: typography.fontFamily.heading,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: '#e2e8f0',
              marginBottom: spacing.lg,
            }}>
              Spacing Scale
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: spacing.xs, height: spacing.xs, backgroundColor: '#c8a030', borderRadius: border.radius.sm }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>xs (4px)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: spacing.sm, height: spacing.sm, backgroundColor: '#c8a030', borderRadius: border.radius.sm }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>sm (8px)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: spacing.md, height: spacing.md, backgroundColor: '#c8a030', borderRadius: border.radius.sm }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>md (12px)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: spacing.lg, height: spacing.lg, backgroundColor: '#c8a030', borderRadius: border.radius.sm }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>lg (16px)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: spacing.xl, height: spacing.xl, backgroundColor: '#c8a030', borderRadius: border.radius.sm }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>xl (24px)</span>
              </div>
            </div>
          </div>

          {/* Border Demo */}
          <div style={{
            marginBottom: spacing['2xl'],
            padding: spacing.xl,
            border: `${border.width.thin} solid ${border.color.default}`,
            borderRadius: border.radius.lg,
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}>
            <h3 style={{
              fontFamily: typography.fontFamily.heading,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: '#e2e8f0',
              marginBottom: spacing.lg,
            }}>
              Border Radius
            </h3>
            <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: 60, height: 60, backgroundColor: '#c8a030', borderRadius: border.radius.sm }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>sm</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: 60, height: 60, backgroundColor: '#c8a030', borderRadius: border.radius.md }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>md</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: 60, height: 60, backgroundColor: '#c8a030', borderRadius: border.radius.lg }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>lg</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: 60, height: 60, backgroundColor: '#c8a030', borderRadius: border.radius.xl }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>xl</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ width: 60, height: 60, backgroundColor: '#c8a030', borderRadius: border.radius.full }} />
                <span style={{ fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: '#e2e8f0' }}>full</span>
              </div>
            </div>
          </div>

          {/* Interaction States Demo */}
          <div style={{
            marginBottom: spacing['2xl'],
            padding: spacing.xl,
            border: `${border.width.thin} solid ${border.color.default}`,
            borderRadius: border.radius.lg,
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}>
            <h3 style={{
              fontFamily: typography.fontFamily.heading,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: '#e2e8f0',
              marginBottom: spacing.lg,
            }}>
              Interaction States
            </h3>
            <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
              {/* Default Button */}
              <button
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid #475569`,
                  borderRadius: border.radius.md,
                  backgroundColor: 'transparent',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Default
              </button>

              {/* Hover Button */}
              <button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid ${isHovered ? '#c8a030' : '#475569'}`,
                  borderRadius: border.radius.md,
                  backgroundColor: isHovered ? 'rgba(200, 160, 48, 0.15)' : 'transparent',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 4px 12px rgba(200, 160, 48, 0.3)' : 'none',
                }}
              >
                Hover Me
              </button>

              {/* Pressed Button */}
              <button
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid #475569`,
                  borderRadius: border.radius.md,
                  backgroundColor: isPressed ? 'rgba(200, 160, 48, 0.25)' : 'transparent',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                }}
              >
                Press Me
              </button>

              {/* Dragging Button */}
              <button
                onClick={() => setIsDragging(!isDragging)}
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid ${isDragging ? '#f87171' : '#475569'}`,
                  borderRadius: border.radius.md,
                  backgroundColor: isDragging ? 'rgba(248, 113, 113, 0.15)' : 'transparent',
                  color: isDragging ? '#f87171' : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isDragging ? 'Dragging...' : 'Toggle Drag'}
              </button>
            </div>
          </div>

          {/* Animation Demo */}
          <div style={{
            padding: spacing.xl,
            border: `${border.width.thin} solid ${border.color.default}`,
            borderRadius: border.radius.lg,
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}>
            <h3 style={{
              fontFamily: typography.fontFamily.heading,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: '#e2e8f0',
              marginBottom: spacing.lg,
            }}>
              Animations
            </h3>
            <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
              {/* Fade In */}
              <div
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid #475569`,
                  borderRadius: border.radius.md,
                  backgroundColor: 'rgba(200, 160, 48, 0.15)',
                  color: '#e2e8f0',
                  animation: 'fadeIn 0.5s ease-in-out',
                }}
              >
                Fade In
              </div>

              {/* Pulse */}
              <div
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid #475569`,
                  borderRadius: border.radius.md,
                  backgroundColor: 'rgba(200, 160, 48, 0.15)',
                  color: '#e2e8f0',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                Pulse
              </div>

              {/* Slide */}
              <div
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  padding: `${spacing.md} ${spacing.xl}`,
                  border: `${border.width.thin} solid #475569`,
                  borderRadius: border.radius.md,
                  backgroundColor: 'rgba(200, 160, 48, 0.15)',
                  color: '#e2e8f0',
                  animation: 'slideIn 0.5s ease-out',
                }}
              >
                Slide In
              </div>
            </div>
          </div>
        </div>
      </WanderlustSurface>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const V8SkinSandbox: React.FC = () => {
  const [wanderlustShape, setWanderlustShape] = useState<WanderlustShape>('panel');
  const [material, setMaterial] = useState<MaterialPreset>('bronze');
  const [wanderlustInteractive, setWanderlustInteractive] = useState(true);
  const [wanderlustDragging, setWanderlustDragging] = useState(false);
  const [wanderlustPaused, setWanderlustPaused] = useState(false);
  const [showPoiChrome, setShowPoiChrome] = useState(true);

  // dnd-kit drop zone for the surface
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'skin-sandbox-drop-zone',
    data: {
      accepts: ['resident'],
      kind: 'poi',
    },
  });

  const [state, setState] = useState<SandboxState>({
    backgroundMode: 'bg',
    activeTab: 'surface',
    // V8 MLE default state
    physicalDepth: true,
    heavyFeel: true,
    dynamicRimLight: true,
  });

  const setBackgroundMode = useCallback((mode: BackgroundMode) => {
    setState((prev) => ({ ...prev, backgroundMode: mode }));
  }, []);

  const togglePhysicalDepth = useCallback(() => {
    setState((prev) => ({ ...prev, physicalDepth: !prev.physicalDepth }));
  }, []);

  const toggleHeavyFeel = useCallback(() => {
    setState((prev) => ({ ...prev, heavyFeel: !prev.heavyFeel }));
  }, []);

  const toggleDynamicRimLight = useCallback(() => {
    setState((prev) => ({ ...prev, dynamicRimLight: !prev.dynamicRimLight }));
  }, []);

  // Build MaterialLayerConfig from state
  const materialLayerConfig: MaterialLayerConfig = {
    baseTexture: 'obsidian',
    edgeTreatment: 'eroded-bronze',
    emissiveHalo: 'none',
    microInteraction: wanderlustInteractive,
    rimLight: state.dynamicRimLight,
    physicalDepth: state.physicalDepth,
    heavyFeel: state.heavyFeel,
    backgroundMode: state.backgroundMode,
  };

  // Background styles
  const backgroundStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    ...(state.backgroundMode === 'marble' && {
      backgroundImage: 'url(/assets/alt-visuals/v8/columns/Marble01/marble01_diff_2k.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    ...(state.backgroundMode === 'parchment' && {
      backgroundColor: '#2a2418',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(180, 140, 80, 0.15) 0%, transparent 70%)',
    }),
    ...(state.backgroundMode === 'void' && {
      backgroundColor: '#02020b',
    }),
    ...(state.backgroundMode === 'bg' && {
      backgroundImage: 'url(/assets/bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
  };

  return (
    <div className="min-h-screen p-8 font-serif">
      {/* Background layer */}
      <div style={backgroundStyle} />

      {/* Configuration Bar */}
      <div className="mb-8 rounded-lg border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl tracking-[0.3em] uppercase text-amber-200">
            V8 Skin Architecture Sandbox
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setState((prev) => ({ ...prev, activeTab: 'surface' }))}
              className={`rounded px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.activeTab === 'surface'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              Surface
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, activeTab: 'layout' }))}
              className={`rounded px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.activeTab === 'layout'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              Layout Primitives
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, activeTab: 'generic' }))}
              className={`rounded px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.activeTab === 'generic'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              Generic Tokens
            </button>
            <button
              onClick={() => setShowPoiChrome((value) => !value)}
              className={`rounded px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors border ${
                showPoiChrome
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  : 'bg-black/30 text-white/60 border-white/10 hover:border-white/30'
              }`}
            >
              {showPoiChrome ? 'Nascondi Copy' : 'Mostra Copy' }
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          {/* Background Switcher */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">
              Background
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBackgroundMode('marble')}
                className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                  state.backgroundMode === 'marble'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                }`}
              >
                Marmo Venato
              </button>
              <button
                onClick={() => setBackgroundMode('parchment')}
                className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                  state.backgroundMode === 'parchment'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                }`}
              >
                Pergamena Mappa
              </button>
              <button
                onClick={() => setBackgroundMode('void')}
                className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                  state.backgroundMode === 'void'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                }`}
              >
                Vuoto Assoluto
              </button>
              <button
                onClick={() => setBackgroundMode('bg')}
                className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                  state.backgroundMode === 'bg'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                }`}
              >
                BG
              </button>
            </div>
          </div>

          {/* WanderlustSurface Shape */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Shape</span>
            <div className="flex gap-2">
              {WANDERLUST_SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setWanderlustShape(s.id)}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                    wanderlustShape === s.id
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                  }`}
                  title={s.description}
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
              {(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                    material === m
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                  }`}
                >
                  {MATERIAL_PRESETS[m].label}
                </button>
              ))}
            </div>
          </div>

          {/* WanderlustSurface State */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">State</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wanderlustInteractive} onChange={() => setWanderlustInteractive((v) => !v)} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/60">Interactive</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wanderlustDragging} onChange={() => setWanderlustDragging((v) => !v)} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/60">isDragging (perf)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wanderlustPaused} onChange={() => setWanderlustPaused((v) => !v)} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/60">isPaused</span>
              </label>
            </div>
          </div>

          {/* V8 MLE Controls */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">V8 MLE</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state.physicalDepth} onChange={togglePhysicalDepth} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/60">Physical Depth</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state.heavyFeel} onChange={toggleHeavyFeel} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/60">Heavy Feel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state.dynamicRimLight} onChange={toggleDynamicRimLight} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-[0.15em] text-white/60">Dynamic Rim Light</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
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
              width: wanderlustShape === 'badge' ? 280 : 400,
              height: 320,
              transition: isOver ? 'transform 0.2s ease, box-shadow 0.2s ease' : 'none',
              transform: isOver ? 'scale(1.02)' : 'none',
              boxShadow: isOver ? '0 0 30px rgba(255, 197, 135, 0.4)' : 'none',
            }}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-center relative" style={{ height: '100%' }}>
              {!showPoiChrome && (
                <>
                  <h3 className="text-sm tracking-[0.2em] uppercase text-amber-200">
                    {WANDERLUST_SHAPES.find((s) => s.id === wanderlustShape)?.label ?? wanderlustShape}
                  </h3>
                  <p className="text-xs text-white/50 max-w-[80%]">
                    {WANDERLUST_SHAPES.find((s) => s.id === wanderlustShape)?.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] uppercase tracking-[0.15em] text-white/40">
                    <span>Shape: {wanderlustShape}</span>
                    <span>Material: {MATERIAL_PRESETS[material].label}</span>
                    <span>Interactive: {wanderlustInteractive ? 'on' : 'off'}</span>
                    {wanderlustDragging && <span className="text-rose-300">Filters OFF</span>}
                    {wanderlustPaused && <span className="text-sky-300">Paused</span>}
                  </div>
                </>
              )}
              {showPoiChrome && (
                <div className="poi-detail-demo" role="group" aria-label="POI Detail Preview">
                  <button
                    type="button"
                    className="poi-detail-demo__close"
                    onClick={() => setShowPoiChrome(false)}
                    aria-label="Chiudi preview"
                  >
                    ×
                  </button>
                  <div className="poi-detail-demo__content">
                    <div className="poi-detail-demo__header">
                      <div className="poi-detail-demo__badge">Quest</div>
                      <h4 className="poi-detail-demo__title">Dangerous Hunt</h4>
                    </div>
                    <div className="poi-detail-demo__body-placeholder">
                      <div className="poi-detail-demo__line"></div>
                      <div className="poi-detail-demo__line short"></div>
                      <div className="poi-detail-demo__line"></div>
                      <div className="poi-detail-demo__line"></div>
                    </div>
                    <div className="poi-detail-demo__stats">
                      <div className="poi-detail-demo__stat-row">
                        <span className="poi-detail-demo__stat-label">Danger</span>
                        <span className="poi-detail-demo__stat-value">High</span>
                      </div>
                      <div className="poi-detail-demo__stat-row">
                        <span className="poi-detail-demo__stat-label">Duration</span>
                        <span className="poi-detail-demo__stat-value">8s</span>
                      </div>
                    </div>
                    <div className="poi-detail-demo__footer">
                      <button
                        type="button"
                        className="poi-detail-demo__cta"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Button does nothing - just visual
                        }}
                      >
                        Avvia
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WanderlustSurface>
        </div>
      )}

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
              <div style={{ padding: '24px' }}>
                <WanderlustHeading
                  title="Layout Primitives Demo"
                  subtitle="Wanderlust Content System"
                  description="Generic data presentation components for WanderlustSurface content areas."
                />

                <WanderlustDivider />

                <WanderlustSectionHeader tier="primary">
                  Field Group
                </WanderlustSectionHeader>

                <WanderlustFieldGroup layout="columns" columns={3}>
                  <WanderlustField label="Durata" value="8000s" />
                  <WanderlustField label="Ricompensa" value="Gold +15" />
                  <WanderlustField label="ETA" value="2800s" />
                </WanderlustFieldGroup>

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary" hint="squadra attuale">
                  Requisiti
                </WanderlustSectionHeader>

                <WanderlustRequirementList
                  requirements={[
                    { label: 'Forza', current: 14, required: 12 },
                    { label: 'Destrezza', current: 9, required: 11 },
                    { label: 'Costituzione', current: 12, required: 10 },
                  ]}
                />

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary">
                  Registro Eventi
                </WanderlustSectionHeader>

                <WanderlustRecordList
                  columns={[
                    { width: '60px', variant: 'caption' },
                    { width: '1fr', variant: 'body' },
                  ]}
                  records={[
                    ['17:33', 'Activity started'],
                    ['18:03', 'Worker assigned to slot 3'],
                    ['18:23', 'Progress update: 65%'],
                  ]}
                  rail
                />

                <WanderlustDivider />

                <WanderlustSectionHeader tier="tertiary" hint="eredita il materiale dal pannello padre">
                  InsetPanel · Slot Rack
                </WanderlustSectionHeader>

                {/* InsetPanel: eredita material dal WanderlustMaterialContext del WanderlustSurface padre */}
                <InsetPanel>
                  <ResidentSlotRack
                    slots={[
                      { id: 'demo-s1', index: 0, label: 'Slot 1', assignedResidentId: null, isPlaceholder: false, dropState: 'idle' },
                      { id: 'demo-s2', index: 1, label: 'Slot 2', assignedResidentId: null, isPlaceholder: false, dropState: 'idle' },
                      { id: 'demo-s3', index: 2, label: 'Slot 3', assignedResidentId: null, isPlaceholder: true,  dropState: 'idle' },
                    ]}
                    layout="detail"
                    overflowBehavior="scroll"
                    slotSize={96}
                  />
                </InsetPanel>
              </div>
            </WanderlustAmbientField>
          </WanderlustSurface>
        </div>
      )}

      {state.activeTab === 'generic' && <GenericTokensDemo material={material} materialLayer={materialLayerConfig} />}

      {showPoiChrome && (
        <style>{`
          /* Raise content above the WanderlustSurface border SVG so text is visible
             (the SVG carved well has an opaque dark fill at z-index 1) */
          .ws-content {
            z-index: 2;
            padding: 0;
          }

          .poi-detail-demo {
            position: relative;
            padding: 0;
            background: transparent;
            text-align: left;
            color: #f7ead0;
            font-family: 'EB Garamond', serif;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }

          .poi-detail-demo__close {
            position: absolute;
            top: 8px;
            right: 8px;
            border: 1px solid rgba(255,197,135,0.4);
            background: rgba(0,0,0,0.45);
            color: #ffc785;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            font-size: 0.9rem;
            line-height: 1;
            cursor: pointer;
            z-index: 10;
          }

          .poi-detail-demo__content {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .poi-detail-demo__header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            margin-top: 8px;
          }

          .poi-detail-demo__badge {
            background: rgba(255,197,135,0.35);
            border: 1px solid rgba(255,197,135,0.6);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #ffe7b5;
            font-weight: 600;
          }

          .poi-detail-demo__title {
            margin: 0;
            font-family: 'Cinzel', serif;
            font-size: 1.1rem;
            letter-spacing: 0.05em;
            color: #ffe7b5;
            font-weight: 700;
          }

          .poi-detail-demo__body-placeholder {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }

          .poi-detail-demo__line {
            height: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            width: 100%;
          }

          .poi-detail-demo__line.short {
            width: 60%;
          }

          .poi-detail-demo__stats {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
            padding: 12px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            border: 1px solid rgba(255,197,135,0.15);
          }

          .poi-detail-demo__stat-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .poi-detail-demo__stat-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: rgba(200,168,105,0.6);
          }

          .poi-detail-demo__stat-value {
            font-size: 0.75rem;
            font-weight: 600;
            color: #ffe7b5;
          }

          .poi-detail-demo__footer {
            display: flex;
            justify-content: flex-end;
          }

          .poi-detail-demo__cta {
            padding: 8px 20px;
            border-radius: 999px;
            border: 1px solid rgba(255,197,135,0.5);
            background: linear-gradient(120deg, rgba(255,221,150,0.2), rgba(122,76,16,0.4));
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-size: 0.7rem;
            color: #ffe7b5;
            cursor: pointer;
          }

          @media (max-width: 640px) {
            .poi-detail-demo {
              inset: 8px;
              padding: 16px;
            }

            .poi-detail-demo__footer {
              flex-direction: column;
              align-items: flex-start;
            }

            .poi-detail-demo__cta {
              margin-left: 0;
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default V8SkinSandbox;
