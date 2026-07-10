import React from 'react';

/**
 * SkinBadge — an azure status pill. Inside a <SkinScope> it needs no color props.
 */
export interface SkinBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const SkinBadge: React.FC<SkinBadgeProps> = ({ className, children, ...rest }) => {
  return (
    <span data-skin="badge" className={className} {...rest}>
      {children}
    </span>
  );
};

export default SkinBadge;
