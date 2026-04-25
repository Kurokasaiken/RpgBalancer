/**
 * Foil Card Shader
 *
 * WebGPU shader implementation for metallic foil card effects.
 * Provides configurable shimmer, reflection, and metallic properties.
 */

/**
 * Foil card shader configuration parameters.
 */
export interface FoilCardConfig {
  /** Foil shimmer intensity (0 = matte, 1 = maximum shimmer). */
  shimmerIntensity: number;
  /** Shimmer movement speed (0 = static, 2 = fast movement). */
  shimmerSpeed: number;
  /** Base foil color in hex format. */
  foilColor: string;
  /** Background color in hex format. */
  backgroundColor: string;
  /** Metallic reflection strength (0 = dull, 1 = highly reflective). */
  metallicReflection: number;
  /** Holographic effect intensity (0 = none, 1 = strong hologram). */
  holographicEffect: number;
  /** Surface roughness (0 = smooth, 1 = rough). */
  roughness: number;
  /** Light direction angles (x, y, z). */
  lightDirection: [number, number, number];
  /** Color shift intensity for rainbow effects. */
  colorShift: number;
  /** Edge highlight intensity. */
  edgeHighlight: number;
}

/**
 * Default foil card configuration.
 */
export const DEFAULT_FOIL_CARD_CONFIG: FoilCardConfig = {
  shimmerIntensity: 0.8,
  shimmerSpeed: 1.2,
  foilColor: '#ffd700',
  backgroundColor: '#1a1a1a',
  metallicReflection: 0.7,
  holographicEffect: 0.4,
  roughness: 0.2,
  lightDirection: [0.5, 0.8, 0.3],
  colorShift: 0.3,
  edgeHighlight: 0.6,
};

/**
 * WebGPU vertex shader source for foil card.
 */
export const FOIL_CARD_VERTEX_SHADER = `
// Vertex shader for foil card effect
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) worldPos: vec2<f32>,
  @location(2) normal: vec3<f32>,
};

@vertex
fn main(@location(0) position: vec2<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.uv = uv;
  output.worldPos = position;
  output.normal = normal;
  return output;
}
`;

/**
 * WebGPU fragment shader source for foil card.
 */
