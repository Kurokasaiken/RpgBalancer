import React from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import {
  WanderlustField,
  WanderlustDivider,
  WanderlustSectionHeader,
  WanderlustRecordList,
  WanderlustFieldGroup,
  WanderlustAmbientField,
} from '@/ui/wanderlust-surface/layout';
import { FIELD_BACKGROUND, FIELD_VIGNETTE, GOLD_FILET_SOFT, GOLD_FILET_SOFT_SHADOW } from '@/ui/visualFidelityLab/foundationRecipe';
import { SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER } from '@/ui/visualFidelityLab/foundationRecipe';

export interface MissingItem {
  id: string;
  name: string;
  area: string;
  status: 'missing' | 'mocked' | 'draft' | 'stub';
  note: string;
}

export const MISSING_ITEMS: MissingItem[] = [
  // Draft kits / contracts
  { id: 'questPoiKit', name: 'questPoiKit', area: 'POI', status: 'draft', note: 'Manca il contratto per certified' },
  { id: 'poiJob', name: 'POI Job Contract', area: 'POI', status: 'draft', note: 'One-shot / continuous jobs, stamina, auto-collect' },
  { id: 'poiCooldown', name: 'POI Cooldown Contract', area: 'POI', status: 'draft', note: 'POI a tempo / expiring' },
  { id: 'poiTraining', name: 'POI Training Contract', area: 'POI', status: 'draft', note: 'Stat/XP training, low risk' },
  { id: 'poiMaintenance', name: 'POI Maintenance Contract', area: 'POI', status: 'draft', note: 'Manutenzione edifici' },
  { id: 'outcomeKit', name: 'outcomeKit', area: 'Kit', status: 'draft', note: 'OutcomeModal non esiste' },
  { id: 'marketKit', name: 'marketKit', area: 'Kit', status: 'draft', note: 'MarketActionCard e stub' },

  // Quest / events missing
  { id: 'questFailureModal', name: 'Quest Failure Modal', area: 'Quest', status: 'missing', note: 'Nessuna UI per fail/deadly' },
  { id: 'questTimeout', name: 'Quest Timeout Event', area: 'Quest', status: 'missing', note: 'TimeEngine tratta timeout come completion' },
  { id: 'injuryDeath', name: 'Injury / Death Application', area: 'Quest', status: 'missing', note: 'injuryRolls in QuestResolver non applicati' },
  { id: 'deathUi', name: 'Death State UI', area: 'Roster', status: 'missing', note: 'dead non renderizzato in roster o PgCard' },
  { id: 'recoveryActions', name: 'Recovery Actions', area: 'Quest', status: 'missing', note: 'Retry / heal / dismiss non esistono' },
  { id: 'rewardMultiplier', name: 'Outcome Reward Multiplier', area: 'Quest', status: 'missing', note: 'QuestResolver ignora i multiplier di QuestPowerEngine' },
  { id: 'chronicleStrip', name: 'Chronicle Strip', area: 'UI', status: 'missing', note: 'Proposto in DESIGN_PILLARS, nessun componente' },

  // Spell / skill
  { id: 'spellCreator', name: 'Spell Creator UI', area: 'Skill', status: 'missing', note: 'No design, route o config tab' },
  { id: 'spellPersistence', name: 'Custom Spell Persistence', area: 'Skill', status: 'missing', note: 'No schema o storage key' },
  { id: 'spellEffectEngine', name: 'Spell Effect Engine', area: 'Skill', status: 'missing', note: 'Rewards sono solo risorse' },

  // Math / gameplay
  { id: 'formulaEvaluator', name: 'Reward Formula Evaluator', area: 'Math', status: 'stub', note: 'Solo numeri interi, formule complesse non valutate' },
  { id: 'rewardVariance', name: 'Reward Variance', area: 'Math', status: 'stub', note: 'Usa solo la prima rewardCategory e il midpoint' },
  { id: 'injuryRecovery', name: 'Injury Recovery Logic', area: 'Math', status: 'stub', note: 'Light injury dura 1 giorno; recovery completa TODO' },
  { id: 'levelUp', name: 'Level-Up Stat Growth', area: 'Progression', status: 'missing', note: 'XP assegnato; crescita non connessa' },

  // Trailer / marketing components
  { id: 'threatPresence', name: 'ThreatPresence', area: 'Trailer', status: 'missing', note: 'P1 TrailerThreatIter V3: 4 static frames for threat presence' },
  { id: 'trailerThreatAlert', name: 'TrailerThreatAlert', area: 'Trailer', status: 'missing', note: 'Alert/notification tost per fase di minaccia nel trailer' },
  { id: 'trailerThreatPoiMarker', name: 'TrailerThreatPoiMarker', area: 'Trailer', status: 'missing', note: 'Poi marker wrapper opzionale per threat iter' },
  { id: 'wanderlustHeading', name: 'WanderlustHeading', area: 'Trailer', status: 'missing', note: 'Titolo scena Outro "WANDERLUST TRIUMPH"' },
  { id: 'outcomeModal', name: 'OutcomeModal', area: 'UI', status: 'missing', note: 'Modal esito post skill-check; esiste solo skin config' },
];

const STATUS_LABEL: Record<MissingItem['status'], string> = {
  missing: 'Mancante',
  mocked: 'Mockato',
  draft: 'Draft',
  stub: 'Stub',
};

