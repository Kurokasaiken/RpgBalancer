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
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, rWallAt, R, R_CORE,
         type CheckConfig } from './zones';
import { measureCoverage, rHeroAt, rHeroNarrowAt, buildHeroShape,
         solveCoreRadius, solveOuterBands, solveGooBand, BALL_R, type Coverage } from './coverage';
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
  /** punte che si allungano e si stringono (desiderata v14 p.2, ripristinata) */
  narrow?: boolean;
  /**
   * IL CLIP COME BEAT, non come stato. 0 = la stella nasce INTERA (il Director:
   * «il fiore non deve nascere clippato»), 1 = tagliata sulla trama.
   */
  clipIn?: number;
  /** uscita: si stringono INSIEME stella e trama */
  outbound?: number;
  /**
   * 'woven' = la seta, per la nascita. 'dark' = durante il check: massa scura
   * senza fili, perche' li' i fili sono rumore e l'unica cosa da leggere e' la
   * pallina.
   */
  mode?: 'woven' | 'dark';
  /**
   * Le percentuali delle tre bande. Sono CONFIGURABILI e vengono da qui: prima
   * il board leggeva `DEFAULT_CHECK_CONFIG` da se, quindi cambiarle dal gioco
   * non avrebbe avuto effetto sul disegno.
   */
  config?: CheckConfig;
  /** la copertura misurata, verso l'alto: la percentuale e' un output */
  onMeasure?: (c: Coverage) => void;
}

