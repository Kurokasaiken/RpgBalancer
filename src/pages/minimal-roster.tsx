import { MatericRosterComponent } from '@/ui/idleVillage/roster';

export default function MinimalRosterPage() {
  return (
    <div data-testid="minimal-roster-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Roster</p>
          <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">ROSTER ISOLATED</h1>
          <p className="mt-1 text-sm text-slate-400">Route: /minimal-roster</p>
        </header>

        <MatericRosterComponent componentId="minimal-roster-materic" />
      </div>
    </div>
  );
}
