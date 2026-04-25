/**
 * ActionToolbar – Minimal Gameplay Action Panel
 *
 * Config-driven action toolbar for buy food and start quest demo actions.
 * Displays buttons with tooltips and handles async feedback with status messages.
 */

import type { JSX } from 'react';
import React, { useState } from 'react';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { MINIMAL_GAMEPLAY_UI_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalGameplayUIConfig } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalUIActionPanel, MinimalUIConfig } from '@/balancing/config/idleVillage/minimalConfig';

interface ActionToolbarProps {
  /** Action panel configuration from config */
  actionPanel: MinimalUIActionPanel;
  /** Callback for buy food action */
  onBuyFood: () => Promise<{ success: boolean; message?: string }>;
  /** Callback for start quest demo action */
  onStartQuest: () => Promise<{ success: boolean; message?: string }>;
  /** Callback for start wood gathering action */
  onStartWoodGathering: () => Promise<{ success: boolean; message?: string }>;
  /** Callback for start repeatable gold quest action */
  onStartRepeatableQuest: () => Promise<{ success: boolean; message?: string }>;
  /** Callback for start dangerous quest action */
  onStartDangerousQuest: () => Promise<{ success: boolean; message?: string }>;
  /** Current status message to display */
  statusMessage?: string;
  /** Whether actions are currently disabled (e.g., during processing) */
  disabled?: boolean;
  /** UI config for styling (required) */
  uiConfig: MinimalUIConfig;
}

