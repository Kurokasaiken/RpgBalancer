import React from 'react';
import { WanderlustSurface, InsetPanel } from '@/ui/wanderlust-surface';
import {
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustSectionHeader,
  WanderlustAmbientField,
} from '@/ui/wanderlust-surface/layout';
import { SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER } from './foundationRecipe';
import MatericPlate from './MatericPlate';

/**
 * PlateComparison — LAB-LOCAL measurand for the InsetPanel material proof.
 *
 * Both plates sit inside ONE WanderlustSurface (same bronze field, same
 * light) with IDENTICAL content. Left = the shipped InsetPanel (single-face
 * box, polarity currently reads as raised). Right = MatericPlate (the 10-layer
 * recipe, recessive-inversion polarity). The only variable is the plate
 * material treatment — so the eye judges exactly that.
 *
 * The gate question: does the right plate read as CARVED INTO the surface,
 * a finished production asset — while the left reads as a flat web box?
 */
const PlateContent: React.FC = () => (
  <>
    <WanderlustSectionHeader tier="tertiary" hint="charting the dome" marginBottom="sm">
      Observatory Progress
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

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    {children}
  </div>
);

export const PlateComparison: React.FC = () => (
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
        background: [
          'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.12) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
          '#060f16',
        ].join(', '),
        boxShadow: 'inset 0 0 60px rgba(2,6,10,0.8)',
        borderRadius: 'inherit',
      }}
    >
      <div style={{ padding: 26 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div data-testid="plate-current">
            <Caption>Current · InsetPanel</Caption>
            <InsetPanel>
              <PlateContent />
            </InsetPanel>
          </div>
          <div data-testid="plate-recipe">
            <Caption>Recipe · MatericPlate</Caption>
            <MatericPlate>
              <PlateContent />
            </MatericPlate>
          </div>
        </div>
      </div>
    </WanderlustAmbientField>
  </WanderlustSurface>
);

export default PlateComparison;
