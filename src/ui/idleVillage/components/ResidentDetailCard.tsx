import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';

export interface ResidentDetailCardProps {
  resident: ResidentState;
  onClose?: () => void;
}

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const getResidentPortrait = (resident: ResidentState): string | undefined => {
  const directPortrait = (resident as ResidentState & { portraitUrl?: string }).portraitUrl;
  if (typeof directPortrait === 'string' && directPortrait.length > 0) {
    return directPortrait;
  }
  const snapshotPortrait = (resident.statSnapshot as Record<string, unknown> | undefined)?.portraitUrl;
  if (typeof snapshotPortrait === 'string' && snapshotPortrait.length > 0) {
    return snapshotPortrait;
  }
  return undefined;
};

const DRAG_EXEMPT_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

const isDragExemptTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (DRAG_EXEMPT_TAGS.has(target.tagName)) return true;
  if (target.closest('[data-drag-exempt="true"]')) return true;
  return false;
};

const ResidentDetailCard: React.FC<ResidentDetailCardProps> = ({ resident, onClose }) => {
  const { activePreset } = useThemeSwitcher();
  const hpPercent = resident.maxHp > 0 ? clampPercent(Math.round((resident.currentHp / resident.maxHp) * 100)) : 0;
  const fatiguePercent = clampPercent(Math.round(resident.fatigue));
  const statusLabel = resident.isInjured ? 'Ferito' : resident.status;
  const tags = resident.statTags ?? [];
  const snapshotEntries = useMemo(() => {
    const snapshot = resident.statSnapshot ?? {};
    return Object.entries(snapshot)
      .filter(([key, value]) => {
        if (key === 'portraitUrl' || key === 'equipment' || key === 'inventory') return false;
        if (typeof value === 'number') return Number.isFinite(value);
        return false;
      })
      .sort(([, a], [, b]) => (Number(b) ?? 0) - (Number(a) ?? 0));
  }, [resident.statSnapshot]);
  const portraitUrl = getResidentPortrait(resident);
  const equipmentSlots = useMemo(() => {
    const snapshot = (resident.statSnapshot ?? {}) as Record<string, unknown>;
    const equipment = (snapshot.equipment as Record<string, unknown> | undefined) ?? {};
    const getter = (...keys: string[]) => {
      for (const key of keys) {
        const value = equipment[key] ?? snapshot[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value;
        }
      }
      return undefined;
    };
    return [
      { id: 'weapon', label: 'Arma', value: getter('weapon', 'equippedWeapon', 'primaryWeapon', 'weaponName') },
      { id: 'offhand', label: 'Secondaria', value: getter('offhand', 'shield', 'secondaryWeapon') },
      { id: 'armor', label: 'Armatura', value: getter('armor', 'equippedArmor', 'plate') },
      { id: 'trinket', label: 'Trinket', value: getter('trinket', 'amulet', 'relic') },
      { id: 'ring', label: 'Anello', value: getter('ring', 'ringSlot', 'sigil') },
      { id: 'mount', label: 'Compagno', value: getter('companion', 'pet', 'mount') },
    ];
  }, [resident.statSnapshot]);
  const inventoryTokens = useMemo(() => {
    const snapshot = resident.statSnapshot as Record<string, unknown> | undefined;
    const inventory = snapshot?.inventory;
    if (Array.isArray(inventory)) {
      return inventory
        .map((entry) => {
          if (typeof entry === 'string') return entry;
          if (typeof entry === 'object' && entry && 'name' in entry) {
            return String((entry as { name?: string }).name ?? '');
          }
          return '';
        })
        .filter((value) => value.length > 0);
    }
    return [];
  }, [resident.statSnapshot]);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const frameStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['card-surface'] ?? 'var(--card-surface, rgba(5,7,12,0.95))',
      borderColor: tokens['panel-border'] ?? 'var(--panel-border, rgba(255,215,0,0.35))',
      boxShadow: `0 35px 75px ${tokens['card-shadow-color'] ?? 'rgba(0,0,0,0.65)'}`,
    };
  }, [activePreset]);
  const auraStyle = useMemo(
    () => ({
      background: activePreset.tokens['card-surface-radial'] ?? 'var(--card-surface-radial, rgba(255,255,255,0.06))',
    }),
    [activePreset],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerOriginRef.current.x;
      const dy = event.clientY - pointerOriginRef.current.y;
      setPosition({
        x: dragOriginRef.current.x + dx,
        y: dragOriginRef.current.y + dy,
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (isDragExemptTarget(event.target)) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  return (
    <div
      className="relative pointer-events-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border text-ivory backdrop-blur-xl text-[11px] leading-snug"
      onPointerDown={handlePointerDown}
      style={{
        ...frameStyle,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        maxHeight: '80vh',
      }}
    >
      <div className="absolute inset-0 opacity-45" style={auraStyle} aria-hidden />
      <div className="absolute -inset-6 bg-black/30 blur-[28px]" aria-hidden />
      <div className="relative z-10 flex flex-col">
      <div className="flex flex-col gap-3 border-b border-amber-400/40 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-amber-300/50 bg-black/40 text-2xl font-semibold uppercase tracking-[0.3em] shadow-[0_0_25px_rgba(251,191,36,0.35)]"
            aria-hidden="true"
          >
            {portraitUrl ? (
              <>
                <img src={portraitUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
              </>
            ) : (
              <span>{formatResidentLabel(resident).charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-amber-200/70">Personaggio</div>
            <div className="text-xl font-semibold leading-tight">{formatResidentLabel(resident)}</div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{statusLabel}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Scheda</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 transition hover:border-rose-400/50 hover:text-rose-200"
            aria-label="Chiudi scheda"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.1fr_0.8fr]">
          <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 text-center shadow-inner shadow-black/70">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.2),transparent_65%)] opacity-40" />
            <div className="relative z-10 p-3">
              <div
                className="mx-auto h-44 w-32 overflow-hidden rounded-[20px] border border-white/15 shadow-[0_18px_35px_rgba(0,0,0,0.6)]"
                style={{
                  background:
                    portraitUrl ??
                    'radial-gradient(circle at 30% 10%, rgba(255,255,255,0.12), rgba(3,5,10,0.9))',
                  backgroundSize: portraitUrl ? 'cover' : undefined,
                  backgroundPosition: 'center',
                }}
              >
                {portraitUrl && <img src={portraitUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-slate-400">Profilo</p>
              <p className="text-[12px] text-amber-200">{resident.statProfileId ?? 'Preset sconosciuto'}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-[10px] text-slate-300">
            <div className="text-[9px] uppercase tracking-[0.35em] text-slate-400">Cronache</div>
            <p className="mt-1 leading-snug text-slate-200">
              {formatResidentLabel(resident)} ha completato {resident.survivalCount ?? 0} sortite e accumulato un punteggio sopravvivenza di {resident.survivalScore ?? 0}.
              {resident.isHero ? ' Considerato un eroe del villaggio.' : ' In attesa di nuove imprese.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 shadow-inner shadow-black/60">
              <div className="text-[9px] uppercase tracking-[0.3em] text-emerald-200/70">HP</div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-200">
                <span>
                  {resident.currentHp}/{resident.maxHp}
                </span>
                <span>{hpPercent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-500 via-emerald-300 to-cyan-400"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 shadow-inner shadow-black/60">
              <div className="text-[9px] uppercase tracking-[0.3em] text-amber-200/80">Fatigue</div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
                <span>{fatiguePercent}%</span>
                <span>{resident.status === 'exhausted' ? 'Esausto' : 'Pronto'}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-400 via-amber-300 to-rose-400"
                  style={{ width: `${fatiguePercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.35em] text-slate-400">
              <span>Statistiche</span>
              <span>{snapshotEntries.length} valori</span>
            </div>
            <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-900 bg-black/30">
              {snapshotEntries.length ? (
                <table className="w-full text-left text-[10px] uppercase tracking-[0.25em] text-slate-200">
                  <tbody>
                    {snapshotEntries.map(([key, value]) => (
                      <tr key={key} className="border-b border-white/5 last:border-none">
                        <td className="px-2 py-1.5 text-[9px] text-slate-500">{key}</td>
                        <td className="px-2 py-1.5 text-right font-semibold text-amber-100">{Number(value).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-2 py-3 text-[10px] text-slate-500">Nessuno snapshot disponibile.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="text-[9px] uppercase tracking-[0.35em] text-slate-400">Tratti distintivi</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-slate-200">
              {tags.length
                ? tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-700 px-2 py-0.5">
                      {tag}
                    </span>
                  ))
                : (
                  <span className="text-slate-500">—</span>
                )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="text-[9px] uppercase tracking-[0.35em] text-slate-400">Equipaggiamento</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {equipmentSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-xl border border-slate-800 bg-black/30 px-2.5 py-2 text-[10px] uppercase tracking-[0.25em] text-slate-300"
                >
                  <div className="text-[8px] text-slate-500">{slot.label}</div>
                  <div className="text-xs font-semibold text-amber-200">
                    {slot.value ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
            <div className="text-[9px] uppercase tracking-[0.35em] text-slate-400">Inventario</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {inventoryTokens.length
                ? inventoryTokens.map((token) => (
                    <span
                      key={token}
                      className="rounded-[10px] border border-white/10 bg-black/40 px-2.5 py-0.5 text-[10px] text-slate-100"
                    >
                      {token}
                    </span>
                  ))
                : (
                  <span className="text-[10px] text-slate-500">Nessun oggetto registrato.</span>
                )}
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ResidentDetailCard;