export const FOIL_CARD_FRAGMENT_SHADER = `
// Fragment shader for foil card effect
struct FoilCardUniforms {
  time: f32,
  shimmerIntensity: f32,
  shimmerSpeed: f32,
  metallicReflection: f32,
  holographicEffect: f32,
  roughness: f32,
  colorShift: f32,
  edgeHighlight: f32,
  lightDirection: vec3<f32>,
  resolution: vec2<f32>,
  foilColor: vec3<f32>,
  backgroundColor: vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: FoilCardUniforms;

// Noise function for shimmer effects
fn noise(p: vec2<f32>) -> f32 {
  return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise function
fn smoothNoise(p: vec2<f32>) -> f32 {
  let tl = noise(floor(p));
  let tr = noise(floor(p) + vec2<f32>(1.0, 0.0));
  let bl = noise(floor(p) + vec2<f32>(0.0, 1.0));
  let br = noise(floor(p) + vec2<f32>(1.0, 1.0));
  
  let x = fract(p.x);
  let y = fract(p.y);
  
  let top = mix(tl, tr, x);
  let bottom = mix(bl, br, x);
  
  return mix(top, bottom, y);
}

// Fractal Brownian Motion for more complex patterns
fn fbm(p: vec2<f32>, octaves: i32) -> f32 {
  var value = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  
  for (var i = 0; i < octaves; i = i + 1) {
    value = value + amplitude * smoothNoise(p * frequency);
    amplitude = amplitude * 0.5;
    frequency = frequency * 2.0;
  }
  
  return value;
}

// HSV to RGB conversion for color shifting
fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
  let k = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
  return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
}

// Calculate fresnel reflection
fn fresnelReflectance(viewDir: vec3<f32>, normal: vec3<f32>, f0: f32) -> f32 {
  let cosTheta = max(dot(viewDir, normal), 0.0);
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

@fragment
fn main(@location(0) uv: vec2<f32>, @location(1) worldPos: vec2<f32>, @location(2) normal: vec3<f32>) -> @location(0) vec4<f32> {
  // Calculate distance from center for radial effects
  let center = vec2<f32>(0.5, 0.5);
  let distFromCenter = distance(uv, center);
  
  // Time-based animation
  let time = uniforms.time * uniforms.shimmerSpeed;
  
  // Generate shimmer noise
  let shimmerNoise = fbm(worldPos * 4.0 + time * 0.5, 5);
  let shimmerMask = smoothstep(0.3, 0.8, shimmerNoise);
  
  // Create directional shimmer pattern
  let shimmerAngle = atan2(worldPos.y - 0.5, worldPos.x - 0.5);
  let directionalShimmer = sin(shimmerAngle * 8.0 + time * 2.0) * 0.5 + 0.5;
  
  // Combine shimmer effects
  let combinedShimmer = shimmerMask * directionalShimmer * uniforms.shimmerIntensity;
  
  // Calculate view direction (assuming camera looking at -Z)
  let viewDir = normalize(vec3<f32>(worldPos - 0.5, 1.0));
  
  // Calculate reflection using normal and light direction
  let lightDir = normalize(uniforms.lightDirection);
  let reflectionDir = reflect(-lightDir, normal);
  let reflectionStrength = max(dot(viewDir, reflectionDir), 0.0);
  
  // Apply metallic reflection
  let metallicEffect = pow(reflectionStrength, 32.0 * (1.0 - uniforms.roughness)) * uniforms.metallicReflection;
  
  // Holographic rainbow effect
  let hologramPhase = distFromCenter * 10.0 + time;
  let hologramHue = fract(hologramPhase * 0.1);
  let hologramColor = hsv2rgb(vec3<f32>(hologramHue, 0.8, 1.0));
  let hologramEffect = hologramColor * uniforms.holographicEffect * combinedShimmer;
  
  // Color shifting effect
  let colorShiftPhase = time * 0.2 + shimmerNoise * 2.0;
  let shiftedHue = fract(colorShiftPhase * uniforms.colorShift);
  let shiftedColor = hsv2rgb(vec3<f32>(shiftedHue, 0.6, 1.0));
  
  // Base foil color with color shift
  var foilColor = mix(uniforms.foilColor, shiftedColor, uniforms.colorShift * 0.3);
  
  // Apply shimmer to foil color
  foilColor = foilColor + vec3<f32>(combinedShimmer * 0.4);
  
  // Add metallic reflection
  foilColor = foilColor + vec3<f32>(metallicEffect);
  
  // Add holographic effect
  foilColor = foilColor + hologramEffect;
  
  // Edge highlight effect
  let edgeFactor = 1.0 - smoothstep(0.4, 0.5, distFromCenter);
  let edgeHighlight = edgeFactor * uniforms.edgeHighlight * vec3<f32>(0.3, 0.3, 0.2);
  foilColor = foilColor + edgeHighlight;
  
  // Surface roughness affects overall brightness
  foilColor = foilColor * (1.0 - uniforms.roughness * 0.3);
  
  // Fresnel effect for realism
  let fresnel = fresnelReflectance(viewDir, normal, 0.04);
  foilColor = foilColor + vec3<f32>(fresnel * 0.2);
  
  // Create subtle card edge gradient
  let edgeGradient = 1.0 - smoothstep(0.45, 0.5, distFromCenter);
  foilColor = foilColor * (0.8 + 0.2 * edgeGradient);
  
  // Mix with background for transparency effect
  let finalColor = mix(uniforms.backgroundColor, foilColor, 0.9);
  
  // Set alpha based on distance from edges (more transparent in center)
  let alpha = 0.7 + 0.3 * edgeGradient;
  
  return vec4<f32>(finalColor, alpha);
}
`;

/**
 * WebGL2 fallback vertex shader.
 */
export const FOIL_CARD_VERTEX_SHADER_WEBGL2 = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUV;
layout(location = 2) in vec3 aNormal;

out vec2 vUV;
out vec2 vWorldPos;
out vec3 vNormal;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUV = aUV;
  vWorldPos = aPosition;
  vNormal = aNormal;
}
`;

/**
 * WebGL2 fallback fragment shader.
 */
export const FOIL_CARD_FRAGMENT_SHADER_WEBGL2 = `#version 300 es
precision highp float;

in vec2 vUV;
in vec2 vWorldPos;
in vec3 vNormal;

out vec4 fragColor;

uniform float uTime;
uniform float uShimmerIntensity;
uniform float uShimmerSpeed;
uniform float uMetallicReflection;
uniform float uHolographicEffect;
uniform float uRoughness;
uniform float uColorShift;
uniform float uEdgeHighlight;
uniform vec3 uLightDirection;
uniform vec2 uResolution;
uniform vec3 uFoilColor;
uniform vec3 uBackgroundColor;

// Noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise
float smoothNoise(vec2 p) {
  float tl = noise(floor(p));
  float tr = noise(floor(p) + vec2(1.0, 0.0));
  float bl = noise(floor(p) + vec2(0.0, 1.0));
  float br = noise(floor(p) + vec2(1.0, 1.0));
  
  float x = fract(p.x);
  float y = fract(p.y);
  
  float top = mix(tl, tr, x);
  float bottom = mix(bl, br, x);
  
  return mix(top, bottom, y);
}

// Fractal Brownian Motion
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  
  for (int i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
  return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
}

