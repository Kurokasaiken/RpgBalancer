/**
 * PhysicalButton.tsx
 * Bottone skeuomorfico con squash/stretch fisica.
 * buttonSquash e buttonLift vengono da PhysicsConfig.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PhysicsConfig } from '../config/physicsDefaults';

type ButtonVariant = 'primary' | 'ghost' | 'disabled';

interface PhysicalButtonProps {
  cfg: PhysicsConfig;
  label: string;
  icon?: string;
  variant?: ButtonVariant;
  onClick?: () => void;
}

export function PhysicalButton({
  cfg,
  label,
  icon,
  variant = 'primary',
  onClick,
}: PhysicalButtonProps) {
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = () => {
    if (variant === 'disabled') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 380);
      return;
    }
    onClick?.();
  };

  // ── Shared base styles ──────────────────────────────────
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display, Cinzel)',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '.28em',
    textTransform: 'uppercase',
    borderRadius: '3px',
    padding: '10px 22px',
    border: 'none',
    cursor: variant === 'disabled' ? 'not-allowed' : 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: icon ? '8px' : '0',
    justifyContent: 'center',
    transition: 'transform 0.15s cubic-bezier(.34,1.56,.64,1)',
  };

  // ── Variant-specific styles ───────────────────────────────
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: `
            linear-gradient(135deg, var(--iron-md, #181c24) 0%, var(--iron-dk, #0c0e12) 100%)
          `,
          border: '1px solid var(--go3, #786000)',
          color: 'var(--t1, #c8b88a)',
          boxShadow: `
            0 8px 28px rgba(0,0,0,.95),
            0 3px 8px rgba(0,0,0,1),
            0 0 0 1px rgba(80,64,0,.08),
            inset 0 2px 0 rgba(255,255,255,.055),
            inset 0 -2px 0 rgba(0,0,0,.88)
          `,
        };
      
      case 'ghost':
        return {
          background: 'transparent',
          border: '1px solid rgba(200,160,48,0.3)',
          color: 'var(--go6, #e0bc50)',
          boxShadow: 'none',
        };
      
      case 'disabled':
        return {
          background: `
            linear-gradient(135deg, var(--iron-dk, #0c0e12) 0%, var(--t0, #020304) 100%)
          `,
          border: '1px solid rgba(80,64,0,0.2)',
          color: 'var(--t3, #3c2c20)',
          boxShadow: `
            inset 0 2px 0 rgba(0,0,0,.5),
            inset 0 -2px 0 rgba(0,0,0,.8)
          `,
        };
      
      default:
        return {};
    }
  };

  // ── Animation variants ───────────────────────────────────
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: variant === 'primary' ? cfg.buttonLift : 1.02,
      boxShadow: variant === 'primary' ? `
        0 12px 35px rgba(0,0,0,.96),
        0 6px 14px rgba(0,0,0,1),
        0 0 0 1px var(--go4, #a08020),
        0 0 44px var(--acc-glow, rgba(200,160,48,.38)),
        inset 0 2px 0 rgba(255,255,255,.08),
        inset 0 -2px 0 rgba(0,0,0,.85)
      ` : undefined
    },
    tap: { 
      scale: variant === 'primary' ? cfg.buttonSquash : 0.98,
      transition: { duration: 0.1 }
    },
    shake: {
      x: [0, -4, 4, -4, 4, -2, 2, 0],
      transition: { duration: 0.38 }
    }
  };

  return (
    <motion.button
      style={{ ...baseStyle, ...getVariantStyles() }}
      variants={buttonVariants}
      initial="idle"
      whileHover={variant !== 'disabled' ? "hover" : "idle"}
      whileTap={variant !== 'disabled' ? "tap" : "idle"}
      animate={isShaking ? "shake" : "idle"}
      onClick={handleClick}
    >
      {/* Icon */}
      {icon && (
        <span style={{ fontSize: '12px', lineHeight: 1 }}>
          {icon}
        </span>
      )}
      
      {/* Label */}
      <span style={{ 
        textShadow: variant === 'primary' ? '0 0 8px var(--acc-glow, rgba(200,160,48,.38))' : 'none',
        whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
      
      {/* Subtle gradient overlay for primary variant */}
      {variant === 'primary' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '3px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.button>
  );
}
