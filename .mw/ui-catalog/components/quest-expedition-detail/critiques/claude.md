# claude — quest-expedition-detail (T-001 refill, image-grounded)

Run `20261025-critique-quest-expedition-detail`, turn T-001 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0, default-iso-1), POSTED+collect SUCCESS
(~11k chars). Conversazione: https://claude.ai/chat/f601a5ea-d3bf-411e-8086-6ea497ff7de8.

Nessun binding claude preesistente: nuova conversazione creata dal refill.

---

## Risposta T-001 (verbatim)

Claude ha risposto: Voto: 5/10.
Cercato sul web, memoria letta

Cercato sul web, memoria letta

Voto: 5/10. La skin è bella, ma la funzione non regge: sembra un form compilato male dentro una cornice d’oro. Ho stimato misure e contrasti a occhio dagli screenshot, quindi verificali con strumenti veri prima di fidarti dei numeri.

Cosa dice la ricerca
Pulsante disabilitato: la letteratura UX concorda che va spiegato perché è disabilitato e come sbloccarlo. Meglio disabilitare che nascondere, ma sempre con la spiegazione. 
smart-interface-design-patterns

Accessibilità del disabled: un bottone disabled esce dal tab order, quindi per tastiera e assistive tech è come se non esistesse. La soluzione consigliata è aria-disabled, che mantiene il focus e annuncia il pulsante. 
uxdesign

uxplanet

Contrasto: gli elementi disabilitati spesso non rispettano le soglie di contrasto. Le linee guida Xbox sono più precise: anche il testo degli elementi inattivi deve restare almeno a 3:1. 
uxdesign

xbox

Dimensione del testo: per PC a 1080p le Xbox Accessibility Guidelines fissano a 18 px l’altezza minima del testo di corpo. Il programma handheld di Microsoft scende a 14 px, ma come minimo assoluto. 
xbox

xbox

Stati vuoti: un buono stato vuoto spiega perché è vuoto e dà un’indicazione su cosa fare. Gli stati “limite” (vuoto, caricamento, errore) vanno progettati come gli altri, non lasciati al caso. Per gli slot servono indizi visivi che distinguano vuoto, occupato e attivo. 
Importance Of Empty State Screens In User Experience
 +2


Il tuo componente va male su quasi tutti questi punti.

Critica
P0: rompono il flusso

1. Il CTA è invisibile e la gerarchia è invertita.

“Send expedition” è un fantasma quasi illeggibile, mentre “Back to map” è il bottone più forte del pannello. Il primario sembra secondario e viceversa.
Il motivo del blocco (“Fill the required slots for an estimate”) è sbagliato. Parla di stima, non di invio, e ripete il testo del Forecast a destra.
Non dice quali slot mancano.
Il disabled non è raggiungibile col focus, un problema serio se supporterai gamepad o Steam Deck.

2. Gli slot sono cerchi vuoti muti.

Nessun “+” né hint di drop. Non si capisce se si trascina dal roster, si clicca o si fa doppio click.
Fighter e Scout hanno la stessa icona. Due ruoli diversi, un solo glifo: è un bug di leggibilità, non una scelta di stile.
Il mistero principale resta irrisolto. “Share of incoming impacts assigned by position” è la meccanica tattica centrale, ma sta in una riga minuscola, in gergo, senza numeri. Mancano le percentuali per slot e una direzione (qual è il fronte?).
Sotto ogni slot c’è un “—” che non significa nulla. Con “STR —”, “PER —” e “BAG — 0/3” il pannello diventa una zuppa di trattini.

3. La tipografia è sotto soglia.

Le label dei ruoli sono sui 10–11 px, maiuscole, con tracking larghissimo, in grigio-teal su teal scuro. È la fascia peggiore per leggibilità.
“Expedition leader” quasi tocca i vicini. In it-IT o con la pseudo-locale collide di sicuro.

4. Si decide al buio.

Pericolo, ricompensa, durata e forecast stanno in un altro pannello, in alto a destra, lontano dal CTA in basso al centro. L’occhio fa un viaggio e il forecast comunque è vuoto.
Durata 26 giorni mentre l’HUD segnala cibo che dura 1 giorno, e il pannello non dice nulla sul costo di sostentamento. Se questa informazione esiste nel design, qui non si vede.
P1: gravi

5. Informazione triplicata e criptica. STR e PER compaiono sotto la descrizione (due icone con un divisore), nel pannello destro (Primary/Secondary) e in “COVERS STR — PER —”. Tre trattamenti visivi per la stessa cosa, e “COVERS” non spiega cosa copre cosa.

