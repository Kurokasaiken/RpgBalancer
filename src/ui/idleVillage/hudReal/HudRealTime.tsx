/**
 * HudRealTime — time control of PLAN-110 C11, rewritten on the F2 `TimeContract` (PLAN-112 F4.1).
 * One generated bar (build-fullbar-assets.py --square --field) with an empty plaque and four round sockets; label and controls are
 * live content in code. Real data (via `HudRealTimeConnected`): `currentDay`, `isDayPhase`, `cycleProgress`, `isPaused`, `speedMultiplier`,
 * `availableSpeeds`, `timeInputLocked`. The component binds NO keys: the game page already owns Space (pause) and 1-9 (speed).
 * Only as many speed sockets as the bar has (3): the available speeds beyond that stay reachable from the keyboard.
 */
import type { TimeContract } from './contracts/hudContracts';
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { HUD_TYPE, hudPx } from './hudType';
import { TIME_BAR as BAR } from './timeGeometry';

const ASSET = '/assets/ui/hud-real/time/bar.webp';
const C = { text: '#f3ead0', gold: '#f1d88a', dim: '#cdbf8e', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)', focus: '#e8c766', glow: 'rgba(240, 201, 135, 0.55)', dayTint: '#f1d88a', nightTint: '#b9d2f0' } as const;
const SCOPED_CSS = `
[data-hudreal-time] button { background: transparent; border: 0; padding: 0; cursor: pointer; border-radius: 50%; user-select: none; }
[data-hudreal-time] button:disabled { cursor: default; opacity: 0.5; }
[data-hudreal-time] button:focus { outline: none; }
[data-hudreal-time] button:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; }
[data-hudreal-time] button:not(:disabled):hover { filter: brightness(1.25); }
`;

export interface HudRealTimeLabels {
  pause: string; resume: string; speedGroup: string; speed: (s: number) => string; spaceKey: string; paused: string;
}
export interface HudRealTimeProps extends TimeContract { labels: HudRealTimeLabels }

export function HudRealTime({ dayLabel, isDayPhase, cycleProgress, isPaused, locked, speed, labels }: HudRealTimeProps) {
  const f = BAR.field;
  const ring = (on: boolean) => (on ? { boxShadow: `0 0 0 2px ${C.gold}, 0 0 10px ${C.glow}` } : undefined);
  const pos = (i: number) => ({ position: 'absolute' as const, left: BAR.slots[i].x, top: BAR.slots[i].y, width: BAR.slots[i].w, height: BAR.slots[i].h, display: 'grid', placeItems: 'center' });
  const shown = speed.available.slice(0, BAR.slots.length - 1);
  const progress = Math.max(0, Math.min(1, cycleProgress));
  return (
    <section data-hudreal-time="" data-paused={isPaused ? 'true' : 'false'} aria-label={dayLabel} style={{ position: 'relative', userSelect: 'none', width: BAR.w, height: BAR.h }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', left: f.x + 8, top: f.y, width: f.w - 24, height: f.h, display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: hudPx(HUD_TYPE.value), letterSpacing: 1, color: C.text, textShadow: C.shadow, whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        <span aria-hidden="true" title={isDayPhase ? 'day' : 'night'} style={{ flex: 'none', width: 12, height: 12, borderRadius: '50%', background: `conic-gradient(${isDayPhase ? C.dayTint : C.nightTint} ${progress * 360}deg, rgba(255,255,255,0.18) 0)`, boxShadow: `0 0 6px ${isDayPhase ? C.glow : 'rgba(150,190,240,0.4)'}` }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{dayLabel}</span>
      </div>
      <HudTooltip label={isPaused ? labels.resume : labels.pause} shortcut={labels.spaceKey} side="bottom" wrap>
        <button type="button" data-hr-time="pause" aria-pressed={isPaused} aria-label={isPaused ? labels.resume : labels.pause} disabled={locked} onClick={speed.onTogglePause}
          style={{ ...pos(0), color: isPaused ? C.gold : C.dim, ...ring(isPaused) }}>
          <EngravedIcon id={isPaused ? 'cmd-play' : 'cmd-pause'} size={16} />
        </button>
      </HudTooltip>
      <div role="radiogroup" aria-label={labels.speedGroup}>
        {shown.map((s, i) => {
          const on = speed.multiplier === s && !isPaused;
          return (
            <HudTooltip key={s} label={labels.speed(s)} shortcut={String(i + 1)} side="bottom" wrap>
              <button type="button" role="radio" data-hr-time={`x${s}`} aria-checked={speed.multiplier === s} aria-label={labels.speed(s)} disabled={locked} onClick={() => speed.onChange(s)}
                style={{ ...pos(i + 1), color: on ? C.gold : C.dim, fontFamily: '"EB Garamond", serif', fontWeight: 700, fontSize: hudPx(HUD_TYPE.secondary), textShadow: C.shadow, ...ring(on) }}>×{s}</button>
            </HudTooltip>
          );
        })}
      </div>
    </section>
  );
}
