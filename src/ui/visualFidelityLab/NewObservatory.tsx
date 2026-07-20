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
import { SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER } from './foundationRecipe';
import { WellBronzeBezel } from './plateVariants';

// Field for the New Observatory prototype — CANDIDATE A (chosen 2026-07-18): a
// MINIMAL step from the Forgotten Observatory. Same azure leak (barely touched),
// base nudged from #060f16 toward blu notte #08121f. Nothing else added.
// Brief: "leggermente più luminoso, non più chiaro; non cambiare troppo."
const NEW_FIELD_BACKGROUND = [
  'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.13) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
  '#08121f',
].join(', ');

// Gentle blu-notte edge vignette (no crushing to black).
const NEW_FIELD_VIGNETTE = 'inset 0 0 60px rgba(6,12,22,0.7)';

/**
 * PROTOTYPE — "The New Observatory".
 *
 * Iteration prototype - NOT baptized, NOT documented until satisfied.
 * Currently a copy of ForgottenObservatory for iteration.
 */
export const NewObservatory: React.FC = () => (
  <WanderlustSurface
    shape="panel"
    material={SURFACE_MATERIAL}
    interactive={false}
    materialLayer={SURFACE_MATERIAL_LAYER}
    style={{ width: '100%', borderRadius: 14 }}
  >
    <WanderlustAmbientField
      fireflyCount={9}
      style={{
        background: NEW_FIELD_BACKGROUND,
        boxShadow: NEW_FIELD_VIGNETTE,
        borderRadius: 'inherit',
      }}
    >
      <div style={{ padding: 26 }}>
        {/* ── Header (plaque + incised title + subtitle + close coin) ── */}
        <div className="skin-title-row">
          <span className="skin-plaque" style={{ userSelect: 'none' }}>Expedition</span>
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
              The New Observatory
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
              Distant Reach · Sealed Ruins
            </p>
          </div>
          <button type="button" className="skin-close-corner" aria-label="Close" tabIndex={-1}>×</button>
        </div>

        <div className="skin-titlesep">
          <span className="skin-titlesep__line" />
          <span className="skin-titlesep__diamond">✦</span>
          <span className="skin-titlesep__line" />
        </div>

        <p style={{ margin: '0 0 6px', fontFamily: 'var(--skin-font-serif)', fontSize: 'var(--skin-body-size)', color: 'var(--skin-body-color)' }}>
          A cold light bleeds from the sealed dome beyond the ridge. What the last crew charted, none returned to confirm.
        </p>

        <WanderlustDivider />

        {/* ── Expedition status: quick facts ── */}
        <WanderlustSectionHeader tier="primary">Expedition Status</WanderlustSectionHeader>
        <WanderlustFieldGroup layout="columns" columns={3}>
          <WanderlustField label="Duration" value="14 days" />
          <WanderlustField label="Distance" value="Far Reach" />
          <WanderlustField label="Crew" value="3 / 5" />
        </WanderlustFieldGroup>

        <WanderlustDivider />

        {/* ── Well 1: progress ── */}
        <div style={{ position: 'relative', marginBottom: 14, padding: '15px 17px', background: 'linear-gradient(180deg, #040a11, #020509)', borderRadius: 8, boxShadow: 'inset 0 1px 0 rgba(224,178,66,0.10), inset 0 2px 8px rgba(0,0,0,0.7)' }}>
          <WellBronzeBezel />
          <WanderlustSectionHeader tier="tertiary" hint="charting the dome" marginBottom="sm">
            Observatory Progress
          </WanderlustSectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--skin-label-primary, #c9a84e)', whiteSpace: 'nowrap' }}>
              Survey Completion
            </span>
            <div
              style={{
                flex: 1,
                height: 13,
                position: 'relative',
                borderRadius: 2,
                background: 'linear-gradient(180deg, #11191e, #08121a)',
                border: '1px solid rgba(216,177,62,0.24)',
                boxShadow: 'inset 0 2px 6px rgba(7,16,26,0.65), inset 0 1px 0 rgba(9,18,28,0.55), 0 1px 0 rgba(255,255,255,0.03)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '63%',
                  borderRadius: 1,
                  background: 'linear-gradient(180deg, #95e6b0 0%, #59c889 40%, #379d70 70%, #2b7d73 90%, #205f73 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(225,255,240,0.65), inset 0 -2px 3px rgba(12,24,36,0.35), 0 0 4px rgba(143,255,211,0.08), 0 0 16px rgba(143,255,211,0.15), 0 0 30px rgba(143,255,211,0.25)',
                }}
              />
              {/* Bounce light - WoW-style bottom reflection */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(120,255,210,0.08)',
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--skin-font-sans, system-ui)', fontSize: 11, color: 'var(--skin-body-color)', whiteSpace: 'nowrap' }}>63/100</span>
          </div>
        </div>

        {/* ── Well 2: reward reveal ── */}
        <div
          style={{
            position: 'relative',
            marginBottom: 14,
            padding: '15px 17px',
            background: 'rgba(9,6,3,0.86)',
            clipPath: 'polygon(13px 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 0 100%, 0 13px)',
            boxShadow: 'inset 0 0 0 1px rgba(196,146,42,0.55), inset 0 1px 0 rgba(224,178,66,0.2), inset 0 -1px 0 rgba(45,22,6,0.4)',
          }}
        >
          <WanderlustSectionHeader tier="tertiary" marginBottom="sm">Ancient Compass</WanderlustSectionHeader>
          <WanderlustField
            orientation="horizontal"
            label="Reward"
            value="Ancient Compass"
          />
          <p style={{ margin: '6px 0 0', fontFamily: 'var(--skin-font-serif)', fontSize: '12px', color: 'var(--skin-body-color)', opacity: 0.85 }}>
            A brass astrolabe that points not north, but toward the nearest undiscovered ruin.
          </p>
        </div>

        {/* ── Well 3: repeated slot well ── */}
        <div style={{ position: 'relative', marginBottom: 4, padding: '15px 17px', background: 'linear-gradient(180deg, #040a11, #020509)', borderRadius: 8, boxShadow: 'inset 0 1px 0 rgba(224,178,66,0.10), inset 0 2px 8px rgba(0,0,0,0.7)' }}>
          <WellBronzeBezel />
          <WanderlustSectionHeader tier="tertiary" hint="assigned" marginBottom="sm">Required Crew</WanderlustSectionHeader>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {[
              { role: 'Astronomer', initial: 'A', filled: true },
              { role: 'Scout', initial: 'S', filled: true },
              { role: 'Cartographer', initial: '—', filled: false },
            ].map((slot) => (
              <div
                key={slot.role}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 6px',
                  borderRadius: 8,
                  border: slot.filled ? 'var(--skin-plaque-border)' : '1px dashed rgba(180,130,30,0.35)',
                  background: slot.filled ? 'rgba(6,29,37,0.5)' : 'rgba(8,12,18,0.32)',
                  boxShadow: slot.filled ? 'inset 0 1px 0 rgba(220,175,60,0.15), inset 0 -1px 0 rgba(45,22,6,0.55)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: 17,
                    fontWeight: 800,
                    color: slot.filled ? '#3a2a0f' : 'rgba(150,125,70,0.45)',
                    border: slot.filled ? '1px solid rgba(120,84,26,0.9)' : '1px solid rgba(120,100,60,0.3)',
                    background: slot.filled
                      ? 'radial-gradient(circle at 37% 27%, #f4d27e 0%, #cf9a3a 42%, #8a5e1e 78%, #5c3d12 100%)'
                      : 'radial-gradient(circle at 40% 30%, rgba(50,42,24,0.55), rgba(8,12,18,0.5))',
                    boxShadow: slot.filled
                      ? 'inset 0 2px 2px rgba(255,231,158,0.5), inset 0 -3px 4px rgba(60,38,10,0.8), 0 2px 3px rgba(30,18,12,0.5)'
                      : 'inset 0 2px 4px rgba(8,12,18,0.6)',
                    textShadow: slot.filled ? '0 1px 0 rgba(255,236,178,0.55)' : 'none',
                  }}
                >
                  {slot.initial}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: slot.filled ? 'var(--skin-subtitle-color)' : 'rgba(160,140,90,0.5)',
                  }}
                >
                  {slot.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <WanderlustDivider />

        {/* ── Event chronicle ── */}
        <WanderlustSectionHeader tier="tertiary">Event Chronicle</WanderlustSectionHeader>
        <WanderlustRecordList
          columns={[
            { width: '64px', variant: 'caption' },
            { width: '1fr', variant: 'body' },
          ]}
          records={[
            ['Day 1', 'Scout entered the ruins'],
            ['Day 6', 'Signal detected beneath the dome'],
            ['Day 9', 'The sealed lens began to resonate'],
          ]}
          rail
        />

        <WanderlustDivider />

        {/* ── Warnings (unmet requirements) ── */}
        <WanderlustSectionHeader tier="tertiary" hint="crew readiness">Warnings</WanderlustSectionHeader>
        <WanderlustRequirementList
          requirements={[
            { label: 'Astronomy', current: 5, required: 3 },
            { label: 'Wisdom', current: 8, required: 10 },
          ]}
        />
      </div>
    </WanderlustAmbientField>
  </WanderlustSurface>
);

export default NewObservatory;
