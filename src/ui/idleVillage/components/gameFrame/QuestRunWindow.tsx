/**
 * QuestRunWindow — the running quest, as a floating HUD panel on /game (R-106).
 *
 * Reading order, top to bottom (Director 2026-10-08):
 *   title + icons (roster assigned to the quest, bag, chronicle, minimise, close)
 *   → flavour → cinema-scope theater → what happened + the scene → choices
 *   → time bar (game clock, start → return) → phase tiles (played + next).
 *
 * Material: `HudPlaque` panel, dragged by its title row (`useHudPanelDrag`) like
 * every HUD panel; colours only from `--skin-*` tokens; no text under 12px.
 * Minimising folds it into a small plaque that keeps the phase count and a mark
 * while a decision is waiting; closing keeps the run (the Panels menu reopens it).
 */

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Backpack,
  Check,
  CircleHelp,
  Footprints,
  Gem,
  House,
  Minus,
  PackageOpen,
  ScrollText,
  Skull,
  Swords,
  Tent,
  Users,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react';
import { HudPlaque, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { availableOptions, nodesFor, previewOption, type QuestRunState, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import { hpLostByMember, phaseOutcome, type PhaseOutcome, type PhaseRecord } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { HudChip, LOG_TONE, SCRIM, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { ConsumableBelt } from '@/ui/idleVillage/questS1Lab/hud/ConsumableBelt';
import { useHudPanelDrag } from './useHudPanelDrag';

/** Verdict chip tone: the result reads at a glance, before its authored line. */
const VERDICT_TONE: Record<Verdict, 'ok' | 'warn' | 'danger'> = { bigwin: 'ok', win: 'ok', almost: 'warn', fail: 'danger', epicfail: 'danger' };

/** One glyph per authored phase (index = node `beat`). */
const PHASE_ICONS: LucideIcon[] = [ScrollText, Footprints, Gem, Tent, Swords, Wind, PackageOpen, House];

const OUTCOME_TONE: Record<PhaseOutcome, keyof typeof TONE> = { death: 'death', hurt: 'warn', loot: 'label', clean: 'ok' };

const FONT = {
  display: 'var(--skin-font-display)',
  serif: 'var(--skin-font-serif)',
} as const;

export interface QuestRunWindowProps {
  run: QuestRunState;
  phases: PhaseRecord[];
  /** Phase names, indexed by node `beat`. */
  beats: readonly string[];
  title: string;
  flavour: string;
  /** Scene art for a node id. */
  artFor: (nodeId: string) => string | undefined;
  /** 0..1 of the expedition's time on the game clock, plus its readout. */
  time: { progress: number; label: string };
  onChoose: (optionId: string) => void;
  /** Bag items armed for the next check — the player's call (R-106 playtest). */
  armed: boolean;
  onToggleArmed: () => void;
  onUseHealing: () => void;
  onDrinkPotion: () => void;
  onClose: () => void;
  /** Anchored position (the drag offset applies on top). */
  anchor: { left: number; top: number };
  widthPx: number;
  theaterAspect: number;
  tooltipLines: number;
  zIndex?: number;
}

type Pop = 'roster' | 'bag' | 'chronicle' | null;

export const QuestRunWindow: React.FC<QuestRunWindowProps> = ({
  run,
  phases,
  beats,
  title,
  flavour,
  artFor,
  time,
  onChoose,
  armed,
  onToggleArmed,
  onUseHealing,
  onDrinkPotion,
  onClose,
  anchor,
  widthPx,
  theaterAspect,
  tooltipLines,
  zIndex,
}) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();
  const [minimised, setMinimised] = useState(false);
  const [pop, setPop] = useState<Pop>(null);
  const node = nodesFor(run)[run.nodeId];
  const options = useMemo(() => availableOptions(run), [run]);
  // Previews once per run/arming change, not per render: base and armed side by side.
  const previews = useMemo(
    () =>
      Object.fromEntries(
        options.map((o) => {
          const pv = previewOption(run, o.id, { useConsumable: armed });
          const base = pv && armed && pv.consumableFlag ? previewOption(run, o.id, { useConsumable: false }) : null;
          return [o.id, { pv, base }];
        }),
      ),
    [run, options, armed],
  );
  const waiting = !run.ended && options.length > 0;
  // What just happened: this action's checks speak through their authored verdict
  // lines; `lastEvent` only when it adds something (not the check summary, the
  // scene body or the quest's own flavour line again).
  const resolved: ResolvedCheck[] = run.log.length > 1 ? run.checkQueue : [];
  const lastTitle = resolved[resolved.length - 1]?.title;
  const showLastEvent =
    run.log.length > 1 &&
    !!run.lastEvent &&
    run.lastEvent !== node?.body &&
    run.lastEvent !== flavour &&
    !(lastTitle && run.lastEvent.startsWith(`${lastTitle} —`));
  const currentBeat = phases[phases.length - 1]?.beat ?? 0;
  // The scene's own title, unless it only repeats the quest's: then the phase name.
  const caption = node && !node.title.toLowerCase().includes(title.toLowerCase()) ? node.title : beats[currentBeat] ?? '';

  // 1–9 pick a choice, as in a dialogue list; never while typing or minimised.
  useEffect(() => {
    if (minimised || !waiting) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      const index = Number(event.key) - 1;
      const option = Number.isInteger(index) ? options[index] : undefined;
      if (option && !option.disabled) {
        event.preventDefault();
        onChoose(option.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [minimised, waiting, options, onChoose]);

  const shell: CSSProperties = { position: 'fixed', left: anchor.left, top: anchor.top, pointerEvents: 'auto', ...panelStyle, zIndex: panelStyle.zIndex ?? zIndex };

  if (minimised) {
    return (
      <SkinScope>
        <HudPlaque
          shape="hang"
          as="section"
          aria-label={title}
          data-testid="quest-window-minimised"
          style={{ ...shell, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}
        >
          <div {...handleProps} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Swords aria-hidden style={{ width: 18, height: 18, color: TONE.accent }} />
            <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
              {title}
            </span>
            <span style={{ fontFamily: FONT.display, fontSize: 12, color: TONE.secondary }}>
              {Math.min(currentBeat + 1, beats.length)}/{beats.length}
            </span>
            {waiting && <span aria-label={t('gameFrame.questWindow.waiting')} title={t('gameFrame.questWindow.waiting')} style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--skin-title-color)', boxShadow: '0 0 8px var(--skin-title-color)' }} />}
            <IconButton label={t('gameFrame.questWindow.restore')} onClick={() => setMinimised(false)}>
              <ScrollText style={{ width: 15, height: 15 }} />
            </IconButton>
          </div>
        </HudPlaque>
      </SkinScope>
    );
  }

  const bag = QUEST_STASH.items.filter((item) => run.flags.includes(item.flag));

  return (
    <SkinScope>
      <HudPlaque
        shape="panel"
        as="section"
        aria-label={title}
        data-testid="quest-window"
        style={{ ...shell, width: widthPx, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 14px' }}
      >
        {/* ── Title row = drag handle; every icon lives on its right ── */}
        <div {...handleProps} title={t('gameFrame.panel.dragHint')} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ flex: 1, margin: 0, minWidth: 0, fontFamily: FONT.display, fontSize: 16, lineHeight: 1.2, letterSpacing: '0.06em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h2>
          {/* What the quest carries — HUD pills, the same controls as the roster header. */}
          <div data-hud-controls style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button type="button" aria-label={t('gameFrame.questWindow.roster')} title={t('gameFrame.questWindow.roster')} aria-pressed={pop === 'roster'} onClick={() => setPop(pop === 'roster' ? null : 'roster')}>
              <Users aria-hidden />
              <PartyPips run={run} />
            </button>
            <button type="button" aria-label={t('gameFrame.questWindow.bag')} title={t('gameFrame.questWindow.bag')} aria-pressed={pop === 'bag'} onClick={() => setPop(pop === 'bag' ? null : 'bag')}>
              <Backpack aria-hidden />
              {bag.length}
            </button>
            <button type="button" aria-label={t('gameFrame.questWindow.chronicle')} title={t('gameFrame.questWindow.chronicle')} aria-pressed={pop === 'chronicle'} onClick={() => setPop(pop === 'chronicle' ? null : 'chronicle')}>
              <ScrollText aria-hidden />
            </button>
          </div>
          {/* Window controls: quiet glyphs, apart from the data (Director panel idiom). */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 6, borderLeft: '1px solid color-mix(in srgb, var(--skin-surface-border) 35%, transparent)' }}>
            <WindowGlyph label={t('gameFrame.questWindow.minimise')} onClick={() => setMinimised(true)}>
              <Minus />
            </WindowGlyph>
            <WindowGlyph label={t('gameFrame.panels.close')} onClick={onClose}>
              <X />
            </WindowGlyph>
          </div>
        </div>

        {pop && (
          <Popover onDismiss={() => setPop(null)}>
            {pop === 'roster' && <RosterList run={run} />}
            {pop === 'bag' && (bag.length ? bag.map((item) => <Line key={item.flag} tone="text">{t(item.labelKey)}</Line>) : <Line tone="muted">{t('gameFrame.questWindow.bagEmpty')}</Line>)}
            {pop === 'chronicle' && (
              <div className="quest-s1-scroll" style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {run.log.map((e, i) => (
                  <Line key={i} tone={LOG_TONE[e.kind] ?? 'secondary'}>{e.text}</Line>
                ))}
              </div>
            )}
          </Popover>
        )}

        {/* ── Flavour: the quest's one line, above the picture ── */}
        <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.4, color: TONE.secondary }}>{flavour}</p>

        {/* ── Theater ── */}
        <Theater src={artFor(run.nodeId)} caption={caption} aspect={theaterAspect} />

        {/* ── What just happened, then the scene ── */}
        <div className="quest-s1-scroll" style={{ maxHeight: 168, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resolved.map((c) => (
            <div key={c.id} data-testid="quest-window-verdict" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <HudChip tone={VERDICT_TONE[c.verdict]}>{t(`questS1Lab.verdict.${c.verdict}`)}</HudChip>
                <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.06em', color: TONE.secondary }}>{c.title}</span>
              </div>
              {c.flavor && <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.45, color: TONE.label }}>{c.flavor}</p>}
              {c.harmLines.map((line, i) => (
                <Line key={i} tone={/non si rialza/.test(line) ? 'death' : 'warn'}>{line}</Line>
              ))}
              {c.authoredText && <Line tone="secondary">{c.authoredText}</Line>}
            </div>
          ))}
          {showLastEvent && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.45, color: TONE.label }}>{run.lastEvent}</p>
          )}
          {node?.body && !run.ended && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 14, lineHeight: 1.5, color: TONE.text }}>{node.body}</p>
          )}
          {/* v27 pending frontier: the node is maturing — show the authored transit as the breath before the consequences land. */}
          {!run.ended && run.frontier.status === 'pending' && node?.transit && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.45, color: TONE.secondary }}>{node.transit}</p>
          )}
          {run.ended && (
            <p style={{ margin: 0, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: run.outcome === 'wipe' ? TONE.death : TONE.label }}>
              {t(`questS1Lab.outcome.${run.outcome}`)}
            </p>
          )}
        </div>

        {/* ── Choices: a numbered dialogue list (BG3 / Disco Elysium idiom), never a plate ── */}
        {/* ── The bag: arm before choosing, as in the lab; nothing is spent unasked ── */}
        {waiting && (
          <ConsumableBelt flags={run.flags} armed={armed} onToggleArmed={onToggleArmed} onUseHealing={onUseHealing} onDrinkPotion={onDrinkPotion} />
        )}
        {(waiting || run.ended) && (
          <div data-hud-choices style={{ display: 'flex', flexDirection: 'column', margin: '0 -4px' }}>
            {waiting &&
              options.map((o, i) => {
                const { pv, base } = previews[o.id] ?? { pv: null, base: null };
                return (
                  <button key={o.id} type="button" data-skin="choice" disabled={o.disabled} onClick={() => onChoose(o.id)}>
                    <span data-choice-index style={{ fontFamily: FONT.display, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{i + 1}.</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontFamily: FONT.display, fontSize: 15, color: 'var(--skin-text-primary)' }}>{o.label}</span>
                      {o.detail && <span style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.35, color: TONE.secondary }}>{o.detail}</span>}
                      {pv && (
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                          <HudChip tone="ok" title={base && pv.consumableLabel ? `${pv.consumableLabel} +${pv.consumableBonus}` : undefined}>
                            {base ? `${base.successPct}% → ${pv.successPct}%` : t('questS1Lab.successPct', { pct: pv.successPct })}
                          </HudChip>
                          {pv.woundPct > 0 && <HudChip tone="warn">{t('questS1Lab.woundPct', { pct: pv.woundPct })}</HudChip>}
                          {pv.deathPct > 0 && <HudChip tone="danger">{t('questS1Lab.deathPct', { pct: pv.deathPct })}</HudChip>}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            {run.ended && (
              <button type="button" data-skin="choice" onClick={onClose}>
                <span data-choice-index style={{ fontFamily: FONT.display, fontSize: 14 }}>→</span>
                <span style={{ fontFamily: FONT.display, fontSize: 15, color: 'var(--skin-text-primary)' }}>{t('gameFrame.questWindow.close')}</span>
              </button>
            )}
          </div>
        )}

        {/* ── Time: start of the expedition → its return, on the game clock ── */}
        <TimeBar progress={time.progress} label={time.label} phase={t('gameFrame.questWindow.phaseOf', { n: Math.min(currentBeat + 1, beats.length), total: beats.length })} />

        {/* ── Phases: every one played, the current one, then the next as a question mark ── */}
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {phases.map((phase, i) => (
            <PhaseTile
              key={`${phase.beat}-${i}`}
              phase={phase}
              name={beats[phase.beat] ?? ''}
              current={!run.ended && i === phases.length - 1}
              run={run}
              tooltipLines={tooltipLines}
            />
          ))}
          {!run.ended && currentBeat + 1 < beats.length && <NextTile label={t('gameFrame.questWindow.nextPhase')} />}
        </ol>
      </HudPlaque>
    </SkinScope>
  );
};

/* ------------------------------------------------------------------ */

const IconButton: React.FC<{ label: string; active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ label, active, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={active}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      height: 26,
      padding: '0 6px',
      borderRadius: 6,
      cursor: 'pointer',
      color: active ? 'var(--skin-title-color)' : TONE.label,
      background: active ? 'color-mix(in srgb, var(--skin-title-color) 14%, transparent)' : 'transparent',
      border: `1px solid ${active ? 'color-mix(in srgb, var(--skin-title-color) 45%, transparent)' : 'transparent'}`,
    }}
  >
    {children}
  </button>
);

