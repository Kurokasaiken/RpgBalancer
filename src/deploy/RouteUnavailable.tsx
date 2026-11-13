import { useTranslation } from 'react-i18next';
import { FantasyButton } from '@/ui/fantasy/atoms/FantasyButton';
import { FantasyCard } from '@/ui/fantasy/atoms/FantasyCard';

/**
 * Fallback per route escluse dal deploy slim (PLAN-118, R-327).
 * Solo primitivi esistenti + i18n — zero asset da public/ o dev-public/
 * (in preview slim dev-public non viene servita).
 */
export const RouteUnavailable: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <FantasyCard className="max-w-md text-center">
        <p className="mb-2 text-xs uppercase tracking-widest text-amber-200/70">
          {t('deploy.routeUnavailable.kicker')}
        </p>
        <h1 className="mb-3 text-xl font-semibold text-amber-100">
          {t('deploy.routeUnavailable.title')}
        </h1>
        <p className="mb-5 text-sm text-slate-300">
          {t('deploy.routeUnavailable.body')}
        </p>
        <FantasyButton onClick={() => { window.location.href = '/'; }}>
          {t('deploy.routeUnavailable.backHome')}
        </FantasyButton>
      </FantasyCard>
    </div>
  );
};
