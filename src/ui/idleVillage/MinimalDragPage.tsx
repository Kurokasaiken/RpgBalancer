/**
 * MinimalDragPage — Fase 4: Drag-and-Drop Integration Test
 *
 * Pagina per testare drag-and-drop dal Roster ai Slot.
 * Una sola pagina con VillageRosterSection + ResidentSlotRack.
 *
 * URL: /minimal-drag
 * Purpose: End-to-end drag testing in isolamento da altri sistemi
 */

import React, { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { ResidentSlotRack } from '@/ui/idleVillage/roster';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

// Mock residents for drag testing
const MOCK_RESIDENTS_DRAG: ResidentState[] = [
  {
    id: 'res-1-drag',
    name: 'Alice Shadowblade',
    type: 'hero',
    level: 1,
    hp: 25,
    maxHp: 25,
    fatigue: 2,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/alice.jpg',
    statSnapshot: { strength: 14, perception: 13, wisdom: 10, charisma: 12, rarity: 1 },
  },
  {
    id: 'res-2-drag',
    name: 'Borin Stonefist',
    type: 'artisan',
    level: 2,
    hp: 30,
    maxHp: 30,
    fatigue: 5,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/borin.jpg',
    statSnapshot: { strength: 15, perception: 10, wisdom: 12, charisma: 8, rarity: 2 },
  },
  {
    id: 'res-3-drag',
    name: 'Cleric Mending',
    type: 'hero',
    level: 3,
    hp: 28,
    maxHp: 28,
    fatigue: 3,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/cleric.jpg',
    statSnapshot: { strength: 10, perception: 11, wisdom: 16, charisma: 14, rarity: 2 },
  },
  {
    id: 'res-4-drag',
    name: 'Druid Leafwhisper',
    type: 'artisan',
    level: 2,
    hp: 26,
    maxHp: 26,
    fatigue: 4,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/druid.jpg',
    statSnapshot: { strength: 12, perception: 13, wisdom: 14, charisma: 13, rarity: 2 },
  },
  {
    id: 'res-5-drag',
    name: 'Rogue Nightstalker',
    type: 'hero',
    level: 1,
    hp: 22,
    maxHp: 22,
    fatigue: 1,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/rogue.jpg',
    statSnapshot: { strength: 11, perception: 16, wisdom: 9, charisma: 10, rarity: 1 },
  },
];

// Mock slots for drag testing
const MOCK_SLOTS_DRAG: ResidentSlotViewModel[] = [
  {
    id: 'slot-job-0-drag',
    state: 'empty',
    occupantId: null,
    activityId: 'job-woodcutting',
    activityLabel: 'Taglia Legna',
    displayRole: 'job',
  },
  {
    id: 'slot-job-1-drag',
    state: 'empty',
    occupantId: null,
    activityId: 'job-blacksmith',
    activityLabel: 'Forgia',
    displayRole: 'job',
  },
  {
    id: 'slot-quest-0-drag',
    state: 'empty',
    occupantId: null,
    activityId: 'quest-forest-hunt',
    activityLabel: 'Missione: Caccia',
    displayRole: 'quest',
  },
  {
    id: 'slot-quest-1-drag',
    state: 'empty',
    occupantId: null,
    activityId: 'quest-collect',
    activityLabel: 'Raccolta Materiali',
    displayRole: 'quest',
  },
];

export function MinimalDragPage() {
  const [residents, setResidents] = useState<ResidentState[]>(MOCK_RESIDENTS_DRAG);
  const [slots, setSlots] = useState<ResidentSlotViewModel[]>(MOCK_SLOTS_DRAG);
  const [sortMode, setSortMode] = useState<'name-asc' | 'name-desc' | 'rarity-desc' | 'status-available'>('name-asc');
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [draggedResidentId, setDraggedResidentId] = useState<string | null>(null);
  const [lastDragEvent, setLastDragEvent] = useState<string>('(no drag yet)');

  /**
   * Handle drag end event
   * This simulates what happens when resident is dropped on a slot
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      // Drag cancelled or dropped outside
      setLastDragEvent(`Drag cancelled: ${active.id}`);
      setDraggedResidentId(null);
      return;
    }

    const residentId = active.id as string;
    const slotId = over.id as string;

    setLastDragEvent(`Dropped ${residentId} on ${slotId}`);

    // Find the resident and slot
    const resident = residents.find((r) => r.id === residentId);
    const slotIndex = slots.findIndex((s) => s.id === slotId);

    if (resident && slotIndex >= 0) {
      // Update resident: assign to slot
      const updatedResidents = residents.map((r) =>
        r.id === residentId ? { ...r, assignedSlot: slotId, isBusy: true } : r
      );

      // Update slot: occupy with resident
      const updatedSlots = [...slots];
      updatedSlots[slotIndex] = {
        ...updatedSlots[slotIndex],
        state: 'occupied',
        occupantId: residentId,
      };

      setResidents(updatedResidents);
      setSlots(updatedSlots);
      setDraggedResidentId(null);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DragProvider>
        <TooltipProvider>
          <div
            style={{
              padding: '20px',
              fontFamily: 'sans-serif',
              backgroundColor: '#f5f5f5',
              minHeight: '100vh',
            }}
          >
            <h1>Fase 4: Drag-and-Drop Integration Test</h1>

            <div style={{ marginBottom: '20px' }}>
              <p>
                <strong>Last Event:</strong> {lastDragEvent}
              </p>
              {selectedResident && (
                <p>
                  <strong>Selected Resident:</strong> {selectedResident}
                </p>
              )}
              {draggedResidentId && (
                <p style={{ color: 'red' }}>
                  <strong>Currently Dragging:</strong> {draggedResidentId}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              {/* ROSTER SECTION */}
              <div style={{ border: '2px solid #333', padding: '15px', borderRadius: '8px' }}>
                <h2>Village Roster (Draggable)</h2>
                <VillageRosterSection
                  residents={residents}
                  sortMode={sortMode}
                  onSortModeChange={setSortMode}
                  onResidentSelect={setSelectedResident}
                  componentId="drag-page-roster"
                  data-testid="drag-page-roster"
                />
              </div>

              {/* SLOT SECTION */}
              <div style={{ border: '2px solid #333', padding: '15px', borderRadius: '8px' }}>
                <h2>Activity Slots (Drop Targets)</h2>
                <ResidentSlotRack
                  slots={slots}
                  layout="board"
                  onSlotClick={(slotId) => console.log('Slot clicked:', slotId)}
                  data-testid="drag-page-slots"
                />
              </div>
            </div>

            {/* DEBUG TABLE */}
            <div style={{ marginTop: '20px' }}>
              <h3>Residents State</h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '20px',
                  backgroundColor: 'white',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>ID</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>Assigned Slot</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>Is Busy</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{r.id}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{r.name}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{r.assignedSlot || '(none)'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{r.isBusy ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3>Slots State</h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>ID</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>State</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>Occupant ID</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #999' }}>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{s.id}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{s.state}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{s.occupantId || '(empty)'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{s.activityLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TooltipProvider>
      </DragProvider>
    </DndContext>
  );
}
