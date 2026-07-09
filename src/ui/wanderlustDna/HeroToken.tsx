/**
 * Wanderlust DNA — Componente 1: Il Gettone Eroe (V2)
 *
 * - Geometry: CSS clip-path polygon with seeded radial jitter → hand-struck
 *   bronze coin, never a perfect circle.
 * - 2.5D parallax (WebGL): two layers under the glass — constellation plate
 *   at factor 0.05, hero portrait at 0.02 — driven by normalized pointer
 *   coords on hover and by drag impulses via the imperative `kick()` handle.
 * - The rAF loop runs ONLY while the offset is settling; it self-suspends
 *   when |current - target| < epsilon (Steam Deck friendly).
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  buildProgram,
  createGlContext,
  fitCanvasToBox,
  uploadCanvasTexture,
  type GlBundle,
} from './webglUtils';
import { makeConstellationTexture, makePortraitTexture, mulberry32 } from './proceduralTextures';

const TOKEN_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uBack;   // constellation plate (deep layer)
uniform sampler2D uFront;  // hero portrait (near layer, alpha)
uniform vec2 uParallax;    // smoothed pointer offset, ~[-1, 1]

void main() {
  // Depth stack: background drifts 0.05, portrait 0.02 — the differential
  // is what sells the "under the surface" reading.
  vec2 uvBack = vUv + uParallax * 0.05;
  vec2 uvFront = vUv + uParallax * 0.02;
  vec3 back = texture2D(uBack, uvBack).rgb;
  vec4 front = texture2D(uFront, uvFront);
  vec3 col = back * (1.0 - front.a) + front.rgb;

  // Curved-glass shading: rim occlusion + a specular kiss that slides
  // opposite the parallax, like light on a domed cabochon.
  vec2 c = vUv - 0.5;
  float d = length(c);
  col *= 1.0 - smoothstep(0.30, 0.52, d) * 0.55;
  float spec = pow(max(0.0, 1.0 - length(c + uParallax * 0.18 - vec2(-0.16, -0.18)) * 2.1), 6.0);
  col += vec3(0.92, 0.84, 0.62) * spec * 0.18;

  gl_FragColor = vec4(col, 1.0);
}
`;

/** Seeded jittered polygon → hand-struck coin edge, as a CSS clip-path. */
function coinClipPath(points: number, baseRadius: number, jitter: number, seed: number): string {
  const rnd = mulberry32(seed);
  const pts: string[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const r = baseRadius + (rnd() * 2 - 1) * jitter;
    const x = 50 + Math.cos(angle) * r;
    const y = 50 + Math.sin(angle) * r;
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

export interface HeroTokenHandle {
  /** Feed a drag impulse (px deltas); decays on its own like heavy inertia. */
  kick: (dxPx: number, dyPx: number) => void;
}

export interface HeroTokenProps {
  /** Deterministic seed: same hero → same coin die. */
  seed?: number;
  size?: number;
  name: string;
}

export const HeroToken = forwardRef<HeroTokenHandle, HeroTokenProps>(function HeroToken(
  { seed = 42, size = 128, name },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bundleRef = useRef<GlBundle | null>(null);

  // Parallax state lives in refs — zero React re-renders per pointer move.
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const impulseModeRef = useRef(false);
  const rafRef = useRef(0);

  const outerClip = useMemo(() => coinClipPath(26, 48.5, 1.5, seed), [seed]);
  const innerClip = useMemo(() => coinClipPath(26, 48.5, 1.1, seed + 1), [seed]);

  const renderFrame = () => {
    const bundle = bundleRef.current;
    if (!bundle) return;
    const { gl, uniforms } = bundle;
    gl.uniform2f(uniforms.uParallax, currentRef.current.x, currentRef.current.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const tick = () => {
    const cur = currentRef.current;
    const tgt = targetRef.current;
    cur.x += (tgt.x - cur.x) * 0.14;
    cur.y += (tgt.y - cur.y) * 0.14;
    if (impulseModeRef.current) {
      // Drag impulses decay like a mass settling under damping.
      tgt.x *= 0.86;
      tgt.y *= 0.86;
    }
    renderFrame();

    const settled =
      Math.abs(tgt.x - cur.x) < 0.001 &&
      Math.abs(tgt.y - cur.y) < 0.001 &&
      Math.abs(tgt.x) < 0.001 &&
      Math.abs(tgt.y) < 0.001;
    if (settled) {
      rafRef.current = 0; // loop self-suspends: zero GPU cost at rest
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const wake = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({
    kick(dxPx: number, dyPx: number) {
      impulseModeRef.current = true;
      const tgt = targetRef.current;
      tgt.x = Math.max(-1, Math.min(1, tgt.x + dxPx * 0.05));
      tgt.y = Math.max(-1, Math.min(1, tgt.y + dyPx * 0.05));
      wake();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const gl = createGlContext(canvas);
    if (!gl) return; // WebGL unavailable → static bronze coin (CSS still renders)

    fitCanvasToBox(canvas, root);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const bundle = buildProgram(gl, TOKEN_FRAGMENT_SHADER, ['uBack', 'uFront', 'uParallax']);
    if (!bundle) return;
    bundleRef.current = bundle;

    uploadCanvasTexture(gl, 0, makeConstellationTexture(512, seed));
    uploadCanvasTexture(gl, 1, makePortraitTexture(512, seed + 100));
    gl.uniform1i(bundle.uniforms.uBack, 0);
    gl.uniform1i(bundle.uniforms.uFront, 1);
    gl.uniform2f(bundle.uniforms.uParallax, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6); // single static frame at rest

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      bundleRef.current = null;
    };
  }, [seed]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    impulseModeRef.current = false;
    targetRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    targetRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    wake();
  };

  const handlePointerLeave = () => {
    impulseModeRef.current = false;
    targetRef.current.x = 0;
    targetRef.current.y = 0;
    wake();
  };

  return (
    <div
      ref={rootRef}
      className="wdna-token"
      style={{ width: size, height: size, clipPath: outerClip }}
      title={name}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Bronze die face: struck-metal gradients under the glass cell */}
      <div className="wdna-token__rim" aria-hidden />
      <div className="wdna-token__face" style={{ clipPath: innerClip }}>
        <canvas ref={canvasRef} className="wdna-token__glass" aria-hidden />
      </div>
    </div>
  );
});