/** Window controls (minimise, close): bare glyphs on the plaque, in the choice-row material so no bronze plate. */
const WindowGlyph: React.FC<{ label: string; onClick: () => void; children: React.ReactElement<{ style?: CSSProperties }> }> = ({ label, onClick, children }) => (
  <span data-hud-choices style={{ display: 'inline-flex' }}>
    <button
      type="button"
      data-skin="choice"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ display: 'inline-grid', gridTemplateColumns: '1fr', placeItems: 'center', width: 26, height: 26, padding: 0, borderLeft: 0, color: TONE.label }}
    >
      {React.cloneElement(children, { style: { width: 15, height: 15 } })}
    </button>
  </span>
);

/** One micro bar per party member inside the roster pill: the party's state without opening anything. */
const PartyPips: React.FC<{ run: QuestRunState }> = ({ run }) => (
  <span aria-hidden style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
    {run.party.map((m) => {
      const pct = m.dead ? 0 : Math.max(0, m.hp) / m.maxHp;
      const tone = m.dead ? TONE.death : pct < 0.35 ? TONE.danger : pct < 0.7 ? TONE.warn : TONE.ok;
      return (
        <span key={m.id} style={{ position: 'relative', width: 4, height: 14, borderRadius: 1, background: 'color-mix(in srgb, var(--skin-text-muted) 30%, transparent)', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', insetInline: 0, bottom: 0, height: m.dead ? '100%' : `${pct * 100}%`, background: m.dead ? 'color-mix(in srgb, var(--skin-status-death) 45%, transparent)' : tone, transition: 'height 400ms ease-out' }} />
        </span>
      );
    })}
  </span>
);

const Line: React.FC<{ tone: keyof typeof TONE; children: React.ReactNode }> = ({ tone, children }) => (
  <div style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.4, color: TONE[tone] }}>{children}</div>
);

