import React from 'react';
import type { HudEntry } from '@/ui/idleVillage/selectors/useHudSelectors';
import ActivityActionCard from '@/ui/idleVillage/components/ActivityActionCard';
import { ActionCardWrapper } from '@/ui/idleVillage/components/ActionCardWrapper';
import { deriveTheaterRiskStripes } from '@/ui/idleVillage/theater/riskStripes';

interface ActiveActivityHUDProps {
  hudEntries: HudEntry[];
  onResolve?: (scheduledId: string) => void;
  className?: string;
  // Props for ActionCardWrapper quando V2 è abilitato
  config?: any;
  residents?: any;
}

/**
 * Observatory HUD displaying currently active scheduled activities with shared cards.
 */
export const ActiveActivityHUD: React.FC<ActiveActivityHUDProps> = ({
  hudEntries,
  onResolve,
  className = '',
  config,
  residents,
}) => {

  return (
    <aside
      data-testid="active-hud"
      className={[
        'pointer-events-auto w-72 max-w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Active activities HUD"
    >
      <div className="rounded-3xl border border-amber-400/40 bg-black/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur">
        <header className="mb-3 flex items-center justify-between">
          <div> 
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">Active HUD</div>
            <div className="text-sm font-semibold text-ivory">Monitoraggio attività</div>
          </div>
          <div className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
            {hudEntries.length}
          </div>
        </header>

        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          {hudEntries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-3 py-4 text-center text-[11px] text-slate-400">
              Nessuna attività in corso.
            </div>
          )}

          {hudEntries.map(({ scheduled, summary, variant }) => {
            const handleClick = () => {
              if (scheduled.status === 'completed') {
                onResolve?.(scheduled.id);
              }
            };

            // Determine heroic feedback for quest activities
            const heroicFeedback = (() => {
              if (!summary.isQuest || scheduled.status !== 'completed') return undefined;

              // Check if this activity had death risk and survivors exist
              const hasDeathRisk = scheduled.snapshotDeathRisk > 0;

              // Check if assigned residents survived (simplified: check if they still exist in state)
              const survivorsExist = scheduled.characterIds.length > 0;

              if (hasDeathRisk && survivorsExist) {
                return {
                  showBadge: true,
                  label: 'Heroic',
                };
              }

              return undefined;
            })();

            return (
              <>
                {config && residents ? (
                  <ActionCardWrapper
                    key={scheduled.id}
                    activity={summary.activity}
                    scheduled={scheduled}
                    config={config}
                    residents={residents}
                    onCollect={handleClick}
                    dataTestId={`active-hud-${scheduled.id}`}
                  />
                ) : (
                  <ActivityActionCard
                    key={scheduled.id}
                    slotId={summary.slotId ?? summary.key}
                    label={summary.label}
                    helperText={summary.kindLabel}
                    icon={summary.icon}
                    visualVariant={variant}
                    assignedResidentName={summary.assigneeNames?.[0] ?? null}
                    progressFraction={summary.progressFraction}
                    elapsedSeconds={summary.elapsedSeconds}
                    totalDurationSeconds={summary.totalDurationSeconds}
                    variant="detail"
                    ctaLabel={scheduled.status === 'completed' ? 'Raccogli' : undefined}
                    onClick={handleClick}
                    riskPercentages={{
                      injury: summary.injuryPercentage ?? 0,
                      death: summary.deathPercentage ?? 0,
                    }}
                    riskStripeMetrics={
                      summary.riskStripeMetrics ??
                      deriveTheaterRiskStripes({
                        injuryPercentage: summary.injuryPercentage ?? 0,
                        deathPercentage: summary.deathPercentage ?? 0,
                      })
                    }
                    heroicFeedback={heroicFeedback}
                  />
                )}
              </>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default ActiveActivityHUD;
