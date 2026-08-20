import {
  SlottedMedalKitShell,
  useSlottedMedalKitData,
  SlottedMedal,
} from '@/ui/idleVillage/frozen/kits/slottedMedalKit';

export default function MinimalSlottedMedalPage() {
  return (
    <SlottedMedalKitShell>
      <PageInner />
    </SlottedMedalKitShell>
  );
}

function PageInner() {
  const props = useSlottedMedalKitData();

  return (
    <div data-testid="minimal-slottedmedal-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
      <div className="mx-auto max-w-md space-y-8">
        <header>
          <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · SlottedMedal</p>
          <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">SLOTTED MEDAL ISOLATED</h1>
          <p className="mt-1 text-sm text-slate-400">Route: /minimal-slottedmedal</p>
        </header>

        <div className="flex items-center justify-center py-12">
          <SlottedMedal {...props} />
        </div>
      </div>
    </div>
  );
}
