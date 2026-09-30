import React from 'react';

/**
 * HUD icon registry — semantic SVG glyphs, not emoji.
 *
 * Review R-075 (2026-09-22): "usare emoji come icone" was flagged as a
 * production-blocker — emoji render inconsistently across platforms, carry no
 * skin-token color, and read as placeholder art, not as Wanderlust chrome.
 * Every glyph here is stroke/fill driven by `currentColor` so it inherits
 * `--skin-icon-color` (or whatever color the caller sets) instead of baking
 * in a hex value.
 *
 * Geometry is deliberately simple — these are read at 16–22px in a ribbon,
 * not admired at scale. Add new ids here rather than reaching for an emoji.
 */
export type HudIconId =
  | 'gold'
  | 'food'
  | 'wood'
  | 'world'
  | 'settlement'
  | 'company'
  | 'chronicle'
  | 'workshop'
  | 'tavern';

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const base: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const GoldIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 8.6v6.8M9.6 10.4h4.8" />
  </svg>
);

const FoodIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="M7 3v7.2a2.2 2.2 0 0 0 4.4 0V3M9.2 3v7.2M7 3v0" />
    <path d="M17 3c-1.6 0-2.6 1.7-2.6 4.4 0 2 1 3.3 2 3.6V21" />
  </svg>
);

const WoodIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <rect x="4" y="9" width="16" height="4.4" rx="2.2" />
    <rect x="4" y="14.6" width="16" height="4.4" rx="2.2" />
    <circle cx="6.2" cy="11.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="6.2" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const WorldIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" />
  </svg>
);

const SettlementIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="M4.5 20V11L12 5l7.5 6v9" />
    <path d="M9.5 20v-5.5h5V20" />
  </svg>
);

const CompanyIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <circle cx="8.5" cy="8" r="2.4" />
    <circle cx="16" cy="9.5" r="2" />
    <path d="M3.8 19.5c.5-3.3 2.4-5 4.7-5s4.2 1.7 4.7 5M13.6 19.5c.4-2.6 1.8-4 3.9-4s3.5 1.4 3.9 4" />
  </svg>
);

const ChronicleIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="M5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5Z" />
    <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H18.5" />
    <path d="M8.5 8h6M8.5 11h6" />
  </svg>
);

const WorkshopIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="M5 15.5 12 9l3 3-7 6.5-3.5.5.5-3.5Z" />
    <path d="M14 5.5 18.5 10M16.2 4.6a2.2 2.2 0 0 1 3.1 3.1L17 10 14 7l2.2-2.4Z" />
  </svg>
);

const TavernIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="M6 9h9v7a4.5 4.5 0 0 1-4.5 4.5A4.5 4.5 0 0 1 6 16V9Z" />
    <path d="M15 11h1.5a2.5 2.5 0 0 1 0 5H15" />
    <path d="M6 9V6.5h9V9" />
  </svg>
);

export const HUD_ICONS: Record<HudIconId, IconComponent> = {
  gold: GoldIcon,
  food: FoodIcon,
  wood: WoodIcon,
  world: WorldIcon,
  settlement: SettlementIcon,
  company: CompanyIcon,
  chronicle: ChronicleIcon,
  workshop: WorkshopIcon,
  tavern: TavernIcon,
};

export interface HudGlyphProps extends React.SVGProps<SVGSVGElement> {
  iconId: HudIconId;
  label: string;
  size?: number;
}

/**
 * Renders a registered icon with an accessible label and no inline color —
 * callers set `color` (or rely on inherited `--skin-icon-color`) rather than
 * passing a hex.
 */
export const HudGlyph: React.FC<HudGlyphProps> = ({ iconId, label, size = 18, style, ...rest }) => {
  const Icon = HUD_ICONS[iconId];
  return (
    <Icon
      role="img"
      aria-label={label}
      focusable="false"
      width={size}
      height={size}
      style={{ color: 'var(--skin-icon-color, #dfb857)', flexShrink: 0, ...style }}
      {...rest}
    />
  );
};

export default HUD_ICONS;
