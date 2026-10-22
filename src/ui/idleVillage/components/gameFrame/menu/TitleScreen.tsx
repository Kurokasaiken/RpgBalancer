/**
 * TitleScreen — the destination of «Esci al titolo» and the first screen of
 * the desktop app (PLAN-076 T-6, TITLE-1 A): the logo on the boot veil's
 * lacquer, a gold rule, one column of neutral pills. «Continua» resumes the
 * newest save; «Esci dal gioco» exists only in the desktop app.
 */
import { useTranslation } from 'react-i18next';
import { SkinButton, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import logoUrl from '@/assets/ui/idleVillage/wanderlust-logo.png';

export interface TitleScreenProps {
  /** Day of the game «Continua» resumes; null when there is nothing to continue. */
  continueDay: number | null;
  onContinue: () => void;
  onNewGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
  /** Present only in the desktop app. */
  onExit?: () => void;
  busy?: boolean;
}

const BOOT = DEFAULT_GAME_FRAME_CONFIG.bootVeil;

export function TitleScreen({ continueDay, onContinue, onNewGame, onLoadGame, onSettings, onExit, busy = false }: TitleScreenProps) {
  const { t } = useTranslation('idleVillage');
  const pill = { minWidth: 260, height: 34, justifyContent: 'center' } as const;
  return (
    <SkinScope>
      <main
        data-testid="title-screen"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.boot,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `radial-gradient(ellipse 120% 90% at 50% 42%, ${BOOT.colors.bgGlow} 0%, ${BOOT.colors.bgDeep} 62%, ${BOOT.colors.bgDeep} 100%)`,
        }}
      >
        <img src={logoUrl} alt={t('gameFrame.title')} style={{ width: `min(${BOOT.logoWidthPx}px, 78vw)`, height: 'auto', filter: 'drop-shadow(0 10px 34px rgba(0, 0, 0, 0.55))' }} />
        <div aria-hidden="true" style={{ width: BOOT.barWidthPx * 0.72, height: 1, margin: '18px 0 22px', background: `linear-gradient(90deg, transparent, ${BOOT.colors.rule}, transparent)` }} />
        <nav data-hud-controls="" aria-label={t('gameFrame.menu.title')} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {continueDay !== null && (
            <SkinButton variant="cta" style={{ minWidth: pill.minWidth }} disabled={busy} onClick={onContinue}>
              {continueDay > 0 ? t('gameFrame.menu.titleScreen.continue', { day: continueDay }) : t('gameFrame.menu.titleScreen.continuePlain')}
            </SkinButton>
          )}
          <button type="button" style={pill} disabled={busy} onClick={onNewGame}>
            <span>{t('gameFrame.menu.titleScreen.newGame')}</span>
          </button>
          <button type="button" style={pill} disabled={busy} onClick={onLoadGame}>
            <span>{t('gameFrame.menu.titleScreen.loadGame')}</span>
          </button>
          <button type="button" style={pill} disabled={busy} onClick={onSettings}>
            <span>{t('gameFrame.menu.titleScreen.settings')}</span>
          </button>
          {onExit && (
            <button type="button" style={pill} disabled={busy} onClick={onExit}>
              <span>{t('gameFrame.menu.titleScreen.exit')}</span>
            </button>
          )}
        </nav>
      </main>
    </SkinScope>
  );
}

export default TitleScreen;
