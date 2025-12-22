import React from 'react';

interface HeroicShellProps {
  children: React.ReactNode;
  title?: string;
}

export const HeroicShell: React.FC<HeroicShellProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen w-full bg-(--bg-obsidian) text-(--marble-ivory) overflow-x-hidden">
      {/* Overlay per la grana pittorica globale */}
      <div className="fixed inset-0 pointer-events-none opacity-10 mix-blend-overlay bg-[url('/assets/ui/oil-grain.png')] z-50" />

      <div className="relative max-w-7xl mx-auto p-4 md:p-8">
        {title && (
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-5xl font-heroic text-amber-glow tracking-[0.3em]">
              {title}
            </h1>
            <div className="h-px w-64 mx-auto mt-4 bg-linear-to-r from-transparent via-(--bronze-aged) to-transparent" />
          </header>
        )}

        <main className="animate-in fade-in duration-700">{children}</main>
      </div>
    </div>
  );
};
