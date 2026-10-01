/**
 * MissionPlannerPanel — the presentational face of the Planner (MP-05).
 *
 * Pure component: it renders the `PlannerView` produced by
 * `buildPlannerView` plus the rosters/provisions handed in by
 * `MissionPlannerLive`, and reports every interaction through callbacks. No
 * domain reads, no engine calls — "build the solution, see what it does" is
 * delivered by the MP-04 context above, this file only draws it.
 *
 * Layout (UI research 2026-09-30): two columns INPUT | OUTPUT, stacking via
 * flex-wrap under ~800px. Every outcome lives inside an `aria-live="polite"`
 * region so a change is announced, not just shown; deltas are `old → new`
 * badges with a direction arrow and a semantic colour.
 */

import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { FloatingPanel } from './FloatingPanel';
import { MatericBadge, MatericButton, MatericDivider, MatericSurface } from '@/ui/designSystem/primitives';
import { DEFAULT_MISSION_PLANNER_UI_CONFIG } from '@/ui/idleVillage/config/missionPlannerUiConfig';
import type { PlannerMetric, PlannerSlotView, PlannerView, PlannerWhyLine } from './missionPlanner/plannerViewModel';
import type { QuestEquipSlot, QuestItem } from '@/balancing/config/idleVillage/quests/questItems.schema';

/** A resident the planner can draft (roster card data, already derived). */
export interface PlannerRosterEntry {
  id: string;
  name: string;
  initials: string;
  portraitUrl?: string;
  isHero?: boolean;
}

/** A consumable row: catalog item + stock + how many are packed. */
export interface PlannerProvisionEntry {
  item: QuestItem;
  stock: number;
  selected: number;
}

export interface MissionPlannerPanelProps {
  view: PlannerView;
  /** Available residents (not yet drafted). */
  roster: PlannerRosterEntry[];
  /** Consumables with stock and selected quantity. */
  provisions: PlannerProvisionEntry[];
  /** Slot currently awaiting a resident pick (highlighted). */
  targetSlotId?: string;
  canEmbark: boolean;
  canUndo: boolean;
  canReset: boolean;
  /** Translated launch blockers (empty when canEmbark). */
  blockers: string[];
  onTargetSlot: (slotId?: string) => void;
  onPickResident: (residentId: string) => void;
  onRemove: (slotId: string) => void;
  onCycleItem: (residentId: string, slot: QuestEquipSlot) => void;
  onProvision: (itemId: string, qty: number) => void;
  onUndo: () => void;
  onReset: () => void;
  onLaunch: () => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const UI = DEFAULT_MISSION_PLANNER_UI_CONFIG;

/** Semantic colours via skin tokens (fallbacks match the Wanderlust palette). */
const C = {
  good: 'var(--skin-statbar-hp-end, #6ee7b7)',
  bad: 'var(--skin-danger, #e8551f)',
  warn: 'var(--skin-statbar-stamina-end, #f59e0b)',
  label: 'var(--skin-label-primary, #c9a84e)',
  text: 'var(--skin-text-primary, #f4ead5)',
  dim: 'var(--skin-label-secondary, #9a8b6f)',
  surface: 'var(--skin-surface-bg, rgba(20,16,10,0.72))',
  border: 'var(--skin-hairline, rgba(201,168,78,0.35))',
};

const fmtPct = (v: number): string => `${v.toFixed(1)}%`;

/** `old → new` badge with direction arrow; null when there is no baseline. */
function DeltaBadge({ metric, testid }: { metric: PlannerMetric; testid: string }): JSX.Element | null {
  if (metric.previous === undefined) return null;
  const diff = metric.value - metric.previous;
  if (Math.abs(diff) < 0.05) return null;
  const improved = metric.higherIsBetter ? diff > 0 : diff < 0;
  const arrow = diff > 0 ? '▲' : '▼';
  return (
    <span
      data-testid={testid}
      style={{
        fontSize: 10,
        fontFamily: 'var(--wl-font-sans, system-ui, sans-serif)',
        color: improved ? C.good : C.bad,
        whiteSpace: 'nowrap',
      }}
    >
      {arrow} {metric.previous.toFixed(1)} → {metric.value.toFixed(1)}
    </span>
  );
}

/** One labelled outcome row with optional delta. */
function MetricRow({ label, value, metric, testid }: { label: string; value: string; metric?: PlannerMetric; testid: string }): JSX.Element {
  return (
    <div data-testid={testid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {metric && <DeltaBadge metric={metric} testid={`${testid}-delta`} />}
        <strong style={{ fontSize: 15, color: C.text }}>{value}</strong>
      </span>
    </div>
  );
}

/** A round member medallion (portrait or initials). */
function Medallion({ name, initials, url, size, invalid }: { name: string; initials: string; url?: string; size: number; invalid?: boolean }): JSX.Element {
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        border: `1.5px solid ${invalid ? C.bad : C.border}`,
        background: C.surface,
        color: invalid ? C.bad : C.label,
        fontSize: size * 0.34,
        fontFamily: 'var(--wl-font-display, serif)',
        opacity: invalid ? 0.55 : 1,
      }}
    >
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </span>
  );
}

