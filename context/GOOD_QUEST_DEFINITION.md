# Definizione di buona quest — artefatto finale PLAN-019 (S1–S4)

Sintesi delle regole **validate** e delle proprietà **emerse** durante gli
stadi S1–S4 del macro-plan quest. È l'ingresso di S5: la generazione si
subordina a questi pattern, non il contrario (desiderata v24, macro-plan
§S5). Ogni voce cita l'evidenza che l'ha prodotta — niente qui è auspicio,
è osservazione.

## 1. La ricompensa nomina l'obiettivo

Una buona quest paga quando **la cosa promessa è fatta**, non quando il
party ha generato abbastanza violenza generica. Il reward è legato a una
prova-obiettivo precisa e richiede il leader vivo al ritorno (D-8 rev.2).
Corollario misurato e ratificato: «Sterminio» paga solo con violenza
quasi totale — 99.3% reward inseguendo e finendo, ~6% giocando «bene ma
non da macellai». Il nome della missione e la struttura del reward sono
la stessa frase. Se la generazione crea una missione «recupera», il
reward non può stare sull'uccisione.

Evidence: `test-results/s3-tradeoff-sweep-2026-10-10.log`, gate S3 (d)
ratificato dal Director 2026-10-10 («si chiama sterminio»).

## 2. Il costo è scritto prima della resa

Il rapporto di ritorno racconta **prima** cosa la spedizione ha pagato
(caduti, feriti, consumabili spesi) **poi** cosa ha portato a casa
(reward, bottino, PE, scoperte, concessioni authored). Il costo primo è
la grammatica del rapporto: senza costo visibile la resa non ha peso.
Il wipe narra i morti e tace sulla resa — mai una sezione vuota.

Implementazione: `QUEST_EPILOGUE.sections` ordinato (config Zod),
`buildQuestEpilogue` deriva dal piano settlement reale — il report non
può divergere dal ledger.

## 3. Le conseguenze agiscono E sono narrate

Persistere un ferito non basta: il villaggio deve **vedere** cosa è
successo (journal `eventLog` con headline d'esito + una voce per destino)
e le conseguenze devono **agire** (ferito → non lavora → guarisce a
`injuredUntilTick`; morto → fuori dal roster; tutti feriti → game over).
Dato, azione, narrazione: tre canali, un ledger idempotente.

Evidence: T-1 (S4), `questSettlement.ts` — `appliedQuestEffectIds`
deduplica effetti e narrazione nella stessa scrittura d'aggregato.

## 4. La quest non si risolve nel planner

La preview è orientativa, mai la soluzione. Tra archetipi di strategia lo
spread è enorme (reward 5.5%→99.3%, morti 42%→73.4% su party identico) —
la run si gioca nelle scelte, non nell'assegnazione. E tra party
plausibili esiste un fronte di Pareto ≥2: nessun party domina su tutte
le metriche. Se una griglia party×strategia produce una cella dominante,
la quest è sbilanciata, non i numeri.

Gate S3 (a)+(b) PASS — evidence `s3-tradeoff-sweep`.

## 5. Il push-your-luck ha un muro authored

L'avarizia deve poter uccidere **deterministicamente**: «Razzia» ripetuta
all'infinito scala il danno per giro fino al wipe certo (100%, authored,
non un bug). Un push-your-luck che non può mai azzannare è una slot
machine gratis — il muro è ciò che rende «basta» una scelta.

Evidence: sweep `rapace∞` — 0% reward, 100% wipe, 27 oro incassato
e mai portato a casa.

## 6. I ruoli sono meccanica, non etichetta

Il bodyguard **intercetta**: muore al 71.8% assorbendo i colpi destinati
alla recluta (19.5%). Il leader è il porta-stendardo: il suo
`coverRiskDelta` copre gli altri finché regge — se cade, l'aura cade.
Un membro «carne da macello» identificabile nel forecast è una feature:
il planning deve sapere chi paga.

## 7. L'informazione è una risorsa authored

L'intel scoperta in-run sblocca bonus e strade (`hidden` nodes —
«Tesoro nascosto» non si vede nella strip fasi, esiste). Ciò che il
giocatore non sa **è parte del design**: la preview non rivela il percorso
vero, i nodi nascosti emergono solo giocando.

## 8. La sacca è pre-commitment, non inventario

Gli slot della sacca sono la domanda «cosa lascio a casa»: ogni item
packato costa uno slot e deve avere **ogni** canale dichiarato reale nel
motore (`isExpeditionItem` — nessuna promessa falsa). Consumabili si
armano prima del check (scelta), passivi agiscono finché sono trasportati.

## 9. Il POI ha un ciclo di vita authored

Un'offerta quest è una risorsa del mondo: **one-shot di default** — la
quest sparita non riappare (consumo persistito alla chiusura del
rapporto). Le attività ripetibili si dichiarano esplicitamente
(`repeatable`), e tornano a `available` finché la finestra authored
è aperta.

## 10. Seam authored, non sistemi inventati

Titoli, malattie, lore: lo scenario dichiara, il renderer mostra quando
arrivano (`epilogue` seam con grant `requiresFlag`/`requiresOutcome` —
dimostrato: «Sterminatori dei goblin»). Le categorie senza sistema
restano seam finché un sistema reale non le riempie. Per S5 questo è il
punto: **il contenuto generato si innesta sui canali esistenti**
(flag, epilogue grants, hidden, repeatable), non introduce canali nuovi.

## Cosa una buona quest NON è (scarti confermati)

- **Non è un testo**: è un grafo di decisioni con conseguenze meccaniche —
  la narrativa emerge dal motore, mai da copy libero (regola dominante
  della desiderata).
- **Non è equa**: il danno posizionale colpisce sempre qualcuno — la
  ferita è un pedaggio certo, non un «forse» (wound 100% su qualunque
  percorso goblin, ratificato).
- **Non perdona il panico gratis**: fuggire col tesoro lo fa cadere;
  fuggire è una scelta di resa, non un salvataggio.
- **Non si ferma alla schermata finale**: il loop vero finisce quando il
  villaggio ha sentito, pianto e registrato — epilogo → journal →
  conseguenze che agiscono.

## Uso in S5

Ogni candidato di generazione passa questo filtro:
1. la ricompensa nomina l'obiettivo (§1);
2. esiste almeno un trade-off reale party→esito (§4);
3. esiste almeno un modo authored di pagare troppo (§5);
4. le conseguenze prodotte entrano nel ledger e nel journal (§3);
5. ogni canale offerto al giocatore è reale nel motore (§8);
6. le novità narrative si innestano sui seam, non su canali inventati (§10).

Una quest che fallisce uno di questi punti non è «una quest più
semplice» — è un altro oggetto, e va chiamato con un altro nome.
