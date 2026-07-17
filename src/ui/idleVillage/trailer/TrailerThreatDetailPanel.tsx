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
import { InsetPanelDelicate } from '@/ui/wanderlust-surface';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { GenericPoiSkin } from '@/ui/idleVillage/frozen/kits/poiKit';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';

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
  /** Optional test id. */
  dataTestId?: string;
}

/**
 * TrailerThreatDetailPanel — reduced POI-detail fork for the threat scene.
 *
 * Renders a `WanderlustSurface` bronze frame over a Visual Fidelity Lab
 * teal/obsidian well, with a POI mirror, heraldic title, and a timer inset.
 */
export const TrailerThreatDetailPanel: React.FC<TrailerThreatDetailPanelProps> = ({
  title,
  subtitle,
  plaque,
  timeRemaining,
  poiIcon = '⚔️',
  mode = 'event',
  dataTestId = 'trailer-threat-detail-panel',
}) => {
  const scene = trailerConfig.threat;
  const baseOverlay = scene.baseTealOverlay;
  const timerText = useMemo(() => formatCountdown(timeRemaining), [timeRemaining]);

  const isEvent = mode === 'event';

  return (
    <WanderlustSurface shape="panel" material="bronze" interactive={false}>
      <WanderlustAmbientField
        paused={false}
        style={{
          background: baseOverlay.background,
          boxShadow: baseOverlay.boxShadow,
          borderRadius: 'inherit',
          padding: isEvent ? '32px 44px' : '12px 22px',
        }}
      >
        <div
          data-testid={dataTestId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isEvent ? 14 : 8,
            textAlign: 'center',
            minWidth: isEvent ? 320 : 520,
          }}
        >
          {/* POI mirror */}
          <GenericPoiSkin
            icon={poiIcon}
            progress={0.35}
            size={isEvent ? 72 : 44}
            pillar="wilderness"
            enableHover={false}
          />

          {/* Plaque */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px 10px',
              border: '1px solid rgba(180, 130, 30, 0.35)',
              borderRadius: '5px',
              background: 'rgba(201, 162, 39, 0.08)',
              fontFamily: 'var(--skin-font-display, Cinzel, Georgia, serif)',
              fontSize: '0.58rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--skin-title-color, #c9a227)',
              textShadow: '0 0 8px rgba(201, 162, 39, 0.55), 0 1px 2px rgba(0, 0, 0, 0.7)',
              whiteSpace: 'nowrap',
            }}
          >
            {plaque}
          </div>

          {/* Title / subtitle */}
          {isEvent && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--skin-font-display, Cinzel, Georgia, serif)',
                  fontSize: 'clamp(34px, 6vw, 72px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  lineHeight: 1.05,
                  color: 'var(--skin-title-color, #c9a227)',
                  textShadow: `
                    0 0 28px rgba(201, 162, 39, 0.55),
                    0 2px 0 rgba(0, 0, 0, 0.85),
                    0 -1px 0 rgba(255, 255, 255, 0.06)
                  `,
                  filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.75))',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--skin-font-display, Cinzel, Georgia, serif)',
                    fontSize: 'clamp(12px, 1.6vw, 16px)',
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--skin-text-secondary, #a7b0b3)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.85)',
                    textAlign: 'center',
                    maxWidth: 520,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Timer well */}
          <InsetPanelDelicate material="bronze" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isEvent ? 18 : 24,
              }}
            >
              {!isEvent && (
                <span
                  style={{
                    fontFamily: 'var(--skin-font-display, Cinzel, Georgia, serif)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--skin-title-color, #c9a227)',
                    textShadow: '0 0 8px rgba(201, 162, 39, 0.45), 0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {title}
                </span>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--skin-text-secondary, #a7b0b3)',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(180, 130, 30, 0.55), transparent)',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--skin-title-color, #c9a227)', opacity: 0.8 }}>◆</span>
                <span
                  style={{
                    width: 40,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(180, 130, 30, 0.55), transparent)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span
                  style={{
                    fontFamily: 'var(--skin-font-display, Cinzel, Georgia, serif)',
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--skin-text-secondary, #a7b0b3)',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.7)',
                  }}
                >
                  TIME REMAINING
                </span>
                <span
                  style={{
                    fontFamily: "'Lato', var(--skin-font-display, Cinzel), sans-serif",
                    fontSize: isEvent ? '1.55rem' : '1.35rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#f0cf6a',
                    textShadow: '0 0 12px rgba(240, 207, 106, 0.4), 0 2px 4px rgba(0, 0, 0, 0.85)',
                  }}
                >
                  {timerText}
                </span>
              </div>
            </div>
          </InsetPanelDelicate>
        </div>
      </WanderlustAmbientField>
    </WanderlustSurface>
  );
};

export default TrailerThreatDetailPanel;
