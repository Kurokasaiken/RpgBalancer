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

import React, { useEffect, useRef, useState } from 'react';
import { Application, Assets, Mesh, MeshGeometry, Shader, Texture } from 'pixi.js';
import 'pixi.js/mesh';
import { KEEP_GLOBAL_RESOURCES } from '../../pixiSpike/pixiDestroy';
import { DEPTH_FRAG, DEPTH_VERT } from '@/ui/idleVillage/questS1Lab/render/depthShader';
import {
  cameraAt,
  domTransform,
  shaderUniforms,
  THEATER_ANCHOR,
} from '@/ui/idleVillage/questS1Lab/render/depthTransform';
import { documentClock, type CameraClock } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import type { CameraShot, QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

export interface DepthSceneProps {
  src: string;
  depthSrc: string;
  imgAspect: number;
  /** Live view aspect (host w/h). */
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
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  /** Live refs for the ticker — props must never rebuild the app. */
  const live = useRef({ shot, shotEpoch, viewAspect, ampMul });
  live.current = { shot, shotEpoch, viewAspect, ampMul };
  const [gpuReady, setGpuReady] = useState(false);

  /* DOM fallback camera — the same resolved shot, CSS space. Runs whenever
   * the canvas isn't covering the image (init, failure, context loss). */
  useEffect(() => {
    if (reducedMotion || gpuReady) return undefined;
    const el = imgRef.current;
    if (!el) return undefined;
    let raf = 0;
    const tick = () => {
      const state = cameraAt(live.current.shot, clock() - live.current.shotEpoch);
      const t = domTransform(state, cfg, imgAspect, live.current.viewAspect);
      el.style.transform = `translate(${t.txPct}%, ${t.tyPct}%) scale(${t.scale})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, gpuReady, cfg, imgAspect, clock]);

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
      // 3168px source sampled into a ~960px window: without mipmaps the
      // single bilinear tap aliases badly (and shimmers under camera motion).
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
          },
        },
      });
      const mesh = new Mesh({ geometry: unitQuad(), shader });
      app.stage.addChild(mesh);
      canvasHost.appendChild(app.canvas);

      const u = shader.resources.u.uniforms;
      app.ticker.add(() => {
        const { shot: s, shotEpoch: epoch, viewAspect: va, ampMul: am } = live.current;
        const state = cameraAt(s, clock() - epoch);
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
        mesh.scale.set(app!.screen.width, app!.screen.height);
      });
      // First real frame rendered → the canvas may cover the image.
      app.ticker.addOnce(() => {
        if (!cancelled && !lost) setGpuReady(true);
      });
    };

    boot().catch(() => {
      if (!cancelled) {
        setGpuReady(false);
        onFallback?.('webgl-init');
      }
    });

    return () => {
      cancelled = true;
      if (app) {
        app.canvas.removeEventListener('webglcontextlost', onLost);
        app.destroy(KEEP_GLOBAL_RESOURCES);
        app = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, depthSrc, reducedMotion, cfg, imgAspect, clock]);

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
    </div>
  );
};
