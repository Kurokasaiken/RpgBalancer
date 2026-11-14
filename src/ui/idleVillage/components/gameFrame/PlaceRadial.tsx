/**
 * PlaceRadial — menu radiale inclinato del Luogo (PLAN-117, sotto-piano F2,
 * artifact dibattito `20261112-plan117-radial-f2` r003 + ruling Director).
 *
 * Materiali candidati (kit `/assets/ui/poi-radial/*.webp`, generati nella
 * chat Gemini c223f539ea039063 ancorati al POI Zanara): disco astrolabio in
 * oro inciso + smalti navy, una lastra per famiglia (job smeraldo, quest blu,
 * event viola — provvisorio), socket di vetro fumé, medaglione zona.
 *
 * Contratto implementato:
 * - 8 slice × 45°, slot0 a NE, riempimento orario; posizioni STABILI (indice
 *   attività = indice slot); >8 → affordance sull'hub (design-error).
 * - Socket vuoti = lastra vetro fumé, pointer-events:none (il clic lì è
 *   "fuori" e chiude). Slice locked = smalto spento + tratteggio.
 * - Grammatica smalto Director: slice = smalto chiaro di famiglia; il
 *   progress scrive smalto scuro in senso orario dal bordo "ore 12" dello
 *   slice; done non-ripetibile resta scuro (click-to-collect), ripetibile
 *   torna chiaro al ciclo successivo. Urgente (residuo CCW sotto soglia):
 *   virata rosso percettivo sul settore scritto (niente pulse/badge).
 * - Dwell card: 350ms alla prima permanenza, poi swap istantaneo di contenuto
 *   fra slice; posizione laterale deterministica; pointer-events none.
 * - Chiusura: Esc, oppure clic fuori con spostamento <4px (un drag è pan).
 * - Tastiera: role=menu/menuitem, roving tabindex sull'ordine di riempimento,
 *   seam NE=index0; Enter → onSelect; il focus mostra la card senza dwell.
 * - Il contenitore non intercetta la mappa: pointer-events solo sugli
 *   elementi interattivi (veto modali GX-0042).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MapQuestPoiView } from './MapQuestPoi';
import type { PlaceFanActivity } from './PlaceFan';
import { POI_ZANARA_CONFIG } from '@/balancing/config/idleVillage/poiZanaraConfig';
import {
  RADIAL_SLOTS,
  slotSpanDeg,
  slotCenterDeg,
  annularSectorPath,
  arcPath,
  polarPoint,
  assignRadialSlots,
  nextSlot,
  BANDS,
} from './placeRadialGeometry';

export interface RadialActivity extends PlaceFanActivity {
  /** Icona dipinta del contenuto della slice (offerta/tipo attività). */
  iconUrl?: string;
}

export interface PlaceRadialProps {
  activities: readonly RadialActivity[];
  views: Readonly<Record<string, MapQuestPoiView>>;
  /** Inclinazione del disco in gradi (rotateX). Prototipo: valore di studio,
   * il definitivo deriva dalla misura dell'ellisse della palizzata. */
  tiltDeg?: number;
  /** Raggio del disco in px (spazio locale, pre-inclinazione). */
  radiusPx?: number;
  /** Come renderizzare gli slot senza attività — studio A/B nel lab:
   * 'glass' = socket di vetro fumé (anello sempre completo);
   * 'open'  = lastra navy base (niente socket dedicato);
   * 'arc'   = solo le slice piene: il disco è tagliato sull'arco occupato. */
  emptySlots?: 'glass' | 'open' | 'arc';
  onSelect?: (activityId: string) => void;
  /** Chiamato quando il menu deve chiudersi (Esc / clic-fuori / hub). */
  onRequestClose?: () => void;
}

const ART = '/assets/ui/poi-radial';
/** Lastra smalto per famiglia — event viola è provvisorio (colore non battezzato). */
const FAMILY_IMG: Record<string, string> = {
  job: `${ART}/disc-job.webp`,
  quest: `${ART}/disc-quest.webp`,
  event: `${ART}/disc-event.webp`,
};
const DISC_BASE = `${ART}/disc-base.webp`;
const DISC_GLASS = `${ART}/disc-glass.webp`;
/** Ritaglio del solo medaglione centrale (dev-public — derivato di hub.webp,
    che contiene l'intera faccia dipinta e non può essere reso full-size). */
