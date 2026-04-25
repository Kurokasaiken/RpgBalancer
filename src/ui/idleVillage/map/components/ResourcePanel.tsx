import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ResourcePanelProps {
  items: { label: string; value: number | string; accentClass: string; borderClass: string }[];
  className?: string;
  headerLabel?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const slugifyLabel = (label: string) => label.trim().toLowerCase().replace(/\s+/g, '-');

export function ResourcePanel({
  items,
  className,
  headerLabel = 'Resources',
  collapsible = true,
  defaultCollapsed = false,
}: ResourcePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/30 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur ${
        className ?? ''
      }`}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-slate-400">
        <span>{headerLabel}</span>
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 transition hover:border-amber-300/70 hover:text-amber-200"
            aria-label={isCollapsed ? 'Mostra pannello risorse' : 'Nascondi pannello risorse'}
            aria-pressed={!isCollapsed}
          >
            {isCollapsed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border bg-(--panel-surface,rgba(5,6,12,0.8)) px-3 py-2.5 text-center shadow-inner shadow-black/30 ${item.borderClass}`}
              data-testid={`resource-tile-${slugifyLabel(item.label)}`}
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">{item.label}</p>
              <p className={`mt-1 text-sm font-semibold tracking-[0.25em] ${item.accentClass}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
