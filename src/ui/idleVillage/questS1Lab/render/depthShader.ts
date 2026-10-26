/**
 * depthShader — GLSL for the depth-parallax quest scene (PLAN-046).
 *
 * This is the shader-side half of the single transform defined in
 * `depthTransform.ts`: `shaderUniforms` produces `uWinCenter`/`uWinHalf`
 * per frame; the fragment below applies
 *   base = uWinCenter + (vUV − 0.5)·2·uWinHalf
 *   uv   = base + (d − uFocal)·uAmpEff·uCamVec
 * — the exact formula the JS mirror and the edge-safety proof certify.
 * The final clamp is the emergency defense only: the proof guarantees it
 * is never reached (the property test asserts it stays inactive).
 */

/** Unit-quad vertex shader — same mvp uniforms the MeshPipe provides. */
export const DEPTH_VERT = `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

/** Backward-UV depth warp with a transient spatial focus-rack kernel. */
export const DEPTH_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outColor;
uniform sampler2D uScene;
uniform sampler2D uDepth;
uniform vec2 uWinCenter;
uniform vec2 uWinHalf;
uniform vec2 uCamVec;
uniform float uAmpEff;
uniform float uFocal;
uniform float uEps;
uniform float uBlurPx;
uniform vec2 uViewSize;
/* PLAN-050 §4 — trauma shake: uTrauma = (x, y, rollRad); uTraumaW =
 * (bgWeight, fgWeight). The bg share already lives in uWinCenter (composed
 * into state.pan); the shader adds only the depth-weighted residual, plus
 * a rotation around the sampled-window center — FG wobbles ~4× BG. */
uniform vec3 uTrauma;
uniform vec2 uTraumaW;
/* Train-window wrap mode (lab-only experiment): when uWrap>0.5 the x
 *  coordinate wraps instead of clamping — combined with a linearly
 *  growing camVec this scrolls every depth plane at its own speed on a
 *  horizontally tileable plate. */
uniform float uWrap;

vec2 wrapX(vec2 uv) {
  if (uWrap > 0.5) uv.x = fract(uv.x);
  return uv;
}

vec4 sceneSample(vec2 uv) {
  uv = wrapX(uv);
  if (uBlurPx <= 0.05) return texture(uScene, uv);

  /* Sample around the warped source point in view-pixel units. A mip-only
   * LOD made the entrance look like enlarged coarse pixels, not lens blur. */
  vec2 radius = (2.0 * uWinHalf / uViewSize) * uBlurPx;
  vec4 color = texture(uScene, uv) * 0.25;
  color += texture(uScene, wrapX(uv + vec2( radius.x, 0.0))) * 0.125;
  color += texture(uScene, wrapX(uv + vec2(-radius.x, 0.0))) * 0.125;
  color += texture(uScene, wrapX(uv + vec2(0.0,  radius.y))) * 0.125;
  color += texture(uScene, wrapX(uv + vec2(0.0, -radius.y))) * 0.125;
  color += texture(uScene, wrapX(uv + vec2( radius.x,  radius.y))) * 0.0625;
  color += texture(uScene, wrapX(uv + vec2(-radius.x,  radius.y))) * 0.0625;
  color += texture(uScene, wrapX(uv + vec2( radius.x, -radius.y))) * 0.0625;
  color += texture(uScene, wrapX(uv + vec2(-radius.x, -radius.y))) * 0.0625;
  return color;
}

void main() {
  vec2 base = uWinCenter + (vUV - 0.5) * 2.0 * uWinHalf;
  float d = texture(uDepth, base).r;
  vec2 uv = base + (d - uFocal) * uAmpEff * uCamVec;
  /* trauma — depth-weighted residual + rotation, post-displacement. */
  float w = mix(uTraumaW.x, uTraumaW.y, smoothstep(uFocal, 1.0, d));
  vec2 c = uv - uWinCenter;
  float ca = cos(uTrauma.z * w);
  float sa = sin(uTrauma.z * w);
  c = mat2(ca, -sa, sa, ca) * c;
  uv = uWinCenter + c + uTrauma.xy * (w - uTraumaW.x);
  if (uWrap > 0.5) {
    uv.x = fract(uv.x);
    uv.y = clamp(uv.y, uEps, 1.0 - uEps);
  } else {
    uv = clamp(uv, uEps, 1.0 - uEps);
  }
  outColor = sceneSample(uv);
}
`;
