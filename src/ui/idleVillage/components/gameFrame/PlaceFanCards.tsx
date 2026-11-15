/**
 * PlaceFanCards — anello ellittico di spicchi-smalto del Luogo
 * (modello battezzato `refs/approved-fan-v65.png`, ruling Director
 * 2026-11-14; sostituisce il modello a carte misurate).
 *
 * `slotsTotal` settori anulari contigui divisi da separatori oro: smalto
 * per famiglia, gemme sul rim, gonna sotto il bordo frontale, diorama
 * centrale sopra l'anello. Geometria parametrica in `placeFanGeometry`.
 *
 * Grammatica smalto (ruling Director):
 * - settore sempre smalto chiaro di famiglia; settore vuoto → navy;
 * - il progress scrive smalto scuro radialmente dal bordo interno
 *   (la punta dello spicchio, rivolta al diorama) verso il rim;
 *   done non-ripetibile resta scuro (click-to-collect);
 *   urgente = virata percettiva rossa;
 * - niente testo sugli spicchi («niente testo, mai»): solo icone.
 *
 * Interazioni (GX-0042, stesso contratto di PlaceRadial):
 * - root non intercetta la mappa: pointer-events solo sugli spicchi;
 * - hover dwell 350 ms → card ancorata non modale, swap fra spicchi;
 * - click → onSelect; Esc / click-fuori <4px → onRequestClose;
 * - roving tabindex sull'ordine di riempimento (sx → dx).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MapQuestPoiView } from './MapQuestPoi';
import type { PlaceFanActivity } from './PlaceFan';
import {
  FAN_RING,
  assignFanCards,
  ringFillOrder,
  skirtPath,
  ringPoint,
  sliceCentroid,
  slicePath,
  slotAngles,
} from './placeFanGeometry';

export interface FanCardsActivity extends PlaceFanActivity {
  /** Icona dipinta del contenuto dello spicchio (offerta/tipo attività). */
  iconUrl?: string;
}

export interface PlaceFanCardsProps {
  activities: readonly FanCardsActivity[];
  views: Readonly<Record<string, MapQuestPoiView>>;
  /** Larghezza della scena composta in px schermo. */
  widthPx?: number;
  onSelect?: (activityId: string) => void;
  /** Chiamato quando il menu deve chiudersi (Esc / clic-fuori). */
  onRequestClose?: () => void;
}

const SPEC = FAN_RING;
const CLOSE_DRAG_PX = 4;
const DWELL_MS = 350;
const CARD_WIDTH = 220;

/** Glifo dipinto (estratto dal mockup approvato): match per keyword su
 * id/iconUrl; nessun match → iconUrl grezza. */
const glyphFor = (a: FanCardsActivity): string => {
  const hay = `${a.id} ${a.iconUrl ?? ''}`.toLowerCase();
  for (const [key, glyph] of Object.entries(SPEC.iconGlyphMap)) {
    if (hay.includes(key)) return `${SPEC.iconGlyphBase}/icon-${glyph}.webp`;
  }
  return a.iconUrl ?? '';
};

const enamelKey = (type: string | null) => (type && type in SPEC.enamel ? type : 'empty');

