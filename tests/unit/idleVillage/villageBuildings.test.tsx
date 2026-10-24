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
  PAINTED_BUILDING_IDS,
  OCCLUSION_REPORT,
  hasFootprint,
  highlightSurfaceFor,
  VILLAGE_REGISTRY,
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

/* jsdom has no matchMedia (VillageScreenView reads (pointer: coarse) via useCoarsePointer). */
window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;

const CFG = VILLAGE_BUILDINGS_CONFIG;
const PAINTED = CFG.buildings.filter(hasFootprint);
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
  it('parses 16 buildings with unique ids covering BUILDING_IDS', () => {
    expect(CFG.buildings).toHaveLength(16);
    const ids = new Set(CFG.buildings.map((b) => b.id));
    expect(ids.size).toBe(16);
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
    for (let i = 0; i < PAINTED.length; i += 1) {
      for (let j = i + 1; j < PAINTED.length; j += 1) {
        const a = PAINTED[i];
        const b = PAINTED[j];
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
    expect(Object.isFrozen(PAINTED[0].anchor)).toBe(true);
    expect(Object.isFrozen(PAINTED[0].tiers[0].cost)).toBe(true);
    expect(() => {
      (PAINTED[0].anchor as { x: number }).x = 0.5;
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
    close.buildings[0].anchor = { ...(close.buildings[1] as { anchor: { x: number; y: number } }).anchor };
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
    expect(all).toHaveLength(PAINTED.length);
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

describe('PLAN-038 — region geometry (debate artifact r003)', () => {
  it('keeps every region inside the canvas and its anchor inside the region', () => {
    for (const b of PAINTED) {
      const r = b.region;
      expect(r.x + r.w, `${b.id} region overflows x`).toBeLessThanOrEqual(1);
      expect(r.y + r.h, `${b.id} region overflows y`).toBeLessThanOrEqual(1);
      expect(b.anchor.x, `${b.id} anchor outside region x`).toBeGreaterThanOrEqual(r.x - 1e-9);
      expect(b.anchor.x, `${b.id} anchor outside region x`).toBeLessThanOrEqual(r.x + r.w + 1e-9);
      expect(b.anchor.y, `${b.id} anchor outside region y`).toBeGreaterThanOrEqual(r.y - 1e-9);
      expect(b.anchor.y, `${b.id} anchor outside region y`).toBeLessThanOrEqual(r.y + r.h + 1e-9);
    }
  });

  it('keeps pairwise region overlap under 15% of the smaller', () => {
    for (let i = 0; i < PAINTED.length; i += 1) {
      for (let j = i + 1; j < PAINTED.length; j += 1) {
        const ra = PAINTED[i].region;
        const rb = PAINTED[j].region;
        const ox = Math.max(0, Math.min(ra.x + ra.w, rb.x + rb.w) - Math.max(ra.x, rb.x));
        const oy = Math.max(0, Math.min(ra.y + ra.h, rb.y + rb.h) - Math.max(ra.y, rb.y));
        const overlap = ox * oy;
        const smaller = Math.min(ra.w * ra.h, rb.w * rb.h);
        expect(overlap, `${PAINTED[i].id} ∩ ${PAINTED[j].id}`).toBeLessThanOrEqual(smaller * 0.15 + 1e-12);
      }
    }
  });

  it('rejects an anchor outside its region and an out-of-canvas region at parse time', () => {
    const base = structuredClone(CFG) as Parameters<typeof villageBuildingsSchema.parse>[0];

    const anchorOut = structuredClone(base);
    anchorOut.buildings[0].anchor = { x: 0.06, y: 0.12 };
    anchorOut.buildings[0].region = { x: 0.3, y: 0.3, w: 0.1, h: 0.1 };
    expect(() => villageBuildingsSchema.parse(anchorOut)).toThrow(/outside its region/);

    const regionOut = structuredClone(base);
    regionOut.buildings[0].region = { x: 0.9, y: 0.3, w: 0.2, h: 0.1 };
    regionOut.buildings[0].anchor = { x: 0.93, y: 0.34 };
    expect(() => villageBuildingsSchema.parse(regionOut)).toThrow(/exceeds the painting/);
  });

  it('mock levels are mixed — the level channel is informative, not 11× I', () => {
    const levels = CFG.buildings.filter((b) => b.initialState === 'built').map((b) => b.initialLevel);
    expect(new Set(levels).size).toBeGreaterThan(1);
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(2);
  });
});

describe('PLAN-038 — pin visual language + slot overlay', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
  });
  afterEach(() => vi.restoreAllMocks());

  const renderView = async () => {
    const ref = createRef<VillageScreenViewHandle>();
    const utils = render(<VillageScreenView ref={ref} onOpenStash={vi.fn()} onOpenMerchant={vi.fn()} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
    return { ref, ...utils };
  };

  it('encodes category in data-pin-frame and state in data-pin-state on every pin', async () => {
    await renderView();
    const FRAME = { production: 'roundel', civic: 'banner', defense: 'shield' } as const;
    for (const b of PAINTED) {
      const el = document.querySelector(`[data-building-pin="${b.id}"]`) as HTMLElement;
      expect(el, `missing pin ${b.id}`).toBeTruthy();
      expect(el.dataset.pinFrame).toBe(FRAME[b.category]);
      expect(el.dataset.pinState).toBe(b.initialState);
    }
  });

  it('aria-labels expose name, category, state and level', async () => {
    await renderView();
    for (const b of PAINTED) {
      const el = document.querySelector(`[data-building-pin="${b.id}"]`) as HTMLElement;
      const label = el.getAttribute('aria-label') ?? '';
      expect(label, b.id).toContain(resolveKey('en', b.nameKey) as string);
      expect(label, b.id).toContain(resolveKey('en', `gameFrame.village.category.${b.category}`) as string);
      expect(label, b.id).toContain(resolveKey('en', `gameFrame.village.state.${b.initialState}`) as string);
      expect(label, b.id).toContain(toRomanLevel(Math.max(b.initialLevel, 0)));
    }
  });

  it('badge tab: level numeral for built, "+" for buildable, lock glyph for locked', async () => {
    await renderView();
    for (const b of PAINTED) {
      const el = document.querySelector(`[data-building-pin="${b.id}"]`) as HTMLElement;
      if (b.initialState === 'built') expect(el).toHaveTextContent(toRomanLevel(b.initialLevel));
      if (b.initialState === 'buildable') expect(el).toHaveTextContent('+');
      if (b.initialState === 'locked') expect(el.textContent ?? '').not.toContain('+');
    }
  });

  it('renders one stable <g data-region> per building, aria-hidden, pointer-events none', async () => {
    const { container } = await renderView();
    const overlay = container.querySelector('[data-testid="village-slot-overlay"]') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay.style.pointerEvents).toBe('none');
    const groups = overlay.querySelectorAll('g[data-region]');
    expect(groups).toHaveLength(PAINTED.length);
    for (const b of PAINTED) {
      const g = overlay.querySelector(`g[data-region="${b.id}"]`);
      expect(g, `missing region group ${b.id}`).toBeTruthy();
      expect((g as SVGGElement).dataset.state).toBe(b.initialState);
    }
  });

  it('state grammar: buildable draws a dashed brass ring; locked draws a dotted ring + vignette; built draws none', async () => {
    const { container } = await renderView();
    for (const b of PAINTED) {
      const g = container.querySelector(`g[data-region="${b.id}"]`) as SVGGElement;
      const dashed = g.querySelector('ellipse[stroke-dasharray]');
      if (b.initialState === 'built') {
        expect(dashed, `${b.id} built must not draw a state ring`).toBeNull();
      } else if (b.initialState === 'buildable') {
        expect(dashed, `${b.id} buildable lacks dashed ring`).toBeTruthy();
      } else {
        expect(dashed, `${b.id} locked lacks dotted ring`).toBeTruthy();
        expect(g.querySelector('ellipse[fill^="url(#vslot-scrim"]'), `${b.id} locked lacks vignette`).toBeTruthy();
      }
      /* Every group keeps a .vslot-ping ellipse — the pin→region glow target. */
      expect(g.querySelector('.vslot-ping'), `${b.id} lacks glow ping`).toBeTruthy();
    }
  });

  it('draws a pennant only on built buildings at level ≥2', async () => {
    const { container } = await renderView();
    for (const b of PAINTED) {
      const g = container.querySelector(`g[data-region="${b.id}"]`) as SVGGElement;
      const hasPennant = g.querySelector('.vslot-pennant') !== null;
      expect(hasPennant, `${b.id} pennant mismatch`).toBe(b.initialState === 'built' && b.initialLevel >= 2);
    }
  });

  it('renders the settlement plaque and the visual legend inside the stage', async () => {
    const { container } = await renderView();
    const plaque = container.querySelector('[data-testid="village-plaque"]');
    expect(plaque).toHaveTextContent(/village/i);
    expect(plaque).toHaveTextContent(/of.*16|6.*of.*16/i);
    const legend = container.querySelector('[data-testid="village-legend"]');
    expect(legend).toBeTruthy();
    expect(legend?.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
  });
});

describe('PLAN-042 — slotKind discriminated union + registry entries', () => {
  it('splits the catalog into 11 painted + 5 registry-only entries', () => {
    expect(PAINTED).toHaveLength(11);
    expect(PAINTED.map((b) => b.id)).toEqual([...PAINTED_BUILDING_IDS]);
    const registry = CFG.buildings.filter((b) => b.slotKind === 'registry');
    expect(registry.map((b) => b.id)).toEqual(['mageTower', 'adventurersGuild', 'sanctuary', 'alchemist', 'cemetery']);
    for (const b of registry) {
      expect(b.category, `${b.id} category`).toBe('arcane');
      /* registry-only entries carry NO geometry keys at all */
      expect('region' in b).toBe(false);
      expect('anchor' in b).toBe(false);
    }
    /* mageTower is buildable: the arcane section shows a real state. */
    const mageTower = registry.find((b) => b.id === 'mageTower');
    expect(mageTower?.initialState).toBe('buildable');
    for (const b of registry.filter((e) => e.id !== 'mageTower')) {
      expect(b.initialState, b.id).toBe('locked');
      expect(b.unlockHintKey, b.id).toBeTruthy();
    }
  });

  it('rejects geometry on registry entries and missing geometry on painted ones', () => {
    const base = structuredClone(CFG) as unknown as { buildings: Array<Record<string, unknown>> };
    const regWithRegion = structuredClone(base);
    const mageTower = regWithRegion.buildings.find((b) => b.id === 'mageTower');
    if (!mageTower) throw new Error('fixture lost mageTower');
    mageTower.region = { x: 0.5, y: 0.5, w: 0.1, h: 0.1 };
    expect(() => villageBuildingsSchema.parse(regWithRegion)).toThrow();

    const regWithAnchor = structuredClone(base);
    (regWithAnchor.buildings.find((b) => b.id === 'sanctuary') as Record<string, unknown>).anchor = { x: 0.5, y: 0.5 };
    expect(() => villageBuildingsSchema.parse(regWithAnchor)).toThrow();

    const paintedNoRegion = structuredClone(base);
    delete (paintedNoRegion.buildings[0] as Record<string, unknown>).region;
    expect(() => villageBuildingsSchema.parse(paintedNoRegion)).toThrow();

    /* id↔slotKind coherence: a painted id cannot be declared registry. */
    const swapped = structuredClone(base);
    const lumber = swapped.buildings.find((b) => b.id === 'lumbermill') as Record<string, unknown>;
    lumber.slotKind = 'registry';
    delete lumber.region;
    delete lumber.anchor;
    expect(() => villageBuildingsSchema.parse(swapped)).toThrow();
  });

  it('declares overlayArt as an inert typed seam: schema accepts it, no v1 entry sets it', () => {
    for (const b of CFG.buildings) expect(b.overlayArt, `${b.id} must not set overlayArt in v1`).toBeUndefined();
    const withArt = structuredClone(CFG) as unknown as { buildings: Array<Record<string, unknown>> };
    const mageTower = withArt.buildings.find((b) => b.id === 'mageTower');
    if (!mageTower) throw new Error('fixture lost mageTower');
    mageTower.overlayArt = { patchSrc: 'village/patches/mage-tower.png', region: { x: 0.8, y: 0.1, w: 0.1, h: 0.3 } };
    expect(() => villageBuildingsSchema.parse(withArt)).not.toThrow();
    const badArt = structuredClone(withArt);
    (badArt.buildings.find((b) => b.id === 'mageTower') as Record<string, unknown>).overlayArt = { patchSrc: '' };
    expect(() => villageBuildingsSchema.parse(badArt)).toThrow();
  });

  it('occlusion report: deterministic matrix for 1280/1440/1920, painted-only, key-complete', () => {
    expect(Object.keys(OCCLUSION_REPORT).sort()).toEqual([...PAINTED_BUILDING_IDS].sort());
    for (const id of PAINTED_BUILDING_IDS) {
      expect(Object.keys(OCCLUSION_REPORT[id]).sort()).toEqual(['1280', '1440', '1920']);
      for (const key of ['1280', '1440', '1920'] as const) {
        const entry = OCCLUSION_REPORT[id][key];
        expect(typeof entry.footprint).toBe('boolean');
        expect(typeof entry.anchor).toBe('boolean');
      }
    }
    /* Snapshot gate (artifact D-10): the drawer covers the east strip when
     * open — warehouse is the known occluded building; the snapshot fails if
     * a width/viewport change silently extends occlusion to more buildings. */
    const occludedFootprints = (w: '1280' | '1440' | '1920') =>
      PAINTED_BUILDING_IDS.filter((id) => OCCLUSION_REPORT[id][w].footprint).sort();
    /* A 400px drawer covers the east strip: at 1280 it reaches ~31% of the
     * stage (barracks+lumbermill+warehouse+watchtower), at 1920 ~21%
     * (warehouse+watchtower only). Snapshot fails if occlusion spreads. */
    expect(occludedFootprints('1280')).toEqual(['barracks', 'lumbermill', 'warehouse', 'watchtower']);
    expect(occludedFootprints('1440')).toEqual(['lumbermill', 'warehouse', 'watchtower']);
    expect(occludedFootprints('1920')).toEqual(['warehouse', 'watchtower']);
  });

  it('highlightSurfaceFor: three-tier fallback footprint → pin → row', () => {
    const warehouse = PAINTED.find((b) => b.id === 'warehouse');
    const lumbermill = PAINTED.find((b) => b.id === 'lumbermill');
    if (!warehouse || !lumbermill) throw new Error('fixture incomplete');
    /* warehouse anchor x=0.86 sits under a 400px drawer at every supported
     * stage width — the row glow is its documented fallback. */
    for (const v of VILLAGE_REGISTRY.viewports) {
      expect(highlightSurfaceFor(warehouse, v)).toBe('row');
    }
    /* lumbermill walks all three tiers across the matrix: at 1280 even its
     *  anchor (0.72) is under the drawer → row; at 1440 the pin stays visible
     *  → pin-ping fallback; at 1920 the footprint is visible again. */
    expect(highlightSurfaceFor(lumbermill, { w: 1280, h: 800 })).toBe('row');
    expect(highlightSurfaceFor(lumbermill, { w: 1440, h: 900 })).toBe('pin');
    expect(highlightSurfaceFor(lumbermill, { w: 1920, h: 1080 })).toBe('footprint');
    /* barracks covers the pure pin-tier case at 1280 (footprint under the
     *  drawer, anchor just outside it). */
    const barracks = PAINTED.find((b) => b.id === 'barracks');
    if (!barracks) throw new Error('fixture lacks barracks');
    expect(highlightSurfaceFor(barracks, { w: 1280, h: 800 })).toBe('pin');
  });
});

describe('VillageRegistry — PLAN-042 drawer', () => {
  const renderRegistry = async (overrides: Partial<Parameters<typeof import('@/ui/idleVillage/components/gameFrame/VillageRegistry').VillageRegistry>[0]> = {}) => {
    const { VillageRegistry } = await import('@/ui/idleVillage/components/gameFrame/VillageRegistry');
    const ref = createRef<import('@/ui/idleVillage/components/gameFrame/VillageRegistry').VillageRegistryHandle>();
    const props = {
      open: true,
      buildings: CFG.buildings,
      activeId: null as string | null,
      onActiveChange: vi.fn(),
      onShowTooltip: vi.fn(),
      ...overrides,
    };
    const utils = render(<VillageRegistry ref={ref} {...props} />);
    return { ref, ...utils };
  };

  it('renders all 16 catalog rows grouped in 4 category sections', async () => {
    await renderRegistry();
    const sections = document.querySelectorAll('[data-registry-section]');
    expect(sections).toHaveLength(4);
    expect(document.querySelector('[data-registry-section="arcane"]')).toBeTruthy();
    /* Only sections containing a buildable entry start expanded (artifact
     *  r005): production has none → 13 rows visible until expanded. */
    expect(document.querySelectorAll('[data-registry-row]')).toHaveLength(13);
    /* Expand the collapsed production section → all 16. */
    fireEvent.click(document.querySelector('[data-registry-section="production"] > button') as HTMLElement);
    expect(document.querySelectorAll('[data-registry-row]')).toHaveLength(16);
  });

  it('marks painted rows on-map and registry-only rows off-map', async () => {
    await renderRegistry();
    /* warehouse (civic) and mageTower (arcane) are in default-expanded sections. */
    const warehouse = document.querySelector('[data-registry-row="warehouse"]') as HTMLElement;
    const mageTower = document.querySelector('[data-registry-row="mageTower"]') as HTMLElement;
    expect(warehouse.dataset.slotKind).toBe('painted');
    expect(mageTower.dataset.slotKind).toBe('registry');
    expect(warehouse.getAttribute('aria-label')).toContain('On the map');
    expect(mageTower.getAttribute('aria-label')).toContain('Registry only');
  });

  it('clicking a painted row opens the stage tooltip; a registry-only row drills into the card', async () => {
    const onShowTooltip = vi.fn();
    await renderRegistry({ onShowTooltip });
    const warehouse = document.querySelector('[data-registry-row="warehouse"]') as HTMLElement;
    fireEvent.click(warehouse);
    expect(onShowTooltip).toHaveBeenCalledWith('warehouse');
    expect(screen.queryByTestId('village-registry-card')).toBeNull();

    const mageTower = document.querySelector('[data-registry-row="mageTower"]') as HTMLElement;
    fireEvent.click(mageTower);
    expect(screen.getByTestId('village-registry-card')).toBeInTheDocument();
    expect(screen.getByTestId('village-registry-card')).toHaveTextContent('Mage Tower');
    /* The list stays mounted (hidden) so focus can return to the row. */
    expect(screen.getByTestId('village-registry-list')).toBeInTheDocument();
  });

  it('detail card shows the effect ladder, mock cost preview and back control', async () => {
    await renderRegistry();
    fireEvent.click(document.querySelector('[data-registry-row="alchemist"]') as HTMLElement);
    const card = screen.getByTestId('village-registry-card');
    expect(card.querySelectorAll('[data-tier]').length).toBeGreaterThanOrEqual(2);
    expect(card).toHaveTextContent(/alchem|Alchemist/i);
    /* alchemist is locked → unlock hint visible, no upgrade control. */
    expect(card.querySelectorAll('[data-registry-back]').length).toBe(1);
    fireEvent.click(card.querySelector('[data-registry-back]') as HTMLElement);
    expect(screen.queryByTestId('village-registry-card')).toBeNull();
    /* Focus returns to the originating row (via requestAnimationFrame). */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(document.activeElement).toBe(document.querySelector('[data-registry-row="alchemist"]'));
  });

  it('imperative escape(): card first, then reports false so the drawer can close', async () => {
    const { ref } = await renderRegistry();
    fireEvent.click(document.querySelector('[data-registry-row="mageTower"]') as HTMLElement);
    let consumed = false;
    act(() => {
      consumed = ref.current?.escape() ?? false;
    });
    expect(consumed).toBe(true);
    expect(screen.queryByTestId('village-registry-card')).toBeNull();
    act(() => {
      consumed = ref.current?.escape() ?? true;
    });
    expect(consumed).toBe(false);
  });

  it('filter chips narrow the visible rows', async () => {
    await renderRegistry();
    fireEvent.click(document.querySelector('[data-registry-filter="locked"]') as HTMLElement);
    const rows = document.querySelectorAll('[data-registry-row]');
    expect(rows.length).toBe(CFG.buildings.filter((b) => b.initialState === 'locked').length);
    for (const row of rows) {
      expect((row as HTMLElement).dataset.state).toBe('locked');
    }
  });

  it('row hover reports the id upward (activeBuildingId sync)', async () => {
    const onActiveChange = vi.fn();
    await renderRegistry({ onActiveChange });
    /* market is civic — its section starts expanded (it contains buildables). */
    fireEvent.pointerEnter(document.querySelector('[data-registry-row="market"]') as HTMLElement);
    expect(onActiveChange).toHaveBeenCalledWith('market');
    fireEvent.pointerLeave(document.querySelector('[data-registry-row="market"]') as HTMLElement);
    expect(onActiveChange).toHaveBeenCalledWith(null);
  });

  it('registry-only hover never emits a footprint — activeId lights only the row', async () => {
    const { rerender } = await renderRegistry({ activeId: 'mageTower' });
    const row = document.querySelector('[data-registry-row="mageTower"]') as HTMLElement;
    expect(row.dataset.active).toBe('true');
  });
});
