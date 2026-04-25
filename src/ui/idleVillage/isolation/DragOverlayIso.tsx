/**
 * Drag Overlay Isolation Page
 * 
 * Tests CustomDragOverlay component independently:
 * - Drag start shows WanderlustMedalOverlay
 * - Drag move follows cursor
 * - Drag end on valid area triggers flight
 * - Drag end on invalid area returns to roster
 */

import { useState, useCallback } from 'react';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';
import { useSlotDebugVisualization } from '@/ui/idleVillage/hooks/useSlotDebugVisualization';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';

// Mock residents
const mockResidents = [
  {
    id: 'resident-1',
    name: 'Aurora Calder',
    portraitUrl: '/portraits/aurora.jpg',
    aiBehavior: 'generalist' as const,
    statBlock: {
      hp: 150,
      strength: 6,
      endurance: 5,
      agility: 4,
      intelligence: 3,
      perception: 3,
    },
    status: 'available' as const,
    fatigue: 0,
    currentHp: 150,
    maxHp: 150,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
  {
    id: 'resident-2',
    name: 'Marcus Stone',
    portraitUrl: '/portraits/marcus.jpg',
    aiBehavior: 'warrior' as const,
    statBlock: {
      hp: 180,
      strength: 8,
      endurance: 7,
      agility: 3,
      intelligence: 2,
      perception: 4,
    },
    status: 'available' as const,
    fatigue: 0,
    currentHp: 180,
    maxHp: 180,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
];

interface DragVisualState {
  mode: 'idle' | 'dragging';
  residentId: string | null;
}

export default function DragOverlayIso() {
  const [dragVisualState, setDragVisualState] = useState<DragVisualState>({ mode: 'idle', residentId: null });
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [flightAnimation, setFlightAnimation] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  
  const { settings: debugSettings, isHydrated, toggleEnabled } = useSlotDebugVisualization();

  const residentsById = mockResidents.reduce((acc, resident) => {
    acc[resident.id] = resident;
    return acc;
  }, {} as Record<string, typeof mockResidents[0]>);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setDragVisualState({
      mode: 'dragging',
      residentId: active.id as string,
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      // Drag ended outside any droppable area - return to roster
      setFlightAnimation({
        from: { x: 100, y: 100 }, // Mock cursor position
        to: { x: 50, y: 50 },   // Mock roster position
      });
      
      setTimeout(() => {
        setFlightAnimation(null);
      }, 160); // Flight duration
    } else {
      // Valid drop
      setDropTarget(over.id as string);
      setFlightAnimation({
        from: { x: 100, y: 100 }, // Mock cursor position
        to: { x: 200, y: 150 },  // Mock slot position
      });
      
      setTimeout(() => {
        setFlightAnimation(null);
      }, 160);
    }
    
    // Reset drag state
    setDragVisualState({ mode: 'idle', residentId: null });
  }, []);

  const activeResident = dragVisualState.residentId ? residentsById[dragVisualState.residentId] : null;

  return (
    <StyleLabSurface variant="panel" className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <StyleLabStack spacing="lg" className="w-full">
        {/* Header */}
        <StyleLabSurface variant="card" className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">Drag Overlay Isolation</h1>
          <p className="text-slate-400 mt-2">Test CustomDragOverlay component independently</p>
        </StyleLabSurface>

        {/* Controls */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Debug Visualization */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Debug Visualization
              </label>
              <button
                onClick={toggleEnabled}
                disabled={!isHydrated}
                className={`px-4 py-2 rounded text-sm ${
                  !isHydrated
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : debugSettings?.enabled
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {!isHydrated ? 'Loading...' : debugSettings?.enabled ? 'Debug ON' : 'Debug OFF'}
              </button>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Drag State
              </label>
              <div className="text-slate-100 font-mono">
                {dragVisualState.mode === 'dragging' ? 
                  `Dragging: ${dragVisualState.residentId}` : 
                  'Idle'
                }
              </div>
            </div>
          </div>
        </StyleLabSurface>

        {/* Drag Area */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Drag Area</h3>
          
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {/* Mock Roster */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Mock Roster (Drag from here)</h4>
                <div className="flex gap-2">
                  {mockResidents.map((resident) => (
                    <div
                      key={resident.id}
                      data-draggable-id={resident.id}
                      className="bg-slate-700 rounded-lg p-3 cursor-grab hover:bg-slate-600 transition-colors"
                      draggable
                      onDragStart={(e) => {
                        // Simulate dnd-kit drag start
                        handleDragStart({
                          active: { id: resident.id, data: {} },
                        } as DragStartEvent);
                      }}
                    >
                      <div className="text-sm text-slate-100">{resident.name}</div>
                      <div className="text-xs text-slate-400">HP: {resident.statBlock.hp}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock Drop Zones */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="bg-green-900/30 border-2 border-green-600 rounded-lg p-4 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropTarget('valid-slot');
                    handleDragEnd({
                      active: { id: dragVisualState.residentId || '', data: {} },
                      over: { id: 'valid-slot', data: {} },
                    } as DragEndEvent);
                  }}
                >
                  <div className="text-green-400 font-medium">Valid Drop Zone</div>
                  <div className="text-xs text-green-300 mt-1">Drag here for valid assignment</div>
                </div>
                
                <div
                  className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropTarget('invalid-area');
                    handleDragEnd({
                      active: { id: dragVisualState.residentId || '', data: {} },
                      over: null,
                    } as DragEndEvent);
                  }}
                >
                  <div className="text-red-400 font-medium">Invalid Drop Zone</div>
                  <div className="text-xs text-red-300 mt-1">Drag here for return to roster</div>
                </div>
              </div>
            </div>

            {/* Drag Overlay */}
            <CustomDragOverlay
              residentsById={residentsById}
              usePgCardPreview={false} // Use medal preview
              dragVisualState={dragVisualState}
            />
          </DndContext>
        </StyleLabSurface>

        {/* State Information */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">State Information</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Drag Mode:</span>
              <div className="text-slate-100 font-mono">{dragVisualState.mode}</div>
            </div>
            <div>
              <span className="text-slate-400">Active ID:</span>
              <div className="text-slate-100 font-mono">{dragVisualState.residentId || 'None'}</div>
            </div>
            <div>
              <span className="text-slate-400">Drop Target:</span>
              <div className="text-slate-100 font-mono">{dropTarget || 'None'}</div>
            </div>
            <div>
              <span className="text-slate-400">Flight Animation:</span>
              <div className="text-slate-100 font-mono">{flightAnimation ? 'Active' : 'None'}</div>
            </div>
            <div>
              <span className="text-slate-400">Active Resident:</span>
              <div className="text-slate-100 font-mono">{activeResident?.name || 'None'}</div>
            </div>
            <div>
              <span className="text-slate-400">Debug:</span>
              <div className="text-slate-100 font-mono">{debugSettings?.enabled ? 'On' : 'Off'}</div>
            </div>
          </div>
        </StyleLabSurface>

        {/* Manual Overlay Preview */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Manual Overlay Preview</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setDragVisualState({ mode: 'dragging', residentId: 'resident-1' })}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Show Aurora Overlay
              </button>
              <button
                onClick={() => setDragVisualState({ mode: 'dragging', residentId: 'resident-2' })}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Show Marcus Overlay
              </button>
              <button
                onClick={() => setDragVisualState({ mode: 'idle', residentId: null })}
                className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm"
              >
                Hide Overlay
              </button>
            </div>
            
            <div className="flex justify-center p-8 bg-slate-800/30 rounded-lg">
              <div style={{ transform: 'translate(-50%, -50%)' }}>
                <CustomDragOverlay
                  residentsById={residentsById}
                  usePgCardPreview={false}
                  dragVisualState={dragVisualState}
                />
              </div>
            </div>
          </div>
        </StyleLabSurface>
      </StyleLabStack>
    </StyleLabSurface>
  );
}
