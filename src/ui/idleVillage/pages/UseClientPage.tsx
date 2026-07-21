/**
 * UseClientPage
 *
 * Test-hub page that mounts the client-only {@link ThreatStatusIndicator}
 * component and displays sample threats for each urgency level.
 */

'use client';

import { useTranslation } from 'react-i18next';
import ThreatStatusIndicator, { type Threat } from '../components/ThreatStatusIndicator';

/** Sample threats used to exercise the indicator in isolation. */
const SAMPLE_THREATS: Threat[] = [
  {
    id: 'threat-calm',
    type: 'GOBLIN_RAID',
    urgency: 'CALM',
    timeLeft: '2h 14m',
    icon: '/goblin-march-trasparente.png',
    progress: 65,
  },
  {
    id: 'threat-warning',
    type: 'PLAGUE',
    urgency: 'WARNING',
    timeLeft: '45m',
    progress: 42,
  },
  {
    id: 'threat-critical',
    type: 'SIEGE',
    urgency: 'CRITICAL',
    timeLeft: '5m',
    progress: 12,
  },
];

/**
 * Test page that renders the ThreatStatusIndicator for CALM, WARNING and
 * CRITICAL urgency states.
 *
 * @returns The rendered test page.
 */
export default function UseClientPage() {
  const { t } = useTranslation('idleVillage');

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-amber-200">
            {t('threatStatus.page.title', { defaultValue: 'Threat Status Indicator' })}
          </h1>
          <p className="text-sm text-slate-400">
            {t('threatStatus.page.description', {
              defaultValue: 'Client-only component showcase for use client directive',
            })}
          </p>
        </header>

        <div className="flex flex-col items-center gap-8">
          {SAMPLE_THREATS.map((threat) => (
            <ThreatStatusIndicator key={threat.id} threat={threat} />
          ))}
        </div>

        <footer className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          <p>Use Client &middot; Idle Village Test Hub</p>
        </footer>
      </div>
    </div>
  );
}
