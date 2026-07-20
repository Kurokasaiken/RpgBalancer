/**
 * @trailer-only
 *
 * TrailerThreatDetailPanel — fork ridotto del pannello POI detail
 * (`ActivityCapsuleDetailSkinAware`) per la scena Threat del trailer.
 *
 * Riproduce solo la parte superiore del POI detail: cresta POI, targa,
 * titolo, sottotitolo e timer. Non include slot rack, telemetry, CTA né drag.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React, { useMemo } from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { GenericPoiSkin } from '@/ui/idleVillage/frozen/kits/poiKit';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';
import { FIELD_BACKGROUND, FIELD_VIGNETTE, SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER } from '@/ui/visualFidelityLab/foundationRecipe';

/**
 * Format a total-seconds countdown into H:MM:SS.
 */
function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Visual mode for the detail panel. */
export type TrailerThreatDetailMode = 'event' | 'timer';

/** Props for TrailerThreatDetailPanel. */
export interface TrailerThreatDetailPanelProps {
  /** Title displayed in the panel header. */
  title: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** Plaque label shown above the title. */
  plaque: string;
  /** Time remaining in seconds for the timer well. */
  timeRemaining: number;
  /** POI icon/emoji rendered in the mirror medallion. */
  poiIcon?: string;
  /** Visual layout mode. */
  mode?: TrailerThreatDetailMode;
}

/**
 * TrailerThreatDetailPanel — reduced POI-detail fork for the threat scene.
 *
 * Renders a `WanderlustSurface` bronze frame around a skin-system interior
 * panel, with a POI mirror, title, and timer well.
 */
export const TrailerThreatDetailPanel: React.FC<TrailerThreatDetailPanelProps> = ({
  title,
  subtitle,
  plaque,
  timeRemaining,
  poiIcon = '⚔️',
  mode = 'event',
}) => {
  const timerText = useMemo(() => formatCountdown(timeRemaining), [timeRemaining]);

  const isEvent = mode === 'event';

  return (
    <WanderlustSurface
      shape="panel"
      material={SURFACE_MATERIAL}
      interactive={false}
      materialLayer={SURFACE_MATERIAL_LAYER}
      style={{ width: '100%', borderRadius: 14 }}
    >
      <WanderlustAmbientField
        fireflyCount={isEvent ? 9 : 0}
        style={{
          background: FIELD_BACKGROUND,
          boxShadow: FIELD_VIGNETTE,
          borderRadius: 'inherit',
        }}
      >
        <SkinScope>
          <div style={{ padding: isEvent ? 26 : 12 }}>
          {/* ── Header (plaque + incised title + subtitle) ── */}
          <div className="skin-title-row">
            <span className="skin-plaque" style={{ userSelect: 'none' }}>{plaque}</span>
            <div style={{ flex: '1 1 auto' }}>
              {isEvent && (
                <>
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
                    {title}
                  </h2>
                  {subtitle && (
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
                      {subtitle}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="skin-titlesep">
            <span className="skin-titlesep__line" />
            <span className="skin-titlesep__diamond">✦</span>
            <span className="skin-titlesep__line" />
          </div>

          {/* POI mirror */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isEvent ? 14 : 8 }}>
            <GenericPoiSkin
              icon={poiIcon}
              progress={0.35}
              size={isEvent ? 72 : 44}
              pillar="wilderness"
              enableHover={false}
            />
          </div>

          {/* Timer well */}
          <div style={{ padding: '15px 17px', background: 'linear-gradient(180deg, #11191e, #08121a)', borderRadius: 8, border: '1px solid rgba(7,16,26,0.4)', boxShadow: 'inset 0 2px 6px rgba(7,16,26,0.65), inset 0 1px 0 rgba(9,18,28,0.55)' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: isEvent ? '14px 16px' : '8px 12px',
              }}
            >
              {!isEvent && (
                <span
                  data-skin="title"
                  style={{
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--skin-title-color)',
                  }}
                >
                  {title}
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 40, height: 1, background: 'var(--skin-titlesep-line)' }} />
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--skin-titlesep-diamond-color)',
                    textShadow: 'var(--skin-titlesep-diamond-glow)',
                  }}
                >
                  ◆
                </span>
                <span style={{ width: 40, height: 1, background: 'var(--skin-titlesep-line)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span
                  className="skin-text-secondary"
                  style={{
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  TIME REMAINING
                </span>
                <span
                  data-skin="title"
                  style={{
                    fontFamily: 'var(--skin-font-sans)',
                    fontSize: isEvent ? '1.55rem' : '1.35rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  {timerText}
                </span>
              </div>
            </div>
          </div>
        </div>
        </SkinScope>
      </WanderlustAmbientField>
    </WanderlustSurface>
  );
};

export default TrailerThreatDetailPanel;
