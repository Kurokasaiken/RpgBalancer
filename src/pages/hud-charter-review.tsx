/**
 * /hud-charter-review — OB-7 PLAN-131: review Director dei charter con
 * esempi visivi reali (witness R-374 V3 in public/witness/charter-review/)
 * e scelta multipla per voce. Il bottone in fondo produce un JSON di
 * ruling da incollare in chat: l'agente lo applica ai charter, firma il
 * signoff OB-7 e promuove a director-verified + ornamentLevel.
 *
 * Banco dev — forma fissa, niente persistenza, niente hidden state.
 */
import { useMemo, useState } from 'react';

const W = '/witness/charter-review';

type ReviewKind = 'apprezzato' | 'difetto' | 'esplorazione';

interface ReviewItem {
  id: string;
  kind: ReviewKind;
  title: string;
  body: string;
  images: { src: string; cap: string }[];
  options: { id: string; label: string }[];
  notePlaceholder?: string;
}

const CONF = [
  { id: 'confermo', label: 'Confermo — resta nella lista "non toccare"' },
  { id: 'correggo', label: 'Correggo il testo (nota sotto)' },
  { id: 'tolgo', label: 'Non mi convince — togli' },
];
const APERTO = { id: 'aperto', label: 'Lascio aperto — deciderò dopo' };

