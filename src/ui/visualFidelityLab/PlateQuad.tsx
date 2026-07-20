import React from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import {
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustSectionHeader,
  WanderlustAmbientField,
} from '@/ui/wanderlust-surface/layout';
import { SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER, FIELD_BACKGROUND, FIELD_VIGNETTE } from './foundationRecipe';
import { PLATE_VARIANTS } from './plateVariants';

/**
 * PlateQuad — LAB-ONLY measurand. The four best candidate implementations of
 * the recessed content well, side by side in ONE bronze field with IDENTICAL
 * content, so a HUMAN eye picks the winner (seen together, not from memory).
 * Each variant is a different physical hypothesis of "what object is this?" —
 * not four parameter tweaks of the same recipe.
 */
const PlateContent: React.FC = () => (
  <>
    <WanderlustSectionHeader tier="tertiary" marginBottom="sm">
      Progress
    </WanderlustSectionHeader>
    <WanderlustFieldGroup layout="columns" columns={2}>
      <WanderlustField label="Survey" value="63 / 100" />
      <WanderlustField label="Nights" value="14" />
    </WanderlustFieldGroup>
    <p
      style={{
        margin: '8px 0 0',
        fontFamily: 'var(--skin-font-serif)',
        fontSize: 12,
        color: 'var(--skin-body-color)',
        opacity: 0.85,
      }}
    >
      The sealed lens resonates a little more each night.
    </p>
  </>
);

export const PlateQuad: React.FC = () => (
  <WanderlustSurface
    shape="panel"
    material={SURFACE_MATERIAL}
    interactive={false}
    materialLayer={SURFACE_MATERIAL_LAYER}
    style={{ width: '100%', borderRadius: 14 }}
  >
    <WanderlustAmbientField
      fireflyCount={0}
      style={{
        background: FIELD_BACKGROUND,
        boxShadow: FIELD_VIGNETTE,
        borderRadius: 'inherit',
      }}
    >
      <div style={{ padding: 26 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 22,
            alignItems: 'start',
          }}
        >
          {PLATE_VARIANTS.map(({ key, label, Component }) => (
            <div key={key} data-testid={`plate-variant-${key}`}>
              <div
                style={{
                  fontFamily: 'var(--skin-font-display)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--skin-subtitle-color)',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {label}
              </div>
              <Component>
                <PlateContent />
              </Component>
            </div>
          ))}
        </div>
      </div>
    </WanderlustAmbientField>
  </WanderlustSurface>
);

export default PlateQuad;
