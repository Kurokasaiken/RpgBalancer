import React from 'react';
import { EngravedIcon, ENGRAVED_ICON_IDS } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { HudGlyph, type HudIconId } from '@/ui/idleVillage/components/gameFrame/hudIcons';

/**
 * Icon gallery — Director request 2026-11-24 (R-367 program): every icon made
 * for the /game HUD, grouped by "tipo", on the dark-lacquer socket tone so the
 * champagne-gold signatures read like in game. Lab surface: no routing weight,
 * no i18n (dev-only strings).
 */

const GOLD = '#dfb857';
const LACQUER = 'linear-gradient(160deg, #101d1d 0%, #0a1415 60%, #061011 100%)';

interface CellSpec { label: string; src?: string; glyphId?: HudIconId; engravedId?: string; size?: number }
interface SectionSpec { title: string; note?: string; cells: CellSpec[] }

const NAV_PAINTED: CellSpec[] = [
  { label: 'nav-village (village)', src: '/assets/ui/nav/nav-village-128.webp' },
  { label: 'nav-map (map)', src: '/assets/ui/nav/nav-map-128.webp' },
  { label: 'nav-roster (roster)', src: '/assets/ui/nav/nav-roster-128.webp' },
  { label: 'nav-stash (stash)', src: '/assets/ui/nav/nav-stash-128.webp' },
];

const CHROME_PAINTED: CellSpec[] = [
  { label: 'ctl-menu', src: '/assets/ui/nav/ctl-menu-128.webp' },
  { label: 'ctl-director', src: '/assets/ui/nav/ctl-director-128.webp' },
  { label: 'ctl-eye', src: '/assets/ui/nav/ctl-eye-128.webp' },
  { label: 'ctl-play', src: '/assets/ui/nav/ctl-play-128.webp' },
];

const NAV_ENGRAVED: CellSpec[] = [
  { label: 'village', glyphId: 'settlement' },
  { label: 'map', glyphId: 'world' },
  { label: 'chronicle', glyphId: 'chronicle' },
  { label: 'workshop', glyphId: 'workshop' },
  { label: 'tavern', glyphId: 'tavern' },
];

const RESOURCES: CellSpec[] = ['gold', 'food', 'wood'].map((r) => ({
  label: `res-${r}`, src: `/assets/ui/resources/res-${r}-128.webp`,
}));

const POI_QUEST: CellSpec[] = [
  { label: 'poi-goblin-camp', src: '/assets/ui/poi/poi-goblin-camp-128.webp' },
  { label: 'poi-ruins', src: '/assets/ui/poi/poi-ruins-128.webp' },
];

const POI_EMBLEMS: CellSpec[] = [
  'ruins', 'goblin-camp', 'recon', 'forage', 'logs', 'assault', 'caravan', 'delve',
].map((e) => ({ label: `emblem-${e}`, src: `/assets/ui/poi/emblems/emblem-${e}-128.webp` }));

const POI_OFFERS: CellSpec[] = ['assault', 'caravan', 'delve', 'forage', 'people', 'recon'].map((o) => ({
  label: `offer-${o}`, src: `/assets/ui/poi/offer-${o}-128.webp`,
}));

const POI_BUILDINGS: CellSpec[] = [
  { label: 'poi-merchant', src: '/assets/ui/poi/poi-merchant.svg' },
  { label: 'poi-warehouse', src: '/assets/ui/poi/poi-warehouse.svg' },
];

const THREATS: CellSpec[] = ['beasts', 'claws', 'goblin-king', 'invasion'].map((t) => ({
  label: `threat-${t}`, src: `/assets/ui/poi/threat-${t}-128.webp`,
}));

const STERMINIO: CellSpec[] = [
  { label: 'sterminio skull-pike (TL, battezzato)', src: '/assets/ui/poi/emblems/sterminio-skull-pike-128.webp' },
  { label: 'sterminio torn-banner (TR)', src: '/assets/ui/poi/emblems/sterminio-torn-banner-128.webp' },
  { label: 'sterminio war-mask (BL)', src: '/assets/ui/poi/emblems/sterminio-war-mask-128.webp' },
  { label: 'sterminio broken-crown (BR)', src: '/assets/ui/poi/emblems/sterminio-broken-crown-128.webp' },
];

/* R-367 (Director 2026-11-24): ogni icona POI esiste in due varianti —
 *  con POI dietro (marker-*, emblem composto sul sigillo reale) e senza. */
const POI_MARKERS: CellSpec[] = [
  'ruins', 'goblin-camp', 'recon', 'forage', 'logs', 'assault', 'caravan', 'delve',
  'st-skull-pike', 'st-torn-banner', 'st-war-mask', 'st-broken-crown',
].map((e) => ({ label: `marker-${e}`, src: `/assets/ui/poi/markers/marker-${e}-128.webp` }));

const SIGILLO: CellSpec[] = [
  { label: 'sigillo-empty (POI nudo)', src: '/assets/ui/poi/sigillo-empty-256.webp' },
];

const STASH_ITEMS: CellSpec[] = ['hasHealing', 'hasFumogeno', 'hasPozione', 'hasBonusPerc', 'hasGuardianBanner', 'hasCorda', 'hasBonusForza'].map((k) => ({
  label: k, src: `/assets/ui/hud-real/stash-icons/${k}.webp`,
}));

