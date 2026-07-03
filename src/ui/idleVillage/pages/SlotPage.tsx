import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { SlotV12Renderer } from '@/ui/idleVillage/components/SlotV12Renderer';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { canonicalResidentData } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import { FlightProxy } from '@/ui/idleVillage/components/FlightProxy';

type DragVisualState =
  | { mode: 'idle' }
  | { mode: 'dragging'; residentId: string }
  | { mode: 'flight'; residentId: string; fromX: number; fromY: number; toX: number; toY: number; slotId: string; isInset: boolean }
  | { mode: 'returning'; residentId: string };

function DroppableSlot({ isOccupied, portraitUrl, extractionProgress, isExtracting, isFlight, onExtractionPointerDown, onExtractionPointerUp }: { isOccupied: boolean; portraitUrl?: string | null; extractionProgress: number; isExtracting: boolean; isFlight: boolean; onExtractionPointerDown?: () => void; onExtractionPointerUp?: () => void }) {
  const { setNodeRef, isOver: _isOver } = useDroppable({
    id: 'test-slot',
    data: { type: 'slot', slotId: 'test-slot' }
  });

  return (
    <div ref={setNodeRef} className="flex flex-col items-center gap-4" data-slot-id="test-slot" style={{ background: 'transparent !important' }}>
      <div className="text-sm text-slate-400">SlotV12Renderer (Slot)</div>
      <div 
        className="relative" 
        style={{ background: 'transparent !important' }}
        onPointerDown={onExtractionPointerDown}
        onPointerUp={onExtractionPointerUp}
        onPointerLeave={onExtractionPointerUp}
      >
        <SlotV12Renderer
          letter="Q"
          state={isOccupied ? 'occupied' : 'empty'}
          size={120}
          extractionProgress={isExtracting ? extractionProgress : 0}
          pgTokenVisible={false}
        />
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
      </div>
    </div>
  );
}

