import React from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import {
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustRequirementList,
  WanderlustRecordList,
  WanderlustDivider,
  WanderlustSectionHeader,
  WanderlustAmbientField,
} from '@/ui/wanderlust-surface/layout';
import { OBSIDIAN_BG, SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER } from './recipe';

/**
 * GOLDEN REFERENCE — Quest Detail A. IMMUTABLE.
 *
 * Recipe extracted verbatim from src/pages/v9-skin-sandbox.tsx (tab "Layout
 * Primitives") — the slice shown in the user's reference screenshot: composed
 * header + field group + requirements + event log. This is the benchmark; it
 * defines the minimum accepted quality level. Do not edit to "match" the
 * rebuild — the rebuild matches this.
 */
export const ReferenceQuestDetail: React.FC = () => (
  <WanderlustSurface
    shape="panel"
    material={SURFACE_MATERIAL}
    interactive={false}
    materialLayer={SURFACE_MATERIAL_LAYER}
    style={{ width: '100%', borderRadius: 14 }}
  >
    <WanderlustAmbientField fireflyCount={8} style={{ background: OBSIDIAN_BG, borderRadius: 'inherit' }}>
      <div style={{ padding: 24 }}>
        {/* Composed header: plaque + incised title + subtitle */}
        <div className="skin-title-row">
          <span className="skin-plaque" style={{ userSelect: 'none' }}>Quest</span>
          <div style={{ flex: '1 1 auto' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--skin-font-display)',
                fontSize: 'var(--skin-title-size)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
                textShadow: '0 2px 4px rgba(0,0,0,0.85)',
              }}
            >
              Layout Primitives Demo
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: 'var(--skin-font-display)',
                fontSize: 'var(--skin-subtitle-size)',
                letterSpacing: 'var(--skin-subtitle-tracking)',
                textTransform: 'uppercase',
                color: 'var(--skin-subtitle-color)',
              }}
            >
              V9 Obsidian Aesthetic
            </p>
          </div>
          <button type="button" className="skin-close-corner" aria-label="Chiudi" tabIndex={-1}>×</button>
        </div>

        <div className="skin-titlesep">
          <span className="skin-titlesep__line" />
          <span className="skin-titlesep__diamond">✦</span>
          <span className="skin-titlesep__line" />
        </div>

        <p style={{ margin: '0 0 4px', fontFamily: 'var(--skin-font-serif)', fontSize: 'var(--skin-body-size)', color: 'var(--skin-body-color)' }}>
          Palette: Obsidian base (#060f16) · Azure light leak · Gold/bronze borders.
        </p>
        <WanderlustDivider />

        <WanderlustSectionHeader tier="primary">Field Group</WanderlustSectionHeader>
        <WanderlustFieldGroup layout="columns" columns={3}>
          <WanderlustField label="Durata" value="8000s" />
          <WanderlustField label="Ricompensa" value="Gold +15" />
          <WanderlustField label="ETA" value="2800s" />
        </WanderlustFieldGroup>

        <WanderlustDivider />

        <WanderlustSectionHeader tier="tertiary" hint="squadra attuale">Requisiti</WanderlustSectionHeader>
        <WanderlustRequirementList
          requirements={[
            { label: 'Forza', current: 14, required: 12 },
            { label: 'Destrezza', current: 9, required: 11 },
            { label: 'Costituzione', current: 12, required: 10 },
          ]}
        />

        <WanderlustDivider />

        <WanderlustSectionHeader tier="tertiary">Registro Eventi</WanderlustSectionHeader>
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
      </div>
    </WanderlustAmbientField>
  </WanderlustSurface>
);

export default ReferenceQuestDetail;
