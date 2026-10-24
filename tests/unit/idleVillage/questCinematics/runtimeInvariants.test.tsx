/**
 * Runtime invariants (PLAN-050 T-011, aggregating the PLAN-046 T-009
 * residuals the audit flagged as unproven):
 *
 *  - `viewAspectRange` is bound to the REAL theater layout constants
 *    (`gameFrameConfig.questWindow`), not an asserted literal;
 *  - the GPU path builds exactly one Mesh (one draw call) sampling ≤2
 *    textures, with no filter pass anywhere in the chain;
 *  - the Pixi ticker idle-stops once shot + trauma have no temporal work,
 *    and re-arms when a camera-moving prop changes — `idleDrift` is a
 *    finite shot that lands, so "ticker idle-stopped" and "idleDrift" do
 *    not conflict (documented in the plan).
 */

import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { DEFAULT_QUEST_THEATRE_FX, type CameraShot } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { cameraAt, cameraHasTemporalWork, coverFit, TRAUMA_SETTLED_EPS } from '@/ui/idleVillage/questS1Lab/render/depthTransform';
import { traumaAt } from '@/ui/idleVillage/questS1Lab/render/trauma';
import { DepthScene } from '@/ui/idleVillage/questS1Lab/render/DepthScene';
import { AmbientLayer, drawAmbientFrame, plateCache, seeded } from '@/ui/idleVillage/questS1Lab/render/AmbientLayer';
import type { AmbientFx } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';

/* ── pixi.js mock — captures the render topology DepthScene builds.
 *  vi.mock factories are hoisted above imports, so every shared fixture
 *  lives inside vi.hoisted. */
const mocks = vi.hoisted(() => {
  const fakeTexture = () => ({
    source: { style: {} as Record<string, unknown>, autoGenerateMipmaps: false, updateMipmaps: () => undefined },
  });

  class MockTicker {
    callbacks: (() => void)[] = [];
    onceCallbacks: (() => void)[] = [];
    started = true;
    add(fn: () => void) {
      this.callbacks.push(fn);
    }
    addOnce(fn: () => void) {
      this.onceCallbacks.push(fn);
    }
    start() {
      this.started = true;
    }
    stop() {
      this.started = false;
    }
    /** Simulate one ticker tick the way Pixi would — only while started. */
    tick() {
      if (!this.started) return;
      for (const cb of [...this.callbacks]) cb();
      const once = this.onceCallbacks;
      this.onceCallbacks = [];
      for (const cb of once) cb();
    }
  }

  class MockApplication {
    static instances: MockApplication[] = [];
    ticker = new MockTicker();
    stage = {
      children: [] as unknown[],
      addChild: (c: unknown) => {
        this.stage.children.push(c);
        return c;
      },
    };
    screen = { width: 960, height: 400 };
    canvas = document.createElement('canvas');
    renderer = { gl: {}, renderPipes: { mesh: {} } };
    destroyed = false;
    async init() {
      return undefined;
    }
    destroy() {
      this.destroyed = true;
    }
    constructor() {
      MockApplication.instances.push(this);
    }
  }

  class MockMesh {
    geometry: unknown;
    shader: unknown;
    filters: unknown;
    scale = { set: (..._args: number[]) => undefined };
    constructor(opts: { geometry: unknown; shader: unknown }) {
      this.geometry = opts.geometry;
      this.shader = opts.shader;
    }
  }

  const shaderSpecs: { resources: Record<string, unknown> }[] = [];

  return { fakeTexture, MockTicker, MockApplication, MockMesh, shaderSpecs };
});

