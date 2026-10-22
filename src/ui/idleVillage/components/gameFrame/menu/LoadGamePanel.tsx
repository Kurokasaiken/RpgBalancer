/**
 * LoadGamePanel — «Carica partita» (PLAN-076 T-3, LOAD-1 A).
 *
 * One row per slot (autosave + three manual): settlement, day, when it was
 * saved, the heroes and expeditions it holds. A slot that is empty or damaged
 * is shown but cannot be loaded. Loading over a game with unsaved progress
 * asks first; deleting a save always asks. The panel restores the slot
 * itself; `onLoaded` tells the host to reload the page so no stale state
 * stays in memory.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { GameMenuDialog } from './GameMenuDialog';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';
import { defaultSaveIO, deleteSlot, listSaves, type SaveIO, type SaveSlotId, type SaveSlotInfo } from '../../../state/gameSave';
import { loadGameFromSlot } from '../../../state/gameSaveService';
import mapUrl from '@/assets/ui/idleVillage/idle-village-map.jpg';

export interface LoadGamePanelProps {
  /** A game is running behind the panel (false on the title screen: nothing to replace). */
  inGame: boolean;
  /** The running game has moved on since its last save. */
  unsaved: boolean;
  currentDay?: number;
  onClose: () => void;
  /** The slot was restored; the host reloads. */
  onLoaded: (slot: SaveSlotId) => void;
  io?: SaveIO;
}

type Confirm = null | { kind: 'replace' } | { kind: 'delete' };

const ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 12,
  alignItems: 'center',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--skin-surface-border)',
  background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
  cursor: 'pointer',
  textAlign: 'left',
};
const ROW_SELECTED: CSSProperties = { borderColor: 'var(--skin-hud-brass-hi)', background: 'var(--skin-hud-lacquer-base)' };
const THUMB_STYLE: CSSProperties = { width: 112, height: 63, borderRadius: 5, border: '1px solid var(--skin-surface-border)', objectFit: 'cover', display: 'block' };
const TEXT: CSSProperties = { color: 'var(--skin-text-primary)', font: '500 15px var(--skin-font-serif)' };
const MUTED: CSSProperties = { color: 'var(--skin-text-secondary)', font: '400 13.5px var(--skin-font-serif)' };
const TAG: CSSProperties = { font: '600 11px var(--skin-font-display)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-label-primary)', border: '1px solid var(--skin-surface-border)', borderRadius: 9, padding: '1px 7px' };

