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
 * REBUILT — Quest Detail B. Built "as a new developer would": composed ONLY
 * from the shared grammar (WanderlustSurface + layout primitives + the recipe),
 * with DIFFERENT content. It deliberately does NOT import ReferenceQuestDetail
 * or any existing complete quest-detail component — that would be reuse, not a
 * fidelity test.
 *
 * Differences vs the reference (to prove it is not a hardcoded copy):
 * different plaque, title, subtitle, body, field values, an EXTRA requirement
 * (4 vs 3), and different event records.
 */
export const RebuiltQuestDetail: React.FC = () => (
  <WanderlustSurface
    shape="panel"
    material={SURFACE_MATERIAL}
    interactive={false}
    materialLayer={SURFACE_MATERIAL_LAYER}
    style={{ width: '100%', borderRadius: 14 }}
  >
    <WanderlustAmbientField fireflyCount={8} style={{ background: OBSIDIAN_BG, borderRadius: 'inherit' }}>
      <div style={{ padding: 24 }}>
        <div className="skin-title-row">
          <span className="skin-plaque" style={{ userSelect: 'none' }}>Spedizione</span>
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
              Valle Dimenticata
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
              Terre Selvagge · Rovine Sepolte
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
          Un'eco di magia antica filtra tra le rovine oltre la valle. Il ritorno non è garantito.
        </p>
        <WanderlustDivider />

        <WanderlustSectionHeader tier="primary">Parametri Spedizione</WanderlustSectionHeader>
        <WanderlustFieldGroup layout="columns" columns={3}>
          <WanderlustField label="Durata" value="5 giorni" />
          <WanderlustField label="Ricompensa" value="Seme di Cristallo" />
          <WanderlustField label="Rischio" value="Alto" />
        </WanderlustFieldGroup>

        <WanderlustDivider />

        <WanderlustSectionHeader tier="tertiary" hint="squadra proposta">Requisiti</WanderlustSectionHeader>
        <WanderlustRequirementList
          requirements={[
            { label: 'Forza', current: 18, required: 15 },
            { label: 'Destrezza', current: 11, required: 13 },
            { label: 'Magia', current: 16, required: 12 },
            { label: 'Costituzione', current: 9, required: 14 },
          ]}
        />

        <WanderlustDivider />

        <WanderlustSectionHeader tier="tertiary">Presagi</WanderlustSectionHeader>
        <WanderlustRecordList
          columns={[
            { width: '60px', variant: 'caption' },
            { width: '1fr', variant: 'body' },
          ]}
          records={[
            ['Alba', 'La carovana lascia il villaggio'],
            ['Giorno 2', 'Tracce di una creatura sconosciuta'],
            ['Giorno 4', 'Il sigillo delle rovine reagisce'],
          ]}
          rail
        />
      </div>
    </WanderlustAmbientField>
  </WanderlustSurface>
);

export default RebuiltQuestDetail;
