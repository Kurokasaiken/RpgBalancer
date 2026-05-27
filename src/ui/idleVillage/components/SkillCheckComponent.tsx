/**
 * SkillCheckComponent — Visual skill check resolution
 *
 * Mostra il calcolo del d20 roll visuale quando un'attività si completa.
 * Calcolo: 1d20 + residentSkill vs DC target
 *
 * Props:
 *  - dcTarget: number (Difficulty Class)
 *  - residentSkill: number (base skill value)
 *  - onComplete: (result: boolean) => void
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface SkillCheckComponentProps {
  dcTarget: number;
  residentSkill: number;
  activityName?: string;
  onComplete?: (result: { success: boolean; roll: number; total: number }) => void;
  autoStart?: boolean;
}

export function SkillCheckComponent({
  dcTarget,
  residentSkill,
  activityName = 'Activity',
  onComplete,
  autoStart = true,
}: SkillCheckComponentProps) {
  const [state, setStateInternal] = useState<'idle' | 'rolling' | 'complete'>('idle');
  const [d20Roll, setD20Roll] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [success, setSuccess] = useState<boolean>(false);

  // Perform skill check
  useEffect(() => {
    if (!autoStart || state !== 'idle') return;

    setStateInternal('rolling');

    // Simulate rolling (in tests, this is mocked to always succeed)
    const rollTimeout = setTimeout(() => {
      const roll = Math.floor(Math.random() * 20) + 1; // 1d20
      const totalRoll = roll + residentSkill;
      const isSuccess = totalRoll >= dcTarget;

      setD20Roll(roll);
      setTotal(totalRoll);
      setSuccess(isSuccess);
      setStateInternal('complete');

      if (onComplete) {
        onComplete({ success: isSuccess, roll, total: totalRoll });
      }
    }, 1500); // 1.5s animation time

    return () => clearTimeout(rollTimeout);
  }, [autoStart, dcTarget, residentSkill, state, onComplete]);

  if (state === 'idle') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Ready for skill check...</p>
      </div>
    );
  }

  return (
    <div
      data-testid="skill-check-component"
      style={{
        padding: '30px',
        textAlign: 'center',
        backgroundColor: state === 'complete' ? (success ? '#e8f5e9' : '#ffebee') : '#f5f5f5',
        borderRadius: '8px',
        border: `2px solid ${success ? '#4caf50' : '#f44336'}`,
      }}
    >
      <h3>{activityName}</h3>

      {state === 'rolling' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: '48px', marginBottom: '10px' }}
        >
          🎲
        </motion.div>
      )}

      {state === 'complete' && (
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {d20Roll}d20
            </div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
              + {residentSkill} (Skill) = <strong>{total}</strong>
            </div>

            <div style={{ marginBottom: '15px', fontSize: '16px' }}>
              <strong>DC {dcTarget}</strong>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: success ? '#4caf50' : '#f44336',
              }}
            >
              {success ? '✅ SUCCESS' : '❌ FAILURE'}
            </motion.div>

            {success ? (
              <p style={{ color: '#4caf50', marginTop: '10px' }}>You completed the task!</p>
            ) : (
              <p style={{ color: '#f44336', marginTop: '10px' }}>The task was too difficult.</p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
