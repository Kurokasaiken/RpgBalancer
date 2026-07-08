import React, { useContext } from 'react';
import type { CSSProperties } from 'react';
import type { MaterialPreset } from './materialPresets';
import { WanderlustMaterialContext } from './WanderlustMaterialContext';

/** Visual preset per ogni materiale — CSS-only, nessun SVG. */
interface InsetPanelPreset {
  background: string;
  border: string;
  borderRadius: string;
  padding: string;
  boxShadow: string;
}

export const INSET_PANEL_PRESETS: Record<MaterialPreset, InsetPanelPreset> = {
  bronze: {
    background: 'rgba(8, 5, 2, 0.85)',
    border: '1px solid rgba(180, 130, 30, 0.45)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(220, 175, 60, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
  },
  silver: {
    background: 'rgba(10, 12, 16, 0.85)',
    border: '1px solid rgba(160, 160, 180, 0.40)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(200, 200, 220, 0.12)',
  },
  obsidian: {
    background: 'rgba(4, 3, 2, 0.92)',
    border: '1px solid rgba(80, 50, 20, 0.50)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(150, 100, 30, 0.10)',
  },
  jade: {
    background: 'rgba(4, 10, 8, 0.88)',
    border: '1px solid rgba(80, 160, 100, 0.40)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(100, 200, 130, 0.12)',
  },
  parchment: {
    background: 'rgba(218, 194, 148, 0.93)',
    border: '1px solid rgba(140, 100, 45, 0.35)',
    borderRadius: '6px',
    padding: '12px 14px',
    boxShadow: 'inset 0 1px 0 rgba(255, 245, 215, 0.55), inset 0 -1px 3px rgba(90, 60, 15, 0.10)',
  },
};

export interface InsetPanelProps {
  /** Sovrascrive il materiale del contesto WanderlustSurface. */
  material?: MaterialPreset;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

/**
 * InsetPanel — primitivo leggero per sotto-sezioni dentro WanderlustSurface.
 *
 * Eredita il materiale dal WanderlustMaterialContext (impostato da WanderlustSurface);
 * basta cambiare il materiale del pannello padre perché tutti gli InsetPanel figli
 * si aggiornino automaticamente.
 *
 * Usare `material` prop per fare override ad-hoc su istanze specifiche.
 */
export const InsetPanel: React.FC<InsetPanelProps> = ({
  material,
  children,
  className,
  style,
  'data-testid': testId,
}) => {
  const contextMaterial = useContext(WanderlustMaterialContext);
  const resolved = material ?? contextMaterial;
  const preset = INSET_PANEL_PRESETS[resolved] ?? INSET_PANEL_PRESETS.bronze;

  return (
    <div
      className={className}
      data-testid={testId}
      data-inset-panel-material={resolved}
      style={{
        background: preset.background,
        border: preset.border,
        borderRadius: preset.borderRadius,
        padding: preset.padding,
        boxShadow: preset.boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default InsetPanel;
