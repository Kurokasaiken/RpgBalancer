/**
 * Wanderlust DNA — Componente 2: Slot Circolare + Snap (V2)
 *
 * - Lock ring ("ghiera"): SVG bronze bezel with machined ticks; on lock it
 *   twists 45° with a hard-metal ease.
 * - Micro-shudder: 1.5px Y-axis quake for 60ms on the whole slot at the
 *   moment of engagement (weight transfer into the chassis).
 * - Anisotropic flash (WebGL): NOT a white opacity fade — a razor specular
 *   lobe (brightness+contrast spike) that sweeps once around the golden rim
 *   and dies in 80ms. The shader runs exactly for those 80ms, then stops.
 */

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  buildProgram,
  createGlContext,
  fitCanvasToBox,
  type GlBundle,
} from './webglUtils';

const FLASH_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform float uSweep; // 0..1 progress over the 80ms life of the flash

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);

  // Confine energy to the golden rim band.
  float ring = smoothstep(0.315, 0.345, r) * (1.0 - smoothstep(0.455, 0.495, r));

  // One full clockwise revolution, starting at 12 o'clock.
  float theta = atan(p.y, p.x);
  float sweepAngle = -1.5707963 + uSweep * 6.2831853;
  // pow^28 → razor-thin anisotropic lobe, like sun catching a lathe mark.
  float lobe = pow(max(cos(theta - sweepAngle), 0.0), 28.0);

  float fade = 1.0 - uSweep;
  // Metallic spike: pushes past 1.0 (brightness) with a hard shoulder (contrast).
  vec3 gold = vec3(1.0, 0.87, 0.48);
  float energy = lobe * ring * fade;
  vec3 col = gold * energy * 2.4;
  float alpha = clamp(energy * 1.8, 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha); // premultiplied
}
`;

const FLASH_DURATION_MS = 80;
const SHUDDER_DURATION_MS = 60;

export interface SnapSlotHandle {
  /** Fire the full engagement FX: shudder + rim flash. Ring twist follows `locked`. */
  playLockFx: () => void;
}

export interface SnapSlotProps {
  size?: number;
  locked: boolean;
}

export const SnapSlot = forwardRef<SnapSlotHandle, SnapSlotProps>(function SnapSlot(
  { size = 176, locked },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bundleRef = useRef<GlBundle | null>(null);
  const rafRef = useRef(0);

  const ticks = useMemo(() => {
    const marks: React.ReactNode[] = [];
    for (let i = 0; i < 24; i++) {
      const major = i % 6 === 0;
      marks.push(
        <line
          key={i}
          x1="50"
          y1={major ? 3.2 : 4.6}
          x2="50"
          y2={major ? 8.4 : 7.2}
          stroke={major ? '#e8c96e' : '#8a6a33'}
          strokeWidth={major ? 1.6 : 0.9}
          transform={`rotate(${(i / 24) * 360} 50 50)`}
        />
      );
    }
    return marks;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    playLockFx() {
      const root = rootRef.current;
      const ring = ringRef.current;
      const canvas = canvasRef.current;

      // 1) Micro-shudder: retrigger-safe class flip (forces reflow to restart).
      if (root) {
        root.classList.remove('is-shuddering');
        void root.offsetWidth;
        root.classList.add('is-shuddering');
        window.setTimeout(() => root.classList.remove('is-shuddering'), SHUDDER_DURATION_MS + 20);
      }

      // 2) CSS brightness/contrast spike on the bronze itself.
      if (ring) {
        ring.classList.add('is-flashing');
        window.setTimeout(() => ring.classList.remove('is-flashing'), FLASH_DURATION_MS);
      }

      // 3) WebGL anisotropic sweep — lazy-init on first lock, 80ms loop only.
      if (canvas && rootRef.current) {
        if (!bundleRef.current) {
          const gl = createGlContext(canvas);
          if (gl) {
            fitCanvasToBox(canvas, rootRef.current);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            bundleRef.current = buildProgram(gl, FLASH_FRAGMENT_SHADER, ['uSweep']);
          }
        }
        const bundle = bundleRef.current;
        if (bundle) {
          const { gl, uniforms } = bundle;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          const t0 = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - t0) / FLASH_DURATION_MS, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            if (t < 1) {
              gl.uniform1f(uniforms.uSweep, t);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
              rafRef.current = requestAnimationFrame(step);
            } else {
              rafRef.current = 0; // flash spent — GPU idle again
            }
          };
          rafRef.current = requestAnimationFrame(step);
        }
      }
    },
  }));

  return (
    <div
      ref={rootRef}
      className={`wdna-slot${locked ? ' is-locked' : ''}`}
      style={{ width: size, height: size }}
    >
      {/* Static bezel seat */}
      <div className="wdna-slot__bezel" aria-hidden />
      {/* Recessed well the token drops into */}
      <div className="wdna-slot__well" aria-hidden />
      {/* Rotating machined ghiera */}
      <div ref={ringRef} className="wdna-slot__ring" aria-hidden>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <defs>
            <linearGradient id="wdna-ring-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f0d488" />
              <stop offset="0.35" stopColor="#a8843e" />
              <stop offset="0.62" stopColor="#5c4118" />
              <stop offset="1" stopColor="#8a6a33" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#wdna-ring-metal)" strokeWidth="6" />
          <circle cx="50" cy="50" r="42.4" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
          <circle cx="50" cy="50" r="49.2" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.2" />
          {ticks}
        </svg>
      </div>
      {/* Anisotropic flash overlay — only alive for 80ms per lock */}
      <canvas ref={canvasRef} className="wdna-slot__flash" aria-hidden />
    </div>
  );
});
