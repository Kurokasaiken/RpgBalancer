import { useEffect, useState, useCallback } from 'react';
import { i18n } from '@/localization/i18n';
import { useLQA } from '@/localization/LQAContext';

interface LQAEntry {
  namespace: string;
  key: string;
  source: string;
  target: string;
  context: string;
  maxLength: number;
}

/**
 * Loads optional per-namespace metadata (context, maxLength) for a locale.
 */
async function loadMetadata(locale: string): Promise<Record<string, Record<string, { context?: string; maxLength?: number }>>> {
  const result: Record<string, Record<string, { context?: string; maxLength?: number }>> = {};
  try {
    const nsList = (i18n.options.ns ?? ['common']) as string[];
    await Promise.all(
      nsList.map(async (ns) => {
        try {
          const response = await fetch(`/locales/${locale}/${ns}.meta.json`);
          if (response.ok) {
            result[ns] = (await response.json()) as Record<string, { context?: string; maxLength?: number }>;
          }
        } catch {
          // Metadata is optional; missing meta is not an error.
        }
      }),
    );
  } catch {
    // Best-effort metadata loading.
  }
  return result;
}

function flattenResources(
  resources: Record<string, unknown>,
  namespace: string,
  prefix = '',
): LQAEntry[] {
  const entries: LQAEntry[] = [];
  for (const [k, v] of Object.entries(resources)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      entries.push({
        namespace,
        key,
        source: v,
        target: v,
        context: '',
        maxLength: 0,
      });
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      entries.push(...flattenResources(v as Record<string, unknown>, namespace, key));
    }
  }
  return entries;
}

function getValueAtKeyPath(obj: Record<string, unknown>, keyPath: string): unknown {
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function LQAOverlay() {
  const { enabled } = useLQA();
  const [entries, setEntries] = useState<LQAEntry[]>([]);
  const [selected, setSelected] = useState<LQAEntry | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    async function load() {
      const languages = i18n.languages.length ? i18n.languages : [i18n.language || 'en'];
      const targetLng = languages[0];
      const nsList = (i18n.options.ns ?? ['common']) as string[];
      const meta = await loadMetadata('en');

      const allEntries: LQAEntry[] = [];
      for (const ns of nsList) {
        const sourceBundle = i18n.getResourceBundle('en', ns) as Record<string, unknown> | undefined;
        const targetBundle = i18n.getResourceBundle(targetLng, ns) as Record<string, unknown> | undefined;
        if (!sourceBundle) continue;

        const sourceEntries = flattenResources(sourceBundle, ns);
        for (const entry of sourceEntries) {
          const targetValue = getValueAtKeyPath(targetBundle ?? {}, entry.key);
          const metaEntry = meta[ns]?.[entry.key];
          allEntries.push({
            ...entry,
            target: typeof targetValue === 'string' ? targetValue : entry.source,
            context: metaEntry?.context ?? '',
            maxLength: metaEntry?.maxLength ?? 0,
          });
        }
      }

      setEntries(allEntries);
    }

    void load();
  }, [enabled]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setHoverPos({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, handleMouseMove]);

  if (!enabled) return null;

  return (
    <>
      <div
        data-testid="lqa-overlay"
        className="fixed right-4 top-4 z-[9999] max-h-[80vh] w-96 overflow-y-auto rounded-lg border border-amber-500/30 bg-slate-900/95 p-4 text-xs text-amber-100 shadow-2xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-amber-300">LQA Mode</h2>
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-200">
            {entries.length} key(s)
          </span>
        </div>
        <p className="mb-2 text-slate-400">Hover over a key to inspect its source, target, and context.</p>
        <ul className="space-y-1">
          {entries.slice(0, 200).map((entry) => (
            <li
              key={`${entry.namespace}:${entry.key}`}
              className="cursor-pointer rounded p-1 hover:bg-amber-500/10"
              onMouseEnter={() => setSelected(entry)}
              onMouseLeave={() => setSelected(null)}
            >
              <div className="font-mono text-amber-300">{entry.namespace}:{entry.key}</div>
              <div className="truncate text-slate-300">{entry.target}</div>
              {entry.context && <div className="text-slate-500">ctx: {entry.context}</div>}
            </li>
          ))}
        </ul>
        {entries.length > 200 && (
          <div className="mt-2 text-slate-500">{entries.length - 200} more keys hidden.</div>
        )}
      </div>

      {selected && hoverPos && (
        <div
          className="pointer-events-none fixed z-[10000] max-w-xs rounded border border-amber-500/50 bg-slate-900/95 p-2 text-xs text-amber-100 shadow-xl"
          style={{ left: hoverPos.x + 12, top: hoverPos.y + 12 }}
        >
          <div className="font-mono text-amber-300">{selected.namespace}:{selected.key}</div>
          <div className="text-slate-300">source: {selected.source}</div>
          <div className="text-slate-300">target: {selected.target}</div>
          {selected.context && <div className="text-slate-500">context: {selected.context}</div>}
          {selected.maxLength > 0 && <div className="text-slate-500">maxLength: {selected.maxLength}</div>}
        </div>
      )}
    </>
  );
}
