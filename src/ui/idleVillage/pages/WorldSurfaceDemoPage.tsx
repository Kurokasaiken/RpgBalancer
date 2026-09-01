import React, { useEffect, useState } from 'react';
import { useWorldSurface } from '../hooks/useWorldSurface';
import { WorldSurfaceRenderer } from '../components/WorldSurfaceRenderer';
import type { CameraConfig } from '../config/worldSurfaceConfig';

const MANIFEST_PATH = '/assets/world/wanderlust/base/manifest.json';

function defaultCamera(config: CameraConfig) {
  return { panX: 0, panY: 0, zoom: config.defaultZoom };
}

/**
 * Demo page for the World Surface glass overlay.
 *
 * Full-screen, no debug panels, no test controls. The map is the canvas and the
 * glass teca is the only viewport treatment, so the component can be evaluated
 * as it will look in real use.
 */
export const WorldSurfaceDemoPage: React.FC = () => {
  const { isLoading, error, manifest, cameraConfig } = useWorldSurface(MANIFEST_PATH);
  const [camera, setCamera] = useState<{ panX: number; panY: number; zoom: number }>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });

  useEffect(() => {
    if (cameraConfig) {
      setCamera(defaultCamera(cameraConfig));
    }
  }, [cameraConfig]);

  if (isLoading || !manifest || !cameraConfig) {
    return (
      <div
        className="h-screen w-screen"
        style={{ background: '#020617' }}
        aria-hidden="true"
      />
    );
  }

  if (error) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center text-slate-300"
        style={{ background: '#020617' }}
      >
        <span className="text-sm">{error.message}</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#020617' }}>
      <WorldSurfaceRenderer
        manifest={manifest}
        camera={camera}
        onCameraChange={setCamera}
        showAnchors={false}
        showRegions={false}
        renderObjects={false}
        runtimeObjects={[]}
        breathEnabled
        showWaterField
        showAtmosphere
        showGlass
        imageFit="cover"
      />
    </div>
  );
};