const ITEMS: ReviewItem[] = [
  {
    id: 'app-1-pozzi', kind: 'apprezzato', title: '1. Rapporto nero/verde dei pozzi',
    body: 'I pozzi restano ~80% nero-teal / 20% smeraldo (ricetta delle barre top), smalto saturo solo come accento. Ruling registrato: «non c\'è bilanciamento» 2026-11-21.',
    images: [{ src: `${W}/v3-1440-risk.png`, cap: 'pozzi risk/reward V3' }],
    options: CONF,
  },
  {
    id: 'app-2-placca', kind: 'apprezzato', title: '2. Placca CONFIRM dipinta + label Cinzel',
    body: 'La placca è arte dipinta (oro + lacca smeraldo), la label Cinzel resta viva sopra. «Sì, CONFIRM» 2026-11-17 → rigenerata Gemini 2026-11-21.',
    images: [{ src: `${W}/v3-1440-cta.png`, cap: 'CTA CONFIRM V3' }],
    options: CONF,
  },
  {
    id: 'app-3-cornice', kind: 'apprezzato', title: '3. Cornice esterna da pezzi standalone',
    body: 'Angoli + rotaia piegata sono pezzi del kit (PLAN-130), mai ritagli dal golden — il frame è componibile e riusabile.',
    images: [{ src: `${W}/v3-1440x900.png`, cap: 'cassetto V3 intero @1440×900' }],
    options: CONF,
  },
  {
    id: 'app-4-vignetta', kind: 'apprezzato', title: '4. Vignetta quest a filo bordo, senza cornice',
    body: 'L\'arte quest arriva a filo del bordo interno con arco oro sul tondo — niente cornice attorno («Remove frame» + «vignetta da quest»).',
    images: [{ src: `${W}/v3-1440-cart.png`, cap: 'cartouche + vignetta' }],
    options: CONF,
  },
  {
    id: 'app-5-emblemi', kind: 'apprezzato', title: '5. Emblemi lit/dimmed come scala rischio/reward',
    body: 'Teschio (osso, bordeaux), forziere, alloro successo — lit/dimmed come linguaggio di stato leggibile.',
    images: [{ src: `${W}/v3-1440-risk.png`, cap: 'emblemi + pozzi' }],
    options: CONF,
  },
  {
    id: 'app-6-viaggio', kind: 'apprezzato', title: '6. Banda viaggio a pill unico',
    body: 'Segmento Outbound smalto + gemme + totale, scelto sul mockup: «il viaggio è superiore, prendiamo quello».',
    images: [
      { src: `${W}/v3-1440-journey.png`, cap: 'implementato V3' },
      { src: `${W}/mockup-journey-pill.png`, cap: 'mockup scelto' },
    ],
    options: CONF,
  },
  {
    id: 'app-7-scroller', kind: 'apprezzato', title: '7. Scroller party: peek 4° seat + fade-mask',
    body: 'La profondità si legge dal peek del quarto seat + maschera di dissolvenza — fix F6 dell\'audit R-374.',
    images: [{ src: `${W}/v3-1440-party.png`, cap: 'party rack + scroller' }],
    options: CONF,
  },
  {
    id: 'iss-a-motivo-cta', kind: 'difetto', title: 'a) Motivo CTA disabilitata: sr-only vs visibile',
    body: 'Oggi il motivo («servono eroi») è solo per screen reader — ma le desiderata v38 (REQ:v38-states) chiedono motivo visibile. Drift dichiarato: o si emendano le v38 o si rende visibile.',
    images: [{ src: `${W}/v3-1440-cta.png`, cap: 'la placca — il motivo non è dipinto' }],
    options: [
      { id: 'motivo-visibile', label: 'Motivo visibile sulla placca/accanto (allineo a v38)' },
      { id: 'amend-v38', label: 'Amend desiderata: sr-only basta (registro il ruling)' },
      APERTO,
    ],
  },
  {
    id: 'iss-b-materiale-pozzi', kind: 'difetto', title: 'b) Materiale dei pozzetti',
    body: 'Opzione lacca-petrolio (misurata, NON ancora in pieces.json — serve amend PLAN-130) vs nero-teal della ricetta barre vs smaltato profondo. Il charter è shippato senza il materiale.',
    images: [{ src: `${W}/v3-1440-risk.png`, cap: 'pozzetti attuali (nero-teal)' }],
    options: [
      { id: 'lacca-petrolio', label: 'Lacca-petrolio — battezzo l\'amend a pieces.json (D-open-4)' },
      { id: 'nero-teal', label: 'Nero-teal ricetta barre top (materiale già in enum)' },
      { id: 'smalto-profondo', label: 'Smalto profondo (altra direzione)' },
      APERTO,
    ],
  },
  {
    id: 'iss-c-disabled', kind: 'difetto', title: 'c) Stato disabled: leggibilità',
    body: 'Filtro solo sulla lacca (la cornice resta oro) + testo ~82% opacità. Domanda: la placca disabilitata si legge ancora come placca?',
    images: [{ src: `${W}/v3-1440-cta.png`, cap: 'CTA — in game prova a disattivarla (0 eroi)' }],
    options: [
      { id: 'regge', label: 'Regge — si legge ancora come placca preziosa' },
      { id: 'troppo-spento', label: 'Troppo spento — risatura la lacca' },
      { id: 'troppo-vivo', label: 'Troppo vivo — non si capisce che è off' },
      APERTO,
    ],
  },
  {
    id: 'iss-d-scrollband', kind: 'difetto', title: 'd) Affordance HudScrollBandX',
    body: 'La banda da sola non leggeva come "c\'è altro" — mitigato con fade-mask + peek del 4° seat. La combinazione basta?',
    images: [{ src: `${W}/v3-1440-party.png`, cap: 'peek + fade sul rack party' }],
    options: [
      { id: 'basta', label: 'Basta — peek+fade portano il messaggio' },
      { id: 'serve-altro', label: 'Serve altra affordance (nota: che cosa)' },
      APERTO,
    ],
  },
  {
    id: 'exp-alpha-desaturazione', kind: 'esplorazione', title: 'α) Quanta desaturazione regge la lacca',
    body: 'Dimensione aperta: quanto si può desaturare lo smalto nello stato disabled prima che la placca sembri morta («the disabled plaque looked dead»).',
    images: [{ src: `${W}/v3-1440-cta.png`, cap: 'punto di partenza attuale' }],
    options: [
      { id: 'prova-meno20', label: 'Prova −20% sat sulla lacca' },
      { id: 'prova-meno40', label: 'Prova −40% sat sulla lacca' },
      { id: 'non-toccare', label: 'Non toccare — lascio come è' },
      APERTO,
    ],
    notePlaceholder: 'es. valore diverso, o "solo con motivo visibile"',
  },
  {
    id: 'exp-beta-vignetta', kind: 'esplorazione', title: 'β) Vignetta: arte per-quest o default',
    body: 'La vignetta attuale (cassetto/vignette.webp) è provvisoria. Direzione: un\'arte dedicata generata per-quest, un default permanente, o entrambe con fallback?',
    images: [
      { src: `${W}/v3-1440-cart.png`, cap: 'vignetta attuale (provvisoria)' },
      { src: `${W}/cass-empty.png`, cap: 'cassetto vuoto — senza quest' },
    ],
    options: [
      { id: 'per-quest', label: 'Arte dedicata per-quest (pipeline gen)' },
      { id: 'default-permanente', label: 'Default permanente battezzato' },
      { id: 'entrambe', label: 'Entrambe: per-quest con fallback default' },
      APERTO,
    ],
  },
  {
    id: 'exp-gamma-edgetab', kind: 'esplorazione', title: 'γ) Edge-tab del cassetto chiuso',
    body: 'Desiderata v38 D6 mode b: il cassetto chiuso lascia un tab/affordance sul bordo. La forma non è mai stata battezzata.',
    images: [{ src: `${W}/v3-1440x900.png`, cap: 'il bordo destro in gioco — dove vivrebbe il tab' }],
    options: [
      { id: 'nuovo-mockup', label: 'Progettiamolo — nuovo mockup candidato' },
      { id: 'resta-chiuso', label: 'Resta chiuso senza tab (amend v38)' },
      APERTO,
    ],
  },
];

