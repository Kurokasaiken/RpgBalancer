/**
 * tarGooRenderer — WebGL2 SDF renderer for the V6.2 tar-goo challenge surface.
 *
 * Renders the goo as a signed-distance field: a per-angle rim radius array
 * (spring-simulated in the engine) smooth-min merged with crawling droplet
 * metaballs, shaded with a viscous-tar material (near-black albedo, tight
 * warm specular, teal fresnel rim, slow internal swirl).
 *
 * The renderer owns its own offscreen WebGL2 canvas; the Canvas-2D engine
 * composites it with `ctx.drawImage(renderer.render(params), 0, 0)` at the
 * exact layer where the flat goo used to be painted, so the z-order of star,
 * axes, obelisks and ball is untouched.
 *
 * Direction A of R-032: WebGL fragment shader (SDF smooth-min + material).
 * Implemented on raw WebGL2 instead of a pixi.js Application because the
 * engine factory is synchronous (pixi v8 `init()` is async) and a single
 * fullscreen quad needs no scene graph; visual output is identical.
 */

import type { TarGooConfig } from '@/balancing/config/idleVillage/tarGooConfig';

/** Per-frame inputs produced by the engine's viscous simulation. */
export interface TarGooFrameParams {
  /** Current sprung rim radius per angular sample, px from center. */
  radii: Float32Array;
  /** Droplet metaballs as (x, y, r) triples in canvas px. */
  blobs: Float32Array;
  /** Number of active droplets in `blobs`. */
  blobCount: number;
  /** Engine clock in ms (drives undulation + swirl). */
  timeMs: number;
  /** Global reveal 0..1 — gates alpha during the eruption. */
  reveal: number;
  /** Extra agitation 0..1 (slam/ripple moments). */
  ripple: number;
}

/** Handle over the offscreen WebGL2 goo layer. */
export interface TarGooRenderer {
  /** Renders one frame and returns the canvas to composite via drawImage. */
  render(params: TarGooFrameParams): HTMLCanvasElement;
  /** Releases the WebGL context and detaches the canvas. */
  destroy(): void;
}

const MAX_BLOBS = 12;

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/** Builds the fragment shader with compile-time sample/blob counts baked in. */
function fragSource(samples: number): string {
  return `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uSize;          // canvas size in px
uniform vec2 uCenter;        // goo center in px
uniform float uRadii[${samples}];
uniform vec3 uBlobs[${MAX_BLOBS}];
uniform int uBlobCount;
uniform float uTime;         // seconds
uniform float uReveal;
uniform float uRipple;

uniform float uSminK;
uniform float uUndAmp;
uniform float uUndSpeed;

uniform vec3 uAlbedo;
uniform vec3 uAlbedoLit;
uniform vec3 uSpecColor;
uniform float uSpecIntensity;
uniform float uSpecExp;
uniform vec3 uFresColor;
uniform float uFresIntensity;
uniform float uFresPower;
uniform float uEdgeFalloff;
uniform float uSwirl;
uniform vec3 uLightDir;

const float TAU = 6.28318530718;

/* Inigo Quilez polynomial smooth-min: surface-tension bridge between lobes. */
float smin(float a, float b, float k){
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

/* Rim radius at angle theta: linear interp of the sprung sample ring. */
float rimAt(float theta){
  float t = mod(theta + TAU, TAU) / TAU * float(${samples});
  int i0 = int(floor(t)) % ${samples};
  int i1 = (i0 + 1) % ${samples};
  return mix(uRadii[i0], uRadii[i1], fract(t));
}

/* Cheap 2D value-ish noise from stacked sines — enough for slow tar veins. */
float veins(vec2 p, float t){
  float n = sin(p.x * 0.021 + t * 0.5) * sin(p.y * 0.017 - t * 0.37);
  n += 0.5 * sin((p.x + p.y) * 0.013 + t * 0.23);
  return n * 0.5 + 0.5;
}

float field(vec2 p){
  float theta = atan(p.y, p.x);
  /* Surface undulation grows with reveal: the tar starts as a smooth circle
     and only gets its strange edges as it pours outward. */
  float und = uUndAmp * (1.0 + 2.2 * uRipple) * clamp(uReveal, 0.0, 1.0)
    * ( sin(theta * 3.0 + uTime * uUndSpeed * TAU * 0.5)
      + 0.6 * sin(theta * 5.0 - uTime * uUndSpeed * TAU * 0.33 + 1.7) );
  float d = length(p) - (rimAt(theta) + und);
  for (int i = 0; i < ${MAX_BLOBS}; i++){
    if (i >= uBlobCount) break;
    vec3 b = uBlobs[i];
    float db = length(p - (b.xy - uCenter)) - b.z;
    d = smin(d, db, uSminK);
  }
  return d;
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 p = px - uCenter;
  float d = field(p);

  /* Rounded shoulder height profile: flat body, domed edge. */
  float h = clamp(-d / uEdgeFalloff, 0.0, 1.0);
  float hp = 1.0 - (1.0 - h) * (1.0 - h);

  vec3 n = normalize(vec3(-dFdx(hp) * 34.0, -dFdy(hp) * 34.0, 1.0));
  vec3 L = normalize(uLightDir);

  float diff = max(dot(n, L), 0.0);
  vec3 R = reflect(-L, n);
  float spec = pow(max(R.z, 0.0), uSpecExp) * uSpecIntensity;
  float fres = pow(clamp(1.0 - n.z, 0.0, 1.0), uFresPower) * uFresIntensity;

  /* Slow internal swirl: the mass is alive, not a flat decal. */
  float v = veins(p + vec2(uTime * 3.0, -uTime * 2.0), uTime);
  float swirl = (v - 0.5) * uSwirl;

  vec3 body = mix(uAlbedo, uAlbedoLit, clamp(diff * 0.55 + swirl, 0.0, 1.0));
  vec3 color = body + uSpecColor * spec + uFresColor * fres;

  /* V6.2: alpha is driven by the SDF itself, not by uReveal, so falling seed
     blobs are visible even before the main rim has started growing. */
  float alpha = smoothstep(1.5, -1.5, d);
  outColor = vec4(color, alpha);
}
`;
}

