/**
 * Quest Detail Lens Component
 * 
 * Retro-styled overlay that shows detailed quest information when
 * selecting mini-cards from the HUD. Integrates with QuestTelemetry
 * data and includes keyboard navigation.
 * 
 * @since IV-Phase12-quest-detail-lens
 * @author Aurora-Quest
 */

import React from 'react';
import clsx from 'clsx';
import { useQuestLensState } from '@/ui/idleVillage/hooks/useQuestLensState';
import QuestRiskDisplay from './QuestRiskDisplay';
import type { QuestDetailLensProps } from '@/ui/idleVillage/components/types';

/**
 * Quest Detail Lens Component
 * 
 * Renders a retro-styled overlay with quest details, risk assessment,
 * and navigation controls. Uses Gilded Observatory theme with terminal
 * aesthetics and full keyboard navigation support.
 * 
 * @param props - Component props
 * @returns Quest detail lens overlay component
 */
export const QuestDetailLens: React.FC<QuestDetailLensProps> = ({
  className,
  testMode = false,
  onClose,
  onRiskStripeClick,
}) => {
  const {
    isOpen,
    selectedQuestId,
    questResult,
    isLoading,
    error,
    navigationIndex,
    totalRecentQuests,
    canNavigatePrevious,
    canNavigateNext,
    closeLens,
    navigatePrevious,
    navigateNext,
  } = useQuestLensState({
    enableKeyboardNavigation: true,
    enableTelemetry: true,
  });

  /**
   * Handle close with optional callback
   */
  const handleClose = () => {
    closeLens();
    onClose?.();
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        navigatePrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        navigateNext();
        break;
      default:
        break;
    }
  };

  /**
   * Handle overlay click to close
   */
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  /**
   * Risk stripe click handler
   */
  const handleRiskStripeClick = (type: 'injury' | 'death', percentage: number) => {
    onRiskStripeClick?.(type, percentage);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/80 backdrop-blur-sm',
        'transition-opacity duration-200',
        className
      )}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-lens-title"
      aria-describedby="quest-lens-description"
    >
      <div
        className={clsx(
          'relative w-full max-w-2xl mx-4',
          'bg-slate-900 border border-slate-700 rounded-lg',
          'shadow-2xl shadow-black/50',
          'transition-transform duration-200 scale-100',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
          testMode && 'test-mode'
        )}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <h2
              id="quest-lens-title"
              className="text-lg font-mono text-amber-400 font-bold"
            >
              QUEST DETAIL LENS
            </h2>
            {selectedQuestId && (
              <span className="text-xs font-mono text-slate-400">
                ID: {selectedQuestId}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
            aria-label="Close quest lens"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-slate-400 font-mono">Loading quest data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 font-mono mb-2">ERROR</div>
              <div className="text-slate-400 text-sm">{error}</div>
            </div>
          ) : questResult ? (
            <div className="space-y-4">
              {/* Quest Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 font-mono">STATUS:</span>
                  <span className={clsx(
                    'ml-2 font-mono font-bold',
                    questResult.success ? 'text-green-400' : 'text-red-400'
                  )}>
                    {questResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">DURATION:</span>
                  <span className="ml-2 text-amber-400 font-mono">
                    {questResult.durationSeconds}s
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">PHASES:</span>
                  <span className="ml-2 text-amber-400 font-mono">
                    {questResult.completedPhases}/{questResult.totalPhases}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">BRANCHES:</span>
                  <span className="ml-2 text-amber-400 font-mono">
                    {questResult.branchDecisions.length}
                  </span>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-mono text-amber-400 mb-3">RISK ASSESSMENT</h3>
                <QuestRiskDisplay
                  questId={selectedQuestId!}
                  injuryPercentage={15.5} // Mock data - would come from quest analysis
                  deathPercentage={8.2}   // Mock data - would come from quest analysis
                  testMode={testMode}
                  showLabels={true}
                  onStripeClick={handleRiskStripeClick}
                  className="max-w-xs mx-auto"
                />
              </div>

              {/* Branch History */}
              {questResult.branchDecisions.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-mono text-amber-400 mb-3">BRANCH HISTORY</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {questResult.branchDecisions.map((decision, index) => (
                      <div key={index} className="text-xs font-mono text-slate-400">
                        <span className="text-slate-500">PHASE {decision.phaseId}:</span>
                        {decision.choiceId && (
                          <span className="ml-2">Choice: {decision.choiceId}</span>
                        )}
                        {decision.conditionId && (
                          <span className="ml-2">Condition: {decision.conditionId}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Effects Applied */}
              {questResult.finalEffects.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-mono text-amber-400 mb-3">EFFECTS APPLIED</h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {questResult.finalEffects.map((effect, index) => (
                      <div key={index} className="text-xs font-mono text-slate-400">
                        <span className="text-slate-500">{effect.type}:</span>
                        <span className="ml-2">{JSON.stringify(effect)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No quest data available
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        {totalRecentQuests > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <button
              onClick={navigatePrevious}
              disabled={!canNavigatePrevious}
              className={clsx(
                'px-3 py-1 text-xs font-mono rounded transition-colors',
                canNavigatePrevious
                  ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              )}
              aria-label="Previous quest"
            >
              ← PREV
            </button>
            
            <div className="text-xs font-mono text-slate-500">
              {navigationIndex + 1} / {totalRecentQuests}
            </div>
            
            <button
              onClick={navigateNext}
              disabled={!canNavigateNext}
              className={clsx(
                'px-3 py-1 text-xs font-mono rounded transition-colors',
                canNavigateNext
                  ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              )}
              aria-label="Next quest"
            >
              NEXT →
            </button>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-600 font-mono">
          <div>ESC: Close</div>
          <div>← →: Navigate</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Default export for convenience
 */
export default QuestDetailLens;