const HUB_MEDAL = `${ART}/hub-medal.png`;
/** Il bordo del disco occupa 0.96 del mezzo-canvas dopo il bake. */
const ART_EDGE = 0.96;
/** Rotazione dell'arte: le costole cadono sui bisettori degli slot. */
const ART_ROTATE_DEG = 22.5;
/** Inset angolare della clip-wedge per non sbavare sulle costole d'oro. */
const WEDGE_INSET_DEG = 1.4;
/** Smalto famiglia → colore dell'arco temporale (stessa palette POI Zanara). */
const FAMILY_COLOR: Record<string, string> = {
  job: POI_ZANARA_CONFIG.familyColor.job,
  quest: POI_ZANARA_CONFIG.familyColor.quest,
  event: '#8a5fb0', // provvisorio — il viola evento non è battezzato
};
const URGENT_RED = POI_ZANARA_CONFIG.urgentRed;
const URGENT_AT = POI_ZANARA_CONFIG.urgentStartsAtRemaining;

/* --- Grammatica smalto del Director (ruling): la slice è SEMPRE del colore
   chiaro della famiglia; il lavoro in corso scrive il colore scuro in senso
   orario dal bordo "ore 12" dello slice; completata non-ripetibile resta
   scura (click-to-collect), ripetibile torna chiara al ciclo successivo.
   Implementazione: NIENTE riempimenti flat — lo stato chiaro è la lastra
   famiglia DIPINTA schiarita via filter (la texture sopravvive), lo stato
   scuro è la stessa lastra a saturazione piena clippata sul settore scritto. */

/** Smalto chiaro: le lastre famiglia SONO le fette del mockup — tono profondo
 *  quasi nativo; lift minimo solo per staccarle dal navy (saturo chiaro =
 *  plastica, il mockup è scuro e gioiello). */
const FAMILY_LIFT: Record<string, string> = {
  job: 'brightness(1.12) saturate(1.05)',
  quest: 'brightness(1.15) saturate(1.05)',
  event: 'brightness(1.12) saturate(1.05)',
};
/** Opacità della lastra chiara: il navy del disco traspare = smalto incassato. */
const LIGHT_OPACITY = 0.96;
/** Scrittura scura: la lastra piena ulteriormente affondata — contrasto netto
    col chiaro pur tenendo la texture dipinta (niente flat-fill). */
const DARK_SINK = 'brightness(.55) saturate(1.1)';

const CLOSE_DRAG_PX = 4;
const DWELL_MS = 350;
const CARD_WIDTH = 220;