6. L’oro è inflazionato.

Titolo, anelli, cassa, “Back to map” e bordi sono tutti dorati. Quando tutto è segnale, niente lo è.
L’elemento più luminoso del pannello è l’icona cassa, non gli slot.
Il banner mangia circa un quarto dell’altezza per un’illustrazione decorativa.
Il contenuto è allineato a sinistra in un contenitore largo, con un vuoto a destra degli slot.

7. Tre uscite e controlli sopra l’arte. Minimizza, chiudi e “Back to map” fanno cose quasi uguali. Minimizza e chiudi sono sopra l’illustrazione, a contrasto variabile e con hit area piccola.

8. La borsa è illeggibile.

Tre sacchetti identici, senza indicare che sono consumabili.
Presumo che l’icona cassa sia il tasto magazzino: è un bottone icon-only travestito da icona di label, senza testo né tooltip.
P2: rifiniture
“Intel” con 4 paragrafi di lore in corsivo piccolo, accanto ai dati decisionali.
Roster tagliato a 4 righe su 6, senza indizio di scroll.
Le tacche sugli anelli sono decorazione che sembra un indicatore.
Slot circolari per l’ordine di marcia e quadrati per la borsa: va bene, ma i due linguaggi devono avere gli stessi stati.
Proposta

Layout target. Le percentuali sono d’esempio e devono arrivare dal config.


┌ GOBLIN EXTERMINATION ─────────────────────────── [×] ┐
│ [banner 96px]   ⚔ STR   ◉ PER   ☠ Pericolo ALTO      │
│ Follow their tracks to the camp… (1 riga)            │
│                                                      │
│ ORDINE DI MARCIA   FRONTE ◀━━━━━━━━━━━▶ RETROGUARDIA │
│   (+)          (+)          (+)          (+)         │
│  Leader      Fighter       Scout      Bodyguard      │
│   40%          30%          20%          10%         │
│                              ↑ quota di colpi subiti │
│ BORSA 0/3  [ ][ ][ ]            [ Apri magazzino ]   │
│ ──────────────────────────────────────────────────── │
│ Stima: ??  ·  Durata 26 g  ·  Cibo −X   (sempre qui) │
│ ⚠ Mancano: Leader, Fighter, Scout, Bodyguard         │
│ [ INVIA SPEDIZIONE — oro pieno ]        Indietro     │
└──────────────────────────────────────────────────────┘

Principi:

Un solo primario. “Indietro” diventa link testuale.
Un solo X di chiusura, fuori dal banner.
Le stime in una striscia sopra il CTA, non in un pannello a parte.
L’oro pieno solo per il CTA attivo e per lo stato “valido”. Il resto usa un oro spento.
1. Config e blocker

ts
// config/expedition.schema.ts
import { z } from 'zod';

export const marchSlotSchema = z.object({
  id: z.enum(['leader', 'fighter', 'scout', 'bodyguard']),
  glyph: z.string(),                       // un glifo diverso per ruolo
  impactShare: z.number().min(0).max(1),
  required: z.boolean().default(true),
});

export const marchConfigSchema = z
  .array(marchSlotSchema)
  .min(1)
  .refine(
    (s) => Math.abs(s.reduce((a, x) => a + x.impactShare, 0) - 1) < 1e-6,
    { message: 'impactShare deve sommare a 1' },
  );

ts
// store/expedition.selectors.ts
export type Blocker = {
  id: string;
  i18nKey: string;
  params?: Record<string, unknown>;
  focusTarget: string; // id dnd-kit dello slot da evidenziare
};

export const selectBlockers = (s: PlannerState): Blocker[] =>
  s.march.flatMap((slot, i) =>
    slot.required && !slot.heroId
      ? [{
          id: `slot:${slot.role}`,
          i18nKey: 'expedition.blocker.slotEmpty',
          params: { role: slot.role },
          focusTarget: `march-slot:${i}`,
        }]
      : [],
  );
2. Slot con stati reali

