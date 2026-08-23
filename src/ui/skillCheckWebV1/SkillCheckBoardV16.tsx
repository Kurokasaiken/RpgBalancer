/**
 * SkillCheckBoardV16 — LA PITTURA DELLA V6 SUL MODELLO MISURATO DELLA V15.
 *
 * Il Director, indicando /minimal-destiny-astrolabe-v6: «il fiore originale,
 * come nella V6, e' diverso e piu' carino, voglio che di base sia quello.»
 *
 * Letto il file: la GEOMETRIA del fiore V6 e' identica a `rHeroAt` — stessa
 * formula riga per riga, incavo alla punta minore delle due adiacenti per
 * `VALLEY_F` 0.3675. Quello che cambia e' la PITTURA: dodici strati, faccia
 * radiale avorio, riflesso speculare che gira, triplo bordo di bronzo, filo
 * bianco, tre contorni interni, nucleo brunito con archi e scintilla pulsante.
 *
 * E due di quegli strati sono gia' le bande che il Director ha chiesto:
 *   L3  il bordo di bronzo FUORI dal profilo   -> ALMOST
 *   L10-L12 il nucleo, «the BIG WIN seat»      -> SUCCESSO CRITICO
 * Qui non sono piu' spessori fissi (`ALMOST_W = 16`, che a difficolta' diverse
 * valeva probabilita' diverse): sono risolti sull'AREA DI TIRO.
 *
 * Decisioni del Director che questo file implementa alla lettera:
 *  - il successo critico ESISTE SEMPRE e sta alla percentuale impostata. Se la
 *    stella non lo contiene non e' un problema: nessun clamp, nessun avviso.
 *  - almost e' un fallimento, quindi sta FUORI dal bordo della stella.
 *  - il fallimento critico e' il bordo interno del goo, appoggiato al punto piu'
 *    profondo che il tiro raggiunge (`trama - BALL_R`).
 *  - nessuna punta di alabastro sulle punte.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, rWallAt, R, R_CORE,
         type CheckConfig } from './zones';
import { measureCoverage, rHeroAt, rHeroNarrowAt, buildHeroShape, solveCoreRadius,
         solveOuterBands, solveGooBand, BALL_R, type Coverage } from './coverage';
import { drawTrama, TRAMA_DEFAULTS } from './trama';

const TAU = Math.PI * 2;

export interface SkillCheckBoardV16Props {
  stats: number[];
  diffs: number[];
  size?: number;
  seed?: number;
  /** true = la progressione fiore -> stella -> stella affilata */
  narrow?: boolean;
  /** 0 = la stella nasce intera, 1 = tagliata sulla trama */
  clipIn?: number;
  /** uscita: stella e trama si stringono insieme */
  outbound?: number;
  mode?: 'woven' | 'dark';
  paintedWith?: HTMLImageElement | null;
  config?: CheckConfig;
  /** tempo in ms per gli strati animati: riflesso, archi, scintilla */
  now?: number;
  onMeasure?: (c: Coverage) => void;
}