const STASH_ITEMS2: CellSpec[] = ['horse', 'dagger', 'shield', 'flag', 'vial', 'coin'].map((k) => ({
  label: `item-${k}`, src: `/assets/ui/hud-real/stash-icons/item-${k}-128.webp`,
}));

const PIASTRINA: CellSpec[] = [
  { label: 'cornice-hover-A', src: '/assets/ui/hud-real/piastrina/cornice-hover-a.webp' },
];

const SECTIONS: SectionSpec[] = [
  { title: 'Nav — dipinte (foglio approvato)', note: 'Cut-out dal foglio Gemini, oro champagne su lacca.', cells: NAV_PAINTED },
  { title: 'Chrome — dipinte', note: 'Bottoni angolo + resume pill.', cells: CHROME_PAINTED },
  { title: 'Nav — incise', cells: NAV_ENGRAVED },
  { title: 'Risorse', cells: RESOURCES },
  { title: 'POI — sigillo nudo', note: 'Il medaglione reale senza icona (base delle versioni con POI).', cells: SIGILLO },
  { title: 'POI — con POI dietro (marker-*)', note: 'Emblema composto sul sigillo reale, proporzioni di gioco. Per uso standalone.', cells: POI_MARKERS },
  { title: 'POI — senza POI (emblem-*)', note: 'Cut-out che il componente monta sopra il sigillo DOM.', cells: POI_EMBLEMS },
  { title: 'POI — quest', note: 'Sigilli dentro il medaglione (strabordante in arrivo su poi-goblin).', cells: POI_QUEST },
  { title: 'POI — offerte lavoro', cells: POI_OFFERS },
  { title: 'POI — edifici', cells: POI_BUILDINGS },
  { title: 'Minacce', cells: THREATS },
  { title: 'Sterminio — emblèmi staccati', note: 'Separati dal componente POI: asset cut-out riusabili su qualsiasi superficie.', cells: STERMINIO },
  { title: 'Stash — item', cells: STASH_ITEMS },
  { title: 'Stash — item questItems (R-367)', cells: STASH_ITEMS2 },
  { title: 'Piastrina', cells: PIASTRINA },
];

const tile: React.CSSProperties = {
  background: LACQUER,
  border: '1px solid rgba(223,184,87,0.35)',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const Cell: React.FC<{ spec: CellSpec }> = ({ spec }) => {
  const size = spec.size ?? 48;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 132 }}>
      <div style={{ ...tile, width: 72, height: 72 }}>
        {spec.src && <img src={spec.src} alt={spec.label} width={size} height={size} style={{ objectFit: 'contain' }} />}
        {spec.glyphId && <HudGlyph iconId={spec.glyphId} label={spec.label} size={size} style={{ color: GOLD }} />}
        {spec.engravedId && <EngravedIcon id={spec.engravedId as never} size={size} style={{ color: GOLD }} />}
      </div>
      <div style={{ ...tile, width: 30, height: 30, borderRadius: 6 }}>
        {spec.src && <img src={spec.src} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />}
        {spec.glyphId && <HudGlyph iconId={spec.glyphId} label={spec.label} size={16} style={{ color: GOLD }} />}
        {spec.engravedId && <EngravedIcon id={spec.engravedId as never} size={16} style={{ color: GOLD }} />}
      </div>
      <div style={{ fontSize: 10, color: '#b7a98a', textAlign: 'center', lineHeight: 1.25 }}>{spec.label}</div>
    </div>
  );
};

const IconGallery: React.FC = () => (
  <div style={{ minHeight: '100vh', background: '#0b0f10', color: '#d8ccb0', padding: '32px 40px', fontFamily: 'serif' }}>
    <h1 style={{ fontSize: 22, letterSpacing: 1, color: GOLD, margin: '0 0 8px' }}>Icon Gallery — /game HUD</h1>
    <p style={{ fontSize: 12, color: '#8f8873', margin: '0 0 28px' }}>
      Tutte le icone del programma R-367/D-6 raggruppate per tipo. Tile grande = resa in socket;
      tile piccola = controllo leggibilità a 16px.
    </p>
    {SECTIONS.map((s) => (
      <section key={s.title} style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, color: '#e9dcc0', margin: '0 0 4px', borderBottom: '1px solid rgba(223,184,87,0.25)', paddingBottom: 4 }}>{s.title}</h2>
        {s.note && <p style={{ fontSize: 11, color: '#8f8873', margin: '4px 0 10px' }}>{s.note}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
          {s.cells.map((c) => <Cell key={c.label} spec={c} />)}
        </div>
      </section>
    ))}
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, color: '#e9dcc0', margin: '0 0 4px', borderBottom: '1px solid rgba(223,184,87,0.25)', paddingBottom: 4 }}>
        Registry inciso — completo ({ENGRAVED_ICON_IDS.length} glifi)
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
        {ENGRAVED_ICON_IDS.map((id) => (
          <Cell key={id} spec={{ label: id, engravedId: id, size: 40 }} />
        ))}
      </div>
    </section>
  </div>
);

export default IconGallery;
