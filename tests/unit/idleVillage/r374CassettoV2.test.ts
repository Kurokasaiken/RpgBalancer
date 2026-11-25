/**
 * R-374 — HudRealCassetto V2 (aesthetic audit fixes).
 * V1 (`HudRealCassetto.tsx`) is a FROZEN baseline (hud_real_cassetto_trusted.md); V2 carries the audit fixes.
 * Source guards: the V2 module must keep the fix invariants, the drawer must mount V2, V1 must keep exporting
 * the frozen component.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const V2 = readFileSync(join(process.cwd(), 'src/ui/idleVillage/hudReal/HudRealCassettoV2.tsx'), 'utf8');
const V1 = readFileSync(join(process.cwd(), 'src/ui/idleVillage/hudReal/HudRealCassetto.tsx'), 'utf8');
const DRAWER = readFileSync(join(process.cwd(), 'src/ui/idleVillage/components/gameFrame/ExpeditionDrawer.tsx'), 'utf8');

describe('R-374 cassetto V2 — freeze & mount', () => {
  // INV:cassetto-v2-mounted — the mounted surface is V2; V1 stays frozen and importable.
  it('ExpeditionDrawer mounts HudRealCassettoV2 (not V1)', () => {
    expect(DRAWER).toContain("from '@/ui/idleVillage/hudReal/HudRealCassettoV2'");
    expect(DRAWER).toContain('<HudRealCassettoV2');
    expect(DRAWER).not.toContain('<HudRealCassetto ');
  });
  it('V1 stays a frozen baseline: still exports HudRealCassetto', () => {
    expect(V1).toContain('export const HudRealCassetto');
  });
});

describe('R-374 cassetto V2 — audit fixes', () => {
  // INV:cassetto-v2-cta-panel-centre — CTA centres on the perceived enamel card (u560), the axis the centred
  // content shares. Re-axed by OB-7 app-2 (Director 2026-11-21): the u530 axis read left-shifted.
  it('CTA centres on the perceived enamel card centre (CTA_CENTER_U = 560)', () => {
    expect(V2).toContain('CTA_CENTER_U = 560');
    expect(V2).not.toContain('CTA_CENTER_U = 530');
    expect(V2).not.toContain('CTA_CENTER_U = 541');
  });

  // INV:cassetto-v2-well-clearance — well contents clear the painted frame band AND inner frames clear the outer one.
  // OB-7 app-2: the shared axis shifts right — padL 148 u (~47 u clear of the rail edge ~101 u), padR 52 u.
  it('well contents clear the painted frame band', () => {
    expect(V2).toContain('padding: `${u(PARTY_PAD_T_U)} ${u(PARTY_PAD_X_U)} ${u(PARTY_PAD_B_U)}`'); /* party rack — pads clear the frame edges (R-378 cont.) */
    expect(V2).toContain('padding: `${u(40)} ${u(28)} ${u(34)}`'); /* bag niches */
    expect(V2).toContain('padding: `${u(44)} 0 ${u(30)}`'); /* journey strip */
    expect(V2).toContain('const PAD_L_U = 148'); /* inner frames clear of the rail (edge ~101 u) */
    expect(V2).toContain('const PAD_R_U = 52'); /* …and of the right rim — content centred on u560 */
    expect(V2).toContain('paddingLeft: u(PAD_L_U)');
    expect(V2).toContain('paddingRight: u(PAD_R_U)');
  });

  // INV:cassetto-v2-frame-grammar — risk/reward wells use the same paintedBoxFrame grammar as the other wells.
  // INV:cassetto-art-no-stray-rules — the painted grammar itself removes the stray hand-drawn rules in the wells.
  it('risk/reward wells use the shared painted frame (no hand-drawn border override)', () => {
    expect(V2).not.toContain("borderImage: 'none'");
    expect(V2).not.toContain('borderRadius: u(44)');
  });

  // INV:cassetto-v2-cqw-geometry — no fixed-px grid geometry or `zoom` inside the cqw column.
  // Seat width re-tuned OB-7 app-7 (Director: «le proporzioni vanno ritoccate») — 230 → 205 u;
  // R-378 (Director 2026-11-24 «slot pg troppo grandi, toccano il frame») — 205 → 170 u;
  // R-378 cont. (Director 2026-11-24 «proporzione automatica») — the seat column is DERIVED from
  // the well interior (PARTY_SEAT_U), no hand-tuned literal.
  it('party rack scales in cqw (no fixed-px columns, no zoom)', () => {
    expect(V2).not.toContain('zoom:');
    expect(V2).not.toMatch(/grid-auto-columns:\s*\d+px/);
    expect(V2).toContain('grid-auto-columns: ${u(PARTY_SEAT_U)}');
    expect(V2).toContain('width: u(51)'); /* journey icons scale too */
  });

  // INV:cassetto-v2-seats-autofit — R-378 cont. (Director 2026-11-24 «gli slot dei pg continuano ad
  // essere troppo grandi e ad entrare in contatto con il frame … proporzione automatica … troppo
  // vicini tra loro … troppo spazio libero ai lati»): the party rack is auto-proportioned — the
  // scroller window fits the seats present (capped by the well interior), the seat column derives
  // from that interior, the gap is a real gap, the fixed-64px hud64 visual is scaled to a `u()` size
  // (--cassetto-seat-scale, transform — never zoom), and the rack padding clears the painted frame's
  // drawn edges (x u55 / y u44 + breath).
  it('party seats are auto-proportioned: derived seat, real gap, scaled visual, frame clearance', () => {
    expect(V2).toContain('PARTY_SEAT_U');
    expect(V2).toMatch(/PARTY_INTERIOR_U\s*=\s*CONTENT_W_U\s*-\s*2\s*\*\s*PARTY_PAD_X_U/);
    expect(V2).toContain('slots.length * PARTY_SEAT_U'); /* window fits the seats present */
    expect(V2).toContain('PARTY_PEEK_U : 0'); /* peek only when a seat overflows */
    expect(V2).toContain('gap: ${u(PARTY_GAP_U)}');
    expect(V2).toContain('--cassetto-seat-scale'); /* the 64px-fixed hud64 visual scales with the column */
    expect(V2).toContain('transform: scale(var(--cassetto-seat-scale');
    expect(V2).toContain('${u(PARTY_PAD_T_U)} ${u(PARTY_PAD_X_U)} ${u(PARTY_PAD_B_U)}'); /* rack clears the frame band */
  });

  // INV:cassetto-v2-seats-autofit — rev3-cont. (Director 2026-11-24 «il primo componente sembra mai
  // completamente mostrato, usa + spazio laterale x i componenti slot pg, e fa in modo che inizialmente
  // il primo a sinistra sia sempre completamente visibile»): the edge fade follows the scroll position —
  // at rest the leftmost seat paints fully; the left fade appears only once real overflow exists on that
  // side. The static double-fade on the party row is gone; the lateral breath shrank (x 30→12 u).
  it('first party seat is always fully visible: scroll-aware edge fade (no static left fade)', () => {
    expect(V2).toContain('autoFade');
    expect(V2).toContain('scrollLeft'); /* mask reads the real scroll position */
    expect(V2).toContain("'#000 0%'"); /* at rest: opaque from the left edge — first seat complete */
    expect(V2).not.toContain("maskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)'"); /* static double fade removed from the party row */
    expect(V2).toMatch(/PARTY_BREATH_U\s*=\s*\{\s*x:\s*12/); /* more lateral space for the seats */
  });

  // INV:cassetto-v2-reward-visible — OB-7 app-5 (Director 2026-11-21): no RISK/REWARD labels, % ON TOP of the
  // lit/dimmed emblem scale; the CONCRETE reward visible under the victory %. Amended R-378 (Director
  // 2026-11-24 «elimina i 5 forzieri speculari ai 5 teschi»): the chest scale is gone — skulls stay.
  it('risk/reward wells: no labels, % on top, skull scale only + visible reward chips', () => {
    expect(V2).not.toContain('data-testid="cassetto-risk-label"');
    expect(V2).not.toContain('data-testid="cassetto-reward-label"');
    expect(V2).toContain('testId="cassetto-risk-value"'); /* skulls stay */
    expect(V2).not.toContain('cassetto-reward-value');
    expect(V2).not.toContain('data-chest');
    expect(V2).toContain('data-testid="cassetto-reward-items"');
    const quest = V2.slice(V2.indexOf('interface CassettoQuest'), V2.indexOf('export interface CassettoLoadoutSlot'));
    expect(quest).toContain('rewardLevel');
  });

  // INV:cassetto-v2-reward-visible — R-378 rev2 (Director 2026-11-24 «la percentuale di vittoria falla
  // verde (solo i numeri)»): the success readout uses the emerald `success` tone, not gold.
  it('victory % readout is green (numbers only)', () => {
    expect(V2).toContain('pct={quest.successPct} tone="success"');
    expect(V2).toContain("success: '#5fd98d'");
    expect(V2).toContain("tone === 'success' ? C.success");
  });

  // INV:cassetto-v2-cta-jewels — R-378 (Director 2026-11-24): when `canSend` the plaque's jewels pulse —
  // the «now clickable» affordance; disabled mounts nothing.
  it('CTA jewels mount only when canSend (lit = clickable affordance)', () => {
    expect(V2).toContain('data-testid="cassetto-cta-jewels"');
    expect(V2).toMatch(/canSend && \(/);
    expect(V2).toContain('cta-jewel');
    expect(V2).toContain('cassettoJewelPulse');
  });

  // INV:cassetto-v2-journey-glyphs — R-378 rev3 (Director 2026-11-24 «le icone del viaggio sono brutte»):
  // the three journey legs carry PAINTED engraved-gold glyphs matching the mockup's material — compass
  // rose (outbound), crossed swords (at site), chasing arrows (return) — emitted by the cassetto slice
  // spec from the Gemini sheet .mw/specs/expedition-ui/refs/icon-journey-glyphs.png. The flat hand-drawn
  // SVG glyph set is gone from the journey strip.
  it('journey legs use the painted engraved-gold glyphs (slice assets, not flat SVG)', () => {
    expect(V2).toContain("'journey-ico-outbound.webp'");
    expect(V2).toContain("'journey-ico-atsite.webp'");
    expect(V2).toContain("'journey-ico-return.webp'");
    expect(V2).not.toMatch(/'ico-(compass|swords|cycle|target|dot)'/); /* no flat engravedIcons glyph ids */
    expect(V2).not.toContain('EngravedIcon'); /* SVG glyph component removed from this surface */
  });

  // INV:cassetto-v2-overflow-fade — the party scroller fades at the edges instead of hard-clipping the 4th seat.
  it('party scroller has an edge fade mask', () => {
    expect(V2).toContain('maskImage');
  });

  // INV:cassetto-v2-object-glyphs — Director rev2: the empty niche keeps the «+» affordance (pouch glyph reverted).
  it('empty bag niche paints «+», not a pouch glyph', () => {
    expect(V2).toContain('>+</span>');
    expect(V2).not.toContain('ico-pouch');
  });

  // INV:cassetto-v2-no-dead-api — `subtitle` was never rendered; removed from the V2 contract.
  it('CassettoQuest has no dead subtitle field', () => {
    const quest = V2.slice(V2.indexOf('interface CassettoQuest'), V2.indexOf('export interface CassettoLoadoutSlot'));
    expect(quest).not.toContain('subtitle');
  });
});