export default function ActionToolbar({
  actionPanel,
  onBuyFood,
  onStartQuest,
  onStartWoodGathering,
  onStartRepeatableQuest,
  onStartDangerousQuest,
  statusMessage,
  disabled = false,
  uiConfig,
}: ActionToolbarProps): JSX.Element {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<'buyFood' | 'startQuest' | 'startWoodGathering' | 'startRepeatableQuest' | 'startDangerousQuest' | null>(null);
  const styleLabTokens = useMinimalStyleLabTokens(uiConfig);

  const handleBuyFood = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction('buyFood');
    try {
      await onBuyFood();
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleStartQuest = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction('startQuest');
    try {
      await onStartQuest();
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleStartWoodGathering = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction('startWoodGathering');
    try {
      await onStartWoodGathering();
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleStartRepeatableQuest = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction('startRepeatableQuest');
    try {
      await onStartRepeatableQuest();
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleStartDangerousQuest = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setCurrentAction('startDangerousQuest');
    try {
      await onStartDangerousQuest();
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const isDisabled = disabled || isProcessing;
  const isBuyFoodDisabled = isDisabled || currentAction === 'startQuest';
  const isStartQuestDisabled = isDisabled || currentAction === 'buyFood';
  const processingLabel = 'Elaborazione...';

  return (
    <StyleLabSurface variant="toolbar" style={styleLabTokens.cssVars}>
      <StyleLabStack direction="horizontal" align="center" justify="between" spacing="md">
        {/* Buy Food Button */}
        <button
          type="button"
          onClick={handleBuyFood}
          disabled={isBuyFoodDisabled}
          className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.35em] transition-all"
          style={{
            borderColor: isBuyFoodDisabled ? 'var(--minimal-panel-border)' : styleLabTokens.accentColor,
            backgroundColor: isBuyFoodDisabled ? 'var(--minimal-card-surface)' : styleLabTokens.accentColor,
            color: isBuyFoodDisabled ? 'var(--minimal-text-muted)' : 'var(--minimal-text-primary)',
            borderWidth: '1px',
            opacity: isBuyFoodDisabled ? 0.6 : 1,
            cursor: isBuyFoodDisabled ? 'not-allowed' : 'pointer',
          }}
          title={actionPanel.buyFood.tooltip}
          aria-label={`${actionPanel.buyFood.label}: ${actionPanel.buyFood.tooltip}`}
        >
          <span className="mr-2">{actionPanel.buyFood.iconToken}</span>
          {actionPanel.buyFood.label}
          {currentAction === 'buyFood' && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block animate-spin">
                ⏳
              </span>
              <span className="sr-only">{processingLabel}</span>
            </span>
          )}
        </button>

        {/* Start Quest Demo Button */}
        <button
          type="button"
          onClick={handleStartQuest}
          disabled={isStartQuestDisabled}
          className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.35em] transition-all"
          style={{
            borderColor: isStartQuestDisabled ? 'var(--minimal-panel-border)' : styleLabTokens.accentColor,
            backgroundColor: isStartQuestDisabled ? 'var(--minimal-card-surface)' : styleLabTokens.accentColor,
            color: isStartQuestDisabled ? 'var(--minimal-text-muted)' : 'var(--minimal-text-primary)',
            borderWidth: '1px',
            opacity: isStartQuestDisabled ? 0.6 : 1,
            cursor: isStartQuestDisabled ? 'not-allowed' : 'pointer',
          }}
          title={actionPanel.startQuestDemo.tooltip}
          aria-label={`${actionPanel.startQuestDemo.label}: ${actionPanel.startQuestDemo.tooltip}`}
        >
          <span className="mr-2">{actionPanel.startQuestDemo.iconToken}</span>
          {actionPanel.startQuestDemo.label}
          {currentAction === 'startQuest' && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block animate-spin">
                ?
              </span>
              <span className="sr-only">{processingLabel}</span>
            </span>
          )}
        </button>

        {/* Wood Gathering Button - Stable Job */}
        <button
          type="button"
          onClick={handleStartWoodGathering}
          disabled={isDisabled}
          className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.35em] transition-all"
          style={{
            borderColor: isDisabled ? 'var(--minimal-panel-border)' : '#10b981',
            backgroundColor: isDisabled ? 'var(--minimal-card-surface)' : '#10b981',
            color: isDisabled ? 'var(--minimal-text-muted)' : 'white',
            borderWidth: '1px',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
          title="Start stable wood gathering job - low risk, repeatable"
          aria-label="Start stable wood gathering job"
        >
          <span className="mr-2"> </span>
          Wood Job
          {currentAction === 'startWoodGathering' && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block animate-spin">
                ?
              </span>
              <span className="sr-only">{processingLabel}</span>
            </span>
          )}
        </button>

        {/* Repeatable Gold Quest Button */}
        <button
          type="button"
          onClick={handleStartRepeatableQuest}
          disabled={isDisabled}
          className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.35em] transition-all"
          style={{
            borderColor: isDisabled ? 'var(--minimal-panel-border)' : '#3b82f6',
            backgroundColor: isDisabled ? 'var(--minimal-card-surface)' : '#3b82f6',
            color: isDisabled ? 'var(--minimal-text-muted)' : 'white',
            borderWidth: '1px',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
          title="Start repeatable gold quest - always available, moderate risk"
          aria-label="Start repeatable gold quest"
        >
          <span className="mr-2"> </span>
          Gold Quest
          {currentAction === 'startRepeatableQuest' && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block animate-spin">
                ?
              </span>
              <span className="sr-only">{processingLabel}</span>
            </span>
          )}
        </button>

        {/* Dangerous Quest Button */}
        <button
          type="button"
          onClick={handleStartDangerousQuest}
          disabled={isDisabled}
          className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.35em] transition-all"
          style={{
            borderColor: isDisabled ? 'var(--minimal-panel-border)' : '#ef4444',
            backgroundColor: isDisabled ? 'var(--minimal-card-surface)' : '#ef4444',
            color: isDisabled ? 'var(--minimal-text-muted)' : 'white',
            borderWidth: '1px',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
          title="Start dangerous quest - high risk, high rewards"
          aria-label="Start dangerous quest"
        >
          <span className="mr-2"> </span>
          Dangerous
          {currentAction === 'startDangerousQuest' && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block animate-spin">
                ?
              </span>
              <span className="sr-only">{processingLabel}</span>
            </span>
          )}
        </button>

        {/* Status Message */}
        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="text-xs px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--minimal-card-highlight)',
              color: 'var(--minimal-text-secondary)',
              border: `1px solid var(--minimal-panel-border)`
            }}
          >
            {statusMessage}
          </div>
        )}
      </StyleLabStack>
    </StyleLabSurface>
  );
}
