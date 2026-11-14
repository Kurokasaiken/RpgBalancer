import { useMemo, useState } from 'react';
import {
  SlotRackKitShell,
  ResidentSlotRack,
  type ResidentSlotRackProps,
} from '@/ui/idleVillage/frozen/kits/slotRackKit';
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster';
import { C1Medallion } from '@/ui/idleVillage/components/C1Medallion';
import { BEZEL_PRESETS } from '@/ui/idleVillage/components/SlotV12Renderer';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

/**
 * Bezel variants lab — visual comparison page for the `hud64` optical-rebalance
 * studies (Director request, multi-provider memo
 * `.mw/runs/20261017-qed-ui-critique/artifact-r002.md`). Renders the canonical
 * `ResidentSlotRack` exactly as the quest planner does (detail layout, 64px,
 * hud-gold, hud64 variant) once per `BezelPreset`; `stock` is the certified
 * paint. Director ruling (R-214): `b` is the production bezel on `/game`.
 */

type BezelPreset = NonNullable<ResidentSlotRackProps['bezelPreset']>;

const PRESET_META: Record<BezelPreset, { name: string; desc: string }> = {
  draghi: {
    name: 'DRAGHI — GHIERA DIPINTA + MECCANICA REALE',
    desc: 'BATTEZZATO R-333 — slot corretto. Ghiera firmata (banda treccia + X con kite + ring oro + disco drago) nella meccanica reale: sandwich disco-dietro / medaglione v3 FRAME + ritratto reale / ring+banda-davanti; chiusura tuned ×1.15·×0.9; montata nel cassetto.',
  },
  zanara: {
    name: 'ZANARA — PLAN-116 F0 (scartata)',
    desc: 'Full-width band, short wide claws rooted in the band biting the medallion rim, no bezel gem (lab-only).',
  },
  zanara2: {
    name: 'ZANARA-2 — GANASCE A DOPPIO BRACCIO',
    desc: 'Director-ruled concept: 4 articulated arms at the cardinals, hinge pins on a teal-enamel band, seat collar closing the gap, emerald index on the south pin (lab-only).',
  },
  stock: {
    name: 'STOCK',
    desc: 'Certified hud64: claws 270/30/150, upper-left rim arc, shadow translate(1.3,1.7).',
  },
  a: {
    name: 'A — REBALANCE',
    desc: '4 diagonal claws 45/135/225/315, rim arc + faint counter-arc, centred shadow, cavity AO 60%.',
  },
  b: {
    name: 'B — COUNTERWEIGHT · PRODUCTION',
    desc: 'Director-ruled (R-214): stock claws kept, engraved rivets at 3/9 o\u2019clock, darker top quadrant.',
  },
  c: {
    name: 'C — CONCENTRIC',
    desc: '6 even claws 30…330, continuous low rim light, near-centred shadow, cavity AO 40%.',
  },
  ab: {
    name: 'A+B',
    desc: 'A\u2019s symmetric claws and lighting plus cardinal rivets between the claws.',
  },
};

const PRESET_ORDER: BezelPreset[] = ['draghi', 'zanara2', 'zanara', 'stock', 'a', 'b', 'c', 'ab'];

/** Row labels mirror the planner's marching order (head → tail). */
const ROW_LABELS = ['TESTA', 'II', 'III', 'CODA'];

