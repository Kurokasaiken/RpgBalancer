/**
 * HUD critique run `.mw/runs/20261124-hud-critique-multi-ai` (Director «procedi»):
 * permanent regression guards for the legibility fixes.
 *
 * 1. Speed radiogroup (`HudRealTime`): the engaged speed wears a thick brass
 *    ring + warm halo (variant J, no fill); while paused the selected speed
 *    keeps only the armed ring and the pause button wears the same J marking.
 * 2. Slim resource chip (`HudRealResources compact`): the sub-floor label line is
 *    not painted — the name stays in the chip's aria-label — so the value reads
 *    bigger; the danger hourglass sits by the value.
 * 3. Corner cluster (`skinScope.css [data-hud-corner]`): dark keyline outside
 *    the brass ring; a shared enamel capsule sits behind the three discs (C2)
 *    and the cluster runs at 78% brightness — second-level chrome (H2).
 * 4. Narrator bust (`HudRealVoce`, pick B2): gold drop-shadow on the painted
 *    silhouette + brass ↻ chip while a dismissed message can be reopened; the
 *    bust is dimmed with the corner cluster, the live plaque is not.
 * 5. Nav dock (`gameHudPlacement`, pick ≈75%): the dock renders at
 *    NAV_ART_PROPORTION of its fit scale so its height stays in the top bars'
 *    family — centre and bottom anchor unchanged.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import { HudRealTime } from '@/ui/idleVillage/hudReal/HudRealTime';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { HudRealVoce } from '@/ui/idleVillage/hudReal/HudRealVoce';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';
import { RESOURCES_SLIM_BAR } from '@/ui/idleVillage/hudReal/resourcesSlimGeometry';
import { GAME_HUD_BARS, placeHudBlueprint } from '@/ui/idleVillage/hudReal/layout/gameHudPlacement';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';

const LABELS = { pause: 'Pause', resume: 'Resume', speedGroup: 'Speed', speed: (s: number) => `x${s}`, spaceKey: 'Space', paused: 'Paused' };

const renderTime = (multiplier: number, isPaused: boolean) =>
  render(
    <HudRealTime
      dayLabel="Day 1"
      isDayPhase
      cycleProgress={0.5}
      isPaused={isPaused}
      locked={false}
      speed={{ multiplier, available: [1, 2, 4], onChange: () => {}, onTogglePause: () => {} }}
      labels={LABELS}
      bar={TIME_SLIM_BAR}
      asset="/assets/ui/hud-real/time/bar-slim.webp"
    />,
  );

describe('speed radiogroup — filled seat, armed ring, dim idle', () => {
  it('the engaged speed wears a thick brass ring with halo (J, no fill)', () => {
    const { container } = renderTime(2, false);
    const on = container.querySelector('[data-hr-time="x2"]') as HTMLElement;
    expect(on.style.background).not.toContain('radial-gradient');
    expect(on.style.boxShadow).toContain('#b8933f');
    expect(on.style.color).toBe('rgb(246, 227, 164)');
    const idle = container.querySelector('[data-hr-time="x4"]') as HTMLElement;
    expect(idle.style.background).not.toContain('radial-gradient');
    expect(idle.style.color).toBe('rgb(205, 191, 142)');
  });

  it('mounts pause/speed controls on the shared Events round socket (PLAN-136)', () => {
    const { container } = renderTime(2, false);
    for (const selector of ['[data-hr-time="pause"]', '[data-hr-time="x1"]', '[data-hr-time="x2"]', '[data-hr-time="x4"]']) {
      const el = container.querySelector(selector) as HTMLElement;
      expect(el).toHaveAttribute('data-ctl', 'round');
      expect(el.style.backgroundImage).toContain('round-socket-normal.webp');
    }
  });

  it('paused: the selected speed keeps only the armed ring (no fill)', () => {
    const { container } = renderTime(2, true);
    const armed = container.querySelector('[data-hr-time="x2"]') as HTMLElement;
    expect(armed.style.background).not.toContain('radial-gradient');
    expect(armed.style.boxShadow).toContain('0 0 0 2px');
    expect(armed.style.color).toBe('rgb(241, 216, 138)');
    const idle = container.querySelector('[data-hr-time="x4"]') as HTMLElement;
    expect(idle.style.color).toBe('rgb(205, 191, 142)');
  });

  it('paused: the pause button wears the same thick brass ring + halo (J)', () => {
    const { container } = renderTime(2, true);
    const pause = container.querySelector('[data-hr-time="pause"]') as HTMLElement;
    expect(pause.style.boxShadow).toContain('#b8933f');
    expect(pause.style.color).toBe('rgb(246, 227, 164)');
  });
});

describe('slim resource chip — label unpainted, value bigger', () => {
  const ITEMS: ResourceReadoutItem[] = [
    { id: 'gold', icon: <span data-icon="gold" />, label: 'Gold', value: 15 },
    { id: 'food', icon: <span data-icon="food" />, label: 'Food', value: 0, max: 20, tone: 'danger' },
    { id: 'wood', icon: <span data-icon="wood" />, label: 'Wood', value: 0 },
  ];
  const renderRes = (compact: boolean) =>
    render(
      <TooltipProvider>
        <HudRealResources items={ITEMS} bar={RESOURCES_SLIM_BAR} asset="/assets/ui/hud-real/resources/bar-slim.webp" compact={compact} centerContent />
      </TooltipProvider>,
    );

  it('compact: no label line, but the name stays in the aria-label', () => {
    const { container } = renderRes(true);
    const chip = container.querySelector('[data-hr-res="gold"]') as HTMLElement;
    expect(chip.getAttribute('aria-label')).toContain('Gold');
    expect(chip.textContent).not.toContain('Gold');
    expect(chip.textContent).toContain('15');
  });

  it('non-compact still paints the label line', () => {
    const { container } = renderRes(false);
    const chip = container.querySelector('[data-hr-res="gold"]') as HTMLElement;
    expect(chip.textContent).toContain('Gold');
  });

  it('compact + danger: the hourglass sits by the value', () => {
    const { container } = renderRes(true);
    const chip = container.querySelector('[data-hr-res="food"]') as HTMLElement;
    expect(chip.querySelector('svg')).toBeInTheDocument();
    expect(chip.textContent).toContain('0');
    expect(chip.textContent).toContain('/20');
  });
});

describe('corner cluster — keyline, shared capsule, second-level dim', () => {
  const skin = () =>
    fs
      .readFileSync(path.resolve(__dirname, '../../../src/ui/idleVillage/skins/skinScope.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');

  it('the corner rule adds an outer lacquer keyline + brass halo', () => {
    const m = /\.skin-scope \[data-hud-corner\][^{]*hud-menu-trigger[^{]*\{([^}]*)\}/.exec(skin());
    expect(m, 'corner button rule').toBeTruthy();
    expect(m![1]).toContain('0 0 0 2.5px var(--skin-hud-lacquer-deep)');
  });

  /* [data-hud-corner] is deliberately outside .skin-scope on /game (R-336) — the
   * capsule and the dim are painted on the cluster element in game-mappa2. */
  const page = () => fs.readFileSync(path.resolve(__dirname, '../../../src/pages/game-mappa2.tsx'), 'utf8');

  it('C2: a shared enamel pill sits behind the three discs', () => {
    const src = page();
    expect(src).toContain("borderRadius: 999");
    expect(src).toContain("zIndex: -1");
    expect(src).toContain("#12524b");
  });

  it('H2: the corner cluster runs at 78% brightness', () => {
    const corner = /data-hud-corner[^/]*?filter:\s*'brightness\(\.78\)'/.exec(page());
    expect(corner, 'corner cluster dim').toBeTruthy();
  });
});

