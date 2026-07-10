import React from 'react';

/**
 * SkinButton — a role-tagged button. Inside a <SkinScope> it renders as the
 * skinned button with no color props:
 *
 *   variant="utility"   → struck-bronze plate (default)
 *   variant="secondary" → engraved-slate ghost
 *   variant="cta"       → gold notched plaque (the "AVVIA" primary action),
 *                         wrapped with flanking ◈ ornaments
 */
export type SkinButtonVariant = 'utility' | 'secondary' | 'cta';

export interface SkinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SkinButtonVariant;
  /** For variant="cta": show the flanking ◈ ornaments (default true). */
  ornaments?: boolean;
}

export const SkinButton: React.FC<SkinButtonProps> = ({
  variant = 'utility',
  ornaments = true,
  className,
  children,
  ...rest
}) => {
  if (variant === 'cta') {
    const button = (
      <button type="button" data-skin="cta" className={className} {...rest}>
        {children}
      </button>
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
      {...rest}
    >
      {children}
    </button>
  );
};

export default SkinButton;
