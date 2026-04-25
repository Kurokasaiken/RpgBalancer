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
    fontFamily: 'var(--font-ui, "Cinzel", serif)',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '.28em',
    textTransform: 'uppercase',
    borderRadius: '3px',
    padding: '10px 22px',
    border: 'none',
    cursor: variant === 'disabled' ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
  };

  // ── Variant-specific styles ─────────────────────────────
  const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(155deg, var(--go3,#786000) 0%, var(--go4,#a08020) 42%, var(--go3,#786000) 100%)`,
      color: 'var(--abyss, #03040a)',
      border: '1px solid var(--go5, #c8a030)',
      textShadow: '0 1px 1px rgba(0,0,0,.3)',
      boxShadow: `
        0 5px 20px rgba(0,0,0,.88),
        0 0 22px var(--acc-glow, rgba(200,160,48,.38)),
        inset 0 2px 0 rgba(255,255,255,.18),
        inset 0 -2px 0 rgba(0,0,0,.35)
      `,
    },
    ghost: {
      background: 'rgba(8,6,2,.65)',
      color: 'var(--go5, #c8a030)',
      border: '1px solid rgba(100,80,0,.32)',
      boxShadow: `
        0 3px 10px rgba(0,0,0,.7),
        inset 0 1px 0 rgba(255,255,255,.02)
      `,
    },
    disabled: {
      background: 'rgba(18,16,12,.82)',
      color: 'var(--t3, #3c2c20)',
      border: '1px solid rgba(40,32,18,.48)',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,.62)',
    },
  };

  // ── Framer Motion variants ──────────────────────────────
  const motionVariants = {
    idle: { scale: 1, y: 0 },
    hover: {
      scale: variant === 'disabled' ? 1 : cfg.buttonLift,
      y: variant === 'disabled' ? 0 : -2,
      filter: variant === 'disabled' ? 'none' : 'brightness(1.12)',
    },
    tap: {
      scale: variant === 'disabled' ? 1 : cfg.buttonSquash,
      scaleY: variant === 'disabled' ? 1 : cfg.buttonSquash,
      y: variant === 'disabled' ? 0 : 2,
      filter: variant === 'disabled' ? 'none' : 'brightness(.88)',
    },
    shake: {
      x: [0, -5, 5, -4, 4, -2, 2, 0],
      transition: { duration: 0.36, ease: 'easeInOut' },
    },
  };

  return (
    <motion.button
      variants={motionVariants}
      initial="idle"
      animate={isShaking ? 'shake' : 'idle'}
      whileHover={variant !== 'disabled' ? 'hover' : undefined}
      whileTap={variant !== 'disabled' ? 'tap' : undefined}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
      onClick={handleClick}
      style={{ ...baseStyle, ...variantStyle[variant] }}
    >
      {/* Sheen effect */}
      {variant !== 'disabled' && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent)',
            transform: 'skewX(-18deg)',
          }}
          initial={{ x: '-110%' }}
          whileHover={{ x: '160%' }}
          transition={{ duration: 0.48, ease: 'easeOut' }}
        />
      )}

      {icon && <span style={{ fontSize: '12px' }}>{icon}</span>}
      {label}
    </motion.button>
  );
}
