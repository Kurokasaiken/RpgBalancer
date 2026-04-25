import React, { useState, useEffect, useRef } from 'react';

// Basato sull'implementazione HTML di Claude - approccio CSS puro
export function SimpleSlotExtraction() {
  const [currentPhase, setCurrentPhase] = useState('idle');
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [hint, setHint] = useState('Tieni premuto il medaglione per avviare l\'estrazione...');
  
  const timers = useRef<NodeJS.Timeout[]>([]);
  const rafId = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  
  // Costanti identiche a Claude
  const BEZEL_MS = 560;
  const SPRING_MS = 600;
  const CLEANUP_MS = 200;
  const POP_MS = 280;
  
  const phases = ['idle','extracting','bezelAnimating','completing','springBack','clearing'];
  
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
          
          schedule(() => {
            setPhase('clearing');
            setExtractionProgress(0);
            setHint('Fase: clearing - cleanup...');
            
            schedule(() => {
              setPhase('idle');
              setExtractionProgress(0);
              setHint('Sequenza completata! Premi di nuovo o tieni premuto il medaglione.');
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
    setHint('Reset. Tieni premuto il medaglione o usa i controlli.');
  };
  
  const handleMouseDown = () => {
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
    <div className="flex gap-8 p-6 max-w-4xl mx-auto">
      {/* Slot Area */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-gray-500">slot</p>
        
        <div 
          className="relative w-20 h-20 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-300 flex items-center justify-center relative overflow-hidden">
            <span className="absolute top-1.5 left-2 text-xs text-gray-600 font-medium">A</span>
            
            {/* Progress Ring */}
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
            
            {/* Bezel Ring */}
            <div 
              className="absolute inset-0 rounded-xl border-3 border-transparent transition-all duration-560 ease-out"
              style={{
                borderColor: ['extracting','bezelAnimating','completing','springBack'].includes(currentPhase) ? '#7F77DD' : 'transparent',
                transform: `scale(${bezelScale.toFixed(3)})`,
                transformOrigin: 'center'
              }}
            />
            
            {/* Medal */}
            <div 
              className={`
                absolute w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-purple-600 
                flex items-center justify-center text-xl z-10
                transition-all duration-280 ease-out-back
                ${currentPhase === 'completing' ? 'scale-[112%]' : 'scale-100'}
                ${currentPhase === 'clearing' ? 'opacity-0 scale-80' : 'opacity-100'}
              `}
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) ${currentPhase === 'completing' ? 'scale(1.12)' : 'scale(1)'}`,
                transition: 'transform 280ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 150ms ease-out'
              }}
            >
              <span>PG</span>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center">tieni premuto</p>
        
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-gray-500">roster target</p>
          <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            <span>PG</span>
          </div>
        </div>
      </div>
      
      {/* Controls Panel */}
      <div className="flex-1 min-w-48">
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">fase attuale</div>
          <div className="text-sm font-mono font-medium">{currentPhase}</div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">extraction progress</div>
          <div className="text-xs font-mono text-gray-600 mb-1">{extractionProgress.toFixed(3)}</div>
          <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 rounded-full transition-all duration-50"
              style={{ width: `${Math.min(Math.max(extractionProgress, 0), 1) * 100}%` }}
            />
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
                  : 'bg-white text-gray-600 border-gray-300'
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
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
          >
            completing
          </button>
          <button 
            onClick={() => setPhase('springBack')}
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
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
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
          >
            cancella (spring-back)
          </button>
          <button 
            onClick={resetAll}
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
          >
            reset
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">{hint}</div>
      </div>
    </div>
  );
}
