/**
 * Skin role primitives — declare a UI role, inherit the active skin.
 *
 * Wrap a subtree in <SkinScope> and use these instead of raw <button>/<h1>…
 * to guarantee V9 (or any active preset) styling without hardcoding colors.
 * The scope's CSS lives in `../skinScope.css` (imported globally in main.tsx).
 */
export { SkinScope, type SkinScopeProps } from './SkinScope';
export { SkinTitle, type SkinTitleProps } from './SkinTitle';
export { SkinButton, type SkinButtonProps, type SkinButtonVariant } from './SkinButton';
export { SkinCloseButton, type SkinCloseButtonProps } from './SkinCloseButton';
export { SkinBadge, type SkinBadgeProps } from './SkinBadge';
