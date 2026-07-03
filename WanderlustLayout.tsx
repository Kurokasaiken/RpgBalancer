import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST LAYOUT PRIMITIVES v2
 *
 *  Built on two golden rules:
 *  1. INVISIBLE GRID — 6-step spacing scale, no hand-written px values.
 *  2. ENGRAVED TEXT — every glyph carved into the #030202 field.
 *
 *  And one structural rule:
 *  3. THREE-TIER HIERARCHY — primary (hero), secondary (focal), tertiary.
 *
 *  Text/data only. Living elements (slots, racks, seals) composed separately.
 * ════════════════════════════════════════════════════════════════════════ */

// ─── Spacing Scale ───────────────────────────────────────────────────

export const SPACE = {
  xs:  'var(--wl-space-xs,  4px)',
  sm:  'var(--wl-space-sm,  8px)',
  md:  'var(--wl-space-md, 12px)',
  lg:  'var(--wl-space-lg, 16px)',
  xl:  'var(--wl-space-xl, 24px)',
  xxl: 'var(--wl-space-xxl, 32px)',
} as const;

export type SpaceKey = keyof typeof SPACE;
const sp = (k: SpaceKey) => SPACE[k];

// ─── Engraving Profiles ─────────────────────────────────────────────

const ENGRAVE = {
  deep:   '0 1px 0 rgba(0,0,0,0.72), 0 2px 3px rgba(0,0,0,0.45), 0 -1px 0 rgba(228,213,183,0.12)',
  medium: '0 1px 0 rgba(0,0,0,0.6), 0 -1px 0 rgba(228,213,183,0.08)',
  thin:   '0 1px 2px rgba(0,0,0,0.7)',
  faint:  '0 1px 1px rgba(0,0,0,0.5)',
} as const;

// ─── Typography Tokens ──────────────────────────────────────────────

const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
  serif:   'var(--wl-font-serif, "EB Garamond", Georgia, serif)',
  sans:    'var(--wl-font-sans, system-ui, sans-serif)',
} as const;

const COLOR = {
  title:       'var(--wl-text-title, #e4d5b7)',
  body:        'var(--wl-text-body, rgba(237,224,196,0.92))',
  labelPrimary:'var(--wl-label-primary, #c9a84e)',
  labelTertiary:'var(--wl-label-tertiary, #9a8246)',
  accent:      'var(--wl-text-accent, #f0cf6a)',
  separator:   'var(--wl-separator, rgba(216,177,62,0.2))',
  met:         'var(--wl-status-met, #7bc96f)',
  unmet:       'var(--wl-status-unmet, #d98a4a)',
} as const;

// ─── Density ────────────────────────────────────────────────────────

export type Density = 'comfortable' | 'compact';
const DENSITY_GAP: Record<Density, SpaceKey> = { comfortable: 'lg', compact: 'sm' };

// ─── Tier ───────────────────────────────────────────────────────────

export type Tier = 'primary' | 'secondary' | 'tertiary';

/* ════════════════════════════════════════════════════════════════════════
 *  1. WanderlustHeading
 *  Title + optional subtitle + description. Fixed internal rhythm.
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustHeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  style?: CSSProperties;
}

export const WanderlustHeading: React.FC<WanderlustHeadingProps> = ({
  title, subtitle, description, as = 'h2', className, style,
}) => {
  const Tag = as as keyof JSX.IntrinsicElements;
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {React.createElement(Tag, {
        style: {
          fontFamily: FONT.display, fontSize: 'var(--wl-title-size, 30px)',
          fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
          lineHeight: 1.05, margin: 0,
          background: 'linear-gradient(180deg, #fff4d6 0%, #f0cf6a 38%, #d8b13e 70%, #a87f24 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7)) drop-shadow(0 0 16px rgba(240,207,106,0.3))',
        } as CSSProperties,
      }, title)}
      {subtitle && (
        <p style={{
          fontFamily: FONT.display, fontSize: '12px', fontWeight: 400,
          letterSpacing: '0.4em', textTransform: 'uppercase',
          color: COLOR.accent, margin: 0, marginTop: sp('sm'),
          opacity: 0.95, textShadow: `${ENGRAVE.thin}, 0 0 10px rgba(240,207,106,0.2)`,
        }}>{subtitle}</p>
      )}
      {description && (
        <p style={{
          fontFamily: FONT.serif, fontSize: 'var(--wl-body-size, 15.5px)',
          fontWeight: 400, lineHeight: 1.6, letterSpacing: '0.01em',
          color: COLOR.body, margin: 0, marginTop: sp('md'),
          textShadow: ENGRAVE.faint,
        }}>{description}</p>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  2. WanderlustField
 *  Label→value pair. vertical (default) or horizontal orientation.
 * ════════════════════════════════════════════════════════════════════════ */

