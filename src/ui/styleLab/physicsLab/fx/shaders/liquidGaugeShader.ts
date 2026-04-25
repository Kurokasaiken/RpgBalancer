/**
 * Liquid Gauge Shader
 *
 * WebGPU shader implementation for liquid gauge effects.
 * Provides configurable viscosity, turbulence, and fluid dynamics.
 */

/**
 * Liquid gauge shader configuration parameters.
 */
export interface LiquidGaugeConfig {
  /** Fluid viscosity (0.1 = water-like, 1.0 = honey-like). */
  viscosity: number;
  /** Turbulence intensity (0 = calm, 1 = chaotic). */
  turbulence: number;
  /** Fluid color in hex format. */
  fluidColor: string;
  /** Background color in hex format. */
  backgroundColor: string;
  /** Wave amplitude (0 = flat, 1 = maximum waves). */
  waveAmplitude: number;
  /** Wave frequency (0.1 = slow waves, 2.0 = fast waves). */
  waveFrequency: number;
  /** Surface tension effect (0 = none, 1 = maximum tension). */
  surfaceTension: number;
  /** Bubble count for foam effect. */
  bubbleCount: number;
  /** Metallic sheen intensity (0 = matte, 1 = highly metallic). */
  metallicSheen: number;
}

/**
 * Default liquid gauge configuration.
 */
export const DEFAULT_LIQUID_GAUGE_CONFIG: LiquidGaugeConfig = {
  viscosity: 0.3,
  turbulence: 0.2,
  fluidColor: '#44c470',
  backgroundColor: '#1a2620',
  waveAmplitude: 0.15,
  waveFrequency: 1.0,
  surfaceTension: 0.6,
  bubbleCount: 8,
  metallicSheen: 0.4,
};

/**
 * WebGPU vertex shader source for liquid gauge.
 */
export const LIQUID_GAUGE_VERTEX_SHADER = `
// Vertex shader for liquid gauge effect
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) worldPos: vec2<f32>,
};

@vertex
fn main(@location(0) position: vec2<f32>, @location(1) uv: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.uv = uv;
  output.worldPos = position;
  return output;
}
`;

/**
 * WebGPU fragment shader source for liquid gauge.
 */
export const LIQUID_GAUGE_FRAGMENT_SHADER = `
// Fragment shader for liquid gauge effect
struct LiquidGaugeUniforms {
  time: f32,
  fillLevel: f32,
  viscosity: f32,
  turbulence: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  surfaceTension: f32,
  metallicSheen: f32,
  resolution: vec2<f32>,
  fluidColor: vec3<f32>,
  backgroundColor: vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: LiquidGaugeUniforms;

// Noise function for turbulence
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

// Fractal Brownian Motion for more realistic turbulence
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

@fragment
fn main(@location(0) uv: vec2<f32>, @location(1) worldPos: vec2<f32>) -> @location(0) vec4<f32> {
  // Calculate distance from center for circular gauge
  let center = vec2<f32>(0.5, 0.5);
  let dist = distance(uv, center);
  
  // Base fill level with wave effects
  let baseFill = uniforms.fillLevel;
  
  // Calculate wave height at this position
  let wavePhase = uniforms.time * uniforms.waveFrequency;
  let noiseValue = fbm(worldPos * 2.0 + wavePhase, 4);
  let turbulenceEffect = noiseValue * uniforms.turbulence * 0.1;
  
  // Surface waves
  let waveX = worldPos.x * 10.0 + wavePhase;
  let waveY = sin(waveX) * uniforms.waveAmplitude * 0.05;
  let surfaceWave = waveY + turbulenceEffect;
  
  // Adjust fill level with waves
  let adjustedFill = baseFill + surfaceWave;
  
  // Apply surface tension (smoothing at edges)
  let tensionFactor = smoothstep(0.0, uniforms.surfaceTension, adjustedFill);
  let finalFill = adjustedFill * tensionFactor;
  
  // Determine if pixel is in fluid
  let inFluid = dist < finalFill;
  
  if (inFluid) {
    // Base fluid color
    var fluidColor = uniforms.fluidColor;
    
    // Add depth-based shading
    let depth = 1.0 - (dist / finalFill);
    fluidColor = fluidColor * (0.8 + 0.2 * depth);
    
    // Add metallic sheen
    let sheenAngle = dot(normalize(worldPos - center), vec2<f32>(0.0, 1.0));
    let sheen = pow(max(0.0, sheenAngle), 32.0) * uniforms.metallicSheen;
    fluidColor = fluidColor + vec3<f32>(sheen);
    
    // Add bubble effects
    let bubbleNoise = fbm(worldPos * 15.0 + uniforms.time * 2.0, 2);
    let bubbleMask = smoothstep(0.7, 0.8, bubbleNoise);
    fluidColor = fluidColor + bubbleMask * vec3<f32>(0.3, 0.3, 0.3);
    
    // Viscosity affects opacity (more viscous = more opaque)
    let opacity = 0.7 + 0.3 * uniforms.viscosity;
    
    return vec4<f32>(fluidColor, opacity);
  } else {
    // Background with subtle gradient
    let bgGradient = mix(uniforms.backgroundColor, uniforms.backgroundColor * 0.8, dist);
    return vec4<f32>(bgGradient, 1.0);
  }
}
`;

