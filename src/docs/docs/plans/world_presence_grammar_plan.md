# WANDERLUST WORLD PRESENCE GRAMMAR — DOCUMENTO 0 (v0.2)

> Bibbia della lingua visiva del mondo. Sorella di [`art_direction_plan.md`](./art_direction_plan.md): quella definisce *come appare* Wanderlust, questa definisce *come il mondo comunica che qualcosa è cambiato in modo permanente*.

**Principio fondativo**

> Le meccaniche persistenti non vengono annunciate: vengono **incarnate** in un oggetto del mondo che nasce, evolve e comunica il proprio stato senza dipendere dall'HUD — e il modo in cui nasce dice, a colpo d'occhio, se è un bene o una minaccia e quanto è grande.

**Regola d'ingresso (la prima legge del sistema)**

> Nessun contenuto persistente entra nel gioco come "evento". Entra come una **presenza** con: un *verbo iniziale* (§1), delle *evoluzioni possibili* (§2), un *gesto d'uscita e una memoria* dopo la conclusione (§2.5). Se non ha tutti e tre, non è una presenza — è una quest.

Corollari operativi:
- **Il mondo porta la lettura, l'HUD porta la precisione.** Valenza / magnitudo / urgenza (il triage) vivono sempre nel mondo. I valori esatti (il timer "3:47") l'HUD può darli come *approfondimento*. Nessuna *lettura critica* dipende dall'HUD. L'hover aggiunge profondità, mai significato.
- **Non animare l'icona: anima la nascita dell'icona**, e falla vivere di stati, non di semplici pulsazioni.
- **Un asset forte va fatto recitare, non incorniciato** in un pannello/popup/card.
- Ambito: valgono per *mondi in cui si vive* (mappa persistente, dwell time lungo), NON come leggi universali di UI.

---

## 1. I QUATTRO VERBI DEL MONDO

Ogni presenza persistente è, a livello di sintassi, **uno di quattro verbi**. Il verbo È la valenza e l'origine — non un attributo da leggere, ma la categoria grammaticale stessa. Il colore ne è *conferma*, mai il messaggio.

**Perché esattamente quattro (prova di chiusura).** I quattro verbi sono la partizione completa di un'unica domanda: *da dove viene il cambiamento?* Fuori dal territorio / da un seme interno / dal passato / dalla cosa stessa. Non esiste una quinta origine possibile. Per questo la grammatica è chiusa a quattro, e per questo *distruggere / costruire / conquistare / commerciare* NON sono verbi: non sono origini di cambiamento, sono azioni del giocatore su presenze già esistenti. Stanno su un altro strato.

