import React from 'react';

/**
 * SkinButton — a role-tagged button. Inside a <SkinScope> it renders as the
 * skinned button with no color props:
 *
 *   variant="utility"   → struck-bronze plate (default)
 *   variant="secondary" → engraved-slate ghost
 *   variant="cta"       → the primary action: lacquer family plate with a brass hairline (BTN-1 = A; never the old plaque)
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
      <button
        type="button"
        data-skin="cta"
        className={className}
        disabled={disabled}
        {...rest}
      >
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
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default SkinButton;
