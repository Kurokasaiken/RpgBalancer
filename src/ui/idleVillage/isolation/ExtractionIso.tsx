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
import { SimpleSlotExtraction } from '@/ui/idleVillage/components/SimpleSlotExtraction';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';

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
  // Implementazione semplificata basata sull'approccio Claude HTML
  // Rimuove tutta la complessità React/Framer Motion e usa CSS puro

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
          </div>

          {/* SimpleSlotExtraction - Approccio Claude CSS puro */}
          <StyleLabSurface variant="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 text-center">
              Simple Slot Extraction (CSS-based)
            </h3>
            <SimpleSlotExtraction />
          </StyleLabSurface>

          <StyleLabSurface variant="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Implementation Notes</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p>Based on Claude's HTML implementation:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Sequenza: idle -> extracting -> bezelAnimating -> completing -> springBack -> clearing -> idle</li>
                <li>Pop animation: scale 1.12 con cubic-bezier(0.175, 0.885, 0.32, 1.275)</li>
                <li>Bezel scale: 1.08 per toccare medaglia senza sovrapporsi</li>
                <li>Spring back: ease-out-back elastico invece di reset secco</li>
                <li>Tutte animazioni in CSS puro, nessuna dipendenza Framer Motion</li>
              </ul>
            </div>
          </StyleLabSurface>
        </div>
      </StyleLabStack>
    </StyleLabSurface>
  );
}
