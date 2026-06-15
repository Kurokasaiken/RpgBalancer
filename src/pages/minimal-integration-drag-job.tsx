import { ActionCard } from '@/ui/idleVillage/map/actionCards/ActionCard';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { DndContext } from '@dnd-kit/core';

export default function MinimalIntegrationDragJobPage() {
  const { residents } = useCanonicalRosterBundle();

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <DragProvider>
          <DndContext>
            <div data-testid="integration-drag-job-root" className="min-h-screen bg-slate-950 p-8 text-ivory">
              <div className="mx-auto max-w-6xl space-y-8">
                <header>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Integration · Drag Job</p>
                  <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">DRAG & DROP JOB INTEGRATION</h1>
                  <p className="mt-1 text-sm text-slate-400">Route: /minimal-integration-drag-job</p>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div>
                    <p className="mb-4 text-[9px] uppercase tracking-[0.3em] text-slate-500">Job Card</p>
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
                  <div>
                    <p className="mb-4 text-[9px] uppercase tracking-[0.3em] text-slate-500">Roster</p>
                    <VillageRosterSection residents={residents} componentId="drag-job-roster" />
                  </div>
                </div>
              </div>
            </div>
          </DndContext>
        </DragProvider>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