### 1.1 INVADERE — qualcosa di esterno reclama spazio
- **Origine:** fuori dal territorio. **Direzione:** ESTERNO → INTERNO. **Relazione:** ostile.
- **Discriminante:** l'invasione *consuma* lo spazio.
- **Firma:** movimento *verso* il giocatore; forme appuntite / verticali / aggressive; colori freddi o velenosi; deformazione o consumo del terreno.
- **Gesto chiave:** *occupa*. **Stato:** cresce (la minaccia sale verso l'assalto). **Lascia:** cicatrice.
- **Domanda del giocatore:** *"Come lo fermo?"*
- Esempi: goblin, esercito rivale, piaga, demoni, colonia mostruosa.

### 1.2 RADICARE — qualcosa diventa parte del luogo
- **Origine:** interno (un seme). **Direzione:** PICCOLO → GRANDE. **Relazione:** appartenenza.
- **Discriminante:** la crescita *appartiene* allo spazio (lo estende, non lo consuma).
- **Firma:** movimento lento; espansione verso l'esterno; colori caldi; il territorio *migliora*.
- **Gesto chiave:** *radica*. **Stato:** fiorisce (tenda→casa→strade→campi→persone). **Lascia:** sviluppo.
- **Domanda:** *"Come lo faccio crescere?"*
- Esempi: villaggio, fattoria, nuova strada, torre, santuario.

### 1.3 RISVEGLIARE — qualcosa che esisteva prima torna presente
- **Origine:** il passato. **Direzione:** NASCOSTO → RIVELATO. **Relazione:** incerta.
- **Discriminante:** non c'è agente esterno né seme; c'è *ritorno*.
- **Firma:** immobilità carica; scala monumentale; luce/colore ambiguo (né caldo né velenoso).
- **Gesto chiave:** *affiora / si rivela*. **Stato:** pulsa (dorme, osserva, attende una scelta). **Lascia:** mistero.
- **Domanda:** *"Cosa significa?"*
- Esempi: drago, rovina, reliquia, antica civiltà, portale.

### 1.4 TRASFORMARE — il luogo stesso cambia natura
- **Origine:** la cosa stessa (nessun agente esterno). **Direzione:** STESSO LUOGO → NUOVA IDENTITÀ. **Relazione:** mutazione.
- **Discriminante:** non entra niente, non cresce un seme, non torna niente — il substrato muta identità.
- **Firma:** il luogo noto reso irriconoscibile; palette che vira alla radice; nessuna silhouette "in arrivo".
- **Gesto chiave:** *muta*. **Stato:** la nuova identità si consolida. **Lascia:** un luogo diverso da prima.
- **Domanda:** *"Cosa è successo a questo posto?"*
- Esempi: foresta corrotta, montagna che si apre, lago che ghiaccia, vulcano che nasce, zona benedetta→maledetta.
- *Serve perché senza di esso tutto ciò che non "arriva da fuori" verrebbe forzato dentro INVADERE.*

---

## 2. LE TRANSIZIONI TRA VERBI (dove vive il dramma)

I verbi **non sono caselle chiuse: sono stati fra cui una presenza può migrare.** La migrazione è essa stessa un gesto di nascita — il contenuto più memorabile del gioco. Conseguenza: *la stessa icona sulla mappa non ha sempre lo stesso significato — il giocatore deve leggere la storia.*

```
              RISVEGLIARE
                   |
   RADICARE  ←→  TRASFORMARE
                   |
               INVADERE
```

Migrazioni canoniche:
- **RISVEGLIARE → RADICARE / INVADERE:** il giocatore sceglie. Il drago svegliato diventa guardiano della valle, oppure ne reclama il territorio.
- **RADICARE → TRASFORMARE → INVADERE:** la foresta magica cresce; se abusata muta in selvaggia; se corrotta diventa essa stessa nemica.
- **INVADERE → RADICARE:** il campo nemico sconfitto e assimilato diventa tuo.
- **INVADERE → (uscita) → RISVEGLIARE:** le rovine di un'invasione battuta risvegliano qualcosa anni dopo.

### Le tre regole delle migrazioni (l'adiacenza non basta)
Un grafo in cui tutto va ovunque è rumore, non lingua. Una lingua è definita anche dai suoi errori.
1. **Rarità = memorabilità.** Le migrazioni sono rare e conquistate. Se diventano comuni, torna l'inflazione semantica e il giocatore smette di leggere la mappa.
2. **Bussola di valenza.** Ogni migrazione *verso INVADERE* si legge come "sta peggiorando per me"; *verso RADICARE* come "sta migliorando". RISVEGLIARE e TRASFORMARE sono i poli ambigui che attraversano quell'asse. Il giocatore legge la *direzione* senza testo.
3. **Transizioni proibite.** Alcune non devono esistere, o non ci sono regole. Es.: RADICARE non salta direttamente a RISVEGLIARE (un villaggio vivo non "ritorna dal passato": deve prima passare per l'uscita/rovina). Le frasi malformate sono ciò che rende la grammatica una grammatica.

---

## 2.5 L'USCITA — il secondo asse del ciclo di vita

I quattro verbi dicono come una presenza **nasce**, non come **finisce**. Ma l'assenza è uno stato leggibile del mondo (villaggio in rovina, lago prosciugato, portale collassato). L'uscita NON è un quinto verbo — non è un'origine di nascita — è una **seconda fase del ciclo**: *nascita (1 dei 4 verbi) → stati/migrazioni → uscita*.

Regola: l'uscita merita lo stesso frame-chiave della nascita. Il collasso del portale, il ritiro del dio, la città che sprofonda sono momenti memorabili, non semplici residui. Distinguere sempre:
- **Il gesto d'uscita** (l'atto: crolla / si prosciuga / si ritira / si spegne).
- **Il residuo** (ciò che resta e il mondo ricorda: cicatrice / sviluppo / mistero / vuoto).

---

## 3. LE DUE MATRICI

### 3.1 Matrice di validazione (checklist prima di creare qualsiasi presenza)
| Domanda | Asse | Esempi |
|---|---|---|
| Qual è il verbo? | origine/valenza | invade / radica / risveglia / trasforma |
| Come nasce? | gesto d'ingresso | irrompe / emerge / affiora / muta |
| Qual è il gesto chiave? | atto irreversibile | occupa / radica / rivela / muta |
| Come comunica lo stato? | lettura continua | cresce / fiorisce / pulsa / si consolida |
| Può migrare di verbo? | dramma | no / sì → verso quale, con quale trigger |
| Come esce? | gesto d'uscita | crolla / si prosciuga / si ritira / si spegne |
| Cosa lascia? | memoria del mondo | cicatrice / sviluppo / mistero / vuoto |
| Quanto territorio modifica? | magnitudo | locale / regione / mondo |

> Se una presenza non risponde a questa matrice, **è solo una quest**. La magnitudo si legge da *quanta pelle della mappa reagisce*.

### 3.2 World Presence Grammar Matrix (catalogo per-presenza)
| Presenza | Verbo iniziale | Evoluzioni possibili |
|---|---|---|
| Campo goblin | INVADERE | distrutto / assimilato (→RADICARE) / contaminante (→TRASFORMARE) |
| Villaggio | RADICARE | città / rovina (→uscita) / conquistato (→INVADERE) |
| Drago | RISVEGLIARE | guardiano (→RADICARE) / nemico (→INVADERE) / alleato |
| Foresta antica | TRASFORMARE | santuario (→RADICARE) / corruzione (→INVADERE) |

---

## 4. IL PROTOCOLLO DEI 4 FRAME (il test, prima di ogni animazione)

Non si implementano particelle, camera o glow finché non esistono **4 concept statici**:

| Frame | Cosa mostra |
|---|---|
| **Frame 0** | Il mondo normale (secondo 0). Stabilisce il lessico che la presenza poi altera. |
| **Frame 2 — chiave** | Il **gesto irreversibile**: un pezzo di mondo cambia proprietario/natura. |
| **Frame 3 — persistente** | 5 minuti dopo: lo stato che il giocatore guarderà per ore. |
| **Frame 4 — finale** | Il gesto d'uscita e cosa resta (cicatrice / sviluppo / mistero / vuoto). |

### 4.1 IL DELTA TEST (il vero cancello)
Il cuore è **il delta tra Frame 0 e Frame 2**.
> Mostrando *solo* Frame 0 e Frame 2, senza il resto e senza testo: si capisce **esattamente cosa è stato tolto (o dato, o risvegliato, o mutato)**?
- **Sì:** la grammatica funziona; l'animazione è solo collegamento.
- **No:** nessun trucco lo salva. Torna al Frame 2.

### 4.2 Altri cancelli
- **40px:** rimpicciolita a un'unghia, si legge il verbo giusto?
- **No-hover / no-HUD:** senza interazione, si legge valenza + magnitudo + urgenza?
- **3 di notte:** un giocatore stanco capisce a colpo d'occhio se sta perdendo?

---

## 5. PRIMO CASO DI COLLAUDO — GOBLIN INVASION

L'invasione goblin NON è il progetto: è la **prima frase ben formata** — il primo test automatico della lingua del mondo.

- **Verbo:** INVADERE. **Evoluzioni:** distrutto / assimilato / contaminante (vedi §3.2).
- **Frame-chiave (Frame 2):** *non* l'arrivo, *non* "goblin belli sulla mappa". È il momento irreversibile: terra silenziosa → un goblin pianta qualcosa → il terreno cambia attorno al punto d'impatto → da lì quella zona non è più tua.
- **Il "Re" (silhouette dominante):** lo stendardo piantato (leggibile a 40px, generalizzabile a ogni fazione). Fuoco, tende, colonna sono servitori che convergono su di esso.
- **Antitesi (conferma cromatica):** villaggio oro/campane/fumo bianco/fuochi caldi → goblin verde-veleno/corni/fumo nero-verde/fuochi verdastri. Il **colore è il Re dell'antitesi**; suono e fumo rinforzano.
- **Beat 0 = lezione, non emozione:** il villaggio che respira *insegna* il lessico proprio perché l'invasione poi lo profana. Prima insegni, poi rompi.
- **Presagio on-DNA (Solar Triumph, NO corvi tolkieniani):** il *villaggio che reagisce* (bandiere tese dal vento, corni, luci), non la natura che piange.
- **Vocabolario vs sintassi (fazioni future):** stessa frase, parola diversa. Goblin *piantano* uno stendardo (verde); non-morti *innalzano* un obelisco (grigio-cadavere); cultisti *erigono* un idolo (cremisi); demoni *lacerano* uno squarcio (arancio infernale). Tutti: forma eretta sul tuo territorio, nata da un gesto, che cresce come timer, dal bordo verso un tuo POI.

---

## 6. GOVERNANCE (perché il linguaggio non marcisca)

Un linguaggio visivo funziona solo se il giocatore ne costruisce la **legenda in testa senza che il gioco gliela stampi mai.** Per disciplina, non per bellezza dei singoli asset.

- Questo documento È la legenda. **Ogni** presenza passa dalla Regola d'ingresso, dalla Matrice (§3.1) e dal Delta Test (§4.1) prima di entrare.
- Una presenza che non è una frase ben formata non entra: si riformula, o è una quest.
- Il colore conferma il verbo, non lo sostituisce. Se serve il colore per capire la valenza, la forma/il gesto sono deboli.

---

### Prossimo passo concreto
Produrre i **4 concept statici** dell'invasione goblin (§4) e passarli al Delta Test (§4.1). Non prima animazioni. Se il Frame 2 supera il delta, l'intero evento — trailer + gameplay + marker — è già definito.

*v0.2 — documento vivo: da editare, non da venerare. Changelog: +VERBO 4 TRASFORMARE con prova di chiusura a quattro origini; +asse d'uscita (§2.5); +3 regole delle migrazioni; +Grammar Matrix per-presenza (§3.2); +Regola d'ingresso in testa.*
