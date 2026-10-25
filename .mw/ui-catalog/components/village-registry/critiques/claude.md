Claude ha risposto: Sto finendo i file del componente (ora il CSS), poi ti consegno la critica completa.
Cercato sul web, memoria letta e 2 altri strumenti

Cercato sul web, memoria letta e 2 altri strumenti

Sto finendo i file del componente (ora il CSS), poi ti consegno la critica completa.

File creato, file condivisi

File creato, file condivisi

Verdetto: il guscio è da AAA, l’informazione no. Materiali, doppio bordo oro e serif small-caps sono coerenti con l’HUD. Ma come strumento decisionale il pannello funziona poco: ti dice che cosa esiste, non che cosa conviene fare adesso. Con Gold 15, Wood 0 e Food “0 d left” in rosso nell’HUD, il registro non ti aiuta a uscire dalla crisi.

Cosa funziona
Tassonomia dei filtri: All, Built, Buildable e Locked sono i quattro stati giusti.
Forme condivise: cerchio, arco e scudo vengono dalle mappe/pin e tornano nelle categorie. È un buon sistema.
Coerenza visiva: il linguaggio materiale è lo stesso dell’HUD.
Critica spietata

P0, rompe l’uso

Nessuna informazione decisionale. Non c’è nessun costo, requisito, produzione o numero di lavoratori. Lo slot più prominente è occupato dal flavor (“Keeps the village’s stock under lock and key”). Il flavor va nel tooltip, e al suo posto serve l’effetto: “+120 storage”.
Lo stato è codificato tre volte e illeggibile. C’è il badge a sinistra (II, +, lucchetto), il cluster a destra (casetta, ◆, + minuscolo, lucchetto) e la riga, che è identica per tutti. La casetta ciana è su ogni riga, quindi porta zero informazione. ◆ e + a circa 8px sono indistinguibili, e la legenda è sulla mappa e non copre i glifi di destra. Built, buildable e locked sembrano la stessa riga. La regola è ridondare il colore con forma o testo: ogni distinzione di colore deve passare anche per forma, pattern, testo, dimensione o posizione. Qui non regge nemmeno il colore. 
abratabia

Contenuto probabilmente troncato. Le categorie sommano 3+5+3 = 11, mentre l’header dice “6 of 16 built”. Defense mostra 1 riga e il pannello finisce senza scrollbar né fade. O mancano categorie o c’è overflow nascosto. Va verificato, ma in entrambi i casi il giocatore non può saperlo.
Registro e mondo non dialogano. Né hover né focus accendono il pin o l’ellisse corrispondente, e un pin resta mezzo coperto dal bordo del pannello. Nel frame in contesto l’illustrazione è ridotta a una striscia di circa 90px e i pin galleggiano sul nero. Se è una “blueprint mode” intenzionale, non è dichiarata. Altrimenti è un bug di layout.

P1, degrada la qualità
5. Tipografia sotto soglia. Descrizioni e “Esc to close” sono a circa 11px, i glifi a 8–10px. Il rapporto minimo è 4.5:1 per il testo normale e 3:1 per i componenti UI. Il documento Xbox cita 28px a 1080p, ma è un riferimento da TV: per desktop punterei a 14px o più per il corpo. A 390px di larghezza questo pannello occupa l’intero viewport con testo microscopico. 
abratabia


6. Gerarchia piatta e rovesciata. Tutto ha cornice oro: pannello, chip, tre barre accordion e le righe. Quando tutto è incorniciato, niente lo è. Le barre di categoria, che sono struttura, sono più scure e leggere delle righe, che sono contenuto.
7. Filtri e accordion si contraddicono. Con “Buildable” attivo e Production chiusa, non è chiaro se vedi i risultati. I conteggi per categoria non cambiano col filtro e i chip non hanno conteggi. Il chip attivo si distingue solo per un bordo appena più luminoso.
8. Stato iniziale arbitrario. Production (3/3) è chiusa, ma non per una regola, e nulla segnala quali edifici alleviano la crisi in corso.
9. Il livello non ha un tetto. “II” non dice “di quanti”, e a 9px una “I” sembra una barretta. Quel “II” è identico al glifo di pausa dell’HUD.

