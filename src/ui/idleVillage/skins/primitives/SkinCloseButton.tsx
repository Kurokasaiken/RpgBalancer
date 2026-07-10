import React from 'react';

/**
 * SkinCloseButton — the gold radial "coin" close button. Inside a <SkinScope>
 * it needs no color props.
 *
 *   corner → absolute-position it in the top-right of the nearest positioned
 *            ancestor (a panel/modal). Omit to place it inline.
 */
export interface SkinCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  corner?: boolean;
}

export const SkinCloseButton: React.FC<SkinCloseButtonProps> = ({
  corner = false,
  className,
  'aria-label': ariaLabel = 'Chiudi',
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      data-skin="close"
      data-corner={corner ? '' : undefined}
      aria-label={ariaLabel}
      className={className}
      {...rest}
    >
      {children ?? '×'}
    </button>
  );
};

export default SkinCloseButton;
