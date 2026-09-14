import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useReducedMotion from '../hooks/useReducedMotion';

const PATTERN_SRC = '/assets/world/wanderlust/base/layers/sea_pattern_tile.png';
const MASK_SRC = '/assets/atmosphere/terrain/sea_mask.webp';
const CONFIG_SRC = '/world-surface-sea-pattern-config.json';

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform float uDpr;
uniform vec2 uResolution;
uniform vec2 uWorldOrigin;
uniform float uWorldPerCssPx;
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
  vec2 cssPx = gl_FragCoord.xy / uDpr;
  vec2 worldPx = vec2(
    uWorldOrigin.x + cssPx.x * uWorldPerCssPx,
    uWorldOrigin.y - cssPx.y * uWorldPerCssPx
  );

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

interface SeaPatternConfig {
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

const DEFAULT_CONFIG: SeaPatternConfig = {
  patternScale: 4500,
  lineOpacity: 0.65,
  lineWidth: 1,
  lineColor: '#8bbac2',
  baseColor: '#0b5c6b',
  motionEnabled: true,
  motionAmount: 3,
  motionPeriod: 18,
  motionAngle: 200,
};

interface WorldSurfaceSeaPatternOverlayProps {
  active: boolean;
  canvasSize: { width: number; height: number };
  camera: { panX: number; panY: number; zoom: number };
  hidePanel?: boolean;
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const WorldSurfaceSeaPatternOverlay: React.FC<WorldSurfaceSeaPatternOverlayProps> = ({
  active,
  canvasSize,
  camera,
  hidePanel = false,
}) => {
  const { t } = useTranslation('idleVillage');
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelOpenRef = useRef(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [config, setConfig] = useState<SeaPatternConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const locRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const textureRef = useRef<WebGLTexture | null>(null);
  const startTRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const configRef = useRef(config);
  const cameraRef = useRef(camera);

  configRef.current = config;
  cameraRef.current = camera;

  // Load authored preset from the spike config.
  useEffect(() => {
    fetch(CONFIG_SRC)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.visual) {
          setConfig((prev) => ({ ...prev, ...data.visual, motionAngle: prev.motionAngle }));
        }
      })
      .catch(() => undefined);
  }, []);

  const setupWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      setError('WebGL2 not available');
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
      resolution: u('uResolution'),
      worldOrigin: u('uWorldOrigin'),
      worldPerCssPx: u('uWorldPerCssPx'),
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
      img.onerror = () => setError('Failed to load pattern texture');
      img.src = PATTERN_SRC;
    }

    return true;
  }, []);

  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!wrap || !canvas || !gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = wrap.clientWidth;
    const height = wrap.clientHeight;
    containerSizeRef.current = { width, height };

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    const loc = locRef.current;
    if (!gl || !program || !canvas) return;

    const cfg = configRef.current;
    const cam = cameraRef.current;
    const { width, height } = containerSizeRef.current;
    const dpr = canvas.width / width || 1;

    const worldPerCssPx = 1 / cam.zoom;
    const worldOriginY = cam.panY + height / cam.zoom;
    const rad = (cfg.motionAngle * Math.PI) / 180;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform1f(loc.dpr, dpr);
    gl.uniform2f(loc.resolution, canvas.width, canvas.height);
    gl.uniform2f(loc.worldOrigin, cam.panX, worldOriginY);
    gl.uniform1f(loc.worldPerCssPx, worldPerCssPx);
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
  }, []);

  const loop = useCallback(() => {
    if (!active) return;
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [active, render]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    if (!glRef.current && !setupWebGL()) return;
    resize();
    loop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, setupWebGL, resize, loop]);

  useEffect(() => {
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resize]);

  if (!active) return null;

  const maskUrl = `url(${MASK_SRC})`;
  const worldW = canvasSize.width;
  const worldH = canvasSize.height;
  const maskW = worldW * camera.zoom;
  const maskH = worldH * camera.zoom;
  const maskX = -camera.panX * camera.zoom;
  const maskY = -camera.panY * camera.zoom;

  const update = <K extends keyof SeaPatternConfig>(key: K, value: SeaPatternConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const togglePanel = () => {
    panelOpenRef.current = !panelOpenRef.current;
    setPanelOpen(panelOpenRef.current);
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          maskImage: maskUrl,
          WebkitMaskImage: maskUrl,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskSize: `${maskW}px ${maskH}px`,
          WebkitMaskSize: `${maskW}px ${maskH}px`,
          maskPosition: `${maskX}px ${maskY}px`,
          WebkitMaskPosition: `${maskX}px ${maskY}px`,
          maskMode: 'alpha',
        }}
      />

      {!hidePanel && panelOpen && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 280,
            pointerEvents: 'auto',
            zIndex: 110,
          }}
          className="rounded border border-amber-700/40 bg-slate-900/95 p-3 text-amber-100 shadow-lg backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-amber-300">{t('world.debug.seaPatternTitle')}</div>
            <button
              type="button"
              onClick={togglePanel}
              className="rounded px-2 py-0.5 text-xs text-amber-200/70 hover:bg-amber-700/20"
            >
              {t('world.debug.seaPatternClose')}
            </button>
          </div>

          {error && (
            <div className="mb-2 rounded border border-red-800 bg-red-950/40 p-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="text-xs italic text-amber-200/70">{t('world.debug.seaPatternLive')}</div>

          <div className="mt-3 space-y-3">
            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternScale')}</span>
              <input
                type="range"
                min={1000}
                max={20000}
                step={100}
                value={config.patternScale}
                onChange={(e) => update('patternScale', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.patternScale}</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternOpacity')}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={config.lineOpacity}
                onChange={(e) => update('lineOpacity', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.lineOpacity.toFixed(2)}</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternColor')}</span>
              <input
                type="color"
                value={config.lineColor}
                onChange={(e) => update('lineColor', e.target.value)}
                className="mt-1 h-7 w-full rounded border border-amber-700/40 bg-slate-800"
              />
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternMotion')}</span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={config.motionAmount}
                onChange={(e) => update('motionAmount', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.motionAmount.toFixed(1)} wpx</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternPeriod')}</span>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={config.motionPeriod}
                onChange={(e) => update('motionPeriod', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.motionPeriod}s</span>
            </label>

            <label className="block text-xs">
              <span className="text-amber-200/90">{t('world.debug.seaPatternAngle')}</span>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={config.motionAngle}
                onChange={(e) => update('motionAngle', Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <span className="block text-right text-amber-200/70">{config.motionAngle}°</span>
            </label>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="sea-pattern-motion"
                type="checkbox"
                checked={config.motionEnabled}
                disabled={reducedMotion}
                onChange={(e) => update('motionEnabled', e.target.checked)}
                className="accent-teal-500"
              />
              <label htmlFor="sea-pattern-motion" className="text-xs text-amber-200/90">
                {t('world.debug.seaPatternMotionEnabled')}
                {reducedMotion && (
                  <span className="ml-1 text-amber-200/50">({t('world.debug.reducedMotion')})</span>
                )}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
