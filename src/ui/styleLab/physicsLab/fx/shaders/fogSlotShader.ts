/**
 * Fog Slot Shader
 *
 * WebGPU shader implementation for atmospheric fog effects in slots.
 * Provides configurable fog density, movement, and atmospheric scattering.
 */

/**
 * Fog slot shader configuration parameters.
 */
export interface FogSlotConfig {
  /** Fog density (0 = clear, 1 = thick fog). */
  density: number;
  /** Fog movement speed (0 = static, 2 = fast movement). */
  movementSpeed: number;
  /** Fog color in hex format. */
  fogColor: string;
  /** Background color in hex format. */
  backgroundColor: string;
  /** Turbulence intensity (0 = calm, 1 = chaotic). */
  turbulence: number;
  /** Atmospheric scattering intensity (0 = none, 1 = strong scattering). */
  scattering: number;
  /** Elevation effect (0 = flat, 1 = strong elevation). */
  elevation: number;
  /** Particle count for fog particles. */
  particleCount: number;
  /** Glow intensity (0 = none, 1 = maximum glow). */
  glowIntensity: number;
}

/**
 * Default fog slot configuration.
 */
export const DEFAULT_FOG_SLOT_CONFIG: FogSlotConfig = {
  density: 0.6,
  movementSpeed: 0.8,
  fogColor: '#a8dadc',
  backgroundColor: '#1d3557',
  turbulence: 0.3,
  scattering: 0.4,
  elevation: 0.5,
  particleCount: 100,
  glowIntensity: 0.3,
};

/**
 * WebGPU vertex shader source for fog slot.
 */
