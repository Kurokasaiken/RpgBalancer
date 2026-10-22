/**
 * useGameMenuFlow — the in-game side of the menu (PLAN-076 T-3/T-4/T-5): owns
 * which screen is open and what «Esci al titolo» does, and hands the menu its
 * callbacks plus the screens to render.
 */
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadGamePanel } from './LoadGamePanel';
import { SettingsPanel } from './SettingsPanel';
import { GameMenuConfirm } from './GameMenuConfirm';
import { decideQuit, quitToTitle } from './menuFlow';
import type { HudScaleControl } from '../hudScale';
import { getLastSaved, hasUnsavedProgress, saveNowToManualSlot } from '../../../state/gameSaveService';

export interface UseGameMenuFlowOptions {
  currentTick: number;
  currentDay: number;
  /** Writes the in-memory gameplay state to its key before a save. */
  flush: () => Promise<boolean> | boolean | void;
  scale?: HudScaleControl;
}

export interface GameMenuFlow {
  menuProps: { onLoadGame: () => void; onOpenSettings: () => void; onQuit: () => void };
  screens: ReactNode;
}

export function useGameMenuFlow({ currentTick, currentDay, flush, scale }: UseGameMenuFlowOptions): GameMenuFlow {
  const { t, i18n } = useTranslation('idleVillage');
  const [screen, setScreen] = useState<'load' | 'settings' | 'quit' | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const unsaved = hasUnsavedProgress(currentTick);

  const close = () => {
    setScreen(null);
    setFailed(false);
  };
  const onQuit = () => {
    if (decideQuit({ unsaved: hasUnsavedProgress(currentTick) }) === 'quit') quitToTitle();
    else setScreen('quit');
  };
  const saveAndQuit = async () => {
    setSaving(true);
    setFailed(false);
    const ok = await saveNowToManualSlot({ flush });
    setSaving(false);
    if (ok) quitToTitle();
    else setFailed(true);
  };

  const last = getLastSaved();
  const when = last ? new Intl.DateTimeFormat(i18n.language, { timeStyle: 'short' }).format(last.at) : null;

  const screens = (
    <>
      {screen === 'load' && <LoadGamePanel inGame unsaved={unsaved} currentDay={currentDay} onClose={close} onLoaded={() => window.location.reload()} />}
      {screen === 'settings' && <SettingsPanel onClose={close} scale={scale} />}
      {screen === 'quit' && (
        <GameMenuConfirm
          title={t('gameFrame.menu.quit.title')}
          cancelLabel={t('gameFrame.menu.cancel')}
          onCancel={close}
          actions={[
            { label: t('gameFrame.menu.quit.quitNoSave'), onClick: quitToTitle, disabled: saving },
            { label: saving ? t('gameFrame.menu.quit.saving') : t('gameFrame.menu.quit.saveAndQuit'), onClick: () => void saveAndQuit(), primary: true, disabled: saving },
          ]}
          data-testid="quit-confirm"
        >
          <span>{when ? t('gameFrame.menu.quit.lastSaved', { when }) : t('gameFrame.menu.quit.neverSaved')}</span>
          <span>{t('gameFrame.menu.quit.unsavedWarn')}</span>
          {failed && <span role="alert">{t('gameFrame.menu.quit.saveFailed')}</span>}
        </GameMenuConfirm>
      )}
    </>
  );

  return { menuProps: { onLoadGame: () => setScreen('load'), onOpenSettings: () => setScreen('settings'), onQuit }, screens };
}