vi.mock('pixi.js', () => ({
  Application: mocks.MockApplication,
  Assets: { load: async () => mocks.fakeTexture() },
  Mesh: mocks.MockMesh,
  MeshGeometry: class MeshGeometry {
    constructor(public opts: unknown) {}
  },
  Shader: {
    from: (spec: { resources: Record<string, unknown> }) => {
      mocks.shaderSpecs.push(spec);
      const uDef = spec.resources.u as Record<string, { value: unknown }>;
      return {
        resources: { u: { uniforms: Object.fromEntries(Object.entries(uDef).map(([k, v]) => [k, v.value])) } },
      };
    },
  },
  Texture: class Texture {},
}));
vi.mock('pixi.js/mesh', () => ({}));

/* jsdom lacks WebGL classes — stub the capability gate so the GPU path
 *  under test actually boots (the mock supplies the renderer). */
beforeAll(() => {
  (globalThis as Record<string, unknown>).WebGL2RenderingContext = class WebGL2RenderingContext {};
});

const CFG = DEFAULT_QUEST_THEATRE_FX.depth;
const SHOT = DEFAULT_QUEST_THEATRE_FX.camera.shots['push-in']; // durMs 1600

const sceneJsx = (props: {
  now: { v: number };
  shot?: CameraShot;
  shotEpoch?: number;
  traumaEpoch?: number | null;
  traumaStrength?: number;
}) => (
  <DepthScene
    src="/a.jpg"
    depthSrc="/a.webp"
    imgAspect={2.357}
    viewAspect={2.4}
    shot={props.shot ?? SHOT}
    shotEpoch={props.shotEpoch ?? 0}
    cfg={CFG}
    reducedMotion={false}
    clock={() => props.now.v}
    traumaEpoch={props.traumaEpoch ?? null}
    traumaStrength={props.traumaStrength ?? 0}
  />
);

const bootedApp = async (): Promise<InstanceType<typeof mocks.MockApplication>> => {
  await waitFor(() => {
    const app = mocks.MockApplication.instances.at(-1);
    if (!app || app.ticker.callbacks.length + app.ticker.onceCallbacks.length === 0) {
      throw new Error('boot pending');
    }
  });
  return mocks.MockApplication.instances.at(-1)!;
};

describe('viewAspectRange — bound to the real layout constants', () => {
  it('covers every aspect the Theater can actually render at, with bounded margin', () => {
    const qw = DEFAULT_GAME_FRAME_CONFIG.questWindow;
    const real = [qw.theaterAspect, qw.cluster.expandedTheaterAspect];
    const [lo, hi] = CFG.viewAspectRange;
    expect(lo).toBeLessThanOrEqual(Math.min(...real));
    expect(hi).toBeGreaterThanOrEqual(Math.max(...real));
    /* The margin is deliberate slack, but bounded — a silently inflated
     *  range would weaken every edge-safety proof. */
    expect(Math.min(...real) - lo).toBeLessThanOrEqual(0.1);
    expect(hi - Math.max(...real)).toBeLessThanOrEqual(0.1);
  });
});

describe('GPU path topology — one mesh, two textures, no filter pass', () => {
  it('builds exactly one Mesh on the stage', async () => {
    mocks.MockApplication.instances.length = 0;
    render(sceneJsx({ now: { v: 0 } }));
    const app = await bootedApp();
    expect(app.stage.children).toHaveLength(1);
    expect(app.stage.children[0]).toBeInstanceOf(mocks.MockMesh);
    expect(app.destroyed).toBe(false);
  });

  it('samples exactly two textures (scene + depth) through the shader', async () => {
    mocks.MockApplication.instances.length = 0;
    mocks.shaderSpecs.length = 0;
    render(sceneJsx({ now: { v: 0 } }));
    await bootedApp();
    expect(mocks.shaderSpecs).toHaveLength(1);
    const resources = mocks.shaderSpecs[0].resources;
    expect(Object.keys(resources).filter((k) => k !== 'u').sort()).toEqual(['uDepth', 'uScene']);
  });

  it('uses no filter pass — mesh and stage carry no filters', async () => {
    mocks.MockApplication.instances.length = 0;
    render(sceneJsx({ now: { v: 0 } }));
    const app = await bootedApp();
    const mesh = app.stage.children[0] as { filters?: unknown };
    expect(mesh.filters).toBeUndefined();
    expect((app.stage as { filters?: unknown }).filters).toBeUndefined();
  });
});

