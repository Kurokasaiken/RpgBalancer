# POI Sigillo — glifi che mancano: tutto ciò che serve per scrivere i prompt (2026-10-22)

> Scopo: dare a un altro agente tutto il contesto per scrivere i prompt dei glifi dipinti dei POI **lavoro** e **attività**, e per rivedere quello delle **rovine**. Niente è stato generato o scelto qui. Fonti: registro e kit icone di PLAN-058, `poi_family_spec.md`, catture di questa sessione.

## 1. Cosa manca, esattamente

| Famiglia sul marker | Metallo (deciso 2026-10-20) | Glifi dipinti oggi | Cosa si vede sulla mappa |
|---|---|---|---|
| **Impresa** (quest) | bronzo | `poi-goblin-camp` (tenda), `poi-ruins` (rovine), più 6 offerte `offer-*` e 4 minacce `threat-*` già approvate nel registro | tenda e rovine collegate per id di quest; le altre offerte non sono ancora usate dalla mappa |
| **Lavoro** (job) | avorio | **nessuno** (registro: «lavoro non ha ancora glifi») | croce dorata di ripiego |
| **Attività** (allenamento e simili) | acciaio | **nessuno, e non esiste nemmeno la famiglia nel registro** | croce dorata di ripiego |

La croce compare perché il resolver cerca `/assets/ui/poi/icon_<type>.webp` e quei file **non esistono**. Il registro dice anche che, per le dipinte, `famiglia` vale oggi solo `impresa | minaccia`: va estesa a `lavoro` e `attivita`.

**Prima di fare prompt servono contenuti che non sono scritti da nessuna parte** (decisione di gioco, non di UI):
- quali lavori e quali attività esistono davvero (nomi, uno per glifo, come «tenda» e «rovine» per le quest);
- se «attività» vale solo allenamento o anche manutenzione e riposo (`poi_family_spec.md` elenca `job`, `training`, `maintenance`, `cooldown`; ma CTR-game-008 dice che su `/game` esiste solo la famiglia quest e i figli sono deprecati: **non c'è ancora una lista di contenuti**);
- l'idea di Pillar: `DESIGN_PILLARS.md` ha una contraddizione sui POI (riga 33 «niente POI = verbo + slot», riga 43 «POI = verbo + slot»). Il Director ha deciso glifi di **luogo**, non di verbo (D1 di PLAN-058): niente martello o spada, ma luoghi (fucina, campo di addestramento…).

## 2. Come sono fatti i glifi che esistono (da imitare)

- **Un solo oggetto**, di fronte, simmetrico, ~80% del quadrato, fermo come sagoma a 24 px e distinguibile in scala di grigi.
- **Materia di default:** bronzo consumato e opaco, lacca teal nelle cavità, un solo accento di patina nominato nella riga SUBJECT (es. «cinnabar on the cord»). Esistono materie alternative nel kit (`harvest`, `fang`, `rosegold`, `ember`, `silver`, `baked`) selezionabili con il campo `materia`.
- **Luce:** una chiave calda in alto a sinistra, ombre teal fredde in basso a destra.
- **Resa:** dipinto a impasto, bordo pulito, «mai fango».
- **Lista di divieti obbligatoria:** niente testo/lettere/rune, niente teschi/ossa, **niente cornice, anello, disco o placca dietro l'oggetto**, niente foglie/viti, niente oggetti piccoli sparsi, niente gemme o riflessi lucidi, niente terreno/ombra a terra, niente prospettiva drammatica, niente vettoriale piatto o plastica 3D, niente grigio o marrone fangoso.
- **Taglia d'uso:** `display_px: 26` (con il campo attuale il glifo è ~27 px sul marker da 55 px). Il soggetto deve reggere quella taglia: **niente raggi, crepe, anelli, rigature** (lint I8).
- **Consegna:** master 512 più 128/64/32 accanto (`-128`, `-64`, `-32`), webp in `public/assets/ui/poi/`. Tre varianti di prompt per strumento: GPT (sfondo trasparente 1024), Gemini e Grok (sfondo magenta `#FF00FF` da togliere con maschera; montaggio con `scripts/mount-icon.py`).
- **Flusso:** una riga `soggetto` in `registry.yaml` → `scripts/gen-icon-prompts.py` genera `.mw/specs/icons/<id>/prompt.md` → `lint-icon-prompts.py` → il Director genera e sceglie → stato `approved`. Il blocco di stile è bloccato da hash (`style_sha256`): non si modifica a mano.
- **Riferimento visivo:** `.mw/specs/icons/ANCORE-reference.png` (le sei ancore approvate) da allegare ai prompt; le pagine `ANCORE-prompt-pack.md` e `SET-T3.1-prompt-pack.md` mostrano prompt già riusciti.

## 3. Cosa è cambiato di recente e va tenuto in conto

- **Il campo dietro il glifo è ora sabbia/beige** (`#d3be91 → #b09866`), non più lacca scura. I glifi chiari (rovine in arenaria, croce dorata) hanno meno contrasto: sulla sabbia le rovine reggono, il beige più chiaro le fa fondere (provato a 3×).
- **Il marker è più chiaro di quello per cui sono stati dipinti i glifi.** Le ancore del 14 ottobre furono corrette perché «troppo scure su lacca quasi nera» (media 110/80/58): con il campo sabbia vale il contrario. Per i nuovi glifi conviene un valore medio-scuro con accento chiaro, non un oggetto pallido.
- **Il metallo della ghiera cambia per famiglia** (bronzo, avorio, acciaio): il glifo di lavoro sta in una ghiera chiara, quello di attività in una ghiera blu-acciaio. Il suo accento di patina non dovrebbe essere quello del metallo della ghiera (evitare «acciaio su acciaio»).
- **Il marker ha la sagoma tonda con coda** per le imprese; la tessera quadrata (lavoro) e il rombo (minaccia/evento) esistono nel codice ma oggi solo come demo. Il Director non ha ancora deciso se tenerle (domanda aperta: «a cosa servono le altre forme?»).
- **Divieti dal Director:** niente viola, niente semaforo verde/rosso, niente cerchio con simbolo da UI kit (regola 6b), niente teschi (D3).

## 4. Gabbie utili per chi scrive il prompt

- Soggetti già approvati e da non duplicare: tenda goblin, rovine, cesto di bacche, imbocco di miniera, carro coperto, torre di vedetta (offer-recon), figure (offer-people), palizzata (offer-assault), artigli, invasione, re goblin, belve.
- Un soggetto per famiglia dovrebbe evocare **il luogo del lavoro/dell'attività**, non il gesto: fucina con incudine e carbone, campo di addestramento con manichino e palo, bottega con insegna, orto, segheria… (esempi miei da validare: il canone non li elenca).
- La riga SUBJECT è **una sola frase in inglese** con la patina in coda («; patina accent: …»).

## 5. Domande da fare al Director prima di generare

1. Elenco dei lavori e delle attività reali (uno per glifo) e quanti sono.
2. Gli «oggetti» dei lavori e delle attività devono distinguersi da quelli delle imprese anche a colpo d'occhio (stessa ghiera = famiglia), oppure basta il metallo?
3. Il campo resta sabbia, o i glifi nuovi si dipingono per un campo più scuro?
4. Le forme (tessera, rombo) restano o si cancellano? (cambia dove il glifo deve stare: cerchio o quadrato smussato).
