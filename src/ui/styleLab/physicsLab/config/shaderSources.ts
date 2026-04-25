/**
 * WebGPU and WebGL2 shader sources for Physics Lab
 */

export const shaderSources = {
  'liquid-gauge': {
    vertex: `
      struct VertexOutput {
        @builtin(position) position: vec4<f32>;
        @builtin(vertex_idx) vertex_idx: u32;
      };
      
      @vertex
      fn vs_main(@builtin(position) position: vec4<f32>, @builtin(vertex_idx) vertex_idx: u32) -> VertexOutput {
        var output: VertexOutput;
        output.position = position;
        return output;
      }
    `,
    fragment: `
      @fragment
      fn fs_main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
        let normalizedPos = position.xy / vec2<f32>(800.0, 600.0);
        let dist = length(normalizedPos - vec2<f32>(0.5, 0.5));
        
        var color = vec3<f32>(0.1, 0.2, 0.3);
        if (dist < 0.3) {
          color = vec3<f32>(0.2, 0.8, 1.0);
        }
        
        return vec4<f32>(color, 1.0);
      }
    `
  },
  'fog-slot': {
    vertex: `
      struct VertexOutput {
        @builtin(position) position: vec4<f32>;
        @location(0) uv: vec2<f32>;
      };
      
      @vertex
      fn vs_main(@builtin(vertex_idx) vertex_idx: u32) -> VertexOutput {
        var output: VertexOutput;
        let pos = array<vec2<f32>, 6>(
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 1.0, -1.0),
          vec2<f32>( 1.0,  1.0),
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 1.0,  1.0),
          vec2<f32>(-1.0,  1.0)
        );
        
        output.position = vec4<f32>(pos[vertex_idx % 6], 0.0, 1.0);
        output.uv = (pos[vertex_idx % 6] + vec2<f32>(1.0, 1.0)) * 0.5;
        return output;
      }
    `,
    fragment: `
      @group(0) @binding(0) var<uniform> time: f32;
      @group(0) @binding(1) var<uniform> turbulence: f32;
      
      @fragment
      fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
        let noise = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time) * turbulence;
        let fog = smoothstep(0.3, 0.7, noise + 0.5);
        
        return vec4<f32>(vec3<f32>(0.8, 0.9, 1.0) * fog, fog * 0.5);
      }
    `
  },
  'foil-card': {
    vertex: `
      struct VertexOutput {
        @builtin(position) position: vec4<f32>;
        @location(0) uv: vec2<f32>;
        @location(1) normal: vec3<f32>;
      };
      
      @vertex
      fn vs_main(@builtin(vertex_idx) vertex_idx: u32) -> VertexOutput {
        var output: VertexOutput;
        let pos = array<vec2<f32>, 6>(
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 1.0, -1.0),
          vec2<f32>( 1.0,  1.0),
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 1.0,  1.0),
          vec2<f32>(-1.0,  1.0)
        );
        
        output.position = vec4<f32>(pos[vertex_idx % 6], 0.0, 1.0);
        output.uv = (pos[vertex_idx % 6] + vec2<f32>(1.0, 1.0)) * 0.5;
        output.normal = vec3<f32>(0.0, 0.0, 1.0);
        return output;
      }
    `,
    fragment: `
      @group(0) @binding(0) var<uniform> time: f32;
      @group(0) @binding(1) var<uniform> shimmer: f32;
      
      @fragment
      fn fs_main(@location(0) uv: vec2<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
        let shimmerEffect = sin(uv.x * 20.0 + time * 2.0) * cos(uv.y * 15.0 + time) * shimmer;
        let metallic = vec3<f32>(0.9, 0.95, 1.0);
        let finalColor = metallic + shimmerEffect;
        
        return vec4<f32>(finalColor, 1.0);
      }
    `
  }
};

export const webgl2ShaderSources = {
  'liquid-gauge': {
    vertex: `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
      }
    `,
    fragment: `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(v_uv, center);
        
        vec3 color = vec3(0.1, 0.2, 0.3);
        if (dist < 0.3) {
          color = vec3(0.2, 0.8, 1.0);
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  'fog-slot': {
    vertex: `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
      }
    `,
    fragment: `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform float u_turbulence;
      
      void main() {
        float noise = sin(v_uv.x * 10.0 + u_time) * cos(v_uv.y * 10.0 + u_time) * u_turbulence;
        float fog = smoothstep(0.3, 0.7, noise + 0.5);
        
        gl_FragColor = vec4(vec3(0.8, 0.9, 1.0) * fog, fog * 0.5);
      }
    `
  },
  'foil-card': {
    vertex: `
      attribute vec2 a_position;
      varying vec2 v_uv;
      varying vec3 v_normal;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
        v_normal = vec3(0.0, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      varying vec2 v_uv;
      varying vec3 v_normal;
      uniform float u_time;
      uniform float u_shimmer;
      
      void main() {
        float shimmerEffect = sin(v_uv.x * 20.0 + u_time * 2.0) * cos(v_uv.y * 15.0 + u_time) * u_shimmer;
        vec3 metallic = vec3(0.9, 0.95, 1.0);
        vec3 finalColor = metallic + shimmerEffect;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }
};
