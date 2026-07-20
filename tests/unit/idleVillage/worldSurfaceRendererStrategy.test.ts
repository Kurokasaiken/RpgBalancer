import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  selectWorldSurfaceRenderer,
  WorldSurfaceManifestSchema,
} from '../../../src/ui/idleVillage/config/worldSurfaceConfig';
import { isWebGLSupported } from '../../../src/ui/idleVillage/utils/webglSupport';

const baseManifest = {
  version: '1.0.0',
  world: 'wanderlust',
  variant: 'base',
  coordinateSystem: {
    space: 'world_pixels',
    origin: 'top_left',
    unit: 'px',
    canvas: { width: 1248, height: 832 },
  },
  resolutionHint: { runtime: { width: 1248, height: 832 } },
  assetPolicy: { resolution: 'runtime_only' },
  camera: { minZoom: 0.5, maxZoom: 3, defaultZoom: 1, panEnabled: true, zoomEnabled: true },
  surfaceLayers: [],
  atmosphereLayers: [],
  visualStates: [],
  regions: [],
  anchors: [],
  tags: [],
};

const defaultInput = {
  objectCount: 0,
  hasParticleObjects: false,
  hasParticleLayers: false,
  hasShaderLayers: false,
  webglSupported: true,
};

describe('selectWorldSurfaceRenderer', () => {
  it('defaults to dom when no heavy conditions are met', () => {
    const config = WorldSurfaceManifestSchema.parse(baseManifest).renderer;
    expect(selectWorldSurfaceRenderer(config, defaultInput)).toBe('dom');
  });

  it('selects webgl when runtime object count exceeds the threshold', () => {
    const config = WorldSurfaceManifestSchema.parse(baseManifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, { ...defaultInput, objectCount: 51 }),
    ).toBe('webgl');
  });

  it('selects webgl for particle objects when enableForParticles is true', () => {
    const config = WorldSurfaceManifestSchema.parse(baseManifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, { ...defaultInput, hasParticleObjects: true }),
    ).toBe('webgl');
  });

  it('selects webgl for shader layers when enableForShaders is true', () => {
    const config = WorldSurfaceManifestSchema.parse(baseManifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, { ...defaultInput, hasShaderLayers: true }),
    ).toBe('webgl');
  });

  it('falls back to dom when WebGL is unavailable and fallback is enabled', () => {
    const config = WorldSurfaceManifestSchema.parse(baseManifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, {
        ...defaultInput,
        objectCount: 100,
        webglSupported: false,
      }),
    ).toBe('dom');
  });

  it('forces webgl when mode is webgl and fallback is disabled', () => {
    const manifest = {
      ...baseManifest,
      renderer: { mode: 'webgl', fallbackToDom: false },
    };
    const config = WorldSurfaceManifestSchema.parse(manifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, { ...defaultInput, webglSupported: false }),
    ).toBe('webgl');
  });

  it('forces dom when mode is dom even with heavy particles', () => {
    const manifest = { ...baseManifest, renderer: { mode: 'dom' } };
    const config = WorldSurfaceManifestSchema.parse(manifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, {
        ...defaultInput,
        objectCount: 200,
        hasParticleObjects: true,
        hasShaderLayers: true,
      }),
    ).toBe('dom');
  });

  it('honours custom dom object threshold', () => {
    const manifest = { ...baseManifest, renderer: { domObjectThreshold: 10 } };
    const config = WorldSurfaceManifestSchema.parse(manifest).renderer;
    expect(selectWorldSurfaceRenderer(config, { ...defaultInput, objectCount: 9 })).toBe('dom');
    expect(selectWorldSurfaceRenderer(config, { ...defaultInput, objectCount: 11 })).toBe('webgl');
  });

  it('ignores particle triggers when enableForParticles is false', () => {
    const manifest = { ...baseManifest, renderer: { enableForParticles: false } };
    const config = WorldSurfaceManifestSchema.parse(manifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, { ...defaultInput, hasParticleObjects: true }),
    ).toBe('dom');
  });

  it('ignores shader triggers when enableForShaders is false', () => {
    const manifest = { ...baseManifest, renderer: { enableForShaders: false } };
    const config = WorldSurfaceManifestSchema.parse(manifest).renderer;
    expect(
      selectWorldSurfaceRenderer(config, { ...defaultInput, hasShaderLayers: true }),
    ).toBe('dom');
  });
});

describe('isWebGLSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when getContext returns null', () => {
    const getContext = vi.fn().mockReturnValue(null);
    vi.stubGlobal('document', {
      createElement: () => ({ getContext }),
    });
    expect(isWebGLSupported()).toBe(false);
    expect(getContext).toHaveBeenCalledWith('webgl');
  });

  it('returns true when getContext returns any WebGL rendering context', () => {
    const fakeContext = {};
    const getContext = vi.fn().mockReturnValue(fakeContext);
    vi.stubGlobal('document', {
      createElement: () => ({ getContext }),
    });
    expect(isWebGLSupported()).toBe(true);
  });

  it('returns false when document is undefined', () => {
    vi.stubGlobal('document', undefined);
    expect(isWebGLSupported()).toBe(false);
  });
});