export default function SlotPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedResidentId, setDraggedResidentId] = useState<string | null>(null);
  const [isSlotOccupied, setIsSlotOccupied] = useState(false);
  const [_dropState, _setDropState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [dragVisualState, setDragVisualState] = useState<DragVisualState>({ mode: 'idle' });
  
  // Extraction state (simplified like ResidentSlotRack)
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const extractionTimerRef = useRef<number | null>(null);
  const extractionTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const flightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load real heroes with portraits
  const residents = useMemo(() => canonicalResidentData(20), []);
  const selectedResident = residents[0] || null;

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
    setIsExtracting(false);
    setExtractionProgress(0);
    // Reset drag visual state to idle - this resets dragFeedbackState to 'idle'
    setDragVisualState({ mode: 'idle' });
  }, [setIsSlotOccupied]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const residentId = event.active.id as string;
    setIsDragging(true);
    setDraggedResidentId(residentId);
    setDragVisualState({ mode: 'dragging', residentId });
  }, []);

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
        // Use center of screen as fallback for from coordinates
        const fromX = window.innerWidth / 2;
        const fromY = window.innerHeight / 2;
        
        setDragVisualState({
          mode: 'flight',
          residentId: selectedResident.id,
          fromX,
          fromY,
          toX: slotRect.left + slotRect.width / 2,
          toY: slotRect.top + slotRect.height / 2,
          slotId: 'test-slot',
          isInset: true
        });
      }
    } else {
      // Invalid drop - trigger returning animation
      if (selectedResident) {
        setDragVisualState({ mode: 'returning', residentId: selectedResident.id });
      }
    }
  }, [selectedResident]);

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
      const flightState = {
        mode: 'flight' as const,
        residentId: selectedResident.id,
        fromX: cardRect.left + cardRect.width / 2,
        fromY: cardRect.top + cardRect.height / 2,
        toX: slotRect.left + slotRect.width / 2,
        toY: slotRect.top + slotRect.height / 2,
        slotId: 'test-slot',
        isInset: true
      };
      console.log('Setting dragVisualState to:', flightState);
      setDragVisualState(flightState);
    } else {
      console.log('MISSING RECTS: cannot start flight');
    }
  }, [isSlotOccupied, selectedResident]);

  // Clear extraction timeouts
  const clearExtractionTimeouts = useCallback(() => {
    extractionTimeoutsRef.current.forEach(id => clearTimeout(id));
    extractionTimeoutsRef.current = [];
  }, []);


  // Schedule extraction timeout
  // Test page without SandboxTimingProvider - using setTimeout directly
  /* eslint-disable no-restricted-globals */
  const scheduleExtractionTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      callback();
      extractionTimeoutsRef.current = extractionTimeoutsRef.current.filter(t => t !== id);
    }, delay);
    extractionTimeoutsRef.current.push(id);
  }, []);
  /* eslint-enable no-restricted-globals */

  // Simulate extraction animation (spring-back) with press-and-hold
  const handleExtractionPointerDown = useCallback(() => {
    if (!isSlotOccupied || !selectedResident) return;
    setIsExtracting(true);
    setExtractionProgress(0);
    clearExtractionTimeouts();
    
    const startTime = Date.now();
    const EXTRACTION_DURATION = 560; // Matches CSS transition
    
    extractionTimerRef.current = requestAnimationFrame(function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / EXTRACTION_DURATION, 1);
      setExtractionProgress(progress);
      
      if (progress < 1) {
        extractionTimerRef.current = requestAnimationFrame(animate);
      } else {
        extractionTimerRef.current = null;
        
        // Wait for bezel animation to complete before spring animation
        scheduleExtractionTimeout(() => {
          // Spring animation effect - briefly overshoot then settle
          setExtractionProgress(1.2);
          
          scheduleExtractionTimeout(() => {
            // Clear the slot PG token BEFORE setting extractionProgress to 1.0
            // This ensures the token is hidden before any animation starts
            setIsSlotOccupied(false);
            
            setExtractionProgress(1.0);
            
            // Trigger flight animation after spring completes
            const slotElement = document.querySelector('[data-slot-id="test-slot"]');
            const cardElement = document.querySelector('[data-dnd-id="pg-card"]');
            const slotRect = slotElement?.getBoundingClientRect();
            const cardRect = cardElement?.getBoundingClientRect();
            
            if (slotRect && cardRect) {
              setDragVisualState({
                mode: 'flight',
                residentId: selectedResident.id,
                fromX: slotRect.left + slotRect.width / 2,
                fromY: slotRect.top + slotRect.height / 2,
                toX: cardRect.left + cardRect.width / 2,
                toY: cardRect.top + cardRect.height / 2,
                slotId: 'test-slot',
                isInset: false
              });
            }
          }, 300);
        }, 560);
      }
    });
  }, [isSlotOccupied, selectedResident, clearExtractionTimeouts, scheduleExtractionTimeout]);

  // Auto-play full extraction animation (for button click)
  const simulateExtraction = useCallback(() => {
    if (!isSlotOccupied || !selectedResident) return;
    setIsExtracting(true);
    setExtractionProgress(0);
    clearExtractionTimeouts();
    
    const startTime = Date.now();
    const EXTRACTION_DURATION = 560; // Matches CSS transition
    
    extractionTimerRef.current = requestAnimationFrame(function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / EXTRACTION_DURATION, 1);
      setExtractionProgress(progress);
      
      if (progress < 1) {
        extractionTimerRef.current = requestAnimationFrame(animate);
      } else {
        extractionTimerRef.current = null;
        
        // Wait for bezel animation to complete before spring animation
        scheduleExtractionTimeout(() => {
          // Spring animation effect - briefly overshoot then settle
          setExtractionProgress(1.2);
          
          scheduleExtractionTimeout(() => {
            // Clear the slot PG token BEFORE setting extractionProgress to 1.0
            setIsSlotOccupied(false);
            
            setExtractionProgress(1.0);
            
            // Trigger flight animation after spring completes
            const slotElement = document.querySelector('[data-slot-id="test-slot"]');
            const cardElement = document.querySelector('[data-dnd-id="pg-card"]');
            const slotRect = slotElement?.getBoundingClientRect();
            const cardRect = cardElement?.getBoundingClientRect();
            
            if (slotRect && cardRect) {
              setDragVisualState({
                mode: 'flight',
                residentId: selectedResident.id,
                fromX: slotRect.left + slotRect.width / 2,
                fromY: slotRect.top + slotRect.height / 2,
                toX: cardRect.left + cardRect.width / 2,
                toY: cardRect.top + cardRect.height / 2,
                slotId: 'test-slot',
                isInset: false
              });
            }
          }, 300);
        }, 560);
      }
    });
  }, [isSlotOccupied, selectedResident, clearExtractionTimeouts, scheduleExtractionTimeout]);

  const handleExtractionPointerUp = useCallback(() => {
    if (extractionTimerRef.current) {
      cancelAnimationFrame(extractionTimerRef.current);
      extractionTimerRef.current = null;
    }
    clearExtractionTimeouts();
    
    // Animate back to closed position from current progress
    const currentProgress = extractionProgress;
    const startTime = Date.now();
    const duration = 300; // Quick close animation
    
    const animateClose = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const newProgress = currentProgress * (1 - t);
      setExtractionProgress(newProgress);
      
      if (t < 1) {
        requestAnimationFrame(animateClose);
      } else {
        setIsExtracting(false);
        setExtractionProgress(0);
      }
    };
    
    requestAnimationFrame(animateClose);
  }, [extractionProgress, clearExtractionTimeouts]);

  return (
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
                  <div data-dnd-id="pg-card" className={dragVisualState.mode === 'flight' ? 'opacity-30 pointer-events-none' : ''}>
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

            {/* FlightProxy Layer - Premium handoff animation */}
            {dragVisualState.mode === 'flight' && (
              <FlightProxy
                residentId={dragVisualState.residentId}
                fromX={dragVisualState.fromX}
                fromY={dragVisualState.fromY}
                toX={dragVisualState.toX}
                toY={dragVisualState.toY}
                slotId={dragVisualState.slotId}
                onComplete={handleFlightComplete}
                residentsById={selectedResident ? { [selectedResident.id]: selectedResident } : {}}
                isInset={dragVisualState.isInset}
              />
            )}
          </div>

          <footer className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            <p>Slot Animation Test · Idle Village</p>
          </footer>
        </div>
      </div>
      </DragProvider>
    </TooltipProvider>
  );
}
