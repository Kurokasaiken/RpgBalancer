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
    expect(V2).toContain('padding: `${u(40)} 0 ${u(30)}`'); /* party rack */
    expect(V2).toContain('padding: `${u(40)} ${u(28)} ${u(34)}`'); /* bag niches */
    expect(V2).toContain('padding: `${u(44)} 0 ${u(30)}`'); /* journey strip */
    expect(V2).toContain('paddingLeft: u(148)'); /* inner frames clear of the rail (edge ~101 u) */
    expect(V2).toContain('paddingRight: u(52)'); /* …and of the right rim — content centred on u560 */
  });

  // INV:cassetto-v2-frame-grammar — risk/reward wells use the same paintedBoxFrame grammar as the other wells.
  // INV:cassetto-art-no-stray-rules — the painted grammar itself removes the stray hand-drawn rules in the wells.
  it('risk/reward wells use the shared painted frame (no hand-drawn border override)', () => {
    expect(V2).not.toContain("borderImage: 'none'");
    expect(V2).not.toContain('borderRadius: u(44)');
  });

  // INV:cassetto-v2-cqw-geometry — no fixed-px grid geometry or `zoom` inside the cqw column.
  // Seat width re-tuned OB-7 app-7 (Director: «le proporzioni vanno ritoccate») — 230 → 205 u;
  // R-378 (Director 2026-11-24 «slot pg troppo grandi, toccano il frame») — 205 → 170 u.
  it('party rack scales in cqw (no fixed-px columns, no zoom)', () => {
    expect(V2).not.toContain('zoom:');
    expect(V2).not.toMatch(/grid-auto-columns:\s*\d+px/);
    expect(V2).toContain('grid-auto-columns: ${u(170)}');
    expect(V2).toContain('size={u(52)}'); /* journey icons scale too */
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

  // INV:cassetto-v2-journey-glyphs — R-378 rev2 (Director 2026-11-24 «i glifi dei villaggi nn vanno bene,
  // guarda cm era il mockup»): the three journey legs carry the mockup's glyphs — compass rose (outbound),
  // crossed swords (at site), chasing arrows (return) — not the old target/axe/gust set.
  it('journey legs use the mockup engraved glyphs', () => {
    expect(V2).toContain("'ico-compass'");
    expect(V2).toContain("'ico-swords'");
    expect(V2).toContain("'ico-cycle'");
    expect(V2).not.toMatch(/LEG_ICONS[^;]*ico-target/);
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
