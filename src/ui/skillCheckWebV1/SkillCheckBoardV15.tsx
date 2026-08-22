/**
 * SkillCheckBoardV15 — il board come COMPONENTE PILOTATO DA PROPS.
 *
 * Modellato su `QuestChronicle`: quello riceve fasi, indice corrente e progresso
 * e non possiede niente: chi lo usa cambia le props e la carta si ridisegna. Qui
 * serve la stessa cosa per il motivo che il Director ha nominato —
 *
 *     «ci saranno dei consumabili che dovranno far ridisegnare il board»
 *
 * Un consumabile che alza una stat non deve "notificare" il board: cambia le
 * props, e la geometria si ricostruisce. Per questo il componente non tiene
 * nessuno stato di gioco, e `stats`/`diffs` sono l'unica fonte: `useMemo` sulle
 * due liste e' cio' che rende il ridisegno automatico invece che orchestrato.
 *
 * `onMeasure` esce verso l'alto perche' la percentuale e' un OUTPUT della
 * geometria (desiderata v15): chi mostra il numero lo riceve da qui, non lo
 * calcola per conto suo — o tornerebbero due verita' diverse sullo schermo.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, rWallAt, R, R_CORE } from './zones';
import { measureCoverage, rHeroAt, type Coverage } from './coverage';
import { drawTrama, TRAMA_DEFAULTS } from './trama';

const TAU = Math.PI * 2;

export interface SkillCheckBoardV15Props {
  stats: number[];
  diffs: number[];
  /** lato del canvas in px */
  size?: number;
  /** seme della trama: cambiarlo ritessse la tela senza toccare la geometria */
  seed?: number;
  /** frazione di valle: 0.3675 legge fiore, 0.2675 legge stella */
  valleyF?: number;
  /** la trama dipinta (bg.png desaturato) invece che di solo filo */
  paintedWith?: HTMLImageElement | null;
  /** la copertura misurata, verso l'alto: la percentuale e' un output */
  onMeasure?: (c: Coverage) => void;
}

export function SkillCheckBoardV15({
  stats, diffs, size = 760, seed = 0x51c5, valleyF, paintedWith = null, onMeasure,
}: SkillCheckBoardV15Props): JSX.Element {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const K = (size / 2 - 28) / R;

  const snap = useMemo(
    () => buildSnapshot({ stats, diffs }, DEFAULT_CHECK_CONFIG, 0),
    [stats, diffs],
  );
  const cov = useMemo(() => measureCoverage(snap), [snap]);
  useEffect(() => { onMeasure?.(cov); }, [cov, onMeasure]);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const CX = size / 2, CY = size / 2;
    ctx.clearRect(0, 0, size, size);

    const tramaAt = (a: number) => rWallAt(snap, a) * K;
    const heroAt = (a: number) => rHeroAt(snap.axisTip, a, valleyF) * K;
    const pathOf = (f: (a: number) => number) => {
      ctx.beginPath();
      for (let i = 0; i <= 1440; i += 1) {
        const a = (i / 1440) * TAU;
        const r = f(a);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
    };

    /* ── 1. LA TRAMA = LA DIFFICOLTA ────────────────────────────────────────
       Se e' dipinta, la pittura viene TAGLIATA su una sagoma sfrangiata e non
       su un disco: un riempimento su `tramaAt` rimetterebbe in scena
       esattamente il cerchio che i fili evitano. */
    if (paintedWith) {
      ctx.save();
      ctx.beginPath();
      const rnd = (i: number) => 1 - 0.09 * Math.abs(Math.sin(i * 12.9898 + seed));
      for (let i = 0; i <= 220; i += 1) {
        const a = (i / 220) * TAU;
        const r = tramaAt(a) * rnd(i);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.filter = 'grayscale(1) brightness(.30) contrast(1.3)';
      ctx.drawImage(paintedWith, CX - size / 2, CY - size / 2, size, size);
      ctx.filter = 'none';
      ctx.restore();
    }
    drawTrama(ctx, { cx: CX, cy: CY, rTrama: tramaAt, rCore: R_CORE * K * 0.75 },
      { ...TRAMA_DEFAULTS, seed });

    /* ── 2. LA STELLA = IL PERSONAGGIO, sopra ─────────────────────────────── */
    pathOf(heroAt);
    ctx.save();
    ctx.clip();
    pathOf(tramaAt);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * K);
    g.addColorStop(0, 'rgba(255,246,226,0.97)');
    g.addColorStop(0.62, 'rgba(238,216,170,0.94)');
    g.addColorStop(1, 'rgba(206,170,116,0.9)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    /* fuori dalla trama: talento che la prova non chiede. Disegnato, non
       troncato — e il path va RICOSTRUITO, perche' save/restore non salvano
       il path corrente. */
    pathOf(heroAt);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = 'rgba(238,216,170,1)';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(255,240,206,0.5)';
    ctx.stroke();

    /* le cinque punte a rOf(stat): l'invariante che non si muove */
    for (let i = 0; i < AXES; i += 1) {
      const a = -Math.PI / 2 + i * TAU / AXES;
      const r = snap.axisTip[i] * K;
      ctx.beginPath();
      ctx.arc(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 2.4, 0, TAU);
      ctx.fillStyle = 'rgba(255,248,232,0.9)';
      ctx.fill();
    }
  }, [snap, size, seed, valleyF, paintedWith, K]);

  return <canvas ref={cv} width={size} height={size} style={{ borderRadius: 6, display: 'block' }} />;
}

export default SkillCheckBoardV15;
