import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Scroll, User, Heart, Zap, Shield, Sword } from 'lucide-react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { resolveResidentPortrait } from '@/engine/game/idleVillage/residentVisualResolver';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { getArchetypeSummary } from '@/ui/idleVillage/archetypeDirectory';
import { dispatchOpenArchetypeDetailEvent } from '@/shared/events/archetypeEvents';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';

/**
 * Props per la Scheda Pergamena con Bento Grid System
 */
export interface SchedaPergamenaProps {
  resident: ResidentState;
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
}

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

/**
 * Scheda Pergamena - Implementazione Bento Grid System con apertura laterale
 * 
 * Caratteristiche:
 * - Layout Bento Grid con sezioni modulari
 * - Apertura laterale fisica con animazione pergamena
 * - Suono carta che si srotola
 * - Design pesante e fisico, non popup fluttuante
 */
const SchedaPergamena: React.FC<SchedaPergamenaProps> = ({ 
  resident, 
  isOpen, 
  onClose, 
  anchorElement 
}) => {
  const { activePreset } = useThemeSwitcher();
  const { playSound } = useSensoryAudio();
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // Calcoli dati residente
  const hpPercent = resident.maxHp > 0 ? clampPercent(Math.round((resident.currentHp / resident.maxHp) * 100)) : 0;
  const fatiguePercent = clampPercent(Math.round(resident.fatigue));
  const statusLabel = resident.isInjured ? 'Ferito' : resident.status;
  const { portraitUrl, fullFigureUrl } = useMemo(() => resolveResidentPortrait(resident), [resident]);
  const archetypeSummary = useMemo(() => getArchetypeSummary(resident.statProfileId), [resident.statProfileId]);

  // Stats principali per Bento Grid
  const mainStats = useMemo(() => {
    const snapshot = resident.statSnapshot ?? {};
    return [
      { icon: Heart, label: 'HP', value: resident.currentHp, max: resident.maxHp, color: 'text-red-400' },
      { icon: Zap, label: 'Stamina', value: 100 - fatiguePercent, max: 100, color: 'text-yellow-400' },
      { icon: Shield, label: 'Difesa', value: snapshot.defense || 0, color: 'text-blue-400' },
      { icon: Sword, label: 'Attacco', value: snapshot.attack || 0, color: 'text-orange-400' },
    ];
  }, [resident.statSnapshot, resident.currentHp, resident.maxHp, fatiguePercent]);

  // Stile per la pergamena
  const pergamenaStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: `
        linear-gradient(135deg, 
          rgba(245, 235, 215, 0.95) 0%, 
          rgba(235, 220, 195, 0.92) 25%, 
          rgba(225, 205, 175, 0.90) 50%, 
          rgba(215, 195, 165, 0.88) 75%, 
          rgba(205, 185, 155, 0.85) 100%
        )
      `,
      borderColor: tokens['panel-border'] ?? 'rgba(139, 69, 19, 0.6)',
      boxShadow: `
        inset 0 0 120px rgba(139, 69, 19, 0.15),
        0 25px 60px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(139, 69, 19, 0.3)
      `,
      color: '#3d2817',
    };
  }, [activePreset]);

  // Calcola posizione rispetto all'anchor element
  const calculatePosition = useCallback(() => {
    if (!anchorElement || !containerRef.current) return;

    const anchorRect = anchorElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Posizione laterale a destra dell'anchor
    const x = anchorRect.right + 16;
    const y = anchorRect.top;
    
    // Assicura che non esca dal viewport
    const maxX = window.innerWidth - containerRect.width - 16;
    const maxY = window.innerHeight - containerRect.height - 16;
    
    setPosition({
      x: Math.min(x, maxX),
      y: Math.min(y, maxY)
    });
  }, [anchorElement]);

  // Suono di pergamena che si srotola
  const playPergamenaSound = useCallback(() => {
    playSound('pergamena_open', { volume: 0.3, pitch: 1.0 });
  }, [playSound]);

  // Gestisci apertura/chiusura
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      playPergamenaSound();
      setIsAnimating(true);
      
      // Reset animazione dopo completamento
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    } else {
      setIsAnimating(false);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isOpen, calculatePosition, playPergamenaSound]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Click outside per chiudere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleOpenArchetype = useCallback(() => {
    if (!archetypeSummary) return;
    dispatchOpenArchetypeDetailEvent(archetypeSummary.id);
  }, [archetypeSummary]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay scuro */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />
      
      {/* Container Scheda Pergamena */}
      <div
        ref={containerRef}
        className={`absolute pointer-events-auto overflow-hidden rounded-2xl border transition-all duration-500 ease-out ${
          isAnimating 
            ? 'scale-95 opacity-0 translate-x-4' 
            : 'scale-100 opacity-100 translate-x-0'
        }`}
        style={{
          ...pergamenaStyle,
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          width: '420px',
          maxHeight: '80vh',
        }}
      >
        {/* Texture pergamena */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(139, 69, 19, 0.1) 2px,
                rgba(139, 69, 19, 0.1) 4px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139, 69, 19, 0.05) 2px,
                rgba(139, 69, 19, 0.05) 4px
              )
            `,
          }}
        />
        
        {/* Header con nome e close */}
        <div className="relative border-b border-amber-900/30 px-4 py-3 bg-gradient-to-r from-amber-900/20 to-amber-800/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scroll className="h-5 w-5 text-amber-800" />
              <div>
                <div className="text-lg font-bold text-amber-900">
                  {formatResidentLabel(resident)}
                </div>
                <div className="text-xs uppercase tracking-[0.3em] text-amber-700/70">
                  {statusLabel}
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-amber-800/30 bg-amber-800/10 p-1.5 text-amber-800 transition hover:border-amber-700/50 hover:bg-amber-700/20"
              aria-label="Chiudi scheda"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bento Grid Content */}
        <div className="p-4 space-y-4">
          {/* Riga 1: Portrait + Stats principali */}
          <div className="grid grid-cols-2 gap-3">
            {/* Portrait */}
            <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-amber-50/50 to-amber-100/30 p-3">
              <div className="absolute top-2 right-2">
                <div className="h-2 w-2 rounded-full bg-green-600 shadow-lg shadow-green-600/50" />
              </div>
              
              <div
                className="mx-auto h-24 w-20 overflow-hidden rounded-lg border border-amber-800/20 shadow-lg"
                style={{
                  background: portraitUrl 
                    ? `url(${portraitUrl}) center/cover` 
                    : 'radial-gradient(circle at 30% 10%, rgba(139, 69, 19, 0.2), rgba(139, 69, 19, 0.4))',
                }}
              />
              
              <div className="mt-2 text-center">
                <div className="text-xs font-semibold text-amber-900">Livello {resident.level || 1}</div>
                {archetypeSummary && (
                  <button
                    onClick={handleOpenArchetype}
                    className="mt-1 text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    {archetypeSummary.name}
                  </button>
                )}
              </div>
            </div>

            {/* Stats principali */}
            <div className="grid grid-cols-2 gap-2">
              {mainStats.map((stat, index) => {
                const Icon = stat.icon;
                const percent = stat.max > 0 ? (stat.value / stat.max) * 100 : 0;
                
                return (
                  <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-lg border border-amber-900/20 bg-gradient-to-br from-amber-50/30 to-amber-100/20 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-amber-900">
                          {stat.label}
                        </div>
                        <div className="text-xs text-amber-700">
                          {stat.value}/{stat.max}
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra progress */}
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-amber-200/30">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${stat.color.replace('text', 'bg')}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riga 2: Equipaggiamento */}
          <div className="rounded-xl border border-amber-900/20 bg-gradient-to-br from-amber-50/30 to-amber-100/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-amber-800" />
              <div className="text-sm font-semibold text-amber-900">Equipaggiamento</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { slot: 'Arma', value: resident.statSnapshot?.weapon || 'Nessuna' },
                { slot: 'Armatura', value: resident.statSnapshot?.armor || 'Nessuna' },
                { slot: 'Anello', value: resident.statSnapshot?.ring || 'Nessuno' },
              ].map((item) => (
                <div
                  key={item.slot}
                  className="rounded border border-amber-800/20 bg-amber-50/50 p-2 text-center"
                >
                  <div className="font-medium text-amber-900">{item.slot}</div>
                  <div className="text-amber-700">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Riga 3: Stats dettagliate */}
          <div className="rounded-xl border border-amber-900/20 bg-gradient-to-br from-amber-50/30 to-amber-100/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-amber-800" />
              <div className="text-sm font-semibold text-amber-900">Caratteristiche</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(resident.statSnapshot || {})
                .filter(([key, value]) => 
                  typeof value === 'number' && 
                  Number.isFinite(value) && 
                  !['hp', 'maxHp', 'portraitUrl', 'equipment', 'inventory'].includes(key)
                )
                .slice(0, 6)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between rounded border border-amber-800/20 bg-amber-50/50 p-2"
                  >
                    <span className="font-medium text-amber-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-amber-700">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedaPergamena;
