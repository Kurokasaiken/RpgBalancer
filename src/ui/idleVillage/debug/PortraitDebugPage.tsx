import type { ReactNode } from 'react';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useVillageSandbox } from '@/ui/idleVillage/hooks/useVillageSandbox';
import DragTestContainer from '@/ui/idleVillage/components/DragTestContainer';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { useEffect, useMemo, useState } from 'react';
import { loadCharacters, type SavedCharacter } from '@/engine/idle/characterStorage';
import { getCharacterStorageEventName } from '@/engine/idle/characterPersistence';

const DEBUG_ALIAS = 'Sir SpaccaCuli';
const DRAG_CONTAINER_LINK =
  'https://github.com/Kurokasaiken/RpgBalancer/blob/main/src/ui/idleVillage/components/DragTestContainer.tsx';

function PortraitLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className="break-all text-sm text-ivory">{value}</p>
    </div>
  );
}

function PortraitDebugContent() {
  const { residents } = useVillageSandbox();
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>(() => loadCharacters());

  useEffect(() => {
    const handleUpdate = () => setSavedCharacters(loadCharacters());
    const storageEvent = getCharacterStorageEventName();
    window.addEventListener(storageEvent, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(storageEvent, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const rosterNames = useMemo(
    () => savedCharacters.map((character) => character.name || character.id),
    [savedCharacters],
  );
  const pgNames = useMemo(
    () => residents.map((resident) => resident.displayName || resident.id),
    [residents],
  );

  const rosterOnly = rosterNames.filter((name) => !pgNames.includes(name));
  const pgOnly = pgNames.filter((name) => !rosterNames.includes(name));
  const resident = residents[0] ?? null;
  const portraitUrl = resident?.portraitUrl ?? '';
  const portraitIdLabel = portraitUrl || 'Nessun ritratto configurato';

  const portraitThumb = portraitUrl ? (
    <img
      src={portraitUrl}
      alt="Portrait debug"
      className="mt-3 h-32 w-full rounded-3xl object-cover"
    />
  ) : (
    <div className="mt-3 h-32 rounded-3xl border border-dashed border-white/15 bg-black/10 text-center text-xs uppercase tracking-[0.4em] text-slate-500 flex items-center justify-center">
      Nessuna immagine
    </div>
  );

  return (
    <div
      className="observatory-page min-h-screen text-slate-100"
      style={{
        backgroundColor: 'var(--surface-base, #050509)',
        backgroundImage:
          'var(--body-bg-overlay, radial-gradient(circle at top, rgba(5,5,9,0.95), rgba(7,10,19,0.92))), var(--body-bg-texture, url(/assets/ui/bg.png))',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      <section className="observatory-container space-y-8 py-10">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.45em] text-amber-300/80">Idle Village · Debug</p>
          <h1 className="text-3xl font-semibold text-ivory">Portrait Debug Playground</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Visualizza il primo residente del roster come <strong>{DEBUG_ALIAS}</strong>, controlla l&apos;ID del portrait e osserva come
            passa attraverso DragTestContainer e PgCard.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-200/30 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300/80">Roster (Character Manager)</p>
            <p className="text-xs text-slate-400">Nomi salvati attualmente nel Character Manager.</p>
            <div className="mt-3 space-y-1 text-sm text-ivory">
              {rosterNames.length === 0 ? (
                <p className="text-slate-500">Nessun personaggio salvato.</p>
              ) : (
                rosterNames.map((name) => (
                  <div
                    key={`roster-${name}`}
                    className={[
                      'rounded-full border px-3 py-1 text-[11px]',
                      pgNames.includes(name)
                        ? 'border-emerald-400/70 text-emerald-200'
                        : 'border-rose-400/60 text-rose-200',
                    ].join(' ')}
                  >
                    {name}
                  </div>
                ))
              )}
            </div>
            {rosterOnly.length > 0 && (
              <p className="mt-3 text-[11px] text-rose-300">
                {rosterOnly.length} nome/i non presenti tra i PG visibili.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-cyan-200/30 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/80">PG visibili (Idle Village)</p>
            <p className="text-xs text-slate-400">Nomi attualmente renderizzati come PG (residenti).</p>
            <div className="mt-3 space-y-1 text-sm text-ivory">
              {pgNames.length === 0 ? (
                <p className="text-slate-500">Nessun PG disponibile.</p>
              ) : (
                pgNames.map((name) => (
                  <div
                    key={`pg-${name}`}
                    className={[
                      'rounded-full border px-3 py-1 text-[11px]',
                      rosterNames.includes(name)
                        ? 'border-emerald-400/70 text-emerald-200'
                        : 'border-amber-300/60 text-amber-200',
                    ].join(' ')}
                  >
                    {name}
                  </div>
                ))
              )}
            </div>
            {pgOnly.length > 0 && (
              <p className="mt-3 text-[11px] text-amber-300">
                {pgOnly.length} nome/i non esistono nel roster salvato.
              </p>
            )}
          </div>
        </div>

        {!resident ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
            Nessun residente disponibile. Aggiungi personaggi dal Character Manager per iniziare.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-amber-200/30 bg-black/20 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.5)]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300/80">1 · Dato grezzo</p>
                <div className="space-y-3 pt-3">
                  <PortraitLine label="Alias" value={DEBUG_ALIAS} />
                  <PortraitLine label="Resident ID" value={resident.id} />
                  <PortraitLine label="Portrait ID" value={portraitIdLabel} />
                  {portraitThumb}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-200/30 bg-black/20 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.5)]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-300/80">2 · DragTestContainer</p>
                <p className="mt-2 text-xs text-slate-300">
                  <a
                    href={DRAG_CONTAINER_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-200 underline hover:text-emerald-100"
                  >
                    DragTestContainer.tsx
                  </a>{' '}
                  gestisce filtri, badge di stato e d&d per i PG.
                </p>
                <div className="space-y-3 pt-3">
                  <PortraitLine label="Alias" value={DEBUG_ALIAS} />
                  <PortraitLine label="Resident ID" value={resident.id} />
                  <PortraitLine label="Portrait ID" value={portraitIdLabel} />
                  {portraitThumb}
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-200/30 bg-black/20 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.5)]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/80">3 · PgCard</p>
                <div className="pt-3">
                  <PgCard
                    workerId={resident.id}
                    label={DEBUG_ALIAS}
                    subtitle={resident.id}
                    hp={resident.currentHp}
                    fatigue={resident.fatigue}
                    maxHp={resident.maxHp}
                    horizontal
                    isInteractive={false}
                    disabled
                    portraitUrl={resident.portraitUrl}
                    statusLabel={resident.status}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Roster Preview</p>
                  <p className="text-sm text-slate-300">
                    DragTestContainer con il solo {DEBUG_ALIAS} (drag disabilitato per evitare side-effect).
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <DragTestContainer
                  residents={[resident]}
                  isDayPhase={false}
                  lockedResidentIds={[]}
                  layout="inline"
                  onResidentSelect={() => undefined}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function PortraitDebugPage() {
  return (
    <DragProvider>
      <PortraitDebugContent />
    </DragProvider>
  );
}

export default PortraitDebugPage;
