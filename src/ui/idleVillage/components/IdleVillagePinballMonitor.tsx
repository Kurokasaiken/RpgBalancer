import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { PinballMonitorPanel } from '@/ui/altVisuals/components/PinballMonitorPanel';
import { usePinballMonitor } from '@/ui/altVisuals/hooks/usePinballMonitor';
import type { PinballAnimationSummary } from '@/ui/altVisuals/hooks/usePinballMonitor';

/**
 * Idle Village Alt Visual Pinball Monitor
 *
 * Integrates the Alt Visuals pinball monitor into the Idle Village context
 * with auto-launch functionality, config-first stats, and stuck prevention.
 */
export interface IdleVillagePinballMonitorProps {
  /** Whether the monitor is visible */
  visible?: boolean;
  /** Whether to auto-launch pinball animation */
  autoLaunch?: boolean;
  /** Whether to show config-first generated stats */
  showStats?: boolean;
  /** Custom title for the monitor */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component that displays pinball monitor stats in a compact format
 */
function PinballStatsDisplay({ summary, derived, config }: {
  summary: PinballAnimationSummary | null;
  derived: any;
  config?: any;
}) {
  // Config-first stats generation
  const generateStatsFromConfig = () => {
    if (!summary || !config) return null;

    const stats = {
      efficiency: summary.totalPillars > 0 ? (summary.enemyPillarsLanded + summary.playerPillarsLanded) / summary.totalPillars : 0,
      completionRate: summary.totalPillars > 0 ? ((summary.enemyPillarsLanded + summary.playerPillarsLanded) / (summary.totalPillars * 2)) * 100 : 0,
      activityLevel: summary.ballActive ? 1 : 0,
      responsiveness: derived?.timeSinceImpactMs ? Math.max(0, 1 - (derived.timeSinceImpactMs / 10000)) : 0,
    };

    return stats;
  };

  const configStats = generateStatsFromConfig();

  if (!summary) {
    return (
      <div className="text-center text-slate-400 text-sm">
        Waiting for pinball data...
      </div>
    );
  }

  const progressPercent = summary.totalPillars > 0
    ? ((summary.enemyPillarsLanded + summary.playerPillarsLanded) / (summary.totalPillars * 2)) * 100
    : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Pillar counts */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-center">
          <div className="text-amber-400 font-semibold">
            {summary.enemyPillarsLanded}/{summary.totalPillars}
          </div>
          <div className="text-slate-400 text-xs">Enemy Pillars</div>
        </div>
        <div className="text-center">
          <div className="text-emerald-400 font-semibold">
            {summary.playerPillarsLanded}/{summary.totalPillars}
          </div>
          <div className="text-slate-400 text-xs">Player Pillars</div>
        </div>
      </div>

      {/* Ball status */}
      <div className="text-center">
        <div className={clsx(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
          summary.ballActive
            ? "bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"
            : "bg-slate-700 text-slate-400"
        )}>
          <div className={clsx(
            "w-2 h-2 rounded-full mr-2",
            summary.ballActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
          )} />
          Ball {summary.ballActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Config-generated stats */}
      {configStats && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="text-blue-400 font-medium">
              {Math.round(configStats.efficiency * 100)}%
            </div>
            <div className="text-slate-500">Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-medium">
              {Math.round(configStats.responsiveness * 100)}%
            </div>
            <div className="text-slate-500">Responsive</div>
          </div>
        </div>
      )}

      {/* Runtime info */}
      {derived?.ballRuntimeMs && (
        <div className="text-center text-xs text-slate-500">
          Runtime: {Math.round(derived.ballRuntimeMs / 1000)}s
        </div>
      )}
    </div>
  );
}

/**
 * Main Idle Village Pinball Monitor component
 */
export function IdleVillagePinballMonitor({
  visible = true,
  autoLaunch = true,
  showStats = true,
  title = 'Alt Visual Monitor',
  className,
}: IdleVillagePinballMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pinballMonitor = usePinballMonitor({
    config: {
      enableAutoLaunch: autoLaunch,
      stuckPrevention: true,
      pollingIntervalMs: 1000,
    },
    enableCliDiagnostics: false,
  });

  const { summary, derived, status, lastRecovery, config: monitorConfig } = pinballMonitor;

  // Enhanced auto-launch functionality with visible pillars/ball
  useEffect(() => {
    if (autoLaunch && status === 'idle') {
      // Trigger auto-launch if bridge is available
      const bridge = (window as any).__ALT_VISUALS_PINBALL__;
      if (bridge?.autoLaunchBall) {
        console.log('[IdleVillagePinballMonitor] Auto-launching ball with visible pillars');
        bridge.autoLaunchBall();
      }
    }
  }, [autoLaunch, status]);

  // Enhanced stuck prevention with multiple recovery strategies
  useEffect(() => {
    if (derived?.flags?.ballStuck && pinballMonitor.forceBallRelaunch) {
      console.log('[IdleVillagePinballMonitor] Ball stuck detected, triggering recovery');
      pinballMonitor.forceBallRelaunch('auto_prevention');
    } else if (derived?.flags?.pillarStalled && pinballMonitor.forceSceneRelaunch) {
      console.log('[IdleVillagePinballMonitor] Pillar stall detected, relaunching scene');
      pinballMonitor.forceSceneRelaunch('auto_prevention');
    }
  }, [derived?.flags?.ballStuck, derived?.flags?.pillarStalled, pinballMonitor]);

  // Periodic health check to prevent v6 removal issues
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (status === 'waiting_bridge' && autoLaunch) {
        console.log('[IdleVillagePinballMonitor] Health check: bridge missing, attempting recovery');
        const bridge = (window as any).__ALT_VISUALS_PINBALL__;
        if (bridge?.autoLaunchBall) {
          bridge.autoLaunchBall();
        }
      }
    }, 5000);

    return () => clearInterval(healthCheck);
  }, [status, autoLaunch]);

  if (!visible) {
    return null;
  }

  return (
    <div className={clsx(
      "bg-slate-900/90 border border-slate-700 rounded-lg overflow-hidden",
      className
    )}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className={clsx(
            "w-3 h-3 rounded-full",
            status === 'monitoring' ? "bg-emerald-400" :
            status === 'recovering' ? "bg-amber-400" :
            status === 'error' ? "bg-red-400" : "bg-slate-500"
          )} />
          <h3 className="text-slate-200 font-medium text-sm">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {lastRecovery && (
            <span className="text-xs text-amber-400">
              Recovered {Math.round((Date.now() - lastRecovery.timestamp) / 1000)}s ago
            </span>
          )}
          <svg
            className={clsx(
              "w-4 h-4 text-slate-400 transition-transform",
              isExpanded ? "rotate-180" : ""
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Compact Stats View */}
      {showStats && !isExpanded && (
        <div className="px-3 pb-3">
          <PinballStatsDisplay summary={summary} derived={derived} config={monitorConfig} />
        </div>
      )}

      {/* Expanded Full Monitor */}
      {isExpanded && (
        <div className="border-t border-slate-700">
          <PinballMonitorPanel
            title="Idle Village · Alt Visuals Pinball Monitor"
            config={{
              enableAutoLaunch: autoLaunch,
              stuckPrevention: true,
              pollingIntervalMs: 1000,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default IdleVillagePinballMonitor;