export function SkillCheckBoardV15({
  stats, diffs, size = 760, seed = 0x51c5, valleyF, paintedWith = null, onMeasure,
  narrow = false, clipIn = 1, outbound = 0, mode = 'woven',
  config = DEFAULT_CHECK_CONFIG,
}: SkillCheckBoardV15Props): JSX.Element {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const K = (size / 2 - 28) / R;

  const snap = useMemo(
    () => buildSnapshot({ stats, diffs }, config, 0),
    [stats, diffs, config],
  );
  const cov = useMemo(() => measureCoverage(snap, 7200, narrow), [snap, narrow]);
  useEffect(() => { onMeasure?.(cov); }, [cov, onMeasure]);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const CX = size / 2, CY = size / 2;
    ctx.clearRect(0, 0, size, size);

    /* USCITA: stella e trama si stringono INSIEME. Un solo fattore su entrambe,
       o il gesto si spezza in due chiusure che leggono come un errore. */
    const out = 1 - Math.max(0, Math.min(1, outbound));
    const shape = narrow ? buildHeroShape(snap, valleyF) : null;
    const heroRaw = (a: number) =>
      (shape ? rHeroNarrowAt(shape, a) : rHeroAt(snap.axisTip, a, valleyF));
    /* IL BORDO STRAPPATO, definito UNA VOLTA e usato da tutti. Prima il bordo
       esterno era sfrangiato e la fascia critica seguiva `rWallAt` liscio: a
       schermo la fascia rileggeva come un cerchio disegnato attorno, cioe' la
       cosa che il Director ha rifiutato quattro volte. Il bordo interno del goo
       e' un bordo DEL GOO, quindi porta la stessa irregolarita'. */
    const s0 = (seed % 1000) / 1000;
    const fray = (a: number) =>
      1 - 0.055
        - 0.030 * Math.sin(a * 3.7 + s0 * 6.3)
        - 0.020 * Math.sin(a * 6.1 - s0 * 2.7)
        - 0.013 * Math.sin(a * 9.3 + s0 * 4.1);
    const tramaAt = (a: number) => rWallAt(snap, a) * K * out;
    const heroAt = (a: number) => heroRaw(a) * K * out;
    /* `addRing` NON apre un path: serve per comporre due contorni in UNO solo,
       che e' l'unico modo perche' `evenodd` produca un anello. Con due
       `beginPath` separati l'evenodd ha un contorno solo e riempie tutto — a
       schermo la fascia critica copriva l'intera stella di rosa. */
    const addRing = (f: (a: number) => number) => {
      for (let i = 0; i <= 1440; i += 1) {
        const a = (i / 1440) * TAU;
        const r = f(a);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
    };
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

    /* ── 1. LA TRAMA = LA DIFFICOLTA ─────────────────────────────────────── */
    if (mode === 'dark') {
      /* DURANTE IL CHECK: massa scura, nessun filo. Il Director: «non deve dare
         visual noise». La materia resta la stessa — cambia lo stato, non la
         sostanza — e il bordo sfrangiato sopravvive perche' e' li' che si legge
         la dimensione. */
      ctx.save();
      ctx.beginPath();
      /* BORDO STRAPPATO, non dentato. Con `sin(i*12.9898)` campionato a 360
         punti veniva un'onda a dente di sega regolare: a schermo leggeva come
         una ruota dentata, cioe' di nuovo una forma geometrica attorno. Tre
         armoniche basse e incommensurabili danno un contorno irregolare che non
         ha periodo visibile. */
      for (let i = 0; i <= 360; i += 1) {
        const a = (i / 360) * TAU;
        const r = tramaAt(a) * fray(a);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
      if (paintedWith) {
        ctx.save(); ctx.clip();
        ctx.filter = 'grayscale(1) brightness(.22) contrast(1.25)';
        ctx.drawImage(paintedWith, CX - size / 2, CY - size / 2, size, size);
        ctx.filter = 'none';
        ctx.restore();
      } else {
        /* scura ma NON invisibile: a #0d1416 su una pagina #080c0e la materia
           spariva, e la pallina sarebbe rimbalzata contro il niente — il difetto
           gia' segnalato dal Director sulle versioni precedenti. La massa deve
           dire la sua estensione senza dire niente altro. */
        const dg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * K);
        dg.addColorStop(0, '#1d2a2c');
        dg.addColorStop(0.72, '#16211f');
        dg.addColorStop(1, '#0e1618');
        ctx.fillStyle = dg;
        ctx.fill();
      }
      ctx.restore();
    } else {
      if (paintedWith) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= 220; i += 1) {
          const a = (i / 220) * TAU;
          const r = tramaAt(a) * fray(a);
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
    }

    /* ── 2. LA STELLA = IL PERSONAGGIO ────────────────────────────────────
       IL CLIP E' UN BEAT. A `clipIn` 0 la stella e' intera e piena: nasce come
       una fioritura. Salendo, il taglio sulla trama entra — e cio' che resta
       fuori sbiadisce invece di sparire di colpo. */
    const ci = Math.max(0, Math.min(1, clipIn));
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * K);
    g.addColorStop(0, 'rgba(255,246,226,0.97)');
    g.addColorStop(0.62, 'rgba(238,216,170,0.94)');
    g.addColorStop(1, 'rgba(206,170,116,0.9)');

    /* la parte fuori dalla trama: piena alla nascita, 0.18 a clip completo */
    pathOf(heroAt);
    ctx.save();
    ctx.globalAlpha = 1 - ci * 0.82;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    /* la parte coperta: sempre piena, e' il successo */
    pathOf(heroAt);
    ctx.save();
    ctx.clip();
    pathOf(tramaAt);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    /* IL CONTORNO DELLA STELLA C'E' SOLO ALLA NASCITA. Durante il check il
       confine e' il salto fra almost e fallimento critico: un contorno in piu'
       era il terzo dei «3 bordi» segnalati dal Director. */
    if (ci < 0.5) {
      pathOf(heroAt);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(255,240,206,${0.5 + 0.4 * (1 - ci)})`;
      ctx.stroke();
    }

    /* ── 3. LE TRE BANDE, OGNUNA IL 5% DELLA TRAMA ───────────────────────
         nucleo della stella      -> SUCCESSO CRITICO
         subito fuori dalla stella-> ALMOST (mancata di un soffio: e' un
                                     fallimento, per questo sta FUORI)
         fra i due                -> fallimento normale
         bordo interno del goo    -> FALLIMENTO CRITICO, appoggiato al punto piu'
                                     profondo che il tiro raggiunge
       Un bordo solo sulla stella: e' il salto fra il pieno e la banda di almost. */
    if (mode === 'dark' || ci > 0.5) {
      /* ognuna la SUA voce di config: almost, crit, critWin sono tre numeri
         diversi e prima li avevo cablati tutti su `crit` */
      const [eAlmost] = solveOuterBands(snap, heroRaw, [config.almost], 1440);
      const fGoo = solveGooBand(snap, config.crit, 1440);
      const rCore = solveCoreRadius(snap, config.critWin) * K * out;
      const reachAt = (a: number) =>
        Math.max(0, (rWallAt(snap, a) - BALL_R)) * K * out * (0.94 + 0.06 * fray(a) * 1.06);

      ctx.save();
      pathOf(tramaAt);
      ctx.clip();

      /* FALLIMENTO CRITICO: il bordo interno del goo */
      ctx.beginPath();
      addRing(reachAt);
      addRing((a) => reachAt(a) * (1 - fGoo));
      ctx.fillStyle = 'rgba(196,74,58,0.5)';
      ctx.fill('evenodd');

      /* ALMOST: subito fuori dalla stella */
      ctx.beginPath();
      addRing((a) => Math.min(heroAt(a) * (1 + eAlmost), tramaAt(a)));
      addRing(heroAt);
      ctx.fillStyle = 'rgba(226,178,110,0.5)';
      ctx.fill('evenodd');

      ctx.restore();

      /* SUCCESSO CRITICO: il nucleo. Se non ci sta dentro la stella lo dice,
         invece di lasciare il trionfo sconfinare nel fallimento. */
      let minHero = Infinity;
      for (let i = 0; i < 720; i += 1) minHero = Math.min(minHero, heroAt((i / 720) * TAU));
      ctx.beginPath();
      ctx.arc(CX, CY, Math.min(rCore, minHero), 0, TAU);
      ctx.fillStyle = 'rgba(126,224,171,0.3)';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = rCore > minHero ? 'rgba(255,120,120,0.9)' : 'rgba(150,240,190,0.85)';
      ctx.stroke();
    }

  }, [snap, size, seed, valleyF, paintedWith, K, narrow, clipIn, outbound, mode, config]);

  return <canvas ref={cv} width={size} height={size} style={{ borderRadius: 6, display: 'block' }} />;
}

export default SkillCheckBoardV15;
