const BASE = '/assets/world/mappa2/upscale-review';

const ZONES: { label: string; key: string }[] = [
  { label: 'Cascata', key: 'waterfall_hero' },
  { label: 'Vette nevose', key: 'snow_peaks' },
  { label: 'Massiccio vulcanico', key: 'volcanic_massif' },
  { label: 'Foresta profonda', key: 'deep_forest' },
];

function Pair({ a, b, capA, capB }: { a: string; b: string; capA: string; capB: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {[ [a, capA], [b, capB] ].map(([src, cap]) => (
        <figure key={src} style={{ margin: 0 }}>
          <img src={src} style={{ maxWidth: 480, borderRadius: 6, display: 'block' }} />
          <figcaption style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{cap}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function Mappa2UpscaleReview() {
  return (
    <div style={{ background: '#1a2019', color: '#e8e0c8', minHeight: '100vh', padding: '28px 36px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Mappa2 Upscale — review</h1>
      <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 900 }}>
        Ricetta r003 (debate converged): gli alberi non vengono mai generati nel repaint di regione —
        LP dei cutout originali + HP del detail pass dentro la silhouette.
        Nella mappa reale: attiva l'effetto <b>detail</b> (tab <b>land</b>) in{' '}
        <a href="/mappa2-lab" style={{ color: '#8fd4a8' }}>/mappa2-lab</a> e zooma su una foresta.
      </p>

      <h2 style={{ fontSize: 17, marginTop: 28 }}>Atlas broadleaf — contact sheet pilot</h2>
      <Pair
        a={`${BASE}/atlas_broadleaf.png`} b={`${BASE}/atlas_broadleaf_detail.png`}
        capA="esemplari originali (8 canopy cutouts)" capB="Gemini detail pass — stesse silhouette"
      />

      <h2 style={{ fontSize: 17, marginTop: 28 }}>LP(orig) + HP(Gemini) per chioma</h2>
      <figure style={{ margin: 0 }}>
        <img src={`${BASE}/atlas_lphp2.png`} style={{ maxWidth: 920, borderRadius: 6, display: 'block' }} />
        <figcaption style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
          per cella: originale | dettaglio HP su LP originale (fonte full-res)
        </figcaption>
      </figure>

      <h2 style={{ fontSize: 17, marginTop: 28 }}>Variante — repaint pieno dentro silhouette originale</h2>
      <figure style={{ margin: 0 }}>
        <img src={`${BASE}/atlas_fullrepaint.png`} style={{ maxWidth: 920, borderRadius: 6, display: 'block' }} />
        <figcaption style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
          per cella: originale | generato fit-to-silhouette + match colore LAB (interni ridipinti, forma garantita)
        </figcaption>
      </figure>

      <h2 style={{ fontSize: 17, marginTop: 28 }}>FORMULA VINCENTE — "alberi fatti a mano" (deep_forest)</h2>
      <Pair
        a={`${BASE}/deep_forest_src4x.png`} b={`${BASE}/df_treerework.png`}
        capA="sorgente" capB="repaint: alberi singoli, tronchi, aghi/ciuffi, varietà — scena identica"
      />

      <h2 style={{ fontSize: 17, marginTop: 28 }}>Test multi-riferimento — deep_forest + atlante alberi</h2>
      <Pair
        a={`${BASE}/deep_forest_src4x.png`} b={`${BASE}/df_multiref.png`}
        capA="sorgente" capB="repaint con atlante riferimento (alberi del tipo giusto; villaggio inventato a dx da correggere)"
      />

      <h2 style={{ fontSize: 17, marginTop: 28 }}>Hero zones — sorgente vs repaint</h2>
      {ZONES.map((z) => (
        <div key={z.key} style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 14, margin: '0 0 6px' }}>{z.label}</h3>
          <Pair
            a={`${BASE}/${z.key}_src4x.png`} b={`${BASE}/${z.key}_final.png`}
            capA="sorgente (crop 4x)" capB="repaint"
          />
        </div>
      ))}
    </div>
  );
}
