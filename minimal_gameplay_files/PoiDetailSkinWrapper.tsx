/**
 * POI Detail Skin Wrapper
 * 
 * Wrapper component that integrates TemporarySkinConfig (poi_detail_dark_luxury)
 * with ActivityCapsuleDetailSkinAware component and provides telemetry.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityCapsuleDetailSkinAware, type ActivityDetailSlotData, type TelemetryEntry } from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import {
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
  type ActivityCapsuleDetailSkinConfig,
} from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinSchema';
import { getTemporarySkinConfig } from '../skins/temporary/temporarySkinRegistry';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

export interface PoiDetailSkinWrapperProps {
  /** Core activity data */
  activityId: string;
  name: string;
  type: string;
  subtitle?: string;
  
  /** Status and progress */
  status: 'idle' | 'in-progress' | 'completed' | 'blocked';
  progress: number;
  duration: number;
  elapsed: number;
  
  /** Slot management */
  slots: ActivityDetailSlotData[];
  maxSlots: number;
  
  /** Information display */
  durationDisplay: string;
  rewardDisplay: string;
  etaDisplay: string;
  
  /** Telemetry */
  telemetry: TelemetryEntry[];
  
  /** Actions */
  onStart?: () => void;
  onCancel?: () => void;
  onCollect?: () => void;
  onSlotAssign?: (slotId: string) => void;
  onSlotDetach?: (slotId: string) => void;
  
  /** Window management */
  isOpen: boolean;
  onClose?: () => void;
  enableDrag?: boolean;
  position?: { x: number; y: number };
  
  /** Display options */
  showTelemetry?: boolean;
  showSlots?: boolean;
  showInfo?: boolean;
  compact?: boolean;
  inlineMode?: boolean;
  
  /** Accessibility */
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  
  /** Development tools */
  enableDevTools?: boolean;
  
  /** Test identifiers */
  dataTestId?: string;
  
  /** Skin override */
  skinOverrideId?: string;
}

const resolveColorToken = (token?: string | { r: number; g: number; b: number; label?: string }): string | undefined => {
  if (!token) return undefined;
  if (typeof token === 'string') return token;
  const { r, g, b } = token;
  return `rgb(${r}, ${g}, ${b})`;
};