// Fresnel reflection
float fresnelReflectance(vec3 viewDir, vec3 normal, float f0) {
  float cosTheta = max(dot(viewDir, normal), 0.0);
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  vec2 center = vec2(0.5, 0.5);
  float distFromCenter = distance(vUV, center);
  
  float time = uTime * uShimmerSpeed;
  
  float shimmerNoise = fbm(vWorldPos * 4.0 + time * 0.5, 5);
  float shimmerMask = smoothstep(0.3, 0.8, shimmerNoise);
  
  float shimmerAngle = atan(vWorldPos.y - 0.5, vWorldPos.x - 0.5);
  float directionalShimmer = sin(shimmerAngle * 8.0 + time * 2.0) * 0.5 + 0.5;
  
  float combinedShimmer = shimmerMask * directionalShimmer * uShimmerIntensity;
  
  vec3 viewDir = normalize(vec3(vWorldPos - 0.5, 1.0));
  vec3 lightDir = normalize(uLightDirection);
  vec3 reflectionDir = reflect(-lightDir, vNormal);
  float reflectionStrength = max(dot(viewDir, reflectionDir), 0.0);
  
  float metallicEffect = pow(reflectionStrength, 32.0 * (1.0 - uRoughness)) * uMetallicReflection;
  
  float hologramPhase = distFromCenter * 10.0 + time;
  float hologramHue = fract(hologramPhase * 0.1);
  vec3 hologramColor = hsv2rgb(vec3(hologramHue, 0.8, 1.0));
  vec3 hologramEffect = hologramColor * uHolographicEffect * combinedShimmer;
  
  float colorShiftPhase = time * 0.2 + shimmerNoise * 2.0;
  float shiftedHue = fract(colorShiftPhase * uColorShift);
  vec3 shiftedColor = hsv2rgb(vec3(shiftedHue, 0.6, 1.0));
  
  vec3 foilColor = mix(uFoilColor, shiftedColor, uColorShift * 0.3);
  foilColor += vec3(combinedShimmer * 0.4);
  foilColor += vec3(metallicEffect);
  foilColor += hologramEffect;
  
  float edgeFactor = 1.0 - smoothstep(0.4, 0.5, distFromCenter);
  vec3 edgeHighlight = edgeFactor * uEdgeHighlight * vec3(0.3, 0.3, 0.2);
  foilColor += edgeHighlight;
  
  foilColor *= (1.0 - uRoughness * 0.3);
  
  float fresnel = fresnelReflectance(viewDir, vNormal, 0.04);
  foilColor += vec3(fresnel * 0.2);
  
  float edgeGradient = 1.0 - smoothstep(0.45, 0.5, distFromCenter);
  foilColor *= (0.8 + 0.2 * edgeGradient);
  
  vec3 finalColor = mix(uBackgroundColor, foilColor, 0.9);
  
  float alpha = 0.7 + 0.3 * edgeGradient;
  
  fragColor = vec4(finalColor, alpha);
}
`;

/**
 * Converts hex color to RGB vector.
 * @param hex - Hex color string (e.g., "#ffd700").
 * @returns RGB color vector.
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
};

/**
 * Creates foil card shader configuration from config object.
 * @param config - Foil card configuration.
 * @returns Shader configuration object.
 */
export const createFoilCardShaderConfig = (config: Partial<FoilCardConfig> = {}) => {
  const finalConfig = { ...DEFAULT_FOIL_CARD_CONFIG, ...config };
  
  return {
    uniforms: {
      time: { type: 'float', value: 0.0 },
      shimmerIntensity: { type: 'float', value: finalConfig.shimmerIntensity },
      shimmerSpeed: { type: 'float', value: finalConfig.shimmerSpeed },
      metallicReflection: { type: 'float', value: finalConfig.metallicReflection },
      holographicEffect: { type: 'float', value: finalConfig.holographicEffect },
      roughness: { type: 'float', value: finalConfig.roughness },
      colorShift: { type: 'float', value: finalConfig.colorShift },
      edgeHighlight: { type: 'float', value: finalConfig.edgeHighlight },
      lightDirection: { type: 'vec3', value: finalConfig.lightDirection },
      resolution: { type: 'vec2', value: [512, 512] },
      foilColor: { type: 'vec3', value: hexToRgb(finalConfig.foilColor) },
      backgroundColor: { type: 'vec3', value: hexToRgb(finalConfig.backgroundColor) },
    },
    vertexShader: FOIL_CARD_VERTEX_SHADER,
    fragmentShader: FOIL_CARD_FRAGMENT_SHADER,
    vertexShaderWebGL2: FOIL_CARD_VERTEX_SHADER_WEBGL2,
    fragmentShaderWebGL2: FOIL_CARD_FRAGMENT_SHADER_WEBGL2,
  };
};
