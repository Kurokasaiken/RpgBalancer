import {
  SlotRackKitShell,
  useSlotRackKitData,
  ResidentSlotRackSkin,
} from '@/ui/idleVillage/frozen/kits/slotRackKit';

export default function MinimalSlotRackPage() {
  const { slots } = useSlotRackKitData();

  return (
    <SlotRackKitShell>
      <div data-testid="minimal-slotrack-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
        <div className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · SlotRack</p>
            <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">SLOT RACK ISOLATED</h1>
            <p className="mt-1 text-sm text-slate-400">Route: /minimal-slotRack</p>
          </header>

          <ResidentSlotRackSkin
            slots={slots}
            layout="detail"
            slotSize={96}
            overflowBehavior="scroll"
            skinPresetId="slot_rack_materic"
          />
        </div>
      </div>
    </SlotRackKitShell>
  );
}
