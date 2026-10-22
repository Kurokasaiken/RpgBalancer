/**
 * GameEntry — what stands between the app and the game page (PLAN-076 T-6).
 *
 * Shows the title screen when it should (`shouldShowTitle`) and mounts the game
 * only after the player picked a way in: Continua (newest save), Nuova partita
 * (progress cleared, after a question when there is progress to lose), or a
 * slot from Carica partita. Nothing is mounted behind the title, so the game
 * clock never runs under it. Also installs the audio bus and loads the
 * settings, once, before any sound can play.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TitleScreen } from './TitleScreen';
import { LoadGamePanel } from './LoadGamePanel';
import { SettingsPanel } from './SettingsPanel';
import { GameMenuConfirm } from './GameMenuConfirm';
import { consumeShowTitle, pickContinueSlot, shouldShowTitle } from './menuFlow';
import { isTauriRuntime } from '@/shared/persistence/runtime';
import { loadData } from '@/shared/persistence/PersistenceService';
import { listSaves, deleteSlot, type SaveSlotId } from '../../../state/gameSave';
import { loadGameFromSlot, resetLastSaved } from '../../../state/gameSaveService';
import { hydrateGameSettings } from '../../../state/gameSettings';
import { installAudioBus } from '../../../state/audioBus';
import { GAMEPLAY_STORE_KEY } from '../../../store/gameplayStore';
import { clearGameProgress } from '../questInitialState';

if (typeof window !== 'undefined') installAudioBus();

interface EntryInfo {
  /** Slot «Continua» resumes, or null to resume the live world (which may be empty). */
  slot: SaveSlotId | null;
  /** Day shown on «Continua»; null hides the button. */
  day: number | null;
  /** There is progress a new game would replace. */
  hasProgress: boolean;
}

const liveDay = async (): Promise<number | null> => {
  const live = await loadData<{ metadata?: { summary?: { currentDay?: number } } } | null>(GAMEPLAY_STORE_KEY, null);
  const day = live?.metadata?.summary?.currentDay;
  return typeof day === 'number' && day > 0 ? day : null;
};

async function readEntryInfo(): Promise<EntryInfo> {
  const rows = await listSaves();
  const slot = pickContinueSlot(rows);
  if (slot) {
    const day = rows.find((r) => r.slot === slot)?.meta?.day ?? 0;
    return { slot, day, hasProgress: true };
  }
  const day = await liveDay();
  return { slot: null, day, hasProgress: day !== null };
}

export function GameEntry({ children }: { children: ReactNode }) {
  const { t } = useTranslation('idleVillage');
  const [phase, setPhase] = useState<'title' | 'game'>(() => (shouldShowTitle({ search: window.location.search, tauri: isTauriRuntime() }) ? 'title' : 'game'));
  const [panel, setPanel] = useState<'load' | 'settings' | 'newgame' | null>(null);
  const [info, setInfo] = useState<EntryInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    consumeShowTitle();
    void hydrateGameSettings();
  }, []);
  useEffect(() => {
    if (phase !== 'title') return;
    let cancelled = false;
    void readEntryInfo().then((next) => !cancelled && setInfo(next));
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const enterGame = useCallback(() => {
    setPanel(null);
    setPhase('game');
  }, []);

  const onContinue = async () => {
    if (!info || busy) return;
    setBusy(true);
    if (info.slot) {
      const result = await loadGameFromSlot(info.slot);
      if (!result.ok) {
        setBusy(false);
        setPanel('load'); // the newest save could not be restored: let the player choose
        return;
      }
    }
    setBusy(false);
    enterGame();
  };

  const onNewGameConfirmed = async () => {
    setBusy(true);
    await clearGameProgress();
    await deleteSlot('auto'); // the checkpoint of the world being replaced; manual saves stay
    resetLastSaved();
    setBusy(false);
    enterGame();
  };

  const onExit = isTauriRuntime()
    ? () => void import('@tauri-apps/api/window').then((m) => m.getCurrentWindow().close())
    : undefined;

  if (phase === 'game') return <>{children}</>;

  return (
    <>
      <TitleScreen
        continueDay={info?.day ?? null}
        busy={busy || info === null}
        onContinue={() => void onContinue()}
        onNewGame={() => (info?.hasProgress ? setPanel('newgame') : void onNewGameConfirmed())}
        onLoadGame={() => setPanel('load')}
        onSettings={() => setPanel('settings')}
        onExit={onExit}
      />
      {panel === 'load' && <LoadGamePanel inGame={false} unsaved={false} onClose={() => setPanel(null)} onLoaded={enterGame} />}
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} />}
      {panel === 'newgame' && (
        <GameMenuConfirm
          title={t('gameFrame.menu.newGame.title')}
          cancelLabel={t('gameFrame.menu.cancel')}
          onCancel={() => setPanel(null)}
          actions={[{ label: t('gameFrame.menu.newGame.confirm'), onClick: () => void onNewGameConfirmed(), disabled: busy }]}
          data-testid="new-game-confirm"
        >
          <span>{t('gameFrame.menu.newGame.body', { day: info?.day ?? 0 })}</span>
        </GameMenuConfirm>
      )}
    </>
  );
}

export default GameEntry;