/**
 * WebGL2 fallback vertex shader.
 */
export const LIQUID_GAUGE_VERTEX_SHADER_WEBGL2 = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUV;

out vec2 vUV;
out vec2 vWorldPos;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUV = aUV;
  vWorldPos = aPosition;
}
`;

/**
 * WebGL2 fallback fragment shader.
 */
export const LIQUID_GAUGE_FRAGMENT_SHADER_WEBGL2 = `#version 300 es
precision highp float;

in vec2 vUV;
in vec2 vWorldPos;

out vec4 fragColor;

uniform float uTime;
uniform float uFillLevel;
uniform float uViscosity;
uniform float uTurbulence;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uSurfaceTension;
uniform float uMetallicSheen;
uniform vec2 uResolution;
uniform vec3 uFluidColor;
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

void main() {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUV, center);
  
  float baseFill = uFillLevel;
  
  float wavePhase = uTime * uWaveFrequency;
  float noiseValue = fbm(vWorldPos * 2.0 + wavePhase, 4);
  float turbulenceEffect = noiseValue * uTurbulence * 0.1;
  
  float waveX = vWorldPos.x * 10.0 + wavePhase;
  float waveY = sin(waveX) * uWaveAmplitude * 0.05;
  float surfaceWave = waveY + turbulenceEffect;
  
  float adjustedFill = baseFill + surfaceWave;
  
  float tensionFactor = smoothstep(0.0, uSurfaceTension, adjustedFill);
  float finalFill = adjustedFill * tensionFactor;
  
  bool inFluid = dist < finalFill;
  
  if (inFluid) {
    vec3 fluidColor = uFluidColor;
    
    float depth = 1.0 - (dist / finalFill);
    fluidColor *= (0.8 + 0.2 * depth);
    
    float sheenAngle = dot(normalize(vWorldPos - center), vec2(0.0, 1.0));
    float sheen = pow(max(0.0, sheenAngle), 32.0) * uMetallicSheen;
    fluidColor += vec3(sheen);
    
    float bubbleNoise = fbm(vWorldPos * 15.0 + uTime * 2.0, 2);
    float bubbleMask = smoothstep(0.7, 0.8, bubbleNoise);
    fluidColor += bubbleMask * vec3(0.3, 0.3, 0.3);
    
    float opacity = 0.7 + 0.3 * uViscosity;
    
    fragColor = vec4(fluidColor, opacity);
  } else {
    vec3 bgGradient = mix(uBackgroundColor, uBackgroundColor * 0.8, dist);
    fragColor = vec4(bgGradient, 1.0);
  }
}
`;

/**
 * Converts hex color to RGB vector.
 * @param hex - Hex color string (e.g., "#44c470").
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
 * Creates liquid gauge shader configuration from config object.
 * @param config - Liquid gauge configuration.
 * @returns Shader configuration object.
 */
export const createLiquidGaugeShaderConfig = (config: Partial<LiquidGaugeConfig> = {}) => {
  const finalConfig = { ...DEFAULT_LIQUID_GAUGE_CONFIG, ...config };
  
  return {
    uniforms: {
      time: { type: 'float', value: 0.0 },
      fillLevel: { type: 'float', value: 0.5 },
      viscosity: { type: 'float', value: finalConfig.viscosity },
      turbulence: { type: 'float', value: finalConfig.turbulence },
      waveAmplitude: { type: 'float', value: finalConfig.waveAmplitude },
      waveFrequency: { type: 'float', value: finalConfig.waveFrequency },
      surfaceTension: { type: 'float', value: finalConfig.surfaceTension },
      metallicSheen: { type: 'float', value: finalConfig.metallicSheen },
      resolution: { type: 'vec2', value: [512, 512] },
      fluidColor: { type: 'vec3', value: hexToRgb(finalConfig.fluidColor) },
      backgroundColor: { type: 'vec3', value: hexToRgb(finalConfig.backgroundColor) },
    },
    vertexShader: LIQUID_GAUGE_VERTEX_SHADER,
    fragmentShader: LIQUID_GAUGE_FRAGMENT_SHADER,
    vertexShaderWebGL2: LIQUID_GAUGE_VERTEX_SHADER_WEBGL2,
    fragmentShaderWebGL2: LIQUID_GAUGE_FRAGMENT_SHADER_WEBGL2,
  };
};
