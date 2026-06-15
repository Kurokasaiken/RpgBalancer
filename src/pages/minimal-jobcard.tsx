import { ActionCard } from '@/ui/idleVillage/map/actionCards/ActionCard';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

export default function MinimalJobCardPage() {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-jobcard-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-4xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · JobCard</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">JOB CARD ISOLATED</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-jobcard</p>
            </header>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">In Progress</p>
                <ActionCard
                  label="Gather Wood"
                  icon="🪓"
                  subtitle="Daily activity"
                  helperText="Assign a resident to gather wood"
                  progressFraction={0.35}
                  elapsedSeconds={42}
                  totalDurationSeconds={120}
                  isPlaying={true}
                  variant="jade"
                  dataTestId="job-card"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Idle</p>
                <ActionCard
                  label="Guard Walls"
                  icon="🛡️"
                  subtitle="Patrol activity"
                  helperText="Assign a resident to patrol"
                  progressFraction={0}
                  elapsedSeconds={0}
                  totalDurationSeconds={240}
                  isPlaying={false}
                  variant="jade"
                  dataTestId="job-card"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Complete</p>
                <ActionCard
                  label="Forge Sword"
                  icon="🗡️"
                  subtitle="Crafting"
                  helperText="Smithing complete"
                  progressFraction={1}
                  elapsedSeconds={180}
                  totalDurationSeconds={180}
                  isPlaying={false}
                  variant="jade"
                  dataTestId="job-card"
                />
              </div>
            </div>
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
