/**
 * VictoryComponent — Celebrazione dopo quest completion
 *
 * Mostra confetti, rewards gained, XP increase con animazioni.
 *
 * Props:
 *  - questTitle: string
 *  - rewards: { wood?: number, gold?: number, food?: number, xp: number }
 *  - onDismiss?: () => void
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface VictoryComponentProps {
  questTitle: string;
  rewards: {
    wood?: number;
    gold?: number;
    food?: number;
    xp: number;
  };
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export function VictoryComponent({
  questTitle,
  rewards,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 4000,
}: VictoryComponentProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDuration, onDismiss]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px',
      }}
    >
      {/* Confetti animation */}
      <div style={{ position: 'absolute', top: '-20px', left: '-20px', right: '-20px', bottom: '-20px' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: 100 }}
            transition={{ duration: 2, delay: i * 0.05 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              fontSize: '24px',
            }}
          >
            {'🎉'[i % 1]}
          </motion.div>
        ))}
      </div>

      <motion.h2
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{ color: '#4caf50', marginBottom: '20px', fontSize: '32px' }}
      >
        ✅ VICTORY!
      </motion.h2>

      <h3 style={{ color: '#333', marginBottom: '20px' }}>{questTitle} Completed</h3>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ color: '#666', marginBottom: '15px' }}>Rewards Earned:</h4>

        {rewards.wood !== undefined && rewards.wood > 0 && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ marginBottom: '10px', fontSize: '18px' }}
          >
            🌲 <strong>+{rewards.wood} Wood</strong>
          </motion.div>
        )}

        {rewards.gold !== undefined && rewards.gold > 0 && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ marginBottom: '10px', fontSize: '18px' }}
          >
            💰 <strong>+{rewards.gold} Gold</strong>
          </motion.div>
        )}

        {rewards.food !== undefined && rewards.food > 0 && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ marginBottom: '10px', fontSize: '18px' }}
          >
            🍖 <strong>+{rewards.food} Food</strong>
          </motion.div>
        )}

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #ddd',
            fontSize: '20px',
            color: '#ffc107',
          }}
        >
          ⭐ <strong>+{rewards.xp} Experience</strong>
        </motion.div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={() => {
          setVisible(false);
          if (onDismiss) onDismiss();
        }}
        style={{
          padding: '10px 30px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}
