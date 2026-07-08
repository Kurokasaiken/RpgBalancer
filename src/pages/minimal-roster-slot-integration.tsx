/**
 * MinimalRosterSlotIntegrationPage — L2: Roster + SlotRack
 *
 * Config-first: gli slot del rack (quanti, con quali requisiti, slot infiniti)
 * vengono dall'activity `slot_rack_lab` in DEFAULT_IDLE_VILLAGE_CONFIG
 * (stesso meccanismo di /test: useResidentSlotController + maxSlots 'infinite'
 * — assegnato l'ultimo slot libero, ne appare automaticamente uno nuovo).
 *
 * La pagina contiene solo DECISIONI (quale slot accetta quale pg); ogni
 * comportamento (volo magnetico, spring-back, estrazione, bloom, stato Away)
 * è ereditato dai kit certificati e dagli hook di interazione condivisi.
 *
 * Spec: src/docs/docs/idle_village/interaction_core_spec.md
 */
import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { RosterDraggable, RosterKitShell, useRosterKitData, type RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { ResidentSlotRack } from '@/ui/idleVillage/frozen/kits/slotRackKit';
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotBlueprint } from '@/ui/idleVillage/slots/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';

// Config-driven: the rack is entirely described by this activity definition
const RACK_ACTIVITY = DEFAULT_IDLE_VILLAGE_CONFIG.activities.slot_rack_lab;
const RACK_BLUEPRINTS = ((RACK_ACTIVITY.metadata as { slotBlueprints?: ResidentSlotBlueprint[] } | undefined)?.slotBlueprints ?? []);
const SLOT_SIZE_PX = 140;


