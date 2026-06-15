import { SkillCheckComponent } from '@/ui/idleVillage/frozen/kits/skillCheckKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

export default function MinimalSkillCheckPage() {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-skillcheck-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-2xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · SkillCheck</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">SKILL CHECK ISOLATED</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-skillcheck</p>
            </header>

            <div className="rounded-3xl border border-slate-800/60 bg-black/40 p-6">
              <SkillCheckComponent
                dcTarget={14}
                residentSkill={8}
                activityName="Goblin Raid"
                autoStart={true}
                onComplete={(result) => {
                  console.log('Skill check result:', result);
                }}
              />
            </div>
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
