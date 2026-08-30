/**
 * PLAN-010 CP-E — la legge della colata.
 *
 * Qui si testa la FORMA DELLA CURVA, che e' matematica pura e quindi verificabile
 * senza browser. Il comportamento del bordo simulato (overshoot, assestamento) vive
 * nel motore e si misura nel banco `window.__ASTROLABE_V63__`; i numeri di quella
 * misura stanno nel piano.
 *
 * Il criterio non e' il valore di un parametro ma il **comportamento osservabile**:
 * il fronte non deve accelerare. Due curve in fila lo decidono — `tarPour` a monte
 * e `poolFraction` a valle — e per un giro ho corretto solo la prima, lasciando che
 * la seconda riaccelerasse tutto. Questo file guarda la COMPOSIZIONE, che e' quella
 * che il giocatore vede.
 */
import { describe, expect, it } from 'vitest';
import { tarGooConfig } from '@/balancing/config/idleVillage/tarGooConfig';
import { poolFraction } from '@/ui/idleVillage/components/destinyAstrolabeV63/tentacles';

/** la curva di monte, come nel motore */
const tarPour = (t: number) =>
  tarGooConfig.timing.seedReveal +
  (1 - tarGooConfig.timing.seedReveal) *
    Math.pow(Math.max(0, Math.min(1, t)), tarGooConfig.v63.pourExponent);

/** cio' che il fronte segue davvero: le due curve in fila */
const front = (t: number) => poolFraction(tarPour(t));

const SAMPLES = 400;
const curve = Array.from({ length: SAMPLES + 1 }, (_, i) => front(i / SAMPLES));

describe('PLAN-010 CP-E — legge della colata', () => {
  it('il fronte non torna mai indietro', () => {
    for (let i = 1; i < curve.length; i += 1) {
      expect(curve[i], `campione ${i}`).toBeGreaterThanOrEqual(curve[i - 1] - 1e-9);
    }
  });

  it('parte dalla pozza seminata e arriva a uno', () => {
    /* non da zero: una pozza piccola c'e' gia' quando la colata comincia */
    expect(curve[0]).toBeGreaterThan(0);
    expect(curve[0]).toBeLessThan(0.15);
    expect(curve[curve.length - 1]).toBeCloseTo(1, 3);
  });

  /**
   * Il cuore di CP-E. La smoothstep che stava a valle aveva derivata `6t(1-t)`:
   * massima a META' della corsa. Misurato sul fronte simulato, prima della
   * correzione: velocita' per quarto `[0.93, 0.89, 3.09, 3.85]` — accelerava.
   * Dopo: `[2.20, 2.65, 0.69, 0.09]`.
   *
   * Si guarda dopo il primo quinto perche' la massa parte da ferma e un breve
   * tratto di accelerazione iniziale e' fisico, non un difetto.
   */
  it('dopo l\'avvio la velocita non risale mai', () => {
    const vel: number[] = [];
    for (let i = 1; i < curve.length; i += 1) vel.push(curve[i] - curve[i - 1]);
    const dopoAvvio = vel.slice(Math.floor(vel.length / 5));
    const picco = Math.max(...dopoAvvio);
    const primo = dopoAvvio[0];
    expect(picco, 'la velocita risale dopo l\'avvio').toBeLessThanOrEqual(primo + 1e-6);
  });

  /**
   * Quanto rallenta non e' una soglia di gusto: la decide l'esponente. Per
   * `r = t^p` la velocita' media dell'ultimo quarto sull'primo vale
   * `(1 - 0.75^p) / (0.25^p)`. Con p = 1/2 fa 3.7x.
   *
   * La prima versione di questo test chiedeva «almeno un ordine di grandezza»,
   * numero che non derivava da niente e che la legge non poteva soddisfare.
   * Legarlo alla legge lo rende una verifica invece che un'opinione: se un giorno
   * qualcuno cambia l'esponente in config, il rapporto atteso lo segue.
   */
  it('rallenta esattamente di quanto l\'esponente prescrive', () => {
    const p = tarGooConfig.v63.pourExponent;
    const atteso = (1 - Math.pow(0.75, p)) / Math.pow(0.25, p);
    const vel: number[] = [];
    for (let i = 1; i < curve.length; i += 1) vel.push(curve[i] - curve[i - 1]);
    const q = Math.max(1, Math.floor(vel.length / 4));
    const primoQuarto = vel.slice(0, q).reduce((a, b) => a + b, 0) / q;
    const ultimoQuarto = vel.slice(-q).reduce((a, b) => a + b, 0) / q;
    expect(ultimoQuarto / primoQuarto).toBeCloseTo(atteso, 1);
    // e comunque deve rallentare di parecchio
    expect(ultimoQuarto).toBeLessThan(primoQuarto / 3);
  });

  /**
   * Vincolo STRUTTURALE, non di comportamento: il bordo dev'essere almeno
   * criticamente smorzato, o oscilla attorno al muro invece di fermarcisi.
   * `zeta = (1 - damping) / (2*sqrt(stiffness))`. Col valore condiviso della V6.2
   * vale 0.061 — gravemente sottosmorzato, e il bordo scavallava a 267px con il
   * muro a 205.
   */
  it('il bordo e almeno criticamente smorzato', () => {
    const { damping, stiffness } = tarGooConfig.v63;
    const zeta = (1 - damping) / (2 * Math.sqrt(stiffness));
    expect(zeta).toBeGreaterThanOrEqual(1);
  });

  it('la V6.2 non e stata toccata: la sua curva resta la smoothstep', async () => {
    const v62 = await import('@/ui/idleVillage/components/destinyAstrolabeV62/tentacles');
    /* la smoothstep di V6.2 vale esattamente 0.5 a meta' della sua finestra */
    expect(v62.poolFraction(0.76)).toBeCloseTo(0.5, 2);
  });
});