export default function MinimalRosterSlotIntegrationPage() {
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  // Resident currently flying (click-assign or extraction return): locked meanwhile
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);

  const { residentsById } = useRosterKitData();
  const { state: pageFlight, startFlight, settle: settleFlight } = useDragOutcome();

  const assignedIds = useMemo(
    () => Object.values(assignments).filter(Boolean) as string[],
    [assignments]
  );

  // Canonical slot derivation: blueprints + assignments + infinite placeholders
  const controller = useResidentSlotController({
    activity: RACK_ACTIVITY,
    assignments,
    residents: residentsById,
    hoveredResidentId: draggingResidentId,
    slotBlueprints: RACK_BLUEPRINTS,
    onAssign: (slotId, residentId) => setAssignments((a) => ({ ...a, [slotId]: residentId })),
    onClear: (slotId) => setAssignments((a) => ({ ...a, [slotId]: null })),
  });

  /** First free slot that accepts the resident (config requirement check). */
  const findAcceptingSlot = useCallback((residentId: string) => {
    const resident = residentsById[residentId];
    if (!resident || assignedIds.includes(residentId)) return null;
    return controller.slots.find((slot) =>
      !slot.assignedResidentId &&
      evaluateStatRequirement(resident, slot.requirement).matches
    ) ?? null;
  }, [controller.slots, residentsById, assignedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingResidentId(event.active.id as string);
  }, []);

  // Drop verdict: false → spring-back; flightToSlot → the kit flies the token
  // into that slot; assignment happens on landing (onFlightComplete).
  const handleDragEnd = useCallback((event: DragEndEvent): RosterDropVerdict => {
    setDraggingResidentId(null);
    const residentId = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId) return;

    const slot = controller.slots.find((s) => s.id === overId);
    if (!slot) return;
    const resident = residentsById[residentId];
    const accepted = Boolean(
      resident &&
      !slot.assignedResidentId &&
      !assignedIds.includes(residentId) &&
      evaluateStatRequirement(resident, slot.requirement).matches
    );
    if (!accepted) return false; // requirement failed or occupied → spring-back

    return {
      flightToSlot: {
        slotId: slot.id,
        element: document.querySelector(`[data-slot-id="${slot.id}"]`),
      },
    };
  }, [controller.slots, residentsById, assignedIds]);

  const handleFlightComplete = useCallback((residentId: string, slotId?: string) => {
    if (slotId) setAssignments((a) => ({ ...a, [slotId]: residentId }));
  }, []);

  // Click-to-assign: first free compatible slot, magnetic flight, seat on landing
  const handleResidentSelect = useCallback((residentId: string) => {
    if (flyingResidentId) return;
    const slot = findAcceptingSlot(residentId);
    if (!slot) return;
    const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
    const to = elementCenter(document.querySelector(`[data-slot-id="${slot.id}"]`));
    if (!from || !to) return;
    setFlyingResidentId(residentId);
    startFlight({ residentId, slotId: slot.id, isInset: true, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
  }, [flyingResidentId, findAcceptingSlot, startFlight]);

  // Press-and-hold extraction: rack plays the shared sequence, then the token
  // flies back to the roster card; the pg stays locked until it lands.
  const handleSlotClear = useCallback((slotId: string) => {
    const residentId = assignments[slotId];
    setAssignments((a) => ({ ...a, [slotId]: null }));
    if (!residentId) return;
    const from = elementCenter(document.querySelector(`[data-slot-id="${slotId}"]`));
    const to = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
    if (from && to) {
      setFlyingResidentId(residentId);
      startFlight({ residentId, slotId, isInset: false, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
    }
  }, [assignments, startFlight]);

  const handlePageFlightComplete = useCallback((residentId: string, slotId?: string, isInset?: boolean) => {
    if (isInset && slotId) setAssignments((a) => ({ ...a, [slotId]: residentId }));
    setFlyingResidentId(null);
    settleFlight();
  }, [settleFlight]);

  return (
    <TooltipProvider>
      <RosterKitShell>
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragCancel={() => setDraggingResidentId(null)}
        >
          <div data-testid="minimal-roster-slot-integration-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
            <div className="mx-auto max-w-6xl space-y-8">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Roster + SlotRack</p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">ROSTER + SLOTRACK INTEGRATION</h1>
                <p className="mt-1 text-sm text-slate-400">Slot config-driven (activity slot_rack_lab) · drag, click-to-assign, estrazione, slot infiniti</p>
                <p className="mt-2 text-xs text-slate-500">Route: /minimal-roster-slot-integration</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: certified roster kit */}
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Village Roster</h2>
                  <RosterDraggable
                    componentId="roster-slot-rack"
                    useWanderlustSkin={true}
                    useExternalDndContext={true}
                    onDragEnd={handleDragEnd}
                    onFlightComplete={handleFlightComplete}
                    onResidentSelect={handleResidentSelect}
                    lockedResidentIds={[...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])]}
                    lockedStatusLabel="Away"
                  />
                </div>

                {/* Right: config-driven slot rack (infinite slots via controller) */}
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">
                    Slot Rack · {RACK_ACTIVITY.label}
                  </h2>
                  <style>{`.roster-slot-rack-ws .ws-content { position: relative; z-index: 2; padding: 14px 16px; }`}</style>
                  <WanderlustSurface shape="panel" material="bronze" interactive={false} className="roster-slot-rack-ws">
                    <ResidentSlotRack
                      slots={controller.slots}
                      onSlotClear={handleSlotClear}
                      draggingResidentId={draggingResidentId}
                      layout="detail"
                      overflowBehavior="scroll"
                      slotSize={SLOT_SIZE_PX}
                    />
                  </WanderlustSurface>
                  <p className="mt-3 text-xs text-slate-500">
                    Slot Aperto: accetta chiunque · Slot HP &gt; 200: Giggiolillo (195) rimbalza ·
                    riempi gli slot e ne appare automaticamente uno nuovo (infiniti)
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Page-level flights: click-to-assign + extraction return */}
          <DragOutcomeFlight
            state={pageFlight}
            residentsById={residentsById}
            onComplete={handlePageFlightComplete}
          />
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
}
