import { DayNightTimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

/**
 * /minimal-clock — canonical time engine page.
 *
 * The clock UI, day/night cycle, play/pause and keyboard control are all
 * encapsulated in `DayNightTimeEngineStrip`. Mounting the strip starts the
 * canonical tick loop; no page-level timer is needed.
 */
export default function MinimalClockPage() {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-clock-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-5xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Clock + Day/Night</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">CLOCK & DAY/NIGHT ISOLATED</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-clock</p>
            </header>

            <DayNightTimeEngineStrip compact />
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
