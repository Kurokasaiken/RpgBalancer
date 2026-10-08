/**
 * questS1Lab/hud/StageBand — the stage: the authored painting is the hero
 * (Director D1, PLAN-024), formation and horde ride over it as material
 * readouts, the astrolabe docks in the middle on combat turns.
 */

import React from 'react';
import type { HarmEvent, QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { FormationRow, HordePanel } from './DamageChannel';
import { SCRIM } from './atoms';

export interface StageBandProps {
  party: QuestRunState['party'];
  /** presented (not committed) HP per member — the pipeline's replay value. */
  presentedHp: (memberId: string) => number;
  /** exposure % per living member id; rendered only in combat. */
  exposure: Record<string, number>;
  inCombat: boolean;
  /** harm event currently on stage, if any. */
  activeHarm: HarmEvent | null;
  deltaByMember: Record<string, number>;
  spentIds: Set<string>;
  /** Docked astrolabe element (combat cinematic), already configured. */
  astroNode: React.ReactNode | null;
  astroDocked: boolean;
  sceneArt?: { src: string; fit: 'contain' | 'cover' };
  hordeShown: number;
  hordeTotal: number;
  hordeDying: number;
  intentHits: number;
}

/** STAGE — painting full-bleed; formation bottom-left, horde bottom-right,
 *  docked astrolabe centred. Edge scrims are deep teal (guide §1.3). */
export const StageBand: React.FC<StageBandProps> = ({
  party, presentedHp, exposure, inCombat,
  activeHarm, deltaByMember, spentIds,
  astroNode, astroDocked, sceneArt,
  hordeShown, hordeTotal, hordeDying, intentHits,
}) => (
  <section className="relative min-h-0 flex-1 overflow-hidden">
    {/* The authored scene is the hero: full-bleed, masked at the edges so
        the formation, the horde and the plaque shadows always read. */}
    {sceneArt && (
      <img
        src={sceneArt.src}
        alt=""
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: sceneArt.fit === 'cover' ? 'cover' : 'contain',
          objectPosition: '50% 40%',
          background: 'var(--skin-hud-lacquer-deep)',
        }}
      />
    )}
    <div className="pointer-events-none absolute inset-y-0 left-0 w-[30%]" style={{ background: SCRIM.edgeLeft }} />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[30%]" style={{ background: SCRIM.edgeRight }} />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]" style={{ background: SCRIM.bottom }} />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%]" style={{ background: SCRIM.top }} />

    {/* Formation — bottom-left column, physical order; tombstones ride on
        top, the living close ranks toward the ground line / horde. */}
    <div className="absolute bottom-4 left-4 flex w-[min(430px,36vw)] flex-col gap-2">
      {[...party.filter((m) => m.dead), ...party.filter((m) => !m.dead)].map((m) => (
        <FormationRow
          key={m.id}
          member={m}
          presentedHp={presentedHp(m.id)}
          exposurePct={inCombat && !m.dead ? (exposure[m.id] ?? 0) : null}
          activeHarm={activeHarm?.memberId === m.id ? activeHarm : null}
          deltaAmount={deltaByMember[m.id] ?? 0}
          spent={spentIds.has(m.id)}
        />
      ))}
    </div>

    {/* Horde — anonymous tokens + honest intent, bottom-right, combat only. */}
    {inCombat && (
      <div className="absolute bottom-4 right-4">
        <HordePanel
          shown={hordeShown}
          total={hordeTotal}
          dying={hordeDying}
          intent={intentHits}
        />
      </div>
    )}

    {/* Docked astrolabe — the suite sizes on the viewport, so it lives in a
        real box scaled down (zoom, no CSS file). */}
    {astroDocked && astroNode && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="pointer-events-auto h-[780px] w-[780px] shrink-0 [&_.scene-col]:[flex:1_1_100%]"
          style={{ zoom: 0.44 } as React.CSSProperties}
        >
          {astroNode}
        </div>
      </div>
    )}
  </section>
);

export default StageBand;