export const PlaceRadial: React.FC<PlaceRadialProps> = ({
  activities,
  views,
  tiltDeg = 30,
  radiusPx = 260,
  emptySlots = 'glass',
  onSelect,
  onRequestClose,
}) => {
  const { t } = useTranslation('idleVillage');
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Anchors follow the camera without scaling, but the browser can be zoomed:
  // the disk must still leave room for the map and for the information card.
  const R = Math.min(radiusPx, Math.max(110, Math.min(viewport.width * 0.31, viewport.height * 0.42)));
  const { slotted, overflow } = useMemo(() => assignRadialSlots(activities), [activities]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [cardSlot, setCardSlot] = useState<number | null>(null);
  const [focusSlot, setFocusSlot] = useState<number>(0);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  /* --- dwell card: 350ms alla prima apertura, poi swap istantaneo --- */
  const openCard = useCallback(
    (slot: number, immediate: boolean) => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      if (immediate || cardSlot !== null) setCardSlot(slot);
      else dwellTimer.current = setTimeout(() => setCardSlot(slot), DWELL_MS);
    },
    [cardSlot],
  );
  useEffect(() => () => { if (dwellTimer.current) clearTimeout(dwellTimer.current); }, []);

  /* --- chiusura: Esc + clic-fuori <4px (un drag e' pan, non chiude) --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onRequestClose?.(); };
    const onDown = (e: PointerEvent) => { pointerDown.current = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      const d0 = pointerDown.current;
      pointerDown.current = null;
      if (!d0) return;
      if (Math.hypot(e.clientX - d0.x, e.clientY - d0.y) >= CLOSE_DRAG_PX) return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onRequestClose?.();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointerup', onUp, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerup', onUp, true);
    };
  }, [onRequestClose]);

  const isLocked = (id: string) => views[id]?.state === 'expired';

  const rSecIn = R * BANDS.collarOuter;
  const rSecOut = R * BANDS.sectorOuter;
  const rHitOut = R * BANDS.channelOuter;
  const imgH = R / ART_EDGE; // metà lato dell'immagine nel piano
  const thick = R * 0.06; // parete laterale del disco: spessore nel piano, proiettato dal tilt
  const lift = R * 0.05;  // quota del medaglione hub sopra la faccia

  /* Clip-wedge nello spazio dell'immagine ruotata: schermo θ → immagine θ-22.5°.
   * Lo slot i copre nell'immagine [45i-90, 45i-45] (settore fra due costole). */
  const wedgePath = (i: number) =>
    annularSectorPath(rSecOut + R * 0.025, rSecIn, 45 * i - 90 + WEDGE_INSET_DEG, 45 * i - 45 - WEDGE_INSET_DEG);

  const sliceLabel = (i: number) => {
    const a = slotted[i];
    return a ? (a.titleKey ? t(a.titleKey) : a.id) : t('places.radial.emptySlot', { defaultValue: 'Empty slot' });
  };

  const iconPoint = (i: number) => polarPoint(R * (BANDS.collarOuter + BANDS.sectorOuter) / 2, slotCenterDeg(i));

  const onSliceKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const n = nextSlot(i, 1);
      setFocusSlot(n);
      (e.currentTarget.parentElement?.querySelector(`[data-slot="${n}"]`) as HTMLElement | null)?.focus();
      setCardSlot(n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = nextSlot(i, -1);
      setFocusSlot(n);
      (e.currentTarget.parentElement?.querySelector(`[data-slot="${n}"]`) as HTMLElement | null)?.focus();
      setCardSlot(n);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const a = slotted[i];
      if (a && !isLocked(a.id)) onSelect?.(a.id);
    }
  };

  /* 'arc': il disco è ritagliato sulla campata occupata (spazio immagine = -22.5°). */
  const arcClip = useMemo(() => {
    if (emptySlots !== 'arc' || slotted.length === 0) return null;
    const first = slotSpanDeg(0);
    const last = slotSpanDeg(slotted.length - 1);
    return annularSectorPath(R * 1.02, 0, first.a0 - ART_ROTATE_DEG - 1, last.a1 - ART_ROTATE_DEG + 1);
  }, [emptySlots, slotted.length, R]);

  const imgEl = (src: string, clipId?: string, key?: string) => (
    <image
      key={key}
      href={src}
      x={-imgH}
      y={-imgH}
      width={imgH * 2}
      height={imgH * 2}
      transform={`rotate(${ART_ROTATE_DEG})`}
      clipPath={clipId ? `url(#${clipId})` : undefined}
      preserveAspectRatio="xMidYMid meet"
      style={{ pointerEvents: 'none' }}
    />
  );
  const rootRect = rootRef.current?.getBoundingClientRect();
  const cardLeft = rootRect
    ? Math.max(12 - rootRect.left, Math.min(R * 0.9, viewport.width - CARD_WIDTH - 12 - rootRect.left))
    : R * 0.9;
  const cardTop = rootRect
    ? Math.max(12 - rootRect.top, Math.min(-R * 0.5, viewport.height - 120 - rootRect.top))
    : -R * 0.5;

  return (
    <div
      ref={rootRef}
      data-testid="place-radial"
      role="menu"
      aria-label={t('places.radial.ariaLabel', { defaultValue: 'Place actions' })}
      style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none', perspective: 1100 }}
    >
      {/* ombra al suolo — spazio schermo (NON inclinata): ellisse schiacciata
          quanto il disco, sfalsata in avanti lungo l'asse di tilt. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -R,
          top: -R + thick * 1.4,
          width: R * 2,
          height: R * 2,
          pointerEvents: 'none',
        }}
      >
        <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} style={{ display: 'block', overflow: 'visible' }}>
          <ellipse
            cx={0}
            cy={R * 0.06}
            rx={R * 0.97}
            ry={R * 0.97 * Math.cos((tiltDeg * Math.PI) / 180) + thick}
            fill="rgba(4, 8, 12, 0.42)"
            style={{ filter: `blur(${R * 0.05}px)` }}
          />
        </svg>
      </div>
      <div
        data-testid="place-radial-disc"
        style={{
          position: 'absolute',
          left: -R,
          top: -R,
          width: R * 2,
          height: R * 2,
          transform: `rotateX(${tiltDeg}deg)`,
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
        }}
      >
        <svg
          width={R * 2}
          height={R * 2}
          viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
          style={{ display: 'block', overflow: 'visible' }}
          aria-hidden={false}
        >
          <defs>
            <pattern id="pr-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="rgba(10,14,18,.72)" />
              <rect width="3" height="8" fill="rgba(140,150,160,.4)" />
            </pattern>
            {/* marmo navy per gli slot vuoti — patch campionata dalla faccia
                dipinta di disc-base (pozzo hub): stesso materiale, niente
                gradiente flat. La mappa NON deve trasparire (ruling). */}
            <pattern id="pr-navy" width="128" height="128" patternUnits="userSpaceOnUse">
              <image xlinkHref={`${ART}/navy-marble.png`} href={`${ART}/navy-marble.png`} width="128" height="128" preserveAspectRatio="xMidYMid slice" />
            </pattern>
            {/* fallback smalto navy: se il pattern non risolve (image in
                pattern è fragile), il riempimento non deve mai trasparire —
                quindi sotto ogni path navy c'è SEMPRE questa tinta piena. */}
            <radialGradient id="pr-navy-solid" gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
              <stop offset={BANDS.collarOuter} stopColor="#0d1626" />
              <stop offset={BANDS.sectorOuter} stopColor="#16233c" />
              <stop offset={BANDS.channelOuter} stopColor="#0a1220" />
            </radialGradient>
            {/* clip del settore scritto per slot occupato: la lastra scura è
                visibile solo dentro [ore12, frontiera progress] — in spazio
                immagine ruotata (schermo θ - 22.5°). */}
            {slotted.map((a, i) => {
              const view = views[a.id];
              const done = Boolean(view?.done);
              const frac = view && !done ? Math.max(0, Math.min(1, view.progress)) : 0;
              if (frac <= 0 && !done) return null;
              const { a0, a1 } = slotSpanDeg(i);
              const span = a1 - a0 - 2 * (WEDGE_INSET_DEG + 0.8);
              const ia0 = a0 + WEDGE_INSET_DEG + 0.8 - ART_ROTATE_DEG;
              return (
                <clipPath key={`pr-prog-${i}`} id={`pr-prog-${i}`}>
                  <path d={annularSectorPath(rSecOut, rSecIn + R * 0.018, ia0, done ? ia0 + span : ia0 + span * frac)} />
                </clipPath>
              );
            })}
            {Array.from({ length: RADIAL_SLOTS }, (_, i) => (
              <clipPath key={`pw-${i}`} id={`pr-pw-${i}`}>
                <path d={wedgePath(i)} />
              </clipPath>
            ))}
            {arcClip ? (
              <clipPath id="pr-arc-clip">
                <path d={arcClip} />
              </clipPath>
            ) : null}
          </defs>

          {/* parete laterale: stessa banda del rim traslata +thick nel piano —
              il rotateX la proietta sotto la faccia e legge come spessore
              del disco (metà bassa soltanto: 0°=est, 90°=sud). */}
          <g transform={`translate(0 ${thick})`} style={{ pointerEvents: 'none' }}>
            <path d={annularSectorPath(R * 1.01, R * 0.88, -2, 182)} fill="#241a0c" />
            <path d={arcPath(R * 1.01, -2, 182)} fill="none" stroke="#0d0803" strokeWidth={R * 0.02} />
            <path d={arcPath(R * 0.9, 0, 180)} fill="none" stroke="#5c4620" strokeWidth={R * 0.012} opacity={0.8} />
          </g>

          <g clipPath={arcClip ? 'url(#pr-arc-clip)' : undefined}>
            {/* disco dipinto: base navy + lastre smalto/vetro per slot */}
            {imgEl(DISC_BASE, undefined, 'base')}
            {Array.from({ length: RADIAL_SLOTS }, (_, i) => {
              const a = slotted[i];
              if (a) {
                const src = FAMILY_IMG[a.type] ?? DISC_BASE;
                const view = views[a.id];
                const { a0, a1 } = slotSpanDeg(i);
                const frac = view && !view.done ? Math.max(0, Math.min(1, view.progress)) : 0;
                const done = Boolean(view?.done);
                const i0 = a0 + WEDGE_INSET_DEG + 0.8;
                const i1 = a1 - WEDGE_INSET_DEG - 0.8;
                const frontier = i0 + (i1 - i0) * frac;
                const eo = rSecOut - R * 0.006;
                const ei = rSecIn + R * 0.018;
                return (
                  <g key={`fam-${i}`}>
                    {/* smalto chiaro DIPINTO: la lastra famiglia schiarita via
                        filter — texture, gemme e incisioni sopravvivono. */}
                    <image
                      href={src}
                      x={-imgH} y={-imgH} width={imgH * 2} height={imgH * 2}
                      transform={`rotate(${ART_ROTATE_DEG})`}
                      clipPath={`url(#pr-pw-${i})`}
                      preserveAspectRatio="xMidYMid meet"
                      opacity={LIGHT_OPACITY}
                      style={{ pointerEvents: 'none', filter: FAMILY_LIFT[a.type] ?? FAMILY_LIFT.quest }}
                    />
                    {/* scrittura oraria: la stessa lastra affondata nello
                        scuro famiglia, visibile solo nel settore scritto
                        (clip pr-prog). done = settore pieno → click-to-collect. */}
                    {(frac > 0 || done) && (
                      <image
                        key={`dark-${i}`}
                        href={src}
                        x={-imgH} y={-imgH} width={imgH * 2} height={imgH * 2}
                        transform={`rotate(${ART_ROTATE_DEG})`}
                        clipPath={`url(#pr-prog-${i})`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ pointerEvents: 'none', filter: DARK_SINK }}
                      />
                    )}
                    {/* incasso: ombra al bordo collare sopra lo smalto —
                        senza questa la lastra legge "plastica" */}
                    <path
                      d={annularSectorPath(ei + R * 0.035, ei, i0, i1)}
                      fill="rgba(4,12,20,.42)"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* riflesso vetrato: arco chiaro sottile sotto il bordo
                        oro — smalto smaltato, non plastica piatta */}
                    <path
                      d={annularSectorPath(eo, eo - R * 0.045, i0 + 1.2, i1 - 1.2)}
                      fill="rgba(255,255,255,.10)"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* frontiera: lama luminosa dove lo scuro incontra il chiaro */}
                    {frac > 0 && !done && (
                      <path
                        d={annularSectorPath(eo, ei, frontier - 0.55, frontier + 0.55)}
                        fill={FAMILY_COLOR[a.type] ?? FAMILY_COLOR.quest}
                        opacity={0.85}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                );
              }
              if (emptySlots === 'arc') return null;
              return (
                <g key={`empty-${i}`}>
                  {/* backing opaco: settore + canale — disc-base ha decor tan
                      opachi anche nella banda canale; senza copertura il legno
                      trasparirebbe come artefatto sugli slot vuoti. Tinta
                      piena sotto + marmo sopra (il pattern non è affidabile). */}
                  <path
                    d={annularSectorPath(rHitOut, rSecIn, slotSpanDeg(i).a0 - WEDGE_INSET_DEG, slotSpanDeg(i).a1 + WEDGE_INSET_DEG)}
                    fill="url(#pr-navy-solid)"
                    style={{ pointerEvents: 'none' }}
                  />
                  <path
                    d={annularSectorPath(rHitOut, rSecIn, slotSpanDeg(i).a0 - WEDGE_INSET_DEG, slotSpanDeg(i).a1 + WEDGE_INSET_DEG)}
                    fill="url(#pr-navy)"
                    opacity={0.55}
                    style={{ pointerEvents: 'none' }}
                  />
                  {emptySlots === 'glass' ? imgEl(DISC_GLASS, `pr-pw-${i}`, `glass-${i}`) : null}
                </g>
              );
            })}
          </g>

          {/* slice locked: smalto spento + tratteggio sopra la lastra */}
          {slotted.map((a, i) =>
            isLocked(a.id) ? (
              <path key={`lk-${a.id}`} data-testid={`place-radial-locked-${i}`} d={annularSectorPath(rSecOut, rSecIn, slotSpanDeg(i).a0, slotSpanDeg(i).a1)} fill="url(#pr-hatch)" style={{ pointerEvents: 'none' }} />
            ) : null,
          )}

          {/* urgente: la scrittura oraria di uno slice che scade vira al rosso
              percettivo sotto soglia (ruling 2026-11-12 — niente pulse/badge).
              Overlay scuro-rossastro sul settore già scritto. */}
          {slotted.map((a, i) => {
            const view = views[a.id];
            if (!view || view.done || view.direction === 'clockwise') return null;
            const frac = Math.max(0, Math.min(1, view.progress));
            if (frac <= 0 || frac >= URGENT_AT) return null;
            const { a0, a1 } = slotSpanDeg(i);
            const i0 = a0 + WEDGE_INSET_DEG + 0.8;
            const i1 = a1 - WEDGE_INSET_DEG - 0.8;
            return (
              <path
                key={`urg-${a.id}`}
                d={annularSectorPath(rSecOut - R * 0.012, rSecIn + R * 0.018, i0, i0 + (i1 - i0) * frac)}
                fill={URGENT_RED}
                opacity={0.5 * (1 - frac / URGENT_AT) + 0.15}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}

          {/* hit + aria per slot (riempimento quasi invisibile: la pittura viene dalle lastre) */}
          {Array.from({ length: RADIAL_SLOTS }, (_, i) => {
            const active = i < slotted.length;
            if (!active && emptySlots === 'arc') return null;
            const { a0, a1 } = slotSpanDeg(i);
            const locked = active && isLocked(slotted[i].id);
            return (
              <path
                key={i}
                data-testid={`place-radial-slot-${i}`}
                data-slot={i}
                d={annularSectorPath(rHitOut, rSecIn, a0, a1)}
                fill={hovered === i && active ? 'rgba(255,240,200,.10)' : 'rgba(255,255,255,.004)'}
                role={active ? 'menuitem' : undefined}
                tabIndex={active ? (focusSlot === i ? 0 : -1) : undefined}
                aria-label={sliceLabel(i)}
                aria-disabled={locked || undefined}
                style={active ? { pointerEvents: 'visiblePainted', cursor: locked ? 'default' : 'pointer' } : { pointerEvents: 'none' }}
                onMouseEnter={() => active && (setHovered(i), openCard(i, false))}
                onMouseLeave={() => active && setHovered((h) => (h === i ? null : h))}
                onFocus={() => active && (setFocusSlot(i), setCardSlot(i))}
                onKeyDown={(e) => active && onSliceKey(e, i)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (active && !locked) onSelect?.(slotted[i].id);
                }}
              />
            );
          })}

          {/* Il centro del disco base è già il medaglione zona: il layer
              hub.webp sollevato via translateZ sta DOPO il svg (sotto). */}

          {/* overflow: count-gem sull'hub (design-error affordance → planner) */}
          {overflow.length > 0 ? (
            <g data-testid="place-radial-overflow" style={{ pointerEvents: 'visiblePainted', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onSelect?.('__overflow__'); }}>
              <circle r={R * 0.09} fill="#3a2c10" stroke="#c9a44a" strokeWidth={2} />
              <text textAnchor="middle" dy="0.35em" fill="#e8ddc0" fontSize={R * 0.09}>{`+${overflow.length}`}</text>
            </g>
          ) : null}
        </svg>

        {/* medaglione hub sollevato dalla faccia: translateZ nel frame del
            disco = quota perpendicolare al piano → fluttua sopra il pozzo
            centrale. ATTENZIONE: hub.webp è l'INTERA faccia dipinta (opaca a
            tutti i raggi) — resa a inset:0 coprirebbe ogni smalto SVG.
            hub-medal.png è il ritaglio del solo centro (230px di 512 ≈
            0.468R), reso alla scala corretta: la banda settori resta all'SVG. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: R * 0.936,
            height: R * 0.936,
            marginLeft: -R * 0.468,
            marginTop: -R * 0.468,
            transform: `translateZ(${lift}px)`,
            pointerEvents: 'none',
          }}
        >
          <img src={HUB_MEDAL} alt="" draggable={false} style={{ width: '100%', height: '100%', filter: `drop-shadow(0 ${R * 0.02}px ${R * 0.03}px rgba(0,0,0,.5))` }} />
        </div>

        {/* Icona villaggio: diorama poggiato SUL medaglione — sborda la
            corona (width > pozzo) a quota lift*2.2 con ombra di contatto,
            effetto «pezzo da gioco sul disco» non francobollo incassato.
            Candidata PLAN-117 (asset in dev-public, battesimo pendente). */}
        <div
          aria-hidden="true"
          data-testid="place-radial-hub-icon"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: R * 0.62,
            height: R * 0.62,
            marginLeft: -R * 0.31,
            marginTop: -R * 0.34,
            transform: `translateZ(${lift * 2.4}px)`,
            borderRadius: '50%',
            overflow: 'hidden',
            pointerEvents: 'none',
            boxShadow: `0 ${R * 0.03}px ${R * 0.05}px rgba(0,0,0,.65), 0 ${R * 0.008}px ${R * 0.015}px rgba(0,0,0,.5), inset 0 0 0 2px rgba(201,164,74,.4)`,
          }}
        >
          <img src={`${ART}/village-icon-v2.png`} alt="" draggable={false} style={{ width: '116%', height: '116%', marginLeft: '-8%', marginTop: '-8%', objectFit: 'cover' }} />
        </div>

        {/* icone dipinte billboarded: contro-ruotate E sollevate dalla faccia —
            il translateZ le stacca dalle costole dipinte (niente più copertura). */}
        {slotted.map((a, i) => {
          const p = iconPoint(i);
          const locked = isLocked(a.id);
          return (
            <div
              key={`ic-${a.id}`}
              data-testid={`place-radial-icon-${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: R * 0.24,
                height: R * 0.24,
                marginLeft: p.x - R * 0.12,
                marginTop: p.y - R * 0.12,
                transform: `translateZ(${lift}px) rotateX(${-tiltDeg}deg)`,
                pointerEvents: 'none',
                display: 'grid',
                placeItems: 'center',
                filter: locked ? 'grayscale(1) brightness(.7)' : undefined,
              }}
            >
              {a.iconUrl ? (
                <img src={a.iconUrl} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 ${R * 0.012}px ${R * 0.02}px rgba(0,0,0,.75))` }} />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* dwell card — componente persistente, swap di contenuto, niente pointer-events */}
      {cardSlot !== null && slotted[cardSlot] ? (
        <div
          data-testid="place-radial-card"
          role="tooltip"
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop,
            width: CARD_WIDTH,
            boxSizing: 'border-box',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(12,22,30,.94)',
            border: '1px solid rgba(201,164,74,.55)',
            color: '#e8ddc0',
            fontSize: 12.5,
            pointerEvents: 'none',
            zIndex: 30,
          }}
        >
          <div style={{ color: '#c9a44a', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {slotted[cardSlot].type}
          </div>
          <div style={{ marginTop: 3 }}>{sliceLabel(cardSlot)}</div>
          <div style={{ marginTop: 5, opacity: 0.75 }}>
            {isLocked(slotted[cardSlot].id)
              ? t('places.radial.lockedState', { defaultValue: 'Unavailable — see planner for unlock' })
              : `${views[slotted[cardSlot].id]?.state ?? 'available'} · ${Math.round((views[slotted[cardSlot].id]?.progress ?? 0) * 100)}%`}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PlaceRadial;