export const PlaceFanCards: React.FC<PlaceFanCardsProps> = ({
  activities,
  views,
  widthPx = 760,
  onSelect,
  onRequestClose,
}) => {
  const { t } = useTranslation('idleVillage');
  const [hovered, setHovered] = useState<number | null>(null);
  const [cardRank, setCardRank] = useState<number | null>(null);
  const [focusRank, setFocusRank] = useState<number>(0);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  const fillOrder = useMemo(() => ringFillOrder(SPEC), []);
  const { slots, overflow } = useMemo(() => assignFanCards(activities, SPEC), [activities]);

  const refW = SPEC.refW;
  const refH = SPEC.refH;
  const k = widthPx / refW;
  const ringCx = SPEC.cx * refW;
  const ringCy = SPEC.cy * refH;
  const ringRx = SPEC.outerRx * refW;
  const ringRy = SPEC.outerRy * refH;
  const diorH = SPEC.diorama.hFrac * refH;
  const diorW = diorH * SPEC.diorama.aspect;
  const dx = SPEC.diorama.x * refW;
  const dy = SPEC.diorama.y * refH;
  const rim = SPEC.rimFrac * refH;
  const iconR = SPEC.iconFrac * (SPEC.outerRy - SPEC.innerRy) * refH;

  /* --- dwell card: 350ms alla prima apertura, poi swap istantaneo --- */
  const openCard = useCallback(
    (rank: number, immediate: boolean) => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      if (immediate || cardRank !== null) setCardRank(rank);
      else dwellTimer.current = setTimeout(() => setCardRank(rank), DWELL_MS);
    },
    [cardRank],
  );
  useEffect(() => () => { if (dwellTimer.current) clearTimeout(dwellTimer.current); }, []);

  /* --- chiusura: Esc + clic-fuori <4px (un drag è pan, non chiude) --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onRequestClose?.(); };
    const onDown = (e: PointerEvent) => { pointerDown.current = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      const d0 = pointerDown.current;
      pointerDown.current = null;
      if (!d0 || Math.hypot(e.clientX - d0.x, e.clientY - d0.y) >= CLOSE_DRAG_PX) return;
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) onRequestClose?.();
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

  const slotLabel = (slotIdx: number) => {
    const a = slots[slotIdx];
    return a ? (a.titleKey ? t(a.titleKey) : a.id) : t('places.radial.emptySlot', { defaultValue: 'Empty slot' });
  };

  const onCardKey = (e: React.KeyboardEvent, rank: number) => {
    const slotIdx = fillOrder[rank];
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const dir: 1 | -1 = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      /* wrap solo fra i rank che ospitano un'attività: i rank vuoti non
         hanno hit-path e non possono prendere il focus. */
      let n = rank;
      for (let i = 0; i < fillOrder.length; i++) {
        n = (n + dir + fillOrder.length) % fillOrder.length;
        if (slots[fillOrder[n]]) break;
      }
      setFocusRank(n);
      (e.currentTarget.ownerSVGElement?.querySelector(`[data-rank="${n}"]`) as HTMLElement | null)?.focus();
      setCardRank(n);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const a = slots[slotIdx];
      if (a && !isLocked(a.id)) onSelect?.(a.id);
    }
  };

  /* --- uno spicchio dell'anello --- */
  const renderSlice = (slotIdx: number) => {
    const a = slots[slotIdx];
    /* ruling Director: gli slot vuoti non renderizzano alcun petalo */
    if (!a) return null;
    const rank = fillOrder.indexOf(slotIdx);
    const d = slicePath(SPEC, slotIdx);
    const key = enamelKey(a.type);
    const view = views[a.id];
    const done = Boolean(view?.done);
    const locked = isLocked(a.id);
    const [cx, cy] = sliceCentroid(SPEC, slotIdx);
    const { mid } = slotAngles(SPEC, slotIdx);
    const [sx0, sy0] = ringPoint(SPEC, mid, 0.02);
    const [sx1, sy1] = ringPoint(SPEC, mid, 1.02);
    return (
      <g key={`s-${slotIdx}`} style={{ pointerEvents: 'none' }}>
        <clipPath id={`pfr-en-${slotIdx}`}>
          <path d={d} />
        </clipPath>
        {/* sheen radiale della lastra: luce calda spezzata sul bordo
            esterno, rim in recesso. Niente ombra sulle punte — col diorama
            compatto resterebbero visibili come cunei scuri (ruling). */}
        <linearGradient id={`pfr-sh-${slotIdx}`} gradientUnits="userSpaceOnUse" x1={sx0} y1={sy0} x2={sx1} y2={sy1}>
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="0.72" stopColor="#ffecb4" stopOpacity={0.20} />
          <stop offset="0.88" stopColor="#ffecb4" stopOpacity={0.05} />
          <stop offset="1" stopColor="#000" stopOpacity={0.28} />
        </linearGradient>
        {/* smalto dipinto: ANELLO INTERO del materiale di famiglia,
            clippato sulla stessa path del settore — unica sorgente,
            nessuna cucitura possibile (pipeline full-ring master) */}
        <image
          href={`${SPEC.sliceBase}/ring-${SPEC.familySlice[key] ?? 'empty'}.webp`}
          x={0}
          y={0}
          width={refW}
          height={refH}
          clipPath={`url(#pfr-en-${slotIdx})`}
          style={{ pointerEvents: 'none' }}
        />
        {/* stati sullo smalto */}
        <g clipPath={`url(#pfr-en-${slotIdx})`}>
          <path d={d} fill={`url(#pfr-sh-${slotIdx})`} style={{ pointerEvents: 'none' }} />
          {/* niente fill scuri a cuneo sullo smalto (ruling Director:
              i pezzi scuri leggono come ombre sporche — il progress/
              countdown torna sulle piste del rim, spec r003); done
              non-ripetibile resta petalo scuro uniforme per
              click-to-collect */}
          {done && a ? <path d={d} fill={SPEC.familyDark[key] ?? '#000'} opacity={0.72} /> : null}
          {locked ? <path data-testid={`place-fancards-locked-${slotIdx}`} d={d} fill="url(#pfr-hatch)" /> : null}
        </g>
        {/* icona al centroide — niente testo, ruling */}
        {a && glyphFor(a) ? (
          <image
            href={glyphFor(a)}
            x={cx - iconR / 2}
            y={cy - iconR / 2}
            width={iconR}
            height={iconR}
            style={{ pointerEvents: 'none', filter: locked ? 'grayscale(1) brightness(.7)' : 'drop-shadow(0 2px 3px rgba(0,0,0,.7))' }}
          />
        ) : null}
        {/* hit + aria: solo spicchi con attività */}
        {a ? (
          <path
            data-testid={`place-fancards-slot-${rank}`}
            data-rank={rank}
            d={d}
            fill={hovered === rank ? 'rgba(255,240,200,.14)' : 'rgba(255,255,255,.004)'}
            role="menuitem"
            tabIndex={focusRank === rank ? 0 : -1}
            aria-label={slotLabel(slotIdx)}
            aria-disabled={locked || undefined}
            style={{ pointerEvents: 'visiblePainted', cursor: locked ? 'default' : 'pointer' }}
            onMouseEnter={() => (setHovered(rank), openCard(rank, false))}
            onMouseLeave={() => setHovered((hv) => (hv === rank ? null : hv))}
            onFocus={() => (setFocusRank(rank), setCardRank(rank))}
            onKeyDown={(e) => onCardKey(e, rank)}
            onClick={(e) => {
              e.stopPropagation();
              if (!locked) onSelect?.(a.id);
            }}
          />
        ) : null}
      </g>
    );
  };

  /* Card ancorata (stessa metrica di PlaceRadial: laterale, pointer-events none). */
  const cardRankSlot = cardRank !== null ? fillOrder[cardRank] : null;
  const cardActivity = cardRankSlot !== null ? slots[cardRankSlot] : null;
  const rootRect = rootRef.current?.getBoundingClientRect();
  const cardLeft = rootRect
    ? Math.max(12 - rootRect.left, Math.min(widthPx * 0.7, window.innerWidth - CARD_WIDTH - 12 - rootRect.left))
    : widthPx * 0.7;
  const cardTop = rootRect ? Math.max(12 - rootRect.top, 0) : 0;

  return (
    <div
      ref={rootRef}
      data-testid="place-fancards"
      role="menu"
      aria-label={t('places.radial.ariaLabel', { defaultValue: 'Place actions' })}
      style={{
        position: 'absolute',
        left: -dx * k,
        top: -dy * k,
        width: widthPx,
        height: refH * k,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        .pfr-diorama-rise{transform-box:fill-box;transform-origin:50% 88%;animation:pfrDioramaRise .72s cubic-bezier(.2,.85,.25,1) both}
        @keyframes pfrDioramaRise{
          0%{transform:translateY(26px) rotate(-6deg) scaleX(.58) scaleY(.86);opacity:0}
          40%{opacity:1}
          70%{transform:translateY(-4px) rotate(1.4deg) scaleX(1.02) scaleY(1.01)}
          100%{transform:none}
        }
        @media (prefers-reduced-motion:reduce){.pfr-diorama-rise{animation:none}}
      `}</style>
      {/* vignetta navy LOCALE (spec r003: NO blur/desaturazione globale;
          corona scura limpida sul disco, ≤28% di opacità, sfuma ~30%
          oltre il bordo) — resa in SVG sotto gli spicchi */}
      <svg
        width={widthPx}
        height={refH * k}
        viewBox={`0 0 ${refW} ${refH}`}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="pfr-vignette" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a1626" stopOpacity="0" />
            <stop offset="72%" stopColor="#0a1626" stopOpacity="0" />
            <stop offset="86%" stopColor="#0a1626" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#0a1626" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={ringCx} cy={ringCy} rx={ringRx * 1.38} ry={ringRy * 1.42} fill="url(#pfr-vignette)" />
      </svg>
      <svg
        width={widthPx}
        height={refH * k}
        viewBox={`0 0 ${refW} ${refH}`}
        style={{ display: 'block', overflow: 'visible', position: 'relative', zIndex: 1 }}
      >
        <defs>
          <pattern id="pfr-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="rgba(10,14,18,.72)" />
            <rect width="3" height="8" fill="rgba(140,150,160,.4)" />
          </pattern>
          <filter id="pfr-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="pfr-soft6" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>

        {/* ombra proiettata dell'intero assemblaggio sul mondo */}
        <ellipse cx={ringCx} cy={ringCy + ringRy * 0.88} rx={ringRx * 0.98} ry={ringRy * 0.34} fill="#000" opacity={0.42} filter="url(#pfr-soft)" />

        {/* gonna sotto il bordo frontale: parete bronzo con doppia fascia
            incisa, filigrana, perline e gemme smeraldo in castone — stesso
            genere ornamentale del resto della HUD */}
        {/* bordo superiore alzato dentro la facciata (topT .95): niente
            fessura trasparente tra gonna e smalto — ruling Director */}
        <path d={skirtPath(SPEC, 4, 176, 0.95)} fill={SPEC.gold[2]} opacity={0.96} />
        <path d={skirtPath(SPEC, 6, 174)} fill="none" stroke="#3a2a10" strokeWidth={SPEC.skirtFrac * refH * 0.28} opacity={0.8} transform="translate(0 0)" />
        <path d={skirtPath(SPEC, 6, 174)} fill="none" stroke={SPEC.gold[0]} strokeWidth={2.6} opacity={0.85} transform="translate(0 -2)" />
        <path d={skirtPath(SPEC, 10, 170)} fill="none" stroke={SPEC.gold[1]} strokeWidth={1.4} opacity={0.6} transform={`translate(0 ${SPEC.skirtFrac * refH * 0.30})`} />
        {Array.from({ length: 33 }, (_, j) => {
          const a = 10 + (160 * j) / 32;
          const [px, py] = ringPoint(SPEC, a, 1);
          const [nx, ny] = ringPoint(SPEC, a + 1, 1);
          const rot = (Math.atan2(ny - py, nx - px) * 180) / Math.PI;
          return (
            <rect
              key={`fil-${j}`}
              x={-3.4}
              y={-3.4}
              width={6.8}
              height={6.8}
              transform={`translate(${px.toFixed(1)} ${(py + SPEC.skirtFrac * refH * 0.52).toFixed(1)}) rotate(${(rot + 45).toFixed(1)})`}
              fill="none"
              stroke={SPEC.gold[1]}
              strokeWidth={1.1}
              opacity={0.7}
            />
          );
        })}
        {/* perline oro fra i diamanti */}
        {Array.from({ length: 32 }, (_, j) => {
          const a = 12.5 + (160 * j) / 31;
          const [px, py] = ringPoint(SPEC, a, 1);
          return (
            <circle key={`bead-${j}`} cx={px} cy={py + SPEC.skirtFrac * refH * 0.52} r={1.6} fill={SPEC.gold[0]} opacity={0.75} />
          );
        })}
        {/* gemme smeraldo in castone oro, una ogni ~20° sull'arco frontale */}
        {Array.from({ length: 9 }, (_, j) => {
          const a = 15 + (150 * j) / 8;
          const [px, py] = ringPoint(SPEC, a, 1);
          const gy = py + SPEC.skirtFrac * refH * 0.62;
          return (
            <g key={`gem-${j}`} style={{ pointerEvents: 'none' }}>
              <ellipse cx={px} cy={gy} rx={7.5} ry={5.6} fill="#241a08" stroke={SPEC.gold[0]} strokeWidth={1.6} />
              <ellipse cx={px} cy={gy} rx={4.8} ry={3.4} fill="#0d5a38" />
              <ellipse cx={px - 1.4} cy={gy - 1.1} rx={1.7} ry={1.1} fill="#7ee0ae" opacity={0.9} />
            </g>
          );
        })}
        <path d={skirtPath(SPEC, 12, 168)} fill="none" stroke={SPEC.gold[0]} strokeWidth={2.2} opacity={0.8} transform={`translate(0 ${SPEC.skirtFrac * refH * 0.86})`} />
        <path d={skirtPath(SPEC, 14, 166)} fill="none" stroke="#120d05" strokeWidth={1.4} opacity={0.7} transform={`translate(0 ${SPEC.skirtFrac * refH * 0.97})`} />

        {/* spicchi smalto */}
        {Array.from({ length: SPEC.slotsTotal }, (_, i) => renderSlice(i))}

        {/* struttura oro UNICA sopra tutti gli smalti: costole condivise
            ai separatori, rim continuo, gemme ai giunti — mai tagliata,
            è il layer che tiene insieme l'oggetto (ruling GPT-5.6) */}
        <image
          href={`${SPEC.sliceBase}/ring-structure.png`}
          x={0}
          y={0}
          width={refW}
          height={refH}
          style={{ pointerEvents: 'none' }}
        />

        {/* plinto centrale: copre le radici delle lastre e porta il
            diorama — tamburo bronzo-oro più alto, rim light oro sul bordo
            superiore e parete frontale scura (critica GPT-5.6 #3) */}
        <ellipse cx={dx} cy={dy + diorH * 0.30} rx={SPEC.innerRx * refW * 1.12} ry={SPEC.innerRy * refH * 1.14} fill="#1c1409" />
        <ellipse cx={dx} cy={dy + diorH * 0.22} rx={SPEC.innerRx * refW * 1.12} ry={SPEC.innerRy * refH * 1.14} fill="#2c2010" />
        <ellipse cx={dx} cy={dy + diorH * 0.22} rx={SPEC.innerRx * refW * 1.12} ry={SPEC.innerRy * refH * 1.14} fill="none" stroke={SPEC.gold[1]} strokeWidth={3.5} opacity={0.9} />
        <path
          d={`M ${(dx - SPEC.innerRx * refW * 1.12).toFixed(1)} ${(dy + diorH * 0.22).toFixed(1)} A ${(SPEC.innerRx * refW * 1.12).toFixed(1)} ${(SPEC.innerRy * refH * 1.14).toFixed(1)} 0 0 1 ${(dx + SPEC.innerRx * refW * 1.12).toFixed(1)} ${(dy + diorH * 0.22).toFixed(1)}`}
          fill="none"
          stroke={SPEC.gold[0]}
          strokeWidth={1.8}
          opacity={0.8}
        />
        {/* niente ombra circolare ai piedi del diorama — ruling Director */}
        {/* diorama centrale sopra l'anello — entra in scena dal basso,
            frontale e ruotato, si gira e si alza nel socket (ruling
            Director; tecnica 2D: scaleX+rotate+translateY, v. ricerca
            CSS transforms; reduced-motion rispettato) */}
        <g className="pfr-diorama-rise">
          <image
            href={SPEC.diorama.href}
            x={dx - diorW / 2}
            y={dy - diorH / 2}
            width={diorW}
            height={diorH}
            style={{ pointerEvents: 'none' }}
          />
        </g>

        {/* labbro frontale del socket: la cornice del foro (fronte del
            plinto) passa SOPRA il piede del saucer — il diorama è
            incassato nelle slice, non appoggiato sopra (ruling Director) */}
        <path
          d={`M ${(dx - SPEC.innerRx * refW * 0.85).toFixed(1)} ${(dy + diorH * 0.42).toFixed(1)} A ${(SPEC.innerRx * refW * 0.85).toFixed(1)} ${(SPEC.innerRy * refH * 0.55).toFixed(1)} 0 0 1 ${(dx + SPEC.innerRx * refW * 0.85).toFixed(1)} ${(dy + diorH * 0.42).toFixed(1)}`}
          fill="none"
          stroke="#241a08"
          strokeWidth={11}
          strokeLinecap="round"
          opacity={0.92}
        />
        <path
          d={`M ${(dx - SPEC.innerRx * refW * 0.85).toFixed(1)} ${(dy + diorH * 0.42).toFixed(1)} A ${(SPEC.innerRx * refW * 0.85).toFixed(1)} ${(SPEC.innerRy * refH * 0.55).toFixed(1)} 0 0 1 ${(dx + SPEC.innerRx * refW * 0.85).toFixed(1)} ${(dy + diorH * 0.42).toFixed(1)}`}
          fill="none"
          stroke={SPEC.gold[1]}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.95}
        />
        <path
          d={`M ${(dx - SPEC.innerRx * refW * 0.85).toFixed(1)} ${(dy + diorH * 0.42 - 3).toFixed(1)} A ${(SPEC.innerRx * refW * 0.85).toFixed(1)} ${(SPEC.innerRy * refH * 0.55).toFixed(1)} 0 0 1 ${(dx + SPEC.innerRx * refW * 0.85).toFixed(1)} ${(dy + diorH * 0.42 - 3).toFixed(1)}`}
          fill="none"
          stroke={SPEC.gold[0]}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* overflow: count-gem sul piede del diorama (→ planner) */}
        {overflow.length > 0 ? (
          <g
            data-testid="place-fancards-overflow"
            transform={`translate(${dx} ${dy + diorH * 0.42})`}
            style={{ pointerEvents: 'visiblePainted', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.('__overflow__');
            }}
          >
            <circle r={22} fill="#3a2c10" stroke="#c9a44a" strokeWidth={2} />
            <text textAnchor="middle" dy="0.35em" fill="#e8ddc0" fontSize={20}>{`+${overflow.length}`}</text>
          </g>
        ) : null}
      </svg>

      {/* dwell card — persistente, swap di contenuto, niente pointer-events */}
      {cardRank !== null && cardActivity ? (
        <div
          data-testid="place-fancards-card"
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
          <div style={{ color: '#c9a44a', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{cardActivity.type}</div>
          <div style={{ marginTop: 3 }}>{slotLabel(fillOrder[cardRank])}</div>
          <div style={{ marginTop: 5, opacity: 0.75 }}>
            {isLocked(cardActivity.id)
              ? t('places.radial.lockedState', { defaultValue: 'Unavailable — see planner for unlock' })
              : `${views[cardActivity.id]?.state ?? 'available'} · ${Math.round((views[cardActivity.id]?.progress ?? 0) * 100)}%`}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PlaceFanCards;