describe('R-378 rev4/rev5/rev6 — fork rulings Director 2026-11-25', () => {
  // INV:cassetto-v2-disabled-cursor — rev4: the hover itself says the plaque is not clickable («il divieto d'accesso grigio»).
  it('disabled CTA carries the not-allowed cursor', () => {
    expect(V2).toContain("cursor: canSend ? 'pointer' : 'not-allowed'");
    expect(V2).not.toContain("cursor: canSend ? 'pointer' : 'default'");
  });

  // INV:cassetto-v2-well-velluto — rev6: wells are recipe C «velluto + vignettatura» (chosen on the zoom fork;
  // marble-veiled rejected «troppo nero», flat superseded). Radial top glow + bottom vignette, no new art.
  it('wells use the velvet+vignette recipe (radial layers, flat linear-only superseded)', () => {
    expect(V2).toContain('radial-gradient(ellipse 120% 90% at 50% 0%');
    expect(V2).toContain('radial-gradient(ellipse 140% 120% at 50% 115%');
  });

  // INV:cassetto-v2-captions-floor-12 — rev5 «anche + grande»: the legibility floor is 12px (was 11 —
  // at 1280×800 half the captions sat exactly at the floor, measured 2026-11-25).
  it('captions floor is 12px and small captions are salient gold', () => {
    expect(V2).toContain('CASSETTO_MIN_LABEL_PX = 12');
    expect(V2).not.toContain('CASSETTO_MIN_LABEL_PX = 11');
    // «oro + saliente»: journey days + total leave the muted champagne for full gold ink at weight 600
    expect(V2).toContain("fontSize: fzMin(24), fontWeight: 600, letterSpacing: '0.06em', color: C.goldInk");
    expect(V2).toContain("fontSize: fzMin(26), fontWeight: 600, letterSpacing: '0.12em'");
    // seat labels carry the weight too (scoped rack override)
    expect(V2).toContain('font-weight: 600 !important');
  });
});
