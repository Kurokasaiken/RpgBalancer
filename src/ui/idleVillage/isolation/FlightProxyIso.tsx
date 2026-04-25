/**
 * Flight Proxy Isolation Page
 * 
 * Tests FlightProxy component independently:
 * - Flight animation from point A to point B
 * - onComplete callback timing (160ms)
 * - WanderlustMedalOverlay during flight
 * - Coordinate control
 */

import { useState, useCallback } from 'react';
import { FlightProxy } from '@/ui/idleVillage/components/FlightProxy';
import { useSlotDebugVisualization } from '@/ui/idleVillage/hooks/useSlotDebugVisualization';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

interface FlightAnimation {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  residentId: string;
}

// Mock resident
const mockResident = {
  id: 'flight-test-resident',
  name: 'Test Flyer',
  portraitUrl: '/portraits/test.jpg',
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
};

export default function FlightProxyIso() {
  const [flightAnimations, setFlightAnimations] = useState<FlightAnimation[]>([]);
  const [lastFlightTime, setLastFlightTime] = useState<number | null>(null);
  const [residentId, setResidentId] = useState(mockResident.id);
  const [fromPoint, setFromPoint] = useState({ x: 100, y: 100 });
  const [toPoint, setToPoint] = useState({ x: 300, y: 200 });
  
  const { settings: debugSettings, isHydrated, toggleEnabled } = useSlotDebugVisualization();

  // Create residentsById for FlightProxy
  const residentsById: Record<string, ResidentState> = {
    [mockResident.id]: mockResident as ResidentState,
  };

  const startFlight = useCallback(() => {
    const flightId = `flight-${Date.now()}`;
    const startTime = Date.now();
    
    const newFlight: FlightAnimation = {
      id: flightId,
      fromX: fromPoint.x,
      fromY: fromPoint.y,
      toX: toPoint.x,
      toY: toPoint.y,
      residentId,
    };
    
    setFlightAnimations(prev => [...prev, newFlight]);
    setLastFlightTime(startTime);
  }, [fromPoint, toPoint, residentId]);

  const handleFlightComplete = useCallback((flightId: string) => {
    const endTime = Date.now();
    const duration = lastFlightTime ? endTime - lastFlightTime : null;
    
    console.log(`Flight ${flightId} completed in ${duration}ms`);
    
    setFlightAnimations(prev => prev.filter(f => f.id !== flightId));
    setLastFlightTime(null);
  }, [lastFlightTime]);

  const clearAllFlights = useCallback(() => {
    setFlightAnimations([]);
    setLastFlightTime(null);
  }, []);

  return (
    <StyleLabSurface variant="panel" className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <StyleLabStack spacing="lg" className="w-full">
        {/* Header */}
        <StyleLabSurface variant="card" className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">Flight Proxy Isolation</h1>
          <p className="text-slate-400 mt-2">Test FlightProxy component independently</p>
        </StyleLabSurface>

        {/* Controls */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Flight Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coordinates */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">From Point</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">X</label>
                  <input
                    type="number"
                    value={fromPoint.x}
                    onChange={(e) => setFromPoint(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Y</label>
                  <input
                    type="number"
                    value={fromPoint.y}
                    onChange={(e) => setFromPoint(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">To Point</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">X</label>
                  <input
                    type="number"
                    value={toPoint.x}
                    onChange={(e) => setToPoint(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Y</label>
                  <input
                    type="number"
                    value={toPoint.y}
                    onChange={(e) => setToPoint(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={startFlight}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Start Flight
            </button>
            <button
              onClick={clearAllFlights}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Clear All
            </button>
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
        </StyleLabSurface>

        {/* Flight Canvas */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Flight Canvas</h3>
          
          <div className="relative bg-slate-900/50 rounded-lg" style={{ height: '400px' }}>
            {/* Grid overlay for reference */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* From point marker */}
            <div
              className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-green-300"
              style={{
                left: `${fromPoint.x}px`,
                top: `${fromPoint.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              title="From Point"
            />
            
            {/* To point marker */}
            <div
              className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-red-300"
              style={{
                left: `${toPoint.x}px`,
                top: `${toPoint.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              title="To Point"
            />
            
            {/* Flight path line */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <line
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                stroke="white"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.3"
              />
            </svg>
            
            {/* Flight animations */}
            {flightAnimations.map((flight) => (
              <FlightProxy
                key={flight.id}
                fromX={flight.fromX}
                fromY={flight.fromY}
                toX={flight.toX}
                toY={flight.toY}
                residentId={flight.residentId}
                onComplete={() => handleFlightComplete(flight.id)}
                residentsById={residentsById}
              />
            ))}
          </div>
        </StyleLabSurface>

        {/* State Information */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">State Information</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Active Flights:</span>
              <div className="text-slate-100 font-mono">{flightAnimations.length}</div>
            </div>
            <div>
              <span className="text-slate-400">From:</span>
              <div className="text-slate-100 font-mono">({fromPoint.x}, {fromPoint.y})</div>
            </div>
            <div>
              <span className="text-slate-400">To:</span>
              <div className="text-slate-100 font-mono">({toPoint.x}, {toPoint.y})</div>
            </div>
            <div>
              <span className="text-slate-400">Distance:</span>
              <div className="text-slate-100 font-mono">
                {Math.round(Math.sqrt(Math.pow(toPoint.x - fromPoint.x, 2) + Math.pow(toPoint.y - fromPoint.y, 2)))}px
              </div>
            </div>
            <div>
              <span className="text-slate-400">Debug:</span>
              <div className="text-slate-100 font-mono">{debugSettings?.enabled ? 'On' : 'Off'}</div>
            </div>
            <div>
              <span className="text-slate-400">Resident ID:</span>
              <div className="text-slate-100 font-mono">{residentId}</div>
            </div>
            <div>
              <span className="text-slate-400">Last Duration:</span>
              <div className="text-slate-100 font-mono">
                {lastFlightTime ? 'Pending...' : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Flight IDs:</span>
              <div className="text-slate-100 font-mono text-xs">
                {flightAnimations.map(f => f.id.split('-')[1]).join(', ') || 'None'}
              </div>
            </div>
          </div>
        </StyleLabSurface>

        {/* Preset Scenarios */}
        <StyleLabSurface variant="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Preset Scenarios</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setFromPoint({ x: 100, y: 100 });
                setToPoint({ x: 300, y: 100 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Horizontal
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 100, y: 100 });
                setToPoint({ x: 100, y: 300 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Vertical
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 100, y: 100 });
                setToPoint({ x: 300, y: 300 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Diagonal
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 300, y: 300 });
                setToPoint({ x: 100, y: 100 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Reverse
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 50, y: 200 });
                setToPoint({ x: 350, y: 200 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Long
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 200, y: 50 });
                setToPoint({ x: 200, y: 350 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Tall
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 200, y: 200 });
                setToPoint({ x: 250, y: 150 });
              }}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
            >
              Short
            </button>
            <button
              onClick={() => {
                setFromPoint({ x: 150, y: 150 });
                setToPoint({ x: 250, y: 250 });
                startFlight();
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Quick Test
            </button>
          </div>
        </StyleLabSurface>
      </StyleLabStack>
    </StyleLabSurface>
  );
}
