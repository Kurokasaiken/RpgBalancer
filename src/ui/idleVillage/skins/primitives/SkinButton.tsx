import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkinButton — a role-tagged button. Inside a <SkinScope> it renders as the
 * skinned button with no color props:
 *
 *   variant="utility"   → struck-bronze plate (default)
 *   variant="secondary" → engraved-slate ghost
 *   variant="cta"       → arcane azure-violet notched plate (the "AVVIA" primary action)
 */
export type SkinButtonVariant = 'utility' | 'secondary' | 'cta';

export interface SkinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SkinButtonVariant;
  /** For variant="cta": show the flanking ◈ ornaments (default false). */
  ornaments?: boolean;
}

export const SkinButton: React.FC<SkinButtonProps> = ({
  variant = 'utility',
  ornaments = false,
  disabled,
  className,
  children,
  ...rest
}) => {
  if (variant === 'cta') {
    const button = (
      <motion.button
        type="button"
        data-skin="cta"
        className={className}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 14 }}
        {...rest}
      >
        {children}
      </motion.button>
    );
    if (!ornaments) return button;
    return (
      <span data-skin="cta-wrap">
        <span data-skin="cta-ornament" aria-hidden>◈</span>
        {button}
        <span data-skin="cta-ornament" aria-hidden>◈</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      data-skin="button"
      data-variant={variant === 'secondary' ? 'secondary' : undefined}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default SkinButton;
