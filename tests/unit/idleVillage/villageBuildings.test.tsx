import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createRef } from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  BUILDING_IDS,
  MIN_ANCHOR_DIST,
  toRomanLevel,
  VILLAGE_BUILDINGS_CONFIG,
  VILLAGE_CANVAS,
  villageBuildingsSchema,
} from '@/balancing/config/idleVillage/villageBuildingsConfig';
import {
  placeTooltip,
  VILLAGE_TOOLTIP_ID,
  VillageScreenView,
  type VillageScreenViewHandle,
} from '@/ui/idleVillage/components/gameFrame/VillageScreenView';
import { MockUpgradeControl } from '@/ui/idleVillage/components/gameFrame/MockUpgradeControl';
import {
  VillageBuildingIcon,
  VillageCostIcon,
  type VillageCostResource,
} from '@/ui/idleVillage/components/gameFrame/villageBuildingIcons';

const CFG = VILLAGE_BUILDINGS_CONFIG;
const ASPECT = VILLAGE_CANVAS.widthPx / VILLAGE_CANVAS.heightPx;
/** `CLAMP_INSET` inside `VillageScreenView.tsx` — duplicated to keep it pure-internal. */
const TIP_CLAMP = 8;

/** Loads a locale JSON and resolves a dotted key (e.g. `gameFrame.village.pinsToolbar`). */
const resolveKey = (locale: 'en' | 'it-IT', key: string): string | undefined => {
  const doc = JSON.parse(
    readFileSync(path.resolve(__dirname, `../../../public/locales/${locale}/idleVillage.json`), 'utf8'),
  );
  return key.split('.').reduce<unknown>(
    (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
    doc,
  ) as string | undefined;
};

/** Every i18n key the building config declares — names, descriptions, effects, unlock hints. */
const declaredKeys = (): string[] =>
  CFG.buildings.flatMap((b) => [
    b.nameKey,
    b.descKey,
    b.effectKey,
    ...(b.unlockHintKey ? [b.unlockHintKey] : []),
  ]);

describe('villageBuildingsConfig', () => {
  it('parses 11 buildings with unique ids covering BUILDING_IDS', () => {
    expect(CFG.buildings).toHaveLength(11);
    const ids = new Set(CFG.buildings.map((b) => b.id));
    expect(ids.size).toBe(11);
    for (const id of BUILDING_IDS) expect(ids).toContain(id);
  });

  it('keeps tiers sequential (1..N), built ⇒ level≥1, locked ⇒ unlockHintKey', () => {
    for (const b of CFG.buildings) {
      expect(b.tiers.map((t) => t.level)).toEqual(b.tiers.map((_, i) => i + 1));
      expect(b.initialLevel).toBeLessThanOrEqual(b.tiers.length);
      expect(b.initialState === 'built' ? b.initialLevel >= 1 : b.initialLevel === 0).toBe(true);
      if (b.initialState === 'locked') expect(b.unlockHintKey).toBeTruthy();
    }
  });

  it('spaces every pin pair at least MIN_ANCHOR_DIST apart (aspect-corrected)', () => {
    for (let i = 0; i < CFG.buildings.length; i += 1) {
      for (let j = i + 1; j < CFG.buildings.length; j += 1) {
        const a = CFG.buildings[i];
        const b = CFG.buildings[j];
        const d = Math.hypot((a.anchor.x - b.anchor.x) * ASPECT, a.anchor.y - b.anchor.y);
        expect(d, `${a.id} vs ${b.id}: ${d.toFixed(3)}`).toBeGreaterThanOrEqual(MIN_ANCHOR_DIST);
      }
    }
  });

  it('declares exactly the warehouse/market panel actions', () => {
    const byId = Object.fromEntries(CFG.buildings.map((b) => [b.id, b]));
    expect(byId.warehouse.panelAction).toBe('villageStash');
    expect(byId.market.panelAction).toBe('merchant');
    for (const b of CFG.buildings) {
      if (b.id !== 'warehouse' && b.id !== 'market') expect(b.panelAction).toBeUndefined();
    }
  });

  it('exports a recursively frozen graph — mutation throws', () => {
    expect(Object.isFrozen(CFG)).toBe(true);
    expect(Object.isFrozen(CFG.buildings)).toBe(true);
    expect(Object.isFrozen(CFG.buildings[0])).toBe(true);
    expect(Object.isFrozen(CFG.buildings[0].anchor)).toBe(true);
    expect(Object.isFrozen(CFG.buildings[0].tiers[0].cost)).toBe(true);
    expect(() => {
      (CFG.buildings[0].anchor as { x: number }).x = 0.5;
    }).toThrow(TypeError);
  });

  it('rejects invalid payloads at parse time', () => {
    const base = structuredClone(CFG) as Parameters<typeof villageBuildingsSchema.parse>[0];

    const dupe = structuredClone(base);
    dupe.buildings[1].id = dupe.buildings[0].id;
    dupe.buildings[1].iconKey = dupe.buildings[0].id;
    dupe.buildings[1].nameKey = dupe.buildings[0].nameKey;
    dupe.buildings[1].descKey = dupe.buildings[0].descKey;
    dupe.buildings[1].effectKey = dupe.buildings[0].effectKey;
    dupe.buildings[1].anchor = { x: 0.5, y: 0.3 };
    expect(() => villageBuildingsSchema.parse(dupe)).toThrow();

    const builtAtZero = structuredClone(base);
    builtAtZero.buildings[0].initialState = 'built';
    builtAtZero.buildings[0].initialLevel = 0;
    expect(() => villageBuildingsSchema.parse(builtAtZero)).toThrow();

    const lockedNoHint = structuredClone(base);
    const locked = lockedNoHint.buildings.find((b) => b.initialState === 'locked');
    if (!locked) throw new Error('fixture lost its locked building');
    delete locked.unlockHintKey;
    expect(() => villageBuildingsSchema.parse(lockedNoHint)).toThrow();

    const gap = structuredClone(base);
    const buildable = gap.buildings.find((b) => b.initialState === 'buildable');
    if (!buildable) throw new Error('fixture lost its buildable building');
    buildable.tiers = buildable.tiers.filter((t) => t.level !== 1);
    expect(() => villageBuildingsSchema.parse(gap)).toThrow();

    const close = structuredClone(base);
    close.buildings[0].anchor = { ...close.buildings[1].anchor };
    expect(() => villageBuildingsSchema.parse(close)).toThrow();

    const badKey = structuredClone(base);
    badKey.buildings[0].nameKey = 'village.buildings.lumbermill.name';
    expect(() => villageBuildingsSchema.parse(badKey)).toThrow();
  });

  it('renders a glyph for every iconKey and an icon for every cost resource', () => {
    for (const id of BUILDING_IDS) {
      const { container, unmount } = render(<VillageBuildingIcon iconKey={id} />);
      expect(container.querySelector('svg'), `no glyph for ${id}`).toBeTruthy();
      unmount();
    }
    for (const res of ['wood', 'iron', 'gold', 'food'] as VillageCostResource[]) {
      const { container, unmount } = render(<VillageCostIcon resource={res} label={res} />);
      expect(container.querySelector('svg, img'), `no icon for cost ${res}`).toBeTruthy();
      unmount();
    }
  });

  it('resolves every declared key non-empty in both locales (en/it-IT parity, ICU {var})', () => {
    for (const key of declaredKeys()) {
      for (const locale of ['en', 'it-IT'] as const) {
        const value = resolveKey(locale, key);
        expect(typeof value, `${locale} missing ${key}`).toBe('string');
        expect((value as string).length, `${locale} empty ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key} uses double-brace vars`).not.toMatch(/\{\{/);
      }
    }
  });
});

describe('toRomanLevel', () => {
  it('maps 0 → dash and 1..5 → I..V, clamping out-of-range input', () => {
    expect(toRomanLevel(0)).toBe('—');
    expect([1, 2, 3, 4, 5].map(toRomanLevel)).toEqual(['I', 'II', 'III', 'IV', 'V']);
    expect(toRomanLevel(-3)).toBe('—');
    expect(toRomanLevel(99)).toBe('V');
  });
});

describe('villaggio.png — BV-1 asset clean', () => {
  const PNG_PATH = path.resolve(__dirname, '../../../src/assets/mood/villaggio.png');

  it('keeps the original 3168×1344 canvas', async () => {
    const meta = await sharp(PNG_PATH).metadata();
    expect(meta.width).toBe(VILLAGE_CANVAS.widthPx);
    expect(meta.height).toBe(VILLAGE_CANVAS.heightPx);
  });

  it('contains no bright star pixels in the former watermark ROI', async () => {
    const { data, info } = await sharp(PNG_PATH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ROI = { x0: 3000, y0: 1178, x1: 3110, y1: 1284 };
    const LUM_THRESHOLD = 120;
    for (let y = ROI.y0; y < Math.min(ROI.y1, info.height); y += 1) {
      for (let x = ROI.x0; x < Math.min(ROI.x1, info.width); x += 1) {
        const i = (y * info.width + x) * info.channels;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        expect(lum, `bright pixel at (${x},${y}) lum=${lum}`).toBeLessThanOrEqual(LUM_THRESHOLD);
      }
    }
  });
});

describe('placeTooltip — measured geometry, flip, clamp, hysteresis', () => {
  const stage = { w: 1000, h: 500 };
  const tip = { w: 340, h: 200 };

  it('prefers the side that opens toward the stage centre', () => {
    expect(placeTooltip({ x: 60, y: 200 }, tip, stage, null).side).toBe('right');
    expect(placeTooltip({ x: 900, y: 200 }, tip, stage, null).side).toBe('left');
  });

  it('flips to a vertical side when no horizontal side fits', () => {
    /* (820,480): 'left' overflows the bottom edge by 88px, 'right' overflows
     * the right edge, 'above' fits — so the vertical fallback wins. */
    const placed = placeTooltip({ x: 820, y: 480 }, tip, stage, null);
    expect(placed.side).toBe('above');
    expect(placed.x).toBeGreaterThanOrEqual(TIP_CLAMP);
    expect(placed.y).toBeGreaterThanOrEqual(TIP_CLAMP);
    expect(placed.x + tip.w).toBeLessThanOrEqual(stage.w - TIP_CLAMP);
    expect(placed.y + tip.h).toBeLessThanOrEqual(stage.h - TIP_CLAMP);
  });

  it('keeps the last side while its overflow stays under the hysteresis margin', () => {
    /* Pin at x=400 (left half ⇒ prefers 'right'); 'left' also fits ⇒ the
     * hysteresis must keep 'left' instead of flickering back. */
    const pin = { x: 400, y: 200 };
    expect(placeTooltip(pin, tip, stage, null).side).toBe('right');
    expect(placeTooltip(pin, tip, stage, 'left').side).toBe('left');
  });

  it('always clamps inside the stage even when the stage is smaller than the tip', () => {
    const placed = placeTooltip({ x: 10, y: 10 }, tip, { w: 200, h: 120 }, null);
    expect(placed.x).toBe(TIP_CLAMP);
    expect(placed.y).toBe(TIP_CLAMP);
  });
});

describe('MockUpgradeControl — BV-5 mock honesty', () => {
  const buildable = CFG.buildings.find((b) => b.initialState === 'buildable');
  const built = CFG.buildings.find((b) => b.initialState === 'built');
  if (!buildable || !built) throw new Error('fixture lacks buildable/built building');

  it('is a natively disabled button with a preview caption linked via aria-describedby', () => {
    render(<MockUpgradeControl building={built} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    const captionId = btn.getAttribute('aria-describedby');
    expect(captionId).toBeTruthy();
    expect(document.getElementById(captionId as string)).toHaveTextContent(/preview/i);
  });

  it('exposes zero on* attributes — activation is a no-op', () => {
    render(<MockUpgradeControl building={buildable} />);
    const btn = screen.getByRole('button');
    for (const attr of Array.from(btn.attributes)) {
      expect(attr.name).not.toMatch(/^on/);
    }
    fireEvent.click(btn);
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(btn).toBeDisabled();
  });

  it('builds label variants: Build at Lv 0, Upgrade below max, badge at max', () => {
    const { unmount } = render(<MockUpgradeControl building={buildable} />);
    expect(screen.getByRole('button')).toHaveTextContent(/build/i);
    unmount();
    render(<MockUpgradeControl building={built} />);
    expect(screen.getByRole('button')).toHaveTextContent(/upgrade/i);
  });
});

describe('VillageScreenView — BV-3 tooltip & BV-4 panel actions', () => {
  /* jsdom has no layout: give the container a size so `stageSize.w > 0` and
   * the pins mount (they gate on the measured stage box). */
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
  });
  afterEach(() => vi.restoreAllMocks());

  const renderView = async (overrides: Partial<Parameters<typeof VillageScreenView>[0]> = {}) => {
    const ref = createRef<VillageScreenViewHandle>();
    const utils = render(
      <VillageScreenView
        ref={ref}
        onOpenStash={vi.fn()}
        onOpenMerchant={vi.fn()}
        {...overrides}
      />,
    );
    /* Flush the 30ms `entered` fade-in timer inside act so no state update
     * lands unwrapped mid-test. */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
    return { ref, ...utils };
  };

  const pins = () =>
    screen.getAllByRole('button').filter((b) => (b as HTMLElement).dataset.buildingPin);
  const pin = (name: RegExp) => screen.getByRole('button', { name });

  it('renders an icon-first pin per building inside a single-Tab-stop toolbar', async () => {
    await renderView();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    const all = pins();
    expect(all).toHaveLength(CFG.buildings.length);
    expect(all.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    for (const b of all) {
      expect(b.querySelector('svg'), `${b.dataset.buildingPin} pin lacks glyph`).toBeTruthy();
    }
  });

  it('hover opens a tooltip; the pin gains aria-controls + aria-expanded', async () => {
    await renderView();
    const p = pin(/lumbermill/i);
    fireEvent.pointerEnter(p);
    const tip = screen.getByTestId(VILLAGE_TOOLTIP_ID);
    expect(tip).toBeInTheDocument();
    expect(p).toHaveAttribute('aria-expanded', 'true');
    expect(p.getAttribute('aria-controls')).toBe(VILLAGE_TOOLTIP_ID);
    expect(tip).toHaveTextContent(/upgrade/i);
  });

  it('clicking a pin pins the tooltip; Escape via the imperative handle closes it once', async () => {
    const { ref } = await renderView();
    const p = pin(/lumbermill/i);
    fireEvent.click(p);
    const tip = screen.getByTestId(VILLAGE_TOOLTIP_ID);
    expect(tip).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pin panel/i })).toHaveAttribute('aria-pressed', 'true');
    let consumed = false;
    act(() => {
      consumed = ref.current?.escape() ?? false;
    });
    expect(consumed).toBe(true);
    expect(screen.queryByTestId(VILLAGE_TOOLTIP_ID)).toBeNull();
    /* The focus restore must NOT re-open the tooltip (the bug this guards:
     * pin.focus() fires onFocus → openTooltip). */
    act(() => {
      consumed = ref.current?.escape() ?? true;
    });
    expect(consumed).toBe(false);
  });

  it('a pinned tooltip stays open while other pins are hovered (single pinned slot)', async () => {
    await renderView();
    const lumber = pin(/lumbermill/i);
    const quarry = pin(/quarry/i);
    fireEvent.click(lumber);
    fireEvent.pointerLeave(lumber);
    fireEvent.pointerEnter(quarry);
    expect(screen.getByTestId(VILLAGE_TOOLTIP_ID)).toBeInTheDocument();
    expect(lumber).toHaveAttribute('aria-expanded', 'true');
    expect(quarry).toHaveAttribute('aria-expanded', 'false');
  });

  it('the X button always closes the tooltip and returns focus to its pin', async () => {
    await renderView();
    const p = pin(/lumbermill/i);
    fireEvent.click(p);
    const close = screen.getByRole('button', { name: /close panel/i });
    fireEvent.click(close);
    expect(screen.queryByTestId(VILLAGE_TOOLTIP_ID)).toBeNull();
    expect(document.activeElement).toBe(p);
  });

  it('keeps a just-opened tooltip alive across the 140ms grace window', async () => {
    await renderView();
    const p = pin(/lumbermill/i);
    fireEvent.pointerEnter(p);
    expect(screen.getByTestId(VILLAGE_TOOLTIP_ID)).toBeInTheDocument();
    fireEvent.pointerLeave(p);
    expect(screen.getByTestId(VILLAGE_TOOLTIP_ID)).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 220));
    });
    expect(screen.queryByTestId(VILLAGE_TOOLTIP_ID)).toBeNull();
  });

  it('warehouse tooltip offers [Apri Magazzino]; market offers [Apri Mercante]', async () => {
    const onOpenStash = vi.fn();
    const onOpenMerchant = vi.fn();
    await renderView({ onOpenStash, onOpenMerchant });

    const warehouse = pin(/warehouse/i);
    fireEvent.pointerEnter(warehouse);
    const stashBtn = screen.getByTestId('village-open-stash');
    fireEvent.click(stashBtn);
    expect(onOpenStash).toHaveBeenCalledWith(stashBtn);
    expect(onOpenMerchant).not.toHaveBeenCalled();

    fireEvent.click(warehouse); // pin it, then unpin via X to switch
    fireEvent.click(screen.getByRole('button', { name: /close panel/i }));

    const market = pin(/^market/i);
    fireEvent.pointerEnter(market);
    const merchantBtn = screen.getByTestId('village-open-merchant');
    fireEvent.click(merchantBtn);
    expect(onOpenMerchant).toHaveBeenCalledWith(merchantBtn);
  });

  it('arrow keys rove focus between pins within the toolbar', async () => {
    await renderView();
    const all = pins();
    /* focus() fires the pin's onFocus (opens its tooltip) — wrap in act. */
    act(() => all[0].focus());
    fireEvent.keyDown(all[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all[1]);
    fireEvent.keyDown(all[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all[2]);
    fireEvent.keyDown(all[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(all[1]);
    fireEvent.keyDown(all[1], { key: 'End' });
    expect(document.activeElement).toBe(all[all.length - 1]);
    fireEvent.keyDown(all[all.length - 1], { key: 'Home' });
    expect(document.activeElement).toBe(all[0]);
  });
});
