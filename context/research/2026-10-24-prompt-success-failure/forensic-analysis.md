# Analisi forense — perché i successi riescono e i fallimenti no

Metodo: confronto testuale diretto, token-per-funzione.

## Diff strutturali osservati

| Dimensione | Successi (bivacco, agguato, intrusi, tracce) | Fallimenti (hidden-cache ×2, brief dusk) |
|---|---|---|
| **Soggetto** | UNA cosa forte: fuoco, strada vuota, massa | INVENTARIO: bundle+kettle+rope+sack — il modello disegna ogni token |
| **Verbo visivo** | azione/stato chiaro ("crackling", "sunlit road", "crouched shapes") | proprietà relazionale ("hidden", "too much care") — non si può dipingere un giudizio |
| **Luce** | sorgente dominante dipinta (falò, sole mezzogiorno) | luce diffusa senza sorgente, o "dusk" senza eroe luminoso → murk |
| **Camera** | eye-level epico, un occludente grande | "from above, no horizon" — POV raro nel prior, output piatto |
| **Colore** | legato a superficie+ruolo ("ambra sunlit road", "deep teal shadow") | pigmenti astratti in lista → ignorati |
| **Kill list funzione** | "no fog painted — runtime owns it" = spazio ai runtime FX | kill list di oggetti della scena → il modello li dipinge lo stesso o peggio |
| **Contesto fiction** | il prompt codifica la relazione (cover→strada→treeline) | il brief inventa beat senza leggere il nodo → scena sbagliata |

## La regola che emerge

**Il generatore dipinge ciò che può vedere, non ciò che intendiamo.**
Ogni istruzione deve essere traducibile in *pixel relationship*: luce che
cade SU una superficie, massa che OSTACOLA, anomalia GEOMETRICA. Qualsiasi
concetto che richiede giudizio ("hidden", "too-tidy", "subtle") va
tradotto in termini fisici (occludente + oggetto parziale + scala) o
rimosso.

## Pattern del degrado nelle iterazioni

v1 (moodboard/brief semplici) → buoni. v2+ ("migliorati") → peggio:
ogni iterazione aggiungeva *richieste di giudizio* e *enumerazioni*
invece di semplificare la scena a una sola cosa forte. La precisione
verbale ha sostituito la chiarezza visiva.
