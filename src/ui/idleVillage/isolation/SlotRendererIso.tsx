/**
 * Slot Renderer Isolation Page
 * 
 * Tests SlotV12Renderer component independently with:
 * - Empty vs occupied states
 * - Extraction progress slider (0-1)
 * - Debug visualization toggle
 * - Bezel animation timing verification
 */

import { useState } from 'react';
import { Slot } from '@/ui/idleVillage/components/Slot';
import { V9TooltipProvider } from '@/ui/v9-skin/V9Tooltip';
import { useSlotDebugVisualization } from '@/ui/idleVillage/hooks/useSlotDebugVisualization';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';

export default function SlotRendererIso() {
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [slotState, setSlotState] = useState<'empty' | 'occupied'>('empty');
  const [letter, setLetter] = useState('A');
  
  const { settings: debugSettings, isHydrated, toggleEnabled } = useSlotDebugVisualization();

  return (
    <V9TooltipProvider>
      <StyleLabSurface variant="panel" className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <StyleLabStack spacing="lg" className="w-full">
        {/* Header */}
        <StyleLabSurface variant="card" className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">Slot V12 Renderer Isolation</h1>
          <p className="text-slate-400 mt-2">Test SlotV12Renderer component independently</p>
        </StyleLabSurface>
        {/* Controls */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot State */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Slot State
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSlotState('empty')}
                  className={`px-3 py-1 rounded text-sm ${
                    slotState === 'empty'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Empty
                </button>
                <button
                  onClick={() => setSlotState('occupied')}
                  className={`px-3 py-1 rounded text-sm ${
                    slotState === 'occupied'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Occupied
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

            {/* Extraction Progress */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Extraction Progress: {extractionProgress.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={extractionProgress}
                onChange={(e) => setExtractionProgress(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0 (closed)</span>
                <span>1.0 (open)</span>
                <span>1.2 (overshoot)</span>
              </div>
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
          </div>
        </div>

        {/* Slot Preview */}
        <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-600">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 text-center">
            Slot Preview
          </h3>
          
          <div className="flex justify-center">
            <Slot
              tooltip={`Slot: ${slotState}`}
              slotProps={{
                letter,
                state: slotState,
                extractionProgress,
                debugVisualization: debugSettings?.enabled ? debugSettings : undefined,
              }}
            />
          </div>
        </div>

        {/* State Information */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">State Information</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Phase:</span>
              <div className="text-slate-100 font-mono">
                {extractionProgress === 0 ? 'idle' :
                 extractionProgress < 1 ? 'extracting' :
                 extractionProgress === 1 ? 'bezelAnimating' :
                 extractionProgress > 1 ? 'springBack' : 'unknown'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Progress:</span>
              <div className="text-slate-100 font-mono">{extractionProgress.toFixed(3)}</div>
            </div>
            <div>
              <span className="text-slate-400">Bezel CSS:</span>
              <div className="text-slate-100 font-mono">
                {extractionProgress > 0 ? 'animating' : 'static'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Debug:</span>
              <div className="text-slate-100 font-mono">
                {debugSettings?.enabled ? 'enabled' : 'disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Test Scenarios</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setSlotState('empty');
                setExtractionProgress(0);
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Empty Idle
            </button>
            <button
              onClick={() => {
                setSlotState('occupied');
                setExtractionProgress(0);
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Occupied Idle
            </button>
            <button
              onClick={() => {
                setSlotState('occupied');
                setExtractionProgress(0.5);
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Extracting 50%
            </button>
            <button
              onClick={() => {
                setSlotState('occupied');
                setExtractionProgress(1.0);
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Bezel Complete
            </button>
            <button
              onClick={() => {
                setSlotState('occupied');
                setExtractionProgress(1.2);
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Spring Overshoot
            </button>
            <button
              onClick={() => {
                setSlotState('empty');
                setExtractionProgress(0.8);
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Empty Extracting
            </button>
            <button
              onClick={() => {
                const step = 0.05;
                setExtractionProgress(prev => Math.max(0, prev - step));
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Step Back
            </button>
            <button
              onClick={() => {
                const step = 0.05;
                setExtractionProgress(prev => Math.min(1.2, prev + step));
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Step Forward
            </button>
          </div>
        </div>
      </StyleLabStack>
    </StyleLabSurface>
    </V9TooltipProvider>
  );
}
