import React from 'react';

interface DefaultPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const DefaultPageHeader: React.FC<DefaultPageHeaderProps> = ({ title, subtitle, icon, actions }) => {
  return (
    <header className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex flex-col">
        <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-semibold tracking-[0.22em] md:tracking-[0.3em] uppercase text-indigo-200 drop-shadow-[0_0_14px_rgba(129,140,248,0.9)]">
          {icon && <span className="text-xl md:text-2xl" aria-hidden>{icon}</span>}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.26em]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-1.5 md:gap-2 mt-2 md:mt-0">{actions}</div>}
    </header>
  );
};

interface DefaultSectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const DefaultSection: React.FC<DefaultSectionProps> = ({ title, hint, children, className, actions }) => {
  const rootClass = ['default-card space-y-2', className].filter(Boolean).join(' ');

  return (
    <section className={rootClass}>
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-700/60 pb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] md:tracking-[0.26em] text-cyan-300 truncate">
            {title}
          </h2>
          {hint && (
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.16em] md:tracking-[0.18em] text-slate-500">
              {hint}
            </span>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="text-[10px] md:text-xs text-slate-300">{children}</div>
    </section>
  );
};
