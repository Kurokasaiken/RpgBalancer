import React, { useContext } from 'react';
import type { CSSProperties } from 'react';
import type { MaterialPreset } from './materialPresets';
import { WanderlustMaterialContext } from './WanderlustMaterialContext';

/** Visual preset per ogni materiale — bordo sottile e delicato, metà spessore dell'originale. */
interface InsetPanelDelicatePreset {
  background: string;
  border: string;
  borderRadius: string;
  padding: string;
  boxShadow: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const INSET_PANEL_DELICATE_PRESETS: Record<MaterialPreset, InsetPanelDelicatePreset> = {
  bronze: {
    background: 'rgba(8, 5, 2, 0.85)',
    border: '0.5px solid rgba(180, 130, 30, 0.35)', // Metà spessore, leggèrement più trasparente
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(220, 175, 60, 0.10), inset 0 -1px 0 rgba(0,0,0,0.2)',
  },
  silver: {
    background: 'rgba(10, 12, 16, 0.85)',
    border: '0.5px solid rgba(160, 160, 180, 0.30)', // Metà spessore, più delicato
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(200, 200, 220, 0.08)',
  },
  obsidian: {
    background: 'rgba(4, 3, 2, 0.92)',
    border: '0.5px solid rgba(80, 50, 20, 0.40)', // Metà spessore, più sobrio
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(150, 100, 30, 0.08)',
  },
  jade: {
    background: 'rgba(4, 10, 8, 0.88)',
    border: '0.5px solid rgba(80, 160, 100, 0.30)', // Metà spessore, più sfumato
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(100, 200, 130, 0.08)',
  },
  parchment: {
    background: 'rgba(218, 194, 148, 0.93)',
    border: '0.5px solid rgba(140, 100, 45, 0.25)', // Metà spessore, più delicato
    borderRadius: '6px',
    padding: '12px 14px',
    boxShadow: 'inset 0 1px 0 rgba(255, 245, 215, 0.40), inset 0 -1px 3px rgba(90, 60, 15, 0.08)',
  },
};

export interface InsetPanelDelicateProps {
  /** Sovrascrive il materiale del contesto WanderlustSurface. */
  material?: MaterialPreset;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

/**
 * InsetPanelDelicate — primitivo con bordo sottile e delicato per sotto-sezioni dentro WanderlustSurface.
 *
 * Eredita il materiale dal WanderlustMaterialContext (impostato da WanderlustSurface);
 * usa un bordo di 0.5px invece di 1px per un aspetto più raffinato e delicato.
 *
 * Usare `material` prop per fare override ad-hoc su istanze specifiche.
 */
export const InsetPanelDelicate: React.FC<InsetPanelDelicateProps> = ({
  material,
  children,
  className,
  style,
  'data-testid': testId,
}) => {
  const contextMaterial = useContext(WanderlustMaterialContext);
  const resolved = material ?? contextMaterial;
  const preset = INSET_PANEL_DELICATE_PRESETS[resolved] ?? INSET_PANEL_DELICATE_PRESETS.bronze;

  return (
    <div
      className={className}
      data-testid={testId}
      data-inset-panel-delicate-material={resolved}
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

export default InsetPanelDelicate;
