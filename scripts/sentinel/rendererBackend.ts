/**
 * rendererBackend — host-conditional Chromium GL/ANGLE backend selection
 * (PLAN-078 T-001).
 *
 * Headless Chromium has no WebGL by default; Pixi falls back to a Canvas
 * renderer and the Sentinel would audit pixels the player never sees.
 * The backend is host-conditional (never hardcoded `--use-angle=metal`):
 *   macOS   → `--use-angle=metal`       (renderer_class: metal)
 *   Windows → `--use-angle=d3d11`       (renderer_class: d3d11)
 *   Linux/CI without GPU → SwiftShader   (renderer_class: software)
 *
 * `renderer_class` is part of the performance-baseline keying
 * (`fps_p95@<renderer_class>@<state>`) and software-renderer findings are
 * advisory-only — never auto-ingested as defects.
 *
 * Override via `SENTINEL_RENDERER` (or legacy `HARNESS_GL`):
 *   `metal` | `d3d11` | `vulkan` | `swiftshader` | `none` (Chromium default).
 */

export type RendererBackend = 'metal' | 'd3d11' | 'vulkan' | 'swiftshader' | 'none';

/** `software` = SwiftShader advisory path; anything else is hardware GL. */
export type RendererClass = 'metal' | 'd3d11' | 'vulkan' | 'default' | 'software';

export interface ResolvedBackend {
  /** Chromium launch args for the chosen backend. */
  args: string[];
  /** Renderer class recorded in findings and perf baselines. */
  rendererClass: RendererClass;
  /** True when the run uses a software rasterizer (advisory-only findings). */
  software: boolean;
  /** Why this backend was picked — recorded in the run manifest. */
  source: 'env-override' | 'host-default';
}

const SWIFTSHADER_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/** Args for an explicit hardware ANGLE backend name. */
function angleArgs(backend: RendererBackend): string[] {
  switch (backend) {
    case 'swiftshader':
      return SWIFTSHADER_ARGS;
    case 'none':
      return [];
    default:
      return [`--use-angle=${backend}`];
  }
}

function toRendererClass(backend: RendererBackend): RendererClass {
  if (backend === 'swiftshader') return 'software';
  if (backend === 'none') return 'default';
  return backend;
}

/**
 * Resolves the GL backend for this host. `platform`/`ci`/`override` are
 * injectable for unit tests; by default they read the real environment.
 */
export function resolveAngleBackend(opts: {
  platform?: NodeJS.Platform;
  override?: string | null;
} = {}): ResolvedBackend {
  const platform = opts.platform ?? process.platform;
  const override = opts.override ?? process.env.SENTINEL_RENDERER ?? process.env.HARNESS_GL ?? null;

  if (override) {
    const backend = override as RendererBackend;
    return {
      args: angleArgs(backend),
      rendererClass: toRendererClass(backend),
      software: backend === 'swiftshader',
      source: 'env-override',
    };
  }

  const backend: RendererBackend =
    platform === 'darwin' ? 'metal' : platform === 'win32' ? 'd3d11' : 'swiftshader';
  return {
    args: angleArgs(backend),
    rendererClass: toRendererClass(backend),
    software: backend === 'swiftshader',
    source: 'host-default',
  };
}

/** Baseline key segment for perf metrics — `fps_p95@<renderer_class>@<state>`. */
export function perfBaselineKey(metric: string, rendererClass: RendererClass, stateNode: string): string {
  return `${metric}@${rendererClass}@${stateNode}`;
}
