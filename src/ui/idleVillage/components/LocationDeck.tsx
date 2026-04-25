/**
 * LocationDeck Component for Idle Village Minimal Gameplay
 *
 * Config-driven deck component that renders location cards with validation,
 * telemetry, and Style Lab visual tokens. Displays location status overview
 * with drop states and activity progress.
 *
 * @since NP-MIN-010C
 */

import { useMemo } from 'react';
import type { JSX } from 'react';
import type { MinimalGameplayLocationDefinition } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { LocationDropState } from '../map/validators/locationDropValidators';
import { deriveLocationDropState } from '../map/validators/locationDropValidators';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropFeedbackConfig, DropFeedbackState } from '@/ui/idleVillage/hooks/useDropFeedback';
import { DropFeedbackContainer } from '@/ui/idleVillage/components/DropFeedbackUI';

const LOCATION_STATE_TOKENS: Record<LocationDropState, { label: string; helper: string; border: string; background: string; text: string }> = {
  idle: {
    label: 'Idle',
    helper: 'Nessun drag attivo',
    border: 'rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.03)',
    text: 'var(--text-muted, rgba(226,232,240,0.8))',
  },
  valid: {
    label: 'Drop Valido',
    helper: 'Compatibile con i requisiti attuali',
    border: 'rgba(251,191,36,0.65)',
    background: 'rgba(251,191,36,0.12)',
    text: 'var(--accent-color, #f59e0b)',
  },
  invalid: {
    label: 'Drop Bloccato',
    helper: 'Requisiti o crew non soddisfatti',
    border: 'rgba(239,68,68,0.45)',
    background: 'rgba(239,68,68,0.12)',
    text: 'var(--color-crimson, #ef4444)',
  },
  locked: {
    label: 'Fase Notte',
    helper: 'Disponibile solo durante il giorno',
    border: 'rgba(148,163,184,0.4)',
    background: 'rgba(15,23,42,0.35)',
    text: 'var(--text-muted, rgba(148,163,184,0.9))',
  },
};

export interface LocationDeckProps {
  /** Array of location definitions from config */
  locations: MinimalGameplayLocationDefinition[];
  /** Current location drop states map */
  locationStates: Record<string, LocationDropState>;
  /** Available residents for validation */
  residents: ResidentState[];
  /** Whether it's day phase */
  isDayPhase: boolean;
  /** Resident currently being dragged */
  draggingResidentId: string | null;
  /** Slot feedback state map */
  slotFeedbackState?: Record<string, DropFeedbackState>;
  /** Drop feedback configuration */
  dropFeedbackConfig?: DropFeedbackConfig;
  /** Optional test ID prefix */
  testId?: string;
}

/**
 * LocationDeck renders a config-driven grid of location cards with validation states.
 */
export function LocationDeck({
  locations,
  locationStates,
  residents,
  isDayPhase,
  draggingResidentId,
  slotFeedbackState = {},
  dropFeedbackConfig,
  testId = 'location-deck',
}: LocationDeckProps): JSX.Element {
  const diagnostics = useMemo(
    () => createSandboxDiagnostics('LocationDeck', 'minimal-gameplay'),
    []
  );

  // Compute drop states for each location with validation
  const locationCards = useMemo(() => {
    return locations.map((location) => {
      const dropState = locationStates[location.slotId] ?? 'idle';
      const palette = LOCATION_STATE_TOKENS[dropState as LocationDropState] ?? LOCATION_STATE_TOKENS.idle;

      // Telemetry for location state changes
      if (dropState !== 'idle') {
        trackTelemetryEvent('location_deck_state_change', {
          source: 'LocationDeck',
          locationId: location.id,
          slotId: location.slotId,
          dropState,
          draggingResidentId,
          isDayPhase,
          timestamp: Date.now(),
        });
      }

      // Diagnostics logging
      diagnostics.info('location_card_rendered', {
        locationId: location.id,
        slotId: location.slotId,
        dropState,
        draggingResidentId,
        isDayPhase,
      });

      return {
        ...location,
        dropState,
        palette,
      };
    });
  }, [locations, locationStates, draggingResidentId, isDayPhase, diagnostics]);

  return (
    <div
      data-testid={testId}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}
    >
      {locationCards.map((card) => {
        const slotFeedback = slotFeedbackState[card.slotId];
        const hasVisibleFeedback = Boolean(slotFeedback?.visible && slotFeedback.feedbackType);
        const feedbackType = slotFeedback?.feedbackType ?? 'valid';
        const feedbackVisuals = hasVisibleFeedback && dropFeedbackConfig
          ? dropFeedbackConfig.visual[feedbackType]
          : undefined;

        return (
          <DropFeedbackContainer
            key={card.id}
            isDragActive={Boolean(hasVisibleFeedback && draggingResidentId)}
            feedbackType={feedbackType}
            message={slotFeedback?.message}
            showTooltip={hasVisibleFeedback}
            showIndicator={hasVisibleFeedback}
            visuals={feedbackVisuals}
            className="h-full"
            testId={`${testId}-feedback-${card.slotId}`}
          >
            <article
              data-testid={`${testId}-card-${card.slotId}`}
              style={{
                borderRadius: 20,
                border: `1px solid ${card.palette.border}`,
                background: card.palette.background,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 20 }} aria-hidden>
                  {card.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: card.palette.text,
                  }}
                >
                  {card.palette.label}
                </span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: 'var(--text-primary, #f7f2d8)',
                }}
              >
                {card.label}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'var(--text-muted, rgba(226,232,240,0.7))',
                }}
              >
                {card.palette.helper}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--text-muted, rgba(226,232,240,0.6))',
                }}
              >
                {card.description}
              </p>
            </article>
          </DropFeedbackContainer>
        );
      })}
    </div>
  );
}

export default LocationDeck;
