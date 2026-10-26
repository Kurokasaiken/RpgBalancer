/**
 * DepthScene — the quest theater's depth-parallax renderer (PLAN-046 slice 1).
 *
 * Contract (artifact-r011 C2):
 *   - the DOM `<img>` is ALWAYS mounted underneath — it is the picture;
 *   - the Pixi canvas appears only after its first valid frame;
 *   - reduced-motion, missing depth config, WebGL init failure and
 *     `webglcontextlost` all leave the DOM image visible — the canvas is
 *     hidden without remounting anything;
 *   - DOM fallback and GPU uniforms read the SAME camera state from the
 *     SAME clock — the two paths cannot drift apart.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Application, Assets, Mesh, MeshGeometry, Shader, Texture } from 'pixi.js';
import 'pixi.js/mesh';
import { KEEP_GLOBAL_RESOURCES } from '../../pixiSpike/pixiDestroy';
import { DEPTH_FRAG, DEPTH_VERT } from '@/ui/idleVillage/questS1Lab/render/depthShader';
import {
  cameraAt,
  cameraAtWithPostSettle,
  cameraHasTemporalWork,
  domTransform,
  shaderUniforms,
  THEATER_ANCHOR,
} from '@/ui/idleVillage/questS1Lab/render/depthTransform';
import { documentClock, type CameraClock } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import { composeTrauma, traumaAt } from '@/ui/idleVillage/questS1Lab/render/trauma';
import { AmbientLayer } from '@/ui/idleVillage/questS1Lab/render/AmbientLayer';
import { AtmosphereLayer } from '@/ui/idleVillage/questS1Lab/render/AtmosphereLayer';
import { fogMaskForDepth } from '@/ui/idleVillage/questS1Lab/render/atmosphereOverlay';
import type { AmbientFx } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import type { CameraShot, QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

export interface DepthSceneProps {
  src: string;
  depthSrc: string;
  imgAspect: number;
  /** Seed view aspect (host w/h) — superseded by the measured box once the
   *  mount-time measurement lands (R-242: the theatre is the plaque's
   *  shrink reservoir, so the authored ratio is only the *preferred* one;
   *  the real box can crush far past it and the camera must follow). */
  viewAspect: number;
  /** Per-scene amplitude multiplier, already folded into the certified bound. */
  ampMul?: number;
  /** The resolved shot and the clock-time it started. */
  shot: CameraShot;
  shotEpoch: number;
  cfg: QuestDepthFx;
  reducedMotion: boolean;
  alt?: string;
  /** Dev-only: why the GPU path was abandoned. */
  onFallback?: (reason: 'webgl-init' | 'context-lost' | 'no-webgl') => void;
  clock?: CameraClock;
  /** Ambient overlay — the "life after the shot lands" layer. */
  ambient?: boolean;
  /** Per-scene FX list (manifest `ambient`); defaults to bare dust motes. */
  ambientFx?: AmbientFx[];
  /** PLAN-050 T-013 — asset-backed atmosphere overlay kit ids
   *  (manifest `atmosphere`); DOM sprites riding the camera window. */
  atmosphere?: string[];
  /** PLAN-050 §4 — trauma shake channel: clock-time the trauma was
   *  injected plus its strength (0..1). Composed post-`cameraAt`, so
   *  authored shots are never corrupted. */
  traumaEpoch?: number | null;
  traumaStrength?: number;
  /** Lab-only: horizontally tileable plate — the shader wraps x instead
   *  of clamping, so an unbounded camVec scrolls each depth plane at its
   *  own speed forever (train-window parallax). */
  wrap?: boolean;
}

/** Shared object-position/transform-origin anchor (50% 40% — see THEATER_ANCHOR). */
const anchorPct = `${THEATER_ANCHOR[0] * 100}% ${THEATER_ANCHOR[1] * 100}%`;

/** Unit quad — the vertex shader maps it straight to clip space via the mvp uniforms. */
const unitQuad = () =>
  new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });

