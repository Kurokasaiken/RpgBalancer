/**
 * labUi — shared presentational atoms for the Quest Generation Lab
 * (R-140). Visual language follows the TestHub lab pages (dark slate,
 * amber accents) — these are dev surfaces, not game HUD.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LabStatus } from '@/balancing/config/idleVillage/quests/generation/labRegistry';

/** Tailwind classes per lifecycle status — honest color coding. */
export const STATUS_STYLE: Record<LabStatus, string> = {
  implemented: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  partial: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  offline: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  gated: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  proposal: 'border-slate-400/40 bg-slate-400/10 text-slate-300',
  missing: 'border-red-500/40 bg-red-500/10 text-red-300',
};

/** Status pill — i18n label under `questGenLab.status.*`. */
export const StatusBadge: React.FC<{ status: LabStatus }> = ({ status }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${STATUS_STYLE[status]}`}
    >
      {t(`questGenLab.status.${status}`)}
    </span>
  );
};

/** Small neutral chip (tags, gates, flags). */
export const Chip: React.FC<{ children: React.ReactNode; tone?: 'default' | 'warn' | 'good' | 'mono' }> = ({
  children,
  tone = 'default',
}) => {
  const cls =
    tone === 'warn'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      : tone === 'good'
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
        : tone === 'mono'
          ? 'border-white/15 bg-white/5 text-slate-300 font-mono'
          : 'border-white/10 bg-white/5 text-slate-300';
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] ${cls}`}>{children}</span>
  );
};

/** Lab card — the TestHub panel construction. */
export const LabCard: React.FC<{
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, aside, children, className = '' }) => (
  <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>
    <div className="mb-2 flex items-start justify-between gap-2">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      {aside}
    </div>
    {children}
  </div>
);

/** Section shell — icon + title + description + content. */
export const LabSection: React.FC<{
  icon: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}> = ({ icon, title, desc, children }) => (
  <section className="mb-10">
    <header className="mb-3 border-b border-white/10 pb-2">
      <h2 className="flex items-center gap-2 text-lg font-bold text-amber-200">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {desc && <p className="mt-1 text-xs text-slate-400">{desc}</p>}
    </header>
    {children}
  </section>
);

/** A labelled micro-list of chips. */
export const ChipRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-wrap items-center gap-1">
    <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    {children}
  </div>
);

/** A file path rendered as a compact code line. */
export const FileRef: React.FC<{ path: string }> = ({ path }) => (
  <code className="block truncate font-mono text-[10px] text-slate-400">{path}</code>
);

/** Node-kind glyph + color — shared by tree, explorer and player. */
export const KIND_STYLE: Record<string, { icon: string; cls: string }> = {
  choice: { icon: '➤', cls: 'text-sky-300' },
  check: { icon: '⚙', cls: 'text-amber-300' },
  combat: { icon: '⚔', cls: 'text-red-300' },
  info: { icon: '✎', cls: 'text-slate-300' },
  harm: { icon: '☠', cls: 'text-red-400' },
  end: { icon: '◆', cls: 'text-emerald-300' },
};

export const KindBadge: React.FC<{ kind: string }> = ({ kind }) => {
  const s = KIND_STYLE[kind] ?? KIND_STYLE.info;
  return <span className={`font-mono text-[11px] ${s.cls}`}>{s.icon}</span>;
};
