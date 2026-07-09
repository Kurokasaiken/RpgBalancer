/**
 * Wanderlust DNA — Componente 3: Pannello "La Lente" (V2)
 *
 * - Optical refraction (WebGL): the panel's glass samples the SAME scene
 *   texture that paints the stage background, warped by a spherical barrel
 *   distortion — details behind the panel appear magnified and curved at
 *   the edges, like looking through a navigator's loupe.
 * - Chromatic aberration: R/B channels split by ±1.5px, masked so it only
 *   bites on the extreme edge of the sphere.
 * - The shader renders ON DEMAND (mount / resize / reposition) — the lens is
 *   optically static, so there is NO continuous render loop at all.
 * - Text: Champlevé engraving via CSS text-shadow; stat numbers never change
 *   color — pass/fail is signaled by an adjacent square SVG gem
 *   (turquoise = success, amber = failure).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  buildProgram,
  createGlContext,
  fitCanvasToBox,
  uploadCanvasTexture,
  type GlBundle,
} from './webglUtils';

const LENS_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uScene;    // shared stage backdrop texture
uniform vec2 uPanelOffset;   // panel top-left in scene UV space
uniform vec2 uPanelScale;    // panel size in scene UV space
uniform vec2 uResolution;    // this canvas, in physical px
uniform float uZoom;         // magnification under the glass
uniform float uBarrel;       // barrel coefficient k (r' = r * (1 + k*r^2))

vec2 toScene(vec2 local) {
  return uPanelOffset + local * uPanelScale;
}

void main() {
  vec2 p = vUv - 0.5;
  // Aspect-corrected radius so the sphere stays spherical on a wide panel.
  vec2 pa = p * vec2(uResolution.x / uResolution.y, 1.0);
  float r2 = dot(pa, pa);
  float maxR = length(vec2(uResolution.x / uResolution.y, 1.0) * 0.5);
  float rNorm = sqrt(r2) / maxR;

  // Barrel distortion + magnification.
  vec2 warped = p * (1.0 + uBarrel * r2) / uZoom + 0.5;

  // Chromatic aberration: ±1.5px radial split, extreme edges only.
  float edge = smoothstep(0.55, 0.95, rNorm);
  vec2 dir = normalize(pa + vec2(1e-5));
  vec2 caLocal = dir * (1.5 / uResolution.x) * edge;

  float chR = texture2D(uScene, toScene(warped + caLocal)).r;
  float chG = texture2D(uScene, toScene(warped)).g;
  float chB = texture2D(uScene, toScene(warped - caLocal)).b;
  vec3 col = vec3(chR, chG, chB);

  // Smoked optical glass: dim + cool cast so engraved gold stays readable.
  col = col * 0.52 + vec3(0.015, 0.035, 0.05);
  // Inner falloff toward the frame.
  col *= 1.0 - smoothstep(0.62, 1.0, rNorm) * 0.4;

  gl_FragColor = vec4(col, 0.97);
}
`;

export interface LensStat {
  label: string;
  value: number;
  requirement: number;
}

export interface LensPanelProps {
  title: string;
  subtitle?: string;
  stats: LensStat[];
  /** The baked scene canvas that also paints the stage background. */
  sceneTexture: HTMLCanvasElement;
  /** Stage element whose background is `sceneTexture` at 100% 100%. */
  stageRef: React.RefObject<HTMLElement | null>;
  width?: number | string;
}

/** Square-cut gem indicator: turquoise = requirement met, amber = not met. */
function StatGem({ met }: { met: boolean }) {
  const fill = met ? '#3fe0c8' : '#e0a33c';
  const glow = met ? 'rgba(63, 224, 200, 0.75)' : 'rgba(224, 163, 60, 0.6)';
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className="wdna-lens__gem"
      style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
      aria-label={met ? 'requisito superato' : 'requisito mancante'}
      role="img"
    >
      <rect x="1.5" y="1.5" width="9" height="9" fill={fill} stroke="rgba(0,0,0,0.7)" strokeWidth="1" />
      <rect x="3.4" y="3.4" width="3.2" height="3.2" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

export function LensPanel({
  title,
  subtitle,
  stats,
  sceneTexture,
  stageRef,
  width = 340,
}: LensPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bundleRef = useRef<GlBundle | null>(null);

  const statRows = useMemo(
    () =>
      stats.map((stat) => ({
        ...stat,
        met: stat.value >= stat.requirement,
      })),
    [stats]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    if (!canvas || !panel) return;

    const gl = createGlContext(canvas);
    if (!gl) return; // graceful: CSS fallback background keeps text readable

    const bundle = buildProgram(gl, LENS_FRAGMENT_SHADER, [
      'uScene',
      'uPanelOffset',
      'uPanelScale',
      'uResolution',
      'uZoom',
      'uBarrel',
    ]);
    if (!bundle) return;
    bundleRef.current = bundle;
    uploadCanvasTexture(gl, 0, sceneTexture);
    gl.uniform1i(bundle.uniforms.uScene, 0);
    gl.uniform1f(bundle.uniforms.uZoom, 1.22);
    gl.uniform1f(bundle.uniforms.uBarrel, 0.34);

    // One-shot render: called on mount, resize, or layout shifts. No loop.
    const renderLens = () => {
      const stage = stageRef.current;
      if (!stage) return;
      fitCanvasToBox(canvas, panel);
      gl.viewport(0, 0, canvas.width, canvas.height);

      const stageRect = stage.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      gl.uniform2f(
        bundle.uniforms.uPanelOffset,
        (panelRect.left - stageRect.left) / stageRect.width,
        (panelRect.top - stageRect.top) / stageRect.height
      );
      gl.uniform2f(
        bundle.uniforms.uPanelScale,
        panelRect.width / stageRect.width,
        panelRect.height / stageRect.height
      );
      gl.uniform2f(bundle.uniforms.uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    renderLens();
    const observer = new ResizeObserver(renderLens);
    observer.observe(panel);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener('resize', renderLens);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', renderLens);
      bundleRef.current = null;
    };
  }, [sceneTexture, stageRef]);

  return (
    <div ref={panelRef} className="wdna-lens" style={{ width }}>
      <canvas ref={canvasRef} className="wdna-lens__glass" aria-hidden />
      <div className="wdna-lens__frame" aria-hidden />
      <div className="wdna-lens__content">
        <h3 className="wdna-lens__title wdna-engraved">{title}</h3>
        {subtitle && <p className="wdna-lens__subtitle wdna-engraved">{subtitle}</p>}
        <div className="wdna-lens__divider" aria-hidden />
        <ul className="wdna-lens__stats">
          {statRows.map((stat) => (
            <li key={stat.label} className="wdna-lens__stat-row">
              <span className="wdna-lens__stat-label wdna-engraved">{stat.label}</span>
              <span className="wdna-lens__stat-leader" aria-hidden />
              {/* The number NEVER changes color — the gem carries the verdict. */}
              <span className="wdna-lens__stat-value wdna-engraved">
                {stat.value}
                <span className="wdna-lens__stat-req">/{stat.requirement}</span>
              </span>
              <StatGem met={stat.met} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
