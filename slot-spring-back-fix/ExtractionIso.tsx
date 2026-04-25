/**
 * Extraction Isolation Page
 * 
 * Tests extraction animation sequence with useExtractionStateMachine hook:
 * - Press and hold extraction
 * - Bezel animation timing (560ms)
 * - PG token visibility during phases
 * - Medal fade-out during bezel
 * - Spring-back animation
 * - Cancel extraction
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlotV12Renderer } from '@/ui/idleVillage/components/SlotV12Renderer';
import { SlogProxy } from '@/ui/idleVillage/components/SlogProxy';
import { useExtractionStateMachine } from '@/ui/idleVillage/hooks/useExtractionStateMachine';
import { useSlotDebugVisualization } from '@/ui/idleVillage/hooks/useSlotDebugVisualization';
import { useResidentDragPreview } from '@/ui/idleVillage/hooks/useResidentDragPreview';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { getDragConfig } from '@/ui/idleVillage/config/dragConfig';

interface SlogAnimation {
  id: string;
  residentId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

// Mock resident for testing
const mockResident = {
  id: 'test-resident-1',
  name: 'Test Resident',
  aiBehavior: 'generalist' as const,
  statBlock: {
    hp: 150,
    strength: 6,
    endurance: 5,
    agility: 4,
    intelligence: 3,
    perception: 3,
  },
  equippedSpellIds: [],
  status: 'available' as const,
  fatigue: 0,
  currentHp: 150,
  maxHp: 150,
  isInjured: false,
  isHero: false,
  survivalCount: 0,
  survivalScore: 0,
};

export default function ExtractionIso() {
  const [isAssigned, setIsAssigned] = useState(true);
  const [letter, setLetter] = useState('A');
  const [slogAnimations, setSlogAnimations] = useState<SlogAnimation[]>([]);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const rosterRef = useRef<HTMLDivElement | null>(null);
  const [draggedResidentId, setDraggedResidentId] = useState<string | null>(null);
  const [draggedMedalId, setDraggedMedalId] = useState<string | null>(null);
  
  const { state: extractionState, startExtraction, cancelExtraction, startSlog, _forcePhase } = useExtractionStateMachine();
  const { settings: debugSettings, isHydrated, toggleEnabled } = useSlotDebugVisualization();
  
  // Mock resident assignment
  const assignedResident = isAssigned ? mockResident : null;
  const assignedLabel = assignedResident ? formatResidentLabel(assignedResident) : 'Empty';
  const assignedAvatarUrl = assignedResident ? getResidentPortraitUrl(assignedResident) : null;
  const slogResidentsById = useMemo(() => ({
    [mockResident.id]: {
      ...mockResident,
      portraitUrl: assignedAvatarUrl ?? undefined,
    },
  }), [assignedAvatarUrl]);

  // Generate drag preview for the mock resident (this creates the resident-drag-preview-host element)
  const { isReady: dragPreviewReady } = useResidentDragPreview({
    residentId: mockResident.id,
    label: assignedLabel,
    portraitUrl: assignedAvatarUrl,
    size: 72,
  });
  const assignedInitials = assignedLabel
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();

  // Handle mouse events for extraction
  const handleMouseDown = () => {
    if (isAssigned) {
      startExtraction();
    }
  };

  const handleMouseUp = () => {
    // cancelExtraction now does elastic spring-back (not hard reset)
    cancelExtraction();
  };

  const handleMouseLeave = () => {
    cancelExtraction();
  };

  const [slogPending, setSlogPending] = useState(false);

  const handleSlogMouseDown = () => {
    if (!isAssigned) return;
    // Start the slog animation sequence - SlogProxy will be added when springBack phase starts
    setSlogPending(true);
    startSlog();
  };

  // Trigger SlogProxy when completing phase starts (after the pop, medal flies to roster)
  useEffect(() => {
    if (slogPending && extractionState.phase === 'completing') {
      const slotRect = slotRef.current?.getBoundingClientRect();
      const rosterRect = rosterRef.current?.getBoundingClientRect();
      if (!slotRect || !rosterRect) return;

      const slotX = slotRect.left + slotRect.width / 2;
      const slotY = slotRect.top + slotRect.height / 2;
      const rosterX = rosterRect.left + rosterRect.width / 2;
      const rosterY = rosterRect.top + rosterRect.height / 2;

      const slogId = `slog-${Date.now()}`;
      setSlogAnimations(prev => [
        ...prev,
        {
          id: slogId,
          residentId: mockResident.id,
          from: { x: slotX, y: slotY },
          to: { x: rosterX, y: rosterY }
        }
      ]);
    }
  }, [slogPending, extractionState.phase]);

  // When slog animation completes (phase returns to idle), remove assignment
  useEffect(() => {
    if (slogPending && extractionState.phase === 'idle' && !extractionState.isSloggingOut) {
      setIsAssigned(false);
      setSlogAnimations([]);
      setSlogPending(false);
    }
  }, [slogPending, extractionState.phase, extractionState.isSloggingOut]);

  // Simulate extraction completion
  useEffect(() => {
    if (extractionState.phase === 'clearing') {
      // After clearing, reset assignment
      const timer = setTimeout(() => {
        setIsAssigned(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [extractionState.phase]);

  return (
    <DragProvider>
      <StyleLabSurface variant="panel" className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
        <StyleLabStack spacing="lg" className="w-full">
          {/* Header */}
          <StyleLabSurface variant="card" className="text-center">
            <h1 className="text-2xl font-bold text-slate-100">Extraction Isolation</h1>
            <p className="text-slate-400 mt-2">Test extraction animation sequence with useExtractionStateMachine</p>
          </StyleLabSurface>

          {/* Controls */}
          <StyleLabSurface variant="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Controls</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignment */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resident Assignment
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAssigned(true)}
                    className={`px-3 py-1 rounded text-sm ${
                      isAssigned
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Assigned
                  </button>
                  <button
                    onClick={() => setIsAssigned(false)}
                    className={`px-3 py-1 rounded text-sm ${
                      !isAssigned
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Empty
                  </button>
                </div>
              </div>

              {/* Letter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Letter
                </label>
                <input
                  type="text"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value.slice(0, 2).toUpperCase())}
                  className="w-full px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100"
                  maxLength={2}
                />
              </div>

              {/* Debug Visualization */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Debug Visualization
                </label>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Resident Assignment
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAssigned(true)}
                  className={`px-3 py-1 rounded text-sm ${
                    isAssigned
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setIsAssigned(false)}
                  className={`px-3 py-1 rounded text-sm ${
                    !isAssigned
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Empty
                </button>
              </div>
            </div>

            {/* Letter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Letter
              </label>
              <input
                type="text"
                value={letter}
                onChange={(e) => setLetter(e.target.value.slice(0, 2).toUpperCase())}
                className="w-full px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100"
                maxLength={2}
              />
            </div>

            {/* Debug Visualization */}
            <div className="md:col-span-2">
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

            {/* Slog Control */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Slog Animation (PG returns to roster)
              </label>
              <button
                onClick={handleSlogMouseDown}
                disabled={!isAssigned || slogPending}
                className={`px-4 py-2 rounded text-sm ${
                  !isAssigned || slogPending
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
                }`}
              >
                {!isAssigned ? 'No PG Assigned' : 'Start Slog Animation'}
              </button>
            </div>
          </div>
        </StyleLabSurface>

        {/* Slot Preview */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 text-center">
            Slot Preview (Press and Hold to Extract)
          </h3>
          
          <div className="flex justify-center">
            <div
              ref={slotRef}
              className="relative cursor-pointer"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
                cursor: extractionState.phase !== 'idle' ? 'grabbing' : 'grab',
              }}
            >
              {/* Slot + bezel: bezel handles its own animation, don't transform the wrapper */}
              <div>
                <SlotV12Renderer
                  letter={letter}
                  state={isAssigned ? 'occupied' : 'empty'}
                  extractionProgress={extractionState.isSloggingOut ? 0 : extractionState.extractionProgress}
                  debugVisualization={debugSettings?.enabled ? debugSettings : undefined}
                />
              </div>
              
              {/* WanderlustMedalOverlay - il medaglione con pop animation CSS durante completing */}
              {isAssigned && assignedAvatarUrl && (
                <div
                  className={`
                    absolute inset-0 z-10 flex items-center justify-center
                    transition-all duration-280 ease-out-back
                    ${extractionState.phase === 'completing' ? 'scale-[112%]' : 'scale-100'}
                    ${extractionState.phase === 'clearing' ? 'opacity-0 scale-80' : 'opacity-100'}
                  `}
                  style={{
                    transition: 'scale 280ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 150ms ease-out'
                  }}
                >
                  <div data-testid={`slot-medal-${letter}`}>
                    <WanderlustMedalOverlay
                      portraitUrl={assignedAvatarUrl}
                      isDragging={false}
                      sizePx={48}
                      className="h-12 w-12"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </StyleLabSurface>

        {/* Draggable WanderlustMedalOverlay for Testing */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Draggable Medal (WanderlustMedalOverlay)</h3>
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Drag this medal to see the WanderlustMedalOverlay in the CustomDragOverlay.
              This shows the actual medal component that appears during drag operations.
            </div>
            <div className="flex justify-center p-4">
              <div
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={() => setDraggedMedalId(mockResident.id)}
                onMouseUp={() => setDraggedMedalId(null)}
                onMouseLeave={() => setDraggedMedalId(null)}
              >
                <WanderlustMedalOverlay
                  portraitUrl={assignedAvatarUrl}
                  isDragging={draggedMedalId === mockResident.id}
                  sizePx={72}
                />
              </div>
            </div>
            <div>
              <span className="text-slate-400">Medal Drag State:</span>
              <div className={`font-mono ${draggedMedalId ? 'text-green-400' : 'text-slate-100'}`}>
                {draggedMedalId ? `Dragging medal: ${draggedMedalId}` : 'Not dragging'}
              </div>
            </div>
          </div>
        </StyleLabSurface>

        {/* Draggable PgCard for Testing */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Draggable PgCard (Full Component)</h3>
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Drag this PgCard to see the full component with skin and medal in the drag overlay.
            </div>
            <div className="flex justify-center p-4" ref={rosterRef}>
              <PgCard
                workerId={mockResident.id}
                label={assignedLabel}
                hp={mockResident.currentHp}
                fatigue={mockResident.fatigue}
                maxHp={mockResident.maxHp}
                isDragging={draggedResidentId === mockResident.id}
                onDragStateChange={(workerId, isDragging) => {
                  setDraggedResidentId(isDragging ? workerId : null);
                }}
                portraitUrl={assignedAvatarUrl}
                className="cursor-grab active:cursor-grabbing"
              />
            </div>
            <div>
              <span className="text-slate-400">Drag State:</span>
              <div className={`font-mono ${draggedResidentId ? 'text-green-400' : 'text-slate-100'}`}>
                {draggedResidentId ? `Dragging: ${draggedResidentId}` : 'Not dragging'}
              </div>
            </div>
          </div>
        </StyleLabSurface>

        {/* Drag Preview Display */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Drag Preview (resident-drag-preview-host)</h3>
          <div className="space-y-4">
            <div>
              <span className="text-slate-400">Drag Preview Ready:</span>
              <div className={`font-mono ${dragPreviewReady ? 'text-green-400' : 'text-red-400'}`}>
                {dragPreviewReady ? 'Ready' : 'Loading...'}
              </div>
            </div>
            <div className="text-sm text-slate-400">
              This creates the resident-drag-preview-host element that appears during drag operations.
              Check the DOM inspector to see the generated element.
            </div>
          </div>
        </StyleLabSurface>

        {/* State Information */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Extraction State</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Phase:</span>
              <div className="text-slate-100 font-mono font-bold">{extractionState.phase}</div>
            </div>
            <div>
              <span className="text-slate-400">Progress:</span>
              <div className="text-slate-100 font-mono">{extractionState.extractionProgress.toFixed(3)}</div>
            </div>
            <div>
              <span className="text-slate-400">Bezel Done:</span>
              <div className="text-slate-100 font-mono">{extractionState.isBezelAnimationDone ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <span className="text-slate-400">SlottedMedal:</span>
              <div className={`font-mono ${isAssigned ? 'text-green-400' : 'text-red-400'}`}>
                {isAssigned ? 'Present' : 'Absent'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Medal Fade:</span>
              <div className={`font-mono ${extractionState.isMedalFadingOut ? 'text-orange-400' : 'text-slate-100'}`}>
                {extractionState.isMedalFadingOut ? 'Fading' : 'Normal'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Assigned:</span>
              <div className={`font-mono ${isAssigned ? 'text-green-400' : 'text-red-400'}`}>
                {isAssigned ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </StyleLabSurface>

        {/* Phase Control (for testing) */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Phase Control (Testing)</h3>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <button
              onClick={() => _forcePhase('idle')}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Idle
            </button>
            <button
              onClick={() => _forcePhase('extracting')}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Extracting
            </button>
            <button
              onClick={() => _forcePhase('bezelAnimating')}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Bezel
            </button>
            <button
              onClick={() => _forcePhase('completing')}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Completing
            </button>
            <button
              onClick={() => _forcePhase('springBack')}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Spring
            </button>
            <button
              onClick={() => _forcePhase('clearing')}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Clearing
            </button>
            <button
              onClick={() => {
                setIsAssigned(true);
                _forcePhase('idle');
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Reset
            </button>
          </div>
        </StyleLabSurface>

        {/* Slog Animations */}
        {slogAnimations.map((slog) => (
          <SlogProxy
            key={slog.id}
            residentId={slog.residentId}
            slotX={slog.from.x}
            slotY={slog.from.y}
            rosterX={slog.to.x}
            rosterY={slog.to.y}
            onComplete={(residentId) => {
              setSlogAnimations((prev) => prev.filter((item) => item.id !== slog.id));
              console.log('Slog animation completed for:', residentId);
            }}
            residentsById={slogResidentsById}
          />
        ))}
      </StyleLabStack>
      
      {/* CustomDragOverlay for Medal */}
      <CustomDragOverlay
        residentsById={{
          [mockResident.id]: mockResident
        }}
        usePgCardPreview={false} // Use medal preview instead of PgCard
        dragVisualState={{
          mode: draggedMedalId ? 'dragging' : 'idle',
          residentId: draggedMedalId
        }}
      />
      </StyleLabSurface>
    </DragProvider>
  );
}
