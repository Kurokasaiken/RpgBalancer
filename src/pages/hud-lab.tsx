import { useMemo } from 'react';
import { LAB_CATALOG, type LabEntry, type LabEntryStatus } from './hud-lab/catalog';
import { HOSTS } from './hud-lab/hostRegistry';
import { charterFor } from '@/config/hud/charters';
import { CharterSection } from './hud-lab/charterSection';

/**
 * PLAN-129 — `/hud-lab` rewritten as the catalog of the baptized vocabulary:
 * isolated cards (Director 2026-11-20 «isolati») — one per baptized component,
 * one per reusable piece — mounted live on a neutral dev stage. `da-riallineare`
 * rows are the backport queue. `/hud-compose` stays the on-map composition lab.
 */

const STATUS_STYLE: Record<LabEntryStatus, { label: string; color: string; bg: string }> = {
  battezzato: { label: 'battezzato', color: '#ffd98a', bg: 'rgba(140,100,30,0.28)' },
  candidato: { label: 'candidato', color: '#8fd0ff', bg: 'rgba(40,110,160,0.25)' },
  'da-riallineare': { label: 'da riallineare', color: '#f0a0a0', bg: 'rgba(160,60,60,0.25)' },
  deprecato: { label: 'deprecato', color: '#9aa4ae', bg: 'rgba(90,100,110,0.22)' },
};

const order: Record<LabEntryStatus, number> = { battezzato: 0, candidato: 1, 'da-riallineare': 2, deprecato: 3 };

const StatusBadge: React.FC<{ status: LabEntryStatus }> = ({ status }) => {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6,
      color: s.color, background: s.bg, border: `1px solid ${s.color}55`,
      borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
};

const Card: React.FC<{ entry: LabEntry }> = ({ entry }) => {
  const Host = HOSTS[entry.host];
  return (
    <article
      data-lab-card=""
      data-lab-id={entry.id}
      data-lab-kind={entry.kind}
      data-lab-status={entry.status}
      style={{
        display: 'flex', flexDirection: 'column', minWidth: 0,
        background: 'rgba(10, 20, 30, 0.88)',
        border: `1px solid ${entry.status === 'da-riallineare' ? 'rgba(200,90,90,0.5)' : 'rgba(125,180,220,0.3)'}`,
        borderRadius: 10, overflow: 'hidden',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid rgba(125,180,220,0.18)' }}>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e8f0f7', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.title}
        </h3>
        <StatusBadge status={entry.status} />
      </header>
      {/* transform creates a containing block so position:fixed children
          (stash panel, cassetto drawer) stay inside the card, not the viewport */}
      <div data-lab-mount="" style={{ position: 'relative', minHeight: 60, color: '#dfe9f2', transform: 'translateZ(0)' }}>
        {Host ? <Host entry={entry} /> : (
          <div style={{ padding: 10, fontSize: 11, color: '#f0a0a0' }}>host sconosciuto: {entry.host}</div>
        )}
      </div>
      {/* PLAN-131 T-004: charter sotto il mount, forma fissa sempre visibile.
          Join su componentId — mai duplicato dal catalogo. */}
      {entry.kind === 'component' && (() => {
        const charter = charterFor(entry.id);
        return charter ? <CharterSection charter={charter} /> : (
          <div data-charter-section={entry.id} style={{ borderTop: '1px solid rgba(125,180,220,0.18)', padding: '6px 10px', fontSize: 10, color: '#7d92a6' }}>
            charter non compilato — {entry.status}
          </div>
        );
      })()}
      <footer style={{ padding: '6px 10px', borderTop: '1px solid rgba(125,180,220,0.14)', fontSize: 9, color: '#8fa5b8', lineHeight: 1.5 }}>
        <div>{entry.provenance.ruling}</div>
        {entry.provenance.ref && <div style={{ opacity: 0.8 }}>{entry.provenance.ref}{entry.provenance.sha256 ? ` · sha ${entry.provenance.sha256}` : ''}</div>}
      </footer>
    </article>
  );
};

const Section: React.FC<{ title: string; hint?: string; entries: LabEntry[] }> = ({ title, hint, entries }) => (
  <section data-lab-section={title.toLowerCase()} style={{ marginBottom: 26 }}>
    <h2 style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: '#cfe3f2', margin: '0 0 4px' }}>{title}</h2>
    {hint && <p style={{ margin: '0 0 12px', fontSize: 10, color: '#7d92a6' }}>{hint}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, alignItems: 'start' }}>
      {entries.map((e) => <Card key={e.id} entry={e} />)}
    </div>
  </section>
);

export default function HudLabPage() {
  const { components, pieces, toRealign } = useMemo(() => {
    const sorted = [...LAB_CATALOG].sort((a, b) => order[a.status] - order[b.status]);
    return {
      components: sorted.filter((e) => e.kind === 'component' && e.status !== 'da-riallineare'),
      pieces: sorted.filter((e) => e.kind === 'piece' && e.status !== 'da-riallineare'),
      toRealign: sorted.filter((e) => e.status === 'da-riallineare'),
    };
  }, []);

  return (
    <div
      data-lab-scroller=""
      style={{
      position: 'fixed', inset: 0, overflowY: 'auto', padding: '22px 26px 60px',
      background: 'radial-gradient(1200px 700px at 50% -10%, #14263a 0%, #0a1622 55%, #060d16 100%)',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif', color: '#dfe9f2',
    }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 18, letterSpacing: 0.6 }}>HUD Lab — vocabolario battezzato</h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#7d92a6' }}>
          Componenti battezzati su /game e pezzi riutilizzabili, montati live in card isolate (PLAN-129).
          La composizione su mappa resta su <code>/hud-compose</code>.
        </p>
      </header>

      <Section title="Componenti" hint="Montati live; quelli senza fixture reale dichiarano la nota (niente dati inventati)." entries={components} />
      <Section title="Pezzi" hint="Atomi riutilizzabili battezzati — cornici, bande, controlli, materiali." entries={pieces} />
      <Section title="Da riallineare" hint="Superfici vive su /game ancora fuori dal vocabolario battezzato — la coda di backport." entries={toRealign} />
    </div>
  );
}