function BezelVariantsContent() {
  const [showCenterlines, setShowCenterlines] = useState(true);
  const [seatNonce, setSeatNonce] = useState(0);
  /* DRAGHI tuning sliders (lab-only): mutate the live preset object so every
   * rack instance re-reads the knob on re-render; the numbers are the values
   * to report back once the closure point looks right. */
  const [tune, setTune] = useState({ ghiera: BEZEL_PRESETS.draghi.bandImageScale ?? 1, medal: BEZEL_PRESETS.draghi.portraitScale ?? 1 });
  const { residents } = useCanonicalRosterBundle(0);

  /* 3 occupied slots + 1 empty (bodyguard role glyph) — enough to read both
   * the bezel repetition rhythm and the empty-cavity composition. */
  const slots = useMemo<ResidentSlotViewModel[]>(
    () =>
      ROW_LABELS.map((label, index) => {
        const resident = index < 3 ? residents[index] : undefined;
        return {
          id: `bezel-lab-${index}`,
          index,
          label,
          required: index === 0,
          assignedResidentId: resident?.id ?? null,
          assignedResident: resident,
          isPlaceholder: false,
          dropState: 'idle',
          bloomState: 'idle',
          status: resident ? 'assigned' : 'empty',
          telemetryTags: [],
          role: index === 3 ? 'bodyguard' : 'member',
          seatNonce,
        };
      }),
    [residents, seatNonce],
  );

  return (
    <div data-testid="bezel-variants-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
              Lab · hud64 bezel
            </p>
            <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
              BEZEL VARIANTS
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Route: /bezel-variants — optical-centre study. Each row: the real rack at true 64px
              (3 occupied + 1 empty), then a 3× zoomed slot.
            </p>
          </div>
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSeatNonce((n) => n + 1)}
            className="rounded border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-amber-200 transition-colors hover:bg-amber-400/20"
          >
            Replay slam
          </button>
          <button
            type="button"
            onClick={() => setShowCenterlines((v) => !v)}
            className={`rounded border px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors ${
              showCenterlines
                ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                : 'border-slate-600 text-slate-400 hover:border-slate-400'
            }`}
          >
            Centerlines {showCenterlines ? 'on' : 'off'}
          </button>
          </div>
        </header>


        {PRESET_ORDER.map((preset) => (
          <section
            key={preset}
            data-testid={`bezel-row-${preset}`}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-5"
          >
            <div className="mb-4 flex items-baseline gap-4">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-amber-100/90">
                {PRESET_META[preset].name}
              </h2>
              <p className="text-xs text-slate-500">{PRESET_META[preset].desc}</p>
            </div>
            <div className="flex items-center gap-10">
              <div className="flex items-end gap-6">
                {slots.map((slot) => (
                  <div key={slot.id} className="relative">
                    <ResidentSlotRack
                      /* draghi tuning: DetailSlot is memo'd — remount on knob
                       * change so the mutated preset is re-read. */
                      key={preset === 'draghi' ? `${tune.ghiera}-${tune.medal}` : 's'}
                      slots={[slot]}
                      layout="detail"
                      slotSize={64}
                      slotMaterial="hud-gold"
                      slotVariant="hud64"
                      bezelPreset={preset}
                    />
                    {showCenterlines && (
                      <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-40 h-16 w-16">
                        <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/70" />
                        <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/70" />
                        <div
                          className="absolute rounded-full border border-dashed border-cyan-400/60"
                          style={{ left: '50%', top: '50%', width: 50, height: 50, transform: 'translate(-50%,-50%)' }}
                        />
                      </div>
                    )}
                  </div>
                ))}

              </div>
              <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-md border border-slate-700/60 bg-black/40">
                <div className="relative" style={{ transform: 'scale(3)', transformOrigin: '0 0' }}>
                  <ResidentSlotRack
                    key={preset === 'draghi' ? `z-${tune.ghiera}-${tune.medal}` : 'z'}
                    slots={slots.slice(0, 1)}
                    layout="detail"
                    slotSize={64}
                    slotMaterial="hud-gold"
                    slotVariant="hud64"
                    bezelPreset={preset}
                  />
                  {showCenterlines && (
                    <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-40 h-16 w-16">
                      <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/70" />
                      <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/70" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {preset === 'draghi' && (
              <div className="mt-4 flex items-center gap-8 rounded border border-cyan-800/50 bg-slate-950/60 px-4 py-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">Tuning</span>
                <label className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="w-32 uppercase tracking-[0.15em]">Chiusura ghiera</span>
                  <input
                    type="range" min={0.85} max={1.15} step={0.0025} value={tune.ghiera}
                    className="w-56 accent-cyan-400"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      BEZEL_PRESETS.draghi.bandImageScale = v;
                      setTune((t) => ({ ...t, ghiera: v }));
                    }}
                  />
                  <span className="w-14 font-mono text-cyan-200">{tune.ghiera.toFixed(4)}</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="w-32 uppercase tracking-[0.15em]">Medaglione</span>
                  <input
                    type="range" min={0.9} max={1.3} step={0.005} value={tune.medal}
                    className="w-56 accent-cyan-400"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      BEZEL_PRESETS.draghi.portraitScale = v;
                      setTune((t) => ({ ...t, medal: v }));
                    }}
                  />
                  <span className="w-14 font-mono text-cyan-200">{tune.medal.toFixed(3)}</span>
                </label>
                <span className="text-[10px] text-slate-500">riportami i due numeri quando il punto di chiusura è giusto</span>
              </div>
            )}
          </section>
        ))}

        {/* Reference: the baptized C1 medallion (signed ring + resident portrait)
            — the real thing the ghiera must enclose. */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-baseline gap-4">
            <h2 className="text-sm font-semibold tracking-[0.25em] text-amber-100/90">
              MEDAGLIONE BATTEZZATO — C1
            </h2>
            <p className="text-xs text-slate-500">
              Ring C1 firmato + ritratto nel foro — questo è il medaglione che la ghiera racchiude.
            </p>
          </div>
          <div className="flex items-center gap-10">
            <C1Medallion portraitUrl={residents[0]?.portraitUrl} sizePx={64} />
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-md border border-slate-700/60 bg-black/40">
              <div className="relative" style={{ transform: 'scale(2.2)', transformOrigin: '0 0' }}>
                <C1Medallion portraitUrl={residents[0]?.portraitUrl} sizePx={64} />
              </div>
            </div>
          </div>
        </section>

        {/* Proof: the signed mockup ghiera (ganasce a doppio braccio) extracted
            as a transparent asset, mounted over the real C1 medallion. */}
        <section className="rounded-lg border border-amber-800/60 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-baseline gap-4">
            <h2 className="text-sm font-semibold tracking-[0.25em] text-amber-100/90">
              GHIERA DENTINI — PROOF
            </h2>
            <p className="text-xs text-slate-500">
              Render Gemini con denti sottili forgiati (no ganasce), estratto trasparente e montato sopra il C1 vero.
            </p>
          </div>
          <div className="flex items-center gap-10">
            {[64, 96, 128, 160].map((g) => (
              <div key={g} className="relative shrink-0" style={{ width: g, height: g }}>
                <div
                  className="absolute"
                  style={{
                    width: g * 0.62,
                    height: g * 0.62,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%,-50%)',
                  }}
                >
                  <C1Medallion portraitUrl={residents[0]?.portraitUrl} sizePx={g * 0.62} />
                </div>
                <img
                  src="/assets/ui/hud-real/ghiera-dentini.webp"
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            ))}
            <p className="max-w-xs text-xs text-slate-500">
              Taglie libere 64/96/128/160. La ghiera è in posa chiusa (X); in
              apertura ruota di -45° e i dentini vanno sui cardinali (+).
            </p>
          </div>
          <div className="mt-6 flex items-start gap-12">
            {/* CHIUSO — painted ghiera on the real occupied slot (X pose) */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <ResidentSlotRack
                  slots={slots.slice(0, 1)}
                  layout="detail"
                  slotSize={64}
                  slotMaterial="hud-gold"
                  slotVariant="hud64"
                  bezelPreset="stock"
                />
                <img
                  src="/assets/ui/hud-real/ghiera-dentini.webp"
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute"
                  style={{ width: 78, height: 78, left: '50%', top: 32, transform: 'translate(-50%,-50%)' }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
                Chiuso — slot reale (X)
              </span>
            </div>
            {/* APERTO — same ghiera rotated -45° + enlarged on the empty slot (+ pose) */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <ResidentSlotRack
                  slots={slots.slice(3, 4)}
                  layout="detail"
                  slotSize={64}
                  slotMaterial="hud-gold"
                  slotVariant="hud64"
                  bezelPreset="stock"
                />
                <img
                  src="/assets/ui/hud-real/ghiera-dentini.webp"
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute"
                  style={{ width: 98, height: 98, left: '50%', top: 32, transform: 'translate(-50%,-50%) rotate(-45deg)' }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
                Aperto — ruotata + ingrandita (+)
              </span>
            </div>
            {/* zoom of the closed state on the real slot */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-52 w-52 overflow-hidden rounded-md border border-slate-700/60 bg-black/40">
                <div className="relative" style={{ transform: 'scale(2.4)', transformOrigin: '0 0' }}>
                  <div className="relative">
                    <ResidentSlotRack
                      slots={slots.slice(0, 1)}
                      layout="detail"
                      slotSize={64}
                      slotMaterial="hud-gold"
                      slotVariant="hud64"
                      bezelPreset="stock"
                    />
                    <img
                      src="/assets/ui/hud-real/ghiera-dentini.webp"
                      alt=""
                      draggable={false}
                      className="pointer-events-none absolute"
                      style={{ width: 78, height: 78, left: '50%', top: 32, transform: 'translate(-50%,-50%)' }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
                Zoom chiuso
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function BezelVariantsPage() {
  return (
    <SlotRackKitShell>
      <BezelVariantsContent />
    </SlotRackKitShell>
  );
}