const STATUS_DOT: Record<MissingItem['status'], string> = {
  missing: 'rgba(244,63,94,0.9)',
  mocked: 'rgba(251,146,60,0.9)',
  draft: 'rgba(96,165,250,0.9)',
  stub: 'rgba(234,179,8,0.9)',
};

export const MissingHub: React.FC = () => {
  const counts = {
    missing: MISSING_ITEMS.filter((i) => i.status === 'missing').length,
    mocked: MISSING_ITEMS.filter((i) => i.status === 'mocked').length,
    draft: MISSING_ITEMS.filter((i) => i.status === 'draft').length,
    stub: MISSING_ITEMS.filter((i) => i.status === 'stub').length,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#05080d' }}>
      <div className="mx-auto max-w-5xl">
        <WanderlustSurface
          shape="panel"
          material={SURFACE_MATERIAL}
          interactive={false}
          materialLayer={SURFACE_MATERIAL_LAYER}
          style={{ width: '100%', borderRadius: 14 }}
        >
          <WanderlustAmbientField
            fireflyCount={6}
            style={{
              background: FIELD_BACKGROUND,
              boxShadow: FIELD_VIGNETTE,
              borderRadius: 'inherit',
              position: 'relative' as const,
            }}
          >
            <div style={{ padding: 26 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 10px',
                    border: '1px solid rgba(198,150,54,0.35)',
                    borderRadius: 4,
                    background: 'rgba(12,22,30,0.7)',
                    backdropFilter: 'blur(8px)',
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'var(--skin-plaque-color)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Observatory
                </span>
                <div style={{ flex: '1 1 auto' }}>
                  <h1
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
                    The Missing Hub
                  </h1>
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
                    Draft · Mocked · Missing · Stub
                  </p>
                </div>
              </div>

              <div className="skin-titlesep" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--skin-titlesep-line)' }} />
                <span style={{ fontSize: 12, lineHeight: 1, color: 'var(--skin-titlesep-diamond-color)', textShadow: 'var(--skin-titlesep-diamond-glow)' }}>✦</span>
                <span style={{ flex: 1, height: 1, background: 'var(--skin-titlesep-line)' }} />
              </div>

              <p
                style={{
                  margin: '0 0 16px',
                  fontFamily: 'var(--skin-font-serif)',
                  fontSize: 'var(--skin-body-size)',
                  color: 'var(--skin-body-color)',
                }}
              >
                Catalogo dei componenti e contratti non ancora implementati, mockati o in stato draft. Ogni riga e un placeholder per il prossimo passo di sviluppo.
              </p>

              <WanderlustDivider />

              {/* Quick counts */}
              <WanderlustSectionHeader tier="primary">Status Summary</WanderlustSectionHeader>
              <WanderlustFieldGroup layout="columns" columns={4}>
                <WanderlustField label="Mancanti" value={String(counts.missing)} />
                <WanderlustField label="Mockati" value={String(counts.mocked)} />
                <WanderlustField label="Draft" value={String(counts.draft)} />
                <WanderlustField label="Stub" value={String(counts.stub)} />
              </WanderlustFieldGroup>

              <WanderlustDivider />

              {/* Missing list */}
              <WanderlustSectionHeader tier="primary" hint="per area">Missing & Mocked Components</WanderlustSectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MISSING_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'relative',
                      padding: '14px 16px',
                      borderRadius: 8,
                      border: GOLD_FILET_SOFT.border,
                      background: 'linear-gradient(180deg, #040a11, #020509)',
                      boxShadow: GOLD_FILET_SOFT_SHADOW,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: STATUS_DOT[item.status],
                          boxShadow: `0 0 8px ${STATUS_DOT[item.status]}`,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--skin-font-display)',
                          fontSize: 'var(--skin-body-size)',
                          fontWeight: 700,
                          color: 'var(--skin-title-color)',
                        }}
                      >
                        {item.name}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontFamily: 'var(--skin-font-display)',
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: STATUS_DOT[item.status],
                          border: `1px solid ${STATUS_DOT[item.status]}`,
                          background: 'rgba(0,0,0,0.3)',
                        }}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        fontFamily: 'var(--skin-font-serif)',
                        fontSize: 12,
                        color: 'var(--skin-body-color)',
                        opacity: 0.85,
                      }}
                    >
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--skin-subtitle-color)' }}>{item.area}</span>
                      <span style={{ flex: 1, textAlign: 'right' }}>{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>

              <WanderlustDivider />

              {/* Legend */}
              <WanderlustSectionHeader tier="tertiary">Legend</WanderlustSectionHeader>
              <WanderlustRecordList
                columns={[
                  { width: '80px', variant: 'caption' },
                  { width: '1fr', variant: 'body' },
                ]}
                records={[
                  ['Mancante', 'Non esiste ancora codice o UI'],
                  ['Mockato', 'Esiste una facciata ma la logica e finta'],
                  ['Draft', 'Esiste un doc o un kit ma non certificato'],
                  ['Stub', 'Logica parziale che restituisce placeholder'],
                ]}
                rail
              />
            </div>
          </WanderlustAmbientField>
        </WanderlustSurface>

        <footer className="mt-8 pt-6 text-center text-xs" style={{ color: 'rgba(150,160,170,0.5)' }}>
          <p>The Missing Hub · Idle Village Vertical Slice</p>
        </footer>
      </div>
    </div>
  );
};

export default MissingHub;
