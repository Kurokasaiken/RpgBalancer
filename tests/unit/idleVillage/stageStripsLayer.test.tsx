/**
 * R-215 — StageStripsLayer wing rails.
 *
 * The rail marks the collapsed edge of a wing zone that holds strips. A
 * zero-width zone (empty stage — every zone collapsed to the band centre, or
 * the `run` regime where every zone is {x:0,w:0}) owns no edge to mark: the
 * `w <= wingRailPx` predicate painted a phantom 1px filet line — on an empty
 * 1440 stage, TWO parallel golden lines at x=712/728 straddling the centre.
 */
import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import {
  GameStageProvider,
  StageStripsLayer,
  useGameStageZonesState,
  type GameStageApi,
} from '@/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones';

/** Mounts the real stage owner + strip layer; exposes the commit api. */
function Harness({ onApi }: { onApi?: (api: GameStageApi) => void }) {
  const stage = useGameStageZonesState();
  useEffect(() => {
    onApi?.(stage.api);
  }, [stage.api, onApi]);
  return (
    <GameStageProvider value={stage}>
      <StageStripsLayer />
    </GameStageProvider>
  );
}

const rails = () => document.querySelectorAll('[data-stage-rail]');
const rail = (zone: string) => document.querySelector(`[data-stage-rail="${zone}"]`);

describe('StageStripsLayer — wing rails (R-215)', () => {
  it('paints NO rail on an empty stage — a zero-width zone owns no collapsed edge', () => {
    render(<Harness />);
    expect(rails()).toHaveLength(0);
  });

  it('keeps the rail on a wing that actually holds strips', () => {
    let api: GameStageApi | null = null;
    render(<Harness onApi={(a) => (api = a)} />);
    /* jsdom viewport (1024) is under both collapse thresholds → an opened
     * wing panel force-strips and the wing takes exactly wingRailPx. */
    act(() => api!.open('roster'));
    expect(rail('leftWing')).not.toBeNull();
    expect(rail('rightWing')).toBeNull();
  });
});
