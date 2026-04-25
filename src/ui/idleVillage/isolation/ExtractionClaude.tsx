/**
 * Extraction Claude Page
 * 
 * Basato sull'implementazione HTML di Claude con trapianto graduale di componenti React.
 * Parte dal codice CSS puro di Claude e aggiunge gradualmente i componenti reali.
 */

import React, { useState, useEffect, useRef } from 'react';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';

// Costanti identiche a Claude
const BEZEL_MS = 560;
const SPRING_MS = 600;
const CLEANUP_MS = 200;
const POP_MS = 280;

const phases = ['idle','extracting','bezelAnimating','completing','springBack','clearing'];

export default function ExtractionClaude() {
  const [currentPhase, setCurrentPhase] = useState('idle');
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [hint, setHint] = useState('Tieni premuto il medaglione per avviare l\'estrazione...');
  const [isAssigned, setIsAssigned] = useState(true);
  
  const timers = useRef<NodeJS.Timeout[]>([]);
  const rafId = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  const slotRef = useRef<HTMLDivElement>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  
  // Mock resident data
  const mockResident = {
    id: 'test-resident-1',
    name: 'Test Resident',
    portraitUrl: '/api/placeholder/72/72' // Placeholder per test
  };
  
  const clearAll = () => {
    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };
  
  const schedule = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timers.current.push(t);
    return t;
  };
  
  const setPhase = (p: string) => {
    setCurrentPhase(p);
    const values: Record<string, number> = {
      idle: 0, extracting: 0, bezelAnimating: 1.0,
      completing: 1.12, springBack: 1.0, clearing: 0
    };
    setExtractionProgress(values[p] ?? 0);
  };
  
  const animateProgressTo = (from: number, to: number, duration: number, onDone?: () => void) => {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // Ease-out-back
      const v = from + (to - from) * eased;
      setExtractionProgress(v);
      
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        if (onDone) onDone();
      }
    };
    rafId.current = requestAnimationFrame(tick);
  };
  
  const cancelAnim = () => {
    clearAll();
    if (currentPhase === 'idle' || currentPhase === 'clearing') {
      resetAll();
      return;
    }
    
    const startProgress = extractionProgress;
    setPhase('springBack');
    setHint('Spring-back elastico in corso...');
    
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / SPRING_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = startProgress * (1 - eased);
      setExtractionProgress(v);
      
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        setPhase('clearing');
        setExtractionProgress(0);
        schedule(() => {
          setPhase('idle');
          setExtractionProgress(0);
          setHint('Spring-back completato! Slot tornato a idle.');
        }, CLEANUP_MS);
      }
    };
    rafId.current = requestAnimationFrame(tick);
  };
  
  const triggerFlight = () => {
    const slotRect = slotRef.current?.getBoundingClientRect();
    const rosterRect = rosterRef.current?.getBoundingClientRect();
    
    if (!slotRect || !rosterRect) return;
    
    // Crea elemento di volo temporaneo
    const flightMedal = document.createElement('div');
    flightMedal.className = 'fixed w-10 h-10 rounded-full bg-gradient-to-br from-purple-300 to-purple-600 flex items-center justify-center text-lg pointer-events-none z-50';
    flightMedal.innerHTML = '<span>PG</span>';
    flightMedal.style.opacity = '0';
    flightMedal.style.transform = 'scale(0.8)';
    flightMedal.style.transition = 'opacity 0.15s ease, transform 0.3s ease';
    
    const fromX = slotRect.left + slotRect.width / 2 - 20;
    const fromY = slotRect.top + slotRect.height / 2 - 20;
    const toX = rosterRect.left + rosterRect.width / 2 - 20;
    const toY = rosterRect.top + rosterRect.height / 2 - 20;
    
    flightMedal.style.left = fromX + 'px';
    flightMedal.style.top = fromY + 'px';
    
    document.body.appendChild(flightMedal);
    
    // Animazione
    requestAnimationFrame(() => {
      flightMedal.style.opacity = '1';
      flightMedal.style.transform = 'scale(1)';
      
      requestAnimationFrame(() => {
        flightMedal.style.transition = `left ${SPRING_MS}ms cubic-bezier(0.4,0,0.2,1), top ${SPRING_MS}ms cubic-bezier(0.4,0,0.2,1), transform ${SPRING_MS}ms ease, opacity 200ms ease ${SPRING_MS - 200}ms`;
        flightMedal.style.left = toX + 'px';
        flightMedal.style.top = toY + 'px';
        flightMedal.style.transform = 'scale(0.7)';
        flightMedal.style.opacity = '0';
        
        setTimeout(() => {
          document.body.removeChild(flightMedal);
        }, SPRING_MS + 200);
      });
    });
  };
  
  const fullSequence = () => {
    clearAll();
    setPhase('idle');
    setExtractionProgress(0);
    setHint('Fase: extracting - bezel si espande...');
    
    setPhase('extracting');
    
    animateProgressTo(0, 1, BEZEL_MS, () => {
      setPhase('bezelAnimating');
      setHint('Fase: bezelAnimating - rotazione bezel...');
      
      schedule(() => {
        setPhase('completing');
        setExtractionProgress(1.12);
        setHint('Fase: completing - pop elastico! scala 112%');
        
        schedule(() => {
          setPhase('springBack');
          setExtractionProgress(1.0);
          setHint('Fase: springBack - medaglione vola al roster...');
          triggerFlight();
          
          schedule(() => {
            setPhase('clearing');
            setExtractionProgress(0);
            setHint('Fase: clearing - cleanup...');
            
            schedule(() => {
              setPhase('idle');
              setExtractionProgress(0);
              setHint('Sequenza completata! Premi di nuovo o tieni premuto il medaglione.');
              setIsAssigned(false); // Rimuovi assignment dopo sequenza completa
            }, CLEANUP_MS);
          }, SPRING_MS);
        }, POP_MS);
      }, BEZEL_MS);
    });
  };
  
  const resetAll = () => {
    clearAll();
    setPhase('idle');
    setExtractionProgress(0);
    setIsAssigned(true);
    setHint('Reset. Tieni premuto il medaglione o usa i controlli.');
  };
  
  const handleMouseDown = () => {
    if (!isAssigned) return;
    
    setIsHolding(true);
    holdStart.current = Date.now();
    clearAll();
    setPhase('extracting');
    setHint('Tieni premuto...');
    
    const startTime = Date.now();
    const tick = () => {
      if (!isHolding) return;
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / BEZEL_MS, 1);
      setExtractionProgress(p);
      
      if (p < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        setPhase('bezelAnimating');
        setHint('Estrazione completata! Rilascia per il spring-back o aspetta...');
        
        schedule(() => {
          if (!isHolding) return;
          fullSequence();
        }, 100);
      }
    };
    rafId.current = requestAnimationFrame(tick);
  };
  
  const handleMouseUp = () => {
    if (!isHolding) return;
    setIsHolding(false);
    
    if (currentPhase === 'extracting' || 
        (currentPhase === 'bezelAnimating' && extractionProgress < 1)) {
      cancelAnim();
    }
  };
  
  const handleMouseLeave = () => {
    if (isHolding && currentPhase === 'extracting') {
      setIsHolding(false);
      cancelAnim();
    }
  };
  
  useEffect(() => {
    return () => clearAll();
  }, []);
  
  const bezelScale = 1 + extractionProgress * 0.08; // Scale 1.08 per toccare medaglia
  const circumference = 238.76;
  const progressOffset = circumference * (1 - Math.min(Math.max(extractionProgress, 0), 1));
  
  return (
    <StyleLabSurface>
      <StyleLabStack>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">
              Extraction Animation (Claude + React)
            </h1>
            <p className="text-slate-400">
              Basato sul codice HTML di Claude con trapianto graduale di componenti React.
              Il medaglione usa WanderlustMedalOverlay reale.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsAssigned(!isAssigned)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAssigned 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-slate-600 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isAssigned ? 'Assigned' : 'Empty'}
            </button>
          </div>

          {/* Slot Area - Stile Claude con componente React */}
          <StyleLabSurface variant="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 text-center">
              Slot Extraction (WanderlustMedalOverlay + CSS Claude)
            </h3>
            
            <div className="flex gap-8 justify-center items-start">
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-slate-500">slot</p>
                
                <div 
                  ref={slotRef}
                  className="relative w-20 h-20 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    cursor: currentPhase !== 'idle' ? 'grabbing' : 'grab',
                  }}
                >
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center relative overflow-hidden">
                    <span className="absolute top-1.5 left-2 text-xs text-slate-600 font-medium">A</span>
                    
                    {/* Progress Ring - Stile Claude */}
                    <svg 
                      className="absolute inset-0 w-full h-full" 
                      viewBox="0 0 88 88"
                      style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', top: '-4px', left: '-4px' }}
                    >
                      <circle 
                        cx="44" 
                        cy="44" 
                        r="38"
                        fill="none"
                        stroke="#7F77DD"
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform="rotate(-90deg)"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        opacity={extractionProgress > 0 ? 1 : 0}
                      />
                    </svg>
                    
                    {/* Bezel Ring - Stile Claude */}
                    <div 
                      className="absolute inset-0 rounded-xl border-3 border-transparent transition-all duration-560 ease-out"
                      style={{
                        borderColor: ['extracting','bezelAnimating','completing','springBack'].includes(currentPhase) ? '#7F77DD' : 'transparent',
                        transform: `scale(${bezelScale.toFixed(3)})`,
                        transformOrigin: 'center',
                        borderWidth: '3px'
                      }}
                    />
                    
                    {/* WanderlustMedalOverlay - Componente React reale */}
                    {isAssigned && (
                      <div 
                        className={`
                          absolute inset-0 z-10 flex items-center justify-center
                          transition-all duration-280 ease-out-back
                          ${currentPhase === 'completing' ? 'scale-[112%]' : 'scale-100'}
                          ${currentPhase === 'clearing' ? 'opacity-0 scale-80' : 'opacity-100'}
                        `}
                        style={{
                          transition: 'transform 280ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 150ms ease-out'
                        }}
                      >
                        <div className="w-12 h-12">
                          <WanderlustMedalOverlay
                            portraitUrl={mockResident.portraitUrl}
                            isDragging={false}
                            sizePx={48}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 text-center">tieni premuto</p>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-slate-500">roster target</p>
                <div 
                  ref={rosterRef}
                  className="w-16 h-16 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"
                >
                  <span>PG</span>
                </div>
              </div>
            </div>
          </StyleLabSurface>

          {/* Controls Panel - Stile Claude */}
          <StyleLabSurface variant="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Animation Controls</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">fase attuale</div>
                <div className="text-sm font-mono font-medium">{currentPhase}</div>
              </div>
              
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">extraction progress</div>
                <div className="text-xs font-mono text-slate-600 mb-1">{extractionProgress.toFixed(3)}</div>
                <div className="h-1.5 bg-slate-300 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-50"
                    style={{ width: `${Math.min(Math.max(extractionProgress, 0), 1) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {phases.map(phase => (
                <span 
                  key={phase}
                  className={`
                    text-xs px-2 py-1 rounded-full border font-mono
                    ${currentPhase === phase 
                      ? 'bg-purple-100 text-purple-700 border-purple-300' 
                      : 'bg-white text-slate-600 border-slate-300'
                    }
                  `}
                >
                  {phase}
                </span>
              ))}
            </div>
            
            <div className="flex gap-2 flex-wrap mb-2">
              <button 
                onClick={() => setPhase('completing')}
                className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-100"
              >
                completing
              </button>
              <button 
                onClick={() => setPhase('springBack')}
                className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-100"
              >
                springBack
              </button>
              <button 
                onClick={fullSequence}
                className="text-xs px-2 py-1 rounded border bg-purple-600 text-white hover:bg-purple-700"
              >
                sequenza completa
              </button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={cancelAnim}
                className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-100"
              >
                cancella (spring-back)
              </button>
              <button 
                onClick={resetAll}
                className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-100"
              >
                reset
              </button>
            </div>
            
            <div className="text-xs text-slate-500 mt-2">{hint}</div>
          </StyleLabSurface>
        </div>
      </StyleLabStack>
    </StyleLabSurface>
  );
}
