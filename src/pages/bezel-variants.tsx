import { useMemo, useState } from 'react';
import {
  SlotRackKitShell,
  ResidentSlotRack,
  type ResidentSlotRackProps,
} from '@/ui/idleVillage/frozen/kits/slotRackKit';
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster';
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

const PRESET_ORDER: BezelPreset[] = ['stock', 'a', 'b', 'c', 'ab'];

/** Row labels mirror the planner's marching order (head → tail). */
const ROW_LABELS = ['TESTA', 'II', 'III', 'CODA'];

function BezelVariantsContent() {
  const [showCenterlines, setShowCenterlines] = useState(true);
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
        };
      }),
    [residents],
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
          </section>
        ))}
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
