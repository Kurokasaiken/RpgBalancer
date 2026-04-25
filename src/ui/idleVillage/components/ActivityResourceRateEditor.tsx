import type { ResourceDefinition, ResourceRateDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Props for {@link ActivityResourceRateEditor}.
 */
interface ActivityResourceRateEditorProps {
  title: string;
  placeholder?: string;
  resources: ResourceDefinition[];
  rates: ResourceRateDefinition[];
  onChange: (next: ResourceRateDefinition[]) => void;
}

/**
 * Parses a numeric input string and ensures it always returns a finite number.
 */
const toSafeNumber = (value: string): number => {
  if (value.trim() === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Config-driven editor that allows authors to define per-day resource ticks for an activity.
 */
export default function ActivityResourceRateEditor({
  title,
  placeholder,
  resources,
  rates,
  onChange,
}: ActivityResourceRateEditorProps) {
  const handleUpdate = (index: number, updates: Partial<ResourceRateDefinition>) => {
    const next = rates.map((rate, rateIndex) => {
      if (rateIndex !== index) return rate;
      return {
        resourceId: updates.resourceId ?? rate.resourceId,
        amountPerDay:
          typeof updates.amountPerDay === 'number' ? updates.amountPerDay : rate.amountPerDay,
      };
    });
    onChange(next);
  };

  const handleAdd = () => {
    if (resources.length === 0) return;
    const fallbackResource = resources[0]?.id ?? 'gold';
    onChange([
      ...rates,
      {
        resourceId: fallbackResource,
        amountPerDay: 0,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const next = rates.filter((_, rateIndex) => rateIndex !== index);
    onChange(next);
  };

  const hasResources = resources.length > 0;
  const body =
    !hasResources ? (
      <p className="text-[11px] text-slate-500">{placeholder ?? 'Configura almeno una risorsa per usare questo editor.'}</p>
    ) : rates.length === 0 ? (
      <div className="rounded border border-dashed border-slate-700/60 px-3 py-2 text-[11px] text-slate-400">
        Nessun tick configurato.
      </div>
    ) : (
      <div className="space-y-2">
        {rates.map((rate, index) => (
          <div
            key={`${rate.resourceId}-${index}`}
            className="flex items-center gap-2 rounded border border-slate-800/60 bg-slate-950/40 px-2 py-1.5 text-[12px]"
          >
            <select
              value={rate.resourceId}
              onChange={(event) => handleUpdate(index, { resourceId: event.target.value })}
              className="flex-1 rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-ivory"
            >
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.1"
              value={rate.amountPerDay}
              onChange={(event) => handleUpdate(index, { amountPerDay: toSafeNumber(event.target.value) })}
              className="w-28 rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-right text-ivory"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="rounded-full border border-slate-700 px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-300 transition hover:border-rose-300/70 hover:text-rose-200"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-200">{title}</p>
          <p className="text-[10px] text-slate-400">Valori in output per giorno di simulazione.</p>
        </div>
        <button
          type="button"
          disabled={!hasResources}
          onClick={handleAdd}
          className="rounded-full border border-slate-600 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-200 transition hover:border-emerald-300/70 hover:text-emerald-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
        >
          + Tick
        </button>
      </div>
      {body}
    </div>
  );
}
