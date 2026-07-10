import React from 'react';

/**
 * SkinScope — opt a subtree into automatic, role-based skin inheritance.
 *
 * Everything rendered inside inherits the active `--skin-*` tokens via the
 * descendant rules in `skinScope.css`: <h1> becomes a gold incised title,
 * <button> becomes a bronze plate, `[data-skin="close"]` a gold coin, etc.
 * No colors are set here — declare roles, not values.
 *
 * Usage:
 *   <SkinScope>
 *     <h1>Titolo</h1>
 *     <SkinButton>Azione</SkinButton>
 *   </SkinScope>
 */
export interface SkinScopeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a different element (e.g. 'section', 'aside'). Default 'div'. */
  as?: keyof React.JSX.IntrinsicElements;
}

export const SkinScope: React.FC<SkinScopeProps> = ({
  as: Tag = 'div',
  className,
  children,
  ...rest
}) => {
  const Component = Tag as React.ElementType;
  return (
    <Component className={['skin-scope', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Component>
  );
};

export default SkinScope;