describe('narrator bust — gold halo, reopen chip, dimmed with the corner (B2+H2)', () => {
  const renderVoce = () =>
    render(
      <HudRealVoce
        title="Cronaca"
        messageKey="m1"
        labels={{ expand: 'Espandi', collapse: 'Riduci', dismiss: 'Chiudi', bust: 'Voce' }}
      >Messaggio della voce</HudRealVoce>,
    );

  it('the bust runs dimmed (H2) and its silhouette wears the gold drop-shadow (B2)', () => {
    const { container } = renderVoce();
    const bust = container.querySelector('[data-hr-voce-bust]') as HTMLElement;
    expect(bust.style.filter).toBe('brightness(.78)');
    expect((bust.querySelector('img') as HTMLElement).style.filter).toContain('drop-shadow');
  });

  it('the brass ↻ chip exists and only shows while a message can be reopened', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/idleVillage/hudReal/HudRealVoce.tsx'), 'utf8');
    expect(src).toContain('↻');
    expect(src).toContain('!plaqueOpen && displayed.children != null');
  });
});

describe('nav dock — proportioned to the top bars (≈75%)', () => {
  it('the dock renders at NAV_ART_PROPORTION of its fit scale, centred and bottom-anchored', () => {
    for (const [w, h] of [[1024, 768], [1440, 900], [1920, 1080]] as const) {
      const p = placeHudBlueprint(w, h, 1);
      const navH = GAME_HUD_BARS.nav.h * p.nav.scale;
      expect(navH).toBeLessThanOrEqual(GAME_HUD_BARS.nav.h * 0.8); // ~75% of the old full fit — top bars' family, not twice their height
      const cx = p.nav.left + (GAME_HUD_BARS.nav.w * p.nav.scale) / 2;
      expect(cx).toBeGreaterThan(w * 0.4);
      expect(cx).toBeLessThan(w * 0.6); // still page-centred
      expect(p.nav.top + GAME_HUD_BARS.nav.h * p.nav.scale).toBeCloseTo(h - 6, 1); // bottom anchor kept
    }
  });
});