const Popover: React.FC<{ onDismiss: () => void; children: React.ReactNode }> = ({ onDismiss, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!ref.current?.contains(target) && !target.closest('[aria-pressed]')) onDismiss();
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onDismiss();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDismiss]);
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 44,
        right: 12,
        left: 12,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)',
        background: SCRIM.chipBg,
        boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </div>
  );
};

const RosterList: React.FC<{ run: QuestRunState }> = ({ run }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      {run.party.map((m) => {
        const pct = m.maxHp > 0 ? Math.max(0, m.hp) / m.maxHp : 0;
        const tone = m.dead ? TONE.death : pct < 0.35 ? TONE.danger : m.wounded ? TONE.warn : TONE.ok;
        return (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 56px', alignItems: 'center', gap: 8, opacity: m.dead ? 0.6 : 1 }}>
            <span style={{ fontFamily: FONT.display, fontSize: 13, color: m.dead ? TONE.muted : TONE.text, display: 'flex', alignItems: 'center', gap: 5 }}>
              {m.dead && <Skull aria-label={t('gameFrame.questWindow.dead')} style={{ width: 13, height: 13, color: TONE.death }} />}
              {m.name}
            </span>
            <span aria-hidden style={{ height: 5, borderRadius: 3, background: 'color-mix(in srgb, var(--skin-text-muted) 25%, transparent)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${pct * 100}%`, background: tone, transition: 'width 400ms ease-out' }} />
            </span>
            <span style={{ fontFamily: FONT.display, fontSize: 12, textAlign: 'right', color: tone, fontVariantNumeric: 'tabular-nums' }}>
              {Math.max(0, m.hp)}/{m.maxHp}
            </span>
          </div>
        );
      })}
    </>
  );
};

/** Cinema-scope picture: cross-fades on a new scene and drifts slowly (Ken Burns). */
const Theater: React.FC<{ src?: string; caption: string; aspect: number }> = ({ src, caption, aspect }) => {
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Web Animations, not rAF: the element's own style is the end state, so a frozen
    // (hidden) tab still shows the picture.
    const el = img.current;
    if (!el?.animate) return undefined;
    const fade = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
    const drift = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }], { duration: 16000, easing: 'ease-in-out', fill: 'forwards' });
    return () => {
      fade.cancel();
      drift.cancel();
    };
  }, [src]);
  return (
    <div style={{ position: 'relative', aspectRatio: String(aspect), overflow: 'hidden', borderRadius: 6, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)', background: 'var(--skin-hud-lacquer-deep)' }}>
      {src && <img ref={img} key={src} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 95% at 50% 40%, transparent 55%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 70%, transparent))' }} />
      <div aria-hidden style={{ position: 'absolute', insetInline: 0, bottom: 0, height: '55%', background: SCRIM.bottom }} />
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 8, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: 'var(--skin-title-color)', textShadow: 'var(--skin-incision-label)' }}>
        {caption}
      </div>
    </div>
  );
};