export const DepthScene: React.FC<DepthSceneProps> = ({
  src,
  depthSrc,
  imgAspect,
  viewAspect,
  ampMul = 1,
  shot,
  shotEpoch,
  cfg,
  reducedMotion,
  alt = '',
  onFallback,
  clock = documentClock,
  ambient = false,
  ambientFx,
  atmosphere,
  traumaEpoch = null,
  traumaStrength = 0,
  wrap = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  /* R-242 — the camera must see the box it actually renders in. The prop
   *  is the authored *preferred* aspect (`aspectRatio` on the frame); flex
   *  shrink overrides it (observed 3.85:1 at the 190px floor vs the 2.4
   *  prop). Feeding the prop to `coverFit` made the GPU window and the DOM
   *  cover underneath disagree — the picture visibly reframed when the
   *  canvas faded in on every mount, and the DOM pan math was computed
   *  against a shape the box never had. Measured wins; prop is the seed. */
  const [measuredAspect, setMeasuredAspect] = useState<number | null>(null);
  const liveAspect = measuredAspect ?? viewAspect;
  /** Live refs for the ticker — props must never rebuild the app. */
  const live = useRef({ shot, shotEpoch, viewAspect: liveAspect, ampMul, traumaEpoch, traumaStrength, clock, ambient, wrap });
  live.current = { shot, shotEpoch, viewAspect: liveAspect, ampMul, traumaEpoch, traumaStrength, clock, ambient, wrap };

  /* Measure the host before the first paint, then keep the camera in sync
   *  on every resize (the cluster's width transitions included — the
   *  window re-samples correctly mid-animation instead of reframing after
   *  the fact). Runs before the DOM-fallback layout effect below so the
   *  first painted frame is already composed for the real box. The same
   *  observer also re-arms a parked ticker: the resize plugin resizes the
   *  framebuffer on its own, but with the ticker stopped nothing renders. */
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const measure = () => {
      const r = host.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setMeasuredAspect(r.width / r.height);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      measure();
      settledRef.current = false;
      const app = appRef.current;
      if (app && !app.ticker.started) app.ticker.start();
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);
  /** The mounted Pixi app — lets prop changes wake an idle-stopped ticker
   *  without rebuilding it (PLAN-050 T-011). */
  const appRef = useRef<Application | null>(null);
  /** Set once the landed frame has been rendered — the next tick stops. */
  const settledRef = useRef(false);
  const [gpuReady, setGpuReady] = useState(false);
  /** Trauma evaluation for this frame — null when inactive. */
  const traumaNow = (now: number) => {
    const { traumaEpoch: te, traumaStrength: ts } = live.current;
    if (te == null || ts <= 0) return null;
    return traumaAt(now - te, ts, cfg.trauma);
  };

  /* DOM fallback camera — the same resolved shot, CSS space. Runs whenever
   * the canvas isn't covering the image (init, failure, context loss).
   * PLAN-050 T-011: renders the landed frame once then stops — the loop
   * re-arms only when a prop that can move the camera changes.
   * useLayoutEffect + an immediate first tick: the img IS the picture
   * until the GPU covers it (contract above) — painting it untransformed
   * for the first frames was the raw-cover flash seen on every mount. */
  useLayoutEffect(() => {
    if (reducedMotion || gpuReady) return undefined;
    const el = imgRef.current;
    if (!el) return undefined;
    let raf = 0;
    const tick = () => {
      const elapsed = live.current.clock() - live.current.shotEpoch;
      const postSettleOn = live.current.ambient && cfg.postSettle.enabled;
      const authored = postSettleOn
        ? cameraAtWithPostSettle(live.current.shot, elapsed, cfg.postSettle)
        : cameraAt(live.current.shot, elapsed);
      const tr = traumaNow(live.current.clock());
      const state = tr ? composeTrauma(authored, tr, cfg.trauma) : authored;
      const t = domTransform(state, cfg, imgAspect, live.current.viewAspect);
      const rollDeg = tr ? (tr.roll * cfg.trauma.domScale * 180) / Math.PI : 0;
      el.style.transform = `translate(${t.txPct}%, ${t.tyPct}%) scale(${t.scale}) rotate(${rollDeg.toFixed(3)}deg)`;
      el.style.filter = state.blur > 0.05 ? `blur(${state.blur.toFixed(2)}px)` : '';
      /* Settled (landed shot, expired trauma, and no post-settle breathing):
       *  the frame just applied is the constant end state — don't schedule another tick. */
      if (cameraHasTemporalWork(live.current.shot, elapsed, tr, postSettleOn)) {
        raf = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, gpuReady, cfg, imgAspect, shot, shotEpoch, liveAspect, ampMul, traumaEpoch, traumaStrength]);

  /* GPU path — one Application per mounted scene (artifact-r011). */
  useEffect(() => {
    if (reducedMotion || !cfg.enabled) return undefined;
    const host = hostRef.current;
    const canvasHost = canvasHostRef.current;
    if (!host || !canvasHost) return undefined;
    if (typeof WebGL2RenderingContext === 'undefined') {
      onFallback?.('no-webgl');
      return undefined;
    }

    let cancelled = false;
    let app: Application | null = null;
    let lost = false;
    const onLost = (ev: Event) => {
      ev.preventDefault();
      lost = true;
      setGpuReady(false);
      onFallback?.('context-lost');
    };

    const boot = async () => {
      const [sceneTex, depthTex] = await Promise.all([
        Assets.load(src) as Promise<Texture>,
        Assets.load(depthSrc) as Promise<Texture>,
      ]);
      if (cancelled) return;
      sceneTex.source.style.addressMode = 'clamp-to-edge';
      depthTex.source.style.addressMode = 'clamp-to-edge';
      // 3168px source sampled into a ~960px window: mipmaps keep the sharp
      // scene sample stable while the transient focus rack uses spatial taps.
      sceneTex.source.autoGenerateMipmaps = true;
      sceneTex.source.updateMipmaps();
      depthTex.source.autoGenerateMipmaps = true;
      depthTex.source.updateMipmaps();

      app = new Application();
      await app.init({
        resizeTo: host,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, cfg.dprCap),
        preference: 'webgl',
        backgroundAlpha: 0,
      });
      if (cancelled) {
        app.destroy(KEEP_GLOBAL_RESOURCES);
        return;
      }
      /* A non-GL fallback (canvas renderer) has no `mesh` pipe — the Mesh
       * would never draw and the transparent canvas would freeze the DOM
       * image underneath. Treat it exactly like a failed init. */
      const renderer = app.renderer as unknown as Record<string, unknown>;
      if (!('gl' in renderer) || !('mesh' in (renderer.renderPipes as Record<string, unknown>))) {
        app.destroy(KEEP_GLOBAL_RESOURCES);
        app = null;
        if (!cancelled) {
          setGpuReady(false);
          onFallback?.('webgl-init');
        }
        return;
      }
      app.canvas.addEventListener('webglcontextlost', onLost);

      const shader = Shader.from({
        gl: { vertex: DEPTH_VERT, fragment: DEPTH_FRAG },
        resources: {
          uScene: sceneTex.source,
          uDepth: depthTex.source,
          u: {
            uWinCenter: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
            uWinHalf: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
            uCamVec: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
            uAmpEff: { value: 0, type: 'f32' },
            uFocal: { value: cfg.focal, type: 'f32' },
            uEps: { value: cfg.epsilon, type: 'f32' },
            uBlurPx: { value: 0, type: 'f32' },
            uViewSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
            uTrauma: { value: new Float32Array([0, 0, 0]), type: 'vec3<f32>' },
            uTraumaW: {
              value: new Float32Array([cfg.trauma.bgWeight, cfg.trauma.fgWeight]),
              type: 'vec2<f32>',
            },
            uWrap: { value: 0, type: 'f32' },
          },
        },
      });
      const mesh = new Mesh({ geometry: unitQuad(), shader });
      app.stage.addChild(mesh);
      canvasHost.appendChild(app.canvas);

      const u = shader.resources.u.uniforms;
      app.ticker.add(() => {
        /* PLAN-050 T-011 — ticker idle-stop: once the landed frame has been
         *  rendered, stop the ticker until a camera-moving prop change or a
         *  host resize re-arms it (`wake` below). A settled camera renders
         *  a constant frame — ticking it is pure cost. */
        if (settledRef.current) {
          app!.ticker.stop();
          return;
        }
        const { shot: s, shotEpoch: epoch, viewAspect: va, ampMul: am, ambient: amb, wrap: wr } = live.current;
        const now = live.current.clock();
        const postSettleOn = amb && cfg.postSettle.enabled && (typeof document === 'undefined' || document.visibilityState !== 'hidden');
        const authored = postSettleOn
          ? cameraAtWithPostSettle(s, now - epoch, cfg.postSettle)
          : cameraAt(s, now - epoch);
        const tr = traumaNow(now);
        const state = tr ? composeTrauma(authored, tr, cfg.trauma) : authored;
        const w = shaderUniforms(
          { ...state, ampMul: state.ampMul * am },
          cfg,
          imgAspect,
          va,
          THEATER_ANCHOR,
        );
        (u.uWinCenter as Float32Array)[0] = w.center[0];
        (u.uWinCenter as Float32Array)[1] = w.center[1];
        (u.uWinHalf as Float32Array)[0] = w.half[0];
        (u.uWinHalf as Float32Array)[1] = w.half[1];
        (u.uCamVec as Float32Array)[0] = w.camVec[0];
        (u.uCamVec as Float32Array)[1] = w.camVec[1];
        u.uAmpEff = w.ampEff;
        u.uBlurPx = state.blur;
        (u.uViewSize as Float32Array)[0] = Math.max(1, app!.screen.width);
        (u.uViewSize as Float32Array)[1] = Math.max(1, app!.screen.height);
        (u.uTrauma as Float32Array)[0] = tr ? tr.x : 0;
        (u.uTrauma as Float32Array)[1] = tr ? tr.y : 0;
        (u.uTrauma as Float32Array)[2] = tr ? tr.roll : 0;
        u.uWrap = wr ? 1 : 0;
        mesh.scale.set(app!.screen.width, app!.screen.height);
        /* The settled frame was just uploaded — one more tick is rendered,
         *  then the stop branch above parks the ticker. */
        if (!cameraHasTemporalWork(s, now - epoch, tr, postSettleOn)) settledRef.current = true;
      });
      // First real frame rendered → the canvas may cover the image.
      app.ticker.addOnce(() => {
        if (!cancelled && !lost) setGpuReady(true);
      });
      appRef.current = app;
    };

    boot().catch(() => {
      if (!cancelled) {
        setGpuReady(false);
        onFallback?.('webgl-init');
      }
    });

    return () => {
      cancelled = true;
      /* init() still in flight: `app.canvas`/`app.destroy` dereference
       * `this.renderer`, which autoDetectRenderer assigns only when the
       * awaited init resolves — touching either pre-init throws inside Pixi
       * ("reading 'canvas'"). The `cancelled` check right after init() in
       * boot() owns the destroy in that window. */
      if (app && app.renderer) {
        app.canvas.removeEventListener('webglcontextlost', onLost);
        app.destroy(KEEP_GLOBAL_RESOURCES);
        app = null;
      }
      appRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, depthSrc, reducedMotion, cfg, imgAspect]);

  /* PLAN-050 T-011 — ticker idle-stop re-arm: a prop that can move the
   *  camera (new shot/epoch, trauma injection, aspect/amp change) wakes a
   *  parked ticker for the next frames; the tick callback re-settles. */
  useEffect(() => {
    settledRef.current = false;
    const app = appRef.current;
    if (app && !app.ticker.started) app.ticker.start();
  }, [shot, shotEpoch, liveAspect, ampMul, traumaEpoch, traumaStrength]);

  return (
    <div ref={hostRef} data-testid="depth-scene" style={{ position: 'absolute', inset: 0 }}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: anchorPct,
          transformOrigin: anchorPct,
        }}
      />
      <div
        ref={canvasHostRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          opacity: gpuReady ? 1 : 0,
          transition: 'opacity 240ms ease-out',
          pointerEvents: 'none',
        }}
      />
      {ambient && (
        <AmbientLayer
          reducedMotion={reducedMotion}
          clock={clock}
          seed={src.length}
          effects={ambientFx}
          shot={shot}
          shotEpoch={shotEpoch}
          traumaEpoch={traumaEpoch}
          traumaStrength={traumaStrength}
          cfg={cfg}
          imgAspect={imgAspect}
          viewAspect={liveAspect}
        />
      )}
      {atmosphere && atmosphere.length > 0 && (
        <AtmosphereLayer
          ids={atmosphere}
          reducedMotion={reducedMotion}
          clock={clock}
          seed={src.length}
          fogMask={fogMaskForDepth(depthSrc)}
          shot={shot}
          shotEpoch={shotEpoch}
          traumaEpoch={traumaEpoch}
          traumaStrength={traumaStrength}
          cfg={cfg}
          imgAspect={imgAspect}
          viewAspect={liveAspect}
        />
      )}
    </div>
  );
};