/**
 * Creates the WebGL2 tar-goo layer, or returns null when WebGL2 is
 * unavailable (the engine then keeps its Canvas-2D fallback).
 */
export function createTarGooRenderer(size: number, cfg: TarGooConfig): TarGooRenderer | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return null;

  const compile = (type: number, src: string): WebGLShader | null => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[tarGoo] shader compile failed:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const samples = cfg.simulation.rimSamples;
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, fragSource(samples));
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[tarGoo] program link failed:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const loc = {
    size: u('uSize'), center: u('uCenter'), radii: u('uRadii'), blobs: u('uBlobs'),
    blobCount: u('uBlobCount'), time: u('uTime'), reveal: u('uReveal'), ripple: u('uRipple'),
  };

  /* Static material + field uniforms from config — set once. */
  const m = cfg.material;
  gl.uniform2f(loc.size, size, size);
  gl.uniform2f(loc.center, size / 2, size / 2);
  gl.uniform1f(u('uSminK'), cfg.field.smoothMinK);
  gl.uniform1f(u('uUndAmp'), cfg.field.undulationAmp);
  gl.uniform1f(u('uUndSpeed'), cfg.field.undulationSpeed);
  gl.uniform3fv(u('uAlbedo'), m.albedo);
  gl.uniform3fv(u('uAlbedoLit'), m.albedoLit);
  gl.uniform3fv(u('uSpecColor'), m.specularColor);
  gl.uniform1f(u('uSpecIntensity'), m.specularIntensity);
  gl.uniform1f(u('uSpecExp'), m.specularExponent);
  gl.uniform3fv(u('uFresColor'), m.fresnelColor);
  gl.uniform1f(u('uFresIntensity'), m.fresnelIntensity);
  gl.uniform1f(u('uFresPower'), m.fresnelPower);
  gl.uniform1f(u('uEdgeFalloff'), m.edgeHeightFalloff);
  gl.uniform1f(u('uSwirl'), m.swirlIntensity);
  gl.uniform3fv(u('uLightDir'), m.lightDir);

  const blobPad = new Float32Array(MAX_BLOBS * 3);
  let destroyed = false;

  return {
    render(params: TarGooFrameParams): HTMLCanvasElement {
      if (destroyed || gl.isContextLost()) return canvas;
      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1fv(loc.radii, params.radii);
      blobPad.set(params.blobs.subarray(0, Math.min(params.blobs.length, MAX_BLOBS * 3)));
      gl.uniform3fv(loc.blobs, blobPad);
      gl.uniform1i(loc.blobCount, Math.min(params.blobCount, MAX_BLOBS));
      gl.uniform1f(loc.time, params.timeMs / 1000);
      gl.uniform1f(loc.reveal, params.reveal);
      gl.uniform1f(loc.ripple, params.ripple);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return canvas;
    },
    destroy() {
      destroyed = true;
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      canvas.width = canvas.height = 0;
    },
  };
}
