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
  /** Days-left numeric value; when present the card renders label + large number. */
  daysLeftValue?: number;
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
  daysLeftValue,
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

  const content = (
    <SkinScope style={{ position: 'relative', zIndex: 1, padding: variant === 'reminder' ? 18 : 24 }}>
      {variant === 'reminder' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 'auto',
                height: 'auto',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {image ?? defaultImage}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
              {children ?? (
                <>
                  {title && (
                    <SkinTitle
                      level="1"
                      style={{
                        fontSize: 30,
                        lineHeight: 1.05,
                        letterSpacing: '0.04em',
                        textShadow: '0 1px 0 rgba(0,0,0,.9), 0 2px 4px rgba(0,0,0,.6)',
                      }}
                    >
                      {title}
                    </SkinTitle>
                  )}
                  {subtitle && <SkinTitle level="subtitle" style={{ fontSize: 11, opacity: 0.85 }}>{subtitle}</SkinTitle>}
                  {daysLeftValue !== undefined ? (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      {daysLeftLabel && (
                        <SkinTitle
                          level="subtitle"
                          style={{
                            fontSize: 11,
                            letterSpacing: '0.18em',
                            lineHeight: 1.3,
                            textTransform: 'uppercase',
                            opacity: 0.85,
                          }}
                        >
                          {daysLeftLabel}
                        </SkinTitle>
                      )}
                      <SkinTitle
                        level="1"
                        style={{
                          fontSize: 40,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          textShadow: '0 0 14px rgba(240,207,106,.4), 0 2px 4px rgba(0,0,0,.6)',
                        }}
                      >
                        {daysLeftValue}
                      </SkinTitle>
                    </div>
                  ) : daysLeftLabel ? (
                    <MatericBadge style={{ marginTop: 4 }}>{daysLeftLabel}</MatericBadge>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {badge && (
              <MatericPlaque
                style={{
                  display: 'inline-block',
                  marginBottom: 8,
                  border: '1px solid rgba(240,207,106,.45)',
                  color: '#f0cf6a',
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textShadow: '0 0 8px rgba(240,207,106,.5), 0 1px 2px rgba(0,0,0,.8)',
                  boxShadow: '0 0 12px rgba(240,207,106,.18), inset 0 1px 0 rgba(255,240,180,.15)',
                }}
              >
                {badge}
              </MatericPlaque>
            )}
            {title && <SkinTitle level="1">{title}</SkinTitle>}
            {subtitle && <SkinTitle level="subtitle" style={{ marginBottom: 12 }}>{subtitle}</SkinTitle>}
            {image ?? defaultImage}
            {actionLabel && (
              <MatericButton
                onClick={onAction}
                style={{
                  marginTop: 20,
                  background: 'linear-gradient(180deg, #7a5225, #3b2414)',
                  border: '1px solid rgba(240,207,106,.45)',
                  color: '#ffe5a0',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  boxShadow: '0 4px 12px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,240,180,.25)',
                  textShadow: '0 1px 2px rgba(0,0,0,.7)',
                }}
              >
                {actionLabel}
              </MatericButton>
            )}
            {children}
          </>
        )}
      </SkinScope>
  );

  return variant === 'reminder' ? (
    <div className={className} style={{ position: 'relative', maxWidth: 360, textAlign: 'center', ...style }}>
      {content}
    </div>
  ) : (
    <MatericFrame variant="molding" className={className} style={{ maxWidth: 360, textAlign: 'center', position: 'relative', ...style }}>
      {content}
    </MatericFrame>
  );
};

export default MatericEventCard;