export function LoadGamePanel({ inGame, unsaved, currentDay, onClose, onLoaded, io = defaultSaveIO }: LoadGamePanelProps) {
  const { t, i18n } = useTranslation('idleVillage');
  const [rows, setRows] = useState<SaveSlotInfo[] | null>(null);
  const [selected, setSelected] = useState<SaveSlotId | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const next = await listSaves(io);
    setRows(next);
    setSelected((current) => {
      if (current && next.some((r) => r.slot === current)) return current;
      const newest = [...next].filter((r) => r.state === 'ok').sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0];
      return newest?.slot ?? null;
    });
  }, [io]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const formatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }), [i18n.language]);
  const place = t('gameFrame.place');
  const current = rows?.find((r) => r.slot === selected) ?? null;
  const loadable = current?.state === 'ok';

  const slotName = (slot: SaveSlotId) => (slot === 'auto' ? t('gameFrame.menu.load.slotAuto') : t('gameFrame.menu.load.slotManual', { n: slot.replace('slot-', '') }));

  const doLoad = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const result = await loadGameFromSlot(selected, io);
    setBusy(false);
    if (result.ok) onLoaded(selected);
    else {
      setConfirm(null);
      setFailed(true);
    }
  };
  const onLoadClick = () => {
    setFailed(false);
    if (inGame && unsaved) setConfirm({ kind: 'replace' });
    else void doLoad();
  };
  const doDelete = async () => {
    if (!selected) return;
    await deleteSlot(selected, io);
    setConfirm(null);
    await refresh();
  };

  const onRowKey = (event: KeyboardEvent, index: number) => {
    if (!rows) return;
    const move = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
    if (move) {
      event.preventDefault();
      const next = rows[(index + move + rows.length) % rows.length];
      setSelected(next.slot);
      setConfirm(null);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      setSelected(rows[index].slot);
    }
  };

  return (
    <GameMenuDialog title={t('gameFrame.menu.load.title')} onClose={onClose} data-testid="load-game-panel">
      <div role="radiogroup" aria-label={t('gameFrame.menu.load.title')} style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {(rows ?? []).map((row, index) => {
          const isSel = row.slot === selected;
          return (
            <div
              key={row.slot}
              role="radio"
              aria-checked={isSel}
              tabIndex={isSel || (!selected && index === 0) ? 0 : -1}
              data-slot={row.slot}
              data-state={row.state}
              onClick={() => {
                setSelected(row.slot);
                setConfirm(null);
              }}
              onKeyDown={(event) => onRowKey(event, index)}
              style={{ ...ROW_STYLE, ...(isSel ? ROW_SELECTED : null) }}
            >
              {row.state === 'empty' ? (
                <div aria-hidden="true" style={{ ...THUMB_STYLE, border: '1px dashed var(--skin-surface-border)', background: 'repeating-linear-gradient(135deg, var(--skin-hud-lacquer-deep) 0 8px, var(--skin-hud-lacquer-base) 8px 16px)' }} />
              ) : (
                <img src={row.thumbnail ?? mapUrl} alt="" style={{ ...THUMB_STYLE, opacity: row.state === 'ok' ? 1 : 0.35 }} />
              )}
              <div>
                {row.state === 'empty' ? (
                  <span style={MUTED}>{t('gameFrame.menu.load.slotEmpty', { name: slotName(row.slot) })}</span>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={TEXT}>{row.meta ? t('gameFrame.menu.load.slotDay', { place, day: row.meta.day }) : slotName(row.slot)}</span>
                      {row.slot === 'auto' && <span style={TAG}>{t('gameFrame.menu.load.slotAuto')}</span>}
                    </div>
                    {row.state === 'ok' && row.meta && row.savedAt !== undefined ? (
                      <>
                        <div style={MUTED}>{`${formatter.format(row.savedAt)}${row.slot === 'auto' ? '' : ` · ${slotName(row.slot)}`}`}</div>
                        <div style={MUTED}>
                          {t('gameFrame.menu.load.summary', { heroes: row.meta.heroes.length, expeditions: row.meta.activeExpeditions })}
                          {row.meta.heroes.length > 0 ? ` · ${row.meta.heroes.join(', ')}` : ''}
                        </div>
                      </>
                    ) : (
                      <div style={{ ...MUTED, color: 'var(--skin-label-primary)' }}>
                        {row.state === 'newer-version' ? t('gameFrame.menu.load.slotNewer') : t('gameFrame.menu.load.slotCorrupt')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div aria-hidden="true" style={{ height: 1, background: 'var(--skin-surface-border)', flexShrink: 0 }} />
      {failed && <div role="alert" style={{ ...MUTED, color: 'var(--skin-label-primary)' }}>{t('gameFrame.menu.load.failed')}</div>}
      {confirm ? (
        <div data-hud-controls="" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ ...TEXT, flex: 1, minWidth: 200 }}>
            {confirm.kind === 'replace'
              ? t('gameFrame.menu.load.replaceAsk', { day: currentDay ?? 0 })
              : t('gameFrame.menu.load.deleteAsk')}
          </span>
          <button type="button" onClick={() => setConfirm(null)}>
            <span>{t('gameFrame.menu.cancel')}</span>
          </button>
          {confirm.kind === 'replace' ? (
            <SkinButton variant="cta" disabled={busy} onClick={() => void doLoad()}>
              {t('gameFrame.menu.load.replaceConfirm')}
            </SkinButton>
          ) : (
            <button type="button" disabled={busy} onClick={() => void doDelete()}>
              <span>{t('gameFrame.menu.load.deleteConfirm')}</span>
            </button>
          )}
        </div>
      ) : (
        <div data-hud-controls="" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...MUTED, flex: 1 }}>{inGame && unsaved ? t('gameFrame.menu.load.replaceNote', { day: currentDay ?? 0 }) : ''}</span>
          <button type="button" disabled={!current || current.state === 'empty'} onClick={() => setConfirm({ kind: 'delete' })}>
            <span>{t('gameFrame.menu.load.deleteAction')}</span>
          </button>
          <SkinButton variant="cta" disabled={!loadable || busy} onClick={onLoadClick}>
            {t('gameFrame.menu.load.loadAction')}
          </SkinButton>
        </div>
      )}
    </GameMenuDialog>
  );
}

export default LoadGamePanel;
