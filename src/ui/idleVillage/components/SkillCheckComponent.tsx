import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SkillCheckComponentProps {
  dcTarget: number;
  residentSkill: number;
  activityName?: string;
  onComplete?: (result: { success: boolean; roll: number; total: number }) => void;
  autoStart?: boolean;
}

const D20_FACES = Array.from({ length: 20 }, (_, i) => i + 1);

export function SkillCheckComponent({
  dcTarget,
  residentSkill,
  activityName = 'Activity',
  onComplete,
  autoStart = true,
}: SkillCheckComponentProps) {
  const [state, setState] = useState<'idle' | 'rolling' | 'complete'>('idle');
  const [d20Roll, setD20Roll] = useState(0);
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState(false);
  const [rollingFace, setRollingFace] = useState(1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!autoStart) return;

    setState('rolling');

    const flickerInterval = setInterval(() => {
      setRollingFace(D20_FACES[Math.floor(Math.random() * 20)]);
    }, 80);

    const rollTimeout = setTimeout(() => {
      clearInterval(flickerInterval);
      const roll = Math.floor(Math.random() * 20) + 1;
      const totalRoll = roll + residentSkill;
      const isSuccess = totalRoll >= dcTarget;
      setD20Roll(roll);
      setTotal(totalRoll);
      setSuccess(isSuccess);
      setState('complete');
      onCompleteRef.current?.({ success: isSuccess, roll, total: totalRoll });
    }, 1800);

    return () => {
      clearInterval(flickerInterval);
      clearTimeout(rollTimeout);
      setState('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const isCrit = d20Roll === 20;
  const isFumble = d20Roll === 1;

  const accentColor = useMemo(() => {
    if (state !== 'complete') return 'rgba(200,160,60,.75)';
    if (isCrit) return '#fcd34d';
    if (success) return '#6ee7b7';
    if (isFumble) return '#f43f5e';
    return '#fb923c';
  }, [state, success, isCrit, isFumble]);

  const glowShadow = useMemo(() => {
    if (state === 'rolling') return '0 0 40px rgba(200,160,60,.3)';
    if (!success) return '0 0 40px rgba(244,63,94,.25)';
    if (isCrit) return '0 0 60px rgba(252,211,77,.4)';
    return '0 0 40px rgba(16,185,129,.3)';
  }, [state, success, isCrit]);

  if (state === 'idle') {
    return (
      <div
        data-testid="skill-check-component"
        className="flex flex-col items-center justify-center gap-4 py-12"
        style={{ fontFamily: "'Palatino Linotype', Palatino, serif" }}
      >
        <div className="text-4xl opacity-30">🎲</div>
        <p style={{ fontSize: 'clamp(8px, 1vw, 11px)', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(200,160,60,.5)' }}>
          Pronto per il tiro di abilità
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="skill-check-component"
      className="relative overflow-hidden"
      style={{
        background: '#07090e',
        borderRadius: 16,
        border: `1px solid ${state === 'complete' ? (success ? 'rgba(16,185,129,.3)' : 'rgba(244,63,94,.3)') : 'rgba(150,115,35,.2)'}`,
        boxShadow: glowShadow,
        fontFamily: "'Palatino Linotype', Palatino, serif",
      }}
    >
      {/* Stone texture */}
      <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.08 }} aria-hidden>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="skstone"><feTurbulence type="fractalNoise" baseFrequency=".48 .52" numOctaves="4" seed="12" /><feColorMatrix type="matrix" values="0 0 0 0 .06 0 0 0 0 .08 0 0 0 0 .05 0 0 0 1 0" /></filter>
          <rect width="100%" height="100%" filter="url(#skstone)" />
        </svg>
      </div>

      <div className="relative flex flex-col items-center gap-6 px-8 py-10" style={{ zIndex: 2 }}>
        {/* Activity name */}
        <div style={{
          fontSize: 'clamp(6px, 0.7vw, 9px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: 'rgba(195,155,55,.5)',
        }}>
          {activityName}
        </div>

        {/* Die area */}
        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
          {/* Outer ring */}
          <svg className="absolute inset-0" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="skring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} stopOpacity=".6" />
                <stop offset="50%" stopColor={accentColor} stopOpacity=".2" />
                <stop offset="100%" stopColor={accentColor} stopOpacity=".5" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill="none" stroke="url(#skring)" strokeWidth="1.5" />
            {state === 'rolling' && (
              <circle cx="60" cy="60" r="56" fill="none" stroke={accentColor} strokeWidth="2" strokeDasharray="20 332" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>

          {/* Die center */}
          <div className="flex flex-col items-center justify-center rounded-full" style={{
            width: 96, height: 96,
            background: 'radial-gradient(circle, #0d0f18 0%, #050608 100%)',
            border: `1px solid rgba(${success ? '16,185,129' : state === 'rolling' ? '200,160,60' : '244,63,94'},.25)`,
          }}>
            <AnimatePresence mode="wait">
              {state === 'rolling' ? (
                <motion.div
                  key="rolling"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  style={{ fontSize: 36, color: 'rgba(200,160,60,.9)' }}
                >
                  {rollingFace}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <span style={{
                    fontSize: 36, fontWeight: 'bold',
                    color: isCrit ? '#fcd34d' : isFumble ? '#f43f5e' : accentColor,
                    textShadow: `0 0 20px ${accentColor}`,
                  }}>
                    {d20Roll}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Calculation breakdown */}
        {state === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Roll math */}
            <div className="flex items-center gap-2" style={{
              fontSize: 'clamp(9px, 1vw, 13px)',
              letterSpacing: '0.15em',
              color: 'rgba(215,200,165,.7)',
            }}>
              <span style={{ color: accentColor, fontWeight: 'bold' }}>{d20Roll}</span>
              <span style={{ opacity: 0.4 }}>d20</span>
              <span style={{ opacity: 0.3 }}>+</span>
              <span>{residentSkill}</span>
              <span style={{ opacity: 0.4 }}>skill</span>
              <span style={{ opacity: 0.3 }}>=</span>
              <span style={{ color: accentColor, fontWeight: 'bold', fontSize: '1.2em' }}>{total}</span>
            </div>

            {/* DC bar */}
            <div className="flex items-center gap-3" style={{
              fontSize: 'clamp(7px, 0.75vw, 9px)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
            }}>
              <span style={{ color: 'rgba(170,180,170,.4)' }}>DC</span>
              <span style={{ color: 'rgba(215,200,165,.8)', fontWeight: 'bold' }}>{dcTarget}</span>
              <span style={{
                width: 1, height: 12,
                background: 'rgba(150,115,35,.2)',
              }} />
              <span style={{ color: accentColor, fontWeight: 'bold' }}>
                {total} {total >= dcTarget ? '≥' : '<'} {dcTarget}
              </span>
            </div>

            {/* Result */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: 4,
                padding: '4px 16px',
                borderRadius: 12,
                border: `1px solid ${success ? 'rgba(16,185,129,.4)' : 'rgba(244,63,94,.4)'}`,
                background: success ? 'rgba(10,80,50,.2)' : 'rgba(80,10,20,.2)',
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: 'clamp(6px, 0.7vw, 9px)',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: success ? 'rgba(105,225,165,.9)' : 'rgba(255,130,130,.9)',
              }}
            >
              {isCrit ? 'Critico Naturale!' : isFumble ? 'Fumble!' : success ? 'Successo' : 'Fallimento'}
            </motion.div>

            {/* Flavor text */}
            <div style={{
              fontSize: 'clamp(8px, 0.85vw, 11px)',
              fontStyle: 'italic',
              color: 'rgba(215,200,165,.45)',
              marginTop: 2,
            }}>
              {isCrit
                ? 'Il destino sorride ai valorosi.'
                : isFumble
                  ? 'Gli dei voltano le spalle.'
                  : success
                    ? 'La prova è superata.'
                    : 'La sfida si rivela troppo ardua.'}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
