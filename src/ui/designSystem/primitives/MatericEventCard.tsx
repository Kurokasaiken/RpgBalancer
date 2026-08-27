import React from 'react';
import { MatericFrame } from './MatericFrame';
import { MatericPlaque } from './MatericPlaque';
import { MatericBadge } from './MatericBadge';
import { MatericButton } from './MatericButton';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';

export interface MatericEventCardProps {
  /** Card mode. */
  variant?: 'modal' | 'reminder';
  /** Event label shown as a plaque in modal mode. */
  badge?: string;
  /** Main title. */
  title?: string;
  /** Subtitle or description. */
  subtitle?: string;
  /** Central image URL (e.g. goblin icon). */
  imageUrl?: string;
  /** Image alt text. */
  imageAlt?: string;
  /** Custom central image node; overrides the default <img> when provided. */
  image?: React.ReactNode;
  /** CTA label in modal mode. */
  actionLabel?: string;
  /** CTA handler. */
  onAction?: () => void;
  /** Days-left label shown in reminder mode. */
  daysLeftLabel?: string;
  /** Whether to paint the inner floor inside the frame. */
  floor?: boolean;
  /** Additional content. */
  children?: React.ReactNode;
  /** Extra CSS class. */
  className?: string;
  /** Inline styles. */
  style?: React.CSSProperties;
}

/**
 * Golden event/announcement card.
 *
 * Used for world-surface events, invasions, and time-limited notices.
 * Renders a central image, title, optional subtitle, and CTA using only
 * frame-only primitives (no thick nested borders).
 *
 * @example
 * ```tsx
 * <MatericEventCard
 *   title="Goblin Invasion"
 *   subtitle="5 days remain"
 *   badge="Invasion"
 *   imageUrl="/goblin-march-trasparente.png"
 *   actionLabel="Scout the frontier"
 *   onAction={() => {}}
 * />
 * ```
 */
export const MatericEventCard: React.FC<MatericEventCardProps> = ({
  variant = 'modal',
  badge,
  title,
  subtitle,
  imageUrl,
  imageAlt = '',
  image,
  actionLabel,
  onAction,
  daysLeftLabel,
  floor = true,
  children,
  className,
  style,
}) => {
  const defaultImage = imageUrl ? (
    <img
      src={imageUrl}
      alt={imageAlt}
      style={
        variant === 'reminder'
          ? { width: 56, height: 56, objectFit: 'contain', display: 'block' }
          : { width: 120, height: 120, objectFit: 'contain', margin: '16px auto 0', display: 'block' }
      }
    />
  ) : null;

  return (
    <MatericFrame
      variant="molding"
      floor={floor}
      className={className}
      style={{ maxWidth: 360, textAlign: 'center', position: 'relative', ...style }}
    >
      <SkinScope style={{ position: 'relative', zIndex: 1, padding: 24 }}>
        {variant === 'reminder' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {image ?? defaultImage}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <SkinTitle level="1" style={{ fontSize: 16, lineHeight: 1.2 }}>{title}</SkinTitle>}
              {subtitle && <SkinTitle level="subtitle" style={{ fontSize: 11, opacity: 0.85 }}>{subtitle}</SkinTitle>}
              {daysLeftLabel && (
                <MatericBadge style={{ marginTop: 4 }}>{daysLeftLabel}</MatericBadge>
              )}
            </div>
          </div>
        ) : (
          <>
            {badge && <MatericPlaque style={{ display: 'inline-block', marginBottom: 8 }}>{badge}</MatericPlaque>}
            {title && <SkinTitle level="1">{title}</SkinTitle>}
            {subtitle && <SkinTitle level="subtitle">{subtitle}</SkinTitle>}
            {image ?? defaultImage}
            {actionLabel && (
              <MatericButton onClick={onAction} style={{ marginTop: 20 }}>
                {actionLabel}
              </MatericButton>
            )}
            {children}
          </>
        )}
      </SkinScope>
    </MatericFrame>
  );
};

export default MatericEventCard;