export function SkillCheckBoardV16({
  stats, diffs, size = 760, seed = 0x51c5, narrow = true, clipIn = 1,
  outbound = 0, mode = 'woven', paintedWith = null,
  config = DEFAULT_CHECK_CONFIG, now = 0, onMeasure,
}: SkillCheckBoardV16Props): JSX.Element {
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
    const t = now / 1000;
    ctx.clearRect(0, 0, size, size);

    const out = 1 - Math.max(0, Math.min(1, outbound));
    const ci = Math.max(0, Math.min(1, clipIn));
    const shape = narrow ? buildHeroShape(snap) : null;
    const heroRaw = (a: number) => (shape ? rHeroNarrowAt(shape, a) : rHeroAt(snap.axisTip, a));
    const tramaAt = (a: number) => rWallAt(snap, a) * K * out;
    const heroAt = (a: number) => heroRaw(a) * K * out;

    /* il bordo strappato, uno solo per tutti i bordi del goo */
    const s0 = (seed % 1000) / 1000;
    const fray = (a: number) =>
      1 - 0.055
        - 0.030 * Math.sin(a * 3.7 + s0 * 6.3)
        - 0.020 * Math.sin(a * 6.1 - s0 * 2.7)
        - 0.013 * Math.sin(a * 9.3 + s0 * 4.1);
    const rTipMax = Math.max(...snap.axisTip) * K * out;
    const reachAt = (a: number) =>
      Math.max(0, rWallAt(snap, a) - BALL_R) * K * out * (0.94 + 0.06 * fray(a) * 1.06);

    const ring = (f: (a: number) => number, seg = 720) => {
      for (let i = 0; i <= seg; i += 1) {
        const a = (i / seg) * TAU;
        const r = f(a);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
    };
    const pathAt = (f: (a: number) => number, seg = 720) => { ctx.beginPath(); ring(f, seg); };
    /* il profilo scalato: gli strati L7-L9 della V6 sono lo stesso profilo piu'
       piccolo, ed e' quello che da' la lettura "meccanica" */
    const heroScaled = (k: number) => (a: number) => heroAt(a) * k;

    /* ── LA TRAMA ─────────────────────────────────────────────────────────── */
    if (mode === 'dark') {
      pathAt((a) => tramaAt(a) * fray(a), 360);
      if (paintedWith) {
        ctx.save(); ctx.clip();
        ctx.filter = 'grayscale(1) brightness(.22) contrast(1.25)';
        ctx.drawImage(paintedWith, CX - size / 2, CY - size / 2, size, size);
        ctx.filter = 'none';
        ctx.restore();
      } else {
        /* LA MATERIA, NON IL NERO. Il Director: «il nero dentro fa schifo» — e
           un gradiente radiale su due grigi E' nero piatto: nessuna delle sei
           condizioni dell'art bible (8-12 strati, ombre teal, imperfezioni
           organiche) era soddisfatta. Qui la trama e' impasto: base teal
           profonda, macchie a bassa frequenza, grana, e l'ombra interna sotto il
           bordo che le da' spessore. Nessun grigio e nessun marrone. */
        ctx.save();
        ctx.clip();
        /* L1 base: teal profonda, mai grigia */
        const dg = ctx.createRadialGradient(CX - 40 * K, CY - 50 * K, 8, CX, CY, R * K);
        dg.addColorStop(0, '#1b3a38');
        dg.addColorStop(0.55, '#12292b');
        dg.addColorStop(1, '#08181c');
        ctx.fillStyle = dg;
        ctx.fillRect(0, 0, size, size);
        /* L2 macchie d'impasto: sette pennellate larghe, deterministiche */
        for (let i = 0; i < 7; i += 1) {
          const a = (i / 7) * TAU + s0 * 6.3;
          const rr = R * K * (0.30 + 0.42 * ((i * 7919) % 100) / 100);
          const bx = CX + Math.cos(a) * rr * 0.55;
          const by = CY + Math.sin(a) * rr * 0.55;
          const bg2 = ctx.createRadialGradient(bx, by, 0, bx, by, rr * 0.62);
          bg2.addColorStop(0, i % 2 ? 'rgba(46,92,86,0.30)' : 'rgba(8,26,32,0.34)');
          bg2.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bg2;
          ctx.fillRect(0, 0, size, size);
        }
        /* L3 grana: trattini corti, densita' bassa, per togliere la piattezza */
        ctx.globalAlpha = 0.16;
        for (let i = 0; i < 260; i += 1) {
          const a = (i * 2.399963) % TAU;
          const rr = R * K * Math.sqrt(((i * 5791) % 1000) / 1000);
          const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
          ctx.strokeStyle = i % 3 ? 'rgba(120,170,164,0.5)' : 'rgba(4,14,18,0.6)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a + 1.2) * 3.4, y + Math.sin(a + 1.2) * 3.4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        /* L4 ombra interna sotto il bordo: e' cio' che le da' SPESSORE, e senza
           di essa la materia legge come una toppa piatta incollata sopra */
        const inner = ctx.createRadialGradient(CX, CY, R * K * 0.62, CX, CY, R * K);
        inner.addColorStop(0, 'rgba(0,0,0,0)');
        inner.addColorStop(1, 'rgba(2,10,14,0.75)');
        ctx.fillStyle = inner;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
      }
    } else {
      if (paintedWith) {
        pathAt((a) => tramaAt(a) * fray(a), 220);
        ctx.save(); ctx.clip();
        ctx.filter = 'grayscale(1) brightness(.30) contrast(1.3)';
        ctx.drawImage(paintedWith, CX - size / 2, CY - size / 2, size, size);
        ctx.filter = 'none';
        ctx.restore();
      }
      drawTrama(ctx, { cx: CX, cy: CY, rTrama: tramaAt, rCore: R_CORE * K * 0.75 },
        { ...TRAMA_DEFAULTS, seed });
    }

    /* ── FALLIMENTO CRITICO: il labbro interno del goo ─────────────────────
       Il Director: «il bordo rosso fa schifo». Era un anello a tinta piatta
       rgba(150,36,24) — un colore che non appartiene alla palette e una linea
       che non appartiene alla materia. Qui la banda non e' colorata: e' la
       STESSA materia piu' spessa e piu' bagnata, con la luce che le striscia
       sopra. Si legge perche' ha rilievo, non perche' e' rossa. */
    const fGoo = solveGooBand(snap, config.crit, 1440);
    ctx.save();
    pathAt(tramaAt, 360);
    ctx.clip();
    /* il corpo coagulato: piu' scuro e piu' saturo verso l'esterno */
    ctx.beginPath();
    ring(reachAt, 360);
    ring((a) => reachAt(a) * (1 - fGoo), 360);
    const lip = ctx.createRadialGradient(CX, CY, R * K * 0.5, CX, CY, R * K);
    lip.addColorStop(0, 'rgba(4,16,20,0.10)');
    lip.addColorStop(0.65, 'rgba(3,12,16,0.62)');
    lip.addColorStop(1, 'rgba(1,7,10,0.9)');
    ctx.fillStyle = lip;
    ctx.fill('evenodd');
    /* il colmo bagnato sul labbro interno: una riga di luce fredda, sottile,
       che segue la frangia — e' il rilievo a dire «qui la materia si alza» */
    /* IL SOLCO, appena dentro: e' l'ombra che fa alzare la cresta. Senza il
       solco la luce da sola legge come una linea disegnata, non come rilievo. */
    pathAt((a) => reachAt(a) * (1 - fGoo) * 0.975, 360);
    ctx.lineWidth = 5 * K;
    ctx.strokeStyle = 'rgba(1,8,11,0.85)';
    ctx.stroke();
    /* LA CRESTA BAGNATA: la banda deve essere «facilmente visibile» (Director),
       e ci arriva col rilievo invece che col colore — luce fredda sul colmo,
       che e' come si legge una materia gonfia e umida. */
    pathAt((a) => reachAt(a) * (1 - fGoo), 360);
    ctx.lineWidth = 2.6 * K;
    ctx.strokeStyle = 'rgba(168,232,224,0.85)';
    ctx.stroke();
    ctx.lineWidth = 1 * K;
    ctx.strokeStyle = 'rgba(240,255,252,0.9)';
    ctx.stroke();
    ctx.restore();

    /* ── LA STELLA, DODICI STRATI ─────────────────────────────────────────── */
    const rCore = solveCoreRadius(snap, config.critWin) * K * out;

    /* L1 faccia avorio-oro con il glow interno */
    pathAt(heroAt);
    const face = ctx.createRadialGradient(CX - 30 * K, CY - 46 * K, 6, CX, CY, rTipMax);
    face.addColorStop(0, '#ffffff');
    face.addColorStop(0.42, '#fdf8e9');
    face.addColorStop(1, '#ecd49a');
    ctx.save();
    /* LO SBORDO: la stessa materia, non illuminata. Con `face` al 18% di alpha
       il petalo fuori dalla trama diventava un cuneo GRIGIO — leggeva come
       sporco invece che come «talento che la prova non chiede». Un avorio
       spento sopra la propria ombra resta avorio. */
    if (ci > 0.5) {
      ctx.fillStyle = 'rgba(6,16,20,0.42)';
      ctx.fill();
      ctx.fillStyle = 'rgba(214,190,140,0.58)';
      ctx.fill();
    } else {
      ctx.globalAlpha = 1 - ci * 0.4;
      ctx.fillStyle = face;
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.clip();
    pathAt(tramaAt);
    ctx.fillStyle = face;
    ctx.fill();
    ctx.restore();

    /* L2 riflesso speculare che gira */
    ctx.save();
    pathAt(heroAt);
    ctx.clip();
    const ang = now / 2600;
    const sx = CX + Math.cos(ang) * 240 * K, sy = CY + Math.sin(ang) * 240 * K;
    const sh = ctx.createLinearGradient(CX - (sx - CX), CY - (sy - CY), sx, sy);
    sh.addColorStop(0.42, 'rgba(255,255,255,0)');
    sh.addColorStop(0.5, 'rgba(255,255,255,.35)');
    sh.addColorStop(0.58, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    /* L3 ALMOST — il bordo di bronzo FUORI dal profilo. Nella V6 era uno
       spessore fisso di 16px, che a difficolta' diverse valeva probabilita'
       diverse; qui e' risolto sull'area di tiro. */
    const [eAlmost] = solveOuterBands(snap, heroRaw, [config.almost], 1440);
    ctx.save();
    pathAt(tramaAt);
    ctx.clip();
    ctx.beginPath();
    ring((a) => Math.min(heroAt(a) * (1 + eAlmost), tramaAt(a)));
    ring(heroAt);
    /* bronzo con un colmo piu' chiaro all'esterno: la banda ha spessore invece
       di essere una campitura */
    const alm = ctx.createRadialGradient(CX, CY, 0, CX, CY, rTipMax);
    alm.addColorStop(0, 'rgba(74,32,6,0.72)');
    alm.addColorStop(1, 'rgba(126,66,18,0.72)');
    ctx.fillStyle = alm;
    ctx.fill('evenodd');
    ctx.restore();

    /* L4-L6 il bordo: bronzo scuro, gradiente oro, filo bianco */
    /* IL BORDO CORPOSO DELLA V6. La differenza che il Director notava sul
       fiore non era la geometria — misurata identica, scarto 0.0000 — era
       questo: in V6 il bordo e' una pila di stroke (16 + 4.5 + 2.4 + 0.8) e
       quella massa scura INGRASSA il petalo e stringe la valle. Con un solo
       stroke da 4.5 il petalo legge magro. */
    ctx.lineJoin = 'round';
    ctx.lineWidth = 9 * K;
    ctx.strokeStyle = 'rgba(96,44,8,0.55)';
    pathAt(heroAt);
    ctx.stroke();
    ctx.lineWidth = 4.5 * K;
    ctx.strokeStyle = '#602c08';
    ctx.stroke();
    ctx.lineWidth = 2.4 * K;
    const rim = ctx.createLinearGradient(CX - 120 * K, CY - 120 * K, CX + 120 * K, CY + 120 * K);
    rim.addColorStop(0, '#fce890');
    rim.addColorStop(0.5, '#a06a1e');
    rim.addColorStop(1, '#fce890');
    ctx.strokeStyle = rim;
    ctx.stroke();
    ctx.lineWidth = 0.8 * K;
    ctx.strokeStyle = 'rgba(255,248,215,.85)';
    ctx.stroke();

    /* L7-L9 contorni meccanici interni */
    [0.8, 0.62, 0.45].forEach((k, i) => {
      ctx.lineWidth = 1 * K;
      ctx.strokeStyle = `rgba(160,106,30,${0.32 - 0.07 * i})`;
      pathAt(heroScaled(k));
      ctx.stroke();
    });

    /* L10 anello del nucleo */
    ctx.lineWidth = 3 * K;
    ctx.strokeStyle = '#8a5a18';
    ctx.beginPath();
    ctx.arc(CX, CY, rCore, 0, TAU);
    ctx.stroke();

    /* L11 SUCCESSO CRITICO — bronzo brunito su oro, «the BIG WIN seat».
       Sempre presente e alla percentuale impostata: se la stella non lo
       contiene non e' un problema, per decisione del Director. */
    const core = ctx.createRadialGradient(CX - 8 * K, CY - 10 * K, 2, CX, CY, rCore);
    core.addColorStop(0, '#f7e1ad');
    core.addColorStop(0.55, '#cf9d4a');
    core.addColorStop(1, '#7d4d12');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(CX, CY, Math.max(0, rCore - 2 * K), 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, Math.max(0, rCore - 2 * K), 0, TAU);
    ctx.clip();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 9; i += 1) {
      ctx.strokeStyle = i % 2 ? 'rgba(255,240,200,.5)' : 'rgba(96,44,8,.5)';
      ctx.lineWidth = 0.7 * K;
      const from = t * 0.3 * (i % 2 ? 1 : -1);
      ctx.beginPath();
      ctx.arc(CX, CY, ((rCore - 3 * K) * (i + 1)) / 10, from, from + TAU * 0.8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    /* L12 scintilla interna pulsante */
    ctx.lineWidth = 1.2 * K;
    ctx.strokeStyle = `rgba(255,238,188,${0.55 + 0.3 * Math.sin(t * 2.4)})`;
    ctx.beginPath();
    ctx.arc(CX, CY, rCore * 0.55, 0, TAU);
    ctx.stroke();
  }, [snap, size, seed, narrow, clipIn, outbound, mode, paintedWith, config, now, K]);

  return <canvas ref={cv} width={size} height={size} style={{ borderRadius: 6, display: 'block' }} />;
}

export default SkillCheckBoardV16;