/** Personal risk chip (XCOM-style: the member's own risk on their card). */
function RiskBadge({ death, injury }: { death: PlannerMetric; injury: PlannerMetric }): JSX.Element {
  const tone = death.value >= UI.bands.high ? C.bad : death.value >= UI.bands.low ? C.warn : C.good;
  return (
    <MatericBadge data-testid="mp-risk-badge" style={{ borderColor: tone, color: tone }}>
      {fmtPct(injury.value)} ⚕ · {fmtPct(death.value)} ☠
    </MatericBadge>
  );
}

// ---------------------------------------------------------------------------
// INPUT side
// ---------------------------------------------------------------------------

function PartySlotRow({
  slot,
  targeted,
  onTarget,
  onRemove,
}: {
  slot: PlannerSlotView;
  targeted: boolean;
  onTarget: () => void;
  onRemove: () => void;
}): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const m = slot.member;
  return (
    <div
      data-testid={`mp-slot-${slot.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${targeted ? C.warn : C.border}`,
        background: targeted ? 'rgba(245,158,11,0.08)' : 'transparent',
      }}
    >
      {m ? (
        <Medallion name={m.name} initials={m.initials} url={m.portraitUrl} size={UI.memberSize * 0.6} invalid={m.invalid} />
      ) : (
        <span
          style={{
            width: UI.memberSize * 0.6,
            height: UI.memberSize * 0.6,
            borderRadius: '50%',
            border: `1.5px dashed ${C.border}`,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.text, display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <strong>{slot.label}</strong>
          {slot.required && <span style={{ fontSize: 9, color: C.warn, textTransform: 'uppercase' }}>{t('missionPlanner.required')}</span>}
        </div>
        <div style={{ fontSize: 11, color: m?.invalid ? C.bad : C.dim }}>
          {m ? m.name + (m.invalid ? ` — ${t('missionPlanner.unavailable')}` : '') : slot.requirementLabel ?? t('missionPlanner.pickFromRoster')}
        </div>
      </div>
      {m && <RiskBadge death={m.death} injury={m.injury} />}
      {m ? (
        <MatericButton data-testid={`mp-remove-${slot.id}`} onClick={onRemove} aria-label={t('missionPlanner.remove', { name: m.name })}>
          ✕
        </MatericButton>
      ) : (
        <MatericButton data-testid={`mp-assign-${slot.id}`} variant="cta" onClick={onTarget}>
          {t('missionPlanner.addMember')}
        </MatericButton>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OUTPUT side
// ---------------------------------------------------------------------------

/** WHY line: "source · subject  ±delta unit" — a cause chain, not raw numbers. */
function WhyLine({ line, translate }: { line: PlannerWhyLine; translate: (k: string) => string }): JSX.Element {
  const sign = line.delta > 0 ? '+' : '−';
  const val =
    line.unit === 'mult'
      ? `×${Math.abs(line.delta).toFixed(2)}`
      : line.unit === 'pp'
        ? `${Math.abs(line.delta).toFixed(1)}pp`
        : `${Math.abs(line.delta).toFixed(0)}`;
  const good = line.metric === 'success' || line.metric === 'reward' ? line.delta > 0 : line.delta < 0;
  const sourceKey = `missionPlanner.stat.${line.sourceLabel}`;
  const sourceText = line.source === 'stat' ? translate(sourceKey) || line.sourceLabel : line.sourceLabel;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, padding: '2px 0' }}>
      <span style={{ color: C.dim }}>
        {sourceText}
        {line.subjectLabel ? ` · ${line.subjectLabel}` : ''}
      </span>
      <span style={{ color: good ? C.good : C.bad, fontVariantNumeric: 'tabular-nums' }}>
        {sign}
        {val}
      </span>
    </div>
  );
}

/** Stacked risk bar — DD provisioning style: injury | death | (rest). */
function RiskStack({ injury, death }: { injury: number; death: number }): JSX.Element {
  const rest = Math.max(0, 100 - injury - death);
  return (
    <div
      data-testid="mp-risk-bar"
      role="img"
      style={{ display: 'flex', height: 10, borderRadius: 3, overflow: 'hidden', border: `1px solid ${C.border}` }}
    >
      <div style={{ width: `${injury}%`, background: 'var(--skin-statbar-stamina-start, #d4af37)' }} />
      <div style={{ width: `${death}%`, background: 'var(--skin-danger, #e8551f)' }} />
      <div style={{ width: `${rest}%`, background: C.surface }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * The Planner panel: INPUT (party + loadout + provisions) and OUTPUT
 * (outcome, route, by-member, WHY) side by side inside a FloatingPanel.
 */
export function MissionPlannerPanel({
  view,
  roster,
  provisions,
  targetSlotId,
  canEmbark,
  canUndo,
  canReset,
  blockers,
  onTargetSlot,
  onPickResident,
  onRemove,
  onCycleItem,
  onProvision,
  onUndo,
  onReset,
  onLaunch,
  onClose,
}: MissionPlannerPanelProps): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const [whyOpen, setWhyOpen] = useState(false);
  const [status, setStatus] = useState('');

  const members = view.slots.filter((s) => s.member).map((s) => s.member!);
  const column: CSSProperties = { flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 };

  const band =
    view.success.value >= UI.bands.high
      ? t('missionPlanner.band.odds.high')
      : view.success.value >= UI.bands.low
        ? t('missionPlanner.band.odds.mid')
        : t('missionPlanner.band.odds.low');

  return (
    <FloatingPanel panelId="mission-planner" title={view.quest.name} icon={view.quest.icon} width={760} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.label }}>{t('missionPlanner.eyebrow')}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {/* ── INPUT ─────────────────────────────────────────────── */}
          <section data-testid="mp-input" aria-label={t('missionPlanner.input')} style={column}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim }}>{t('missionPlanner.input')}</div>

            <MatericSurface shape="card" material="jade" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: C.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('missionPlanner.party')}</div>
              {view.slots.map((slot) => (
                <PartySlotRow
                  key={slot.id}
                  slot={slot}
                  targeted={targetSlotId === slot.id}
                  onTarget={() => onTargetSlot(slot.id)}
                  onRemove={() => onRemove(slot.id)}
                />
              ))}
            </MatericSurface>

            <MatericSurface shape="card" material="jade" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: C.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('missionPlanner.available')}</div>
              {roster.length === 0 && <div style={{ fontSize: 11, color: C.dim }}>—</div>}
              {roster.map((r) => (
                <button
                  key={r.id}
                  data-testid={`mp-roster-${r.id}`}
                  onClick={() => onPickResident(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.text,
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <Medallion name={r.name} initials={r.initials} url={r.portraitUrl} size={22} />
                  {r.name}
                </button>
              ))}
            </MatericSurface>

            <MatericSurface shape="card" material="jade" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: C.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('missionPlanner.loadout')}</div>
              {members.length === 0 && <div style={{ fontSize: 11, color: C.dim }}>{t('missionPlanner.noLoadout')}</div>}
              {members.map((m) => (
                <div key={m.residentId} data-testid={`mp-loadout-${m.residentId}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 11, color: C.text }}>{m.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.sockets.map((s) => (
                      <MatericButton
                        key={s.slot}
                        data-testid={`mp-socket-${m.residentId}-${s.slot}`}
                        onClick={() => onCycleItem(m.residentId, s.slot)}
                        title={t(`missionPlanner.equipSlot.${s.slot}`)}
                      >
                        {t(`missionPlanner.equipSlot.${s.slot}`)}: {s.item ? t(s.item.labelKey) : '—'}
                      </MatericButton>
                    ))}
                  </div>
                </div>
              ))}
            </MatericSurface>

            {provisions.length > 0 && (
              <MatericSurface shape="card" material="jade" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: C.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('missionPlanner.provisions')}</div>
                {provisions.map(({ item, stock, selected }) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ flex: 1, color: C.text }}>
                      {item.icon} {t(item.labelKey)}
                    </span>
                    <MatericButton data-testid={`mp-prov-${item.id}-dec`} onClick={() => onProvision(item.id, selected - 1)} disabled={selected <= 0}>
                      −
                    </MatericButton>
                    <span style={{ minWidth: 28, textAlign: 'center', color: C.text }}>
                      {selected}/{stock}
                    </span>
                    <MatericButton
                      data-testid={`mp-prov-${item.id}-inc`}
                      onClick={() => onProvision(item.id, selected + 1)}
                      disabled={selected >= stock}
                    >
                      +
                    </MatericButton>
                  </div>
                ))}
              </MatericSurface>
            )}
          </section>

          {/* ── OUTPUT ────────────────────────────────────────────── */}
          <section data-testid="mp-output" aria-label={t('missionPlanner.output')} aria-live="polite" style={column}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim }}>{t('missionPlanner.output')}</div>

            <MatericSurface shape="card" material="jade" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span data-testid="mp-success" style={{ fontSize: 30, fontFamily: 'var(--wl-font-display, serif)', color: C.text }}>
                  {fmtPct(view.success.value)}
                </span>
                <span style={{ fontSize: 11, color: C.label }}>{band}</span>
                <DeltaBadge metric={view.success} testid="mp-delta-success" />
              </div>
              <div style={{ fontSize: 10, color: C.dim }}>{t('missionPlanner.rule')}</div>
              <RiskStack injury={view.anyInjury.value} death={view.anyDeath.value} />
              <MetricRow label={t('missionPlanner.anyInjury')} value={fmtPct(view.anyInjury.value)} metric={view.anyInjury} testid="mp-metric-injury" />
              <MetricRow label={t('missionPlanner.anyDeath')} value={fmtPct(view.anyDeath.value)} metric={view.anyDeath} testid="mp-metric-death" />
              <MetricRow label={t('missionPlanner.duration')} value={t('missionPlanner.hours', { count: Math.round(view.hours) })} testid="mp-metric-duration" />
              <MetricRow label={t('missionPlanner.reward')} value={`×${view.rewardMult.toFixed(2)}`} testid="mp-metric-reward" />
            </MatericSurface>

            <MatericSurface shape="card" material="jade" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: C.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('missionPlanner.route')}</div>
              {view.phases.map((p, i) => (
                <div key={p.id} data-testid={`mp-phase-${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.dim, minWidth: 14 }}>{i + 1}.</span>
                  <span style={{ flex: 1, color: C.text }}>
                    {p.icon} {p.title}
                  </span>
                  <DeltaBadge metric={p.passChance} testid={`mp-delta-phase-${p.id}`} />
                  <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtPct(p.passChance.value)}</span>
                </div>
              ))}
            </MatericSurface>

            <MatericSurface shape="card" material="jade" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: C.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('missionPlanner.byMember')}</div>
              <div data-testid="mp-by-member" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {members.length === 0 && <div style={{ fontSize: 11, color: C.dim }}>—</div>}
                {members.map((m) => (
                  <div key={m.residentId} data-testid={`mp-member-${m.residentId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ flex: 1, color: m.invalid ? C.bad : C.text }}>{m.name}</span>
                    <DeltaBadge metric={m.injury} testid={`mp-delta-member-${m.residentId}`} />
                    <span style={{ color: C.dim, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtPct(m.injury.value)} ⚕ · {fmtPct(m.death.value)} ☠
                    </span>
                  </div>
                ))}
              </div>
            </MatericSurface>

            <MatericSurface shape="card" material="jade" style={{ padding: 10 }}>
              <button
                data-testid="mp-why-toggle"
                onClick={() => setWhyOpen((v) => !v)}
                aria-expanded={whyOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  color: C.label,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {t('missionPlanner.why')}
                <span>{whyOpen ? '▾' : '▸'}</span>
              </button>
              {whyOpen && (
                <div data-testid="mp-why" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {view.why.length === 0 && <div style={{ fontSize: 11, color: C.dim }}>{t('missionPlanner.whyEmpty')}</div>}
                  {view.why.map((g) => (
                    <div key={g.metric}>
                      <div style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                        {t(`missionPlanner.metric.${g.metric}`)}
                      </div>
                      {g.lines.map((l) => (
                        <WhyLine key={l.id} line={l} translate={t} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </MatericSurface>

            {blockers.length > 0 && (
              <div data-testid="mp-blockers" style={{ fontSize: 11, color: C.warn, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {blockers.map((b) => (
                  <span key={b}>⚠ {b}</span>
                ))}
              </div>
            )}
            <span role="status" data-testid="mp-status" style={{ fontSize: 10, color: C.dim }}>
              {status}
            </span>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <MatericButton data-testid="mp-undo" disabled={!canUndo} onClick={() => { onUndo(); setStatus(t('missionPlanner.undo')); }}>
                {t('missionPlanner.undo')}
              </MatericButton>
              <MatericButton data-testid="mp-reset" disabled={!canReset} onClick={() => { onReset(); setStatus(t('missionPlanner.reset')); }}>
                {t('missionPlanner.reset')}
              </MatericButton>
              <MatericButton data-testid="mp-launch" variant="cta" ornaments disabled={!canEmbark} onClick={onLaunch} style={{ marginLeft: 'auto' }}>
                {t('missionPlanner.launch')}
              </MatericButton>
            </div>
          </section>
        </div>

        <MatericDivider />
      </div>
    </FloatingPanel>
  );
}

export default MissionPlannerPanel;