tsx
function MarchSlot({ index }: { index: number }) {
  const { t } = useTranslation();
  const cfg = useExpeditionConfig().march[index];
  const heroId = usePlanner((s) => s.march[index].heroId);
  const { setNodeRef, isOver, active } = useDroppable({ id: `march-slot:${index}` });

  const state = heroId ? 'filled' : isOver ? 'over' : active ? 'ready' : 'empty';
  const role = t(`expedition.role.${cfg.id}`);

  return (
    <button
      ref={setNodeRef}
      className="march-slot"
      data-state={state}
      aria-label={t('expedition.slot.aria', { role, share: Math.round(cfg.impactShare * 100) })}
    >
      <span className="march-slot__ring">
        {heroId ? <HeroPortrait id={heroId} /> : <RoleGlyph name={cfg.glyph} />}
        {!heroId && <span className="march-slot__plus" aria-hidden>+</span>}
      </span>
      <span className="march-slot__role">{role}</span>
      <span className="march-slot__share" title={t('expedition.impactShareHint')}>
        {Math.round(cfg.impactShare * 100)}%
      </span>
    </button>
  );
}
3. CTA onesto e raggiungibile

tsx
function SendExpeditionButton() {
  const { t } = useTranslation();
  const blockers = usePlanner(selectBlockers, shallow);
  const send = usePlanner((s) => s.sendExpedition);
  const flashSlot = usePlanner((s) => s.flashSlot);
  const blocked = blockers.length > 0;

  return (
    <div className="send">
      {blocked && (
        <ul id="send-why" className="send__why" role="status">
          {blockers.map((b) => <li key={b.id}>{t(b.i18nKey, b.params)}</li>)}
        </ul>
      )}
      <button
        className="cta cta--primary"
        aria-disabled={blocked}
        aria-describedby={blocked ? 'send-why' : undefined}
        onClick={() => (blocked ? flashSlot(blockers[0].focusTarget) : send())}
      >
        {t('expedition.send')}
      </button>
    </div>
  );
}

Con aria-disabled il bottone resta focalizzabile e cliccabile. Al click, invece di non fare niente, fa lampeggiare il primo slot mancante.

4. Token e stili

css
:root {
  --ui-scale: 1;                               /* impostazione utente 1–2 */
  --fs-body:  calc(16px * var(--ui-scale));
  --fs-label: calc(13px * var(--ui-scale));    /* mai sotto, anche in pseudo-locale */
  --gold-signal: #e8b84a;                      /* SOLO CTA, stato valido, focus */
  --gold-dim:    #8a7344;                      /* cornici e decor */
  --ink-2:       #b9c7c4;                      /* verifica ≥ 4.5:1 sul pannello */
  --ink-disabled:#7f918e;                      /* verifica ≥ 3:1 */
}

.march { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }

.march-slot { display: grid; justify-items: center; gap: 4px; min-width: 0; }
.march-slot__ring { width: 64px; height: 64px; border: 2px solid var(--gold-dim); border-radius: 50%; }
.march-slot[data-state='ready'] .march-slot__ring { border-style: dashed; border-color: var(--gold-signal); }
.march-slot[data-state='over']  .march-slot__ring { box-shadow: 0 0 0 3px var(--gold-signal); transform: scale(1.06); }
.march-slot[data-state='filled'] .march-slot__ring { border-color: var(--gold-signal); }
.march-slot__role  { font-size: var(--fs-label); letter-spacing: .04em; text-align: center; overflow-wrap: anywhere; }
.march-slot__share { font-size: var(--fs-label); color: var(--ink-2); font-variant-numeric: tabular-nums; }

.cta { min-height: 48px; padding: 0 28px; font-size: var(--fs-body); }
.cta--primary { background: var(--gold-signal); color: #1a1408; }
.cta--primary[aria-disabled='true'] {
  background: transparent; color: var(--ink-disabled);
  border: 1px dashed var(--ink-disabled); cursor: not-allowed;
}
.cta:focus-visible { outline: 3px solid var(--gold-signal); outline-offset: 3px; }
.send__why { font-size: var(--fs-label); color: var(--ink-2); margin: 0 0 8px; }

@media (prefers-reduced-motion: reduce) { .march-slot__ring { transition: none; transform: none !important; } }
Ordine di intervento
CTA e blocker: poche ore, impatto enorme.
Glifi distinti, percentuali e freccia fronte/retro: il cuore tattico.
Scala tipografica, minimo 13 px per le label e 16 px per il corpo, più verifica dei contrasti.
Striscia stima/durata/cibo sopra il CTA e rimozione del duplicato STR/PER.
Pulizia di oro, uscite e banner.

Gli stati da coprire con screenshot sono: empty, ready (drag attivo), over, filled, blocked, ready-to-send, più pseudo-locale e it-IT.






ora
