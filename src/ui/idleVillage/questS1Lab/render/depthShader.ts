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

/** Backward-UV depth warp: one texture + one depth tap per fragment. */
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
void main() {
  vec2 base = uWinCenter + (vUV - 0.5) * 2.0 * uWinHalf;
  float d = texture(uDepth, base).r;
  vec2 uv = base + (d - uFocal) * uAmpEff * uCamVec;
  uv = clamp(uv, uEps, 1.0 - uEps);
  outColor = texture(uScene, uv);
}
`;
