import { ActionCard } from '@/ui/idleVillage/map/actionCards/ActionCard';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

export default function MinimalQuestCardPage() {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-questcard-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-4xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · QuestCard</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">QUEST CARD ISOLATED</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-questcard</p>
            </header>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">In Progress</p>
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
                  dataTestId="quest-card"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Offer Countdown</p>
                <ActionCard
                  label="Dragon's Lair"
                  icon="🐉"
                  subtitle="Legendary quest"
                  helperText="Time-limited offer"
                  progressFraction={0}
                  elapsedSeconds={0}
                  totalDurationSeconds={300}
                  isPlaying={false}
                  variant="amethyst"
                  injuryPercentage={40}
                  deathPercentage={15}
                  dataTestId="quest-card"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Complete</p>
                <ActionCard
                  label="Lost Artifact"
                  icon="📿"
                  subtitle="Exploration"
                  helperText="Quest complete"
                  progressFraction={1}
                  elapsedSeconds={120}
                  totalDurationSeconds={120}
                  isPlaying={false}
                  variant="amethyst"
                  dataTestId="quest-card"
                />
              </div>
            </div>
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
