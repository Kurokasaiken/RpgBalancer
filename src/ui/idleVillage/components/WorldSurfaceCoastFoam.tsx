import { useCallback, useEffect, useRef } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';
import { TEXTURE_EDGE_LIMIT_PX } from '../hooks/useFrameMetrics';

const DIST_SRC = '/assets/atmosphere/terrain/coast_distance.webp';
const MAX_CANVAS_EDGE_PX = TEXTURE_EDGE_LIMIT_PX / 2;

/** Must match D_MAX in scripts/build-coast-distance.py. */
const D_MAX_WORLD_PX = 160;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// R = distance from the shore (world px / D_MAX), G = 1 over water.
// Crests travel toward the shore, thin out as they come in, and dissolve before they
// touch it: there is no standing band of foam along the coast. Value noise breaks the
// crests into ragged lace instead of clean bands.
const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform sampler2D uDist;
uniform vec2 uCanvas;
uniform vec2 uWorld;
uniform float uTime;
uniform float uDMax;
uniform vec3 uFoamColor;
uniform float uStrength;
uniform float uDissolveStart;
uniform float uDissolveEnd;
uniform float uCrestSpeed;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uCanvas;
  vec4 t = texture(uDist, uv);
  float water = smoothstep(0.45, 0.6, t.g);
  float d = t.r * uDMax;
  if (water < 0.01 || d > 130.0) { outColor = vec4(0.0); return; }

  vec2 w = uv * uWorld;

  float u = (d + uTime * uCrestSpeed) / 38.0 + vnoise(w * 0.004) * 1.5;
  float f = fract(u);
  float crest = smoothstep(0.78, 0.9, f) * (1.0 - smoothstep(0.9, 1.0, f));
  // Fades in from open water, then dissolves gradually on the way in: full strength at
  // uDissolveEnd, gone at uDissolveStart (a smooth ramp, never a hard cut).
  crest *= (1.0 - smoothstep(30.0, 110.0, d)) * smoothstep(uDissolveStart, uDissolveEnd, d);

  float lace = smoothstep(0.30, 0.62, vnoise(w * 0.09 + vec2(0.0, uTime * 0.05)));
  float a = crest * 0.55 * lace * water * uStrength;
  outColor = vec4(uFoamColor, clamp(a, 0.0, 1.0));
}
`;

export interface CoastFoamConfig {
  strength: number;
  /** Distance from the shore (world px) where a crest has fully dissolved. */
  dissolveStartWorldPx: number;
  /** Distance from the shore (world px) where a crest is back at full strength. */
  dissolveEndWorldPx: number;
  crestSpeedWorldPxPerSecond: number;
  /** Foam colour as 0..1 RGB. */
  color: [number, number, number];
}

export const DEFAULT_COAST_FOAM_CONFIG: CoastFoamConfig = {
  strength: 0.4,
  dissolveStartWorldPx: 3,
  dissolveEndWorldPx: 60,
  crestSpeedWorldPxPerSecond: 9,
  color: [0.93, 0.98, 0.96],
};

export interface WorldSurfaceCoastFoamProps {
  active: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
  config?: CoastFoamConfig;
  onError?: (message: string) => void;
}

/**
 * Waves that run in and dissolve at the shore: a WebGL2 shader reading a baked distance-to-coast
 * field (`scripts/build-coast-distance.py`). Nothing is computed per frame on the
 * CPU and no filter or blend mode is involved. The canvas is capped at half the
 * WebKit texture edge and scaled back up by CSS, like the open-sea pattern.
 */
export function WorldSurfaceCoastFoam({
  active,
  canvasSize,
  zIndex,
  config = DEFAULT_COAST_FOAM_CONFIG,
  onError,
}: WorldSurfaceCoastFoamProps) {
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const configRef = useRef(config);
  configRef.current = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const locRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const readyRef = useRef(false);
  const startRef = useRef(performance.now());

  const longEdge = Math.max(canvasSize.width, canvasSize.height);
  const wrapScale = Math.min(1, MAX_CANVAS_EDGE_PX / longEdge);
  const targetWidth = Math.round(canvasSize.width * wrapScale);
  const targetHeight = Math.round(canvasSize.height * wrapScale);

  const setup = useCallback(() => {
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
        console.error('[coast-foam] shader compile:', gl.getShaderInfoLog(sh));
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
      console.error('[coast-foam] program link:', gl.getProgramInfoLog(program));
      return false;
    }
    gl.useProgram(program);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const names = [
      'uDist', 'uCanvas', 'uWorld', 'uTime', 'uDMax', 'uFoamColor', 'uStrength',
      'uDissolveStart', 'uDissolveEnd', 'uCrestSpeed',
    ];
    locRef.current = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]));
    programRef.current = program;
    glRef.current = gl;

    const tex = gl.createTexture();
    if (tex) {
      textureRef.current = tex;
      const img = new Image();
      img.onload = () => {
        if (glRef.current !== gl) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        readyRef.current = true;
      };
      img.onerror = () => onError?.('Failed to load coast distance texture');
      img.src = DIST_SRC;
    }
    return true;
  }, [onError]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas || !readyRef.current) return;
    const cfg = configRef.current;
    const loc = locRef.current;
    const time = reducedMotionRef.current ? 3 : (performance.now() - startRef.current) / 1000;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.uniform1i(loc.uDist, 0);
    gl.uniform2f(loc.uCanvas, canvas.width, canvas.height);
    gl.uniform2f(loc.uWorld, canvasSize.width, canvasSize.height);
    gl.uniform1f(loc.uTime, time);
    gl.uniform1f(loc.uDMax, D_MAX_WORLD_PX);
    gl.uniform3f(loc.uFoamColor, cfg.color[0], cfg.color[1], cfg.color[2]);
    gl.uniform1f(loc.uStrength, cfg.strength);
    gl.uniform1f(loc.uDissolveStart, cfg.dissolveStartWorldPx);
    gl.uniform1f(loc.uDissolveEnd, cfg.dissolveEndWorldPx);
    gl.uniform1f(loc.uCrestSpeed, cfg.crestSpeedWorldPxPerSecond);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, [canvasSize.width, canvasSize.height]);

  // setInterval rather than rAF for the same reason as the sea pattern: a hidden
  // document throttles rAF to nothing.
  useEffect(() => {
    if (!active) return;
    if (!glRef.current && !setup()) return;
    const interval = setInterval(render, 1000 / 30);
    return () => clearInterval(interval);
  }, [active, setup, render]);

  useEffect(() => {
    return () => {
      const gl = glRef.current;
      if (!gl) return;
      if (programRef.current) gl.deleteProgram(programRef.current);
      if (textureRef.current) gl.deleteTexture(textureRef.current);
      glRef.current = null;
      programRef.current = null;
      textureRef.current = null;
      readyRef.current = false;
    };
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: targetWidth,
        height: targetHeight,
        transform: `scale(${1 / wrapScale})`,
        transformOrigin: '0 0',
        zIndex,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={targetWidth}
        height={targetHeight}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}

export default WorldSurfaceCoastFoam;
