import React from 'react';
import { CardWrapper } from '../../components/CardWrapper';
import { PARAM_DEFINITIONS } from '../../../balancing/registry';
import type {
  ScenarioConfig,
  ScenarioType,
  ScenarioStatKey,
} from '../../../balancing/contextWeights';

interface ScenarioCardProps {
  config: ScenarioConfig;
  onConfigChange: (type: ScenarioType, updates: Partial<ScenarioConfig>) => void;
  onReset?: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  config,
  onConfigChange,
  onReset,
}) => {
  return (
    <CardWrapper
      title={`${config.icon} ${config.name}`}
      color="text-cyan-300"
      onReset={onReset}
    >
      <div className="space-y-3 text-[11px]">
        <div className="rounded-lg border border-cyan-900/50 bg-slate-900/70 px-3 py-2">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Parametri scenario
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Turni attesi
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={config.expectedTurns}
              onChange={(e) =>
                onConfigChange(config.type, {
                  expectedTurns: Number(e.target.value) || 1,
                })
              }
              className="w-full accent-cyan-400"
            />
            <div className="mt-0.5 text-[10px] font-mono text-cyan-200">
              {config.expectedTurns} turni
            </div>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Numero nemici
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.enemyCount}
                onChange={(e) =>
                  onConfigChange(config.type, {
                    enemyCount: Number(e.target.value) || 1,
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-cyan-100 outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">
                HP medi nemici
              </label>
              <input
                type="number"
                min={10}
                max={5000}
                step={10}
                value={config.enemyAvgHP}
                onChange={(e) =>
                  onConfigChange(config.type, {
                    enemyAvgHP: Number(e.target.value) || 10,
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-cyan-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Efficacia stat
          </div>
          <div className="space-y-1.5">
            {config.relevantStats.map((statKey) => {
              const effectiveness = config.statEffectiveness[statKey] ?? 1;
              const def = PARAM_DEFINITIONS[statKey as string];
              const label = def?.name ?? statKey;

              let strengthClass = 'text-slate-300';
              if (effectiveness > 1.5) strengthClass = 'text-emerald-300';
              else if (effectiveness > 1.0) strengthClass = 'text-amber-300';
              else if (effectiveness < 0.5) strengthClass = 'text-red-300';

              return (
                <div
                  key={statKey as string}
                  className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5"
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <div className="truncate text-[11px] font-medium text-slate-200">
                      {label}
                    </div>
                    <div className={`text-[11px] font-mono ${strengthClass}`}>
                      {effectiveness.toFixed(1)}x
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={effectiveness}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      const next = {
                        ...config.statEffectiveness,
                        [statKey as ScenarioStatKey]: value,
                      };
                      onConfigChange(config.type, {
                        statEffectiveness: next,
                      });
                    }}
                    className="w-full accent-cyan-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};
