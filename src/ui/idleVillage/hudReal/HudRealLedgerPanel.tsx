/**
 * HudRealLedgerPanel — the /game event chronicle ("World Ledger") in the
 * baptized panel-frame5 dress (PLAN-125 Fase 4, Director ruling 2026-11-21).
 *
 * Open state: compact header (title + count + round controls), Roster-style
 * tab pills filtering by event type, and vignette-backed event cards inside
 * the engraved gold scroll band (variant B). Collapsed state: the strip —
 * three pinned mini rows under the same frame, chevron re-opens.
 *
 * Data stays live: `HudEvent` rows + `eventLedger` config (sort, pins,
 * urgency, per-type icon/tone/vignette). All text is i18n; every control sits
 * under the root `data-hud-controls` scope (T-03).
 */
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelFrameOrnaments } from '@/ui/idleVillage/skins/primitives/PanelFrameOrnaments';
import { HudScrollBand } from '@/ui/idleVillage/skins/primitives/HudScrollBand';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { HudGlyph } from '@/ui/idleVillage/components/gameFrame/hudIcons';
import { HUD_TONE_COLOR as TONE } from '@/ui/idleVillage/components/gameFrame/hudTones';
import { panelFrame5Frame } from '@/generated/slicekit/panelFrame5Frame';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameEventLedgerConfig,
  type GameFrameEventTypeConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame';

const FALLBACK_TYPE: Omit<GameFrameEventTypeConfig, 'id'> = {
  labelKey: 'gameFrame.events.types.other',
  icon: 'chronicle',
  tone: 'neutral',
  priority: 99,
};
const GOLD_DK = '#7a5a1c';

type Sort = 'due' | 'type';

export interface HudRealLedgerPanelProps {
  events: readonly HudEvent[];
  onSelect?: (event: HudEvent) => void;
  onClose?: () => void;
  /** Host cap (stage rect height); the list scrolls inside via the engraved band. */
  height?: number;
  config?: GameFrameEventLedgerConfig;
}