const TimeBar: React.FC<{ progress: number; label: string; phase: string }> = ({ progress, label, phase }) => {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
        style={{ position: 'relative', height: 4, borderRadius: 2, overflow: 'hidden', background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 85%, transparent)', border: '1px solid color-mix(in srgb, var(--skin-surface-border) 45%, transparent)' }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transform: `scaleX(${pct / 100})`,
            transition: 'transform 600ms linear',
            background: 'linear-gradient(90deg, color-mix(in srgb, var(--skin-title-color) 55%, transparent), var(--skin-title-color))',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.06em', color: TONE.secondary }}>
        <span>{label}</span>
        <span>{phase}</span>
      </div>
    </div>
  );
};

const tileBox = (borderTone: string, current: boolean): CSSProperties => ({
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  border: `1px solid ${borderTone}`,
  background: current ? 'color-mix(in srgb, var(--skin-title-color) 16%, var(--skin-hud-lacquer-deep))' : 'var(--skin-hud-lacquer-deep)',
  boxShadow: current ? '0 0 10px color-mix(in srgb, var(--skin-title-color) 45%, transparent)' : undefined,
});

const PhaseTile: React.FC<{ phase: PhaseRecord; name: string; current: boolean; run: QuestRunState; tooltipLines: number }> = ({ phase, name, current, run, tooltipLines }) => {
  const { t } = useTranslation('idleVillage');
  const Icon = PHASE_ICONS[phase.beat] ?? CircleHelp;
  const outcome = phaseOutcome(phase);
  const played = phase.choices.length > 0 || phase.lines.length > 0;
  const tone = played ? TONE[OUTCOME_TONE[outcome]] : TONE.label;
  const lost = hpLostByMember(phase);
  const nameOf = (id: string) => run.party.find((m) => m.id === id)?.name ?? id;
  const dead = lost.filter((l) => l.died);
  const hp = lost.reduce((sum, l) => sum + l.amount, 0);
  const mark = !played
    ? t('gameFrame.questWindow.inProgressShort')
    : dead.length
      ? `† ${dead.map((d) => nameOf(d.memberId)).join(', ')}`
      : hp > 0
        ? t('gameFrame.questWindow.hpLost', { hp })
        : phase.lootGained.length
          ? t('gameFrame.questWindow.loot', { count: phase.lootGained.length })
          : t('gameFrame.questWindow.clean');
  const lines = phase.lines.slice(0, tooltipLines);
  const more = phase.lines.length - lines.length;

  return (
    <li style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <Tooltip.Root delayDuration={120}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={`${name}: ${mark}`}
            aria-current={current ? 'step' : undefined}
            style={{ ...tileBox(current ? 'var(--skin-title-color)' : `color-mix(in srgb, ${tone} 60%, transparent)`, current), position: 'relative', padding: 0, cursor: 'help', color: current ? 'var(--skin-title-color)' : tone }}
          >
            <Icon style={{ width: 18, height: 18 }} aria-hidden />
            {played && outcome === 'clean' && <Check aria-hidden style={{ position: 'absolute', right: 2, bottom: 2, width: 12, height: 12, color: TONE.ok }} />}
            {outcome === 'death' && <Skull aria-hidden style={{ position: 'absolute', right: 2, bottom: 2, width: 12, height: 12, color: TONE.death }} />}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" sideOffset={6} style={{ zIndex: 2000, maxWidth: 300, padding: '9px 11px', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)', background: 'var(--skin-hud-lacquer-deep)', boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)' }}>
            <div style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', marginBottom: 4 }}>{name}</div>
            {phase.choices.map((c, i) => (
              <Line key={`c${i}`} tone="muted">→ {c}</Line>
            ))}
            {phase.verdicts.length > 0 && <Line tone="accent">{phase.verdicts.map((v) => t(`questS1Lab.verdict.${v}`)).join(' · ')}</Line>}
            {lost.map((l) => (
              <Line key={l.memberId} tone={l.died ? 'death' : 'warn'}>
                {nameOf(l.memberId)} {l.died ? `— ${t('gameFrame.questWindow.dead')}` : t('gameFrame.questWindow.hpLost', { hp: l.amount })}
              </Line>
            ))}
            {phase.lootGained.map((item) => (
              <Line key={`l-${item}`} tone="label">+ {item}</Line>
            ))}
            {phase.itemsSpent.map((flag) => {
              const item = QUEST_STASH.items.find((i) => i.flag === flag);
              return <Line key={`s-${flag}`} tone="secondary">− {item ? t(item.labelKey) : flag}</Line>;
            })}
            {lines.length > 0 && <div style={{ height: 1, margin: '6px 0', background: 'color-mix(in srgb, var(--skin-surface-border) 40%, transparent)' }} />}
            {lines.map((e, i) => (
              <Line key={i} tone={LOG_TONE[e.kind] ?? 'secondary'}>{e.text}</Line>
            ))}
            {more > 0 && <Line tone="muted">{t('gameFrame.questWindow.moreLines', { count: more })}</Line>}
            {!played && <Line tone="muted">{t('gameFrame.questWindow.inProgress')}</Line>}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <span style={{ maxWidth: 56, fontFamily: FONT.display, fontSize: 12, lineHeight: 1.15, textAlign: 'center', color: tone, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mark}</span>
    </li>
  );
};

const NextTile: React.FC<{ label: string }> = ({ label }) => (
  <li style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }} aria-label={label} title={label}>
    <span style={{ ...tileBox('color-mix(in srgb, var(--skin-text-muted) 45%, transparent)', false), borderStyle: 'dashed', color: TONE.muted }}>
      <CircleHelp style={{ width: 18, height: 18 }} aria-hidden />
    </span>
    <span style={{ fontFamily: FONT.display, fontSize: 12, color: TONE.muted }}>?</span>
  </li>
);

export default QuestRunWindow;