describe('ticker idle-stop — render-once + stop when the camera settles', () => {
  it('keeps ticking while the shot is in flight', async () => {
    mocks.MockApplication.instances.length = 0;
    const now = { v: 0 };
    render(sceneJsx({ now }));
    const app = await bootedApp();
    const stopSpy = vi.spyOn(app.ticker, 'stop');
    act(() => app.ticker.tick());
    now.v = 800;
    act(() => app.ticker.tick());
    expect(stopSpy).not.toHaveBeenCalled();
    expect(app.ticker.started).toBe(true);
  });

  it('stops the ticker once the landed frame has rendered', async () => {
    mocks.MockApplication.instances.length = 0;
    const now = { v: 0 };
    render(sceneJsx({ now }));
    const app = await bootedApp();
    now.v = SHOT.durMs + 50; // landed
    act(() => app.ticker.tick()); // renders the landed frame
    act(() => app.ticker.tick()); // detects settle → parks
    expect(app.ticker.started).toBe(false);
  });

  it('a durMs=0 shot settles immediately — render once, then stop', async () => {
    mocks.MockApplication.instances.length = 0;
    render(sceneJsx({ now: { v: 0 }, shot: DEFAULT_QUEST_THEATRE_FX.camera.shots.hold }));
    const app = await bootedApp();
    act(() => app.ticker.tick());
    act(() => app.ticker.tick());
    expect(app.ticker.started).toBe(false);
  });

  it('re-arms when the shot epoch moves (new beat / loop wrap)', async () => {
    mocks.MockApplication.instances.length = 0;
    const now = { v: 2000 };
    const { rerender } = render(sceneJsx({ now }));
    const app = await bootedApp();
    act(() => app.ticker.tick());
    act(() => app.ticker.tick());
    expect(app.ticker.started).toBe(false);

    rerender(sceneJsx({ now, shotEpoch: 2000 }));
    expect(app.ticker.started).toBe(true);
    const stopSpy = vi.spyOn(app.ticker, 'stop');
    act(() => app.ticker.tick()); // elapsed 0 → temporal work again
    expect(stopSpy).not.toHaveBeenCalled();
  });

  it('an injected trauma re-arms and keeps the ticker until it decays', async () => {
    mocks.MockApplication.instances.length = 0;
    const now = { v: 5000 };
    const { rerender } = render(sceneJsx({ now }));
    const app = await bootedApp();
    act(() => app.ticker.tick());
    act(() => app.ticker.tick());
    expect(app.ticker.started).toBe(false);

    /* Trauma injected 400ms ago → envelope ~0.45, still working. */
    rerender(sceneJsx({ now, traumaEpoch: 4600, traumaStrength: 1 }));
    expect(app.ticker.started).toBe(true);
    act(() => app.ticker.tick());
    expect(app.ticker.started).toBe(true);
    /* decayMs=500: at +2600ms the envelope is ~5.5e-3 < TRAUMA_SETTLED_EPS */
    now.v = 7200;
    act(() => app.ticker.tick());
    act(() => app.ticker.tick());
    expect(app.ticker.started).toBe(false);
  });
});

describe('cameraHasTemporalWork — the settle predicate', () => {
  const tr = (tMs: number, s = 1) => traumaAt(tMs, s, CFG.trauma);

  it('is true mid-shot, false once landed', () => {
    expect(cameraHasTemporalWork(SHOT, 0, null)).toBe(true);
    expect(cameraHasTemporalWork(SHOT, SHOT.durMs - 1, null)).toBe(true);
    expect(cameraHasTemporalWork(SHOT, SHOT.durMs, null)).toBe(false);
  });

  it('idleDrift is finite — it settles after its 16s, so idle-stop applies', () => {
    const idle = DEFAULT_QUEST_THEATRE_FX.camera.idleDrift;
    expect(cameraHasTemporalWork(idle, 0, null)).toBe(true);
    expect(cameraHasTemporalWork(idle, idle.durMs, null)).toBe(false);
  });

  it('trauma counts as work until its envelope decays below the floor', () => {
    expect(cameraHasTemporalWork(SHOT, SHOT.durMs, tr(100))).toBe(true);
    const decayed = tr(CFG.trauma.decayMs * 6);
    expect(decayed.envelope).toBeLessThan(TRAUMA_SETTLED_EPS);
    expect(cameraHasTemporalWork(SHOT, SHOT.durMs, decayed)).toBe(false);
  });
});

