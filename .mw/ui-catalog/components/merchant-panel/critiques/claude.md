# claude — merchant-panel (T-001 refill, image-grounded)

Run `20261025-critique-merchant-panel-r2`, turn T-001 (critique-refill dopo il reset quota delle 12:20),
prompt verbatim R-282, 2 shot allegati (default-ctx-a, default-iso-0), POSTED ~12:38-12:40 CET →
collect SUCCESS. Conversazione: https://claude.ai/chat/c72e80df-ffc7-43fe-a1da-0e8c501a95de.

Run fresh -r2: il binding del run originale era avvelenato su claude.ai/new.
T-001/T-002 mattina: Enter timeout / POSTED+collect «did not stabilize» (rate limit 5h, reset 12:20).

---

## Risposta T-001 (verbatim)

Claude ha risposto: Critica al MerchantPanel
Cercato sul web, memoria letta

Cercato sul web, memoria letta
Critica al MerchantPanel

Prima una nota sulla ricerca: ho trovato poco di specifico sui pannelli mercante nei giochi. Le fonti utili riguardano soprattutto lo stato disabled dei bottoni e qualche case study di vendor UI. Il resto della critica viene da pattern consolidati (Destiny, Diablo, Hades e simili).

Cosa funziona
La cornice oro/teal è coerente con l’HUD.
La scrittura è ottima: “Rowen restocks when the road is kind” ha più personalità di metà dei giochi AAA.
Il trattamento tratteggiato del mock è coerente in tutto il pannello.

Basta, perché il resto non regge.

Critica spietata

1. Gerarchia piatta. Nome, prezzo, descrizione e stock hanno quasi lo stesso peso. Il giocatore non sa dove guardare. In uno shop la gerarchia deve essere: cosa è, cosa fa, quanto costa, posso comprarlo. Qui sono tutte frasi.

2. Prezzo e BUY sono separati. Il prezzo è in alto a destra e il bottone in basso a destra, con tre righe di testo in mezzo. L’occhio fa un salto inutile, e i due elementi che formano la decisione non stanno vicini. Inoltre scrivi “9 gold” in testo, mentre l’HUD usa icona moneta + numero. È un’incoerenza di linguaggio visivo.

3. “preview only” ripetuto 6 volte. C’è la pill PREVIEW nell’header, poi il bottone tratteggiato, poi “preview only” accanto a ogni BUY (×4). Il rumore è altissimo e l’informazione è una sola. Il testo accanto al bottone è anche fuori dal bottone, quindi l’allineamento della colonna destra è sfilacciato.

4. La pill PREVIEW sembra un bottone. Ha lo stesso bordo oro, lo stesso peso e la stessa altezza della X. È uno stato, non un’azione, e invita al click.

5. Il dato funzionale è travestito da flavor. “One crate left” e “A pair only” sono informazioni di scarsità, ma stanno in corsivo piccolo oro su teal scuro, cioè la zona a più basso contrasto del pannello. La scarsità serve a decidere, quindi non può essere decorazione. Anche la quantità del pacchetto (“three to a crate”) è sepolta nel nome.

6. Nessun effetto meccanico. Dopo 3 righe di prosa non so cosa fa uno Smoke bomb in numeri. La prosa va bene come seconda lettura, ma la prima deve essere “Cura 40 HP” o simili. Anche in un mock, la mancanza di un effetto leggibile fa sembrare il negozio vuoto.

7. Icone da francobollo. Sono circa 14px, monocromatiche, allineate alla baseline del titolo anziché centrate. Un’icona oggetto deve fare da ancora visiva, quindi servono 48-64px, con cornice e un hint di rarità.

8. Nessun portafoglio nel pannello. L’oro sta nell’HUD in alto a destra, a circa 600px di distanza. Un case study su vendor UI (Destiny 2, Days Gone) evidenzia che la valuta è l’informazione più pertinente e va tenuta a portata d’occhio e gli oggetti raggruppati per chiarezza. Qui hai 15 gold e un oggetto da 16: un’occasione di storytelling gratis (non puoi permettertelo), buttata via. Hai anche cibo a 0 con −6/d nell’HUD, mentre le “Field rations” costano 4: il gioco ti sta chiedendo di comprarle, ma il pannello non lo dice. 
falmouth


9. Il pannello soffoca sopra il popover dell’edificio. Nello screenshot il popover “OPEN MERCHANT” è ancora aperto sotto, con il testo (“The trader’s stall on the village square.”) tagliato dal pannello. Sono due layer che competono, senza scrim, con la mappa tratteggiata rumorosa dietro. Il risultato sembra un bug.

