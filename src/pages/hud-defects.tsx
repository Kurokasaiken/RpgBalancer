import { useEffect, useState } from 'react';

/**
 * PLAN-110 §13 E-15/F-17 — per-defect side-by-side verdicts.
 * Reads /mockups/hud-defects/defects.json (a run export: numbered mockup crop |
 * generated result per defect). The Director clicks a verdict per row; the
 * page writes the updated defects.json locally via download (no backend).
 */

interface DefectRow {
  id: string;
  zone: string;
  text: string;
  mockup: string;
  result: string;
  verdict?: 'corretto' | 'non corretto' | 'peggiorato';
}

const VERDICTS = ['corretto', 'non corretto', 'peggiorato'] as const;

const S: Record<string, React.CSSProperties> = {
  row: { display: 'flex', gap: 12, padding: '10px 14px', borderBottom: '1px solid #1d3a4d', alignItems: 'center' },
  img: { width: 260, height: 'auto', display: 'block', border: '1px solid #2a4d63', background: '#0a1622' },
  meta: { width: 210, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#9fd0e8', lineHeight: 1.5 },
  btn: (on: boolean) => ({
    fontFamily: 'ui-monospace, monospace', fontSize: 11, padding: '4px 8px', cursor: 'pointer',
    background: on ? '#d4af37' : 'rgba(3,14,24,0.85)', color: on ? '#0a1622' : '#cfe6f0',
    border: `1px solid ${on ? '#d4af37' : '#2a4d63'}`, borderRadius: 4,
  }),
};

export default function HudDefectsPage() {
  const [rows, setRows] = useState<DefectRow[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch('/mockups/hud-defects/defects.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { defects: DefectRow[] }) => setRows(d.defects))
      .catch(() => setErr('no /mockups/hud-defects/defects.json — run export missing'));
  }, []);

  const set = (id: string, v: DefectRow['verdict']) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, verdict: v } : r)));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ defects: rows }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'defects-verdicts.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const tally = VERDICTS.map((v) => `${v}: ${rows.filter((r) => r.verdict === v).length}`).join(' · ');

  return (
    <div style={{ minHeight: '100vh', background: '#0b2233', color: '#cfe6f0', fontFamily: 'ui-monospace, monospace', padding: 18 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 14, letterSpacing: 1, margin: 0 }}>HUD DEFECTS — verdetto per difetto</h1>
        <button type="button" data-testid="defects-export" onClick={exportJson} style={S.btn(false)}>esporta verdicts</button>
        <span data-testid="defects-tally" style={{ fontSize: 11 }}>{tally}</span>
      </div>
      {err && <div style={{ color: '#ff9d7a' }}>{err}</div>}
      {rows.map((r) => (
        <div key={r.id} data-defect={r.id} style={S.row}>
          <div style={S.meta}>
            <div style={{ color: '#ffe27a' }}>{r.id} · {r.zone}</div>
            <div>{r.text}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexDirection: 'column' }}>
              {VERDICTS.map((v) => (
                <button key={v} type="button" data-verdict={v} onClick={() => set(r.id, v)} style={S.btn(r.verdict === v)}>{v}</button>
              ))}
            </div>
          </div>
          <div><div style={{ fontSize: 10, marginBottom: 2 }}>mockup #{r.id}</div><img src={r.mockup} alt={`${r.id} mockup`} style={S.img} /></div>
          <div><div style={{ fontSize: 10, marginBottom: 2 }}>risultato</div><img src={r.result} alt={`${r.id} result`} style={S.img} /></div>
        </div>
      ))}
    </div>
  );
}