describe('measured host aspect — the camera sees the real box (R-242)', () => {
  // INV:depth-scene.INV-1 — the theatre is the plaque's shrink reservoir:
  // the authored `aspect` (2.4) is only the preferred ratio; the real box
  // crushes to ~3.85:1 at the 190px floor. `viewAspect` must follow the
  // MEASURED host aspect — a stale value makes the GPU window disagree
  // with the DOM cover underneath and the picture visibly reframes when
  // the canvas fades in on every (re)mount.
  class FakeRO {
    static instances: FakeRO[] = [];
    cb: ResizeObserverCallback;
    observed: Element[] = [];
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
      FakeRO.instances.push(this);
    }
    observe(el: Element) {
      this.observed.push(el);
    }
    unobserve() {}
    disconnect() {}
    fire() {
      this.cb(this.observed as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
    }
  }

  const hostBox = { width: 732, height: 190 }; // the crushed 3.85:1 box seen live
  let restoreRect: (() => void) | undefined;
  let restoreRO: (() => void) | undefined;

  const mountCrushed = (now: { v: number }) => {
    FakeRO.instances.length = 0;
    hostBox.width = 732;
    hostBox.height = 190;
    const prevRO = (globalThis as Record<string, unknown>).ResizeObserver;
    (globalThis as Record<string, unknown>).ResizeObserver = FakeRO;
    restoreRO = () => {
      if (prevRO === undefined) delete (globalThis as Record<string, unknown>).ResizeObserver;
      else (globalThis as Record<string, unknown>).ResizeObserver = prevRO;
    };
    const prev = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const isHost = this.getAttribute?.('data-testid') === 'depth-scene';
      const w = isHost ? hostBox.width : 0;
      const h = isHost ? hostBox.height : 0;
      return { width: w, height: h, x: 0, y: 0, top: 0, left: 0, right: w, bottom: h, toJSON: () => ({}) } as DOMRect;
    };
    restoreRect = () => {
      HTMLElement.prototype.getBoundingClientRect = prev;
    };
    const r = render(sceneJsx({ now }));
    const uniforms = async () => {
      const app = await bootedApp();
      const u = mocks.shaderSpecs.at(-1)!.resources.u as Record<string, { value: unknown }>;
      /* The ticker mutates the Float32Array INSTANCE held in `.value` —
       *  reading through the spec def sees the live uniform. */
      const winHalf = () => (u.uWinHalf as { value: Float32Array }).value;
      return { app, winHalf };
    };
    return { ...r, uniforms };
  };

  /* half_y = (0.5 − crop_y(imgAspect, aspect))·(1−overscan)/zoom — for the
   *  2.357:1 scene the crushed 3.85 box crops Y (0.194) while the 2.4 prop
   *  crops almost nothing (0.008) — the two half windows are unmissable. */
  const halfYFor = (aspect: number, zoom: number) =>
    ((0.5 - coverFit(2.357, aspect).crop[1]) * (1 - CFG.overscan)) / zoom;

  it('samples the MEASURED box aspect, not the configured prop', async () => {
    mocks.MockApplication.instances.length = 0;
    mocks.shaderSpecs.length = 0;
    const now = { v: 0 };
    const { uniforms } = mountCrushed(now);
    const { app, winHalf } = await uniforms();
    now.v = 400;
    act(() => app.ticker.tick());
    const landed = winHalf();
    /* Pre-fix this equals the 2.4-prop window instead of the real 3.85
     *  window — the DOM/GPU mismatch that reframed the art. */
    const realAspect = hostBox.width / hostBox.height;
    expect(landed[1]).toBeCloseTo(halfYFor(realAspect, cameraAt(SHOT, 400).zoom), 3);
    expect(landed[1]).not.toBeCloseTo(halfYFor(2.4, cameraAt(SHOT, 400).zoom), 3);
  });

  it('retunes the sampled window live when the host resizes', async () => {
    mocks.MockApplication.instances.length = 0;
    mocks.shaderSpecs.length = 0;
    const now = { v: 0 };
    const { uniforms } = mountCrushed(now);
    const { app, winHalf } = await uniforms();
    act(() => app.ticker.tick());
    const before = winHalf()[1];

    hostBox.width = 732;
    hostBox.height = 305; // cluster widened back to ~2.4:1
    act(() => FakeRO.instances.at(-1)!.fire());
    act(() => app.ticker.tick());
    const after = winHalf()[1];
    expect(after).not.toBeCloseTo(before, 3);
    expect(after).toBeCloseTo(halfYFor(732 / 305, cameraAt(SHOT, 0).zoom), 3);
  });

  it('applies the DOM camera transform before the first paint — no raw-cover flash', () => {
    const now = { v: 0 };
    /* Render WITHOUT the RO stub and with zero-sized rects: the fallback
     *  transform uses the prop aspect — what matters is that it exists at
     *  all on mount (pre-fix it only landed on the first rAF, so the first
     *  painted frame was a bare object-fit cover crop). */
    const { container } = render(sceneJsx({ now }));
    const img = container.querySelector('[data-testid="depth-scene"] img')!;
    expect(img.style.transform).toMatch(/scale\(/);
  });

  afterEach(() => {
    restoreRect?.();
    restoreRO?.();
  });
});

