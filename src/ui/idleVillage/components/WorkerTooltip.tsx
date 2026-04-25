import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWorkerTooltipData, useWorkerBioConfig } from '@/ui/idleVillage/hooks/useWorkerTooltipData';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useLocalization } from '@/hooks/useLocalization';
import clsx from 'clsx';
import { StatModifierDisplay } from '@/ui/styleLab/components/StatModifierDisplay';
import { useModifierVisualization } from '@/ui/idleVillage/hooks/useModifierVisualization';

/**
 * Props for WorkerTooltip component
 */
export interface WorkerTooltipProps {
  /** Resident data to display */
  resident: ResidentState;
  /** Whether the tooltip is visible */
  isVisible: boolean;
  /** Position coordinates for the tooltip */
  x: number;
  y: number;
  /** Callback when tooltip should close */
  onClose: () => void;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Tooltip component showing worker bio, stats, and recommendations
 * Uses portal for proper z-index layering
 */
const WorkerTooltip: React.FC<WorkerTooltipProps> = ({
  resident,
  isVisible,
  x,
  y,
  onClose,
  testId = 'worker-tooltip',
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipData = useWorkerTooltipData(resident);
  const bioConfig = useWorkerBioConfig(resident.id);
  const { workerTooltip, format } = useLocalization();
  const tooltipLabels = workerTooltip?.labels ?? {};
  const accessibilityCopy = workerTooltip?.accessibility ?? {};
  const riskLevelCopy = workerTooltip?.riskLevels ?? {};
  const recommendationsLabel = tooltipLabels.recommendations ?? 'Recommendations';
  const { entries: workerModifiers, isLoading: workerModifiersLoading } = useModifierVisualization('workerPanel', {
    entityId: resident.id,
    maxEntries: 4,
  });

  // Close tooltip on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  // Adjust position to keep tooltip in viewport
  const adjustedPosition = React.useMemo(() => {
    const tooltipWidth = 320; // Approximate width
    const tooltipHeight = 200; // Approximate height
    const padding = 8;

    let adjustedX = x;
    let adjustedY = y;

    // Keep within viewport bounds
    if (x + tooltipWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - tooltipWidth - padding;
    }
    if (y + tooltipHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - tooltipHeight - padding;
    }
    if (x < padding) adjustedX = padding;
    if (y < padding) adjustedY = padding;

    return { x: adjustedX, y: adjustedY };
  }, [x, y]);

  if (!isVisible) return null;

  const riskLevelColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  const riskLevelBgColors = {
    low: 'bg-green-900/30',
    medium: 'bg-yellow-900/30',
    high: 'bg-orange-900/30',
    critical: 'bg-red-900/30',
  };

  const hpPercent = (tooltipData.hp / tooltipData.maxHp) * 100;
  const fatiguePercent = tooltipData.fatigue;

  // TODO(style-lab-materials): replace hardcoded palette with Style Lab material tokens
  // (noise texture, bevel, tooltip hierarchy oro→neutro→stat→flavor) e applicare fade-in 75ms +
  // backdrop blur modulare. Agganciare audio hover/open tramite materialAudio.
  const tooltipContent = (
    <div
      ref={tooltipRef}
      data-testid={testId}
      className={clsx(
        'fixed z-50 w-80 rounded-lg border border-slate-600/60 bg-black/90 p-4 shadow-[0_22px_55px_rgba(0,0,0,0.55)] backdrop-blur-md',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50'
      )}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        maxHeight: '300px',
        overflowY: 'auto',
      }}
      role="tooltip"
      aria-label={format(accessibilityCopy.tooltipDetails ?? '{name} - Worker details', {
        name: tooltipData.name,
      })}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-100">{tooltipData.name}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50 rounded p-1"
          aria-label="Close tooltip"
        >
          ✕
        </button>
      </div>

      {/* Status and Risk Level */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-300">{tooltipData.status}</span>
        <span className={clsx(
          'text-xs font-semibold uppercase tracking-[0.2em] px-2 py-1 rounded',
          riskLevelBgColors[tooltipData.riskLevel],
          riskLevelColors[tooltipData.riskLevel]
        )}
        aria-label={format(accessibilityCopy.riskBadge ?? '{level} status', {
          level: riskLevelCopy[tooltipData.riskLevel] ?? tooltipData.riskLevel,
        })}
        >
          {riskLevelCopy[tooltipData.riskLevel] ?? tooltipData.riskLevel}
        </span>
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{tooltipLabels.hp ?? 'HP'}</span>
          <span>{tooltipData.hp}/{tooltipData.maxHp}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-300',
              hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Fatigue Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{tooltipLabels.fatigue ?? 'Fatigue'}</span>
          <span>{tooltipData.fatigue}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-300',
              fatiguePercent < 50 ? 'bg-blue-500' : fatiguePercent < 75 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${fatiguePercent}%` }}
          />
        </div>
      </div>

      {/* Performance Score */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{tooltipLabels.performance ?? 'Performance'}</span>
          <span>{tooltipData.performanceScore}/100</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${tooltipData.performanceScore}%` }}
          />
        </div>
      </div>

      {/* Stat Tags */}
      {tooltipData.statTags && tooltipData.statTags.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-400 mb-1">
            {tooltipLabels.specialties ?? 'Specialties'}
          </h4>
          <div className="flex flex-wrap gap-1">
            {tooltipData.statTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {bioConfig && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-400 mb-1">
            {tooltipLabels.bio ?? 'Bio'}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {bioConfig.shortBio}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {tooltipData.recommendations.length > 0 && (
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-slate-400 mb-1">{recommendationsLabel}</h4>
          <ul className="text-xs text-slate-300 space-y-1">
            {tooltipData.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-400 mr-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(workerModifiersLoading || workerModifiers.length > 0) && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-400 mb-1">Modifier preview</h4>
          <StatModifierDisplay
            modifierEntries={workerModifiers}
            isLoading={workerModifiersLoading}
            showHeader={false}
            maxVisible={4}
            emptyLabel="Nessun modificatore attivo su questo residente"
            testId={`worker-${resident.id}-modifier-display`}
          />
        </div>
      )}

      {/* Quote */}
      {bioConfig?.quotes && bioConfig.quotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <blockquote className="text-xs text-slate-400 italic">
            "{bioConfig.quotes[0]}"
          </blockquote>
        </div>
      )}
    </div>
  );

  return createPortal(tooltipContent, document.body);
};

export default WorkerTooltip;
