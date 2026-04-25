import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { MinimalGameOverState } from '@/store/useMinimalGameplay';
import type { MinimalGameOverConfig } from '@/balancing/config/idleVillage/minimalConfig';
import type { MinimalGameplayGameOverConfig } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';

type GameOverModalConfig = MinimalGameOverConfig | MinimalGameplayGameOverConfig;

const DEFAULT_STAT_LABELS = {
  daysSurvived: 'Days Survived',
  goldEarned: 'Gold Earned',
  questsCompleted: 'Quests Completed',
  residentsLost: 'Residents Lost',
  finalRoster: 'Final Roster',
} as const;

const DEFAULT_MODAL_TITLE = 'Game Over';

interface LabTelemetryContext {
  componentId: string;
  presetId?: string;
  context?: string;
}

const isLegacyConfig = (config: GameOverModalConfig): config is MinimalGameOverConfig =>
  'reasons' in config;

/**
 * Props for the MinimalGameOverModal component.
 */
export interface MinimalGameOverModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Game over state with reason and summary */
  gameOverState: MinimalGameOverState;
  /** Game over configuration */
  config: GameOverModalConfig;
  /** Callback when restart is clicked */
  onRestart: () => void;
  /** Optional callback when modal is closed */
  onClose?: () => void;
  /** Optional test ID */
  testId?: string;
  /** Optional Style Lab tokens */
  styleTokens?: MinimalStyleLabTokens;
  /** Optional lab telemetry context */
  labTelemetry?: LabTelemetryContext;
}

/**
 * Minimal Game Over Modal Component
 *
 * Displays game over state with statistics and restart option.
 * Implements accessibility features: aria-modal, focus trap, keyboard navigation.
 */
