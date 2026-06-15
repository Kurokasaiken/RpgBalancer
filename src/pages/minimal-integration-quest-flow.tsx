import { useState } from 'react';
import { ActionCard } from '@/ui/idleVillage/map/actionCards/ActionCard';
import { SkillCheckComponent } from '@/ui/idleVillage/frozen/kits/skillCheckKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

export default function MinimalIntegrationQuestFlowPage() {
  const [phase, setPhase] = useState<'quest' | 'skillcheck' | 'outcome'>('quest');

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="integration-quest-flow-root" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-4xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Integration · Quest Flow</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">QUEST FLOW INTEGRATION</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-integration-quest-flow</p>
            </header>

            <div className="flex gap-3">
              {(['quest', 'skillcheck', 'outcome'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.3em] ${
                    phase === p
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                      : 'border-slate-500/60 bg-black/30 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {phase === 'quest' && (
              <div className="space-y-4">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Quest Card (click medallion to start skill check)</p>
                <ActionCard
                  label="Goblin Raid"
                  icon="🗡️"
                  subtitle="Combat quest"
                  helperText="Defeat the goblin raiders"
                  progressFraction={0.45}
                  elapsedSeconds={90}
                  totalDurationSeconds={200}
                  isPlaying={true}
                  variant="amethyst"
                  injuryPercentage={25}
                  deathPercentage={8}
                  onToggle={() => setPhase('skillcheck')}
                  dataTestId="quest-card"
                />
              </div>
            )}

            {phase === 'skillcheck' && (
              <div className="space-y-4">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Skill Check</p>
                <SkillCheckComponent
                  dcTarget={14}
                  residentSkill={8}
                  activityName="Goblin Raid"
                  autoStart={true}
                  onComplete={(result) => {
                    console.log('SkillCheck result:', result);
                    setPhase('outcome');
                  }}
                />
              </div>
            )}

            {phase === 'outcome' && (
              <div className="rounded-3xl border border-slate-800/60 bg-black/40 p-8 text-center">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Outcome</p>
                <p className="mt-4 text-xl text-amber-100">Outcome Modal non ancora implementato</p>
                <button
                  onClick={() => setPhase('quest')}
                  className="mt-6 rounded-full border border-amber-400/60 bg-amber-500/10 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-amber-100 hover:bg-amber-500/20"
                >
                  Ricomincia
                </button>
              </div>
            )}
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
