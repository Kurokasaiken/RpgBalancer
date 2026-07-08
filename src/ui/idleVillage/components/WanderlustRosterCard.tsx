import { memo, useCallback, useState, type CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { WanderlustStatBar } from '@/ui/wanderlust-surface/layout/WanderlustStatBar';
import { WanderlustPortrait } from '@/ui/wanderlust-surface/layout/WanderlustPortrait';
import type { ResidentCompatibilityState } from './ResidentRosterTypes';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST ROSTER CARD
 *
 *  Wanderlust-styled resident card matching roster_wanderlust_reskin.html.
 *  - Grid layout: identity (left), bars (center), portrait (right)
 *  - Gradient background with inset shadows
 *  - Gold rail on left side on hover
 *  - Cinzel typography for name, sans for role/labels
 *  - Circular portrait with gold border
 *  - HP/Stamina bars with gold styling and specular highlight
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustRosterCardProps {
  workerId: string;
  label: string;
  subtitle?: string;
  hp: number;
  fatigue: number;
  maxHp?: number;
  isDragging?: boolean;
  disabled?: boolean;
  className?: string;
  statusLabel?: string;
  isInteractive?: boolean;
  onDragStateChange?: (workerId: string, isDragging: boolean) => void;
  onSelect?: (workerId: string) => void;
  portraitUrl?: string;
  compatibilityState?: ResidentCompatibilityState;
  compatibilityLabel?: string;
  isHero?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

// Wanderlust color tokens (matching roster_wanderlust_reskin.html)
const COLOR = {
  gold: '#d8b13e',
  goldBright: '#f0cf6a',
  label: '#c9a84e',
  labelDim: '#9a8246',
  parchment: '#ede0c4',
  parchmentSoft: 'rgba(237,224,196,0.92)',
  hp: '#7bc96f',
  hpDim: 'rgba(123,201,111,0.85)',
  stamina: '#e0b23e',
} as const;

const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
  serif: 'var(--wl-font-serif, "EB Garamond", Georgia, serif)',
  sans: 'var(--wl-font-sans, system-ui, sans-serif)',
} as const;

const ENGRAVE = {
  thin: '0 1px 2px rgba(0,0,0,0.7)',
  faint: '0 1px 1px rgba(0,0,0,0.5)',
} as const;

const WanderlustRosterCard = memo<WanderlustRosterCardProps>(({
  workerId,
  label,
  subtitle,
  hp,
  fatigue,
  maxHp = 100,
  isDragging: propIsDragging = false,
  disabled = false,
  className,
  statusLabel,
  isInteractive = true,
  onDragStateChange,
  onSelect,
  portraitUrl,
  compatibilityState,
  compatibilityLabel,
  isHero = false,
  onPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging: dndIsDragging } = useDraggable({
    id: workerId,
    disabled: disabled || !isInteractive,
    data: {
      workerId,
      label,
      portraitUrl,
      type: 'resident',
      // Stats payload consumed by drop targets (e.g. JobPOI) for requirement checks
      resident: { stats: { hp }, fatigue }
    }
  });

  // Capture drag start via pointer down and set cursor offset for correct drag positioning
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Store cursor offset globally for CustomDragOverlay modifier
    if (typeof window !== 'undefined') {
      (window as any).__dragCursorOffset = {
        x: offsetX,
        y: offsetY,
        width: rect.width,
        height: rect.height,
      };

      // Calculate and store the REAL portrait center for spring-back animation
      const portraitImg = event.currentTarget.querySelector('img');
      if (portraitImg) {
        const portraitRect = portraitImg.getBoundingClientRect();
        (window as any).__dragHomeCenter = {
          x: portraitRect.left + portraitRect.width / 2,
          y: portraitRect.top + portraitRect.height / 2,
        };
      } else {
        // Fallback: use card center if no portrait image found
        (window as any).__dragHomeCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }

    onPointerDown?.(event);
  }, [onPointerDown]);

  const isDragging = dndIsDragging || propIsDragging;
  const isUnavailable = disabled || !isInteractive;
  const computedStatusLabel = statusLabel ?? (isUnavailable ? 'Unavailable' : 'Available');

  const handleClick = useCallback(() => {
    if (!isUnavailable && onSelect) {
      onSelect(workerId);
    }
  }, [workerId, isUnavailable, onSelect]);

  // Card container style (matching roster_wanderlust_reskin.html)
  const cardStyle: CSSProperties = {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '20px',
    padding: '18px 22px',
    borderRadius: '14px',
    cursor: isUnavailable ? 'not-allowed' : isInteractive ? 'grab' : 'default',
    background: 'linear-gradient(160deg, rgba(216,177,62,0.05) 0%, rgba(20,12,7,0.2) 45%, rgba(6,4,3,0.3) 100%)',
    boxShadow: `
      inset 0 1px 0 rgba(216,177,62,0.1),
      inset 0 2px 10px rgba(0,0,0,0.35),
      inset 0 -1px 0 rgba(0,0,0,0.3)
    `,
    transition: 'transform 300ms ease, box-shadow 300ms ease',
    // Alpha states: 0.5 while dragged, 0.35 when unavailable (away/injured/locked)
    opacity: isDragging ? 0.5 : isUnavailable ? 0.35 : 1,
    filter: isUnavailable && !isDragging ? 'grayscale(0.9)' : undefined,
    // While in alpha the card is read-only: no interactions
    pointerEvents: isDragging || isUnavailable ? 'none' : undefined,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    willChange: 'transform',
  };

  // Ring glow for hover and active heroes
  const ringGlow = isHero 
    ? `0 0 0 1px rgba(216,177,62,0.3)`
    : isHovered 
      ? `0 0 0 1px rgba(216,177,62,0.28), 0 10px 34px rgba(216,177,62,0.08)`
      : 'none';

  const heroGlowStyle: CSSProperties = {
    boxShadow: isHero
      ? `
        inset 0 1px 0 rgba(240,207,106,0.2),
        inset 0 2px 10px rgba(0,0,0,0.35),
        0 0 16px rgba(216,177,62,0.12),
        ${ringGlow}
      `
      : `${cardStyle.boxShadow}, ${ringGlow}`,
  };

  // Hero border style
  const heroBorderStyle: CSSProperties = isHero
    ? {
        position: 'absolute',
        inset: 0,
        borderRadius: '10px',
        pointerEvents: 'none',
        boxShadow: 'inset 0 0 0 1px rgba(216,177,62,0.25)',
      }
    : {};

  // Gold rail style (appears on hover) - DISABLED
  const railStyle: CSSProperties = {
    position: 'absolute',
    left: '-2px',
    top: '20%',
    height: '60%',
    width: '0px',
    borderRadius: '2px',
    background: 'linear-gradient(180deg, transparent, #f0cf6a, transparent)',
    boxShadow: 'none',
    transition: 'none',
    zIndex: 2,
  };

  // Nebula/glow background
  const nebulaStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse 180px 120px at 78% 30%, rgba(216,177,62,0.08), transparent 70%)',
    mixBlendMode: 'screen',
    opacity: isHero ? 0.8 : 0.5,
    borderRadius: '14px',
  };

  const identityStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '160px',
  };

  const nameStyle: CSSProperties = {
    fontFamily: FONT.display,
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.03em',
    color: COLOR.parchment,
    textShadow: `0 1px 0 rgba(0,0,0,0.6), 0 0 14px rgba(240,207,106,0.06)`,
  };

  const roleStyle: CSSProperties = {
    fontFamily: FONT.sans,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: COLOR.labelDim,
    textShadow: ENGRAVE.thin,
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  };

  const dotStyle: CSSProperties = {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: COLOR.hp,
    boxShadow: isHero 
      ? '0 0 7px rgba(123,201,111,0.7)'
      : '0 0 7px rgba(123,201,111,0.7)',
    display: 'inline-block',
    animation: isHero ? 'glow-breath 3s ease-in-out infinite' : 'none',
  };

  const barsStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const barBlockStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={className}
      style={{
        ...cardStyle,
        ...heroGlowStyle,
      }}
      onClick={handleClick}
      onPointerDown={(e) => {
        handlePointerDown(e);
        listeners?.onPointerDown?.(e);
      }}
      onMouseEnter={() => {
        if (isInteractive && !isUnavailable) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (isInteractive && !isUnavailable) {
          setIsHovered(false);
        }
      }}
      data-worker-id={workerId}
      data-compatibility={compatibilityState}
    >
      {/* Nebula/glow background */}
      <div style={nebulaStyle} />

      {/* Gold rail (appears on hover) */}
      <div data-rail style={railStyle} />

      {/* Hero border */}
      {isHero && <div style={heroBorderStyle} />}

      {/* Identity section */}
      <div style={identityStyle}>
        <div style={nameStyle}>{label}</div>
        {subtitle && (
          <div style={roleStyle}>
            <span style={dotStyle} />
            {subtitle}
          </div>
        )}
      </div>

      {/* Stat bars */}
      <div style={barsStyle}>
        <div style={barBlockStyle}>
          <WanderlustStatBar
            label="HP"
            value={hp}
            maxValue={maxHp}
            variant="hp"
            size="md"
          />
        </div>
        <div style={barBlockStyle}>
          <WanderlustStatBar
            label="Stamina"
            value={100 - fatigue}
            maxValue={100}
            variant="stamina"
            size="md"
          />
        </div>
      </div>

      {/* Portrait */}
      <WanderlustPortrait
        portraitUrl={portraitUrl}
        initials={label.charAt(0).toUpperCase()}
        size={56}
        isHero={isHero}
      />
    </div>
  );
});

WanderlustRosterCard.displayName = 'WanderlustRosterCard';

// Global styles for animations
if (typeof document !== 'undefined') {
  const styleId = 'wanderlust-roster-card-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes glow-breath {
        0%, 100% { 
          box-shadow: 0 0 7px rgba(123,201,111,0.7);
        }
        50% { 
          box-shadow: 0 0 14px rgba(123,201,111,0.9), 0 0 20px rgba(123,201,111,0.4);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default WanderlustRosterCard;
