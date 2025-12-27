import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { X, Sword } from 'lucide-react';
import type { QuestPhase, QuestPhaseResult } from '@/balancing/config/idleVillage/types';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';

export type CombatOutcome = 'success' | 'failure';

export interface CombatLogEntry {
  turn: number;
  message: string;
  type: 'info' | 'damage' | 'heal' | 'victory' | 'defeat';
}

export interface CombatCardDetailProps {
  questLabel: string;
  phase: QuestPhase;
  onStartCombat?: () => Promise<CombatOutcome>;
  onCombatComplete?: (result: QuestPhaseResult) => void;
  onClose?: () => void;
}

/**
 * Minimal combat card detail for quest phases.
 * Shows combat simulation with Start button and outcome display.
 */
const CombatCardDetail: React.FC<CombatCardDetailProps> = ({
  questLabel,
  phase,
  onStartCombat,
  onCombatComplete,
  onClose,
}) => {
  const { activePreset } = useThemeSwitcher();
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [combatOutcome, setCombatOutcome] = useState<CombatOutcome | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const DRAG_EXEMPT_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

  const isDragExemptTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    if (DRAG_EXEMPT_TAGS.has(target.tagName)) return true;
    if (target.closest('[data-drag-exempt="true"]')) return true;
    return false;
  };

  const cardFrameStyle: CSSProperties = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['card-surface'] ?? 'var(--card-surface, rgba(5,7,12,0.95))',
      borderColor: tokens['panel-border'] ?? 'var(--panel-border, rgba(255,215,0,0.35))',
      boxShadow: `0 35px 75px ${tokens['card-shadow-color'] ?? 'rgba(0,0,0,0.65)'}`,
    };
  }, [activePreset]);

  const auraStyle: CSSProperties = useMemo(
    () => ({
      background: activePreset.tokens['card-surface-radial'] ?? 'var(--card-surface-radial, rgba(255,255,255,0.06))',
    }),
    [activePreset],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerOriginRef.current.x;
      const dy = event.clientY - pointerOriginRef.current.y;
      setPosition({
        x: dragOriginRef.current.x + dx,
        y: dragOriginRef.current.y + dy,
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (isDragExemptTarget(event.target)) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const handleStartCombat = useCallback(async () => {
    if (!onStartCombat || isCombatActive) return;

    setIsCombatActive(true);
    setCombatLog([]);
    setCombatOutcome(null);

    try {
      // Simulate combat log entries
      const logEntries: CombatLogEntry[] = [
        { turn: 1, message: 'Combat begins! Party engages the enemy.', type: 'info' },
        { turn: 1, message: 'Hero strikes with sword, dealing 45 damage.', type: 'damage' },
        { turn: 1, message: 'Enemy retaliates, dealing 12 damage to party.', type: 'damage' },
        { turn: 2, message: 'Party member casts healing spell, restoring 20 HP.', type: 'heal' },
        { turn: 2, message: 'Hero finishes the enemy with a critical strike!', type: 'victory' },
      ];

      for (const entry of logEntries) {
        setCombatLog(prev => [...prev, entry]);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      }

      const outcome = await onStartCombat();
      setCombatOutcome(outcome);

      const result: QuestPhaseResult = {
        phaseId: phase.id,
        result: outcome,
        timestamp: Date.now(),
        notes: outcome === 'success' ? 'Combat won successfully' : 'Combat failed',
      };

      onCombatComplete?.(result);
    } catch (error) {
      console.error('Combat failed:', error);
      setCombatOutcome('failure');
    } finally {
      setIsCombatActive(false);
    }
  }, [onStartCombat, onCombatComplete, phase.id, isCombatActive]);

  const getLogEntryColor = (type: CombatLogEntry['type']) => {
    switch (type) {
      case 'damage': return 'text-rose-300';
      case 'heal': return 'text-emerald-300';
      case 'victory': return 'text-yellow-300 font-bold';
      case 'defeat': return 'text-red-400 font-bold';
      default: return 'text-slate-200';
    }
  };

  return (
    <div
      className="relative pointer-events-auto w-full max-w-[380px] sm:max-w-[380px]"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="absolute -inset-5 rounded-[28px] bg-black/30 blur-[28px]" aria-hidden />
      <article
        role="dialog"
        aria-label={`Combat: ${phase.label}`}
        className="relative overflow-hidden rounded-[20px] border px-3.5 py-3.5 backdrop-blur-lg text-[11px] leading-snug"
        style={cardFrameStyle}
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-0 opacity-40" style={auraStyle} aria-hidden />
        <div className="relative z-10 flex flex-col gap-3">
          <header className="flex items-start justify-between gap-2.5">
            <div className="flex-1 space-y-0.5">
              <h2 className="text-sm font-semibold leading-tight tracking-wide">{phase.label}</h2>
              <p className="text-[9px] uppercase tracking-[0.15em] text-amber-200/80">{questLabel}</p>
            </div>
            <div className="flex items-center gap-1.5" data-drag-exempt="true">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 hover:border-rose-400/50 hover:text-rose-200"
                aria-label="Chiudi combattimento"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </header>

          <section className="flex flex-col gap-3">
            {phase.narrative && (
              <div className="rounded-lg border border-white/10 bg-black/15 px-3 py-2">
                <p className="text-[10px] leading-relaxed text-slate-300 italic">
                  {phase.narrative}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  <span>Combat Status</span>
                  <span className={combatOutcome === 'success' ? 'text-emerald-300' : combatOutcome === 'failure' ? 'text-rose-300' : 'text-slate-400'}>
                    {combatOutcome ? (combatOutcome === 'success' ? 'Victory' : 'Defeat') : 'Ready'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartCombat}
                disabled={isCombatActive || !!combatOutcome}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-amber-400/70 bg-amber-500/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-50 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sword className="h-3 w-3" />
                {isCombatActive ? 'Fighting...' : combatOutcome ? 'Complete' : 'Fight'}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
              {combatLog.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">Combat log will appear here...</p>
              ) : (
                <div className="space-y-1">
                  {combatLog.map((entry, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-[8px] text-slate-500 font-mono w-6">T{entry.turn}</span>
                      <span className={`text-[10px] ${getLogEntryColor(entry.type)}`}>
                        {entry.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {combatOutcome && (
              <div className={`rounded-lg border px-3 py-2 text-center ${
                combatOutcome === 'success'
                  ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-400/50 bg-rose-500/10 text-rose-200'
              }`}>
                <p className="text-sm font-semibold">
                  {combatOutcome === 'success' ? 'Victory!' : 'Defeat'}
                </p>
                <p className="text-[10px] mt-1">
                  {combatOutcome === 'success'
                    ? 'The quest phase is complete. Continue to the next challenge.'
                    : 'The party has fallen. This quest phase has failed.'
                  }
                </p>
              </div>
            )}
          </section>
        </div>
      </article>
    </div>
  );
};

export default CombatCardDetail;