export const HudRealLedgerPanel: React.FC<HudRealLedgerPanelProps> = ({ events, onSelect, onClose, height, config = DEFAULT_GAME_FRAME_CONFIG.eventLedger }) => {
  const { t } = useTranslation('idleVillage');
  const [sort, setSort] = useState<Sort>(config.defaultSort);
  const [tab, setTab] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const typeById = useMemo(() => new Map(config.types.map((tp) => [tp.id, tp])), [config.types]);
  const typeOf = (typeId: string) => typeById.get(typeId) ?? { id: typeId, ...FALLBACK_TYPE };
  const priority = (e: HudEvent) => typeOf(e.typeId).priority;
  const daysLabel = (d: number) => (d <= 0 ? t('gameFrame.events.today', 'oggi') : t('gameFrame.events.daysLeft', { count: d }));

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const e of events) c.set(e.typeId, (c.get(e.typeId) ?? 0) + 1);
    return c;
  }, [events]);

  const sorted = useMemo(() => {
    const list = tab === 'all' ? [...events] : events.filter((e) => e.typeId === tab);
    return list.sort((a, b) =>
      sort === 'due' ? a.daysLeft - b.daysLeft || priority(a) - priority(b) : priority(a) - priority(b) || a.daysLeft - b.daysLeft,
    );
  }, [events, tab, sort, typeById]);

  /* INV:chronicle.INV-1 — collapsed strip and reduced list both honour
   *  pinTypesWhenCollapsed before filling with the most pressing rows. */
  const reduced = useMemo(() => {
    const shown = new Set<string>();
    for (const e of sorted) if (config.pinTypesWhenCollapsed.includes(e.typeId)) shown.add(e.id);
    for (const e of sorted) { if (shown.size >= config.maxVisibleRows) break; shown.add(e.id); }
    return sorted.filter((e) => shown.has(e.id));
  }, [sorted, config.maxVisibleRows, config.pinTypesWhenCollapsed]);

  const rows = expanded ? sorted : reduced;
  const hiddenCount = sorted.length - reduced.length;

  const card = (event: HudEvent) => {
    const type = typeOf(event.typeId);
    const urgent = event.daysLeft <= config.urgentWithinDays;
    return (
      <button
        key={event.id}
        type="button"
        data-chronicle-card=""
        data-tone={type.tone}
        onClick={() => onSelect?.(event)}
        style={{
          position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'left', cursor: onSelect ? 'pointer' : 'default',
          borderRadius: 12, border: `1px solid ${urgent ? 'rgba(226,196,120,0.85)' : 'rgba(216,189,120,0.5)'}`,
          background: 'linear-gradient(180deg, rgba(10,26,30,0.92), rgba(5,15,18,0.96))',
          boxShadow: urgent ? '0 0 10px rgba(224,122,95,0.25), 0 2px 7px rgba(0,0,0,0.6)' : '0 2px 7px rgba(0,0,0,0.6)',
          padding: '9px 26px 10px 12px', minHeight: 56, display: 'flex', alignItems: 'center', gap: 9,
        }}
      >
        {type.vignette && (
          <img
            src={type.vignette} alt="" draggable={false} aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85,
              WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.5))',
              maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.5))',
            }}
          />
        )}
        <HudGlyph iconId={type.icon} label={t(type.labelKey)} style={{ position: 'relative', color: TONE[type.tone], width: 28, height: 28, flexShrink: 0 }} />
        <span style={{ position: 'relative', flex: 1, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
          {event.title}
        </span>
        <span style={{ position: 'relative', flexShrink: 0, fontFamily: 'var(--skin-font-sans)', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: TONE[type.tone], textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          {daysLabel(event.daysLeft)}
        </span>
        {onSelect && <EngravedIcon id="cmd-chevron-right" size={15} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', color: 'rgba(226,196,120,0.9)' }} />}
      </button>
    );
  };

  const miniRow = (event: HudEvent) => {
    const type = typeOf(event.typeId);
    return (
      <button key={event.id} type="button" data-chronicle-mini="" onClick={() => onSelect?.(event)}
        style={{ all: 'unset', cursor: onSelect ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 9, padding: '3.5px 0', minWidth: 0 }}>
        <HudGlyph iconId={type.icon} label={t(type.labelKey)} style={{ color: TONE[type.tone], width: 22, height: 22, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {event.title}
        </span>
        <span style={{ flexShrink: 0, fontFamily: 'var(--skin-font-sans)', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: TONE[type.tone] }}>{daysLabel(event.daysLeft)}</span>
      </button>
    );
  };

  return (
    <section data-hud-chronicle="" data-hud-controls="" aria-label={t('gameFrame.events.title', 'Eventi')} style={{ position: 'relative', width: '100%', maxHeight: height }}>
      <div data-chronicle-plaque="" style={{
        position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: height, overflow: 'hidden',
        borderRadius: 18, border: '1px solid rgba(216,189,120,0.22)',
        background: 'linear-gradient(180deg, var(--skin-hud-lacquer-lift) 0%, var(--skin-hud-lacquer-base) 38%, var(--skin-hud-lacquer-deep) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(216,189,120,0.18), 0 10px 30px rgba(0,0,0,0.55)',
        padding: collapsed ? '10px 26px 9px 14px' : '12px 16px 16px',
      }}>
        {collapsed ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {reduced.slice(0, config.maxVisibleRows).map(miniRow)}
              {events.length === 0 && <span style={{ fontFamily: 'var(--skin-font-serif)', fontSize: 13, fontStyle: 'italic', color: 'var(--skin-body-color)' }}>{t('gameFrame.events.empty')}</span>}
            </div>
            <button type="button" data-ctl="round" aria-label={t('gameFrame.events.expand', 'Espandi')} aria-expanded="false" onClick={() => setCollapsed(false)}
              style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)' }}>
              <EngravedIcon id="cmd-chevron-right" />
            </button>
          </>
        ) : (
          <>
            <header style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 2px 10px' }}>
              <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 10px rgba(216,189,120,0.18)' }}>
                {t('gameFrame.events.title', 'Eventi')}
                <span style={{ marginLeft: 8, fontFamily: 'var(--skin-font-sans)', fontSize: 11.5, fontWeight: 600, letterSpacing: 0, textTransform: 'none', color: 'var(--skin-body-color)', verticalAlign: 1 }}>{events.length}</span>
              </span>
              <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                <button type="button" data-ctl="round" aria-label={t('gameFrame.events.sort.ariaLabel')} aria-pressed={sort === 'type'}
                  onClick={() => setSort((s) => (s === 'due' ? 'type' : 'due'))}>
                  <EngravedIcon id="cmd-sort" />
                </button>
                <button type="button" data-ctl="round" aria-label={t('gameFrame.events.collapse')} onClick={() => setCollapsed(true)}>
                  <EngravedIcon id="cmd-minimize" />
                </button>
                {onClose && (
                  <button type="button" data-ctl="round" data-panel-close="" aria-label={t('gameFrame.events.close')} onClick={onClose}>
                    <EngravedIcon id="cmd-close" />
                  </button>
                )}
              </div>
            </header>
            <div role="tablist" aria-label={t('gameFrame.events.title')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '0 2px 10px' }}>
              {[{ id: 'all', label: t('gameFrame.events.all'), count: events.length }, ...config.types.map((tp) => ({ id: tp.id, label: t(tp.labelKey), count: counts.get(tp.id) ?? 0 }))].map((tb) => (
                <button key={tb.id} type="button" role="tab" aria-selected={tab === tb.id} data-chronicle-tab="" onClick={() => setTab(tb.id)}
                  style={{
                    cursor: 'pointer', borderRadius: 999, padding: '4px 11px 5px', lineHeight: 1.2,
                    fontFamily: 'var(--skin-font-serif)', fontSize: 13.5,
                    color: tb.count === 0 ? '#6f8a84' : tab === tb.id ? '#f4e9c2' : 'var(--skin-label-primary)',
                    border: `1.5px solid ${tab === tb.id ? '#f0d682' : GOLD_DK}`,
                    background: tab === tb.id ? 'linear-gradient(180deg,#1f6a5c,#0e3d37)' : 'rgba(4,28,26,.85)',
                    boxShadow: tab === tb.id ? '0 0 8px rgba(240,214,130,0.3), 0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.5)',
                  }}>
                  {tb.label}
                  <span style={{ marginLeft: 5, fontFamily: 'var(--skin-font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--skin-body-color)' }}>{tb.count}</span>
                </button>
              ))}
            </div>
            <div ref={listRef} data-chronicle-list="" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '0 2px', scrollbarWidth: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {rows.map(card)}
                {sorted.length === 0 && (
                  <span style={{ fontFamily: 'var(--skin-font-serif)', fontSize: 13.5, fontStyle: 'italic', color: 'var(--skin-body-color)', padding: '4px 2px' }}>{t('gameFrame.events.empty')}</span>
                )}
                {!expanded && hiddenCount > 0 && (
                  <button type="button" data-chronicle-more="" onClick={() => setExpanded(true)}
                    style={{
                      position: 'relative', width: '100%', textAlign: 'left', cursor: 'pointer',
                      borderRadius: 12, border: '1px solid rgba(216,189,120,0.5)', padding: '9px 26px 10px 12px',
                      background: 'linear-gradient(180deg, rgba(10,26,30,0.92), rgba(5,15,18,0.96))',
                      boxShadow: '0 2px 7px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
                    }}>
                    <span style={{ flex: 1, fontFamily: 'var(--skin-font-display)', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--skin-text-secondary)' }}>
                      {t('gameFrame.events.otherEvents', { count: hiddenCount })}
                    </span>
                    <EngravedIcon id="cmd-chevron-right" size={15} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', color: 'rgba(226,196,120,0.9)' }} />
                  </button>
                )}
                {expanded && hiddenCount > 0 && (
                  <button type="button" onClick={() => setExpanded(false)} style={{ all: 'unset', cursor: 'pointer', alignSelf: 'center', fontFamily: 'var(--skin-font-serif)', fontSize: 12.5, fontStyle: 'italic', color: 'var(--skin-label-primary)', padding: '0 4px 2px' }}>
                    {t('gameFrame.events.showLess')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <PanelFrameOrnaments variant="cornici" manifest={panelFrame5Frame} />
      <img src="/assets/ui/hud-real/kit/ledger-clasp.png" alt="" draggable={false} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: -27, transform: 'translateX(-50%)', width: 63, height: 42, pointerEvents: 'none', zIndex: 31 }} />
      <img src="/assets/ui/hud-real/kit/ledger-pendant.png" alt="" draggable={false} aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: -30, transform: 'translateX(-50%)', width: 90, height: 44, pointerEvents: 'none', zIndex: 31 }} />
      {!collapsed && <HudScrollBand scrollRef={listRef} />}
    </section>
  );
};

export default HudRealLedgerPanel;