P2, rifinitura
10. Sinistra troppo rumorosa. Staccato su circa 70px ci sono tre elementi in competizione: parentesi svasata, icona e badge. Le icone di Inn e Smithy a 24px diventano macchie.
11. Input e affordance. Non è chiaro che cosa fa il click su una riga e non c’è un modello di focus per gamepad. Mancano anche un ordinamento e le scorciatoie per i filtri. Questo lo deduco solo dagli screenshot statici.
12. Allineamenti. Il bordo destro del pannello sporge oltre quello dell’HUD (circa 1430 contro 1419) e il top (192) non è allineato al banner (145).

Soluzione

Principio: una riga = una decisione.


BUILT       [tile oro]    Warehouse   +120 storage            ◆◆◇   UPGRADE ●60 ▮20
BUILDABLE ▌ [tile teal]   Inn         +2 beds · 1 settler/wk        BUILD   ●40 ▮12~
LOCKED      [tile tratt.] Infirmary   Requires Market II
Stato = forma + testo. Una barra a sinistra segnala “azionabile”, il tratteggio segnala “non ancora” e il verbo BUILD/UPGRADE è esplicito. Il colore rinforza e non decide.
Costo inline. Se manca una risorsa il chip diventa rosso con sottolineatura ondulata, quindi non dipende dal solo rosso. Nei tuoi numeri “▮12” sarebbe in difetto, perché hai 0 Wood.
Livello come pip (◆◆◇), così il tetto è visibile.
Gruppo “Needs attention” in cima, alimentato da critical={["food"]} e dal campo relieves degli edifici.
Il filtro forza l’apertura delle categorie, nasconde quelle vuote e mostra i conteggi.
Le categorie finite si chiudono per regola, quando tutto è costruito e al livello massimo.
Header di categoria sopra le righe: oro, con filetto sotto. Le righe diventano scure con hairline e prendono bordo oro solo in hover o focus.
Hover e focus chiamano onHover(id) per accendere il pin.
Tastiera e gamepad: ↑↓ per scorrere, Q/E per i filtri (LB/RB), Esc per chiudere.
Overflow: una mask sfumata in basso segnala che c’è altro, senza testo.

Gli accorgimenti stanno in SettlementRegistry.tsx e settlement-registry.css. Questo è l’aggancio alla scena:


tsx
<SettlementRegistry
  buildings={registry}
  resources={{ gold: 15, food: 2, wood: 0 }}
  critical={["food"]}
  onHover={(id) => scene.highlightPin(id)}
  onSelect={(id) => { scene.panTo(id); openDetail(id); }}
  onClose={closeRegistry}
/>

Il cambio di dati fondamentale è separare effetto e flavor:


ts
{ id: "inn", name: "Inn", category: "civic", status: "buildable",
  effect: "+2 beds · 1 settler/week",
  flavor: "Warm beds and a hearth that draw in new folk.",
  cost: { gold: 40, wood: 12 } }

Metto il contrasto in CI invece di fidarmi dell’occhio, ad esempio nella tua pipeline Playwright:


ts
const lum = (hex: string) => { const [r,g,b] = hex.match(/\w\w/g)!.map(h => { const c = parseInt(h,16)/255; return c <= .03928 ? c/12.92 : ((c+.055)/1.055)**2.4; }); return .2126*r + .7152*g + .0722*b; };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
expect(ratio("#b9c8c4", "#11303a")).toBeGreaterThanOrEqual(4.5);
Limiti e prova di successo
Ho letto solo screenshot statici. Interazioni, dimensioni in px e la discrepanza 11 contro 16 sono stime o ipotesi da confermare nel DOM.
Le risorse generiche sul tema (Game Accessibility Guidelines, Xbox XAG, WCAG) confermano i criteri di accessibilità. Sulla gerarchia informativa dei pannelli di costruzione ho trovato poco di specifico, quindi lì il giudizio è mio.
Il test che farei è su un compito solo: “con queste risorse, che cosa posso costruire per risolvere la fame?”. Oggi servono più passaggi e un’inferenza. L’obiettivo è rispondere in meno di 3 secondi, senza aprire un secondo pannello.

Se vuoi, posso estrarre il sistema di token e i sette stati (default, filtrato, crisi, tutto costruito, vuoto, solo tastiera, mobile) come voce di catalogo, così lo fai passare nella critica multi-AI.


Settlementregistry
Codice
·TSX


Settlement registry
Codice
·CSS


Scarica tutto





ora