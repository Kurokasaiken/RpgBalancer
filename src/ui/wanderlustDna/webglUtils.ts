/**
 * Wanderlust DNA — shared WebGL micro-runtime.
 *
 * Steam Deck constraints honored here:
 * - `powerPreference: 'low-power'`, no antialias, no preserveDrawingBuffer;
 * - every canvas is sized to its own component bounding box (never full-screen);
 * - DPR is capped at 2 so the fragment workload stays bounded;
 * - render loops are owned by the components and only run during interaction.
 */

/**
 * Vertex shader with DOM-oriented UVs: v grows downward so vUv matches
 * top-left-origin canvas textures uploaded without UNPACK_FLIP_Y.
 */
export const DOM_UV_VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export interface GlBundle {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export function createGlContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  return (
    canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    }) as WebGLRenderingContext | null
  );
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Surface shader bugs loudly in dev; component falls back to CSS-only.
    console.error('[wanderlustDna] shader compile failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Compiles the DOM-UV vertex shader + given fragment shader, binds a
 * fullscreen quad on `aPos`, and resolves the requested uniform locations.
 */
export function buildProgram(
  gl: WebGLRenderingContext,
  fragmentSource: string,
  uniformNames: string[]
): GlBundle | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, DOM_UV_VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[wanderlustDna] program link failed:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { gl, program, uniforms };
}

/**
 * Uploads a canvas as a texture on the given unit. CLAMP_TO_EDGE + LINEAR,
 * no mipmaps: NPOT-safe under WebGL1.
 */
export function uploadCanvasTexture(
  gl: WebGLRenderingContext,
  unit: number,
  source: HTMLCanvasElement
): WebGLTexture | null {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

/** Max device-pixel-ratio; 2 is already overkill on a Steam Deck 800p panel. */
export const MAX_DPR = 2;

/**
 * Resizes the drawing buffer to the element's CSS box (bounded by MAX_DPR).
 * Returns false when nothing changed so callers can skip re-rendering.
 */
export function fitCanvasToBox(canvas: HTMLCanvasElement, box: HTMLElement): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const w = Math.max(1, Math.round(box.clientWidth * dpr));
  const h = Math.max(1, Math.round(box.clientHeight * dpr));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}