export function PoiDetailSkinWrapper({
  activityId,
  name,
  type,
  subtitle,
  status,
  progress,
  duration,
  elapsed,
  slots,
  maxSlots,
  durationDisplay,
  rewardDisplay,
  etaDisplay,
  telemetry,
  onStart,
  onCancel,
  onCollect,
  onSlotAssign,
  onSlotDetach,
  isOpen,
  onClose,
  enableDrag = true,
  position,
  showTelemetry = true,
  showSlots = true,
  showInfo = true,
  compact = false,
  inlineMode = false,
  ariaLabel,
  ariaLive = 'polite',
  enableDevTools = false,
  dataTestId = 'poi-detail-skin-wrapper',
  skinOverrideId,
}: PoiDetailSkinWrapperProps) {
  
  // Get POI detail skin configuration
  const poiDetailSkin = getTemporarySkinConfig(skinOverrideId || 'poi_wilderness_amber');
  
  // Get slot skin configuration for amber POI
  const slotSkin = poiDetailSkin.id === 'poi_wilderness_amber' 
    ? getTemporarySkinConfig('slot_wilderness_bronze')
    : null;
  
  const [detailOpen, setDetailOpen] = useState(isOpen);

  useEffect(() => {
    setDetailOpen(isOpen);
  }, [isOpen]);

  const handleToggleDetail = useCallback(() => {
    setDetailOpen((prev) => {
      const next = !prev;
      trackTelemetryEvent('poi_detail_skin_toggle', {
        activityId,
        name,
        nextState: next ? 'open' : 'closed',
        timestamp: Date.now(),
      });
      return next;
    });
  }, [activityId, name]);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    onClose?.();
  }, [onClose]);

  const poiSummaryLabel = useMemo(() => name, [name]);

  // Emit telemetry when skin is rendered
  useEffect(() => {
    if (detailOpen && poiDetailSkin) {
      trackTelemetryEvent('poi_detail_skin_rendered', {
        skinId: poiDetailSkin.id,
        skinName: poiDetailSkin.name,
        skinVersion: poiDetailSkin.version,
        targetVersion: poiDetailSkin.targetVersion,
        activityId,
        activityType: type,
        status,
        progress,
        slotCount: slots.length,
        renderTimestamp: Date.now(),
        isOpen: detailOpen,
        compact,
        hasSkinConfig: !!poiDetailSkin,
      });
    }
  }, [
    detailOpen,
    poiDetailSkin,
    activityId,
    type,
    status,
    progress,
    slots.length,
    compact,
  ]);
  
  const renderDetail = () => {
    if (!poiDetailSkin) {
      console.warn('POI Detail skin "poi_detail_dark_luxury" not found, rendering without skin');
      return (
        <div 
          data-testid={dataTestId}
          data-activity-id={activityId}
          data-status={status}
          data-skin-applied="false"
          className="poi-detail-skin-wrapper__fallback"
        >
          <h3>{name}</h3>
          {subtitle && <div className="poi-detail-skin-wrapper__fallback-subtitle">{subtitle}</div>}
          <div>Status: {status}</div>
          <div>Progress: {Math.round(progress * 100)}%</div>
          <div>Slots: {slots.length}/{maxSlots}</div>
        </div>
      );
    }

    const skinOverrides = {
      enableValidation: true,
      enableTelemetry: true,
      window: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.window,
        windowBackground: resolveColorToken(poiDetailSkin.colorTokens?.body_base) || '#0c0a08',
        windowBorder: `3px solid ${resolveColorToken(poiDetailSkin.colorTokens?.bronze_mid) || '#3a2008'}`,
        windowBorderRadius: '26px',
        frameGradient: `linear-gradient(155deg, ${resolveColorToken(poiDetailSkin.colorTokens?.body_base) || '#0c0a08'} 0%, #1a1512 100%)`,
      },
      poi: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.poi,
        poiSize: '68px',
        poiGlow: '0 0 20px rgba(255, 216, 74, 0.3)',
        idleColor: resolveColorToken(poiDetailSkin.colorTokens?.rack_base) || '#1e2d48',
        activeColor: resolveColorToken(poiDetailSkin.colorTokens?.title_color) || '#ffd84a',
        completedColor: resolveColorToken(poiDetailSkin.colorTokens?.stat_value) || '#e8b040',
      },
      header: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.header,
        nameColor: resolveColorToken(poiDetailSkin.colorTokens?.title_color) || '#ffd84a',
        nameFont: 'Cinzel, serif',
        nameFontSize: '24px',
        typeColor: resolveColorToken(poiDetailSkin.colorTokens?.subtitle) || 'rgba(192,158,78,.55)',
        typeFont: 'EB Garamond, serif',
        typeFontSize: '12px',
      },
      slotRack: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.slotRack,
        slotSize: '68px',
        cavityGradient: `radial-gradient(circle, ${resolveColorToken(poiDetailSkin.colorTokens?.rack_base) || '#1e2d48'} 0%, #0a0c14 100%)`,
        initialsColor: resolveColorToken(poiDetailSkin.colorTokens?.title_color) || '#ffd84a',
        initialsFont: 'Cinzel, serif',
        initialsFontSize: '16px',
      },
      cta: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.cta,
        buttonBackground: resolveColorToken(poiDetailSkin.colorTokens?.bronze_mid) || '#3a2008',
        buttonBorder: `1px solid ${resolveColorToken(poiDetailSkin.colorTokens?.bronze_dark) || 'rgba(0,0,0,.96)'}`,
        buttonColor: resolveColorToken(poiDetailSkin.colorTokens?.title_color) || '#ffd84a',
        buttonFont: 'Cinzel, serif',
        buttonFontSize: '8.5px',
      },
      typography: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.typography,
        primaryFont: 'EB Garamond, serif',
        textPrimary: resolveColorToken(poiDetailSkin.colorTokens?.title_color) || '#ffd84a',
        textSecondary: resolveColorToken(poiDetailSkin.colorTokens?.subtitle) || 'rgba(192,158,78,.55)',
      },
    } satisfies Partial<ActivityCapsuleDetailSkinConfig>;

    return (
      <ActivityCapsuleDetailSkinAware
      activityId={activityId}
      name={name}
      type={type}
      subtitle={subtitle}
      status={status}
      progress={progress}
      duration={duration}
      elapsed={elapsed}
      slots={slots}
      maxSlots={maxSlots}
      durationDisplay={durationDisplay}
      rewardDisplay={rewardDisplay}
      etaDisplay={etaDisplay}
      telemetry={telemetry}
      onStart={onStart}
      onCancel={onCancel}
      onCollect={onCollect}
      onSlotAssign={onSlotAssign}
      onSlotDetach={onSlotDetach}
      isOpen={detailOpen}
      onClose={handleCloseDetail}
      enableDrag={enableDrag && !inlineMode}
      position={position}
      showTelemetry={showTelemetry}
      showSlots={showSlots}
      showInfo={showInfo}
      compact={compact}
      inlineMode={inlineMode}
      ariaLabel={ariaLabel}
      ariaLive={ariaLive}
      enableDevTools={enableDevTools}
      dataTestId={dataTestId}
      // Skin configuration - use wilderness pillar with dark luxury aesthetic
      pillar="wilderness"
      skinPresetId="wanderlust"
      motionLevel="full"
      enableSkinBinding={true}
      skinBindingId={`poi-detail-${activityId}`}
      // Apply POI detail skin overrides
      skinConfigOverride={skinOverrides}
      onValidationError={(errors) => {
        console.warn('POI Detail skin validation errors:', errors);
        trackTelemetryEvent('poi_detail_skin_validation_error', {
          skinId: poiDetailSkin.id,
          activityId,
          errorCount: errors.errors.length,
          errors: errors.errors.map(e => `${e.path}: ${e.message}`),
          timestamp: Date.now(),
        });
      }}
      onSkinChange={(config) => {
        trackTelemetryEvent('poi_detail_skin_changed', {
          skinId: poiDetailSkin.id,
          activityId,
          pillar: config.pillar,
          presetId: config.presetId,
          motionLevel: config.motionLevel,
          timestamp: Date.now(),
        });
      }}
    />
    );
  };

  const detailContent = detailOpen ? renderDetail() : (
    <div
      className="poi-detail-skin-wrapper__detail-placeholder"
      aria-hidden="true"
      data-poi-detail-placeholder="true"
    />
  );

  return (
    <div
      className="poi-detail-skin-wrapper"
      data-testid={dataTestId}
      data-poi-inline-mode={inlineMode ? 'true' : 'false'}
    >
      <button
        type="button"
        className="poi-detail-skin-wrapper__poi-trigger"
        onClick={handleToggleDetail}
        aria-pressed={detailOpen}
        data-poi-trigger="true"
      >
        <div className="poi-detail-skin-wrapper__poi-orb" aria-hidden>
          {poiDetailSkin.id === 'poi_wilderness_amber' ? (
            <div 
              className="poi-detail-skin-wrapper__poi-orb-amber"
              dangerouslySetInnerHTML={{ __html: poiDetailSkin.htmlTemplate }}
            />
          ) : (
            <div className="poi-detail-skin-wrapper__poi-orb-core" />
          )}
        </div>
        <div className="poi-detail-skin-wrapper__poi-meta">
          <span className="poi-detail-skin-wrapper__poi-label">{poiSummaryLabel}</span>
          {subtitle && (
            <span className="poi-detail-skin-wrapper__poi-subtitle">{subtitle}</span>
          )}
          <span className="poi-detail-skin-wrapper__poi-helper">
            {detailOpen ? 'Nascondi dettaglio' : 'Mostra dettaglio'}
          </span>
        </div>
      </button>

      <div
        className="poi-detail-skin-wrapper__detail-slot"
        data-poi-detail-open={detailOpen}
      >
        {detailContent}
      </div>

      <style>{`
        .poi-detail-skin-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        .poi-detail-skin-wrapper__poi-trigger {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--minimal-card-surface, rgba(14,20,26,0.85));
          border: 1px solid var(--minimal-panel-border, rgba(255,255,255,0.08));
          border-radius: var(--minimal-card-radius, 20px);
          padding: 1rem 1.25rem;
          color: var(--minimal-text-primary, #f5f5f4);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .poi-detail-skin-wrapper__poi-trigger:hover,
        .poi-detail-skin-wrapper__poi-trigger[data-poi-trigger="true"][aria-pressed="true"] {
          border-color: var(--minimal-accent-color, #8db3a5);
        }

        .poi-detail-skin-wrapper__poi-orb {
          width: 72px;
          height: 72px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,215,128,0.2) 0%, rgba(0,0,0,0.4) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .poi-detail-skin-wrapper__poi-orb-core {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: transparent;
          border: 1px dashed rgba(255,255,255,0.18);
        }

        .poi-detail-skin-wrapper__poi-orb-amber {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poi-detail-skin-wrapper__poi-orb-amber svg {
          width: 100%;
          height: 100%;
        }

        .poi-detail-skin-wrapper__poi-meta {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .poi-detail-skin-wrapper__poi-label {
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .poi-detail-skin-wrapper__poi-subtitle {
          font-size: 0.75rem;
          color: var(--minimal-text-secondary, rgba(255,255,255,0.6));
        }

        .poi-detail-skin-wrapper__poi-helper {
          font-size: 0.7rem;
          color: var(--minimal-accent-color, #8db3a5);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .poi-detail-skin-wrapper__detail-slot {
          width: 100%;
          min-height: clamp(260px, 40vw, 520px);
          border-radius: var(--minimal-card-radius, 20px);
          background: var(--minimal-card-surface, rgba(14,20,26,0.35));
          border: 1px dashed var(--minimal-panel-border, rgba(255,255,255,0.14));
          padding: 0;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .poi-detail-skin-wrapper__detail-slot[data-poi-detail-open="true"] {
          border-style: solid;
          border-color: var(--minimal-accent-color, #8db3a5);
          background: var(--minimal-card-surface, rgba(14,20,26,0.85));
        }

        .poi-detail-skin-wrapper__detail-placeholder {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          border: 1px dashed rgba(255,255,255,0.12);
          background: repeating-linear-gradient(
            135deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 12px,
            rgba(255,255,255,0.05) 12px,
            rgba(255,255,255,0.05) 24px
          );
        }

        .poi-detail-skin-wrapper__fallback {
          padding: 1.25rem;
          border-radius: 24px;
          background: rgba(12, 10, 8, 0.9);
          border: 1px solid rgba(58, 32, 8, 0.7);
          color: #ffd84a;
        }

        .poi-detail-skin-wrapper__fallback-subtitle {
          font-size: 0.8rem;
          color: rgba(255, 216, 74, 0.7);
          margin-bottom: 0.5rem;
        }
      `}</style>
      
      {/* Inject skin CSS if amber skin is used */}
      {poiDetailSkin.id === 'poi_wilderness_amber' && (
        <>
          <style dangerouslySetInnerHTML={{ __html: poiDetailSkin.cssStyles }} />
          {slotSkin && <style dangerouslySetInnerHTML={{ __html: slotSkin.cssStyles }} />}
        </>
      )}
    </div>
  );
}

export default PoiDetailSkinWrapper;
