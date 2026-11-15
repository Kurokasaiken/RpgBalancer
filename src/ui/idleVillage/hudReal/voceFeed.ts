/**
 * voceFeed — what the narrator's plaque says on /game (R-338, Director): the nearest upcoming
 * event, as `nextEventModel` already computes it for the HUD. Nothing within the model's window
 * means the feed is silent — the plaque stays folded behind the bust (never an empty bandiera).
 *
 * Pure and unit-tested; the page injects `t` so this file never owns strings or stores.
 */
import type { NextEventModel } from '@/ui/idleVillage/components/gameFrame/nextEvent';

export interface VoceMessage {
  /** Stable identity for the plaque's replace pass (`voce:<event.id>`) — same id, fresher text = in-place update. */
  id: string;
  title: string;
  text: string;
}

type VoceT = (key: string, options?: Record<string, unknown>) => string;

/* Keys carry the `idleVillage:` prefix — this file has no `useTranslation`, so the static
 * key validator (`i18n:validate`) resolves namespaces from the key itself. */
export function voceMessageFor(model: NextEventModel, t: VoceT): VoceMessage | null {
  const ev = model.event;
  if (!ev) return null;
  const when =
    ev.daysLeft <= 0
      ? t('idleVillage:gameFrame.voce.when.today')
      : t('idleVillage:gameFrame.voce.when.days', { days: ev.daysLeft });
  return {
    id: `voce:${ev.id}`,
    title: t(`idleVillage:gameFrame.events.types.${ev.typeId}`, { defaultValue: t('idleVillage:gameFrame.events.types.other') }),
    text: t(model.state === 'alarm' ? 'idleVillage:gameFrame.voce.line.alarm' : 'idleVillage:gameFrame.voce.line.quiet', { title: ev.title, when }),
  };
}
