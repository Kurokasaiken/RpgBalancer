import React from 'react';
import { WanderlustSurface, InsetPanel } from '@/ui/wanderlust-surface';
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

/**
 * REBUILD — "The Forgotten Observatory".
 *
 * Designed from scratch, NOT by relabelling the reference. The reference was
 * header → fields → requirements → records. This is a different hierarchy:
 * status → three stacked InsetPanel wells (progress / reward / crew) → chronicle
 * → warnings. Inset-heavy and progress-driven.
 *
 * Built ONLY from the existing grammar:
 *   - WanderlustSurface (frame), WanderlustAmbientField (atmosphere)
 *   - InsetPanel (content wells)
 *   - layout primitives (Field/StatBar/RecordList/RequirementList/Section/Divider)
 *   - existing --skin-* tokens
 *
 * The "Required Crew" slot well is DELIBERATELY composed "poor" — plain divs
 * inside an InsetPanel, no ResidentSlotRack, no new SlotWell component. This is
 * the measurand: can the current grammar birth a rich repeated content well, or
 * does it read as a flat web-app list? (see fidelity-notes.md, Finding #1 slot).
 */
export const ForgottenObservatory: React.FC = () => (
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
        // V9 "anima": azure light leak raining from above + sacred obsidian base
        // + inner vignette for edge depth. NOTE: `--skin-surface-bg` already
        // carries a top-LEFT leak; the earlier warm-teal overlay is what muddied
        // it into flat dark-mode grey. In extraction, the well background should
        // simply BE this token — no per-component overlay.
        background: [
          'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.12) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
          '#060f16',
        ].join(', '),
        boxShadow: 'inset 0 0 60px rgba(2,6,10,0.8)',
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
              The Forgotten Observatory
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
        {/* REFINEMENT (measurand): the shipped WanderlustStatBar renders a rounded
            "pill" (its materic carved-channel variant is gated behind a context
            provider not in the grammar). Composed here "poor" as a channel CARVED
            into slate: sharp 2px corners + deep inset shadow, green sap flowing
            inside. Spec for a future materic StatBar primitive. */}
        <InsetPanel style={{ marginBottom: 14 }}>
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
                background: 'linear-gradient(180deg, #0a0908, #040404)',
                border: '1px solid rgba(216,177,62,0.16)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.03)',
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
                  background: 'linear-gradient(180deg, #86d8a1 0%, #3a9c62 55%, #206e42 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(205,255,222,0.55), inset 0 -2px 3px rgba(0,0,0,0.45), 0 0 8px rgba(80,200,120,0.35)',
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--skin-font-sans, system-ui)', fontSize: 11, color: 'var(--skin-body-color)', whiteSpace: 'nowrap' }}>63/100</span>
          </div>
        </InsetPanel>

        {/* ── Well 2: reward reveal — DIFFERENTIATED as a special plaque ── */}
        {/* REFINEMENT: breaks the "box in box" monotony. Notched 45° top corners
            (clip-path) + gold inset hairline read it as a reward plaque, not a
            status container. Spec for a future "plaque" InsetPanel variant. */}
        <div
          style={{
            position: 'relative',
            marginBottom: 14,
            padding: '15px 17px',
            background: 'rgba(9,6,3,0.86)',
            clipPath: 'polygon(13px 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 0 100%, 0 13px)',
            boxShadow: 'inset 0 0 0 1px rgba(196,146,42,0.55), inset 0 1px 0 rgba(224,178,66,0.2), inset 0 -1px 0 rgba(0,0,0,0.4)',
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

        {/* ── Well 3: repeated slot well — COMPOSED "poor" from primitives ── */}
        <InsetPanel style={{ marginBottom: 4 }}>
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
                  background: slot.filled ? 'rgba(6,29,37,0.5)' : 'rgba(0,0,0,0.28)',
                  boxShadow: slot.filled ? 'inset 0 1px 0 rgba(220,175,60,0.15), inset 0 -1px 0 rgba(0,0,0,0.35)' : 'none',
                }}
              >
                {/* REFINEMENT: embossed bronze coin, not flat glyph-in-circle.
                    Radial metal gradient + top-light/bottom-dark inset bevel +
                    contact shadow give physical weight; the letter reads as
                    incised into the coin. Spec for a future materic token/medal. */}
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
                      : 'radial-gradient(circle at 40% 30%, rgba(50,42,24,0.55), rgba(0,0,0,0.5))',
                    boxShadow: slot.filled
                      ? 'inset 0 2px 2px rgba(255,231,158,0.5), inset 0 -3px 4px rgba(60,38,10,0.8), 0 2px 3px rgba(0,0,0,0.55)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.6)',
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
        </InsetPanel>

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

export default ForgottenObservatory;