export const FOG_SLOT_VERTEX_SHADER = `
// Vertex shader for fog slot effect
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
 * WebGPU fragment shader source for fog slot.
 */
export const FOG_SLOT_FRAGMENT_SHADER = `
// Fragment shader for fog slot effect
struct FogSlotUniforms {
  time: f32,
  density: f32,
  movementSpeed: f32,
  turbulence: f32,
  scattering: f32,
  elevation: f32,
  glowIntensity: f32,
  resolution: vec2<f32>,
  fogColor: vec3<f32>,
  backgroundColor: vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: FogSlotUniforms;

// 3D noise function for realistic fog
fn noise3D(p: vec3<f32>) -> f32 {
  return fract(sin(dot(p, vec3<f32>(12.9898, 78.233, 45.543))) * 43758.5453);
}

// Smooth 3D noise
fn smoothNoise3D(p: vec3<f32>) -> f32 {
  let tl = noise3D(floor(p));
  let tr = noise3D(floor(p) + vec3<f32>(1.0, 0.0, 0.0));
  let bl = noise3D(floor(p) + vec3<f32>(0.0, 1.0, 0.0));
  let br = noise3D(floor(p) + vec3<f32>(1.0, 1.0, 0.0));
  
  let tlz = noise3D(floor(p) + vec3<f32>(0.0, 0.0, 1.0));
  let trz = noise3D(floor(p) + vec3<f32>(1.0, 0.0, 1.0));
  let blz = noise3D(floor(p) + vec3<f32>(0.0, 1.0, 1.0));
  let brz = noise3D(floor(p) + vec3<f32>(1.0, 1.0, 1.0));
  
  let x = fract(p.x);
  let y = fract(p.y);
  let z = fract(p.z);
  
  let top = mix(tl, tr, x);
  let bottom = mix(bl, br, x);
  let topZ = mix(tlz, trz, x);
  let bottomZ = mix(blz, brz, x);
  
  let mid = mix(top, bottom, y);
  let midZ = mix(topZ, bottomZ, y);
  
  return mix(mid, midZ, z);
}

// Fractal Brownian Motion for 3D noise
fn fbm3D(p: vec3<f32>, octaves: i32) -> f32 {
  var value = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  
  for (var i = 0; i < octaves; i = i + 1) {
    value = value + amplitude * smoothNoise3D(p * frequency);
    amplitude = amplitude * 0.5;
    frequency = frequency * 2.0;
  }
  
  return value;
}

// Atmospheric scattering function
fn atmosphericScattering(viewDir: vec3<f32>, lightDir: vec3<f32>, density: f32) -> f32 {
  let cosAngle = dot(viewDir, lightDir);
  let scatterFactor = pow(max(0.0, cosAngle), 2.0);
  return scatterFactor * density * uniforms.scattering;
}

@fragment
fn main(@location(0) uv: vec2<f32>, @location(1) worldPos: vec2<f32>) -> @location(0) vec4<f32> {
  // Create 3D coordinates for noise
  let time = uniforms.time * uniforms.movementSpeed;
  let noiseCoord = vec3<f32>(
    worldPos.x * 3.0 + time * 0.1,
    worldPos.y * 3.0 + time * 0.15,
    time * 0.05
  );
  
  // Generate fog density using 3D noise
  let fogNoise = fbm3D(noiseCoord, 6);
  let turbulenceNoise = fbm3D(noiseCoord * 2.0, 3);
  
  // Apply turbulence
  let finalTurbulence = turbulenceNoise * uniforms.turbulence * 0.3;
  
  // Calculate base fog density
  let baseDensity = uniforms.density + finalTurbulence;
  
  // Apply elevation effect (fog settles at bottom)
  let elevationFactor = 1.0 - (worldPos.y * uniforms.elevation);
  let elevationDensity = baseDensity * elevationFactor;
  
  // Create fog layers with different densities
  let layer1 = fbm3D(noiseCoord * 1.0, 4) * 0.6;
  let layer2 = fbm3D(noiseCoord * 2.0, 3) * 0.3;
  let layer3 = fbm3D(noiseCoord * 4.0, 2) * 0.1;
  let layeredFog = layer1 + layer2 + layer3;
  
  // Combine all density factors
  let finalDensity = elevationDensity * (0.7 + 0.3 * layeredFog);
  
  // Clamp density to valid range
  finalDensity = clamp(finalDensity, 0.0, 1.0);
  
  // Calculate atmospheric scattering
  let viewDir = normalize(vec3<f32>(worldPos - 0.5, 0.5));
  let lightDir = normalize(vec3<f32>(0.3, 0.7, 0.2));
  let scatteringAmount = atmosphericScattering(viewDir, lightDir, finalDensity);
  
  // Base fog color with scattering
  var fogColor = uniforms.fogColor;
  fogColor = fogColor + vec3<f32>(scatteringAmount);
  
  // Add glow effect
  let glowNoise = fbm3D(noiseCoord * 0.5, 2);
  let glowMask = smoothstep(0.3, 0.7, glowNoise);
  let glowEffect = glowMask * uniforms.glowIntensity * vec3<f32>(0.2, 0.3, 0.4);
  fogColor = fogColor + glowEffect;
  
  // Create depth effect (fog is thicker in background)
  let depth = 1.0 - distance(worldPos, vec2<f32>(0.5, 0.5));
  let depthDensity = finalDensity * (0.5 + 0.5 * depth);
  
  // Mix fog with background based on density
  let finalColor = mix(uniforms.backgroundColor, fogColor, depthDensity);
  
  // Add subtle animation to fog edges
  let edgeNoise = fbm3D(noiseCoord * 8.0, 1);
  let edgeAnimation = sin(edgeNoise * 10.0 + time * 2.0) * 0.05;
  finalColor = finalColor + edgeAnimation;
  
  // Set alpha based on fog density
  let alpha = 0.3 + 0.7 * finalDensity;
  
  return vec4<f32>(finalColor, alpha);
}
`;

/**
 * WebGL2 fallback vertex shader.
 */
export const FOG_SLOT_VERTEX_SHADER_WEBGL2 = `#version 300 es
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
export const FOG_SLOT_FRAGMENT_SHADER_WEBGL2 = `#version 300 es
precision highp float;

in vec2 vUV;
in vec2 vWorldPos;

out vec4 fragColor;

uniform float uTime;
uniform float uDensity;
uniform float uMovementSpeed;
uniform float uTurbulence;
uniform float uScattering;
uniform float uElevation;
uniform float uGlowIntensity;
uniform vec2 uResolution;
uniform vec3 uFogColor;
uniform vec3 uBackgroundColor;

// 3D noise function
float noise3D(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
}

// Smooth 3D noise
float smoothNoise3D(vec3 p) {
  float tl = noise3D(floor(p));
  float tr = noise3D(floor(p) + vec3(1.0, 0.0, 0.0));
  float bl = noise3D(floor(p) + vec3(0.0, 1.0, 0.0));
  float br = noise3D(floor(p) + vec3(1.0, 1.0, 0.0));
  
  float tlz = noise3D(floor(p) + vec3(0.0, 0.0, 1.0));
  float trz = noise3D(floor(p) + vec3(1.0, 0.0, 1.0));
  float blz = noise3D(floor(p) + vec3(0.0, 1.0, 1.0));
  float brz = noise3D(floor(p) + vec3(1.0, 1.0, 1.0));
  
  float x = fract(p.x);
  float y = fract(p.y);
  float z = fract(p.z);
  
  float top = mix(tl, tr, x);
  float bottom = mix(bl, br, x);
  float topZ = mix(tlz, trz, x);
  float bottomZ = mix(blz, brz, x);
  
  float mid = mix(top, bottom, y);
  float midZ = mix(topZ, bottomZ, y);
  
  return mix(mid, midZ, z);
}

// Fractal Brownian Motion
float fbm3D(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  
  for (int i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise3D(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

// Atmospheric scattering
float atmosphericScattering(vec3 viewDir, vec3 lightDir, float density) {
  float cosAngle = dot(viewDir, lightDir);
  float scatterFactor = pow(max(0.0, cosAngle), 2.0);
  return scatterFactor * density * uScattering;
}

void main() {
  float time = uTime * uMovementSpeed;
  vec3 noiseCoord = vec3(
    vWorldPos.x * 3.0 + time * 0.1,
    vWorldPos.y * 3.0 + time * 0.15,
    time * 0.05
  );
  
  float fogNoise = fbm3D(noiseCoord, 6);
  float turbulenceNoise = fbm3D(noiseCoord * 2.0, 3);
  
  float finalTurbulence = turbulenceNoise * uTurbulence * 0.3;
  
  float baseDensity = uDensity + finalTurbulence;
  
  float elevationFactor = 1.0 - (vWorldPos.y * uElevation);
  float elevationDensity = baseDensity * elevationFactor;
  
  float layer1 = fbm3D(noiseCoord * 1.0, 4) * 0.6;
  float layer2 = fbm3D(noiseCoord * 2.0, 3) * 0.3;
  float layer3 = fbm3D(noiseCoord * 4.0, 2) * 0.1;
  float layeredFog = layer1 + layer2 + layer3;
  
  float finalDensity = elevationDensity * (0.7 + 0.3 * layeredFog);
  
  finalDensity = clamp(finalDensity, 0.0, 1.0);
  
  vec3 viewDir = normalize(vec3(vWorldPos - 0.5, 0.5));
  vec3 lightDir = normalize(vec3(0.3, 0.7, 0.2));
  float scatteringAmount = atmosphericScattering(viewDir, lightDir, finalDensity);
  
  vec3 fogColor = uFogColor;
  fogColor += vec3(scatteringAmount);
  
  float glowNoise = fbm3D(noiseCoord * 0.5, 2);
  float glowMask = smoothstep(0.3, 0.7, glowNoise);
  vec3 glowEffect = glowMask * uGlowIntensity * vec3(0.2, 0.3, 0.4);
  fogColor += glowEffect;
  
  float depth = 1.0 - distance(vWorldPos, vec2(0.5, 0.5));
  float depthDensity = finalDensity * (0.5 + 0.5 * depth);
  
  vec3 finalColor = mix(uBackgroundColor, fogColor, depthDensity);
  
  float edgeNoise = fbm3D(noiseCoord * 8.0, 1);
  float edgeAnimation = sin(edgeNoise * 10.0 + time * 2.0) * 0.05;
  finalColor += edgeAnimation;
  
  float alpha = 0.3 + 0.7 * finalDensity;
  
  fragColor = vec4(finalColor, alpha);
}
`;

/**
 * Converts hex color to RGB vector.
 * @param hex - Hex color string (e.g., "#a8dadc").
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
 * Creates fog slot shader configuration from config object.
 * @param config - Fog slot configuration.
 * @returns Shader configuration object.
 */
export const createFogSlotShaderConfig = (config: Partial<FogSlotConfig> = {}) => {
  const finalConfig = { ...DEFAULT_FOG_SLOT_CONFIG, ...config };
  
  return {
    uniforms: {
      time: { type: 'float', value: 0.0 },
      density: { type: 'float', value: finalConfig.density },
      movementSpeed: { type: 'float', value: finalConfig.movementSpeed },
      turbulence: { type: 'float', value: finalConfig.turbulence },
      scattering: { type: 'float', value: finalConfig.scattering },
      elevation: { type: 'float', value: finalConfig.elevation },
      glowIntensity: { type: 'float', value: finalConfig.glowIntensity },
      resolution: { type: 'vec2', value: [512, 512] },
      fogColor: { type: 'vec3', value: hexToRgb(finalConfig.fogColor) },
      backgroundColor: { type: 'vec3', value: hexToRgb(finalConfig.backgroundColor) },
    },
    vertexShader: FOG_SLOT_VERTEX_SHADER,
    fragmentShader: FOG_SLOT_FRAGMENT_SHADER,
    vertexShaderWebGL2: FOG_SLOT_VERTEX_SHADER_WEBGL2,
    fragmentShaderWebGL2: FOG_SLOT_FRAGMENT_SHADER_WEBGL2,
  };
};
