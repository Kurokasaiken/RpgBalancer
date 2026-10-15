import React from 'react';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';

/**
 * HUD icon registry — semantic ids for the places the HUD names (resources, navigation,
 * events). Every glyph is an engraved solid from `engravedIcons.tsx` (bible §11.6, PLAN-058
 * T3.2): `currentColor` fill, no stroke, so it inherits `--skin-icon-color` (or whatever
 * colour the caller sets) instead of baking in a hex value.
 *
 * Add new ids here rather than reaching for an emoji or a third-party icon library.
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
  | 'tavern'
  | 'threat'
  // Event-type glyphs (HudEventLedger): one engraved solid per type, not a reused navigation icon.
  | 'evt-quest'
  | 'evt-expedition'
  | 'evt-construction'
  | 'evt-harvest'
  | 'evt-visit';

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const engraved = (id: EngravedIconId): IconComponent => {
  const Icon: IconComponent = (props) => <EngravedIcon id={id} {...props} size={props.width ?? 24} />;
  Icon.displayName = `HudIcon(${id})`;
  return Icon;
};

/** Ids drawn as painted images (`HUD_ICON_ASSETS`): they have no engraved glyph. */
export type PaintedHudIconId = 'gold' | 'food' | 'wood' | 'threat';

export const HUD_ICONS: Record<Exclude<HudIconId, PaintedHudIconId>, IconComponent> = {
  world: engraved('nav-map'),
  settlement: engraved('nav-village'),
  company: engraved('nav-company'),
  chronicle: engraved('nav-chronicle'),
  workshop: engraved('nav-shop'),
  tavern: engraved('nav-tavern'),
  'evt-quest': engraved('evt-quest'),
  'evt-expedition': engraved('evt-expedition'),
  'evt-construction': engraved('evt-construction'),
  'evt-harvest': engraved('evt-harvest'),
  'evt-visit': engraved('evt-visit'),
};

/**
 * Painted objects (bible §11, `.mw/specs/icons`): the resources and the threat mark are
 * images with their own material, not engraved glyphs. Navigation and event icons are
 * commands and stay engraved.
 */
export const HUD_ICON_ASSETS: Record<PaintedHudIconId, string> = {
  gold: '/assets/ui/resources/res-gold-128.webp',
  food: '/assets/ui/resources/res-food-128.webp',
  wood: '/assets/ui/resources/res-wood-128.webp',
  threat: '/assets/ui/poi/threat-claws-128.webp',
};

const isPainted = (id: HudIconId): id is PaintedHudIconId => id in HUD_ICON_ASSETS;

export interface HudGlyphProps extends React.SVGProps<SVGSVGElement> {
  iconId: HudIconId;
  label: string;
  size?: number;
}

/**
 * Renders a registered icon with an accessible label and no inline color —
 * callers set `color` (or rely on inherited `--skin-icon-color`) rather than
 * passing a hex. Ids listed in `HUD_ICON_ASSETS` render the painted image
 * instead of an engraved glyph; the asset carries its own material.
 */
export const HudGlyph: React.FC<HudGlyphProps> = ({ iconId, label, size = 18, style, ...rest }) => {
  if (isPainted(iconId)) {
    return (
      <img
        src={HUD_ICON_ASSETS[iconId]}
        alt=""
        role="img"
        aria-label={label}
        width={size}
        height={size}
        style={{ flexShrink: 0, objectFit: 'contain', display: 'block', ...style }}
      />
    );
  }
  const Icon = HUD_ICONS[iconId as Exclude<HudIconId, PaintedHudIconId>];
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