export type FieldOrientation = 'vertical' | 'horizontal';

export interface WanderlustFieldProps {
  label: ReactNode;
  value: ReactNode;
  orientation?: FieldOrientation;
  tier?: Tier;
  className?: string;
  style?: CSSProperties;
}

const labelBase = (tier: Tier): CSSProperties => ({
  fontFamily: FONT.sans,
  fontSize: tier === 'tertiary' ? '11px' : '11px',
  fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase',
  color: tier === 'tertiary' ? COLOR.labelTertiary : COLOR.labelPrimary,
  margin: 0, textShadow: ENGRAVE.thin,
});

const valueBase = (tier: Tier): CSSProperties => ({
  fontFamily: FONT.display,
  fontSize: tier === 'tertiary' ? '19px' : '23px',
  fontWeight: 700, letterSpacing: '0.03em',
  color: tier === 'tertiary' ? 'rgba(237,224,196,0.85)' : COLOR.title,
  margin: 0, textShadow: tier === 'tertiary' ? ENGRAVE.medium : `${ENGRAVE.medium}, 0 0 18px rgba(240,207,106,0.08)`,
});

export const WanderlustField: React.FC<WanderlustFieldProps> = ({
  label, value, orientation = 'vertical', tier = 'secondary', className, style,
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className={className} style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: sp('lg'), ...style,
      }}>
        <span style={labelBase(tier)}>{label}</span>
        <span style={{ ...valueBase(tier), textAlign: 'right' }}>{value}</span>
      </div>
    );
  }
  return (
    <div className={className} style={{
      display: 'flex', flexDirection: 'column', gap: sp('md'), ...style,
    }}>
      <span style={labelBase(tier)}>{label}</span>
      <span style={valueBase(tier)}>{value}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  3. WanderlustFieldGroup
 *  columns | rows | grid. Auto-separators. Density controls gap.
 * ════════════════════════════════════════════════════════════════════════ */

export type GroupLayout = 'columns' | 'rows' | 'grid';

export interface WanderlustFieldGroupProps {
  children: ReactNode;
  layout?: GroupLayout;
  columns?: number;
  density?: Density;
  separators?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const WanderlustFieldGroup: React.FC<WanderlustFieldGroupProps> = ({
  children, layout = 'columns', columns, density = 'comfortable',
  separators = true, className, style,
}) => {
  const items = React.Children.toArray(children);
  const gap = sp(DENSITY_GAP[density]);

  if (layout === 'rows') {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', ...style }}>
        {items.map((child, idx) => (
          <div key={idx} style={{
            paddingTop: idx === 0 ? 0 : gap, paddingBottom: idx === items.length - 1 ? 0 : gap,
            borderBottom: separators && idx !== items.length - 1
              ? `1px solid ${COLOR.separator}` : 'none',
          }}>{child}</div>
        ))}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className={className} style={{
        display: 'grid', gridTemplateColumns: `repeat(${columns ?? 2}, minmax(0, 1fr))`,
        gap, ...style,
      }}>{items}</div>
    );
  }

  // columns
  const cols = columns ?? items.length;
  return (
    <div className={className} style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...style,
    }}>
      {items.map((child, idx) => (
        <div key={idx} style={{
          position: 'relative', padding: `6px ${idx === 0 ? '4px' : '4px'}`,
          ...(idx !== 0 ? { paddingLeft: '18px' } : {}),
        }}>
          {separators && idx !== 0 && (
            <span style={{
              position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '1px',
              background: `linear-gradient(180deg, transparent, ${COLOR.separator}, transparent)`,
            }} aria-hidden="true" />
          )}
          {child}
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  4. WanderlustRequirementList
 *  Gameplay-aware: shows current/required + met/unmet check.
 *  Replaces the old generic stat rows.
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustRequirement {
  label: string;
  current: number;
  required: number;
}

export interface WanderlustRequirementListProps {
  requirements: WanderlustRequirement[];
  hintLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const CheckIcon: React.FC<{ met: boolean }> = ({ met }) => (
  <svg viewBox="0 0 20 20" width={met ? 16 : 14} height={met ? 16 : 14}
    fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
    style={{ color: met ? COLOR.met : COLOR.unmet }}>
    {met
      ? <path d="M4 10l4 4 8-9" />
      : <><path d="M10 4v8" /><path d="M10 15v1" /></>
    }
  </svg>
);

export const WanderlustRequirementList: React.FC<WanderlustRequirementListProps> = ({
  requirements, hintLabel = 'squadra attuale', className, style,
}) => (
  <div className={className} style={{ position: 'relative', borderRadius: '6px', ...style }}>
    {requirements.map((req, idx) => {
      const met = req.current >= req.required;
      return (
        <div key={idx} style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'baseline',
          gap: '14px', padding: '9px 16px', position: 'relative',
        }}>
          {idx > 0 && (
            <span style={{
              position: 'absolute', top: 0, left: '6%', right: '6%', height: '1px',
              background: `linear-gradient(90deg, transparent, rgba(216,177,62,0.08), transparent)`,
            }} aria-hidden="true" />
          )}
          <span style={labelBase('tertiary')}>{req.label}</span>
          <span style={{
            fontFamily: FONT.sans, fontSize: '13px', letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{
              fontFamily: FONT.display, fontSize: '18px', fontWeight: 700,
              color: met ? COLOR.met : COLOR.unmet,
              textShadow: `0 0 12px ${met ? 'rgba(123,201,111,0.25)' : 'rgba(217,138,74,0.25)'}`,
            }}>{req.current}</span>
            <span style={{ color: 'rgba(154,130,70,0.5)', margin: '0 3px' }}>/</span>
            <span style={{ color: 'rgba(154,130,70,0.7)' }}>{req.required}</span>
          </span>
          <span style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon met={met} />
          </span>
        </div>
      );
    })}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
 *  5. WanderlustRecordList
 *  Fixed-column rows with optional left rail + diamond markers.
 * ════════════════════════════════════════════════════════════════════════ */

export interface RecordColumn {
  width: string;
  variant?: 'caption' | 'body' | 'value' | 'label';
  align?: 'left' | 'right' | 'center';
}

export interface WanderlustRecordListProps {
  columns: RecordColumn[];
  records: ReactNode[][];
  density?: Density;
  rail?: boolean;
  className?: string;
  style?: CSSProperties;
}

const CELL_STYLE: Record<NonNullable<RecordColumn['variant']>, CSSProperties> = {
  caption: {
    fontFamily: FONT.sans, fontSize: '12px', letterSpacing: '0.06em',
    color: 'rgba(216,177,62,0.7)', textShadow: ENGRAVE.thin,
    fontVariantNumeric: 'tabular-nums',
  },
  body: {
    fontFamily: FONT.serif, fontSize: '14.5px', lineHeight: '1.5',
    letterSpacing: '0.01em', color: 'rgba(237,224,196,0.78)',
    textShadow: ENGRAVE.faint,
  },
  value: {
    fontFamily: FONT.display, fontSize: '18px', fontWeight: 600,
    color: COLOR.title, textShadow: ENGRAVE.medium,
  },
  label: {
    fontFamily: FONT.sans, fontSize: '11px', fontWeight: 500,
    letterSpacing: '0.3em', textTransform: 'uppercase',
    color: COLOR.labelTertiary, textShadow: ENGRAVE.thin,
  },
};

export const WanderlustRecordList: React.FC<WanderlustRecordListProps> = ({
  columns, records, density = 'comfortable', rail = true, className, style,
}) => {
  const gap = sp(DENSITY_GAP[density]);
  const template = columns.map(c => c.width).join(' ');

  return (
    <div className={className} role="list" style={{
      display: 'flex', flexDirection: 'column', gap,
      ...(rail ? {
        borderLeft: `2px solid ${COLOR.separator}`,
        paddingLeft: sp('lg'), position: 'relative',
      } : {}),
      ...style,
    }}>
      {records.map((cells, rowIdx) => (
        <div key={rowIdx} role="listitem" style={{
          display: 'grid', gridTemplateColumns: template,
          gap: sp('lg'), alignItems: 'baseline',
          padding: '9px 14px', borderRadius: '4px', position: 'relative',
        }}>
          {rail && (
            <span style={{
              position: 'absolute', left: '-21px', top: '50%', width: '6px', height: '6px',
              transform: 'translateY(-50%) rotate(45deg)',
              background: 'rgba(216,177,62,0.12)', border: '1px solid rgba(216,177,62,0.28)',
            }} aria-hidden="true" />
          )}
          {cells.map((cell, colIdx) => {
            const col = columns[colIdx];
            return (
              <span key={colIdx} style={{
                ...CELL_STYLE[col?.variant ?? 'body'],
                textAlign: col?.align ?? 'left', minWidth: 0,
              }}>{cell}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  6. WanderlustDivider
 *  Ornamental SVG divider with center diamond + satellite dots.
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustDividerProps {
  marginY?: SpaceKey;
  className?: string;
  style?: CSSProperties;
}

export const WanderlustDivider: React.FC<WanderlustDividerProps> = ({
  marginY = 'xl', className, style,
}) => (
  <div className={className} role="separator" aria-hidden="true" style={{
    position: 'relative', height: '20px', margin: `${sp(marginY)} 0`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>
    <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent 5%, rgba(216,177,62,0.4))' }} />
    <svg viewBox="0 0 44 20" width={44} height={20} style={{ flexShrink: 0, margin: '0 4px' }}>
      <line x1="0" y1="10" x2="14" y2="10" stroke="rgba(216,177,62,0.3)" strokeWidth="0.5" />
      <line x1="30" y1="10" x2="44" y2="10" stroke="rgba(216,177,62,0.3)" strokeWidth="0.5" />
      <polygon points="22,2 28.5,10 22,18 15.5,10" fill="none" stroke="rgba(240,207,106,0.55)" strokeWidth="0.8" />
      <polygon points="22,5 25.5,10 22,15 18.5,10" fill="rgba(240,207,106,0.3)" />
      <circle cx="11" cy="10" r="1.2" fill="rgba(240,207,106,0.4)" />
      <circle cx="33" cy="10" r="1.2" fill="rgba(240,207,106,0.4)" />
    </svg>
    <span style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, transparent 5%, rgba(216,177,62,0.4))' }} />
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
 *  7. WanderlustSectionHeader
 *  Tiered: primary (bright, focal) vs tertiary (quiet, supporting).
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustSectionHeaderProps {
  children: ReactNode;
  tier?: Tier;
  hint?: ReactNode;
  marginBottom?: SpaceKey;
  className?: string;
  style?: CSSProperties;
}

export const WanderlustSectionHeader: React.FC<WanderlustSectionHeaderProps> = ({
  children, tier = 'tertiary', hint, marginBottom = 'lg', className, style,
}) => {
  const isPrimary = tier === 'primary';
  return (
    <div className={className} style={{
      display: 'flex', alignItems: 'center', gap: sp('md'),
      marginBottom: sp(marginBottom), ...style,
    }}>
      <h3 style={{
        ...labelBase(tier),
        whiteSpace: 'nowrap',
        fontSize: isPrimary ? '12px' : '10px',
        letterSpacing: isPrimary ? '0.34em' : '0.3em',
        color: isPrimary ? COLOR.accent : COLOR.labelTertiary,
        textShadow: isPrimary
          ? `${ENGRAVE.thin}, 0 0 12px rgba(240,207,106,0.25)`
          : ENGRAVE.thin,
        position: 'relative',
      }}>
        {children}
        <span style={{
          position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '1px',
          background: isPrimary
            ? 'linear-gradient(90deg, rgba(240,207,106,0.5), transparent 90%)'
            : 'linear-gradient(90deg, rgba(154,130,70,0.3), transparent 90%)',
        }} aria-hidden="true" />
      </h3>
      {hint && (
        <span style={{
          fontFamily: FONT.serif, fontSize: '12px', fontStyle: 'italic',
          color: 'rgba(154,130,70,0.7)', letterSpacing: '0.02em',
        }}>{hint}</span>
      )}
      <span style={{
        flex: 1, height: '1px',
        background: isPrimary
          ? 'linear-gradient(90deg, rgba(240,207,106,0.4), transparent 60%)'
          : 'linear-gradient(90deg, rgba(154,130,70,0.22), transparent 60%)',
      }} aria-hidden="true" />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
 *  Namespace export
 * ────────────────────────────────────────────────────────────────────── */

export const WanderlustLayout = {
  Heading: WanderlustHeading,
  Field: WanderlustField,
  FieldGroup: WanderlustFieldGroup,
  RequirementList: WanderlustRequirementList,
  RecordList: WanderlustRecordList,
  Divider: WanderlustDivider,
  SectionHeader: WanderlustSectionHeader,
  SPACE,
};

export default WanderlustLayout;