10. Scala. Il pannello è largo circa 340px su uno schermo da 1440, con testo intorno a 12px. È troppo piccolo per uno shop su Steam (Deck compreso) e per un compratore con sguardo non da designer. Sul tuo target mobile 390×844 uno shop va in sheet/full-screen, non in un riquadro: anche la letteratura sul design degli shop in-game va in questa direzione sul mobile l’intero schermo per lo shop è quasi una necessità. 
scribd


11. Accessibilità del bottone mock. La scelta aria-disabled è giusta: l’elemento resta focalizzabile e può mostrare un tooltip, cosa impossibile con il disabled nativo. Ma il WCAG esenta i controlli inattivi dal contrasto, e questo non è una licenza: una guida di settore consiglia comunque che lo stato sia inequivocabile pur essendo esente, un segnale visivo chiaro resta buona pratica. Un disabled senza spiegazione frustra, e va accompagnato da un motivo tramite tooltip che spiega perché è disabilitato. Oggi il tuo “preview only” a fianco fa questo lavoro in modo goffo, e senza focus visibile. 
css tricks
 +2


Soluzioni

I vincoli del mock restano intatti: niente handler, niente import da economy, tutto da config statica.

Layout riga: prima/dopo

PRIMA                                         DOPO
[i] Titolo narrativo lungo        9 gold      ┌────┐ Healing draught ×3        ┌─────────┐
    descrizione 3 righe...                    │ 56 │ Heals 40 HP               │ ● 9     │
    One crate left        BUY preview only    │icon│ "Bitter green glass..."   │ [ BUY ] │
                                              └────┘ ▌Last crate               └─────────┘
1. Config: separa funzionale e narrativo

ts
// merchantConfig.ts
import { z } from 'zod';

const stockKind = z.enum(['last', 'few', 'plenty']);

export const merchantOfferSchema = z.object({
  id: z.string(),
  nameKey: z.string(),      // "Healing draught"
  packQty: z.number().int().positive().optional(), // ×3
  effectKey: z.string(),    // "Heals 40 HP" -> lettura 1
  flavorKey: z.string(),    // la prosa attuale -> lettura 2
  stock: z.object({ kind: stockKind, labelKey: z.string() }),
  price: z.number().int().nonnegative(),
  currencyKey: z.string(),
  iconKey: z.string(),
});

export const merchantConfigSchema = z.object({
  nameKey: z.string(),
  subtitleKey: z.string(),
  // Valore dimostrativo statico: serve solo a mostrare lo stato "troppo caro".
  // NON è legato all'economia reale (mantiene l'isolamento mock).
  demoWallet: z.number().int().nonnegative(),
  offers: z.array(merchantOfferSchema).min(3).max(4),
});
2. Riga componente

tsx
function MerchantRow({ offer, demoWallet }: { offer: Offer; demoWallet: number }) {
  const { t } = useTranslation();
  const hintId = useId();
  const tooShort = offer.price > demoWallet;

  return (
    <li className="mrow" data-stock={offer.stock.kind} data-short={tooShort || undefined}>
      <div className="mrow__icon" aria-hidden="true">
        <Icon name={offer.iconKey} size={36} />
      </div>

      <div className="mrow__body">
        <h3 className="mrow__name">
          {t(offer.nameKey)}
          {offer.packQty && <span className="mrow__pack">×{offer.packQty}</span>}
        </h3>
        <p className="mrow__effect">{t(offer.effectKey)}</p>
        <p className="mrow__flavor">{t(offer.flavorKey)}</p>
        <span className="mrow__stock">{t(offer.stock.labelKey)}</span>
      </div>

      <div className="mrow__buy">
        <span className="price" aria-label={t('merchant.priceA11y', { n: offer.price })}>
          <CoinIcon /> {offer.price}
        </span>
        {/* nessun handler: è un mock */}
        <button
          type="button"
          className="mbtn"
          aria-disabled="true"
          aria-describedby={hintId}
        >

          {t('merchant.buy')}
        </button>
        <span id={hintId} className="sr-only">{t('merchant.previewHint')}</span>
      </div>
    </li>
  );
}

Il tooltip visivo sul bottone resta via chiave i18n come da decisione. Qui l’aria-describedby copre screen reader e tastiera.

3. CSS

css
.mrow {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 4px 14px;
  padding: 14px 16px;
  border-top: 1px solid color-mix(in oklab, var(--gold) 20%, transparent);
}
.mrow:first-child { border-top: 0; }