const MinimalGameOverModal: React.FC<MinimalGameOverModalProps> = ({
  isOpen,
  gameOverState,
  config,
  onRestart,
  onClose,
  testId = 'minimal-game-over-modal',
  styleTokens,
  labTelemetry,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const labViewedRef = useRef(false);

  const reasonKey = gameOverState.reason ?? 'manual_reset';

  const {
    title,
    description,
    restartLabel,
    statsConfig,
    enableRestart,
    telemetryTags,
    closeOnEscape,
    closeOnBackdropClick,
  } = useMemo(() => {
    if (isLegacyConfig(config)) {
      const legacyReason = config.reasons[reasonKey] ?? config.reasons.manual_reset;
      return {
        title: legacyReason?.title ?? config.modalTitle ?? DEFAULT_MODAL_TITLE,
        description: legacyReason?.description ?? '',
        restartLabel: legacyReason?.restartButton ?? 'Ricomincia',
        statsConfig: {
          daysSurvived: { label: config.statsLayout.daysSurvived.label, show: true },
          goldEarned: { label: config.statsLayout.goldEarned.label, show: true },
          questsCompleted: { label: config.statsLayout.questsCompleted.label, show: true },
          residentsLost: { label: config.statsLayout.residentsLost.label, show: true },
          finalRoster: { label: DEFAULT_STAT_LABELS.finalRoster, show: true },
        },
        enableRestart: true,
        telemetryTags: [] as string[],
        closeOnEscape: config.closeOnEscape !== false,
        closeOnBackdropClick: config.closeOnBackdropClick === true,
      };
    }

    const modernReason = config.messages[reasonKey] ?? config.messages.manual_reset;
    return {
      title: modernReason?.title ?? DEFAULT_MODAL_TITLE,
      description: modernReason?.description ?? '',
      restartLabel: modernReason?.ctaText ?? 'Restart',
      statsConfig: {
        daysSurvived: { label: DEFAULT_STAT_LABELS.daysSurvived, show: config.statsLayout.showDaysSurvived !== false },
        goldEarned: { label: DEFAULT_STAT_LABELS.goldEarned, show: config.statsLayout.showGoldEarned !== false },
        questsCompleted: { label: DEFAULT_STAT_LABELS.questsCompleted, show: config.statsLayout.showQuestsCompleted !== false },
        residentsLost: { label: DEFAULT_STAT_LABELS.residentsLost, show: config.statsLayout.showResidentsLost !== false },
        finalRoster: { label: DEFAULT_STAT_LABELS.finalRoster, show: config.statsLayout.showFinalRoster !== false },
      },
      enableRestart: config.enableRestart !== false,
      telemetryTags: config.telemetryTags ?? [],
      closeOnEscape: true,
      closeOnBackdropClick: false,
    };
  }, [config, reasonKey]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose?.();
      if (labTelemetry) {
        trackTelemetryEvent('component_lab_interacted', {
          componentId: labTelemetry.componentId,
          actionType: 'backdrop_close',
          presetId: labTelemetry.presetId,
          context: labTelemetry.context ?? 'component_lab',
          timestamp: Date.now(),
        });
      }
    }
  }, [closeOnBackdropClick, labTelemetry, onClose]);

  // Handle restart
  const handleRestart = useCallback(() => {
    const summary = gameOverState.summary;
    trackTelemetryEvent('minimal_gameplay_restart', {
      reason: gameOverState.reason ?? 'manual_reset',
      daysSurvived: summary?.daysSurvived ?? 0,
      goldEarned: summary?.goldEarned ?? 0,
      questsCompleted: summary?.questsCompleted ?? 0,
      residentsLost: summary?.residentsLost ?? 0,
      telemetryTags,
      timestamp: Date.now(),
      source: labTelemetry ? 'component_lab' : 'minimal_gameplay',
    });
    if (labTelemetry) {
      trackTelemetryEvent('component_lab_interacted', {
        componentId: labTelemetry.componentId,
        actionType: 'restart',
        presetId: labTelemetry.presetId,
        context: labTelemetry.context ?? 'component_lab',
        timestamp: Date.now(),
      });
    }
    onRestart();
  }, [gameOverState, labTelemetry, onRestart, telemetryTags]);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose?.();
        if (labTelemetry) {
          trackTelemetryEvent('component_lab_interacted', {
            componentId: labTelemetry.componentId,
            actionType: 'escape_close',
            presetId: labTelemetry.presetId,
            context: labTelemetry.context ?? 'component_lab',
            timestamp: Date.now(),
          });
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, labTelemetry, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !labTelemetry) {
      labViewedRef.current = false;
      return;
    }
    if (!labViewedRef.current) {
      labViewedRef.current = true;
      trackTelemetryEvent('component_lab_viewed', {
        componentId: labTelemetry.componentId,
        presetId: labTelemetry.presetId,
        context: labTelemetry.context ?? 'component_lab',
        reason: reasonKey,
        timestamp: Date.now(),
      });
    }
  }, [isOpen, labTelemetry, reasonKey]);

  const { summary } = gameOverState;

  const statCards = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        key: 'daysSurvived',
        label: statsConfig.daysSurvived.label ?? DEFAULT_STAT_LABELS.daysSurvived,
        value: summary.daysSurvived,
        color: 'text-amber-400',
        show: statsConfig.daysSurvived.show,
      },
      {
        key: 'goldEarned',
        label: statsConfig.goldEarned.label ?? DEFAULT_STAT_LABELS.goldEarned,
        value: summary.goldEarned,
        color: 'text-yellow-400',
        show: statsConfig.goldEarned.show,
      },
      {
        key: 'questsCompleted',
        label: statsConfig.questsCompleted.label ?? DEFAULT_STAT_LABELS.questsCompleted,
        value: summary.questsCompleted,
        color: 'text-blue-400',
        show: statsConfig.questsCompleted.show,
      },
      {
        key: 'residentsLost',
        label: statsConfig.residentsLost.label ?? DEFAULT_STAT_LABELS.residentsLost,
        value: summary.residentsLost,
        color: 'text-red-400',
        show: statsConfig.residentsLost.show,
      },
    ].filter((card) => card.show);
  }, [statsConfig, summary]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      aria-describedby="game-over-description"
      data-testid={testId}
    >
      <div
        ref={modalRef}
        className="relative max-w-md w-full mx-4 rounded-2xl shadow-2xl"
        tabIndex={-1}
        style={{
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          background: 'var(--panel-surface, rgba(2,6,23,0.95))',
          ...(styleTokens?.cssVars ?? {}),
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h1
            id="game-over-title"
            className="text-2xl font-bold text-center text-white"
          >
            {title || DEFAULT_MODAL_TITLE}
          </h1>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Reason */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-amber-400 mb-2">
              {title}
            </h2>
            <p
              id="game-over-description"
              className="text-slate-300 leading-relaxed"
            >
              {description}
            </p>
          </div>

          {/* Statistics */}
          {summary && (
            <div className="mb-6 space-y-3">
              <h3 className="text-lg font-medium text-white mb-4 text-center">
                Statistiche Finali
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((card) => (
                  <div key={card.key} className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                    <div className={`text-2xl font-bold ${card.color}`}>
                      {card.value}
                    </div>
                    <div className="text-sm text-slate-300">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
              {statsConfig.finalRoster.show && summary.finalRoster?.length ? (
                <div className="mt-4 text-left">
                  <p className="text-sm font-semibold text-slate-200 mb-2">
                    {DEFAULT_STAT_LABELS.finalRoster}
                  </p>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    {summary.finalRoster.map((resident) => (
                      <li key={resident.id} className="flex items-center justify-between border border-white/5 rounded-md px-2 py-1">
                        <span>{resident.name}</span>
                        <span className="text-xs text-slate-400">
                          Lv.{resident.level}{resident.isInjured ? ' · Injured' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {/* Actions */}
          {enableRestart && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleRestart}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                autoFocus
              >
                {restartLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalGameOverModal;