describe('ambient layer — no fx, no temporal work, no loop', () => {
  it('does not start rAF for an empty effects list, does for real fx', async () => {
    /* jsdom returns null from getContext — stub a minimal 2d context so the
     *  only thing gating the loop is `hasFx`, not the environment. */
    const fakeCtx = {
      clearRect: () => undefined,
      createRadialGradient: () => ({ addColorStop: () => undefined }),
      beginPath: () => undefined,
      arc: () => undefined,
      fill: () => undefined,
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    };
    const ctxStub = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => fakeCtx as unknown as CanvasRenderingContext2D);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    render(<AmbientLayer reducedMotion={false} effects={[]} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(rafSpy).not.toHaveBeenCalled();

    render(<AmbientLayer reducedMotion={false} effects={[{ type: 'dust', count: 4 }]} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(rafSpy).toHaveBeenCalled();
    rafSpy.mockRestore();
    ctxStub.mockRestore();
  });
});

describe('ambient layer — PLAN-052 showcase fx types', () => {
  /* A mock 2d context that records the op sequence — jsdom has no
   *  rasterizer, so the invariant is checked on the op stream. */
  const recordCtx = () => {
    const ops: string[] = [];
    const ctx = {
      createRadialGradient: (...a: number[]) => {
        ops.push(`radial:${a.join(',')}`);
        return { addColorStop: (o: number, c: string) => void ops.push(`stop:${o}:${c}`) };
      },
      createLinearGradient: (...a: number[]) => {
        ops.push(`linear:${a.join(',')}`);
        return { addColorStop: (o: number, c: string) => void ops.push(`stop:${o}:${c}`) };
      },
      beginPath: () => void ops.push('begin'),
      arc: () => void ops.push('arc'),
      ellipse: () => void ops.push('ellipse'),
      fill: () => void ops.push('fill'),
      moveTo: () => void ops.push('move'),
      lineTo: () => void ops.push('line'),
      quadraticCurveTo: () => void ops.push('quad'),
      closePath: () => void ops.push('close'),
      stroke: () => void ops.push('stroke'),
      save: () => void ops.push('save'),
      restore: () => void ops.push('restore'),
      translate: () => void ops.push('translate'),
      rotate: () => void ops.push('rotate'),
      scale: () => void ops.push('scale'),
      drawImage: () => void ops.push('drawImage'),
      clearRect: () => void ops.push('clear'),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;
    return { ctx, ops };
  };
  const view = {
    toX: (x: number) => x * 960,
    toY: (y: number) => y * 400,
    lenY: (y: number) => y * 400,
  };
  const fx: AmbientFx[] = [
    { type: 'glint', at: [0.5, 0.6], period: 2, a: 0.8, r: 0.008, color: '#fff4d0' },
    { type: 'fireflies', band: [0.3, 0.42], xband: [0, 1], count: 6, a: 0.35, color: '#d8f27a' },
    { type: 'moths', at: [0.7, 0.5], r: 0.035, count: 3, speed: 1, color: '#e8dcc0' },
    { type: 'shaft', from: [0.6, 0.05], to: [0.55, 0.55], width: 0.12, count: 3, a: 0.1, color: '#fff2cc' },
    { type: 'leaves', band: [0.05, 0.9], xband: [0.1, 0.9], count: 9, speed: 1, a: 0.8, color: '#c99b46' },
    { type: 'rain', band: [0.0, 1.0], count: 60, lean: 0.08, speed: 1, a: 0.35, color: '#b8ccd8' },
    { type: 'plate', src: '/assets/plates/t.webp', frames: 12, at: [0.4, 0.6], w: 0.12, h: 0.1, fps: 10 },
  ];
  const puffsFor = (key: string, n: number) => seeded(7 + key.length, n);

  // INV:ambient-layer.INV-2
  it('emits canvas ops for the new types and restores source-over (INV:ambient-layer.INV-2)', () => {
    const { ctx, ops } = recordCtx();
    /* Scan several clock values — glint and fireflies gate their draw on
     *  a blink cycle, so no single t shows every type at once. */
    /* Plate strips never finish loading in jsdom — inject a stub. */
    plateCache.set('/assets/plates/t.webp', { complete: true, naturalWidth: 1700, naturalHeight: 120 } as HTMLImageElement);
    for (let t = 0; t < 8; t += 0.5) {
      drawAmbientFrame(ctx, 960, 400, t, view, fx, puffsFor);
    }
    expect(ops.some((o) => o.startsWith('linear:'))).toBe(true); // shaft fan gradients
    expect(ops.filter((o) => o === 'drawImage').length).toBeGreaterThan(0); // plate cels
    /* Glint is a round twinkle (core + halo arcs) — the four-point cross
     * flare was removed after reading as random luminous crosses. */
    expect(ops.filter((o) => o === 'arc').length).toBeGreaterThan(0); // soft dots drawn
    expect(ops.filter((o) => o === 'quad').length).toBeGreaterThan(0); // leaf blades
    expect(ops.filter((o) => o === 'stroke').length).toBeGreaterThan(0); // rain streaks
    expect(ctx.globalCompositeOperation).toBe('source-over');
  });

  // INV:ambient-layer.INV-2
  it('is a pure function of the clock — same t, same op stream (INV:ambient-layer.INV-2)', () => {
    const a = recordCtx();
    const b = recordCtx();
    drawAmbientFrame(a.ctx, 960, 400, 3.7, view, fx, puffsFor);
    drawAmbientFrame(b.ctx, 960, 400, 3.7, view, fx, puffsFor);
    expect(a.ops).toEqual(b.ops);
    /* A different clock produces a different stream — not a stale frame. */
    const c = recordCtx();
    drawAmbientFrame(c.ctx, 960, 400, 4.9, view, fx, puffsFor);
    expect(c.ops).not.toEqual(a.ops);
  });
});
