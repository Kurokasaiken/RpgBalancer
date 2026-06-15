import { PgCardKitShell, usePgCardKitData, PgCard, residentToPgCardProps } from '@/ui/idleVillage/frozen/kits/pgcardKit';

export function MinimalPgCardPage() {
  const { allResidents } = usePgCardKitData();

  return (
    <PgCardKitShell>
      <div data-testid="minimal-pgcard-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
        <div className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · PgCard</p>
            <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">PG CARD ISOLATED</h1>
            <p className="mt-1 text-sm text-slate-400">Route: /minimal-pgcard</p>
          </header>

          <div className="flex flex-wrap gap-6">
            {allResidents.map((resident) => (
              <div key={resident.id} className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">{resident.id}</p>
                <PgCard {...residentToPgCardProps(resident)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PgCardKitShell>
  );
}

export default MinimalPgCardPage;
