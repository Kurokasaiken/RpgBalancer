import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { Slot } from '@/ui/idleVillage/components/Slot';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { V9TooltipProvider } from '@/ui/v9-skin/V9Tooltip';
import { canonicalResidentData } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import { useDragOutcome } from '@/ui/idleVillage/interaction/useDragOutcome';
import { useExtractionSequence } from '@/ui/idleVillage/interaction/useExtractionSequence';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { getBloomStyle } from '@/ui/idleVillage/interaction/bloomEffect';

function DroppableSlot({ isOccupied, portraitUrl, extractionProgress, isExtracting, isFlight, bloom = 'idle', onExtractionPointerDown, onExtractionPointerUp }: { isOccupied: boolean; portraitUrl?: string | null; extractionProgress: number; isExtracting: boolean; isFlight: boolean; bloom?: 'idle' | 'valid' | 'invalid'; onExtractionPointerDown?: () => void; onExtractionPointerUp?: () => void }) {
  const { setNodeRef, isOver: _isOver } = useDroppable({
    id: 'test-slot',
    data: { type: 'slot', slotId: 'test-slot' }
  });

  return (
    <div ref={setNodeRef} className="flex flex-col items-center gap-4" data-slot-id="test-slot" style={{ background: 'transparent !important' }}>
      <div className="text-sm text-slate-400">SlotV12Renderer (Slot)</div>
      <Slot
        tooltip="Slot"
        slotProps={{
          letter: 'Q',
          state: isOccupied ? 'occupied' : 'empty',
          sizePx: 120,
          extractionProgress: isExtracting ? extractionProgress : 0,
          pgTokenVisible: false,
        }}
        wrapperProps={{
          className: 'relative',
          style: { background: 'transparent !important', ...getBloomStyle(bloom, 120) },
          onPointerDown: onExtractionPointerDown,
          onPointerUp: onExtractionPointerUp,
          onPointerLeave: onExtractionPointerUp,
        }}
      >
        {isOccupied && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${isFlight ? 'opacity-30' : ''}`}>
            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/70 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-50">
                {portraitUrl ? (
                  <img src={portraitUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>PG</span>
                )}
              </span>
            </div>
          </div>
        )}
      </Slot>
    </div>
  );
}

export default function SlotPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedResidentId, setDraggedResidentId] = useState<string | null>(null);
  const [isSlotOccupied, setIsSlotOccupied] = useState(false);
  const [_dropState, _setDropState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  // Shared drag-outcome state machine (idle → dragging → flight|returning → idle)
  const { state: dragVisualState, startDrag, startFlight, springBack, settle } = useDragOutcome();
  
  // Extraction choreography — single shared implementation (certified here)
  const extraction = useExtractionSequence({
    onExtracted: () => {
      // Clear the slot PG token, then fly the token back to the card
      setIsSlotOccupied(false);
      const slotRect = document.querySelector('[data-slot-id="test-slot"]')?.getBoundingClientRect();
      const cardRect = document.querySelector('[data-dnd-id="pg-card"]')?.getBoundingClientRect();
      if (slotRect && cardRect && selectedResidentRef.current) {
        startFlight({
          residentId: selectedResidentRef.current.id,
          fromX: slotRect.left + slotRect.width / 2,
          fromY: slotRect.top + slotRect.height / 2,
          toX: cardRect.left + cardRect.width / 2,
          toY: cardRect.top + cardRect.height / 2,
          slotId: 'test-slot',
          isInset: false,
        });
      }
    },
  });
  const isExtracting = extraction.isExtracting;
  const extractionProgress = extraction.progress;

  // Load real heroes with portraits
  const residents = useMemo(() => canonicalResidentData(20), []);
  const selectedResident = residents[0] || null;
  const selectedResidentRef = useRef(selectedResident);
  selectedResidentRef.current = selectedResident;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle flight animation completion
  const handleFlightComplete = useCallback((residentId: string, slotId?: string, isInset?: boolean) => {
    console.log('=== FLIGHT COMPLETE ===');
    console.log('residentId:', residentId);
    console.log('slotId:', slotId);
    console.log('isInset:', isInset);
    
    // Use the isInset flag to determine if this was incastonamento or estrazione
    if (isInset) {
      // Incastonamento: mark slot as occupied
      console.log('Setting isSlotOccupied to TRUE (incastonamento)');
      setIsSlotOccupied(true);
    } else {
      // Estrazione: mark slot as empty
      console.log('Setting isSlotOccupied to FALSE (estrazione)');
      setIsSlotOccupied(false);
    }
    
    // Always clear extraction state after flight completes
    extraction.reset();
    // Reset drag visual state to idle - this resets dragFeedbackState to 'idle'
    settle();
  }, [setIsSlotOccupied, settle, extraction]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const residentId = event.active.id as string;
    setIsDragging(true);
    setDraggedResidentId(residentId);
    startDrag(residentId);
  }, [startDrag]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false);
    setDraggedResidentId(null);
    _setDropState('idle');

    const { over } = event;
    if (over && over.id === 'test-slot') {
      // Valid drop - trigger flight animation (incastonamento)
      const slotElement = document.querySelector('[data-slot-id="test-slot"]');
      const slotRect = slotElement?.getBoundingClientRect();
      
      if (slotRect && selectedResident) {
        // Origin resolved by the hook: the actual pointer release position
        startFlight({
          residentId: selectedResident.id,
          toX: slotRect.left + slotRect.width / 2,
          toY: slotRect.top + slotRect.height / 2,
          slotId: 'test-slot',
          isInset: true
        });
      }
    } else {
      // Invalid drop - spring-back, then the hook resets to idle so the card
      // becomes available/interactive again
      if (selectedResident) {
        springBack(selectedResident.id);
      }
    }
  }, [selectedResident, startFlight, springBack]);

  // Simulate drop animation (incastonamento)
  const simulateDrop = useCallback(() => {
    console.log('=== SIMULATE DROP CALLED ===');
    console.log('isSlotOccupied:', isSlotOccupied);
    console.log('selectedResident:', selectedResident);
    
    if (isSlotOccupied || !selectedResident) {
      console.log('EARLY RETURN: slot occupied or no resident');
      return;
    }
    
    // Get coordinates for flight animation
    const cardElement = document.querySelector('[data-dnd-id="pg-card"]');
    const slotElement = document.querySelector('[data-slot-id="test-slot"]');
    const cardRect = cardElement?.getBoundingClientRect();
    const slotRect = slotElement?.getBoundingClientRect();
    
    console.log('cardRect:', cardRect);
    console.log('slotRect:', slotRect);
    
    if (cardRect && slotRect) {
      startFlight({
        residentId: selectedResident.id,
        fromX: cardRect.left + cardRect.width / 2,
        fromY: cardRect.top + cardRect.height / 2,
        toX: slotRect.left + slotRect.width / 2,
        toY: slotRect.top + slotRect.height / 2,
        slotId: 'test-slot',
        isInset: true
      });
    } else {
      console.log('MISSING RECTS: cannot start flight');
    }
  }, [isSlotOccupied, selectedResident, startFlight]);

  // Press-and-hold extraction (shared sequence)
  const handleExtractionPointerDown = useCallback(() => {
    if (!isSlotOccupied || !selectedResident) return;
    extraction.start();
  }, [isSlotOccupied, selectedResident, extraction]);

  // Auto-play full extraction animation (for button click)
  const simulateExtraction = useCallback(() => {
    if (!isSlotOccupied || !selectedResident) return;
    extraction.start();
  }, [isSlotOccupied, selectedResident, extraction]);

  const handleExtractionPointerUp = useCallback(() => {
    extraction.cancel();
  }, [extraction]);

  return (
    <V9TooltipProvider>
      <TooltipProvider>
        <DragProvider>
          <div className="min-h-screen p-8" style={{ backgroundColor: '#ffffff' }}>
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-amber-200">
              Slot Animation Test
            </h1>
            <p className="text-sm text-slate-400">
              Test animazioni incastonamento ed estrazione PgCard
            </p>
          </header>

          <div className="mb-8 flex gap-4 justify-center">
            <button
              onClick={simulateDrop}
              disabled={isDragging || isSlotOccupied}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              Simula Incastonamento
            </button>
            <button
              onClick={simulateExtraction}
              disabled={isDragging || !isSlotOccupied}
              className="px-6 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              Simula Estrazione
            </button>
          </div>

          <div className="flex items-center justify-center gap-16 min-h-[400px]">
            {/* PgCard - Draggable */}
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm text-slate-400">PgCard (Draggable)</div>
                {selectedResident && (
                  <div
                    data-dnd-id="pg-card"
                    className={dragVisualState.mode === 'flight' ? 'opacity-30 pointer-events-none' : ''}
                    onClick={() => {
                      // Click-to-assign: if the visible slot can accept the pg right now,
                      // auto-inset with the same flight animation as a drop
                      if (!isDragging && !isSlotOccupied && dragVisualState.mode === 'idle') {
                        simulateDrop();
                      }
                    }}
                  >
                    <PgCard
                      workerId={selectedResident.id}
                      label={selectedResident.displayName}
                      hp={selectedResident.currentHp}
                      fatigue={selectedResident.fatigue}
                      maxHp={selectedResident.maxHp}
                      isDragging={isDragging}
                      disabled={isSlotOccupied}
                      portraitUrl={selectedResident.portraitUrl}
                      className={isSlotOccupied ? 'opacity-30' : ''}
                      dragFeedbackState={dragVisualState.mode === 'returning' ? 'returning' : 'idle'}
                    />
                  </div>
                )}
              </div>

              {/* SlotV12Renderer - Slot */}
              <DroppableSlot
                bloom={isDragging && !isSlotOccupied ? 'valid' : 'idle'}
                isOccupied={isSlotOccupied} 
                portraitUrl={selectedResident?.portraitUrl} 
                extractionProgress={extractionProgress}
                isExtracting={isExtracting}
                isFlight={dragVisualState.mode === 'flight'}
                onExtractionPointerDown={handleExtractionPointerDown}
                onExtractionPointerUp={handleExtractionPointerUp}
              />

              {/* CustomDragOverlay - hide during extraction animation */}
              {!isExtracting && (
                <CustomDragOverlay
                  residentsById={selectedResident ? { [selectedResident.id]: selectedResident } : {}}
                  usePgCardPreview={true}
                  dragVisualState={{
                    mode: isDragging ? 'dragging' : 'idle',
                    residentId: draggedResidentId,
                  }}
                />
              )}
            </DndContext>

            {/* FlightProxy Layer - Premium handoff animation (shared renderer) */}
            <DragOutcomeFlight
              state={dragVisualState}
              residentsById={selectedResident ? { [selectedResident.id]: selectedResident } : {}}
              onComplete={handleFlightComplete}
            />
          </div>

          <footer className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            <p>Slot Animation Test · Idle Village</p>
          </footer>
        </div>
      </div>
        </DragProvider>
      </TooltipProvider>
    </V9TooltipProvider>
  );
}
