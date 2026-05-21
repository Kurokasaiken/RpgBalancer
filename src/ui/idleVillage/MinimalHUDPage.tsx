/**
 * MinimalHUDPage — Fase 6: Full Gameplay Loop with StatusHUD
 *
 * Pagina completa con Roster, SlotRack, Timer, e StatusHUD.
 * Integra tutte le fasi precedenti in un'esperienza di gioco coerente.
 *
 * URL: /minimal-hud
 * Purpose: Full gameplay loop - drag, assign, timer, complete, reward
 */

import React, { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { ResidentSlotRack } from '@/ui/idleVillage/roster';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

// Mock residents
const MOCK_RESIDENTS_FULL: ResidentState[] = [
  {
    id: 'res-full-1',
    name: 'Alice',
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
    id: 'res-full-2',
    name: 'Borin',
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
];

// Mock slots
const MOCK_SLOTS_FULL: ResidentSlotViewModel[] = [
  {
    id: 'slot-full-job-0',
    state: 'empty',
    occupantId: null,
    activityId: 'job-woodcutting',
    activityLabel: 'Taglia Legna',
    displayRole: 'job',
  },
  {
    id: 'slot-full-job-1',
    state: 'empty',
    occupantId: null,
    activityId: 'job-blacksmith',
    activityLabel: 'Forgia',
    displayRole: 'job',
  },
];

// HUD State
interface GameState {
  resources: {
    wood: number;
    metal: number;
    experience: number;
  };
  completedActivities: number;
  failedActivities: number;
  elapsedTime: number;
}

export function MinimalHUDPage() {
  const [residents, setResidents] = useState<ResidentState[]>(MOCK_RESIDENTS_FULL);
  const [slots, setSlots] = useState<ResidentSlotViewModel[]>(MOCK_SLOTS_FULL);
  const [sortMode, setSortMode] = useState<'name-asc' | 'name-desc' | 'rarity-desc' | 'status-available'>('name-asc');
  const [gameState, setGameState] = useState<GameState>({
    resources: { wood: 0, metal: 0, experience: 0 },
    completedActivities: 0,
    failedActivities: 0,
    elapsedTime: 0,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const residentId = active.id as string;
    const slotId = over.id as string;

    const resident = residents.find((r) => r.id === residentId);
    const slotIndex = slots.findIndex((s) => s.id === slotId);

    if (resident && slotIndex >= 0) {
      const updatedResidents = residents.map((r) =>
        r.id === residentId ? { ...r, assignedSlot: slotId, isBusy: true } : r
      );

      const updatedSlots = [...slots];
      updatedSlots[slotIndex] = {
        ...updatedSlots[slotIndex],
        state: 'occupied',
        occupantId: residentId,
      };

      setResidents(updatedResidents);
      setSlots(updatedSlots);
    }
  };

  // Simulate activity completion
  const completeActivity = () => {
    setGameState((prev) => ({
      ...prev,
      completedActivities: prev.completedActivities + 1,
      resources: {
        ...prev.resources,
        wood: prev.resources.wood + Math.random() > 0.5 ? 10 : 5,
        experience: prev.resources.experience + 50,
      },
    }));

    // Reset first slot
    const updatedResidents = residents.map((r) =>
      r.id === slots[0].occupantId ? { ...r, assignedSlot: null, isBusy: false } : r
    );

    const updatedSlots = [...slots];
    updatedSlots[0] = {
      ...updatedSlots[0],
      state: 'empty',
      occupantId: null,
    };

    setResidents(updatedResidents);
    setSlots(updatedSlots);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DragProvider>
        <TooltipProvider>
          <div
            style={{
              padding: '20px',
              fontFamily: 'sans-serif',
              backgroundColor: '#f0f0f0',
              minHeight: '100vh',
            }}
          >
            <h1>Fase 6: Full Gameplay Loop with StatusHUD</h1>

            {/* HUD SECTION */}
            <div
              style={{
                border: '3px solid #333',
                padding: '15px',
                marginBottom: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
              }}
            >
              <h2>Status HUD</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '15px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <strong>Wood</strong>
                  <div style={{ fontSize: '24px', color: '#8B4513' }}>{gameState.resources.wood}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Metal</strong>
                  <div style={{ fontSize: '24px', color: '#C0C0C0' }}>{gameState.resources.metal}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>XP</strong>
                  <div style={{ fontSize: '24px', color: '#FFD700' }}>{gameState.resources.experience}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Completed</strong>
                  <div style={{ fontSize: '24px', color: '#4CAF50' }}>{gameState.completedActivities}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>Failed</strong>
                  <div style={{ fontSize: '24px', color: '#F44336' }}>{gameState.failedActivities}</div>
                </div>
              </div>
              <button
                onClick={completeActivity}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Simulate Activity Completion
              </button>
            </div>

            {/* GAMEPLAY SECTION */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}
            >
              {/* ROSTER */}
              <div
                style={{
                  border: '2px solid #333',
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                }}
              >
                <h2>Village Roster</h2>
                <VillageRosterSection
                  residents={residents}
                  sortMode={sortMode}
                  onSortModeChange={setSortMode}
                  componentId="hud-roster"
                />
              </div>

              {/* SLOTS */}
              <div
                style={{
                  border: '2px solid #333',
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                }}
              >
                <h2>Activity Slots</h2>
                <ResidentSlotRack slots={slots} layout="board" />
              </div>
            </div>

            {/* GAME STATE DEBUG */}
            <div style={{ marginTop: '20px' }}>
              <h3>Game State Debug</h3>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(
                  {
                    residents: residents.map((r) => ({
                      id: r.id,
                      name: r.name,
                      busy: r.isBusy,
                      assignedSlot: r.assignedSlot,
                    })),
                    slots: slots.map((s) => ({
                      id: s.id,
                      state: s.state,
                      occupantId: s.occupantId,
                    })),
                    resources: gameState.resources,
                    activities: {
                      completed: gameState.completedActivities,
                      failed: gameState.failedActivities,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </TooltipProvider>
      </DragProvider>
    </DndContext>
  );
}
