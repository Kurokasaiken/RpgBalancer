/**
 * HudRealTimeShellLayers — the reusable painted shell of the Time bar.
 *
 * This component is intentionally only the shared object: bar art plus the
 * optional medallion frame. Time renders its dial/buttons above it; Events renders
 * its own reading above the same layers mirrored, using the baked empty-shell
 * derivative rather than a runtime mask. No forked Events shell component exists.
 */
import React from 'react';
import {
  resolveTimeShellLayout,
  type ShellBarGeometry,
  type ShellDialGeometry,
} from './timeShellGeometry';

export interface HudRealTimeShellLayersProps {
  bar: ShellBarGeometry;
  asset: string;
  dial: ShellDialGeometry;
  /** Mirror the painted shell horizontally without mirroring live children. */
  mirrored?: boolean;
}

export const HudRealTimeShellLayers: React.FC<HudRealTimeShellLayersProps> = ({
  bar,
  asset,
  dial,
  mirrored = false,
}) => {
  const layout = resolveTimeShellLayout(bar, dial, mirrored);
  const flip = mirrored ? 'scaleX(-1)' : undefined;
  const frameSize = dial.frame?.size ?? 0;
  return (
    <>
      <img
        src={asset}
        alt=""
        draggable={false}
        data-time-shell-art=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', transform: flip, pointerEvents: 'none' }}
      />
      {dial.frame && layout.frameCenter && (
        <img
          src={dial.frame.url}
          alt=""
          draggable={false}
          data-time-shell-medallion=""
          style={{
            position: 'absolute',
            left: layout.frameCenter.x - frameSize / 2,
            top: layout.frameCenter.y - frameSize / 2,
            width: frameSize,
            height: frameSize,
            transform: flip,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};
