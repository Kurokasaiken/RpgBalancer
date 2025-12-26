import { useEffect, useState } from 'react';
import { useDensity } from '@/contexts/DensityContext';
import { BOTTOM_NAV, NAV_SECTIONS, type AppNavTabId } from '@/shared/navigation/navConfig';

interface VillageNavigationShellProps {
  children: React.ReactNode;
  activeTab: AppNavTabId;
  onTabChange: (tab: AppNavTabId) => void;
}

/**
 * Lightweight navigation shell that keeps the Idle Village tokens in control of the page background
 * while still exposing the Observatory navigation + drawer interactions.
 */
export const VillageNavigationShell: React.FC<VillageNavigationShellProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { density, toggleDensity } = useDensity();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = (tabId: AppNavTabId | 'more') => {
    if (tabId === 'more') {
      setIsDrawerOpen(true);
      return;
    }
    onTabChange(tabId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <div className="flex min-h-screen w-full overflow-hidden bg-[var(--surface-base)] text-ivory">
        {!isMobile && (
          <aside className="hidden lg:flex w-72 shrink-0 px-4 py-6">
            <div
              className="relative w-full overflow-hidden rounded-[26px] border px-4 py-5 shadow-[0_30px_65px_rgba(0,0,0,0.65)]"
              style={{
                borderColor: 'var(--panel-border)',
                background:
                  'linear-gradient(140deg, rgba(255,255,255,0.04), rgba(0,0,0,0.45)), var(--panel-surface)',
                boxShadow: `0 30px 60px var(--card-shadow-color)`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  background:
                    'var(--card-surface-radial, radial-gradient(circle at 25% 0%, rgba(255,255,255,0.18), transparent 55%))',
                }}
              />
              <div className="relative z-10 flex h-full flex-col gap-5">
                <nav className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
                  {NAV_SECTIONS.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <p className="px-2 text-[9px] uppercase tracking-[0.35em] text-slate-400/70">{section.title}</p>
                      <div className="flex flex-col gap-2">
                        {section.items.map((item) => {
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              data-tab-id={item.id}
                              data-testid={`nav-btn-${item.id}`}
                              onClick={() => onTabChange(item.id)}
                              className={[
                                'flex items-center gap-3 rounded-[18px] border px-3 py-2 text-left text-[10px] uppercase tracking-[0.28em] transition-all',
                                isActive
                                  ? 'text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                                  : 'text-slate-200/85 hover:text-ivory hover:shadow-[0_0_25px_rgba(52,211,153,0.25)]',
                              ].join(' ')}
                              style={{
                                borderColor: isActive ? 'rgba(251,191,36,0.65)' : 'rgba(255,255,255,0.12)',
                                background: isActive
                                  ? 'linear-gradient(120deg, rgba(251,191,36,0.22), rgba(17,10,0,0.85))'
                                  : 'linear-gradient(120deg, rgba(5,7,12,0.85), rgba(2,4,6,0.92))',
                              }}
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
                <div
                  className="rounded-[18px] border border-white/10 px-4 py-3 text-[9px] uppercase tracking-[0.35em] text-slate-200/80 shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
                  style={{
                    background: 'linear-gradient(120deg, rgba(5,8,14,0.65), rgba(10,12,20,0.8))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="text-amber-200/70">Navigator Tips</p>
                  <p className="text-[8px] text-slate-400/80 tracking-[0.3em] mt-1">
                    Usa SPACE per mettere in pausa o riprendere il ciclo del Villaggio.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {isMobile && (
            <header className="flex items-center justify-between px-4 py-3 border-b"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background:
                  'linear-gradient(120deg, rgba(3,5,9,0.75), rgba(8,10,16,0.85)), var(--surface-base)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-[var(--panel-border)] bg-black/40 flex items-center justify-center shadow-glow-gold">
                  <span className="text-gold text-lg">✶</span>
                  <span className="sr-only">Main navigation</span>
                </div>
              </div>
              <button
                onClick={toggleDensity}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 text-teal text-sm"
              >
                {density === 'compact' ? '▪' : '▫'}
              </button>
            </header>
          )}

          <div className={`flex-1 overflow-y-auto scroll-smooth ${isMobile ? 'pb-20' : ''}`}>
            <div className="p-3 md:p-6">
              <div className="observatory-main-frame">{children}</div>
            </div>
          </div>
        </main>
      </div>

      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-black/70 backdrop-blur-sm border-t border-white/10 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16">
            {BOTTOM_NAV.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'more' && isDrawerOpen);
              return (
                <button
                  key={item.id}
                  data-testid={`nav-btn-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl no-select transition-all duration-150 active:scale-95 ${isActive ? 'bg-gold/15 text-gold' : 'text-teal-muted active:bg-black/20'}`}
                >
                  <span className="text-xl mb-0.5">{item.icon}</span>
                  <span className="text-2xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {isMobile && isDrawerOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] bg-[var(--surface-panel)] rounded-t-3xl border-t border-white/10 overflow-hidden animate-slide-up">
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-slate rounded-full" />
            </div>
            <div className="overflow-y-auto max-h-[calc(75vh-60px)] pb-safe scrollbar-hide">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-2">
                  <p className="px-5 pt-2 pb-1">
                    <span className="flex items-center gap-2 text-[8px] text-teal-muted/40">
                      <span className="h-px flex-1 bg-slate-700/60" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/70 shadow-glow-gold" />
                      <span className="h-px flex-1 bg-slate-700/60" />
                    </span>
                  </p>
                  <div className="px-3">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        data-testid={`nav-btn-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-1 transition-all duration-150 active:scale-98 no-select ${
                          activeTab === item.id
                            ? 'bg-gold/15 text-gold'
                            : 'text-ivory hover:bg-black/30 active:bg-black/40'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-base">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};
