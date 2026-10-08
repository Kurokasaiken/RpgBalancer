/**
 * questS1Lab/hud/DamageChannel — formation rows (roster-based), exposure
 * badges, damage floaters and the anonymous horde.
 *
 * PLAN-024 T-005 (Director: «c'è il roster per mostrare i PG, usiamo
 * quello»): each living member is a `WanderlustRosterCard` compact strip
 * from the trusted roster surface; the lab's extra data (exposure, delta
 * chips, HP ghost) rides as overlay elements, never as a fork of the card.
 * Colours: skin tokens only (hud_component_guide.md); text ≥12px.
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skull } from 'lucide-react';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';
import { WanderlustRosterCard } from '@/ui/idleVillage/roster';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import type { HarmEvent, QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { SCRIM, TONE } from './atoms';

/** Lucide icon for a chance-per-hit % via the config's tier table. */
export const exposureIcon = (pct: number) => {
  const tier = PRES.formation.exposureTiers.find((ti) => pct <= ti.maxPct) ??
    PRES.formation.exposureTiers[PRES.formation.exposureTiers.length - 1];
  return getStatIconComponent(tier.icon);
};

/** Exposure tone: 0% quiet, mid warn, high danger (icon carries the tier,
 *  so the colour is never the only channel). */
const exposureTone = (pct: number) =>
  pct >= 50 ? TONE.danger : pct > 0 ? TONE.warn : TONE.muted;

/** Transient floater: mounts, rises, fades — transition-only (skin-safe,
 *  no standalone CSS). Lives only while its harm phase is on stage. */
export const DamageFloater: React.FC<{ amount: number; kind: HarmEvent['kind'] }> = ({ amount, kind }) => {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setUp(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <span
      className="pointer-events-none absolute -top-3 right-1 z-20 font-bold"
      style={{
        fontFamily: 'var(--skin-font-serif)',
        fontVariantNumeric: 'tabular-nums',
        fontSize: PRES.type.numberPx,
        color: kind === 'death' ? TONE.danger : TONE.warn,
        textShadow: '0 2px 6px var(--skin-hud-lacquer-deep)',
        transform: up ? `translateY(-${PRES.damage.floatRisePx}px)` : 'translateY(4px)',
        opacity: up ? 0 : 1,
        transition: `transform ${PRES.damage.floatLifeMs}ms ease-out, opacity ${PRES.damage.floatLifeMs}ms ease-in`,
      }}
    >
      −{amount}
    </span>
  );
};

/** Chance-per-hit readout: tier icon + decile pips + exact % (artifact §5 —
 *  the three channels are complementary, never stacked into a cone). */
export const ExposureBadge: React.FC<{ pct: number }> = ({ pct }) => {
  const { t } = useTranslation('idleVillage');
  const Icon = exposureIcon(pct);
  const tone = exposureTone(pct);
  const lit = Math.round((pct / 100) * PRES.formation.exposurePips);
  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-0.5"
      title={t('questS1Lab.exposureTitle', { pct })}
      style={{ borderRadius: 6, background: SCRIM.chipBg }}
    >
      {Icon && (
        <Icon
          style={{ width: 14, height: 14, color: tone }}
          aria-hidden
        />
      )}
      <span className="flex gap-px">
        {Array.from({ length: PRES.formation.exposurePips }).map((_, i) => (
          <span
            key={i}
            style={{
              height: 4,
              width: 4,
              borderRadius: '50%',
              background: i < lit ? tone : 'color-mix(in srgb, var(--skin-text-muted) 30%, transparent)',
              transition: `background ${PRES.formation.exposureRetweenMs}ms`,
            }}
          />
        ))}
      </span>
      <span
        style={{
          fontFamily: 'var(--skin-font-serif)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: PRES.type.labelPx,
          color: tone,
        }}
      >
        {pct}%
      </span>
    </div>
  );
};

/** Tombstone for a fallen member — the slot stays, the ranks close around it. */
const TombstoneRow: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="flex items-center gap-2 px-2.5 py-1.5 opacity-50"
    style={{
      borderRadius: 8,
      border: '1px solid color-mix(in srgb, var(--skin-text-muted) 35%, transparent)',
      background: SCRIM.chipBg,
      filter: 'grayscale(1)',
    }}
  >
    <Skull size={14} style={{ color: TONE.muted, flexShrink: 0 }} aria-hidden />
    <span
      className="truncate"
      style={{
        fontFamily: 'var(--skin-font-display)',
        fontSize: PRES.type.labelPx,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: TONE.muted,
      }}
    >
      {name}
    </span>
  </div>
);

/** One formation row: trusted compact roster card + HP ghost + exposure
 *  badge + the harm channel (floater while its beat plays, durable chip
 *  after). Rows render in physical order; the living close ranks toward the
 *  horde (the column is bottom-anchored on the stage). */