const KIND_LABEL: Record<ReviewKind, string> = {
  apprezzato: 'APPREZZATO — cosa non toccare',
  difetto: 'DIFETTI APERTI — cosa correggere',
  esplorazione: 'ESPLORAZIONE — cosa decidi tu',
};

export default function HudCharterReview() {
  const [answers, setAnswers] = useState<Record<string, { choice: string; note: string }>>({});
  const [copied, setCopied] = useState(false);

  const done = ITEMS.filter((i) => answers[i.id]?.choice).length;
  const ruling = useMemo(() => JSON.stringify({
    review: 'PLAN-131 OB-7 cassetto',
    at: new Date().toISOString(),
    answered: done, total: ITEMS.length,
    items: Object.fromEntries(
      ITEMS.filter((i) => answers[i.id]?.choice).map((i) => [
        i.id, { choice: answers[i.id].choice, ...(answers[i.id].note ? { note: answers[i.id].note } : {}) },
      ]),
    ),
  }, null, 2), [answers, done]);

  const set = (id: string, patch: Partial<{ choice: string; note: string }>) =>
    setAnswers((s) => ({ ...s, [id]: { choice: '', note: '', ...s[id], ...patch } }));

  const copy = () => {
    void navigator.clipboard?.writeText(ruling).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const kinds: ReviewKind[] = ['apprezzato', 'difetto', 'esplorazione'];

  return (
    <div style={{ background: '#0a1420', color: '#d5e0ea', minHeight: '100vh', padding: '24px 32px 120px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>Charter review — cassetto (OB-7)</h1>
      <p style={{ fontSize: 12, color: '#8fa5b8', maxWidth: 880, margin: '0 0 20px', lineHeight: 1.5 }}>
        Ogni voce ha il witness visivo reale (cassetto V2, audit R-374). Scegli un'opzione per voce —
        nota libera dove serve — poi <b>Copia ruling JSON</b> in fondo e incollalo in chat.
        Applicherò i ruling al charter, firmerò OB-7 e promuoverò a <code>director-verified</code>.
      </p>

      {kinds.map((k) => (
        <section key={k} style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 12, letterSpacing: 1.2, color: '#cfe3f2', borderBottom: '1px solid rgba(125,180,220,0.25)', paddingBottom: 5 }}>
            {KIND_LABEL[k]}
          </h2>
          {ITEMS.filter((i) => i.kind === k).map((item) => {
            const a = answers[item.id];
            return (
              <div key={item.id} style={{
                marginTop: 14, padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${a?.choice ? 'rgba(90,180,110,0.55)' : 'rgba(125,180,220,0.25)'}`,
                background: 'rgba(12,24,36,0.85)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f0f7' }}>{item.title}</div>
                <p style={{ fontSize: 11.5, color: '#a9bccf', lineHeight: 1.5, margin: '6px 0 10px', maxWidth: 860 }}>{item.body}</p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
                  {item.images.map((im) => (
                    <figure key={im.src} style={{ margin: 0 }}>
                      <img src={im.src} alt={im.cap} style={{ maxWidth: 460, maxHeight: 300, display: 'block', borderRadius: 6, border: '1px solid rgba(125,180,220,0.2)' }} />
                      <figcaption style={{ fontSize: 10, color: '#7d92a6', marginTop: 3 }}>{im.cap}</figcaption>
                    </figure>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {item.options.map((o) => (
                    <label key={o.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11.5, cursor: 'pointer', color: a?.choice === o.id ? '#a8e6b0' : '#c9d6e2' }}>
                      <input type="radio" name={item.id} checked={a?.choice === o.id} onChange={() => set(item.id, { choice: o.id })} />
                      {o.label}
                    </label>
                  ))}
                </div>
                <input
                  type="text" value={a?.note ?? ''} onChange={(e) => set(item.id, { note: e.target.value })}
                  placeholder={item.notePlaceholder ?? 'nota (opzionale)'}
                  style={{ marginTop: 8, width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(125,180,220,0.25)', borderRadius: 5, color: '#d5e0ea', fontSize: 11, padding: '5px 8px' }}
                />
              </div>
            );
          })}
        </section>
      ))}

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 32px', background: 'rgba(8,16,26,0.96)', borderTop: '1px solid rgba(125,180,220,0.3)' }}>
        <span style={{ fontSize: 12, color: done === ITEMS.length ? '#a8e6b0' : '#f0c080' }}>
          {done}/{ITEMS.length} risposte
        </span>
        <button onClick={copy} style={{ background: '#1d4e33', color: '#a8e6b0', border: '1px solid #3a8a5c', borderRadius: 6, padding: '7px 16px', fontSize: 12, cursor: 'pointer' }}>
          {copied ? 'Copiato ✓' : 'Copia ruling JSON'}
        </button>
        <span style={{ fontSize: 10.5, color: '#7d92a6' }}>incolla il JSON in chat → applico i ruling + signoff OB-7</span>
      </div>
    </div>
  );
}