.mrow__icon {
  width: 56px; height: 56px; display: grid; place-items: center;
  border: 1px solid var(--gold-dim); border-radius: 6px;
  background: radial-gradient(circle at 50% 35%, #1d3a40, #0d1c21);
  align-self: start;
}

.mrow__name   { font: 600 16px/1.2 var(--font-display); color: var(--parchment); }
.mrow__pack   { margin-left: 6px; color: var(--gold); font-size: 13px; }
.mrow__effect { font: 500 13px/1.3 var(--font-ui); color: var(--teal-bright); margin-top: 2px; }
.mrow__flavor {
  font: italic 13px/1.4 var(--font-body); color: var(--parchment-dim); margin-top: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Scarsità = dato funzionale, non decorazione */
.mrow__stock { display:inline-block; margin-top:6px; font:600 11px/1 var(--font-ui);
               letter-spacing:.06em; text-transform:uppercase; color: var(--parchment-dim); }
.mrow[data-stock="last"] { box-shadow: inset 3px 0 0 var(--ember); }
.mrow[data-stock="last"] .mrow__stock { color: var(--ember); }

/* Prezzo vicino al bottone, stesso linguaggio dell'HUD */
.mrow__buy { display:flex; flex-direction:column; align-items:flex-end; gap:8px; min-width:92px; }

.price { display:inline-flex; gap:5px; align-items:center; font:700 17px var(--font-num); color: var(--gold); }
.mrow[data-short] .price { color: var(--danger); }

/* Mock button: leggibile, focusabile, ma chiaramente non attivo */
.mbtn[aria-disabled="true"] {
  min-width: 84px; padding: 6px 14px;
  border: 1px dashed var(--gold-dim); border-radius: 4px;
  background: transparent; color: color-mix(in oklab, var(--gold) 70%, var(--bg));
  cursor: not-allowed;
}
.mbtn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

Regola pratica: tieni il testo secondario ≥ 4.5:1 sul fondo anche se WCAG ti esenta nello stato disabled.

4. Un solo segnale “preview”

tsx
<header className="mhead">
  <div>
    <h2>{t(cfg.nameKey)}</h2>
    <p className="mhead__sub">{t(cfg.subtitleKey)}</p>
  </div>
  <span className="ribbon" role="note">{t('merchant.previewRibbon')}</span>
  <CloseButton />
</header>

css
/* Stato, non azione: niente bordo oro, niente pill, forma diversa dai bottoni */
.ribbon { padding: 3px 10px; font: 700 11px var(--font-ui); letter-spacing:.12em;
          color: var(--parchment-dim); background: rgba(255,255,255,.06);
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%); }

Poi elimina i quattro “preview only” per riga.

5. Footer con portafoglio

tsx
<footer className="mfoot">
  <span className="mfoot__wallet"><CoinIcon /> {cfg.demoWallet}</span>
  <span className="mfoot__note">{t('merchant.previewNote')}</span>
</footer>

Il valore è demoWallet statico in config, non il portafoglio vero. Se vuoi quello vero (con 16 gold che diventa rosso in modo autentico) devi importare dallo store, e questo rompe il test sul grafo degli import. È una decisione da far prendere al Director, non da prendere di nascosto.

6. Layering: un pannello alla volta

Schizzo, da adattare alla tua API di useHudPanels:


ts
// registry
merchant: { id: 'merchant', exclusiveWith: ['poiPopover'], modal: false }

// all'apertura
function open(id: HudPanelId) {
  closeAll(PANELS[id].exclusiveWith);
  setOpen(id);
}

Poi aggiungi uno scrim leggero dietro il pannello:


css
.hud-scrim { position: fixed; inset: 0; background: rgb(3 10 14 / .45); backdrop-filter: blur(2px); }
.mpanel { width: clamp(420px, 32vw, 520px); }
@media (max-width: 480px) { /* con PLAN-083: sheet a tutta larghezza */
  .mpanel { inset: auto 0 0 0; width: 100%; max-height: 85dvh; border-radius: 14px 14px 0 0; }
}
Priorità
Priorità	Intervento	Costo
P0	Chiudere il popover edificio all’apertura, scrim	basso
P0	Prezzo accanto a BUY, icona moneta come HUD	basso
P0	Un solo segnale “preview”, via i 4 “preview only”	basso
P1	Effetto meccanico + stock come chip funzionale	medio (config + i18n)
P1	Icone 56px, testo ≥13px, pannello più largo	medio
P1	Footer portafoglio statico + stato “troppo caro”	basso, ma serve il sì del Director
P2	Tooltip i18n + focus ring su BUY	basso
P2	Master-detail stile Destiny (lista a sinistra, dettaglio a destra)	alto

Se devo scegliere un solo passo: la riorganizzazione della riga (punti 2, 3, 6). Da sola fa passare il pannello da “mock di prova” a “schermata di gioco”, senza toccare lo schema più di tanto.






ora