export const FormationRow: React.FC<{
  member: QuestRunState['party'][number];
  presentedHp: number;
  exposurePct: number | null;
  activeHarm: HarmEvent | null;
  deltaAmount: number;
  spent: boolean;
}> = ({ member, presentedHp, exposurePct, activeHarm, deltaAmount, spent }) => {
  const { t } = useTranslation('idleVillage');
  const hit = !!activeHarm;
  if (member.dead) return <TombstoneRow name={member.name} />;
  return (
    <div
      className="relative flex items-center gap-2"
      style={{ transitionDuration: `${PRES.damage.hitMarkerMs}ms` }}
    >
      {/* Roster card (trusted) — hp is the pipeline's PRESENTED value so the
          bar drains with the beat; statusKind paints wounded state. */}
      <div
        className="min-w-0 flex-1"
        style={{
          borderRadius: 10,
          outline: hit ? `1px solid color-mix(in srgb, ${TONE.danger} 70%, transparent)` : undefined,
          outlineOffset: 1,
          background: SCRIM.chipBg,
          transition: `outline-color ${PRES.damage.hitMarkerMs}ms`,
        }}
      >
        <WanderlustRosterCard
          workerId={member.id}
          label={member.name}
          hp={Math.max(0, presentedHp)}
          maxHp={member.maxHp}
          fatigue={0}
          portraitUrl={member.portrait}
          isInteractive={false}
          statusKind={member.wounded ? 'injured' : undefined}
          compact
        />
        {/* HP ghost: marks the hit's hpBefore under the card until the beat
            ends — a hair-line under the roster strip, not inside it. */}
        {activeHarm && activeHarm.hpBefore > presentedHp && (
          <div
            className="absolute inset-x-2 bottom-0.5 h-px"
            style={{
              background: TONE.danger,
              transition: `opacity ${PRES.damage.ghostDrainMs}ms ease-out ${PRES.damage.ghostHoldMs}ms`,
            }}
          />
        )}
      </div>
      {/* Right rail: exposure (combat only) + spent marker. */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        {spent && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: TONE.warn,
              flexShrink: 0,
            }}
            title={t('questS1Lab.spent')}
          />
        )}
        {exposurePct !== null && <ExposureBadge pct={exposurePct} />}
      </div>
      {/* Durable harm chip — pinned until the next action's harms. */}
      {deltaAmount > 0 && (
        <span
          className="absolute -bottom-2 right-1 z-20 px-1.5 font-bold"
          style={{
            borderRadius: 6,
            border: `1px solid color-mix(in srgb, ${TONE.danger} 65%, transparent)`,
            background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 92%, transparent)',
            color: TONE.danger,
            fontFamily: 'var(--skin-font-serif)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: PRES.type.labelPx,
          }}
        >
          −{deltaAmount}
        </span>
      )}
      {activeHarm && <DamageFloater amount={activeHarm.amount} kind={activeHarm.kind} />}
    </div>
  );
};

/** Anonymous horde: tokens only (no invented per-goblin data) + the honest
 *  pre-click intent ⚔×k — hit count is spec-constant, knowable pre-click. */
export const HordePanel: React.FC<{ shown: number; total: number; dying: number; intent: number }> = ({
  shown,
  total,
  dying,
  intent,
}) => {
  const { t } = useTranslation('idleVillage');
  const cap = PRES.formation.maxHordeTokens;
  const tokens = Math.min(shown, cap);
  return (
    <div
      className="flex flex-col items-center gap-2 px-3 py-2.5"
      style={{
        borderRadius: 10,
        border: '1px solid color-mix(in srgb, var(--skin-status-wound) 45%, transparent)',
        background: SCRIM.chipBg,
      }}
    >
      <div
        className="flex items-center gap-1.5 font-bold"
        title={t('questS1Lab.horde.intentTitle')}
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: PRES.type.numberPx,
          color: TONE.danger,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ⚔×{intent}
      </div>
      <div className="flex max-w-[104px] flex-wrap-reverse justify-center gap-1.5">
        {Array.from({ length: tokens }).map((_, i) => {
          const isDying = i >= tokens - dying;
          return (
            <span
              key={i}
              style={{
                height: 13,
                width: 13,
                borderRadius: 3,
                border: `1px solid color-mix(in srgb, ${TONE.danger} ${isDying ? 80 : 50}%, transparent)`,
                background: isDying
                  ? `color-mix(in srgb, ${TONE.danger} 20%, transparent)`
                  : `color-mix(in srgb, ${TONE.danger} 32%, var(--skin-hud-lacquer-deep))`,
                transform: isDying ? 'scale(0.75)' : undefined,
                opacity: isDying ? 0.5 : 1,
                transition: `all ${PRES.timeline.killsMs}ms`,
              }}
            />
          );
        })}
      </div>
      <span
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: PRES.type.labelPx,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: TONE.secondary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('questS1Lab.horde.remaining', { shown, total })}
      </span>
    </div>
  );
};
