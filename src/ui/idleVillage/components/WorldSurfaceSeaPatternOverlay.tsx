import { useCallback, useEffect, useRef } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';
import { TEXTURE_EDGE_LIMIT_PX } from '../hooks/useFrameMetrics';

const PATTERN_SRC = '/assets/world/wanderlust/base/layers/sea_pattern_tile.png';
const MASK_SRC = '/assets/atmosphere/terrain/sea_mask.webp';
export const SEA_PATTERN_CONFIG_SRC = '/world-surface-sea-pattern-config.json';

/**
 * The world canvas (4240x2828) is wider than `TEXTURE_EDGE_LIMIT_PX` — the same
 * WebKit compositing ceiling `WorldSurfaceSeaRipple` documents ("fails blank
 * rather than throwing"). A `<canvas>` backing store sized 1:1 to the world hit
 * exactly that: the pattern rendered in some regions and silently dropped out in
 * others, with no error anywhere. Half the ceiling leaves headroom and is still
 * 2x oversampled at the map's default zoom (~0.24), so nothing is lost visually.
 */
const MAX_CANVAS_EDGE_PX = TEXTURE_EDGE_LIMIT_PX / 2;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// No camera uniforms here on purpose: this canvas is mounted INSIDE the world box
// (the div the renderer pans/zooms with `transform: translate(...) scale(zoom)`),
// so it is already in world space — one canvas backing-store px is one world px.
// The previous version lived OUTSIDE the world box as a viewport-sized sibling and
// re-derived world position from `camera.panX/panY/zoom` by hand; that put it in a
// stacking context the renderer's internal z-index band (frame, border, clouds...)
// could never reach, so no z-index value assigned to it could ever land BELOW the
// frame or the border layers — a sibling with its own stacking context is compared
// to the renderer's root as a single opaque unit, not to the layers inside it.
const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform float uDpr;
uniform float uWorldHeight;
uniform float uTime;
uniform sampler2D uPatternTex;
uniform float uPatternScale;
uniform float uLineOpacity;
uniform vec3 uLineColor;
uniform bool uMotionEnabled;
uniform float uMotionAmount;
uniform float uMotionPeriod;
uniform vec2 uMotionDir;

