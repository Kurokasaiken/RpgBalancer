import { ResourcePanel, useResourceHudKitData } from '@/ui/idleVillage/frozen/kits/resourceHudKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import type { ResourcePanelItem } from '@/ui/idleVillage/components/ResourcePanel';

const ITEMS: ResourcePanelItem[] = [
  { id: 'gold', label: 'Gold', icon: '🪙', value: 1250, delta: 12 },
  { id: 'wood', label: 'Wood', icon: '🪵', value: 3400, delta: -5 },
  { id: 'food', label: 'Food', icon: '🌾', value: 5120, delta: 8 },
  { id: 'iron', label: 'Iron', icon: '⛏️', value: 840, delta: 3 },
];

export default function MinimalResourceHUDPage() {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-resourcehud-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-3xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · ResourceHUD</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">RESOURCE HUD ISOLATED</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-resourcehud</p>
            </header>

            <div className="rounded-3xl border border-slate-800/60 bg-black/40 p-6">
              <ResourcePanel title="Village Resources" items={ITEMS} />
            </div>
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
