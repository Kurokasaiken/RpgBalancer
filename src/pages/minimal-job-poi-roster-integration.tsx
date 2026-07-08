/**
 * MinimalJobPoiRosterIntegrationPage — L3+L4: Roster + POI + POI Detail con SlotRack
 *
 * Il POI medallion è il proxy dei suoi slot:
 *  - Drop sul medaglione → stesso check del primo slot libero compatibile
 *    (element: null se il detail è chiuso = assign istantaneo; element reale se aperto = volo magnetico)
 *  - Click sul medaglione → apre/chiude il POI Detail
 *  - Drop diretto sullo slot nel detail ≡ L2 (stesso path di /minimal-roster-slot-integration)
 *  - Estrazione press-and-hold dallo slot nel detail → volo di ritorno alla card roster
 *
 * Spec: src/docs/docs/idle_village/interaction_core_spec.md §2.4
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
import { JobPOI } from '@/ui/idleVillage/components/minimal/JobPOI';

const RACK_ACTIVITY = DEFAULT_IDLE_VILLAGE_CONFIG.activities.slot_rack_lab;
const RACK_BLUEPRINTS = ((RACK_ACTIVITY.metadata as { slotBlueprints?: ResidentSlotBlueprint[] } | undefined)?.slotBlueprints ?? []);

// dnd-kit droppable id used internally by JobPOI — must match its `job-poi-drop-${activityId}` pattern
const POI_DROP_ID = `job-poi-drop-${RACK_ACTIVITY.id}`;

// Translate NumericStatRequirement → JobPOI legacy format (used only for bloom approximation)
function buildPoiRequirements() {
  for (const bp of RACK_BLUEPRINTS) {
    const allOf = bp.requirement?.allOf ?? [];
    for (const r of allOf) {
      if (typeof r === 'object' && r.stat === 'hp' && r.operator === '>') {
        return { minHp: r.value };
      }
    }
  }
  return undefined;
}
const POI_REQUIREMENTS = buildPoiRequirements();

export default function MinimalJobPoiRosterIntegrationPage() {
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { residentsById } = useRosterKitData();
  const { state: pageFlight, startFlight, settle: settleFlight } = useDragOutcome();

  const assignedIds = useMemo(
    () => Object.values(assignments).filter(Boolean) as string[],
    [assignments]
  );

  const controller = useResidentSlotController({
    activity: RACK_ACTIVITY,
    assignments,
    residents: residentsById,
    hoveredResidentId: draggingResidentId,
    slotBlueprints: RACK_BLUEPRINTS,
    onAssign: (slotId, residentId) => setAssignments((a) => ({ ...a, [slotId]: residentId })),
    onClear: (slotId) => setAssignments((a) => ({ ...a, [slotId]: null })),
  });

  const poiStatus = assignedIds.length > 0 ? 'working' : 'idle';
  const realSlots = controller.slots.filter((s) => !s.isPlaceholder);
  const freeSlots = realSlots.filter((s) => !s.assignedResidentId).length;

  // Slots in JobPOI legacy format (bloom approximation only)
  const poiSlots = useMemo(
    () => realSlots.map((s) => ({
      id: s.id,
      assignedResidentId: s.assignedResidentId ?? undefined,
      requirements: POI_REQUIREMENTS,
    })),
    [realSlots]
  );

  /** First free slot that accepts the resident. */
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

  const handleDragEnd = useCallback((event: DragEndEvent): RosterDropVerdict => {
    setDraggingResidentId(null);
    const residentId = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId) return;

    const resident = residentsById[residentId];
    if (!resident || assignedIds.includes(residentId)) return false;

    let slot: typeof controller.slots[number] | null | undefined;

    if (overId === POI_DROP_ID) {
      // POI medallion drop → proxy for its first accepting slot
      slot = controller.slots.find((s) =>
        !s.assignedResidentId &&
        evaluateStatRequirement(resident, s.requirement).matches
      );
      if (!slot) return false;
    } else {
      // Direct drop on a slot inside the detail
      slot = controller.slots.find((s) => s.id === overId);
      if (!slot) return;
      const accepted = !slot.assignedResidentId &&
        evaluateStatRequirement(resident, slot.requirement).matches;
      if (!accepted) return false;
    }

    // When detail is open use the real DOM element (magnetic flight into visible slot);
    // when closed, element:null → kit fires onFlightComplete immediately (instant assign).
    const element = isDetailOpen
      ? document.querySelector(`[data-slot-id="${slot.id}"]`)
      : null;

    return { flightToSlot: { slotId: slot.id, element } };
  }, [controller.slots, residentsById, assignedIds, isDetailOpen]);

  // Kit-managed drop flight landing
  const handleFlightComplete = useCallback((residentId: string, slotId?: string) => {
    if (slotId) setAssignments((a) => ({ ...a, [slotId]: residentId }));
  }, []);

  // Click-to-assign: flies into the first accepting slot (same as L2)
  const handleResidentSelect = useCallback((residentId: string) => {
    if (flyingResidentId) return;
    const slot = findAcceptingSlot(residentId);
    if (!slot) return;
    const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
    // If detail is open: fly to the visible slot; if closed: assign instantly
    if (isDetailOpen) {
      const to = elementCenter(document.querySelector(`[data-slot-id="${slot.id}"]`));
      if (!from || !to) return;
      setFlyingResidentId(residentId);
      startFlight({ residentId, slotId: slot.id, isInset: true, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
    } else {
      setAssignments((a) => ({ ...a, [slot.id]: residentId }));
    }
  }, [flyingResidentId, findAcceptingSlot, startFlight, isDetailOpen]);

  // Press-and-hold extraction from detail slot → return flight to roster card
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

  // Page-level flight landing (click-to-assign + extraction return)
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
          <div data-testid="minimal-job-poi-roster-integration-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
            <div className="mx-auto max-w-6xl space-y-8">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · L3+L4 · Job POI + Detail + Roster</p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">JOB POI + ROSTER INTEGRATION</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Drop sul medaglione → assign al primo slot libero ·
                  Click medaglione → apre il detail con slot interattivi ·
                  Estrazione press-and-hold disponibile nel detail aperto
                </p>
                <p className="mt-2 text-xs text-slate-500">Route: /minimal-job-poi-roster-integration</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: certified roster kit */}
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Village Roster</h2>
                  <RosterDraggable
                    componentId="job-poi-roster"
                    useWanderlustSkin={true}
                    useExternalDndContext={true}
                    onDragEnd={handleDragEnd}
                    onFlightComplete={handleFlightComplete}
                    onResidentSelect={handleResidentSelect}
                    lockedResidentIds={[...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])]}
                    lockedStatusLabel="Away"
                  />
                </div>

                {/* Right: POI medallion + collapsible detail */}
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6 flex flex-col items-center gap-6">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
                      {isDetailOpen ? 'Clicca per chiudere il detail' : 'Clicca per aprire il detail'}
                    </p>
                    <JobPOI
                      activityId={RACK_ACTIVITY.id}
                      label={RACK_ACTIVITY.label}
                      icon="⚔"
                      status={poiStatus}
                      freeSlots={freeSlots}
                      maxSlots={realSlots.length}
                      canAcceptDrop={freeSlots > 0}
                      requirements={POI_REQUIREMENTS}
                      slots={poiSlots}
                      onClick={() => setIsDetailOpen((o) => !o)}
                    />
                  </div>

                  {/* POI Detail — slot rack con interazione completa */}
                  {isDetailOpen && (
                    <div
                      className="w-full border-t border-slate-700/40 pt-5 flex flex-col gap-3"
                      data-testid="poi-detail-panel"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                          Slot Detail · {RACK_ACTIVITY.label}
                        </h3>
                        <button
                          onClick={() => setIsDetailOpen(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          chiudi ×
                        </button>
                      </div>
                      <style>{`.poi-detail-ws .ws-content { position: relative; z-index: 2; padding: 14px 16px; }`}</style>
                      <WanderlustSurface shape="panel" material="bronze" interactive={false} className="poi-detail-ws">
                        <ResidentSlotRack
                          slots={controller.slots}
                          onSlotClear={handleSlotClear}
                          draggingResidentId={draggingResidentId}
                          layout="detail"
                          overflowBehavior="scroll"
                          slotSize={140}
                        />
                      </WanderlustSurface>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Slot Aperto: accetta chiunque · Slot HP &gt; 200: Giggiolillo (195) rimbalza ·
                        Drop diretto sullo slot ≡ drop sul medaglione · Estrazione: tieni premuto
                      </p>
                    </div>
                  )}
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