void main() {
  // gl_FragCoord has its origin bottom-left with Y up; every other layer here
  // (the mask, the DOM layers) is authored top-left with Y down, so the Y axis
  // is flipped on the way in to keep "motion angle" meaning the same as before.
  vec2 worldPx = vec2(gl_FragCoord.x / uDpr, uWorldHeight - gl_FragCoord.y / uDpr);

  vec2 motionOffset = vec2(0.0);
  if (uMotionEnabled && uMotionPeriod > 0.0) {
    float phase = uTime * 6.2831853 / uMotionPeriod;
    motionOffset = uMotionDir * uMotionAmount * sin(phase);
  }

  vec2 uv = (worldPx + motionOffset) / uPatternScale;
  vec4 tex = texture(uPatternTex, uv);

  outColor = vec4(uLineColor, tex.a * uLineOpacity);
}
`;

export interface SeaPatternConfig {
  patternScale: number;
  lineOpacity: number;
  lineWidth: number;
  lineColor: string;
  baseColor: string;
  motionEnabled: boolean;
  motionAmount: number;
  motionPeriod: number;
  motionAngle: number;
}

/**
 * Tuned live on the real map and locked in as the shipped default. `patternScale`
 * and `motionAngle` are kept out of the authored-preset override below on
 * purpose: a fetched preset should not un-do a default the Director set
 * explicitly by dragging the sliders on the actual map.
 */
export const DEFAULT_SEA_PATTERN_CONFIG: SeaPatternConfig = {
  patternScale: 1150,
  lineOpacity: 0.2,
  lineWidth: 1,
  motionAmount: 20,
  motionPeriod: 9,
  motionAngle: 200,
  lineColor: '#8bbac2',
  baseColor: '#0b5c6b',
  motionEnabled: true,
};

export interface WorldSurfaceSeaPatternOverlayProps {
  active: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
  config?: SeaPatternConfig;
  onError?: (message: string) => void;
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Sea surface line pattern — the WebGL "authored texture / micro scroll" variant
 * from `/sea-effect-lab`. Canvas-only: the live-tuning panel lives at the page
 * level (`WorldSurfaceSeaPatternPanel`) so it can stay fixed in the viewport while
 * this canvas pans and zooms with the map.
 */
export function WorldSurfaceSeaPatternOverlay({
  active,
  canvasSize,
  zIndex,
  config = DEFAULT_SEA_PATTERN_CONFIG,
  onError,
}: WorldSurfaceSeaPatternOverlayProps) {
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const locRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const textureRef = useRef<WebGLTexture | null>(null);
  const startTRef = useRef(performance.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** World px per canvas backing-store px — see `MAX_CANVAS_EDGE_PX` above. */
  const worldPerCanvasPxRef = useRef(1);

  const setupWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      onError?.('WebGL2 not available');
      return false;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.error('[sea-pattern] shader compile:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error('[sea-pattern] program link:', gl.getProgramInfoLog(program));
      return false;
    }

    gl.useProgram(program);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    locRef.current = {
      dpr: u('uDpr'),
      worldHeight: u('uWorldHeight'),
      time: u('uTime'),
      patternTex: u('uPatternTex'),
      patternScale: u('uPatternScale'),
      lineOpacity: u('uLineOpacity'),
      lineColor: u('uLineColor'),
      motionEnabled: u('uMotionEnabled'),
      motionAmount: u('uMotionAmount'),
      motionPeriod: u('uMotionPeriod'),
      motionDir: u('uMotionDir'),
    };

    programRef.current = program;
    glRef.current = gl;

    const tex = gl.createTexture();
    if (tex) {
      textureRef.current = tex;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
      };
      img.onerror = () => onError?.('Failed to load pattern texture');
      img.src = PATTERN_SRC;
    }

    return true;
  }, [onError]);

  // Canvas backing store is capped at `MAX_CANVAS_EDGE_PX` on its longer edge —
  // NOT the world canvas size at 1x — to stay under the compositing ceiling. CSS
  // (`width/height: 100%` below) stretches it back up to the full world box; the
  // shader compensates with `worldPerCanvasPxRef` so the pattern still measures
  // out in true world px regardless of this internal resolution.
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;
    const longEdge = Math.max(canvasSize.width, canvasSize.height);
    const scale = Math.min(1, MAX_CANVAS_EDGE_PX / longEdge);
    const targetWidth = Math.round(canvasSize.width * scale);
    const targetHeight = Math.round(canvasSize.height * scale);
    worldPerCanvasPxRef.current = canvasSize.width / targetWidth;
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }, [canvasSize.width, canvasSize.height]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const loc = locRef.current;
    if (!gl || !program) return;

    const cfg = configRef.current;
    const rad = (cfg.motionAngle * Math.PI) / 180;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform1f(loc.dpr, 1 / worldPerCanvasPxRef.current);
    gl.uniform1f(loc.worldHeight, canvasSize.height);
    gl.uniform1f(loc.time, (performance.now() - startTRef.current) / 1000);
    gl.uniform1i(loc.patternTex, 0);
    gl.uniform1f(loc.patternScale, cfg.patternScale);
    gl.uniform1f(loc.lineOpacity, cfg.lineOpacity);
    gl.uniform3fv(loc.lineColor, hexToRgb01(cfg.lineColor));
    const motionEnabled = cfg.motionEnabled && !reducedMotionRef.current;
    gl.uniform1i(loc.motionEnabled, motionEnabled ? 1 : 0);
    gl.uniform1f(loc.motionAmount, cfg.motionAmount);
    gl.uniform1f(loc.motionPeriod, cfg.motionPeriod);
    gl.uniform2f(loc.motionDir, Math.cos(rad), Math.sin(rad));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, [canvasSize.height]);

  // setInterval, not requestAnimationFrame: rAF is throttled to nothing on a
  // hidden document (e.g. this component previewed in an inactive browser tab),
  // which read as "the pattern doesn't move" even though motion was enabled and
  // correctly configured. A timer keeps ticking regardless of tab visibility.
  useEffect(() => {
    if (!active) return;
    if (!glRef.current && !setupWebGL()) return;
    resize();
    render();
    intervalRef.current = setInterval(render, 1000 / 30);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, setupWebGL, resize, render]);

  useEffect(() => {
    resize();
  }, [resize]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        maskImage: `url(${MASK_SRC})`,
        WebkitMaskImage: `url(${MASK_SRC})`,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskPosition: '0 0',
        WebkitMaskPosition: '0 0',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}

export default WorldSurfaceSeaPatternOverlay;
